'use client';

import React from 'react';
import { type MapPin } from '@/types';
import { Sparkles, Check, Hourglass, ShieldAlert } from 'lucide-react';

interface QuestPinProps {
  pin: MapPin;
  stepNumber: number;
}

export default function QuestPin({ pin, stepNumber }: QuestPinProps) {
  const { type, status, isEventJudgmentDay } = pin;

  // 枠線の色（通常は統一テーマの青、特別な予定は虹色エフェクト）
  let borderClass = 'border-quest-mission';
  if (isEventJudgmentDay) {
    borderClass = 'animate-rainbow';
  }

  // 2. 状態色の定義（背景色とアイコン/テキスト）
  let bgClass = 'bg-gray-200 text-gray-500';
  let icon: React.ReactNode = <span className="font-bold text-lg">{stepNumber}</span>;

  if (status === 'pending') {
    bgClass = 'bg-yellow-100 text-yellow-600 border-dashed animate-pulse';
    icon = <Hourglass className="w-5 h-5" />;
  } else if (status === 'completed') {
    bgClass = 'bg-yellow-400 text-white animate-shine-gold';
    icon = <Check className="w-5 h-5" />;
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* ピンの本体（丸いぷっくりした形状） */}
      <div
        className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 ${borderClass} ${bgClass} relative`}
      >
        {status === 'completed' && (
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-500 animate-bounce" />
        )}
        {icon}

        {/* 左側に時間帯を表示 */}
        {pin.time && (
          <div className="absolute right-[76px] top-1/2 -translate-y-1/2 bg-blue-50 border border-blue-200 text-quest-mission text-[9px] font-extrabold px-2 py-1 rounded-xl shadow-sm whitespace-nowrap animate-fade-in z-20">
            {pin.time}
          </div>
        )}
      </div>

      {/* ラベル表示 */}
      <div className="mt-2 px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-semibold shadow-sm max-w-[120px] truncate text-center">
        {pin.title}
      </div>
    </div>
  );
}
