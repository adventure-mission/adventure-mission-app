'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Star, Save, Plus, Calendar, Sparkles, FileText, CheckSquare } from 'lucide-react';

const PRESETS = {
  mission: [
    '宿題をやる', '学校に行く', '公文の宿題', 'たいそうクラブ', '明日の用意をする',
    '朝起きる', '夜寝る', 'ごはんを食べる', '歯みがきをする', 'ペットのお世話', 'お片付け'
  ],
  event: ['歯医者のけんしん', '学校の運動会', '公文の進級テスト', 'たいそう大会']
};

export default function NewQuestPage() {
  const router = useRouter();
  const { addPresetQuest } = useAppStore();

  // マウントチェック (Next.js Hydrationエラー対策)
  const [mounted, setMounted] = useState(false);
  const [backUrl, setBackUrl] = useState('/dashboard');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'route') {
        setBackUrl('/route');
      }
    }
  }, []);
  
  // 基本ステート（予定：mission / イベント：event）
  const [category, setCategory] = useState<'mission' | 'event'>('mission');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  
  // 任意項目（めあて・ごほうび）
  const [goal, setGoal] = useState('');
  const [reward, setReward] = useState('');

  const handlePresetSelect = (preset: string) => {
    setTitle(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    // Zustand の presetQuests へ追加
    addPresetQuest({
      id: `pt_custom_${Date.now()}`,
      title: title.trim(),
      type: category,
      difficulty,
      goal: goal.trim() || undefined,
      reward: reward.trim() || undefined
    });

    alert('予定を設定（保存）しました！子供側の「予定を登録する」画面で選べるようになります。');
    router.push(backUrl);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-12 select-none">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={() => router.push(backUrl)} className="text-text-muted hover:text-text-main">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-text-main text-lg">予定を設定（プリセット登録）</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* 1. カテゴリー選択 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <label className="text-sm font-bold text-text-muted block">なにを設定する？</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'mission', label: '予定', color: 'bg-quest-mission text-white' },
              { id: 'event', label: 'イベント (成果)', color: 'bg-quest-event text-yellow-900' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id as any);
                  setTitle(''); // プリセット切り替えのため
                  setGoal('');
                  setReward('');
                }}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                  category === cat.id
                    ? `${cat.color} border-transparent shadow-md scale-[1.02]`
                    : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* 2. タイトルとプリセット */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-bold text-text-muted block mb-2">タイトル（すること）</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 公文の宿題、歯みがき"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-quest-mission text-sm text-text-main select-text"
              required
            />
          </div>

          {/* プリセット選択ボタン */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-2">よくつかうプリセット:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS[category].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="bg-gray-50 border border-gray-100 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-100 text-text-main transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. クエスト詳細用設定（難易度、目標、ご褒美） */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-6">
          
          {/* 難易度 */}
          <div>
            <label className="text-sm font-bold text-text-muted block mb-2">むずかしさ（あげる星の数）</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDifficulty(num)}
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-all"
                  style={{
                    borderColor: difficulty === num ? '#FFCE54' : '#E2E8F0',
                    backgroundColor: difficulty === num ? '#FFF9E6' : 'white',
                  }}
                >
                  <Star
                    className={`w-5 h-5 ${
                      difficulty >= num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 目標 (めあて) */}
          <div>
            <label className="text-sm font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-quest-mission" />
              目標（めあて - しなくてもよい）
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例: ていねいな字で3まい書く"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm text-text-main select-text"
            />
          </div>

          {/* ご褒美 (ごほうび) */}
          <div>
            <label className="text-sm font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-quest-event" />
              目標達成後のご褒美設定（ごほうび - しなくてもよい）
            </label>
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="例: ポケモンカードを1パックあげる"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm text-text-main select-text"
            />
          </div>

        </section>

        {/* 保存ボタン */}
        <button
          type="submit"
          className="w-full bg-quest-routine text-white font-bold py-4 rounded-full text-lg shadow-md active:scale-95 transition-transform hover:bg-green-500 flex justify-center items-center gap-2"
        >
          <Save className="w-6 h-6" />
          <span>これで設定（ほぞん）する！</span>
        </button>

      </form>
    </div>
  );
}
