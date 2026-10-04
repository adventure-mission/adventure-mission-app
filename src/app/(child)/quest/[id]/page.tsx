'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { type SubTask } from '@/types';
import { useQuestSync } from '@/hooks/useQuestSync';
import { useAppStore } from '@/store/useAppStore';
import TaskSlider from '@/components/child/TaskSlider';
import { ArrowLeft, Star, Compass, CheckCircle2, Clock, MapPin as MapPinIcon, Users, FileText, CheckSquare, Sparkles } from 'lucide-react';

export default function QuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { updateQuestStatus } = useQuestSync();
  const { quests, updateQuestStatus: updateLocalQuestStatus, updateQuest } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);

  // マウントチェック (Next.js Hydrationエラー対策)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const questId = params.id as string;
  const quest = quests.find((q) => q.id === questId);

  const handleDelay = () => {
    if (!quest) return;
    
    let newTime = quest.time;
    if (quest.time) {
      const match = quest.time.match(/(\d+)時から(\d+)時まで/);
      if (match) {
        const start = Number(match[1]);
        const end = Number(match[2]);
        newTime = `${start}時30分から${end}時30分まで`;
      } else {
        newTime = `${quest.time}（30分おくれ）`;
      }
    } else {
      newTime = '30分おくれ';
    }

    updateQuest(quest.id, { time: newTime });
    alert('予定を30分おくらせたよ！⏰');
    router.push('/route');
  };

  const handleSkip = () => {
    if (!quest) return;
    if (confirm('きょうはこの予定をおやすみ（スキップ）する？')) {
      updateQuest(quest.id, { status: 'skipped' });
      alert('きょうはおやすみにしたよ！のんびりしてね 🍵');
      router.push('/route');
    }
  };

  // 動的なやることリスト（小項目チェック）の組み立て
  const getDynamicSubTasks = (): SubTask[] => {
    if (!quest) return [];

    const tasks: SubTask[] = [
      { id: 'st_title', quest_id: quest.id, title: `${quest.title} をやりましょう 🚀`, sort_order: 1 }
    ];

    let order = 2;

    // 時間・場所・だれと の確認ステップ
    if (quest.time || quest.location || quest.people) {
      const details = [
        quest.time ? `じかん: ${quest.time}` : '',
        quest.location ? `ばしょ: ${quest.location}` : '',
        quest.people ? `だれと: ${quest.people}` : ''
      ].filter(Boolean).join('、');

      tasks.push({
        id: 'st_details',
        quest_id: quest.id,
        title: `${details} を確認しよう 🔎`,
        sort_order: order++
      });
    }

    // 目標 (めあて) のステップ
    if (quest.goal) {
      tasks.push({
        id: 'st_goal',
        quest_id: quest.id,
        title: `めあて: ${quest.goal} 🎯`,
        sort_order: order++
      });
    }

    // 約束 (ルール) のステップ
    if (quest.promise) {
      tasks.push({
        id: 'st_promise',
        quest_id: quest.id,
        title: `やくそく: ${quest.promise} 🤝`,
        sort_order: order++
      });
    }

    // ご褒美 (ごほうび) のステップ
    if (quest.reward) {
      tasks.push({
        id: 'st_reward',
        quest_id: quest.id,
        title: `ごほうび: ${quest.reward} 🎁✨`,
        sort_order: order++
      });
    }

    return tasks;
  };

  const dynamicSubTasks = getDynamicSubTasks();

  // 1. 小項目スライダー完了ハンドラ
  const handleFinish = async (completedIds: string[]) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Zustandローカル状態の更新（即時地図に反映）
      updateLocalQuestStatus(questId, 'pending');

      // Supabase & IndexedDB の同期更新
      await updateQuestStatus(questId, 'pending', todayStr);
    } catch (err) {
      console.error('報告エラー:', err);
    } finally {
      // ルート画面へ戻る
      router.push('/route');
    }
  };

  if (!mounted) return null;

  if (!quest) {
    return (
      <div className="flex-1 flex flex-col h-screen justify-center items-center bg-background-light p-6">
        <p className="text-text-muted font-bold mb-4">予定が見つかりませんでした。</p>
        <button
          onClick={() => router.push('/route')}
          className="bg-quest-mission text-white px-6 py-2.5 rounded-full font-bold shadow-sm"
        >
          地図にもどる
        </button>
      </div>
    );
  }

  // 2. 「ぼうけんをはじめる」プレイ画面
  if (isPlaying) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-white">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white z-10">
          <button onClick={() => setIsPlaying(false)} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-text-main truncate">{quest.title}</h1>
        </header>
        <TaskSlider subTasks={dynamicSubTasks} onFinish={handleFinish} />
      </div>
    );
  }

  // 3. 詳細待機画面
  return (
    <div className="flex-1 flex flex-col h-screen justify-between bg-background-light p-6 select-none">
      
      {/* 上部ヘッダーと基本情報 */}
      <div>
        <button
          onClick={() => router.push('/route')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main py-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>地図にもどる</span>
        </button>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md space-y-4">
          {/* カテゴリバッジ */}
          <div>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
              quest.type === 'routine'
                ? 'bg-quest-routine-bg text-quest-routine'
                : quest.type === 'event'
                ? 'bg-quest-event-bg text-yellow-700'
                : 'bg-quest-mission-bg text-quest-mission'
            }`}>
              {quest.type === 'routine' ? '約束事' : quest.type === 'event' ? 'イベント' : 'ミッション'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-main leading-snug">
            {quest.title}
          </h1>

          {/* 難易度表示（星マーク） */}
          <div className="flex items-center gap-1.5 py-2 border-t border-b border-gray-50">
            <span className="text-xs font-bold text-text-muted mr-2">むずかしさ:</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < quest.difficulty
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>

          {/* 予定の追加属性の表示 */}
          <div className="space-y-3 text-sm pt-2 text-text-muted border-b border-gray-50 pb-4">
            {quest.time && (
              <p className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">時間</span>
                <span className="text-text-main font-medium">{quest.time}</span>
              </p>
            )}
            {quest.location && (
              <p className="flex items-center gap-2.5">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">場所</span>
                <span className="text-text-main font-medium">{quest.location}</span>
              </p>
            )}
            {quest.people && (
              <p className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">誰と</span>
                <span className="text-text-main font-medium">{quest.people}</span>
              </p>
            )}
            {quest.goal && (
              <p className="flex items-center gap-2.5 pt-1">
                <FileText className="w-4 h-4 text-quest-mission" />
                <span className="font-bold text-xs bg-blue-50 text-quest-mission border border-blue-100 px-2 py-0.5 rounded flex-shrink-0">めあて</span>
                <span className="text-text-main font-bold">{quest.goal}</span>
              </p>
            )}
            {quest.promise && (
              <p className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-quest-routine" />
                <span className="font-bold text-xs bg-green-50 text-quest-routine border border-green-100 px-2 py-0.5 rounded flex-shrink-0">やくそく</span>
                <span className="text-text-main font-bold">{quest.promise}</span>
              </p>
            )}
            {quest.reward && (
              <p className="flex items-center gap-2.5 pt-1">
                <Sparkles className="w-4 h-4 text-quest-event" />
                <span className="font-bold text-xs bg-yellow-50 text-yellow-600 border border-yellow-100 px-2 py-0.5 rounded flex-shrink-0">ごほうび</span>
                <span className="text-text-main font-bold">{quest.reward}</span>
              </p>
            )}
          </div>

          {/* 中項目の道（やることリスト）のプレビュー */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-text-muted mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              ぼうけんのロードマップ
            </h3>
            <ul className="space-y-2.5">
              {dynamicSubTasks.map((task, idx) => (
                <li key={task.id} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-bold text-text-main">{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 下部：アクションボタン群 */}
      <div className="space-y-3 w-full">
        {/* メイン開始ボタン */}
        {quest.status === 'todo' && (
          <button
            onClick={() => setIsPlaying(true)}
            className="w-full bg-quest-mission text-white font-bold py-4 rounded-full text-lg shadow-md active:scale-95 transition-transform hover:bg-blue-500 flex justify-center items-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            ぼうけんを はじめる！
          </button>
        )}

        {/* 逃げ道ボタン（あとにする・おやすみ） */}
        {quest.status === 'todo' && (
          <div className="flex gap-3">
            <button
              onClick={handleDelay}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-quest-mission border border-blue-200 font-bold py-3 rounded-full text-xs shadow-sm active:scale-95 transition-all flex justify-center items-center gap-1.5"
            >
              <span>⏰ あとにする (30分)</span>
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-text-muted border border-gray-200 font-bold py-3 rounded-full text-xs shadow-sm active:scale-95 transition-all flex justify-center items-center gap-1.5"
            >
              <span>🍵 きょうはおやすみ</span>
            </button>
          </div>
        )}

        {/* 既にスキップまたは完了している場合の戻るボタン */}
        {quest.status !== 'todo' && (
          <button
            onClick={() => router.push('/route')}
            className="w-full bg-gray-200 text-gray-700 font-bold py-4 rounded-full text-lg shadow-md active:scale-95 transition-transform hover:bg-gray-300 flex justify-center items-center gap-2"
          >
            地図にもどる
          </button>
        )}
      </div>

    </div>
  );
}
