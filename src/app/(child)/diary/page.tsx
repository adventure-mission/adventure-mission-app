'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Save, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DiaryPage() {
  const router = useRouter();
  const { addDiary } = useAppStore();
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<'happy' | 'good' | 'sad' | 'angry' | 'tired'>('good');
  
  // Hydration対策
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('なにか書いてみよう！');
      return;
    }

    // Zustandストアに日記を保存
    addDiary({
      date: new Date().toISOString().split('T')[0],
      content: content.trim(),
      emotion
    });

    // 保存完了演出
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    alert('日記を保存したよ！自己肯定感アップ✨');
    router.push('/route');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-12 select-none">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={() => router.push('/route')} className="text-text-muted hover:text-text-main">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-text-main text-lg">できたこと日記 📝</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* 気分選択 */}
          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <label className="text-sm font-bold text-text-muted block">今日のきぶんは？（えらんでね）</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'happy', emoji: '😆', label: 'うれしい！' },
                { id: 'good', emoji: '🙂', label: 'ふつう' },
                { id: 'sad', emoji: '😢', label: 'かなしい' },
                { id: 'angry', emoji: '😡', label: 'ぷんぷん' },
                { id: 'tired', emoji: '🥱', label: 'つかれた' }
              ].map((emo) => (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => setEmotion(emo.id as any)}
                  className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${
                    emotion === emo.id
                      ? 'border-yellow-400 bg-yellow-50 scale-[1.03] shadow-sm font-bold'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl mb-1">{emo.emoji}</span>
                  <span className="text-[9px] text-center leading-none">{emo.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 内容入力 */}
          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <label className="text-sm font-bold text-text-muted block">
              できたこと・楽しかったこと
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 今日は宿題をぜんぶできた！/ 友達と公園で走ったのが楽しかった！"
              rows={5}
              className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 text-sm text-text-main resize-none select-text"
            />
          </section>

          {/* 自己肯定感を高めるメッセージ */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex gap-3 items-start">
            <Heart className="w-5 h-5 text-red-400 fill-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800 leading-relaxed font-medium">
              できたこと日記を書くと、じぶんの「いいところ」がたくさん見つかるよ！
              どんな小さなことでも、できたことはぜんぶ大ぼうけんの成功だよ。
            </p>
          </div>

        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 rounded-full text-lg shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2"
        >
          <Save className="w-6 h-6" />
          <span>日記をのこす！</span>
        </button>

      </form>
    </div>
  );
}
