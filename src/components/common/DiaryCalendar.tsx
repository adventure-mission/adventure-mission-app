'use client';

import React, { useState, useMemo } from 'react';
import { DiaryEntry } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  BookOpen,
  MapPin,
  Users,
  Heart,
  Smile,
} from 'lucide-react';

interface DiaryCalendarProps {
  diaries: DiaryEntry[];
  isParentView?: boolean;
}

const EMOTIONS: Record<string, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  happy: { emoji: '😆', label: '嬉しい！', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  good: { emoji: '🙂', label: '楽しかった', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  sad: { emoji: '😢', label: '悲しい', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  tired: { emoji: '🥱', label: '疲れた', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  angry: { emoji: '😡', label: '怒り', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

export default function DiaryCalendar({ diaries, isParentView = true }: DiaryCalendarProps) {
  // 今日の日付文字列 (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 直近の日記がある日付、または今日を初期選択
  const initialDate = useMemo(() => {
    if (diaries.length > 0) {
      const sorted = [...diaries].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].date;
    }
    return todayStr;
  }, [diaries, todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // 表示中の年月
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const init = new Date(initialDate);
    return isNaN(init.getTime()) ? new Date() : init;
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed (0=1月, 11=12月)

  // 月移動
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleTodayMonth = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayStr);
  };

  // カレンダーマトリクスの生成 (日曜日〜土曜日)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 1日の曜日 (0=日, ..., 6=土)
    const totalDays = new Date(year, month + 1, 0).getDate(); // 当月の日数
    const prevMonthTotalDays = new Date(year, month, 0).getDate(); // 前月の日数

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // 前月分の穴埋め
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 当月分
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 翌月分の穴埋め (合計が7の倍数になるまで)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const d = new Date(year, month + 1, dayNum);
        const dateStr = d.toISOString().split('T')[0];
        cells.push({
          dateStr,
          dayNumber: dayNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
        });
      }
    }

    return cells;
  }, [year, month, todayStr]);

  // 日付ごとの日記インデックスマップ
  const diariesByDate = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {};
    diaries.forEach((d) => {
      if (!map[d.date]) {
        map[d.date] = [];
      }
      map[d.date].push(d);
    });
    return map;
  }, [diaries]);

  // 今月書かれた日記の日数
  const thisMonthDiaryCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const uniqueDates = new Set(diaries.filter((d) => d.date.startsWith(prefix)).map((d) => d.date));
    return uniqueDates.size;
  }, [diaries, year, month]);

  // 選択された日の日記一覧
  const selectedDiaries = diariesByDate[selectedDate] || [];

  // 日付フォーマット関数 (例: 2026年11月7日(土))
  const formatFullDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][new Date(dateStr).getDay()];
    return `${y}年${m}月${d}日 (${dayOfWeek})`;
  };

  return (
    <div className="space-y-4">
      {/* カレンダーカード本体 */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-quest-routine" />
            <h3 className="font-black text-gray-800 text-base">
              {year}年 {month + 1}月
            </h3>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              日記: {thisMonthDiaryCount}日分
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTodayMonth}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              今月
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="前月"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="次月"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 text-center border-b border-gray-100 pb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, idx) => (
            <div
              key={d}
              className={`text-xs font-black ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付セルグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            const hasDiary = Boolean(diariesByDate[cell.dateStr]?.length);
            const isSelected = cell.dateStr === selectedDate;
            const primaryDiary = diariesByDate[cell.dateStr]?.[0];
            const emo = primaryDiary ? EMOTIONS[primaryDiary.emotion] || EMOTIONS.good : null;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[58px] p-1 rounded-2xl flex flex-col items-center justify-between transition-all relative group ${
                  isSelected
                    ? 'ring-2 ring-quest-mission bg-blue-50/60 shadow-sm'
                    : hasDiary
                    ? 'bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/60'
                    : cell.isCurrentMonth
                    ? 'hover:bg-gray-50 border border-transparent'
                    : 'opacity-35 hover:opacity-60'
                }`}
              >
                {/* 日付番号と今日バッジ */}
                <div className="flex items-center gap-0.5">
                  <span
                    className={`text-xs font-black ${
                      cell.isToday
                        ? 'w-5 h-5 rounded-full bg-quest-mission text-white flex items-center justify-center text-[10px]'
                        : isSelected
                        ? 'text-quest-mission font-black'
                        : cell.isCurrentMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* 日記の感情アイコン表示 */}
                <div className="h-6 flex items-center justify-center">
                  {hasDiary && emo ? (
                    <span
                      className="text-lg leading-none transform group-hover:scale-110 transition-transform drop-shadow-xs"
                      title={`${emo.label} の日記`}
                    >
                      {emo.emoji}
                    </span>
                  ) : cell.isToday ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-quest-mission opacity-50" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-1 border-t border-gray-50 px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300 inline-block" />
              <span>日記あり</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-quest-mission inline-block" />
              <span>今日</span>
            </span>
          </div>
          <span>日付をタップすると日記が読めます</span>
        </div>
      </div>

      {/* 選択した日の日記表示カード */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-quest-routine" />
            <h4 className="font-bold text-sm text-gray-800">
              {formatFullDate(selectedDate)}
            </h4>
          </div>
          {selectedDiaries.length > 0 && (
            <span className="text-xs font-bold text-quest-routine bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {selectedDiaries.length}件の日記
            </span>
          )}
        </div>

        {selectedDiaries.length === 0 ? (
          <div className="py-8 text-center text-gray-400 space-y-1">
            <p className="text-2xl">📖</p>
            <p className="text-xs font-bold text-gray-500">
              この日の日記はまだ書かれていません
            </p>
            <p className="text-[11px] text-gray-400">
              カレンダーの日記マーク（絵文字）がある日をタップして読んでみよう！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDiaries.map((diary) => {
              const emo = EMOTIONS[diary.emotion] || EMOTIONS.good;

              return (
                <div
                  key={diary.id}
                  className="bg-gradient-to-br from-amber-50/40 via-white to-yellow-50/30 rounded-2xl p-4 border border-amber-100 space-y-3 shadow-xs animate-fade-in"
                >
                  {/* 感情表示バッジ */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl">{emo.emoji}</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${emo.bg} ${emo.text} ${emo.border}`}>
                        {diary.feeling ? diary.feeling : emo.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">
                      記録済み ✨
                    </span>
                  </div>

                  {/* 日記本文 */}
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-gray-100/80 select-text">
                    {diary.content}
                  </p>

                  {/* タグ情報（どこで・だれと・気持ち） */}
                  {(diary.location || diary.people || diary.feeling) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {diary.location && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {diary.location}
                        </span>
                      )}
                      {diary.people && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {diary.people}
                        </span>
                      )}
                      {diary.feeling && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                          {diary.feeling}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 親からのスタンプやフィードバック (親画面表示時) */}
                  {isParentView && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-amber-100/60 print:hidden">
                      <button
                        type="button"
                        onClick={() => alert('花丸を贈りました！💮')}
                        className="text-xs font-bold text-quest-mission bg-quest-mission-bg px-3.5 py-1.5 rounded-full hover:bg-blue-100 active:scale-95 transition-all shadow-xs"
                      >
                        花丸を贈る 💮
                      </button>
                      <button
                        type="button"
                        onClick={() => alert('いいね！を送信しました！👍')}
                        className="text-xs font-bold text-quest-routine bg-quest-routine-bg px-3.5 py-1.5 rounded-full hover:bg-green-100 active:scale-95 transition-all shadow-xs"
                      >
                        いいね！ 👍
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
