'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { type MapPin } from '@/types';
import { Play, Check, Hourglass, Star, Gift, Clock, Sparkles, Edit } from 'lucide-react';

interface QuestListProps {
  pins: MapPin[];
  onPinSelect: (questId: string) => void;
  onComplete?: (questId: string) => void;
}

export default function QuestList({ pins, onPinSelect, onComplete }: QuestListProps) {
  const router = useRouter();

  if (pins.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center h-[calc(100vh-180px)] bg-background-light">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">
          📭
        </div>
        <p className="text-sm font-bold text-text-muted">今日の予定はありません。</p>
        <p className="text-xs text-text-muted mt-1">右下の「＋」ボタンから予定を追加しよう！</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4 bg-background-light h-[calc(100vh-180px)]">
      {pins.map((pin, idx) => {
        const { questId, title, status, difficulty, isEventJudgmentDay, bonusStars, time } = pin;

        // 1. スタイルとアイコン（統一テーマ ＆ 特別な予定のアクセント）
        let cardBgClass = 'bg-white border-gray-100 hover:border-blue-200 shadow-sm';
        let emoji = '📌';

        if (isEventJudgmentDay) {
          cardBgClass = 'bg-gradient-to-r from-amber-50/90 to-yellow-50/90 border-amber-200 hover:border-amber-300 shadow-sm';
          emoji = '⭐';
        }

        // お休み（スキップ）状態のスタイル
        if (status === 'skipped') {
          cardBgClass = 'bg-gray-100 border-gray-200 opacity-60';
          emoji = '🍵';
        }

        // 2. ステータス別のアクションボタン表示
        let actionButton = (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onComplete) {
                onComplete(questId);
              } else {
                onPinSelect(questId);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-quest-mission text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-blue-600"
            title="完了して親に報告する"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>できた！</span>
          </button>
        );

        if (status === 'pending') {
          actionButton = (
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-bold rounded-xl animate-pulse flex-shrink-0"
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>確認中</span>
            </div>
          );
        } else if (status === 'completed') {
          actionButton = (
            <div className="flex items-center gap-1 px-4 py-2.5 bg-yellow-400 text-white text-xs font-bold rounded-xl shadow-inner shadow-yellow-500/30 flex-shrink-0">
              <Check className="w-4 h-4 stroke-[3px]" />
              <span>達成！</span>
            </div>
          );
        } else if (status === 'skipped') {
          actionButton = (
            <div className="flex items-center gap-1 px-4 py-2.5 bg-gray-300 text-gray-600 text-xs font-bold rounded-xl flex-shrink-0">
              <span>お休み</span>
            </div>
          );
        }

        return (
          <div
            key={questId}
            onClick={() => onPinSelect(questId)}
            className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border-2 transition-all relative cursor-pointer hover:shadow-md ${cardBgClass}`}
          >
            {status === 'completed' && (
              <Sparkles className="absolute -top-2 -right-1 w-5 h-5 text-yellow-500 animate-bounce" />
            )}

            {/* 左側＆中央の情報エリア */}
            <div className="flex items-start gap-4 flex-1">
              {/* アイコンバッジ */}
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                {emoji}
              </div>

              {/* コンテンツ */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 特別な予定バッジ */}
                  {isEventJudgmentDay && status !== 'skipped' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 shadow-xs">
                      <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                      特別な予定 (+{bonusStars ?? 5}★)
                    </span>
                  )}
                  {status === 'skipped' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      お休み
                    </span>
                  )}
                  
                  {/* 時間バブル */}
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-text-muted bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {time || 'いつでも'}
                  </span>
                </div>

                <h3 className="font-bold text-text-main text-base leading-snug truncate">
                  {title}
                </h3>

                {/* 難易度(星数) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: difficulty }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${status === 'skipped' ? 'text-gray-300 fill-gray-300' : 'text-yellow-400 fill-yellow-400'}`} />
                  ))}
                  {isEventJudgmentDay && status !== 'skipped' && (
                    <span className="text-[10px] font-black text-amber-600 ml-1.5 flex items-center gap-0.5">
                      <Gift className="w-3 h-3" />
                      ボーナス星 +{bonusStars ?? 5}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右側のアクションボタンエリア */}
            <div className="mt-4 md:mt-0 flex justify-end items-center flex-shrink-0 md:pl-4 border-t md:border-t-0 border-gray-100/50 pt-3 md:pt-0">
              {/* 編集ボタン */}
              {status !== 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/quest/new?edit=${questId}`);
                  }}
                  className="flex items-center justify-center w-9 h-9 border border-gray-200 bg-white hover:bg-gray-50 text-text-muted hover:text-text-main rounded-xl transition-all mr-2 flex-shrink-0 shadow-sm active:scale-95"
                  title="予定を変更する"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {actionButton}
            </div>
          </div>
        );
      })}
    </div>
  );
}
