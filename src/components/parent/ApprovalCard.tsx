'use client';

import React from 'react';
import { Star, CheckCircle, Clock, RotateCcw } from 'lucide-react';

export interface ApprovalItem {
  logId: string;
  questTitle: string;
  childName: string;
  difficulty: number;
  bonusStars?: number;
  completedAt: string;
  type: 'mission' | 'routine' | 'event';
}

interface ApprovalCardProps {
  item: ApprovalItem;
  onApprove: (logId: string, totalStarsEarned: number) => void;
  onReject?: (logId: string) => void;
}

export default function ApprovalCard({ item, onApprove, onReject }: ApprovalCardProps) {
  const { logId, questTitle, childName, difficulty, bonusStars = 0, completedAt, type } = item;

  // 難易度に応じたプレゼント星数 (難易度 1〜4 + ボーナス星)
  const totalStarsEarned = difficulty + bonusStars;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
      {/* 上部：バッジと完了時刻 */}
      <div className="flex justify-between items-center">
        {bonusStars > 0 || type === 'event' ? (
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
            ⭐ 特別な予定
          </span>
        ) : (
          <span className="text-xs font-bold text-text-muted">
            予定の完了報告
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 報告</span>
        </div>
      </div>

      {/* 中部：ミッション名と子供の名前 */}
      <div>
        <h3 className="text-lg font-bold text-text-main leading-tight mb-1">
          {questTitle}
        </h3>
        <p className="text-xs text-text-muted">
          名前: <span className="font-semibold text-text-main">{childName}</span>
        </p>
      </div>

      {/* 下部：星の数とアクションボタン群 */}
      <div className="flex justify-between items-center border-t border-gray-50 pt-3 flex-wrap gap-2">
        {/* 付与する星の数 */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-text-muted">付与する星:</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(difficulty, 4) }).map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 text-yellow-400 fill-yellow-400"
              />
            ))}
            {bonusStars > 0 && (
              <span className="text-xs font-extrabold text-yellow-600 ml-1">
                +{bonusStars}⭐
              </span>
            )}
          </div>
        </div>

        {/* ボタン群（再挑戦 ＆ 承認する） */}
        <div className="flex items-center gap-2">
          {onReject && (
            <button
              onClick={() => onReject(logId)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 font-bold px-3 py-2 rounded-full text-xs transition-all active:scale-95 border border-gray-200"
              title="未完了に戻す"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再挑戦</span>
            </button>
          )}

          <button
            onClick={() => onApprove(logId, totalStarsEarned)}
            className="flex items-center gap-1.5 bg-yellow-400 text-white font-bold px-4 py-2 rounded-full text-xs shadow-sm hover:bg-yellow-500 active:scale-95 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>承認する！✨</span>
          </button>
        </div>
      </div>
    </div>
  );
}
