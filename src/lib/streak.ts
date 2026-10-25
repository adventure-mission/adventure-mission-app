import { RegisteredQuest } from '@/types';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isTodayCompleted: boolean;
  todayPendingOrDoneCount: number;
  todayTotalCount: number;
  streakStatus: 'completed_today' | 'in_progress' | 'none';
  past7DaysStatus: {
    dateStr: string;
    dayName: string;
    isCompleted: boolean;
    hasQuests: boolean;
    isToday: boolean;
  }[];
}

/**
 * 日付文字列 (YYYY-MM-DD) を取得するヘルパー
 */
export const getOffsetDateStr = (offset = 0, baseDate = new Date()): string => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

/**
 * 連続達成日数（ストリーク）を計算する
 * 
 * ルール:
 * - 予定が1件以上あり、その日の全予定が completed または pending の場合「達成日」とする。
 * - 今日が達成済みの場合: 今日を含めて過去に遡って連続日数をカウント。
 * - 今日が未達成の場合: 昨日から過去に遡って連続日数をカウント（記録はまだ途切れていない）。
 * - 予定が0件の日（休日など）は1日だけスキップ猶予を認める。
 */
export function calculateStreak(quests: RegisteredQuest[], baseDate = new Date()): StreakInfo {
  const todayStr = getOffsetDateStr(0, baseDate);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 1. 今日の達成状況
  const todayQuests = quests.filter((q) => q.date === todayStr && !q.isRecurring);
  const todayTotalCount = todayQuests.length;
  const todayPendingOrDoneCount = todayQuests.filter(
    (q) => q.status === 'completed' || q.status === 'pending'
  ).length;
  const isTodayCompleted = todayTotalCount > 0 && todayPendingOrDoneCount === todayTotalCount;

  // 各日付の判定関数
  const isDayAchieved = (dateStr: string): { achieved: boolean; hasQuests: boolean } => {
    const dayQuests = quests.filter((q) => q.date === dateStr && !q.isRecurring);
    if (dayQuests.length === 0) {
      return { achieved: false, hasQuests: false };
    }
    const allDone = dayQuests.every((q) => q.status === 'completed' || q.status === 'pending');
    return { achieved: allDone, hasQuests: true };
  };

  // 2. 現在のストリーク数のカウント
  let currentStreak = 0;
  let offset = isTodayCompleted ? 0 : -1;
  let emptyDayAllowed = 1; // 予定なしの休日を1日まで許容

  while (offset >= -60) {
    const dateStr = getOffsetDateStr(offset, baseDate);
    const { achieved, hasQuests } = isDayAchieved(dateStr);

    if (hasQuests) {
      if (achieved) {
        currentStreak++;
        emptyDayAllowed = 1; // 達成したら猶予リセット
      } else {
        // 未達成の予定がある場合はストリーク終了
        break;
      }
    } else {
      // 予定がない日
      if (emptyDayAllowed > 0 && currentStreak > 0) {
        emptyDayAllowed--;
        // 猶予内なら継続
      } else {
        // 猶予を使い切った、または初回から予定なしなら終了
        break;
      }
    }
    offset--;
  }

  // 3. 過去7日間のステータス（カレンダーUI表示用）
  const past7DaysStatus = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = getOffsetDateStr(-i, baseDate);
    const dObj = new Date(baseDate);
    dObj.setDate(dObj.getDate() - i);
    const { achieved, hasQuests } = isDayAchieved(dStr);
    past7DaysStatus.push({
      dateStr: dStr,
      dayName: dayNames[dObj.getDay()],
      isCompleted: achieved,
      hasQuests,
      isToday: i === 0,
    });
  }

  // 4. 最長記録の算出（全クエストの履歴から最大連続達成数を計算）
  const allDates = Array.from(new Set(quests.filter((q) => !q.isRecurring).map((q) => q.date))).sort();
  let longestStreak = currentStreak;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of allDates) {
    const { achieved, hasQuests } = isDayAchieved(dateStr);
    if (hasQuests && achieved) {
      const currDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1 || diffDays === 2) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = currDate;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  // ステータス判定
  let streakStatus: StreakInfo['streakStatus'] = 'none';
  if (currentStreak > 0) {
    streakStatus = isTodayCompleted ? 'completed_today' : 'in_progress';
  }

  return {
    currentStreak,
    longestStreak,
    isTodayCompleted,
    todayPendingOrDoneCount,
    todayTotalCount,
    streakStatus,
    past7DaysStatus,
  };
}
