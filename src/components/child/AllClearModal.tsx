'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Trophy, Star, Flame, CheckCircle2, ArrowRight, BookOpen, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AllClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  earnedStars: number;
  streakCount: number;
  userName?: string;
}

export default function AllClearModal({
  isOpen,
  onClose,
  completedCount,
  earnedStars,
  streakCount,
  userName = '礼',
}: AllClearModalProps) {
  const router = useRouter();

  // モーダルが開いた時に花火風の紙吹雪演出を発火
  useEffect(() => {
    if (!isOpen) return;

    // バイブレーション（対応端末）
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([60, 40, 60, 40, 120]);
    }

    // 連続して打ち上がる花火風紙吹雪
    const end = Date.now() + 2000;
    const colors = ['#FF6B6B', '#FFCE54', '#48CFAD', '#5D9CEC', '#AC92EC'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-yellow-200 relative overflow-hidden text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景のキラキラグラデーション */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-100 via-yellow-50 to-transparent pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* トロフィー・王冠のアイコン */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-400 to-orange-500 text-white shadow-xl shadow-yellow-300/60 mb-3 animate-bounce">
          <Trophy className="w-11 h-11 fill-white stroke-[2px]" />
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-300 animate-spin" />
        </div>

        {/* タイトル */}
        <div className="relative">
          <span className="inline-block text-[11px] font-black tracking-widest text-amber-700 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-200 shadow-xs mb-1">
            TODAY&apos;S ALL CLEAR!!
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            今日の予定、全クリ達成！🎉
          </h2>
          <p className="text-xs text-gray-600 font-bold mt-1">
            {userName}さん、今日もお疲れさまでした！
          </p>
        </div>

        {/* 実績サマリーカード */}
        <div className="grid grid-cols-3 gap-2 my-5 relative">
          {/* 予定完了数 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              クリア
            </span>
            <div className="text-lg font-black text-blue-700 mt-0.5">
              {completedCount}
              <span className="text-[10px] ml-0.5 font-bold">件</span>
            </div>
          </div>

          {/* 獲得星 */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] font-bold text-yellow-700 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
              ゲット
            </span>
            <div className="text-lg font-black text-yellow-700 mt-0.5">
              +{earnedStars}
              <span className="text-[10px] ml-0.5 font-bold">★</span>
            </div>
          </div>

          {/* 連続記録 */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
              連続
            </span>
            <div className="text-lg font-black text-orange-700 mt-0.5">
              {streakCount}
              <span className="text-[10px] ml-0.5 font-bold">日</span>
            </div>
          </div>
        </div>

        {/* 自由時間の宣言メッセージ */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 p-4 rounded-2xl border border-emerald-100 mb-5 text-left">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold shadow-xs">
              🎮
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-800">
                ここからは自由な時間！
              </h4>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5 leading-relaxed">
                やるべきことを全部やりきったよ！ゲームや読書、好きなことを思いっきり楽しもう！
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="space-y-2 relative">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-yellow-300/40 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>自由時間を楽しむ！ 🎮</span>
          </button>

          <button
            onClick={() => {
              onClose();
              router.push('/diary');
            }}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
            <span>できたこと日記を書く 📝</span>
          </button>
        </div>
      </div>
    </div>
  );
}
