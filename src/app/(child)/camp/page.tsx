'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Moon, Star, Flame } from 'lucide-react';

export default function CampView() {
  const { profile } = useAppStore();

  return (
    <div className="flex-1 flex flex-col h-screen justify-between night-bg text-white p-8 relative overflow-hidden select-none">
      
      {/* 満天の星空エフェクト (簡易的にドットで表現) */}
      <div className="absolute inset-0 pointer-events-none opacity-40 star-flicker">
        <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="absolute top-24 left-1/3 w-1 h-1 bg-yellow-100 rounded-full"></div>
        <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="absolute top-40 right-1/4 w-1 h-1 bg-yellow-200 rounded-full"></div>
        <div className="absolute bottom-48 left-16 w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="absolute bottom-60 right-16 w-1 h-1 bg-white rounded-full"></div>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Moon className="w-6 h-6 text-yellow-300" />
          <span className="font-bold text-sm text-blue-200">キャンプ地</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
          <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          <span className="font-bold text-sm text-yellow-200">
            {profile?.total_stars ?? 12} 個の星
          </span>
        </div>
      </div>

      {/* 中央ビジュアル：キャンプサイト */}
      <div className="flex flex-col items-center justify-center flex-1 my-10 z-10">
        {/* テントと焚き火のビジュアル */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* テント（アースカラー） */}
          <div className="absolute top-4 w-44 h-40 bg-[#c5a880] rounded-t-[100px] border-b-[16px] border-[#a68a62] shadow-inner flex items-end justify-center">
            {/* テントの入り口 */}
            <div className="w-16 h-20 bg-[#5c4d3c] rounded-t-full relative">
              {/* 中で寝ているアバター風 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-200 rounded-full border border-[#5c4d3c] flex items-center justify-center text-[10px]">
                💤
              </div>
            </div>
          </div>

          {/* 焚き火 */}
          <div className="absolute bottom-2 flex flex-col items-center">
            {/* 炎（ゆらゆら揺れるアニメーション） */}
            <div className="flex items-center justify-center animate-bounce duration-1000">
              <Flame className="w-14 h-14 text-orange-500 fill-orange-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
            </div>
            {/* 薪（クロスした木の棒） */}
            <div className="flex gap-1.5 -mt-1 z-10">
              <div className="w-8 h-2.5 bg-[#5c3d2e] rounded-full rotate-[20deg]" />
              <div className="w-8 h-2.5 bg-[#5c3d2e] rounded-full -rotate-[20deg] -ml-4" />
            </div>
          </div>
        </div>

        {/* メッセージ */}
        <div className="text-center mt-6 max-w-xs">
          <h2 className="text-xl font-bold text-yellow-200 mb-2">
            今日の冒険は終了
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            焚き火を囲んで、ゆっくりエネルギーを蓄えよう。明日も素敵な冒険が待っているよ。おやすみなさい ⛺⭐
          </p>
        </div>
      </div>

      {/* 下部：がんばりの肯定 */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center z-10">
        <span className="text-xs text-blue-200 font-semibold block mb-1">
          今日集めた星
        </span>
        <div className="flex justify-center items-center gap-1">
          <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-spin duration-[6s]" />
          <span className="text-lg font-bold text-yellow-200">
            皆で頑張ったよ！
          </span>
        </div>
      </div>
    </div>
  );
}
