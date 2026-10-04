'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import ApprovalCard from '@/components/parent/ApprovalCard';
import { type Wish } from '@/types';
import { Moon, Star, Bell, Shield, Gift, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const { profile, setProfile, isSleepMode, setIsSleepMode } = useAppStore();
  const [approvalItems, setApprovalItems] = useState(initialApprovalItems);
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);

  // 子供のトータル星数の初期モック（Zustand未設定時のフォールバック）
  const childStars = profile?.total_stars ?? 12;

  // 1. クエスト承認ハンドラ
  const handleApproveQuest = (logId: string, difficulty: number) => {
    // 承認待ちリストから除外
    setApprovalItems((prev) => prev.filter((item) => item.logId !== logId));

    // 星の加算
    if (profile) {
      setProfile({
        ...profile,
        total_stars: profile.total_stars + difficulty
      });
    }

    // 承認時のお祝い演出
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

    // ほしいものリストの更新
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, status: 'granted' as const } : w))
    );

    // 星の消費
    if (profile) {
      setProfile({
        ...profile,
        total_stars: Math.max(0, profile.total_stars - requiredStars)
      });
    }

    // お祝い演出
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
    
    // プロフィール状態も追従（モック）
    if (profile) {
      setProfile({
        ...profile,
        is_sleep_mode: nextState
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-12 select-none">
      {/* 親ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-quest-mission" />
          <h1 className="font-bold text-text-main text-lg">おやダッシュボード</h1>
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
