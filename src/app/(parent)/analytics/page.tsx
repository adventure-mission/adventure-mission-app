'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, TrendingUp, BookOpen, Star, Sparkles, Smile, Printer, ShieldAlert } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { quests, diaries } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 1. 過去7日間の日付文字列リストを取得 (今日含む)
  const getPast7Days = () => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  };
  const past7Days = getPast7Days();

  // 曜日名
  const getDayName = (dateStr: string) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr).getDay()];
  };

  const emotionScores: Record<string, number> = {
    happy: 5,
    good: 4,
    sad: 3,
    tired: 2,
    angry: 1
  };

  const emotionLabels: Record<string, string> = {
    happy: 'うれしい！',
    good: 'ふつう',
    sad: 'かなしい',
    tired: 'つかれた',
    angry: 'ぷんぷん'
  };

  const emotionEmojis: Record<string, string> = {
    happy: '😆',
    good: '🙂',
    sad: '😢',
    tired: '🥱',
    angry: '😡'
  };

  // 2. 日ごとの予定達成数・獲得星数・感情を集計
  const dailyData = past7Days.map((dateStr) => {
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
      dayName: getDayName(dateStr),
      starCount,
      emotionScore: score,
      emotionEmoji: emoji,
      emotionType,
      content
    };
  });

  const maxStars = Math.max(...dailyData.map((d) => d.starCount), 1);
  const totalStarsThisWeek = dailyData.reduce((sum, d) => sum + d.starCount, 0);

  // SVG折れ線グラフ用座標計算 (X: 35〜315, Y: 20〜120)
  const svgPoints = dailyData.map((d, index) => {
    const x = 40 + index * 44;
    const y = 145 - d.emotionScore * 25; // 5=20px, 4=45px, 3=70px, 2=95px, 1=120px
    return { x, y, emoji: d.emotionEmoji, score: d.emotionScore };
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
        
        {/* 1. 今週あつめた星の数 (棒グラフ) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-quest-mission" />
            今週あつめた星の数
          </h2>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 pb-2">
            {dailyData.map((data, idx) => {
              const heightPercent = (data.starCount / maxStars) * 80; // 最大80%の高さ
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
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
                  <span className="text-[10px] font-bold text-text-muted">{data.dayName}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted font-bold pt-1">
            <span>今週の合計星獲得数:</span>
            <span className="text-sm text-yellow-600 font-black flex items-center gap-1 animate-pulse">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
              {totalStarsThisWeek} 個
            </span>
          </div>
        </section>

        {/* 2. 今週の心の状態 (折れ線グラフ) */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-muted flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-quest-event" />
            心の状態（きげん）の推移
          </h2>

          {/* SVG 折れ線グラフ */}
          <div className="relative pt-4">
            <svg viewBox="0 0 320 150" className="w-full h-auto overflow-visible">
              {/* 背景グリッド線 & ラベル */}
              {[
                { val: 5, label: '😆', name: 'うれしい' },
                { val: 4, label: '🙂', name: 'ふつう' },
                { val: 3, label: '😢', name: 'かなしい' },
                { val: 2, label: '🥱', name: 'つかれ' },
                { val: 1, label: '😡', name: 'ぷんぷん' }
              ].map((grid) => {
                const y = 145 - grid.val * 25;
                return (
                  <g key={grid.val} className="opacity-45">
                    <line x1="30" y1={y} x2="310" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3" />
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
                  <circle cx={p.x} cy={p.y} r="6" fill="#FFF" stroke="#FFCE54" strokeWidth="2.5" />
                  <circle cx={p.x} cy={p.y} r="2" fill="#FFCE54" />
                  
                  {/* 曜日名 */}
                  <text x={p.x} y="145" textAnchor="middle" className="text-[9px] font-bold fill-gray-400">
                    {dailyData[idx].dayName}
                  </text>

                  {/* 記録された日の絵文字ピン（グラフ上部に小さくホバー表示風） */}
                  {p.emoji && (
                    <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-xs">
                      {p.emoji}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] font-semibold text-gray-700 leading-relaxed">
            💡 **きげんの波のポイント**:
            感情が「つかれ」「ぷんぷん」へ急激に下がっている曜日は、予定が多すぎたり、苦手な予定（宿題や片付けなど）と重なっていないか確認し、早めのサポートに繋げてください。
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
                まだ日記（ふりかえり）が書かれていません。
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

                  {/* 親からのスタンプやフィードバック */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 print:hidden">
                    <button 
                      onClick={() => alert('はなまるをあげました！💮')}
                      className="text-xs font-bold text-quest-mission bg-quest-mission-bg px-3 py-1.5 rounded-full hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      はなまるをあげる 💮
                    </button>
                    <button 
                      onClick={() => alert('いいね！をおくりました！👍')}
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
