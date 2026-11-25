'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, TrendingUp, BookOpen, Star, Sparkles, Smile, Printer, ShieldAlert, Flame } from 'lucide-react';
import { calculateStreak } from '@/lib/streak';
import DiaryCalendar from '@/components/common/DiaryCalendar';
import { formatLocalDate } from '@/lib/dateUtils';

export default function AnalyticsPage() {
  const router = useRouter();
  const { quests, diaries } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [monthRange, setMonthRange] = useState<3 | 6 | 12>(3); // 表示する月数

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 月単位データ生成: 今月含む過去 N か月分
  const getMonthlyData = (numMonths: number) => {
    const result: {
      monthKey: string;    // "2024-11"
      axisLabel: string;   // "11月"
      starCount: number;
      emotionScoreAvg: number;
      emotionEmoji: string;
    }[] = [];

    const now = new Date();
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const axisLabel = `${month}月`;

      // その月の完了クエスト
      const monthQuests = quests.filter(
        (q) => q.date.startsWith(monthKey) && q.status === 'completed'
      );
      const starCount = monthQuests.reduce((sum, q) => {
        return sum + q.difficulty + (q.isEventJudgmentDay ? (q.bonusStars ?? 5) : 0);
      }, 0);

      // その月の日記感情スコア平均
      const monthDiaries = diaries.filter((d) => d.date.startsWith(monthKey));
      const scores = monthDiaries.map((d) => emotionScores[d.emotion] ?? 4);
      const emotionScoreAvg = scores.length > 0
        ? scores.reduce((s, v) => s + v, 0) / scores.length
        : 4;

      // その月の最頻感情
      const emotionCount: Record<string, number> = {};
      monthDiaries.forEach((d) => {
        emotionCount[d.emotion] = (emotionCount[d.emotion] ?? 0) + 1;
      });
      const topEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const emotionEmoji = topEmotion ? emotionEmojis[topEmotion] : '';

      result.push({ monthKey, axisLabel, starCount, emotionScoreAvg, emotionEmoji });
    }
    return result;
  };

  const emotionScores: Record<string, number> = {
    happy: 5, good: 4, sad: 3, tired: 2, angry: 1
  };

  const emotionEmojis: Record<string, string> = {
    happy: '😆', good: '🙂', sad: '😢', tired: '🥱', angry: '😡'
  };

  const monthlyData = getMonthlyData(monthRange);
  const maxStars = Math.max(...monthlyData.map((d) => d.starCount), 1);
  const totalStarsInRange = monthlyData.reduce((sum, d) => sum + d.starCount, 0);

  // 連続達成ストリークの計算
  const streakInfo = calculateStreak(quests);

  const rangeLabel = `過去${monthRange}か月`;

  // SVG折れ線グラフ用座標計算（月単位）
  const stepX = monthRange <= 6 ? 60 : 44;
  const svgWidth = Math.max(300, 50 + (monthlyData.length - 1) * stepX + 50);
  const svgPoints = monthlyData.map((d, index) => {
    const x = 40 + index * stepX;
    const y = 145 - d.emotionScoreAvg * 25;
    return { x, y, emoji: d.emotionEmoji, label: d.axisLabel };
  });
  const pathD = svgPoints.reduce((d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`), '');

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-12 select-none print:bg-white print:pb-0">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/route');
              }
            }}
            className="text-text-muted hover:text-text-main"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-text-main text-lg">成長ダッシュボード 📈</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-quest-mission text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-500 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>印刷・PDF保存</span>
        </button>
      </header>

      <div className="p-6 space-y-6 print:p-0">
        
        {/* 期間切り替えピル */}
        <div className="flex bg-gray-100 p-1 rounded-2xl max-w-xs mx-auto print:hidden">
          {([3, 6, 12] as const).map((n) => {
            const isSelected = monthRange === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setMonthRange(n)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? 'bg-white text-quest-mission shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {n}か月
              </button>
            );
          })}
        </div>

        {/* ストリーク＆期間まとめカード */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              連続達成ストリーク
            </span>
            <div className="text-2xl font-black text-orange-600 mt-1">
              {streakInfo.currentStreak}
              <span className="text-xs ml-0.5 font-bold">日連続</span>
            </div>
            <span className="text-[10px] text-orange-700/80 font-bold block mt-0.5">
              最高記録: {streakInfo.longestStreak}日
            </span>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-yellow-700 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
              {rangeLabel}の獲得星
            </span>
            <div className="text-2xl font-black text-yellow-600 mt-1">
              {totalStarsInRange}
              <span className="text-xs ml-0.5 font-bold">個</span>
            </div>
            <span className="text-[10px] text-yellow-700/80 font-bold block mt-0.5">
              今月: {monthlyData[monthlyData.length - 1]?.starCount ?? 0}個
            </span>
          </div>
        </div>

        {/* 1. 集めた星の数 (棒グラフ: 月別) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-quest-mission" />
              集めた星の数（月別・{rangeLabel}）
            </h2>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="h-44 flex items-end gap-3 pt-6 border-b border-gray-100 pb-2 w-full justify-between">
              {monthlyData.map((data, idx) => {
                const heightPercent = (data.starCount / maxStars) * 80;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 group h-full justify-end flex-1"
                  >
                    <span className="text-[10px] font-black text-yellow-600">
                      {data.starCount > 0 ? `${data.starCount}★` : ''}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 origin-bottom"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: data.starCount >= 10 ? '#FFCE54' : '#FFE8A3'
                      }}
                    />
                    <span className="text-[11px] font-bold text-text-muted whitespace-nowrap">
                      {data.axisLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted font-bold pt-1">
            <span>{rangeLabel}の合計星獲得数:</span>
            <span className="text-sm text-yellow-600 font-black flex items-center gap-1 animate-pulse">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
              {totalStarsInRange} 個
            </span>
          </div>
        </section>

        {/* 2. 心の状態 (折れ線グラフ: 月別) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-quest-event" />
              心の状態（月別平均・{rangeLabel}）
            </h2>
          </div>

          {/* SVG 折れ線グラフ */}
          <div className="overflow-x-auto no-scrollbar pt-4">
            <div style={{ minWidth: `${svgWidth}px` }}>
              <svg viewBox={`0 0 ${svgWidth} 150`} className="w-full h-auto overflow-visible">
                {/* 背景グリッド線 & ラベル */}
                {[
                  { val: 5, label: '😆', name: '嬉しい' },
                  { val: 4, label: '🙂', name: '普通' },
                  { val: 3, label: '😢', name: '悲しい' },
                  { val: 2, label: '🥱', name: '疲労' },
                  { val: 1, label: '😡', name: '怒り' }
                ].map((grid) => {
                  const y = 145 - grid.val * 25;
                  return (
                    <g key={grid.val} className="opacity-45">
                      <line x1="30" y1={y} x2={svgWidth - 10} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3" />
                      <text x="5" y={y + 4} className="text-[11px] font-semibold" fill="#718096">
                        {grid.label}
                      </text>
                    </g>
                  );
                })}

                {/* 折れ線 */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFCE54"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  />
                )}

                {/* 各データのプロット点 */}
                {svgPoints.map((p, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="5" fill="#FFF" stroke="#FFCE54" strokeWidth="2.5" />
                    <circle cx={p.x} cy={p.y} r="2" fill="#FFCE54" />

                    {/* 月ラベル */}
                    <text x={p.x} y="145" textAnchor="middle" className="text-[9px] font-bold fill-gray-400">
                      {p.label}
                    </text>

                    {/* 最頻感情の絵文字 */}
                    {p.emoji && (
                      <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-xs">
                        {p.emoji}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] font-semibold text-gray-700 leading-relaxed">
            💡 月ごとの気分の平均値を表示しています。その月で最も多かった感情の絵文字が点の上に表示されます。
          </div>
        </section>

        {/* 3. できたこと日記の履歴（カレンダー形式） */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-main flex items-center gap-1.5 px-1">
            <BookOpen className="w-5 h-5 text-quest-routine" />
            できたこと日記のカレンダー 📅
          </h2>

          <DiaryCalendar diaries={diaries} isParentView={true} />
        </section>

      </div>
    </div>
  );
}
