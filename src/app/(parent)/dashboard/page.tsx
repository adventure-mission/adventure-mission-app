'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import ApprovalCard from '@/components/parent/ApprovalCard';
import { type Wish, type RegisteredQuest } from '@/types';
import { Moon, Star, Bell, Shield, Gift, Sparkles, CheckCircle2, Trash2, Plus, Calendar, Clock, ArrowLeft, MapPin as MapPinIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

// 承認待ちのモックデータ
const initialApprovalItems = [
  { logId: 'l1', questTitle: '学校のじゅんびをする', childName: '礼', difficulty: 2, completedAt: new Date().toISOString(), type: 'mission' as const },
  { logId: 'l2', questTitle: '宿題をやる', childName: '礼', difficulty: 3, completedAt: new Date().toISOString(), type: 'mission' as const }
];

// ほしいもの申請中のモックデータ
const initialWishes: Wish[] = [
  { id: 'w1', child_id: 'c1', title: 'ポケモンカード 1パック', category: 'toy', required_stars: 5, status: 'pending_grant', created_at: new Date().toISOString() }
];

export default function ParentDashboard() {
  const { profile, setProfile, isSleepMode, setIsSleepMode, quests, deleteQuest } = useAppStore();
  const [approvalItems, setApprovalItems] = useState(initialApprovalItems);
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);

  // 子供のトータル星数の初期モック（Zustand未設定時のフォールバック）
  const childStars = profile?.total_stars ?? 12;

  // 1. クエスト承認ハンドラ
  const handleApproveQuest = (logId: string, difficulty: number) => {
    setApprovalItems((prev) => prev.filter((item) => item.logId !== logId));

    if (profile) {
      setProfile({
        ...profile,
        total_stars: profile.total_stars + difficulty
      });
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // 2. ほしいもの交換承認ハンドラ
  const handleApproveWish = (wishId: string, requiredStars: number) => {
    if (childStars < requiredStars) {
      alert('星が足りません！');
      return;
    }

    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, status: 'granted' as const } : w))
    );

    if (profile) {
      setProfile({
        ...profile,
        total_stars: Math.max(0, profile.total_stars - requiredStars)
      });
    }

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FFCE54', '#FF6B6B', '#4D96FF']
    });
  };

  // 3. おやすみモード（手動切り替え）
  const toggleSleepMode = () => {
    const nextState = !isSleepMode;
    setIsSleepMode(nextState);
    
    if (profile) {
      setProfile({
        ...profile,
        is_sleep_mode: nextState
      });
    }
  };

  // 4. 予定・イベントの削除ハンドラ
  const handleDeleteQuest = (quest: RegisteredQuest) => {
    const isRecurringItem = Boolean(quest.isRecurring || quest.parentRecurringId);
    let deleteEntire = false;

    if (isRecurringItem) {
      if (quest.isRecurring) {
        if (!confirm(`「${quest.title}」と、今後生成される関連予定をすべて削除しますか？`)) return;
        deleteEntire = true;
      } else {
        const choice = confirm(`「${quest.title}（${quest.date}）」を削除しますか？\n\n【OK】: この予定を削除する\n【キャンセル】: やめる`);
        if (!choice) return;
        deleteEntire = confirm('すべての曜日の繰り返し予定もまとめて削除しますか？\n\n【OK】: すべて削除\n【キャンセル】: この日の予定だけ削除');
      }
    } else {
      if (!confirm(`「${quest.title}」を削除しますか？`)) return;
    }

    deleteQuest(quest.id, deleteEntire);
  };

  // 日付順・時間順に並べ替え
  const sortedQuests = [...quests].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-16 select-none">
      {/* 親ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/route"
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            title="ぼうけん地図へもどる"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-quest-mission" />
            <h1 className="font-bold text-text-main text-lg">おやダッシュボード</h1>
          </div>
        </div>

        <button className="p-2 text-text-muted hover:text-text-main relative">
          <Bell className="w-6 h-6" />
          {(approvalItems.length > 0 || wishes.some(w => w.status === 'pending_grant')) && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </button>
      </header>

      <div className="p-6 space-y-6">
        
        {/* 子供の状況カード */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-text-muted mb-4">礼 のステータス</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-500 fill-yellow-400" />
              </div>
              <div>
                <span className="text-2xl font-black text-text-main">{childStars}</span>
                <span className="text-xs text-text-muted font-bold ml-1">あつめた星</span>
              </div>
            </div>

            {/* おやすみモードスイッチ */}
            <button
              onClick={toggleSleepMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                isSleepMode
                  ? 'bg-slate-800 text-yellow-300 border-slate-900 shadow-inner'
                  : 'bg-white text-slate-600 border-gray-200 shadow-sm'
              }`}
            >
              <Moon className={`w-4 h-4 ${isSleepMode ? 'fill-yellow-300' : ''}`} />
              <span>{isSleepMode ? 'おやすみ中' : 'おやすみにする'}</span>
            </button>
          </div>
        </section>

        {/* 登録された予定・イベントの管理（削除・追加） */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
              <Calendar className="w-5 h-5 text-quest-mission" />
              <span>予定・イベントの管理 ({sortedQuests.length}件)</span>
            </h2>
            <Link
              href="/quests/new"
              className="bg-quest-mission text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>予定を追加</span>
            </Link>
          </div>

          {sortedQuests.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-text-muted text-sm shadow-sm">
              現在、登録されている予定はありません。
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQuests.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-gray-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.type === 'routine'
                          ? 'bg-quest-routine-bg text-quest-routine'
                          : q.type === 'event'
                          ? 'bg-quest-event-bg text-yellow-700'
                          : 'bg-quest-mission-bg text-quest-mission'
                      }`}>
                        {q.type === 'routine' ? '約束事' : q.type === 'event' ? 'イベント' : 'ミッション'}
                      </span>
                      <span className="text-xs text-text-muted font-bold">
                        {q.date}
                      </span>
                      {q.isRecurring && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">
                          繰り返し
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-text-main text-sm truncate">{q.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1">
                      {q.time && (
                        <span className="flex items-center gap-1 font-medium text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {q.time}
                        </span>
                      )}
                      {q.location && (
                        <span className="flex items-center gap-1 text-gray-500 truncate max-w-[120px]">
                          <MapPinIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {q.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDeleteQuest(q)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 flex-shrink-0"
                    title="この予定を削除"
                  >
                    <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 承認待ちの冒険（ミッション・約束事） */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-base font-bold text-text-main">
              しょうにん待ちのぼうけん ({approvalItems.length})
            </h2>
          </div>

          {approvalItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-text-muted text-sm shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              すべて承認済みです！今日もがんばりました✨
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {approvalItems.map((item) => (
                <ApprovalCard
                  key={item.logId}
                  item={item}
                  onApprove={handleApproveQuest}
                />
              ))}
            </div>
          )}
        </section>

        {/* ほしいもの交換申請 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-main flex items-center gap-1.5">
            <Gift className="w-5 h-5 text-red-400" />
            ほしいもの交換申請 ({wishes.filter((w) => w.status === 'pending_grant').length})
          </h2>

          {wishes.filter((w) => w.status === 'pending_grant').length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-text-muted text-sm shadow-sm">
              現在、交換申請はありません。
            </div>
          ) : (
            <div className="space-y-4">
              {wishes
                .filter((w) => w.status === 'pending_grant')
                .map((wish) => (
                  <div
                    key={wish.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-text-main">{wish.title}</h4>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        必要:
                        <span className="flex items-center font-bold text-yellow-600">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 mr-0.5" />
                          {wish.required_stars}個
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleApproveWish(wish.id, wish.required_stars)}
                      disabled={childStars < wish.required_stars}
                      className="bg-quest-routine disabled:bg-gray-200 text-white disabled:text-gray-400 font-bold px-4 py-2.5 rounded-full text-xs shadow-sm hover:bg-green-500 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>交換を承認する</span>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
