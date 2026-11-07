'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, TrendingUp, BookOpen, Star, Sparkles, Smile, Printer, ShieldAlert, Flame } from 'lucide-react';
import { calculateStreak } from '@/lib/streak';

export default function AnalyticsPage() {
  const router = useRouter();
  const { quests, diaries } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'1week' | '1month' | '3months'>('1week');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 1. 選択された期間に応じた日付文字列リストを取得 (今日含む)
  const getDaysCount = () => {
    if (timeRange === '1month') return 30;
    if (timeRange === '3months') return 90;
    return 7;
  };

  const getPastDays = (days: number) => {
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  };
  const pastDays = getPastDays(getDaysCount());

  // 日付のフォーマット (例: "11/7" や 1週間の時は "11/7(土)")
  const formatAxisDate = (dateStr: string, isShort = false) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isShort && timeRange === '1week') {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const dayName = days[new Date(dateStr).getDay()];
      return `${m}/${d}(${dayName})`;
    }
    return `${m}/${d}`;
  };

  const emotionScores: Record<string, number> = {
    happy: 5,
    good: 4,
    sad: 3,
    tired: 2,
    angry: 1
  };

  const emotionLabels: Record<string, string> = {
    happy: '嬉しい！',
    good: '普通',
    sad: '悲しい',
    tired: '疲れた',
    angry: '怒り'
  };

  const emotionEmojis: Record<string, string> = {
    happy: '😆',
    good: '🙂',
    sad: '😢',
    tired: '🥱',
    angry: '😡'
  };

  // 2. 日ごとの予定達成数・獲得星数・感情を集計
  const dailyData = pastDays.map((dateStr) => {
    // その日の完了クエスト
    const dayQuests = quests.filter((q) => q.date === dateStr && q.status === 'completed');
    const starCount = dayQuests.reduce((sum, q) => {
      const base = q.difficulty;
      const bonus = q.isEventJudgmentDay ? (q.bonusStars ?? 5) : 0;
      return sum + base + bonus;
    }, 0);

    // その日の日記と感情
    const dayDiary = diaries.find((d) => d.date === dateStr);
    const score = dayDiary ? emotionScores[dayDiary.emotion] : 4; // 書いてない日はデフォルトふつう(4)
    const emoji = dayDiary ? emotionEmojis[dayDiary.emotion] : '';
    const content = dayDiary ? dayDiary.content : null;
    const emotionType = dayDiary ? dayDiary.emotion : null;

    return {
      dateStr,
      axisLabel: formatAxisDate(dateStr),
      shortDate: formatAxisDate(dateStr, true),
      starCount,
      emotionScore: score,
      emotionEmoji: emoji,
      emotionType,
      content
    };
  });

  const maxStars = Math.max(...dailyData.map((d) => d.starCount), 1);
  const totalStarsInRange = dailyData.reduce((sum, d) => sum + d.starCount, 0);

  // 連続達成ストリークの計算
  const streakInfo = calculateStreak(quests);

  // 期間に応じたタイトル
  const rangeLabel = timeRange === '1week' ? '1週間' : timeRange === '1month' ? '1か月' : '3か月';
  const rangeDescription = timeRange === '1week' ? '過去7日間' : timeRange === '1month' ? '過去30日間' : '過去90日間';

  // SVG折れ線グラフ用座標計算
  const stepX = timeRange === '1week' ? 44 : 38;
  const svgWidth = Math.max(320, 50 + (dailyData.length - 1) * stepX + 30);
  const svgPoints = dailyData.map((d, index) => {
    const x = 40 + index * stepX;
    const y = 145 - d.emotionScore * 25; // 5=20px, 4=45px, 3=70px, 2=95px, 1=120px
    return { x, y, emoji: d.emotionEmoji, score: d.emotionScore, label: d.shortDate };
  });

  // 折れ線用パス文字列の生成
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
        <div className="flex bg-gray-100 p-1 rounded-2xl max-w-sm mx-auto print:hidden">
          {(['1week', '1month', '3months'] as const).map((r) => {
            const labels = {
              '1week': '1週間 (7日)',
              '1month': '1か月 (30日)',
              '3months': '3か月 (90日)',
            };
            const isSelected = timeRange === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? 'bg-white text-quest-mission shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {labels[r]}
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
              今日: {dailyData[dailyData.length - 1]?.starCount ?? 0}個
            </span>
          </div>
        </div>

        {/* 1. 集めた星の数 (棒グラフ: 日付軸) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-quest-mission" />
              集めた星の数（{rangeDescription}・日付別）
            </h2>
            {timeRange !== '1week' && (
              <span className="text-[10px] text-gray-400 font-semibold print:hidden">
                👉 横スクロールで全日確認できます
              </span>
            )}
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div
              className={`h-44 flex items-end gap-2 pt-6 border-b border-gray-100 pb-2 ${
                timeRange === '1week' ? 'w-full justify-between' : 'min-w-max px-2'
              }`}
            >
              {dailyData.map((data, idx) => {
                const heightPercent = (data.starCount / maxStars) * 80; // 最大80%の高さ
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center gap-2 group h-full justify-end ${
                      timeRange === '1week' ? 'flex-1' : 'w-10 flex-shrink-0'
                    }`}
                  >
                    <span className="text-[10px] font-black text-yellow-600">
                      {data.starCount > 0 ? `${data.starCount}★` : ''}
                    </span>
                    <div
                      className="w-full bg-yellow-200 rounded-t-lg transition-all duration-500 origin-bottom"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: data.starCount >= 5 ? '#FFCE54' : '#FFE8A3'
                      }}
                    />
                    <span className="text-[10px] font-bold text-text-muted whitespace-nowrap">
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

        {/* 2. 心の状態 (折れ線グラフ: 日付軸) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-quest-event" />
              心の状態（機嫌）の推移（{rangeDescription}）
            </h2>
            {timeRange !== '1week' && (
              <span className="text-[10px] text-gray-400 font-semibold print:hidden">
                👉 横スクロールできます
              </span>
            )}
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
                    {/* 点の二重丸 */}
                    <circle cx={p.x} cy={p.y} r="5" fill="#FFF" stroke="#FFCE54" strokeWidth="2.5" />
                    <circle cx={p.x} cy={p.y} r="2" fill="#FFCE54" />
                    
                    {/* 日付ラベル (M/D) */}
                    <text x={p.x} y="145" textAnchor="middle" className="text-[9px] font-bold fill-gray-400">
                      {p.label}
                    </text>

                    {/* 記録された日の絵文字ピン */}
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
            💡 **機嫌の波のポイント**:
            感情が「疲れた」「怒り」へ急激に下がっている日は、予定が多すぎたり、苦手な予定（宿題や片付けなど）と重なっていないか確認し、早めのサポートに繋げてください。
          </div>
        </section>

        {/* 3. できたこと日記の履歴 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-main flex items-center gap-1.5 px-1">
            <BookOpen className="w-5 h-5 text-quest-routine" />
            できたこと日記の履歴
          </h2>

          <div className="space-y-4">
            {diaries.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-xs font-bold text-text-muted">
                まだ日記（振り返り）が書かれていません。
              </div>
            ) : (
              [...diaries].reverse().map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 animate-fade-in"
                >
                  {/* ヘッダー：日付と感情 */}
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs font-semibold text-text-muted">{diary.date}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xl">{emotionEmojis[diary.emotion]}</span>
                      <span className="text-xs font-bold text-text-muted">
                        {emotionLabels[diary.emotion]}
                      </span>
                    </div>
                  </div>

                  {/* 内容 */}
                  <p className="text-sm text-text-main leading-relaxed font-medium select-text">
                    {diary.content}
                  </p>

                  {/* タグ情報（どこで・だれと・気持ち） */}
                  {(diary.location || diary.people || diary.feeling) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {diary.location && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          📍 {diary.location}
                        </span>
                      )}
                      {diary.people && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          👥 {diary.people}
                        </span>
                      )}
                      {diary.feeling && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          💖 {diary.feeling}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 親からのスタンプやフィードバック */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 print:hidden">
                    <button 
                      onClick={() => alert('花丸を贈りました！💮')}
                      className="text-xs font-bold text-quest-mission bg-quest-mission-bg px-3 py-1.5 rounded-full hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      花丸を贈る 💮
                    </button>
                    <button 
                      onClick={() => alert('いいね！を送信しました！👍')}
                      className="text-xs font-bold text-quest-routine bg-quest-routine-bg px-3 py-1.5 rounded-full hover:bg-green-100 active:scale-95 transition-all"
                    >
                      いいね！ 👍
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
