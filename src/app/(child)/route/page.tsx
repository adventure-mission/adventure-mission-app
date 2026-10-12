'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useQuestSync } from '@/hooks/useQuestSync';
import QuestList from '@/components/child/QuestList';
import { type MapPin } from '@/types';
import { Moon, Star, Plus, Wifi, WifiOff, Settings, TrendingUp, BookOpen, Shield } from 'lucide-react';
import CampView from '../camp/page'; // おやすみピン画面

export default function RoutePage() {
  const router = useRouter();
  const { isOffline } = useQuestSync();
  const { profile, isSleepMode, setIsSleepMode, quests, generateRecurringInstances } = useAppStore();
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [questsList, setQuestsList] = useState<MapPin[]>([]);
  const [isFabOpen, setIsFabOpen] = useState(false);

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

  // 夜21時以降の自動おやすみ判定 ＆ 親手動フラグの監視
  useEffect(() => {
    const checkSleepTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // 夜21時(21)以降または朝6時前なら自動的におやすみモード
      const isNight = currentHour >= 21 || currentHour < 6;
      
      // 親設定の手動おやすみモード、または時間によるおやすみモード
      if (isNight || (profile && profile.is_sleep_mode)) {
        setIsSleepMode(true);
      } else {
        setIsSleepMode(false);
      }
    };

    checkSleepTime();
    const interval = setInterval(checkSleepTime, 60000); // 1分ごとに確認

    return () => clearInterval(interval);
  }, [profile, setIsSleepMode]);

  const handlePinSelect = (questId: string) => {
    // クエスト詳細（中項目の道）画面へ遷移
    router.push(`/quest/${questId}`);
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
              {profile?.display_name || '礼'} の地図
            </h1>
            <p className="text-[11px] font-bold text-text-muted mt-0.5">
              {getFormattedDate(activeTab)}
            </p>
            {/* オフライン表示 */}
            <div className="flex items-center gap-1 mt-0.5">
              {isOffline ? (
                <span className="flex items-center text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded-full">
                  <WifiOff className="w-2.5 h-2.5 mr-0.5" />
                  オフライン（ほぞん中）
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

        {/* 星の獲得状況 ＆ せいちょうグラフ・おやダッシュボードへのクイックボタン */}
        <div className="flex items-center gap-2">
          {/* おやダッシュボードボタン */}
          <button
            onClick={() => router.push('/dashboard')}
            className="relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all text-quest-mission border border-blue-200 shadow-sm"
            title="おやダッシュボード（承認・予定管理）"
          >
            <Shield className="w-4 h-4 text-quest-mission" />
            <span className="text-[9px] font-extrabold mt-0.5 leading-none">おや</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {pendingCount}
              </span>
            )}
          </button>

          {/* せいちょうグラフボタン */}
          <button
            onClick={() => router.push('/analytics')}
            className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-95 transition-all text-purple-600 border border-purple-200 shadow-sm"
            title="せいちょうグラフを見る"
          >
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-[9px] font-extrabold mt-0.5 leading-none">グラフ</span>
          </button>

          <div className="flex flex-col items-end gap-1.5">
            {/* きょう獲得できる星 */}
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-yellow-700">きょう:</span>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
              <span className="font-extrabold text-yellow-700 text-xs">
                {todayEarned} / {todayTotal}
              </span>
            </div>

            {/* トータル星 */}
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-blue-700">トータル:</span>
              <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-300" />
              <span className="font-extrabold text-blue-700 text-xs">
                {profile?.total_stars ?? 12}
              </span>
            </div>
          </div>
        </div>
      </header>

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
      <QuestList pins={questsList} onPinSelect={handlePinSelect} />

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
          {/* 0. おやダッシュボード */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <span>おやダッシュボード 🛡️</span>
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

          {/* 2. せいちょうグラフ */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              せいちょうグラフ 📈
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

          {/* 3. 予定を登録する */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              予定を登録する
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

          {/* 4. 予定を設定する */}
          <div className="flex items-center gap-3">
            <span className="bg-white border border-gray-100 text-text-main font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              予定を設定する
            </span>
            <button
              onClick={() => {
                setIsFabOpen(false);
                router.push('/quests/new?from=route');
              }}
              className="w-12 h-12 bg-quest-routine text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:bg-green-500"
            >
              <Settings className="w-5 h-5" />
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
    </div>
  );
}
