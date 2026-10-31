'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Wish, WishCategory } from '@/types';
import {
  ArrowLeft,
  Plus,
  Star,
  Gift,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORY_MAP: Record<WishCategory, { label: string; emoji: string; color: string }> = {
  toy: { label: 'おもちゃ・ゲーム', emoji: '🎮', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  food: { label: 'たべもの', emoji: '🍔', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  place: { label: 'おでかけ', emoji: '🎡', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  experience: { label: '体験・約束', emoji: '🛹', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function WishesPage() {
  const router = useRouter();
  const {
    profile,
    wishes,
    addWish,
    allocateStarsToWish,
    requestWishGrant,
    deleteWish,
  } = useAppStore();

  const childStars = profile?.total_stars ?? 12;

  // タブ状態: 'saving' (貯金中・申請中・交換待ち) | 'granted' (叶ったもの)
  const [activeTab, setActiveTab] = useState<'saving' | 'granted'>('saving');

  // モーダル管理
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [chargeWish, setChargeWish] = useState<Wish | null>(null);

  // 新規登録フォーム状態
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WishCategory>('toy');
  const [memo, setMemo] = useState('');
  const [starSettingMethod, setStarSettingMethod] = useState<'preset' | 'price' | 'custom'>('preset');
  const [presetStar, setPresetStar] = useState<number>(50);
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [customStar, setCustomStar] = useState<number>(30);

  // 計算された希望星数
  const calculatedStars =
    starSettingMethod === 'preset'
      ? presetStar
      : starSettingMethod === 'price'
      ? Math.max(1, Math.round((Number(estimatedPrice) || 0) / 10))
      : customStar;

  // 新規登録の送信
  const handleCreateWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addWish({
      title: title.trim(),
      category,
      memo: memo.trim() || undefined,
      required_stars: Math.max(1, calculatedStars),
      estimated_price: estimatedPrice ? Number(estimatedPrice) : undefined,
      status: 'pending_review',
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFCE54', '#48CFAD', '#5D9CEC'],
    });

    // フォームリセット
    setTitle('');
    setMemo('');
    setEstimatedPrice('');
    setStarSettingMethod('preset');
    setPresetStar(50);
    setIsAddModalOpen(false);
  };

  // チャージ（星の分配）実行
  const handleAllocate = (amount: number) => {
    if (!chargeWish) return;
    const ok = allocateStarsToWish(chargeWish.id, amount);
    if (ok) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40]);
      }
      if (amount > 0) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#FFD700', '#FFA500'],
        });
      }
      // 最新のwishオブジェクトでモーダル内状態も更新
      const updated = wishes.find((w) => w.id === chargeWish.id);
      if (updated) {
        setChargeWish(updated);
      }
    }
  };

  // 交換リクエストの送信（100%達成時）
  const handleRequestGrant = (wishId: string) => {
    requestWishGrant(wishId);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF6B6B', '#FFCE54', '#48CFAD', '#AC92EC'],
    });
    alert('🎉 おうちの人に「プレゼント交換のお願い」を送りました！届くまで楽しみに待とう！');
  };

  // フィルタリング
  const activeWishes = wishes.filter((w) => w.status !== 'granted');
  const grantedWishes = wishes.filter((w) => w.status === 'granted');
  const displayedWishes = activeTab === 'saving' ? activeWishes : grantedWishes;

  // 貯金中の星の総計
  const totalAllocatedStars = activeWishes.reduce((sum, w) => sum + w.allocated_stars, 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light select-none pb-20">
      {/* 上部ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/route')}
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            title="予定表へ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-500" />
            <h1 className="font-bold text-text-main text-base sm:text-lg">ほしいものリスト</h1>
          </div>
        </div>

        {/* 使える星バッジ */}
        <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200/90 px-3 py-1.5 rounded-full shadow-xs">
          <span className="text-[11px] font-bold text-yellow-800">使える星:</span>
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <span className="font-black text-yellow-800 text-sm">{childStars}</span>
        </div>
      </header>

      {/* サマリーバー */}
      <div className="px-6 py-3 bg-gradient-to-r from-red-50/80 via-amber-50/80 to-yellow-50/80 border-b border-orange-100/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-600 font-bold">
            目標: <strong className="text-gray-900">{activeWishes.length}</strong> 件
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-bold">
            貯金中: <strong className="text-yellow-700">★{totalAllocatedStars}</strong> 個
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1 bg-quest-mission text-white rounded-full font-bold shadow-xs hover:bg-blue-600 active:scale-95 transition-all text-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>追加する</span>
        </button>
      </div>

      {/* タブ切り替え */}
      <div className="px-6 pt-3 pb-1">
        <div className="flex bg-gray-100 rounded-full p-1 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab('saving')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              activeTab === 'saving'
                ? 'bg-white text-text-main shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            ためているもの ({activeWishes.length})
          </button>
          <button
            onClick={() => setActiveTab('granted')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              activeTab === 'granted'
                ? 'bg-white text-text-main shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            叶ったもの 🏆 ({grantedWishes.length})
          </button>
        </div>
      </div>

      {/* ほしいもの一覧 */}
      <div className="px-6 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {displayedWishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm mt-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
              {activeTab === 'saving' ? '🎁' : '🏆'}
            </div>
            <h3 className="font-bold text-gray-800 text-sm">
              {activeTab === 'saving' ? 'ほしいものがまだ登録されていません' : '叶ったご褒美はまだありません'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              {activeTab === 'saving'
                ? '今自分が欲しいものや行きたい場所を登録して、星を貯金していこう！'
                : '目標まで星をためて、おうちの人にプレゼントしてもらおう！'}
            </p>
            {activeTab === 'saving' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-quest-mission text-white text-xs font-bold rounded-full shadow-sm hover:bg-blue-600 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>ほしいものを登録する</span>
              </button>
            )}
          </div>
        ) : (
          displayedWishes.map((wish) => {
            const cat = CATEGORY_MAP[wish.category] || CATEGORY_MAP.toy;
            const percent = Math.min(100, Math.round((wish.allocated_stars / wish.required_stars) * 100));
            const isFull = wish.allocated_stars >= wish.required_stars;
            const remaining = Math.max(0, wish.required_stars - wish.allocated_stars);

            return (
              <div
                key={wish.id}
                className="bg-white rounded-3xl p-5 border-2 border-gray-100 hover:border-yellow-200 transition-all shadow-sm relative overflow-hidden"
              >
                {/* 状態ラベルバッジ */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${cat.color} flex items-center gap-1`}>
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                    {wish.estimated_price && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        約{wish.estimated_price.toLocaleString()}円
                      </span>
                    )}
                  </div>

                  {wish.status === 'pending_review' && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                      ⏳ 査定中 (希望: ★{wish.required_stars})
                    </span>
                  )}
                  {wish.status === 'ready_to_grant' && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                      🎉 交換待ち！
                    </span>
                  )}
                  {wish.status === 'granted' && (
                    <span className="text-[10px] font-black bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full border border-yellow-300">
                      🏆 交換完了
                    </span>
                  )}
                </div>

                {/* タイトルとメモ */}
                <h3 className="text-base font-black text-gray-800 leading-snug mb-1">
                  {wish.title}
                </h3>
                {wish.memo && (
                  <p className="text-xs text-gray-500 font-medium mb-3">
                    💬 {wish.memo}
                  </p>
                )}

                {/* プログレスバー（進行状況） */}
                {wish.status !== 'pending_review' ? (
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-bold text-[11px]">たまった星:</span>
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                        <span className="font-black text-gray-800 text-sm">
                          {wish.allocated_stars}
                        </span>
                        <span className="text-gray-400 text-xs font-bold">/ ★{wish.required_stars}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs text-yellow-700">
                          {percent}%
                        </span>
                        {!isFull && (
                          <span className="text-[10px] text-gray-400 font-bold ml-1.5">
                            (あと★{remaining})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* バー */}
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-sm'
                            : 'bg-gradient-to-r from-amber-300 to-yellow-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 my-2 text-xs text-amber-900 font-medium">
                    おうちの人が必要な星の数を確認・決定しています。決まったら星の貯金ができるようになるよ！
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-3">
                  <div className="text-[11px] text-gray-400 font-bold">
                    {wish.status === 'granted'
                      ? '✨ 楽しんでね！'
                      : isFull
                      ? '🎉 目標達成！'
                      : wish.status === 'saving'
                      ? 'コツコツためよう！'
                      : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 貯金中：星チャージボタン */}
                    {wish.status === 'saving' && !isFull && (
                      <button
                        onClick={() => setChargeWish(wish)}
                        className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white font-black text-xs rounded-full shadow-sm active:scale-95 transition-all"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>星をためる</span>
                      </button>
                    )}

                    {/* 100%達成：交換リクエストボタン */}
                    {wish.status === 'saving' && isFull && (
                      <button
                        onClick={() => handleRequestGrant(wish.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-black text-xs rounded-full shadow-md shadow-red-200 animate-bounce active:scale-95 transition-all"
                      >
                        <Gift className="w-4 h-4 fill-white" />
                        <span>交換をお願いする！🎁</span>
                      </button>
                    )}

                    {/* すでに交換リクエスト済み */}
                    {wish.status === 'ready_to_grant' && (
                      <div className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>おうちの人にお願い中</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 星チャージ（分配）モーダル */}
      {chargeWish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setChargeWish(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-yellow-200 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setChargeWish(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-500" />
            </div>

            <h3 className="font-black text-gray-800 text-lg">星をためる</h3>
            <p className="text-xs text-gray-500 font-bold mt-0.5">
              「{chargeWish.title}」に星をチャージ
            </p>

            {/* 現在の状況 */}
            <div className="bg-yellow-50/70 border border-yellow-200/80 rounded-2xl p-3 my-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600 font-bold">このアイテムに貯金済み:</span>
                <span className="font-black text-yellow-800 text-sm">
                  ★ {chargeWish.allocated_stars} / {chargeWish.required_stars}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-yellow-200/50 pt-1">
                <span className="text-gray-600 font-bold">手元の使える星:</span>
                <span className="font-black text-yellow-800 text-sm">
                  ★ {childStars} 個
                </span>
              </div>
            </div>

            {/* チャージボタン群 */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-500 block text-left px-1">
                何個チャージする？
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10].map((amt) => {
                  const disabled = childStars < amt;
                  return (
                    <button
                      key={amt}
                      disabled={disabled}
                      onClick={() => handleAllocate(amt)}
                      className="py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-100 text-white disabled:text-gray-300 font-black rounded-xl text-xs shadow-xs active:scale-95 transition-all"
                    >
                      +{amt}★
                    </button>
                  );
                })}
                <button
                  disabled={childStars <= 0}
                  onClick={() => handleAllocate(childStars)}
                  className="py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 text-white disabled:text-gray-300 font-black rounded-xl text-xs shadow-xs active:scale-95 transition-all"
                >
                  ぜんぶ
                </button>
              </div>
            </div>

            {/* 払い戻し（手元に戻す）オプション */}
            {chargeWish.allocated_stars > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 block text-left px-1 mb-1.5">
                  貯金した星を手元にもどす:
                </span>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleAllocate(-1)}
                    className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 active:scale-95 transition-all"
                  >
                    -1★ もどす
                  </button>
                  {chargeWish.allocated_stars >= 5 && (
                    <button
                      onClick={() => handleAllocate(-5)}
                      className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 active:scale-95 transition-all"
                    >
                      -5★ もどす
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setChargeWish(null)}
              className="w-full mt-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
            >
              とじる
            </button>
          </div>
        </div>
      )}

      {/* 新規ほしいもの登録モーダル */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-base">新しいほしいものを追加</h3>
                <p className="text-[11px] text-gray-500 font-bold">おうちの人に申請して星の数を決めてもらおう！</p>
              </div>
            </div>

            <form onSubmit={handleCreateWish} className="space-y-4 text-left">
              {/* ほしいもの名 */}
              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">
                  ほしいもの・やりたいこと <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: ポケモンカード、回転寿司に行きたい"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-quest-mission/20 focus:border-quest-mission outline-hidden"
                />
              </div>

              {/* カテゴリ */}
              <div>
                <label className="text-xs font-black text-gray-700 block mb-1.5">
                  カテゴリ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CATEGORY_MAP) as WishCategory[]).map((catKey) => {
                    const c = CATEGORY_MAP[catKey];
                    const isSelected = category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{c.emoji}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 星の決め方（ハイブリッド方式） */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
                    <span>希望する星の数</span>
                  </label>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    希望: ★{calculatedStars}個
                  </span>
                </div>

                {/* 切り替えタブ */}
                <div className="flex bg-white/80 p-1 rounded-xl border border-amber-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setStarSettingMethod('preset')}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                      starSettingMethod === 'preset' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    目安から選ぶ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStarSettingMethod('price')}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                      starSettingMethod === 'price' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    値段から計算
                  </button>
                  <button
                    type="button"
                    onClick={() => setStarSettingMethod('custom')}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                      starSettingMethod === 'custom' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    自由入力
                  </button>
                </div>

                {/* 1. 目安プリセット */}
                {starSettingMethod === 'preset' && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPresetStar(15)}
                      className={`p-2 rounded-xl text-center border font-bold text-xs transition-all ${
                        presetStar === 15 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-amber-100 text-gray-700'
                      }`}
                    >
                      <span className="block text-[10px] text-gray-500">🥉 プチ</span>
                      <strong className="text-sm">★15</strong>
                      <span className="block text-[9px] text-gray-400">お菓子など</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetStar(50)}
                      className={`p-2 rounded-xl text-center border font-bold text-xs transition-all ${
                        presetStar === 50 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-amber-100 text-gray-700'
                      }`}
                    >
                      <span className="block text-[10px] text-gray-500">🥈 ふつう</span>
                      <strong className="text-sm">★50</strong>
                      <span className="block text-[9px] text-gray-400">本や外食</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetStar(150)}
                      className={`p-2 rounded-xl text-center border font-bold text-xs transition-all ${
                        presetStar === 150 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-amber-100 text-gray-700'
                      }`}
                    >
                      <span className="block text-[10px] text-gray-500">🥇 大物</span>
                      <strong className="text-sm">★150</strong>
                      <span className="block text-[9px] text-gray-400">ゲームなど</span>
                    </button>
                  </div>
                )}

                {/* 2. 値段から計算 */}
                {starSettingMethod === 'price' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="例: 500"
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-800 outline-hidden"
                      />
                      <span className="text-xs font-bold text-gray-600">円</span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-bold block">
                      ※ 10円につき ★1個 で自動計算されます
                    </span>
                  </div>
                )}

                {/* 3. 自由入力 */}
                {starSettingMethod === 'custom' && (
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={customStar}
                      onChange={(e) => setCustomStar(Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-800 outline-hidden"
                    />
                    <span className="text-xs font-bold text-gray-600">個で申請</span>
                  </div>
                )}

                <p className="text-[10px] text-amber-700 font-medium">
                  ※ 登録後、おうちの人が確認して星の数が正式に決まります。
                </p>
              </div>

              {/* 理由・メモ */}
              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">
                  理由・熱意のメモ（任意）
                </label>
                <textarea
                  rows={2}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="例: テストで100点取ったらほしい！"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-quest-mission/20 focus:border-quest-mission outline-hidden resize-none"
                />
              </div>

              {/* 登録ボタン */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md shadow-red-200 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>おうちの人に申請する 🚀</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
