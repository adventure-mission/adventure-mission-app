'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { syncUpdateProfile } from '@/lib/syncService';
import ApprovalCard from '@/components/parent/ApprovalCard';
import { type Wish, type RegisteredQuest } from '@/types';
import { Moon, Star, Bell, Shield, Gift, Sparkles, CheckCircle2, Trash2, Plus, Calendar, Clock, ArrowLeft, MapPin as MapPinIcon, Flame, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateStreak } from '@/lib/streak';

export default function ParentDashboard() {
  const {
    profile,
    setProfile,
    isSleepMode,
    setIsSleepMode,
    quests,
    updateQuestStatus,
    deleteQuest,
    wishes,
    reviewWishStars,
    grantWish,
    deleteWish,
  } = useAppStore();

  const [reviewStarsMap, setReviewStarsMap] = useState<Record<string, number>>({});

  // 子供のトータル星数
  const childStars = profile?.total_stars ?? 12;

  // 連続達成ストリークの計算
  const streakInfo = calculateStreak(quests);

  // 1. 子供が報告した「確認中（pending）」のクエスト一覧
  const pendingQuests = quests.filter((q) => q.status === 'pending');

  // ほしいものの各種カウント
  const pendingWishesReview = wishes.filter((w) => w.status === 'pending_review');
  const readyWishesGrant = wishes.filter((w) => w.status === 'ready_to_grant');
  const savingWishes = wishes.filter((w) => w.status === 'saving');

  // クエスト承認ハンドラ
  const handleApproveQuest = (questId: string, starsToAdd: number, stamp?: string) => {
    // クエストステータスを completed に更新（Supabaseへも自動同期）
    updateQuestStatus(questId, 'completed', stamp);

    // 星の加算
    const newTotalStars = (profile?.total_stars ?? 12) + starsToAdd;
    if (profile) {
      setProfile({
        ...profile,
        total_stars: newTotalStars
      });
    }
    syncUpdateProfile({ total_stars: newTotalStars });

    // 承認時のお祝い演出
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FFCE54', '#FF6B6B', '#4D96FF', '#48BB78']
    });
  };

  // やり直し（未完了に戻す）ハンドラ
  const handleRejectQuest = (questId: string) => {
    if (!confirm('「未完了」に戻しますか？')) return;
    updateQuestStatus(questId, 'todo');
  };

  // 2. ほしいもの星数査定・確定ハンドラ
  const handleReviewWish = (wishId: string, defaultStars: number) => {
    const finalStars = reviewStarsMap[wishId] ?? defaultStars;
    reviewWishStars(wishId, Math.max(1, finalStars));
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFCE54', '#48BB78', '#4D96FF'],
    });
  };

  // 3. ほしいもの交換完了（プレゼント引き換え）ハンドラ
  const handleGrantWish = (wishId: string) => {
    grantWish(wishId);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FF6B6B', '#FFCE54', '#4D96FF', '#48BB78'],
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
        const choice = confirm(`「${quest.title}（${quest.date}）」を削除しますか？\n\n【OK】: この予定を削除する\n【キャンセル】: 中止`);
        if (!choice) return;
        deleteEntire = confirm('すべての曜日の繰り返し予定もまとめて削除しますか？\n\n【OK】: すべて削除\n【キャンセル】: この日の予定だけ削除');
      }
    } else {
      if (!confirm(`「${quest.title}」を削除しますか？`)) return;
    }

    deleteQuest(quest.id, deleteEntire);
  };

  // 予定一覧のフィルター・展開状態
  const [questFilter, setQuestFilter] = useState<'upcoming' | 'week' | 'all'>('upcoming');
  const [showAllQuests, setShowAllQuests] = useState(false);

  // 日付順・時間順に並べ替え
  const sortedQuests = [...quests].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });

  // 日付フィルター計算
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const weekLaterObj = new Date();
  weekLaterObj.setDate(weekLaterObj.getDate() + 7);
  const weekLaterStr = weekLaterObj.toISOString().split('T')[0];

  const upcomingQuests = sortedQuests.filter((q) => q.date === todayStr || q.date === tomorrowStr);
  const weekQuests = sortedQuests.filter((q) => q.date >= todayStr && q.date <= weekLaterStr);

  const filteredQuests =
    questFilter === 'upcoming'
      ? upcomingQuests
      : questFilter === 'week'
      ? weekQuests
      : sortedQuests;

  const displayedQuests = showAllQuests ? filteredQuests : filteredQuests.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-16 select-none">
      {/* 親ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/route"
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            title="予定表へ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-quest-mission" />
            <h1 className="font-bold text-text-main text-lg">親ダッシュボード</h1>
          </div>
        </div>

        <button className="p-2 text-text-muted hover:text-text-main relative">
          <Bell className="w-6 h-6" />
          {(pendingQuests.length > 0 || pendingWishesReview.length > 0 || readyWishesGrant.length > 0) && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </header>

      <div className="p-6 space-y-6">
        
        {/* 子供の状況カード */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-text-muted mb-4">{profile?.display_name || '礼'} のステータス</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-500 fill-yellow-400" />
              </div>
              <div>
                <span className="text-2xl font-black text-text-main">{childStars}</span>
                <span className="text-xs text-text-muted font-bold ml-1">集めた星</span>
              </div>
            </div>

            {/* ストリーク表示 */}
            <div className="flex items-center gap-2.5 bg-orange-50 border border-orange-200/80 px-3.5 py-2 rounded-2xl">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-orange-700">{streakInfo.currentStreak}</span>
                  <span className="text-xs font-bold text-orange-700">日連続</span>
                </div>
                <span className="text-[10px] font-bold text-orange-600 block -mt-0.5">
                  {streakInfo.isTodayCompleted ? '🎉 今日達成!' : `今日あと${Math.max(0, streakInfo.todayTotalCount - streakInfo.todayPendingOrDoneCount)}件`}
                </span>
              </div>
            </div>

            {/* お休みモードスイッチ */}
            <button
              onClick={toggleSleepMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                isSleepMode
                  ? 'bg-slate-800 text-yellow-300 border-slate-900 shadow-inner'
                  : 'bg-white text-slate-600 border-gray-200 shadow-sm'
              }`}
            >
              <Moon className={`w-4 h-4 ${isSleepMode ? 'fill-yellow-300' : ''}`} />
              <span>{isSleepMode ? 'お休み中' : 'お休みに設定'}</span>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 1. 【最優先】子どもからのリクエスト・承認ゾーン */}
        {/* ============================================================ */}

        {/* 1-A. 目標達成！プレゼント交換のお願い */}
        {readyWishesGrant.length > 0 && (
          <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full animate-bounce shadow-xs">
                目標達成！
              </span>
              <h3 className="font-black text-gray-900 text-base flex items-center gap-1.5">
                <Gift className="w-5 h-5 text-emerald-600" />
                <span>プレゼント交換のお願い ({readyWishesGrant.length}件)</span>
              </h3>
            </div>
            <p className="text-xs text-emerald-900 font-medium">
              子どもが必要な星をすべてためきりました！プレゼントを渡して「交換完了」にしてあげましょう。
            </p>

            <div className="space-y-3 pt-1">
              {readyWishesGrant.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>{wish.title}</span>
                    </h4>
                    <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                      ★{wish.required_stars}個 満タン達成！
                    </span>
                  </div>

                  <button
                    onClick={() => handleGrantWish(wish.id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>プレゼント完了（引き換え）！🎁</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 1-B. 確認待ちの予定（子供が「できた！」と報告した予定） */}
        {pendingQuests.length > 0 && (
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>確認待ちの予定 ({pendingQuests.length}件)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {pendingQuests.map((q) => (
                <ApprovalCard
                  key={q.id}
                  item={{
                    logId: q.id,
                    questTitle: q.title,
                    childName: profile?.display_name || '礼',
                    difficulty: q.difficulty,
                    bonusStars: q.isEventJudgmentDay ? (q.bonusStars ?? 5) : 0,
                    completedAt: new Date().toISOString(),
                    type: q.type,
                  }}
                  onApprove={handleApproveQuest}
                  onReject={handleRejectQuest}
                />
              ))}
            </div>
          </section>
        )}

        {/* 1-C. 星の数の査定リクエスト (子どもからの希望) */}
        {pendingWishesReview.length > 0 && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                新着申請
              </span>
              <h3 className="font-bold text-gray-800 text-sm">
                星の数の査定リクエスト ({pendingWishesReview.length}件)
              </h3>
            </div>
            <p className="text-xs text-amber-900/80 font-medium">
              子どもがほしいものを登録しました！目標とする星の数を決めて承認してあげましょう。
            </p>

            <div className="space-y-3 pt-1">
              {pendingWishesReview.map((wish) => {
                const currentStars = reviewStarsMap[wish.id] ?? wish.required_stars;
                return (
                  <div
                    key={wish.id}
                    className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{wish.title}</h4>
                        {wish.memo && (
                          <p className="text-xs text-gray-500 font-medium mt-0.5">💬 {wish.memo}</p>
                        )}
                        {wish.estimated_price && (
                          <span className="text-[11px] font-bold text-gray-400 block mt-0.5">
                            参考金額: 約{wish.estimated_price.toLocaleString()}円 (子どもの希望: ★{wish.required_stars})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteWish(wish.id)}
                        className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                        title="却下・削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 星の調整スライダー ＆ 決定ボタン */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600">決定星数:</span>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setReviewStarsMap((prev) => ({
                                ...prev,
                                [wish.id]: Math.max(1, currentStars - 5),
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 font-black text-xs text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                          >
                            -5
                          </button>
                          <span className="font-black text-sm text-yellow-700 px-2 flex items-center gap-0.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                            {currentStars}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewStarsMap((prev) => ({
                                ...prev,
                                [wish.id]: currentStars + 5,
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 font-black text-xs text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReviewWish(wish.id, currentStars)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>★{currentStars}個で決定して承認！</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 承認待ちが0件の時の完了カード */}
        {pendingQuests.length === 0 && readyWishesGrant.length === 0 && pendingWishesReview.length === 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center text-text-muted text-xs shadow-xs space-y-1">
            <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto mb-1.5" />
            <p className="font-bold text-gray-800 text-sm">現在、承認待ち・交換待ちのリクエストはありません ✨</p>
            <p className="text-[11px] text-gray-400">子どもが予定を達成したり新しいほしいものを登録すると、ここに表示されます。</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. ほしいものリスト（貯金中）の進行状況 */}
        {/* ============================================================ */}
        {savingWishes.length > 0 && (
          <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-red-500" />
                <span>貯金中のほしいもの ({savingWishes.length}件)</span>
              </h3>
              <Link
                href="/wishes"
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                子ども画面で見る →
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {savingWishes.map((wish) => {
                const percent = Math.min(100, Math.round((wish.allocated_stars / wish.required_stars) * 100));
                return (
                  <div
                    key={wish.id}
                    className="p-3 bg-gray-50/70 border border-gray-100 rounded-2xl flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{wish.title}</h4>
                        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                          ★ {wish.allocated_stars} / ★ {wish.required_stars} ({percent}%)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`「${wish.title}」を削除しますか？\n※ 貯金された星(★${wish.allocated_stars})は子どもの手元に返還されます`)) {
                            deleteWish(wish.id);
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 p-1"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* プログレスバー */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 3. 予定・イベントの管理（フィルター・折りたたみ付き） */}
        {/* ============================================================ */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
              <Calendar className="w-5 h-5 text-quest-mission" />
              <span>予定・イベントの管理 ({sortedQuests.length}件)</span>
            </h2>
            <Link
              href="/quest/new?from=dashboard"
              className="bg-quest-mission text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>予定を追加</span>
            </Link>
          </div>

          {/* 期間フィルタータブ */}
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 text-xs">
            <button
              onClick={() => {
                setQuestFilter('upcoming');
                setShowAllQuests(false);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                questFilter === 'upcoming'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              今日・明日 ({upcomingQuests.length})
            </button>
            <button
              onClick={() => {
                setQuestFilter('week');
                setShowAllQuests(false);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                questFilter === 'week'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              今週 7日間 ({weekQuests.length})
            </button>
            <button
              onClick={() => {
                setQuestFilter('all');
                setShowAllQuests(false);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                questFilter === 'all'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              すべて ({sortedQuests.length})
            </button>
          </div>

          {/* 予定リスト */}
          {filteredQuests.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-xs font-bold">
              この期間に登録されている予定はありません。
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedQuests.map((q) => (
                <div
                  key={q.id}
                  className="bg-gray-50/70 rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between gap-3 hover:border-gray-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {(q.isEventJudgmentDay || q.type === 'event') && (
                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          ⭐ 特別 (+{q.bonusStars ?? 5}★)
                        </span>
                      )}
                      <span className="text-xs text-text-muted font-bold">
                        {q.date}
                      </span>
                      {q.status === 'pending' && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold animate-pulse">
                          確認中
                        </span>
                      )}
                      {q.status === 'completed' && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                          完了
                        </span>
                      )}
                      {q.isRecurring && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">
                          繰り返し
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-text-main text-sm truncate">{q.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
                      {q.time && (
                        <span className="flex items-center gap-1 font-medium text-gray-500 text-[11px]">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {q.time}
                        </span>
                      )}
                      {q.location && (
                        <span className="flex items-center gap-1 text-gray-400 text-[11px] truncate max-w-[120px]">
                          <MapPinIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {q.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDeleteQuest(q)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 flex-shrink-0"
                    title="この予定を削除"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}

              {/* 5件以上ある場合の開閉トグルボタン */}
              {filteredQuests.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllQuests(!showAllQuests)}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl border border-gray-200/80 transition-all flex items-center justify-center gap-1.5 mt-2 active:scale-98"
                >
                  {showAllQuests ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>一部のみ表示に戻す</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>残り {filteredQuests.length - 5} 件をすべて表示する</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
