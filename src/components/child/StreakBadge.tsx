'use client';

import React, { useState } from 'react';
import { Flame, Trophy, Calendar, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { StreakInfo } from '@/lib/streak';

interface StreakBadgeProps {
  streakInfo: StreakInfo;
}

export default function StreakBadge({ streakInfo }: StreakBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentStreak,
    longestStreak,
    isTodayCompleted,
    todayPendingOrDoneCount,
    todayTotalCount,
    past7DaysStatus,
  } = streakInfo;

  const remainingToday = Math.max(0, todayTotalCount - todayPendingOrDoneCount);

  return (
    <>
      {/* ストリークバッジ（タップで詳細モーダル） */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all transform active:scale-95 shadow-sm ${
          isTodayCompleted
            ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 text-white shadow-orange-200 shadow-md ring-2 ring-orange-300 animate-pulse'
            : currentStreak > 0
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
            : 'bg-gray-100 border border-gray-200 text-gray-500 hover:bg-gray-200'
        }`}
        title="連続達成ストリーク（タップで詳細）"
      >
        <Flame
          className={`w-4 h-4 ${
            isTodayCompleted
              ? 'fill-white text-white drop-shadow'
              : currentStreak > 0
              ? 'fill-orange-500 text-orange-500 animate-bounce'
              : 'text-gray-400'
          }`}
        />
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm font-black tracking-tight">{currentStreak}</span>
          <span className="text-[11px] font-bold">日連続</span>
        </div>

        {/* 今日完了マーク */}
        {isTodayCompleted ? (
          <span className="ml-1 text-[10px] bg-white/20 backdrop-blur-xs px-1.5 py-0.2 rounded-full font-black">
            達成!
          </span>
        ) : remainingToday > 0 ? (
          <span className="ml-0.5 text-[10px] text-orange-600/80 font-bold hidden sm:inline">
            (あと{remainingToday})
          </span>
        ) : null}
      </button>

      {/* ストリーク詳細モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-orange-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 装飾の背景グラデーション */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-orange-100/70 to-transparent pointer-events-none" />

            {/* 閉じるボタン */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10 shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>

            {/* モーダルコンテンツ */}
            <div className="relative text-center pt-2">
              {/* 炎アイコン */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 text-white shadow-lg shadow-orange-300/50 mb-3 animate-bounce">
                <Flame className="w-9 h-9 fill-white" />
              </div>

              <h2 className="text-xl font-black text-gray-800">
                連続達成ストリーク
              </h2>
              <p className="text-xs text-gray-500 font-bold mt-1">
                毎日の予定をすべてやり切ると記録が伸びるよ！
              </p>

              {/* 記録カード（現在の記録 ＆ 最高記録） */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-bold text-orange-600 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    現在の連続
                  </span>
                  <div className="text-2xl font-black text-orange-600 mt-1">
                    {currentStreak}
                    <span className="text-xs ml-0.5">日</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                    最高記録
                  </span>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {longestStreak}
                    <span className="text-xs ml-0.5">日</span>
                  </div>
                </div>
              </div>

              {/* 過去7日間の達成状況カレンダー */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mb-5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2 px-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    最近7日間の記録
                  </span>
                  <span>{isTodayCompleted ? '🎉 今日クリア!' : 'あと少し!'}</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {past7DaysStatus.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                        day.isToday
                          ? 'bg-white ring-2 ring-orange-400 shadow-sm'
                          : 'bg-white/60'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-1 ${day.isToday ? 'text-orange-600 font-black' : 'text-gray-400'}`}>
                        {day.isToday ? '今日' : day.dayName}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          day.isCompleted
                            ? 'bg-gradient-to-tr from-orange-400 to-red-500 text-white shadow-xs'
                            : day.isToday
                            ? 'bg-orange-100 text-orange-600 border border-dashed border-orange-400'
                            : day.hasQuests
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {day.isCompleted ? (
                          <Flame className="w-4 h-4 fill-white" />
                        ) : day.isToday ? (
                          <span className="text-[10px] font-black">{todayPendingOrDoneCount}/{todayTotalCount}</span>
                        ) : (
                          <span className="text-[10px] font-bold">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 応援メッセージ */}
              <div className="text-left bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-2xl border border-orange-100 mb-5 text-xs text-orange-950 font-medium">
                {isTodayCompleted ? (
                  <p className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-orange-600 font-bold">素晴らしい！</strong>
                      今日の予定はすべて達成済みです。明日もこの調子で記録を伸ばそう！
                    </span>
                  </p>
                ) : remainingToday > 0 ? (
                  <p className="flex items-start gap-2">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-400 shrink-0 mt-0.5" />
                    <span>
                      今日あと <strong className="text-orange-600 font-bold">{remainingToday}個</strong> の予定を「できた！」にすると、連続記録が <strong className="text-orange-600 font-bold">{currentStreak + 1}日</strong> に更新されるよ！
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>
                      毎日の予定をコツコツやり切って、新記録を目指そう！
                    </span>
                  </p>
                )}
              </div>

              {/* とじるボタン */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-md shadow-orange-300/40 active:scale-98 transition-all"
              >
                がんばる！
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
