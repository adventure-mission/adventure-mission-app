'use client';

import React, { useState } from 'react';
import { type SubTask } from '@/types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskSliderProps {
  subTasks: SubTask[];
  onFinish: (completedSubTaskIds: string[]) => void;
}

export default function TaskSlider({ subTasks, onFinish }: TaskSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const currentTask = subTasks[currentIndex];
  const isLast = currentIndex === subTasks.length - 1;

  // チェックを入れる・外す
  const toggleComplete = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      // 完了したときに効果音（バイブレーション想定）やキラキラを出す
      if (next[taskId]) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#5D9CEC', '#48CFAD', '#FFCE54']
        });
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < subTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    // 完了したIDのリストを親へ返す
    const completedIds = subTasks
      .filter((t) => completedTasks[t.id])
      .map((t) => t.id);

    // クラッカーエフェクト
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    onFinish(completedIds);
  };

  if (subTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <p>予定内容が登録されていません。</p>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / subTasks.length) * 100;

  return (
    <div className="flex flex-col flex-1 bg-background-light p-6 justify-between select-none">
      {/* 上部：進捗バー（視覚的にわかりやすく） */}
      <div>
        <div className="flex justify-between items-center text-xs text-text-muted font-bold mb-2">
          <span>冒険の進み具合</span>
          <span>{currentIndex + 1} / {subTasks.length}</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-quest-routine h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 中央：1タスク表示カード */}
      <div className="my-8 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md flex flex-col items-center justify-between min-h-[300px] text-center transform transition-all">
          <div className="text-sm font-semibold text-text-muted">
            ステップ {currentIndex + 1}
          </div>
          
          <h2 className="text-2xl font-bold text-text-main my-6 select-text">
            {currentTask.title}
          </h2>

          <button
            onClick={() => toggleComplete(currentTask.id)}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
              completedTasks[currentTask.id]
                ? 'bg-quest-routine border-quest-routine text-white scale-110 shadow-lg'
                : 'bg-white border-gray-300 text-gray-300 hover:border-quest-routine'
            }`}
          >
            <Check className={`w-10 h-10 ${completedTasks[currentTask.id] ? 'stroke-[3px]' : ''}`} />
          </button>

          <span className="text-xs text-text-muted mt-4">
            {completedTasks[currentTask.id] ? '完了！ボタンをもう一度押すと戻ります' : '完了したら上のボタンを押してください'}
          </span>
        </div>
      </div>

      {/* 下部：ナビゲーションボタン */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center justify-center w-14 h-14 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm active:scale-95 disabled:opacity-30 disabled:scale-100`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            className="flex-1 bg-yellow-400 text-white font-bold py-4 px-6 rounded-full text-lg shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2 hover:bg-yellow-500"
          >
            達成を親に報告する 🎉
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-quest-mission text-white font-bold py-4 px-6 rounded-full text-lg shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2 hover:bg-blue-500"
          >
            次へ進む
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
