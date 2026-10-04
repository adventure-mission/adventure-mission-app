import Dexie, { type Table } from 'dexie';

export interface LocalQuestLog {
  quest_id_date?: string; // key: quest_id + "_" + log_date
  quest_id: string;
  log_date: string;
  status: 'todo' | 'pending' | 'completed';
  points_awarded: number;
  completed_at?: string;
}

export interface LocalSubTaskLog {
  sub_task_id_date?: string; // key: sub_task_id + "_" + log_date
  sub_task_id: string;
  log_date: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'update_quest_status' | 'update_subtask_status' | 'add_wish' | 'add_quest';
  payload: any;
  timestamp: number;
}

export class AdventureAppDB extends Dexie {
  questLogsCache!: Table<LocalQuestLog, string>; // key: quest_id + "_" + log_date
  subTaskLogsCache!: Table<LocalSubTaskLog, string>; // key: sub_task_id + "_" + log_date
  syncQueue!: Table<SyncQueueItem, number>; // autoIncrement key

  constructor() {
    super('AdventureAppDB');
    this.version(1).stores({
      questLogsCache: 'quest_id_date, quest_id, log_date, status',
      subTaskLogsCache: 'sub_task_id_date, sub_task_id, log_date, is_completed',
      syncQueue: '++id, action, timestamp'
    });
  }
}

export const db = new AdventureAppDB();
