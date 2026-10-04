'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Save, Calendar, Clock, MapPin as MapPinIcon, Users, FileText, CheckSquare, Target, Settings, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

function QuestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { presetQuests, addQuest, quests, updateQuest } = useAppStore();

  // マウントチェック (Next.js Hydrationエラー対策)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // フォームステート
  const [date, setDate] = useState('');
  
  // 時間帯ステート（何時から何時まで）
  const [isTimeRangeActive, setIsTimeRangeActive] = useState(false);
  const [startTime, setStartTime] = useState('9');
  const [endTime, setEndTime] = useState('17');
  
  // どこで（場所）ステート
  const [selectedLocation, setSelectedLocation] = useState('おうち');
  const [customLocation, setCustomLocation] = useState('');
  
  // だれと（一緒の人）ステート
  const [selectedPerson, setSelectedPerson] = useState('ひとりで');
  const [customPerson, setCustomPerson] = useState('');
  
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [promise, setPromise] = useState('');
  const [reward, setReward] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  
  // 繰り返し設定
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [questType, setQuestType] = useState<'mission' | 'routine' | 'event'>('mission');

  // 初期日付を今日にセット
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  // 編集モード時の初期データロード
  useEffect(() => {
    if (editId) {
      let target = quests.find((q) => q.id === editId);
      if (target) {
        // もしインスタンス（子予定）だった場合、大元のマスター予定の繰り返し設定などを読み込む
        if (target.parentRecurringId) {
          const master = quests.find((q) => q.id === target?.parentRecurringId);
          if (master) {
            target = master;
          }
        }

        setTitle(target.title);
        setDate(target.date);
        setQuestType(target.type);
        setDifficulty(target.difficulty);
        setGoal(target.goal || '');
        setPromise(target.promise || '');
        setReward(target.reward || '');
        setIsRecurring(!!target.isRecurring);
        setRecurrenceDays(target.recurrenceDays || []);

        // 時間帯の逆変換
        if (target.time) {
          setIsTimeRangeActive(true);
          const match = target.time.match(/(\d+)時から(\d+)時まで/);
          if (match) {
            setStartTime(match[1]);
            setEndTime(match[2]);
          }
        } else {
          setIsTimeRangeActive(false);
        }

        // 場所の逆変換
        const presetLocations = ['おうち', '学校', 'こうえん', 'きょうしつ', 'ならいごと'];
        if (target.location) {
          if (presetLocations.includes(target.location)) {
            setSelectedLocation(target.location);
            setCustomLocation('');
          } else {
            setSelectedLocation('その他');
            setCustomLocation(target.location);
          }
        }

        // 一緒の人の逆変換
        const presetPeople = ['ひとりで', 'おかあさん', 'おとうさん', 'おともだち', 'せんせい'];
        if (target.people) {
          if (presetPeople.includes(target.people)) {
            setSelectedPerson(target.people);
            setCustomPerson('');
          } else {
            setSelectedPerson('その他');
            setCustomPerson(target.people);
          }
        }
      }
    }
  }, [editId, quests]);

  // 親の設定（プリセットテンプレート）が選ばれたときの自動入力
  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const template = presetQuests.find((p) => p.id === selectedId);
    if (template) {
      setTitle(template.title);
      setGoal(template.goal || '');
      setPromise(template.promise || '');
      setReward(template.reward || '');
      setDifficulty(template.difficulty);
      setQuestType(template.type);
      setIsRecurring(false);
      setRecurrenceDays([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('日付を入力してください');
      return;
    }
    if (!title.trim()) {
      alert('「何をする」を入力してください');
      return;
    }
    if (!promise.trim()) {
      alert('「約束」を入力してください');
      return;
    }

    // 時間帯、場所、だれとの設定値を取得
    const timeValue = isTimeRangeActive ? `${startTime}時から${endTime}時まで` : undefined;
    const locationValue = selectedLocation === 'その他' ? customLocation.trim() : selectedLocation;
    const peopleValue = selectedPerson === 'その他' ? customPerson.trim() : selectedPerson;

    if (selectedLocation === 'その他' && !customLocation.trim()) {
      alert('「場所（どこで）」を入力してください');
      return;
    }

    if (selectedPerson === 'その他' && !customPerson.trim()) {
      alert('「一緒の人」を入力してください');
      return;
    }

    if (isRecurring && recurrenceDays.length === 0) {
      alert('繰り返しにする曜日をえらんでね');
      return;
    }

    if (editId) {
      const target = quests.find((q) => q.id === editId);
      const updateTargetId = target?.parentRecurringId || editId;

      updateQuest(updateTargetId, {
        title,
        type: questType,
        date,
        time: timeValue,
        location: locationValue || undefined,
        people: peopleValue || undefined,
        goal: goal.trim() || undefined,
        promise: promise.trim() || undefined,
        reward: reward.trim() || undefined,
        difficulty,
        isRecurring,
        recurrenceDays,
      });

      alert('予定を変更したよ！✨');
    } else {
      addQuest({
        title,
        type: questType,
        date,
        time: timeValue,
        location: locationValue || undefined,
        people: peopleValue || undefined,
        goal: goal.trim() || undefined,
        promise: promise.trim() || undefined,
        reward: reward.trim() || undefined,
        difficulty,
        isRecurring,
        recurrenceDays,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      alert('予定を登録したよ！地図を確認してみてね 🗺️✨');
    }

    router.push('/route');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light pb-12 select-none">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={() => router.push('/route')} className="text-text-muted hover:text-text-main">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-text-main text-lg">
          {editId ? '予定を変更する ✏️' : '予定を登録する 📝'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* 0. プリセットから選ぶ（連動機能） */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-quest-routine" />
            設定された予定からえらぶ（任意）
          </label>
          <select
            onChange={handlePresetSelect}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none bg-gray-50 text-sm text-text-main font-bold"
          >
            <option value="">-- えらばずに自分で入力する --</option>
            {presetQuests.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title} ({preset.type === 'routine' ? '約束' : preset.type === 'mission' ? 'ミッション' : 'イベント'})
              </option>
            ))}
          </select>
        </section>

        {/* 1. 基本設定 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* 日付 (必須) */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Calendar className="w-4 h-4 text-quest-mission" />
              日付（ひにち） <span className="text-red-500 font-extrabold text-sm">※</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-bold text-text-main bg-white"
              required
            />
          </div>

          {/* 繰り返し設定 */}
          <div className="pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={() => {
                const nextState = !isRecurring;
                setIsRecurring(nextState);
                if (nextState) {
                  const currentDay = new Date(date || Date.now()).getDay();
                  setRecurrenceDays([currentDay]);
                } else {
                  setRecurrenceDays([]);
                }
              }}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${
                isRecurring
                  ? 'bg-blue-50 border-blue-200 text-quest-mission shadow-sm'
                  : 'bg-gray-50 border-gray-100 text-text-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">🔁 毎週くりかえす</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-quest-mission' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isRecurring ? 'right-1' : 'left-1'}`} />
              </div>
            </button>

            {isRecurring && (
              <div className="mt-3 bg-gray-50 border border-gray-100 p-4 rounded-2xl animate-fade-in space-y-2">
                <label className="text-[11px] font-bold text-text-muted block">くりかえす曜日（えらんでね）</label>
                <div className="grid grid-cols-7 gap-1">
                  {[
                    { val: 1, label: '月' },
                    { val: 2, label: '火' },
                    { val: 3, label: '水' },
                    { val: 4, label: '木' },
                    { val: 5, label: '金' },
                    { val: 6, label: '土' },
                    { val: 0, label: '日' }
                  ].map((d) => {
                    const isSelected = recurrenceDays.includes(d.val);
                    return (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRecurrenceDays(recurrenceDays.filter((x) => x !== d.val));
                          } else {
                            setRecurrenceDays([...recurrenceDays, d.val]);
                          }
                        }}
                        className={`py-2 rounded-lg text-xs font-bold text-center border transition-all ${
                          isSelected
                            ? 'bg-quest-mission text-white border-transparent shadow-sm'
                            : 'bg-white text-text-muted border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 何をする (必須) */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Target className="w-4 h-4 text-quest-event" />
              何をする（よてい） <span className="text-red-500 font-extrabold text-sm">※</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 公文の宿題、たいそうクラブ"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text"
              required
            />
          </div>
        </section>

        {/* 2. 任意項目（日時と場所） */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* 時間帯 */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              時間帯（じかん）
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimeRangeActive(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    !isTimeRangeActive
                      ? 'bg-quest-mission text-white border-transparent shadow-sm'
                      : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  ✨ いつでも
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimeRangeActive(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isTimeRangeActive
                      ? 'bg-quest-mission text-white border-transparent shadow-sm'
                      : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  ⏰ 時間をきめる
                </button>
              </div>

              {isTimeRangeActive && (
                <div className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-2xl animate-fade-in">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none text-sm font-bold text-text-main bg-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString()).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-text-muted">時 から</span>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none text-sm font-bold text-text-main bg-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString()).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-text-muted">時 まで</span>
                </div>
              )}
            </div>
          </div>

          {/* どこで */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              どこで（場所）
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'おうち', label: '🏠 おうち' },
                  { value: 'がっこう', label: '🏫 がっこう' },
                  { value: 'こうえん', label: '🛝 こうえん' },
                  { value: 'じゅく・ならいごと', label: '✏️ ならいごと' },
                  { value: 'きょうしつ', label: '🚪 きょうしつ' },
                  { value: 'その他', label: '📍 その他' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(opt.value);
                      if (opt.value !== 'その他') {
                        setCustomLocation('');
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all border ${
                      selectedLocation === opt.value
                        ? 'bg-quest-mission text-white border-transparent shadow-sm scale-[1.02]'
                        : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selectedLocation === 'その他' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="どこでするか場所を入力してね"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text animate-fade-in"
                  required
                />
              )}
            </div>
          </div>

          {/* だれと */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              だれと（一緒の人）
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'ひとりで', label: '👤 ひとりで' },
                  { value: 'おかあさん', label: '👩 おかあさん' },
                  { value: 'おとうさん', label: '👨 おとうさん' },
                  { value: 'おともだち', label: '👦 おともだち' },
                  { value: 'せんせい', label: '🏫 せんせい' },
                  { value: 'その他', label: '✏️ その他' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedPerson(opt.value);
                      if (opt.value !== 'その他') {
                        setCustomPerson('');
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all border ${
                      selectedPerson === opt.value
                        ? 'bg-quest-routine text-white border-transparent shadow-sm scale-[1.02]'
                        : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selectedPerson === 'その他' && (
                <input
                  type="text"
                  value={customPerson}
                  onChange={(e) => setCustomPerson(e.target.value)}
                  placeholder="だれと一緒か入力してね"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text animate-fade-in"
                  required
                />
              )}
            </div>
          </div>
        </section>

        {/* 3. 任意項目（目標と約束・ごほうび） */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* 目標 */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-quest-mission" />
              目標（めあて）
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例: プリントを3まいがんばる"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text"
            />
          </div>

          {/* 約束 */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <CheckSquare className="w-4 h-4 text-quest-routine" />
              約束（ルール） <span className="text-red-500 font-extrabold text-sm">※</span>
            </label>
            <input
              type="text"
              value={promise}
              onChange={(e) => setPromise(e.target.value)}
              placeholder="例: おわったらペンをかたづける"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text"
              required
            />
          </div>

          {/* ごほうび */}
          <div>
            <label className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-quest-event" />
              ごほうび（目標達成のご褒美 - しなくてもよい）
            </label>
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="例: おかしを食べる、新しいおもちゃ"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm font-semibold text-text-main select-text"
            />
          </div>
        </section>

        {/* 4. カテゴリ選択 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <label className="text-xs font-bold text-text-muted block">予定の種類</label>
          <div className="flex gap-2">
            {[
              { id: 'mission', label: 'ミッション', color: 'bg-quest-mission text-white' },
              { id: 'routine', label: '約束事', color: 'bg-quest-routine text-white' },
              { id: 'event', label: 'イベント', color: 'bg-quest-event text-yellow-900' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setQuestType(cat.id as any)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  questType === cat.id
                    ? `${cat.color} border-transparent shadow-sm`
                    : 'bg-gray-50 text-text-muted border-gray-100 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* 登録ボタン */}
        <button
          type="submit"
          className="w-full bg-quest-routine text-white font-bold py-4 rounded-full text-lg shadow-md active:scale-95 transition-transform hover:bg-green-500 flex justify-center items-center gap-2"
        >
          <Save className="w-6 h-6" />
          <span>{editId ? 'これで設定を変更する！' : 'これで登録する！'}</span>
        </button>

      </form>
    </div>
  );
}

export default function NewQuestChildPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center h-screen bg-background-light">
        <span className="text-sm font-bold text-text-muted">よみこみちゅう...</span>
      </div>
    }>
      <QuestForm />
    </Suspense>
  );
}
