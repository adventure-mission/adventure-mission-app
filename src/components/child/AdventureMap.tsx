'use client';

import React from 'react';
import { type MapPin } from '@/types';
import { Sparkles, Check, Hourglass, Star, Clock } from 'lucide-react';

interface AdventureMapProps {
  pins: MapPin[];
  onPinSelect: (questId: string) => void;
}

export default function AdventureMap({ pins, onPinSelect }: AdventureMapProps) {
  if (pins.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center h-[60vh] select-none animate-fade-in">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-text-muted font-bold text-sm">今日の予定は登録されていません</p>
        <p className="text-xs text-text-muted mt-1">右下の「＋」ボタンから追加してください！</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-y-auto no-scrollbar w-full px-5 py-4 pb-24" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="space-y-3.5 max-w-md mx-auto">
        {pins.map((pin, index) => {
          const { questId, title, type, status, difficulty, isEventJudgmentDay, time } = pin;

          // 状態に応じたスタイル・アイコン
          let statusBg = 'bg-gray-100 border-gray-200 text-gray-500';
          let statusIcon = <span className="text-xs font-black">{index + 1}</span>;
          
          if (status === 'pending') {
            statusBg = 'bg-yellow-100 border-yellow-300 text-yellow-600 animate-pulse';
            statusIcon = <Hourglass className="w-4 h-4" />;
          } else if (status === 'completed') {
            statusBg = 'bg-yellow-400 border-yellow-500 text-white shadow-sm';
            statusIcon = <Check className="w-4 h-4 font-bold" />;
          }

          // カテゴリ別のカラーボーダー
          let borderTheme = 'border-quest-mission-bg border-l-quest-mission';
          let categoryLabel = 'ミッション';
          let categoryBadge = 'bg-quest-mission-bg text-quest-mission';

          if (type === 'routine') {
            borderTheme = 'border-quest-routine-bg border-l-quest-routine';
            categoryLabel = '約束事';
            categoryBadge = 'bg-quest-routine-bg text-quest-routine';
          } else if (type === 'event') {
            borderTheme = 'border-quest-event-bg border-l-quest-event';
            categoryLabel = 'イベント';
            categoryBadge = 'bg-quest-event-bg text-yellow-700';
          }

          if (isEventJudgmentDay) {
            borderTheme = 'border-rainbow-bg border-l-purple-500';
          }

          return (
            <div
              key={questId}
              onClick={() => onPinSelect(questId)}
              className={`flex items-center justify-between bg-white border-2 border-l-[8px] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${borderTheme} hover:shadow-md relative overflow-hidden`}
            >
              {status === 'completed' && (
                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-bounce" />
              )}

              {/* 左側: 時間と順序インジケータ */}
              <div className="flex items-center gap-3">
                {/* 状態/順序マーク */}
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold flex-shrink-0 ${statusBg}`}>
                  {statusIcon}
                </div>
                
                {/* 時間帯表示 */}
                <div className="flex flex-col min-w-[80px]">
                  <span className="text-[9px] font-bold text-text-muted flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    時間
                  </span>
                  <span className="text-[11px] font-extrabold text-text-main truncate">
                    {time || 'いつでも'}
                  </span>
                </div>
              </div>

              {/* 中央: 予定の内容タイトル */}
              <div className="flex-1 min-w-0 px-3 border-l border-gray-100 ml-1">
                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 ${categoryBadge}`}>
                  {categoryLabel}
                </span>
                <h3 className="text-sm font-bold text-text-main truncate leading-snug">
                  {title}
                </h3>
              </div>

              {/* 右側: 難易度（星数） */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {Array.from({ length: Math.min(difficulty, 4) }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
