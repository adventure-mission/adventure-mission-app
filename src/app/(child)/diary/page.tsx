'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Save, Heart, Sparkles, MapPin, Users, HelpCircle, Smile, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const LOCATION_OPTIONS = [
  { id: '家', label: '家', emoji: '🏠' },
  { id: '学校', label: '学校', emoji: '🏫' },
  { id: '習い事', label: '習い事', emoji: '⚽' },
  { id: 'その他', label: 'その他', emoji: '✏️' },
];

const PEOPLE_OPTIONS = [
  { id: '家族', label: '家族', emoji: '👨‍👩‍👧' },
  { id: '友達', label: '友達', emoji: '👦' },
  { id: 'その他', label: 'その他', emoji: '✏️' },
];

const FEELING_OPTIONS = [
  { id: '嬉しかった', label: '嬉しかった', emoji: '😆', defaultEmotion: 'happy' as const },
  { id: '楽しかった', label: '楽しかった', emoji: '😊', defaultEmotion: 'good' as const },
  { id: '驚いた', label: '驚いた', emoji: '😲', defaultEmotion: 'happy' as const },
  { id: '悲しかった', label: '悲しかった', emoji: '😢', defaultEmotion: 'sad' as const },
  { id: '痛かった', label: '痛かった', emoji: '😣', defaultEmotion: 'tired' as const },
  { id: 'その他', label: 'その他', emoji: '💭', defaultEmotion: 'good' as const },
];

export default function DiaryPage() {
  const router = useRouter();
  const { addDiary, diaries } = useAppStore();

  // 1. どこで？
  const [locationChoice, setLocationChoice] = useState<string>('学校');
  const [customLocation, setCustomLocation] = useState<string>('');

  // 2. だれと？
  const [peopleChoice, setPeopleChoice] = useState<string>('友達');
  const [customPeople, setCustomPeople] = useState<string>('');

  // 3. 何があった？（テキスト入力）
  const [eventText, setEventText] = useState<string>('');

  // 4. どんな気持ちになった？
  const [feelingChoice, setFeelingChoice] = useState<string>('楽しかった');
  const [customFeeling, setCustomFeeling] = useState<string>('');

  // Hydration対策
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 確定値の解決
  const resolvedLocation = locationChoice === 'その他' ? (customLocation.trim() || 'その他') : locationChoice;
  const resolvedPeople = peopleChoice === 'その他' ? (customPeople.trim() || 'その他') : peopleChoice;
  const resolvedFeeling = feelingChoice === 'その他' ? (customFeeling.trim() || 'その他') : feelingChoice;

  // 感情タイプの自動推定
  const getEmotionType = (): 'happy' | 'good' | 'sad' | 'angry' | 'tired' => {
    const found = FEELING_OPTIONS.find((f) => f.id === feelingChoice);
    if (found && found.id !== 'その他') {
      return found.defaultEmotion;
    }
    const t = customFeeling.toLowerCase();
    if (t.includes('怒') || t.includes('悔し') || t.includes('いらいら')) return 'angry';
    if (t.includes('疲') || t.includes('痛') || t.includes('だる')) return 'tired';
    if (t.includes('悲') || t.includes('泣') || t.includes('さみし')) return 'sad';
    if (t.includes('嬉') || t.includes('喜') || t.includes('最高') || t.includes('すご')) return 'happy';
    return 'good';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventText.trim()) {
      alert('「何があった？」を入力してください！\n（例: テストで100点取れた！ / ドッジボールで勝った！）');
      return;
    }

    if (locationChoice === 'その他' && !customLocation.trim()) {
      alert('「どこで？」の場所を入力してください！');
      return;
    }

    if (peopleChoice === 'その他' && !customPeople.trim()) {
      alert('「だれと？」の相手を入力してください！');
      return;
    }

    if (feelingChoice === 'その他' && !customFeeling.trim()) {
      alert('「どんな気持ち？」の気持ちを入力してください！');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const emotion = getEmotionType();

    // 自然な文章としての日記本文
    const sentenceContent = `${resolvedLocation}で、${resolvedPeople}と、${eventText.trim()}。（気持ち: ${resolvedFeeling}）`;

    // Zustandストアに日記を保存
    addDiary({
      date: todayStr,
      content: sentenceContent,
      location: resolvedLocation,
      people: resolvedPeople,
      event: eventText.trim(),
      feeling: resolvedFeeling,
      emotion,
    });

    // バイブレーション（対応端末）
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 50, 60]);
    }

    // 保存完了演出
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFCE54', '#48CFAD', '#5D9CEC', '#FF6B6B'],
    });

    alert('🎉 日記を保存しました！今日のできたことが記録されたよ✨');
    router.push('/route');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-16 select-none">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/route')}
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            title="予定表へ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-gray-800 text-lg">できたこと日記 📝</h1>
            <p className="text-[11px] font-bold text-gray-400">今日あった良いことを振り返ろう！</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg mx-auto w-full">
        
        {/* 1. どこで？ */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2.5">
          <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>どこで？</span>
          </label>

          <div className="grid grid-cols-4 gap-2">
            {LOCATION_OPTIONS.map((loc) => {
              const isSelected = locationChoice === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocationChoice(loc.id)}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-600 shadow-sm scale-102 ring-2 ring-blue-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{loc.emoji}</span>
                  <span className="text-xs font-black">{loc.label}</span>
                </button>
              );
            })}
          </div>

          {/* その他のテキスト入力 */}
          {locationChoice === 'その他' && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="text"
                placeholder="場所を入力（例: 公園、図書館、祖父母の家）"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-xs font-bold text-gray-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
          )}
        </section>

        {/* 2. だれと？ */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2.5">
          <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>だれと？</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {PEOPLE_OPTIONS.map((p) => {
              const isSelected = peopleChoice === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeopleChoice(p.id)}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm scale-102 ring-2 ring-emerald-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-xs font-black">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* その他のテキスト入力 */}
          {peopleChoice === 'その他' && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="text"
                placeholder="相手を入力（例: ひとり、先生、いとこ）"
                value={customPeople}
                onChange={(e) => setCustomPeople(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-gray-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-400/30"
              />
            </div>
          )}
        </section>

        {/* 3. 何があった？（テキスト入力） */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
          <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>何があった？ <span className="text-red-500">*</span></span>
          </label>
          <textarea
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="例: 算数のテストで100点取れた！ / ドッジボールで最後まで生き残った！ / 宿題をぜんぶ終わらせた！"
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-xs font-bold text-gray-800 resize-none select-text leading-relaxed"
          />
        </section>

        {/* 4. どんな気持ちになった？ */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2.5">
          <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-orange-500" />
            <span>どんな気持ちになった？</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {FEELING_OPTIONS.map((f) => {
              const isSelected = feelingChoice === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeelingChoice(f.id)}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm scale-102 ring-2 ring-amber-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-xs font-black">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* その他のテキスト入力 */}
          {feelingChoice === 'その他' && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="text"
                placeholder="どんな気持ち？（例: ドキドキした、悔しかった、スッキリした）"
                value={customFeeling}
                onChange={(e) => setCustomFeeling(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-bold text-gray-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
          )}
        </section>

        {/* リアルタイム日記プレビューカード */}
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-4 border border-amber-200/90 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>今日の日記プレビュー</span>
          </div>

          <p className="text-xs font-bold text-gray-800 leading-relaxed bg-white/80 p-3 rounded-2xl border border-amber-100">
            {resolvedLocation}で、{resolvedPeople}と、{eventText.trim() || '（何があったかを書こう！）'}。
            <span className="block mt-1 text-amber-800 font-extrabold">
              気持ち: {resolvedFeeling} ✨
            </span>
          </p>
        </div>

        {/* 自己肯定感メッセージ */}
        <div className="bg-yellow-50/70 border border-yellow-200/80 rounded-2xl p-3.5 flex gap-2.5 items-start">
          <Heart className="w-4 h-4 text-red-500 fill-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-yellow-900 leading-relaxed font-medium">
            できたこと日記を書くと、自分の「良いところ」がたくさん見つかるよ！どんな小さなことでも、できたことは立派な達成です。
          </p>
        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-black text-base rounded-2xl shadow-lg shadow-yellow-300/40 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5 stroke-[2.5px]" />
          <span>日記を保存する！ ✨</span>
        </button>

        {/* これまでの日記（直近の履歴） */}
        {diaries.length > 0 && (
          <div className="pt-6 space-y-3">
            <h3 className="font-black text-gray-700 text-xs px-1">
              これまでに書いた日記 ({diaries.length}件)
            </h3>
            <div className="space-y-3">
              {[...diaries].reverse().slice(0, 3).map((d) => (
                <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-bold">{d.date}</span>
                    {d.feeling && (
                      <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {d.feeling}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">
                    {d.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
