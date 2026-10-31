export type UserRole = 'parent' | 'child';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  total_stars: number;
  parent_id?: string;
  is_sleep_mode: boolean;
  created_at: string;
}

export type QuestType = 'mission' | 'routine' | 'event';
export type RecurrenceType = 'daily' | 'weekly' | 'once';

export interface Quest {
  id: string;
  created_by: string;
  child_id: string;
  type: QuestType;
  title: string;
  difficulty: number; // 1 to 4
  recurrence: RecurrenceType;
  recurrence_days?: number[]; // [0..6]
  is_active: boolean;
  created_at: string;
}

export interface SubTask {
  id: string;
  quest_id: string;
  title: string;
  sort_order: number;
}

export type QuestStatus = 'todo' | 'pending' | 'completed' | 'skipped';

export interface QuestLog {
  id: string;
  quest_id: string;
  log_date: string; // YYYY-MM-DD
  status: QuestStatus;
  points_awarded: number;
  completed_at?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface SubTaskLog {
  id: string;
  sub_task_id: string;
  log_date: string; // YYYY-MM-DD
  is_completed: boolean;
  completed_at?: string;
}

export interface EventMetadata {
  id: string;
  quest_id: string;
  judgment_date: string; // YYYY-MM-DD
  bonus_stars: number;
  linked_quest_ids: string[];
}

export type WishCategory = 'toy' | 'food' | 'place' | 'experience';
export type WishStatus = 'pending_review' | 'saving' | 'ready_to_grant' | 'granted';

export interface Wish {
  id: string;
  child_id: string;
  title: string;
  category: WishCategory;
  required_stars: number;
  allocated_stars: number;
  image_url?: string;
  memo?: string;
  estimated_price?: number;
  status: WishStatus;
  created_at: string;
  granted_at?: string;
}

export interface DiaryLog {
  id: string;
  child_id: string;
  log_date: string;
  content: string;
  image_url?: string;
  emotion: 'happy' | 'normal' | 'tired';
  created_at: string;
}

// 冒険地図表示用の統合されたピン情報
export interface MapPin {
  questId: string;
  title: string;
  type: QuestType;
  status: QuestStatus;
  difficulty: number;
  time?: string;  // 時間帯 (任意)
  logId?: string; // ログが存在する場合
  isEventJudgmentDay?: boolean; // イベント判定日の特別フラグ
  judgmentDate?: string;
  bonusStars?: number;
  stamp?: string;
}

// 実際にカレンダー・地図に登録された予定の情報
export interface RegisteredQuest {
  id: string;
  title: string;          // 何をする (必須)
  type: QuestType;        // カテゴリ
  date: string;           // 日付 (必須, YYYY-MM-DD)
  time?: string;          // 時間帯 (任意)
  location?: string;      // どこで (任意)
  people?: string;        // だれと (任意)
  goal?: string;          // 目標 (任意)
  promise?: string;       // 約束 (任意)
  reward?: string;        // ご褒美 (任意)
  difficulty: number;     // 難易度 (星数)
  status: QuestStatus;    // todo | pending | completed
  isEventJudgmentDay?: boolean;
  bonusStars?: number;
  isRecurring?: boolean;       // 繰り返しフラグ
  recurrenceDays?: number[];   // 繰り返し曜日 (0=日, 1=月, ..., 6=土)
  parentRecurringId?: string;  // 生成元の繰り返し予定ID
  stamp?: string;              // 親からの承認スタンプ (例: 💮 たいへんよくできました)
  stampViewed?: boolean;       // 子どもがスタンプ確認モーダルを見たかどうか
}

// 親があらかじめ設定しておく予定のテンプレート
export interface QuestTemplate {
  id: string;
  title: string;
  type: QuestType;
  difficulty: number;
  goal?: string;
  promise?: string;
  reward?: string;
}

// できたこと日記（振り返り）のエントリ
export interface DiaryEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  content: string;    // 日記本文
  emotion: 'happy' | 'good' | 'sad' | 'angry' | 'tired'; // 😆🙂😢😡🥱
}
