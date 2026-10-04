-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'child')),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    total_stars INTEGER DEFAULT 0 NOT NULL,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_sleep_mode BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. QUESTS TABLE (Missions, Routines, Events)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mission', 'routine', 'event')),
    title TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1 NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    recurrence VARCHAR(20) DEFAULT 'once' NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'once')),
    recurrence_days INTEGER[] DEFAULT '{}'::INTEGER[], -- 0=Sun, 6=Sat
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 3. SUB_TASKS TABLE (Middle path steps)
CREATE TABLE IF NOT EXISTS public.sub_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on sub_tasks
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- 4. QUEST_LOGS TABLE (Daily tracking)
CREATE TABLE IF NOT EXISTS public.quest_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'todo' NOT NULL CHECK (status IN ('todo', 'pending', 'completed')),
    points_awarded INTEGER DEFAULT 0 NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (quest_id, log_date)
);

-- Enable RLS on quest_logs
ALTER TABLE public.quest_logs ENABLE ROW LEVEL SECURITY;

-- 5. SUB_TASK_LOGS TABLE (Daily sub-task tracking)
CREATE TABLE IF NOT EXISTS public.sub_task_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sub_task_id UUID REFERENCES public.sub_tasks(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (sub_task_id, log_date)
);

-- Enable RLS on sub_task_logs
ALTER TABLE public.sub_task_logs ENABLE ROW LEVEL SECURITY;

-- 6. EVENT_METADATA TABLE (Extra settings for events)
CREATE TABLE IF NOT EXISTS public.event_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE UNIQUE NOT NULL,
    judgment_date DATE NOT NULL,
    bonus_stars INTEGER DEFAULT 0 NOT NULL,
    linked_quest_ids UUID[] DEFAULT '{}'::UUID[]
);

-- Enable RLS on event_metadata
ALTER TABLE public.event_metadata ENABLE ROW LEVEL SECURITY;

-- 7. WISHES TABLE (Wishlist)
CREATE TABLE IF NOT EXISTS public.wishes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('toy', 'food', 'place', 'experience')),
    required_stars INTEGER NOT NULL CHECK (required_stars > 0),
    image_url TEXT,
    linked_quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'wishlist' NOT NULL CHECK (status IN ('wishlist', 'pending_grant', 'granted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on wishes
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- 8. DIARY_LOGS TABLE (Diary for self-esteem)
CREATE TABLE IF NOT EXISTS public.diary_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    emotion VARCHAR(20) DEFAULT 'normal' NOT NULL CHECK (emotion IN ('happy', 'normal', 'tired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (child_id, log_date)
);

-- Enable RLS on diary_logs
ALTER TABLE public.diary_logs ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles Policies
CREATE POLICY "Users can read own profile and related child/parent profile"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id 
    OR auth.uid() = parent_id 
    OR id = (SELECT parent_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can update child profile (e.g. sleep mode or stars)"
ON public.profiles FOR UPDATE
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Quests Policies
CREATE POLICY "Users can select quests linked to them"
ON public.quests FOR SELECT
USING (auth.uid() = created_by OR auth.uid() = child_id);

CREATE POLICY "Parents can insert/update/delete quests"
ON public.quests FOR ALL
USING (auth.uid() = created_by);

-- Sub Tasks Policies
CREATE POLICY "Users can read sub_tasks"
ON public.sub_tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.quests 
        WHERE quests.id = sub_tasks.quest_id 
        AND (quests.created_by = auth.uid() OR quests.child_id = auth.uid())
    )
);

CREATE POLICY "Parents can manage sub_tasks"
ON public.sub_tasks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.quests 
        WHERE quests.id = sub_tasks.quest_id 
        AND quests.created_by = auth.uid()
    )
);

-- Quest Logs Policies
CREATE POLICY "Users can read quest_logs"
ON public.quest_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.quests 
        WHERE quests.id = quest_logs.quest_id 
        AND (quests.created_by = auth.uid() OR quests.child_id = auth.uid())
    )
);

CREATE POLICY "Children can insert/update status to pending"
ON public.quest_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.quests 
        WHERE quests.id = quest_logs.quest_id 
        AND quests.child_id = auth.uid()
    )
)
WITH CHECK (
    status = 'pending' OR status = 'todo'
);

CREATE POLICY "Parents have full access to quest_logs"
ON public.quest_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.quests 
        WHERE quests.id = quest_logs.quest_id 
        AND quests.created_by = auth.uid()
    )
);

-- Sub Task Logs Policies
CREATE POLICY "Users can read sub_task_logs"
ON public.sub_task_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.sub_tasks
        JOIN public.quests ON quests.id = sub_tasks.quest_id
        WHERE sub_tasks.id = sub_task_logs.sub_task_id
        AND (quests.created_by = auth.uid() OR quests.child_id = auth.uid())
    )
);

-- Children and parents can manage sub_task_logs
CREATE POLICY "Users can manage sub_task_logs"
ON public.sub_task_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.sub_tasks
        JOIN public.quests ON quests.id = sub_tasks.quest_id
        WHERE sub_tasks.id = sub_task_logs.sub_task_id
        AND (quests.created_by = auth.uid() OR quests.child_id = auth.uid())
    )
);

-- Wishes Policies
CREATE POLICY "Users can select wishes"
ON public.wishes FOR SELECT
USING (
    auth.uid() = child_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = wishes.child_id 
        AND profiles.parent_id = auth.uid()
    )
);

CREATE POLICY "Children can request wishes"
ON public.wishes FOR ALL
USING (auth.uid() = child_id)
WITH CHECK (auth.uid() = child_id AND status IN ('wishlist', 'pending_grant'));

CREATE POLICY "Parents can manage wishes"
ON public.wishes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = wishes.child_id 
        AND profiles.parent_id = auth.uid()
    )
);

-- Diary Logs Policies
CREATE POLICY "Users can select diary_logs"
ON public.diary_logs FOR SELECT
USING (
    auth.uid() = child_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = diary_logs.child_id 
        AND profiles.parent_id = auth.uid()
    )
);

CREATE POLICY "Children can manage own diary"
ON public.diary_logs FOR ALL
USING (auth.uid() = child_id)
WITH CHECK (auth.uid() = child_id);


-- =========================================================================
-- STORED PROCEDURES / RPC FUNCTIONS
-- =========================================================================

-- 1. Quest Approval (RPC)
CREATE OR REPLACE FUNCTION approve_quest_log(
  p_log_id UUID,
  p_approver_id UUID,
  p_stars_to_add INT
) RETURNS VOID AS $$
DECLARE
  v_child_id UUID;
BEGIN
  -- Update log status to completed
  UPDATE public.quest_logs
  SET status = 'completed',
      approved_at = NOW(),
      approved_by = p_approver_id,
      points_awarded = p_stars_to_add
  WHERE id = p_log_id
  RETURNING (SELECT child_id FROM public.quests WHERE id = quest_logs.quest_id) INTO v_child_id;

  -- Add stars to child's profile
  UPDATE public.profiles
  SET total_stars = total_stars + p_stars_to_add
  WHERE id = v_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant Wish (RPC)
CREATE OR REPLACE FUNCTION grant_wish(
  p_wish_id UUID,
  p_approver_id UUID
) RETURNS VOID AS $$
DECLARE
  v_child_id UUID;
  v_required_stars INT;
  v_current_stars INT;
BEGIN
  -- Fetch wish detail
  SELECT child_id, required_stars INTO v_child_id, v_required_stars
  FROM public.wishes
  WHERE id = p_wish_id AND status = 'pending_grant';

  IF NOT FOUND THEN
    RAISE EXCEPTION '対象の交換申請が見つからないか、既に処理されています。';
  END IF;

  -- Check approver relationship
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_child_id AND parent_id = p_approver_id
  ) THEN
    RAISE EXCEPTION '権限がありません。親ユーザーのみが承認できます。';
  END IF;

  -- Get current stars
  SELECT total_stars INTO v_current_stars
  FROM public.profiles
  WHERE id = v_child_id;

  -- Verify balance
  IF v_current_stars < v_required_stars THEN
    RAISE EXCEPTION '星が足りません（必要: %, 保有: %）', v_required_stars, v_current_stars;
  END IF;

  -- Update wish status
  UPDATE public.wishes
  SET status = 'granted'
  WHERE id = p_wish_id;

  -- Deduct stars
  UPDATE public.profiles
  SET total_stars = total_stars - v_required_stars
  WHERE id = v_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
