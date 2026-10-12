import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Profile, type RegisteredQuest, type QuestTemplate, type QuestStatus, type DiaryEntry } from '@/types';
import {
  syncSaveQuestsBulk,
  syncUpdateQuestStatus,
  syncSaveDiary,
  syncUpdateProfile,
} from '@/lib/syncService';

// 初期状態のための日付文字列取得
const getTodayStr = (offset = 0) => {
  const d = new Date();
  if (offset !== 0) {
    d.setDate(d.getDate() + offset);
  }
  return d.toISOString().split('T')[0];
};

// 初期の親設定プリセットテンプレート
const initialPresets: QuestTemplate[] = [
  { id: 'pt1', title: '朝ごはんを食べる', type: 'routine', difficulty: 1, goal: 'よくかんで食べる', promise: 'お行儀よくする' },
  { id: 'pt2', title: '学校の用意をする', type: 'mission', difficulty: 2, goal: '教科書と筆箱をいれる', promise: '前日の夜にやる' },
  { id: 'pt3', title: '公文の宿題', type: 'mission', difficulty: 3, goal: 'プリント3枚やる', promise: 'お片付けをする' },
  { id: 'pt4', title: '歯みがきをする', type: 'routine', difficulty: 1, goal: '5分間みがく', promise: 'ピカピカにする' },
  { id: 'pt5', title: '歯医者のけんしん', type: 'event', difficulty: 4, goal: '泣かずに受ける', promise: '大きな口をあける' }
];

// 初期の登録済み予定（地図に表示されるピン）
export const initialQuests: RegisteredQuest[] = [
  { id: 'q1', title: '朝ごはんを食べる', type: 'routine', date: getTodayStr(0), difficulty: 1, status: 'completed', goal: 'よくかんで食べる', promise: 'お行儀よくする' },
  { id: 'q2', title: '学校の用意をする', type: 'mission', date: getTodayStr(0), difficulty: 2, status: 'pending', goal: '教科書と筆箱をいれる', promise: '前日の夜にやる' },
  { id: 'q3', title: '公文の宿題', type: 'mission', date: getTodayStr(0), difficulty: 3, status: 'todo', goal: 'プリント3枚やる', promise: 'お片付けをする' },
  { id: 'q4', title: '歯みがきをする', type: 'routine', date: getTodayStr(0), difficulty: 1, status: 'todo', goal: '5分間みがく', promise: 'ピカピカにする' },
  { id: 'q5', title: '歯医者のけんしん', type: 'event', date: getTodayStr(0), difficulty: 4, status: 'todo', isEventJudgmentDay: true, bonusStars: 5, goal: '泣かずに受ける', promise: '大きな口をあける' },
  // 明日の予定
  { id: 'q6', title: '朝ごはんを食べる', type: 'routine', date: getTodayStr(1), difficulty: 1, status: 'todo', goal: 'よくかんで食べる' },
  { id: 'q7', title: '学校に行く', type: 'mission', date: getTodayStr(1), difficulty: 2, status: 'todo' },
  { id: 'q8', title: 'たいそうクラブ', type: 'event', date: getTodayStr(1), difficulty: 3, status: 'todo', isEventJudgmentDay: true, bonusStars: 5 },
  { id: 'q9', title: '歯みがきをする', type: 'routine', date: getTodayStr(1), difficulty: 1, status: 'todo' }
];

interface AppState {
  profile: Profile | null;
  isOffline: boolean;
  isSleepMode: boolean;
  activeQuestId: string | null;
  activeSubTaskIndex: number;
  showShineEffect: boolean;
  
  // クエスト・予定のデータ状態
  quests: RegisteredQuest[];
  presetQuests: QuestTemplate[];

  // Actions
  setProfile: (profile: Profile | null) => void;
  setIsOffline: (isOffline: boolean) => void;
  setIsSleepMode: (isSleepMode: boolean) => void;
  setActiveQuest: (questId: string | null) => void;
  setActiveSubTaskIndex: (index: number) => void;
  triggerShineEffect: () => void;
  clearShineEffect: () => void;

  // 日記（振り返り）
  diaries: DiaryEntry[];

  // 予定操作アクション
  addQuest: (quest: Omit<RegisteredQuest, 'id' | 'status'>) => void;
  addPresetQuest: (template: QuestTemplate) => void;
  updateQuestStatus: (id: string, status: QuestStatus) => void;
  generateRecurringInstances: () => void;
  updateQuest: (id: string, updated: Partial<RegisteredQuest>) => void;
  addDiary: (diary: Omit<DiaryEntry, 'id'>) => void;
  resetToDefaults: () => void;

  // クラウド同期用アクション
  syncFromRemote: (data: { quests?: RegisteredQuest[]; diaries?: DiaryEntry[]; profile?: any }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      isOffline: false,
      isSleepMode: false,
      activeQuestId: null,
      activeSubTaskIndex: 0,
      showShineEffect: false,
      quests: initialQuests,
      presetQuests: initialPresets,
      diaries: [],

      setProfile: (profile) => set({ profile }),
      setIsOffline: (isOffline) => set({ isOffline }),
      setIsSleepMode: (isSleepMode) => {
        set({ isSleepMode });
        syncUpdateProfile({ is_sleep_mode: isSleepMode });
      },
      setActiveQuest: (questId) => set({ activeQuestId: questId, activeSubTaskIndex: 0 }),
      setActiveSubTaskIndex: (index) => set({ activeSubTaskIndex: index }),
      triggerShineEffect: () => set({ showShineEffect: true }),
      clearShineEffect: () => set({ showShineEffect: false }),

      addQuest: (quest) => {
        const createdQuests: RegisteredQuest[] = [];
        set((state) => {
          const masterId = `q_master_${Date.now()}`;
          const newQuests = [...state.quests];
          
          // 1. マスターレコード（または通常レコード）の登録
          const newQuest: RegisteredQuest = {
            ...quest,
            id: quest.isRecurring ? masterId : `q_custom_${Date.now()}`,
            status: 'todo',
          };
          newQuests.push(newQuest);
          createdQuests.push(newQuest);

          // 2. 繰り返し指定がある場合、今日から60日分の該当曜日分を自動生成して追加
          if (quest.isRecurring && quest.recurrenceDays && quest.recurrenceDays.length > 0) {
            const start = new Date();
            for (let i = 0; i <= 60; i++) {
              const current = new Date(start);
              current.setDate(start.getDate() + i);
              const currentDay = current.getDay(); // 0-6

              if (quest.recurrenceDays.includes(currentDay)) {
                const dateStr = current.toISOString().split('T')[0];
                const instance: RegisteredQuest = {
                  ...quest,
                  id: `q_instance_${masterId}_${dateStr}`,
                  date: dateStr,
                  status: 'todo',
                  isRecurring: false,
                  parentRecurringId: masterId
                };
                newQuests.push(instance);
                createdQuests.push(instance);
              }
            }
          }

          return { quests: newQuests };
        });

        // Supabaseへ非同期同期
        syncSaveQuestsBulk(createdQuests);
      },

      addPresetQuest: (template) => set((state) => ({
        presetQuests: [...state.presetQuests, template]
      })),

      updateQuestStatus: (id, status) => {
        set((state) => ({
          quests: state.quests.map((q) => (q.id === id ? { ...q, status } : q))
        }));
        syncUpdateQuestStatus(id, status);
      },

      generateRecurringInstances: () => set((state) => {
        const recurringMasters = state.quests.filter((q) => q.isRecurring && q.recurrenceDays && q.recurrenceDays.length > 0);
        if (recurringMasters.length === 0) return {};

        const newQuests = [...state.quests];
        const addedQuests: RegisteredQuest[] = [];
        let hasChanges = false;
        const start = new Date();

        recurringMasters.forEach((master) => {
          for (let i = 0; i <= 60; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const currentDay = current.getDay();

            if (master.recurrenceDays?.includes(currentDay)) {
              const dateStr = current.toISOString().split('T')[0];
              const instanceId = `q_instance_${master.id}_${dateStr}`;
              
              const exists = state.quests.some((q) => q.id === instanceId || (q.parentRecurringId === master.id && q.date === dateStr));
              if (!exists) {
                const instance: RegisteredQuest = {
                  ...master,
                  id: instanceId,
                  date: dateStr,
                  status: 'todo',
                  isRecurring: false,
                  parentRecurringId: master.id
                };
                newQuests.push(instance);
                addedQuests.push(instance);
                hasChanges = true;
              }
            }
          }
        });

        if (hasChanges) {
          syncSaveQuestsBulk(addedQuests);
          return { quests: newQuests };
        }
        return {};
      }),

      updateQuest: (id, updated) => {
        const updatedQuests: RegisteredQuest[] = [];
        set((state) => {
          const target = state.quests.find((q) => q.id === id);
          if (!target) return {};

          const isMaster = target.isRecurring;
          const newQuests = state.quests.map((q) => {
            if (q.id === id) {
              const u = { ...q, ...updated };
              updatedQuests.push(u);
              return u;
            }
            if (isMaster && q.parentRecurringId === id && q.status === 'todo') {
              const u: RegisteredQuest = {
                ...q,
                title: updated.title !== undefined ? updated.title : q.title,
                type: updated.type !== undefined ? updated.type : q.type,
                time: updated.time !== undefined ? updated.time : q.time,
                location: updated.location !== undefined ? updated.location : q.location,
                people: updated.people !== undefined ? updated.people : q.people,
                goal: updated.goal !== undefined ? updated.goal : q.goal,
                promise: updated.promise !== undefined ? updated.promise : q.promise,
                reward: updated.reward !== undefined ? updated.reward : q.reward,
                difficulty: updated.difficulty !== undefined ? updated.difficulty : q.difficulty,
              };
              updatedQuests.push(u);
              return u;
            }
            return q;
          });

          return { quests: newQuests };
        });

        if (updatedQuests.length > 0) {
          syncSaveQuestsBulk(updatedQuests);
        }
      },

      addDiary: (diary) => {
        const newEntry: DiaryEntry = {
          ...diary,
          id: `d_${Date.now()}`
        };
        set((state) => ({
          diaries: [...state.diaries, newEntry]
        }));
        syncSaveDiary(newEntry);
      },

      resetToDefaults: () => set({
        quests: initialQuests,
        presetQuests: initialPresets,
        diaries: []
      }),

      syncFromRemote: ({ quests, diaries, profile }) => set((state) => {
        const updates: Partial<AppState> = {};
        if (quests && quests.length > 0) {
          updates.quests = quests;
        }
        if (diaries) {
          updates.diaries = diaries;
        }
        if (profile) {
          updates.isSleepMode = profile.is_sleep_mode ?? state.isSleepMode;
          if (profile.display_name || profile.total_stars !== undefined) {
            updates.profile = {
              id: profile.id || 'default_family',
              role: state.profile?.role || 'child',
              display_name: profile.display_name || state.profile?.display_name || '礼',
              total_stars: profile.total_stars ?? state.profile?.total_stars ?? 12,
              is_sleep_mode: profile.is_sleep_mode ?? state.isSleepMode,
              created_at: state.profile?.created_at || new Date().toISOString(),
            };
          }
        }
        return updates;
      })
    }),
    {
      name: 'adventure-app-storage',
      partialize: (state) => ({
        quests: state.quests,
        presetQuests: state.presetQuests,
        profile: state.profile,
        isSleepMode: state.isSleepMode,
        diaries: state.diaries,
      }),
    }
  )
);
