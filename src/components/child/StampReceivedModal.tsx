'use client';

import React, { useEffect } from 'react';
import { Star, Sparkles, X, Heart, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StampReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  questTitle: string;
  stampText: string;
  earnedStars: number;
}

export default function StampReceivedModal({
  isOpen,
  onClose,
  questTitle,
  stampText,
  earnedStars,
}: StampReceivedModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // 心地よいバイブレーション（対応端末）
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 50, 60]);
    }

    // スタンプ到着のお祝い紙吹雪
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#FF6B6B', '#FFCE54', '#48CFAD', '#AC92EC'],
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // スタンプ文字列から絵文字とテキストを分割（例: "💮 たいへんよくできました"）
  const parts = stampText.split(' ');
  const emoji = parts[0] || '💮';
  const label = parts.slice(1).join(' ') || stampText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-200 relative overflow-hidden text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景のやわらかなグラデーション */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-100/80 to-transparent pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 手紙アイコン */}
        <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-300/40 mb-2">
          <span className="text-2xl animate-bounce">💌</span>
        </div>

        {/* 見出し */}
        <div className="relative">
          <span className="inline-block text-[11px] font-black tracking-wide text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 shadow-xs mb-1">
            親からのメッセージ！
          </span>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            スタンプが届いたよ！
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-1">
            「{questTitle}」が承認されました ✨
          </p>
        </div>

        {/* 特大スタンプ印鑑デザイン（ポン！と押されたような傾き演出） */}
        <div className="my-6 relative flex justify-center">
          <div className="inline-flex flex-col items-center justify-center px-6 py-4 bg-amber-50/70 border-3 border-dashed border-amber-500/80 rounded-3xl shadow-md rotate-[-3deg] transform hover:rotate-0 transition-transform duration-300">
            <span className="text-5xl mb-1.5 filter drop-shadow">{emoji}</span>
            <span className="text-base font-black text-amber-900 tracking-wide">
              {label}
            </span>
          </div>
        </div>

        {/* 獲得した星の案内 */}
        <div className="bg-yellow-50 border border-yellow-200/80 rounded-2xl p-3 flex items-center justify-center gap-2 mb-5">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400 animate-spin" />
          <span className="text-xs font-bold text-yellow-800">
            星を <strong className="text-sm font-black text-yellow-900">+{earnedStars}個</strong> ゲットしました！
          </span>
        </div>

        {/* 受け取りボタン */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md shadow-orange-300/40 active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>ありがとう！受け取る ✨</span>
        </button>
      </div>
    </div>
  );
}
