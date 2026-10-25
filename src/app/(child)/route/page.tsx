'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useQuestSync } from '@/hooks/useQuestSync';
import QuestList from '@/components/child/QuestList';
import { type MapPin } from '@/types';
import { Moon, Star, Plus, Wifi, WifiOff, Settings, TrendingUp, BookOpen, Shield, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import CampView from '../camp/page'; // おやすみピン画面
import { calculateStreak } from '@/lib/streak';
import StreakBadge from '@/components/child/StreakBadge';
import AllClearModal from '@/components/child/AllClearModal';

export default function RoutePage() {
  const router = useRouter();
  const { isOffline, updateQuestStatus: syncUpdateQuestStatus } = useQuestSync();
  const { profile, isSleepMode, setIsSleepMode, quests, generateRecurringInstances, updateQuestStatus: updateLocalQuestStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [questsList, setQuestsList] = useState<MapPin[]>([]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [streakToast, setStreakToast] = useState<{ show: boolean; streak: number } | null>(null);
  const [showAllClearModal, setShowAllClearModal] = useState(false);

  // 連続達成ストリークの計算
  const streakInfo = calculateStreak(quests);

  // 承認待ち（確認中）の件数
  const pendingCount = quests.filter((q) => q.status === 'pending').length;

  // マウントチェック (Next.js Hydrationエラー対策)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    generateRecurringInstances();
  }, [generateRecurringInstances]);

  // 選択中のタブに応じた日付（年月日＋曜日）の取得
  const getFormattedDate = (tab: 'today' | 'tomorrow') => {
    const d = new Date();
    if (tab === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const day = dayNames[d.getDay()];
    return `${year}年${month}月${date}日 (${day})`;
  };

  // 選択中の日付の予定をZustandから取得してマッピング
  useEffect(() => {
    if (!mounted) return;

    const getTargetDateStr = (tab: 'today' | 'tomorrow') => {
      const d = new Date();
      if (tab === 'tomorrow') {
        d.setDate(d.getDate() + 1);
      }
      return d.toISOString().split('T')[0];
    };

    const targetDate = getTargetDateStr(activeTab);

    // Zustandのquestsからこの日付に一致する予定を抽出
    const filtered = quests
      .filter((q) => q.date === targetDate && !q.isRecurring)
      .map((q) => ({
        questId: q.id,
        title: q.title,
        type: q.type,
        status: q.status,
        difficulty: q.difficulty,
        isEventJudgmentDay: q.isEventJudgmentDay,
        bonusStars: q.bonusStars,
        time: q.time
      }));

    // 時間が設定されている予定を優先し、早い時間順にソート（設定なし・「いつでも」は後ろへ）
    const parseStartTime = (timeStr?: string): number | null => {
      if (!timeStr || timeStr === 'いつでも') return null;
      const match = timeStr.match(/(\d+)(?:時|:)?(\d+)?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : (timeStr.includes('30分') ? 30 : 0);
        return hours * 60 + minutes;
      }
      return 9999;
    };

    filtered.sort((a, b) => {
      const timeA = parseStartTime(a.time);
      const timeB = parseStartTime(b.time);

      if (timeA !== null && timeB !== null) {
        return timeA - timeB;
      }
      if (timeA !== null && timeB === null) return -1;
      if (timeA === null && timeB !== null) return 1;
      return 0;
    });

    setQuestsList(filtered);
  }, [activeTab, quests, mounted]);

  // 今日獲得できる最大星数と、これまでに獲得した星数を計算
  const getTodayStarsProgress = () => {
    let earned = 0;
    let total = 0;
    questsList.forEach((q) => {
      const baseStars = q.difficulty;
      const bonus = q.isEventJudgmentDay ? (q.bonusStars ?? 5) : 0;
      const questTotal = baseStars + bonus;
      total += questTotal;

      if (q.status === 'completed') {
        earned += questTotal;
      }
    });
    return { earned, total };
  };

  const { earned: todayEarned, total: todayTotal } = getTodayStarsProgress();

  // 親の手動おやすみモード設定の監視のみ（時間制限による自動制限は撤廃）
  useEffect(() => {
    if (profile && profile.is_sleep_mode) {
      setIsSleepMode(true);
    } else {
      setIsSleepMode(false);
    }
  }, [profile?.is_sleep_mode, setIsSleepMode]);

  const handlePinSelect = (questId: string) => {
    // クエスト詳細画面へ遷移
    router.push(`/quest/${questId}`);
  };

  // 一覧から「できた！」ワンタップで即時報告
  const handleComplete = async (questId: string) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 心地よいバイブレーション（対応端末のみ）
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 50]);
      }

      // 今日残っている未完了（todo）予定の数を確認（今回の完了対象を除く）
      const remainingTodoToday = quests.filter(
        (q) => q.date === todayStr && !q.isRecurring && q.id !== questId && q.status === 'todo'
      ).length;

      const isFinishingToday = remainingTodoToday === 0;

      // 演出: 今日最後の予定なら豪華な紙吹雪＆ストリークトースト ＆ 全クリモーダル表示
      if (isFinishingToday) {
        const nextStreak = streakInfo.isTodayCompleted ? streakInfo.currentStreak : streakInfo.currentStreak + 1;
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FF6B6B', '#FFA500', '#FFD700', '#48CFAD', '#5D9CEC']
        });
        setStreakToast({ show: true, streak: nextStreak });
        setTimeout(() => setStreakToast(null), 4000);

        // 余韻を残して全クリ達成モーダルを大きくポップアップ表示
        setTimeout(() => {
          setShowAllClearModal(true);
        }, 500);
      } else {
        // 通常の紙吹雪演出
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFCE54', '#48CFAD', '#5D9CEC']
        });
      }

      // ローカル＆クラウド更新（即座に確認中へ）
      updateLocalQuestStatus(questId, 'pending');
      await syncUpdateQuestStatus(questId, 'pending', todayStr);
    } catch (err) {
      console.error('完了報告エラー:', err);
    }
  };

  // おやすみモード（キャンプ画面）の表示
  if (isSleepMode) {
    return <CampView />;
  }

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background-light relative">
      {/* 上部ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          {/* プロフィールアイコンの代わり */}
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-500">
            {profile?.display_name?.[0] || '礼'}
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-main leading-tight">
              {profile?.display_name || '礼'} の予定表
            </h1>
            <p className="text-[11px] font-bold text-text-muted mt-0.5">
              {getFormattedDate(activeTab)}
            </p>
            {/* オフライン表示 */}
            <div className="flex items-center gap-1 mt-0.5">
              {isOffline ? (
                <span className="flex items-center text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded-full">
                  <WifiOff className="w-2.5 h-2.5 mr-0.5" />
                  オフライン（保存中）
                </span>
              ) : (
                <span className="flex items-center text-[10px] text-green-500 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">
                  <Wifi className="w-2.5 h-2.5 mr-0.5" />
                  オンライン
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 星の獲得状況 ＆ アイコンボタン（親ダッシュボード・成長グラフ） */}
        <div className="flex items-center gap-2">
          {/* 連続達成ストリークバッジ */}
          <StreakBadge streakInfo={streakInfo} />

          {/* 親ダッシュボードボタン（アイコンのみ） */}
          <button
            onClick={() => router.push('/dashboard')}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all text-quest-mission border border-blue-200 shadow-sm"
            title="親ダッシュボード（承認・予定管理）"
          >
            <Shield className="w-4 h-4 text-quest-mission" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 成長グラフボタン（アイコンのみ） */}
          <button
            onClick={() => router.push('/analytics')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-50 hover:bg-purple-100 active:scale-95 transition-all text-purple-600 border border-purple-200 shadow-sm"
            title="成長グラフを見る"
          >
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </button>

          <div className="flex flex-col items-end gap-1.5">
            {/* 今日獲得できる星 */}
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-yellow-700">今日:</span>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
              <span className="font-extrabold text-yellow-700 text-xs">
                {todayEarned} / {todayTotal}
              </span>
            </div>

            {/* トータル星 */}
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-blue-700">合計:</span>
              <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-300" />
              <span className="font-extrabold text-blue-700 text-xs">
                {profile?.total_stars ?? 12}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ストリーク更新のトースト祝賀バナー */}
      {streakToast?.show && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 text-white p-4 rounded-3xl shadow-2xl shadow-orange-300/60 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300 border border-orange-200">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 fill-white text-white animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold text-orange-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 連続記録更新！
            </div>
            <div className="text-base font-black tracking-tight">
              🔥 {streakToast.streak}日連続達成！すごい！
            </div>
            <p className="text-[11px] text-orange-100 font-medium">
              今日の予定をすべてやり切ったね！明日も続けよう！
            </p>
          </div>
        </div>
      )}

      {/* サブヘッダー（今日・明日のタブ切り替え） */}
      <div className="bg-white px-6 py-2 flex border-b border-gray-100 z-10">
        <div className="flex bg-gray-100 rounded-full p-1 w-full">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 text-center font-bold text-sm py-2 rounded-full transition-all ${
              activeTab === 'today'
                ? 'bg-white text-text-main shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            今日の予定
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`flex-1 text-center font-bold text-sm py-2 rounded-full transition-all ${
              activeTab === 'tomorrow'
                ? 'bg-white text-text-main shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            明日の予定
          </button>
        </div>
      </div>

      {/* 予定のポップなリスト表示 */}
      <QuestList
        pins={questsList}
        onPinSelect={handlePinSelect}
        onComplete={handleComplete}
        onShowAllClear={() => setShowAllClearModal(true)}
      />

      {/* FABメニューの背景（メニューが開いているときだけ画面全体を覆う半透明カバー） */}
      {isFabOpen && (
        <div 
          className="absolute inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* FABメニュー項目 */}
      {isFabOpen && (
        <div className="absolute bottom-24 right-6 flex flex-col items-end gap-3 z-40">
          {/* 0. 親ダッシュボード */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <span>親ダッシュボード 🛡️</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  {pendingCount}件待ち
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setIsFabOpen(false);
                router.push('/dashboard');
              }}
              className="w-12 h-12 bg-quest-mission text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-blue-600 relative"
            >
              <Shield className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* 1. できたこと日記 */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              できたこと日記 📝
            </span>
            <button
              onClick={() => {
                setIsFabOpen(false);
                router.push('/diary');
              }}
              className="w-12 h-12 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-yellow-500"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>

          {/* 2. 成長グラフ */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              成長グラフ 📈
            </span>
            <button
              onClick={() => {
                setIsFabOpen(false);
                router.push('/analytics');
              }}
              className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-purple-600"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>

          {/* 3. 予定を追加する */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              予定を追加する ➕
            </span>
            <button
              onClick={() => {
                setIsFabOpen(false);
                router.push('/quest/new');
              }}
              className="w-12 h-12 bg-quest-mission text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-blue-500"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>
        </div>
      )}

      {/* メインのFAB（右下：メニューを開く/閉じる） */}
      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className={`absolute bottom-6 right-6 w-16 h-16 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-40 ${
          isFabOpen ? 'bg-gray-500 rotate-45' : 'bg-quest-mission hover:bg-blue-500'
        }`}
        title="メニューを開く"
      >
        <Plus className="w-8 h-8 stroke-[3px]" />
      </button>

      {/* 全クリ達成祝賀モーダル */}
      <AllClearModal
        isOpen={showAllClearModal}
        onClose={() => setShowAllClearModal(false)}
        completedCount={todayTotal}
        earnedStars={todayEarned}
        streakCount={streakInfo.isTodayCompleted ? streakInfo.currentStreak : streakInfo.currentStreak + 1}
        userName={profile?.display_name || '礼'}
      />
    </div>
  );
}
