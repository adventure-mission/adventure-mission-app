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
  const [timeRange, setTimeRange] = useState<'1week' | '1month' | '3months'>('1month');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getDaysCount = () => {
    if (timeRange === '1month') return 30;
    if (timeRange === '3months') return 90;
    return 7;
  };

  const getPastDays = (days: number) => {
    const arr: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(formatLocalDate(d));
    }
    return arr;
  };

  const pastDays = getPastDays(getDaysCount());

  const emotionScores: Record<string, number> = {
    happy: 5, good: 4, sad: 3, tired: 2, angry: 1
  };
  const emotionEmojis: Record<string, string> = {
    happy: '😆', good: '🙂', sad: '😢', tired: '🥱', angry: '😡'
  };

  // 日ごとのデータ集計
  const dailyData = pastDays.map((dateStr, idx) => {
    const parts = dateStr.split('-');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // 月の変わり目かどうか（最初の日、または前の日と月が違う場合）
    const prevDateStr = idx > 0 ? pastDays[idx - 1] : null;
    const prevMonth = prevDateStr ? parseInt(prevDateStr.split('-')[1], 10) : null;
    const isMonthStart = prevMonth === null || prevMonth !== month;

    const dayQuests = quests.filter((q) => q.date === dateStr && q.status === 'completed');
    const starCount = dayQuests.reduce((sum, q) => {
      return sum + q.difficulty + (q.isEventJudgmentDay ? (q.bonusStars ?? 5) : 0);
    }, 0);

    const dayDiary = diaries.find((d) => d.date === dateStr);
    const emotionScore = dayDiary ? (emotionScores[dayDiary.emotion] ?? 4) : 4;
    const emotionEmoji = dayDiary ? (emotionEmojis[dayDiary.emotion] ?? '') : '';

    // 1週間の場合は「曜日付き」、それ以外は「日のみ」
    let axisLabel = `${day}`;
    if (timeRange === '1week') {
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayName = dayNames[new Date(dateStr).getDay()];
      axisLabel = `${month}/${day}(${dayName})`;
    }

    return {
      dateStr,
      month,
      day,
      axisLabel,
      isMonthStart,
      monthLabel: `${month}月`,
      starCount,
      emotionScore,
      emotionEmoji,
    };
  });

  const maxStars = Math.max(...dailyData.map((d) => d.starCount), 1);
  const totalStarsInRange = dailyData.reduce((sum, d) => sum + d.starCount, 0);
  const streakInfo = calculateStreak(quests);

  const rangeLabel = timeRange === '1week' ? '1週間' : timeRange === '1month' ? '1か月' : '3か月';

  // 表示期間の月の範囲テキスト（例: 「9月〜11月」）
  const firstMonth = dailyData[0]?.month;
  const lastMonth = dailyData[dailyData.length - 1]?.month;
  const monthRangeText = firstMonth === lastMonth ? `${firstMonth}月` : `${firstMonth}月〜${lastMonth}月`;

  // グラフの棒/点の幅を決定
  const barWidth = timeRange === '1week' ? 'flex-1' : timeRange === '1month' ? 'w-6 flex-shrink-0' : 'w-3 flex-shrink-0';
  const barGap = timeRange === '1week' ? 'gap-2' : timeRange === '1month' ? 'gap-1' : 'gap-0.5';

  // SVG折れ線グラフ
  const stepX = timeRange === '1week' ? 44 : timeRange === '1month' ? 14 : 7;
  const svgWidth = Math.max(300, 50 + (dailyData.length - 1) * stepX + 30);
  const svgPoints = dailyData.map((d, index) => {
    const x = 40 + index * stepX;
    const y = 145 - d.emotionScore * 25;
    return { x, y, emoji: d.emotionEmoji, label: d.axisLabel, isMonthStart: d.isMonthStart, monthLabel: d.monthLabel };
  });
  const pathD = svgPoints.reduce((d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`), '');

  // 点を表示するかどうか（3か月の場合は間引き）
  const showDot = (idx: number) => timeRange !== '3months' || idx % 7 === 0 || idx === dailyData.length - 1;

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

      <div className="p-4 space-y-5 print:p-0">

        {/* 期間切り替えピル */}
        <div className="flex bg-gray-100 p-1 rounded-2xl max-w-xs mx-auto print:hidden">
          {(['1week', '1month', '3months'] as const).map((r) => {
            const labels = { '1week': '1週間', '1month': '1か月', '3months': '3か月' };
            const isSelected = timeRange === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected ? 'bg-white text-quest-mission shadow-xs' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* ストリーク＆まとめカード */}
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
              今日: {dailyData[dailyData.length - 1]?.starCount ?? 0}個
            </span>
          </div>
        </div>

        {/* 1. 棒グラフ（日付別・星の数） */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-quest-mission" />
              集めた星の数（日別・{rangeLabel}）
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{monthRangeText} ／ 横スクロールで全期間確認</p>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className={`h-44 flex items-end ${barGap} pt-4 border-b border-gray-100 pb-1 ${timeRange === '1week' ? 'w-full' : 'min-w-max px-1'}`}>
              {dailyData.map((data, idx) => {
                const heightPercent = (data.starCount / maxStars) * 80;
                return (
                  <div key={idx} className={`flex flex-col items-center h-full justify-end ${barWidth}`}>
                    {/* 星数ラベル（1週間のみ表示） */}
                    {timeRange === '1week' && (
                      <span className="text-[9px] font-black text-yellow-600 mb-0.5">
                        {data.starCount > 0 ? `${data.starCount}★` : ''}
                      </span>
                    )}
                    {/* 棒 */}
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPercent, data.starCount > 0 ? 2 : 0)}%`,
                        backgroundColor: data.starCount >= 5 ? '#FFCE54' : '#FFE8A3'
                      }}
                    />
                    {/* X軸ラベル：月の変わり目は「月」、それ以外は「日」 */}
                    <div className="flex flex-col items-center mt-0.5">
                      {data.isMonthStart && timeRange !== '1week' && (
                        <span className="text-[8px] font-black text-quest-mission leading-none">
                          {data.monthLabel}
                        </span>
                      )}
                      <span className={`font-bold text-text-muted whitespace-nowrap ${timeRange === '1week' ? 'text-[10px]' : 'text-[8px]'}`}>
                        {data.axisLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted font-bold">
            <span>{rangeLabel}の合計星獲得数:</span>
            <span className="text-sm text-yellow-600 font-black flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
              {totalStarsInRange} 個
            </span>
          </div>
        </section>

        {/* 2. 折れ線グラフ（日別・気分） */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-quest-event" />
              心の状態の推移（日別・{rangeLabel}）
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{monthRangeText} ／ 横スクロールで全期間確認</p>
          </div>

          <div className="overflow-x-auto no-scrollbar pt-2">
            <div style={{ minWidth: `${svgWidth}px` }}>
              <svg viewBox={`0 0 ${svgWidth} 160`} className="w-full h-auto overflow-visible">
                {/* グリッド線 & 感情ラベル */}
                {[
                  { val: 5, label: '😆' },
                  { val: 4, label: '🙂' },
                  { val: 3, label: '😢' },
                  { val: 2, label: '🥱' },
                  { val: 1, label: '😡' }
                ].map((grid) => {
                  const y = 145 - grid.val * 25;
                  return (
                    <g key={grid.val} opacity="0.4">
                      <line x1="28" y1={y} x2={svgWidth - 5} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3" />
                      <text x="4" y={y + 4} fontSize="11" fill="#718096">{grid.label}</text>
                    </g>
                  );
                })}

                {/* 月の区切り線 */}
                {svgPoints.filter((p) => p.isMonthStart && timeRange !== '1week').map((p, i) => (
                  <g key={`month-${i}`}>
                    <line x1={p.x} y1="0" x2={p.x} y2="130" stroke="#93C5FD" strokeWidth="1" strokeDasharray="4" opacity="0.6" />
                    <text x={p.x + 2} y="10" fontSize="9" fill="#3B82F6" fontWeight="bold">{p.monthLabel}</text>
                  </g>
                ))}

                {/* 折れ線 */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFCE54"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* プロット点 & ラベル */}
                {svgPoints.map((p, idx) => (
                  <g key={idx}>
                    {showDot(idx) && (
                      <>
                        <circle cx={p.x} cy={p.y} r={timeRange === '3months' ? 2.5 : 4} fill="#FFF" stroke="#FFCE54" strokeWidth="2" />
                        <circle cx={p.x} cy={p.y} r={timeRange === '3months' ? 1 : 1.5} fill="#FFCE54" />
                      </>
                    )}
                    {/* 1週間：絵文字と日付ラベル */}
                    {timeRange === '1week' && (
                      <>
                        {p.emoji && (
                          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12">{p.emoji}</text>
                        )}
                        <text x={p.x} y="155" textAnchor="middle" fontSize="9" fill="#718096" fontWeight="bold">
                          {p.label}
                        </text>
                      </>
                    )}
                    {/* 1か月：5日ごとにラベル */}
                    {timeRange === '1month' && idx % 5 === 0 && (
                      <text x={p.x} y="155" textAnchor="middle" fontSize="8" fill="#718096" fontWeight="bold">
                        {p.label}
                      </text>
                    )}
                    {/* 3か月：7日ごとにラベル */}
                    {timeRange === '3months' && idx % 7 === 0 && (
                      <text x={p.x} y="155" textAnchor="middle" fontSize="7" fill="#718096" fontWeight="bold">
                        {p.label}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] font-semibold text-gray-700 leading-relaxed">
            💡 日記を書いた日の感情が折れ線に反映されます。青い縦線は月の変わり目です。
          </div>
        </section>

        {/* 3. 日記カレンダー */}
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
