import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export function useQuestSync() {
  const isOffline = useAppStore((state) => state.isOffline);
  const setIsOffline = useAppStore((state) => state.setIsOffline);
  const profile = useAppStore((state) => state.profile);

  // 1. ネットワーク監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期状態のセット
    setIsOffline(!navigator.onLine);
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. キューの同期処理
  const syncOfflineQueue = async () => {
    try {
      const items = await db.syncQueue.toArray();
      if (items.length === 0) return;

      console.log(`Syncing ${items.length} offline operations...`);

      for (const item of items) {
        if (item.action === 'update_quest_status') {
          const { quest_id, log_date, status } = item.payload;
          
          // Supabase に upsert
          const { error } = await supabase
            .from('quest_logs')
            .upsert({
              quest_id,
              log_date,
              status,
              completed_at: status === 'pending' ? new Date().toISOString() : null
            }, { onConflict: 'quest_id,log_date' });

          if (!error && item.id) {
            await db.syncQueue.delete(item.id);
          }
        }
        
        if (item.action === 'update_subtask_status') {
          const { sub_task_id, log_date, is_completed } = item.payload;

          const { error } = await supabase
            .from('sub_task_logs')
            .upsert({
              sub_task_id,
              log_date,
              is_completed,
              completed_at: is_completed ? new Date().toISOString() : null
            }, { onConflict: 'sub_task_id,log_date' });

          if (!error && item.id) {
            await db.syncQueue.delete(item.id);
          }
        }
      }
      console.log('Offline queue sync completed.');
    } catch (err) {
      console.error('Error syncing offline queue:', err);
    }
  };

  // 3. クエストステータスの更新ロジック (オフライン対応ラッパー)
  const updateQuestStatus = async (questId: string, status: 'todo' | 'pending', logDate: string) => {
    const key = `${questId}_${logDate}`;
    
    try {
      // ローカルキャッシュの更新
      await db.questLogsCache.put({
        quest_id_date: key,
        quest_id: questId,
        log_date: logDate,
        status,
        points_awarded: 0,
        completed_at: status === 'pending' ? new Date().toISOString() : undefined
      });

      if (navigator.onLine) {
        try {
          // オンラインなら直接 Supabase
          const { error } = await supabase
            .from('quest_logs')
            .upsert({
              quest_id: questId,
              log_date: logDate,
              status,
              completed_at: status === 'pending' ? new Date().toISOString() : null
            }, { onConflict: 'quest_id,log_date' });

          if (error) {
            console.error('Failed to sync quest status, queueing...', error);
            // 失敗した場合はキューに詰める
            await db.syncQueue.add({
              action: 'update_quest_status',
              payload: { quest_id: questId, log_date: logDate, status },
              timestamp: Date.now()
            });
          }
        } catch (supabaseError) {
          console.warn('Supabase request failed, storing in offline queue...', supabaseError);
          await db.syncQueue.add({
            action: 'update_quest_status',
            payload: { quest_id: questId, log_date: logDate, status },
            timestamp: Date.now()
          });
        }
      } else {
        // オフラインならキューに詰める
        await db.syncQueue.add({
          action: 'update_quest_status',
          payload: { quest_id: questId, log_date: logDate, status },
          timestamp: Date.now()
        });
      }
    } catch (dbError) {
      console.error('Local database update failed but continuing...', dbError);
    }
  };

  return {
    isOffline,
    updateQuestStatus,
    syncOfflineQueue
  };
}
