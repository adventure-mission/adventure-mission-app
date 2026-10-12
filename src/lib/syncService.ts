import { supabase } from './supabase';
import { RegisteredQuest, DiaryEntry } from '@/types';

export const questToRow = (q: RegisteredQuest) => ({
  id: q.id,
  title: q.title,
  type: q.type,
  date: q.date,
  time: q.time ?? null,
  location: q.location ?? null,
  people: q.people ?? null,
  goal: q.goal ?? null,
  promise: q.promise ?? null,
  reward: q.reward ?? null,
  difficulty: q.difficulty ?? 1,
  status: q.status ?? 'todo',
  is_recurring: q.isRecurring ?? false,
  recurrence_days: q.recurrenceDays ?? [],
  parent_recurring_id: q.parentRecurringId ?? null,
  is_event_judgment_day: q.isEventJudgmentDay ?? false,
  bonus_stars: q.bonusStars ?? 0,
});

export const rowToQuest = (row: any): RegisteredQuest => ({
  id: row.id,
  title: row.title,
  type: row.type,
  date: row.date,
  time: row.time ?? undefined,
  location: row.location ?? undefined,
  people: row.people ?? undefined,
  goal: row.goal ?? undefined,
  promise: row.promise ?? undefined,
  reward: row.reward ?? undefined,
  difficulty: Number(row.difficulty) || 1,
  status: row.status,
  isRecurring: Boolean(row.is_recurring),
  recurrenceDays: row.recurrence_days || [],
  parentRecurringId: row.parent_recurring_id ?? undefined,
  isEventJudgmentDay: Boolean(row.is_event_judgment_day),
  bonusStars: Number(row.bonus_stars) || 0,
});

export const diaryToRow = (d: DiaryEntry) => ({
  id: d.id,
  date: d.date,
  content: d.content,
  emotion: d.emotion,
});

export const rowToDiary = (row: any): DiaryEntry => ({
  id: row.id,
  date: row.date,
  content: row.content,
  emotion: row.emotion,
});

// クエストをSupabaseへ保存 / 更新
export async function syncSaveQuest(quest: RegisteredQuest) {
  try {
    const row = questToRow(quest);
    const { error } = await supabase
      .from('shared_quests')
      .upsert(row, { onConflict: 'id' });
    if (error) console.error('Error syncing quest to Supabase:', error);
  } catch (err) {
    console.error('Failed to sync save quest:', err);
  }
}

// 複数クエストの一括保存
export async function syncSaveQuestsBulk(quests: RegisteredQuest[]) {
  try {
    if (quests.length === 0) return;
    const rows = quests.map(questToRow);
    const { error } = await supabase
      .from('shared_quests')
      .upsert(rows, { onConflict: 'id' });
    if (error) console.error('Error bulk syncing quests to Supabase:', error);
  } catch (err) {
    console.error('Failed to bulk sync save quests:', err);
  }
}

// クエストのステータス更新
export async function syncUpdateQuestStatus(id: string, status: string) {
  try {
    const { error } = await supabase
      .from('shared_quests')
      .update({ status })
      .eq('id', id);
    if (error) console.error('Error updating quest status in Supabase:', error);
  } catch (err) {
    console.error('Failed to sync update quest status:', err);
  }
}

// 日記の保存
export async function syncSaveDiary(diary: DiaryEntry) {
  try {
    const row = diaryToRow(diary);
    const { error } = await supabase
      .from('shared_diaries')
      .upsert(row, { onConflict: 'id' });
    if (error) console.error('Error syncing diary to Supabase:', error);
  } catch (err) {
    console.error('Failed to sync diary:', err);
  }
}

// プロフィールの更新
export async function syncUpdateProfile(updates: { total_stars?: number; is_sleep_mode?: boolean }) {
  try {
    const { error } = await supabase
      .from('shared_profile')
      .update(updates)
      .eq('id', 'default_family');
    if (error) console.error('Error updating profile in Supabase:', error);
  } catch (err) {
    console.error('Failed to sync profile update:', err);
  }
}

// 全データの取得
export async function fetchAllSharedData() {
  try {
    const [questsRes, diariesRes, profileRes] = await Promise.all([
      supabase.from('shared_quests').select('*'),
      supabase.from('shared_diaries').select('*').order('created_at', { ascending: false }),
      supabase.from('shared_profile').select('*').eq('id', 'default_family').single(),
    ]);

    const quests = questsRes.data ? questsRes.data.map(rowToQuest) : [];
    const diaries = diariesRes.data ? diariesRes.data.map(rowToDiary) : [];
    const profile = profileRes.data || null;

    return { quests, diaries, profile };
  } catch (err) {
    console.error('Failed to fetch shared data from Supabase:', err);
    return null;
  }
}
