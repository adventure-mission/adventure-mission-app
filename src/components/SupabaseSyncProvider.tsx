'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore, initialQuests } from '@/store/useAppStore';
import { fetchAllSharedData, syncSaveQuestsBulk, rowToQuest, rowToDiary } from '@/lib/syncService';

export default function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const syncFromRemote = useAppStore((state) => state.syncFromRemote);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // 1. 初回データ取得
    const initSync = async () => {
      try {
        const data = await fetchAllSharedData();
        if (data) {
          if (data.quests.length === 0) {
            // クラウドにまだデータがない初回は、ローカルの初期予定をクラウドへ投入
            await syncSaveQuestsBulk(initialQuests);
          } else {
            syncFromRemote({
              quests: data.quests,
              diaries: data.diaries,
              profile: data.profile,
            });
          }
        }
      } catch (err) {
        console.error('Supabase initial sync error:', err);
      }
    };

    initSync();

    // 2. リアルタイムリスナーの登録（親のスマホ ⇔ 子のスマホ間で即時同期）
    const channel = supabase
      .channel('family_shared_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_quests' },
        async () => {
          try {
            const { data } = await supabase.from('shared_quests').select('*');
            if (data) {
              syncFromRemote({ quests: data.map(rowToQuest) });
            }
          } catch (e) {
            console.error('Realtime quests fetch error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_diaries' },
        async () => {
          try {
            const { data } = await supabase
              .from('shared_diaries')
              .select('*')
              .order('created_at', { ascending: false });
            if (data) {
              syncFromRemote({ diaries: data.map(rowToDiary) });
            }
          } catch (e) {
            console.error('Realtime diaries fetch error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_profile' },
        (payload) => {
          if (payload.new) {
            syncFromRemote({ profile: payload.new });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncFromRemote]);

  return <>{children}</>;
}
