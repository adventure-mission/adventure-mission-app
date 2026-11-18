/**
 * ローカルタイムゾーン（日本標準時 JST 等）基準の日付ユーティリティ
 * ※ toISOString().split('T')[0] は UTC 基準のため、日本時間の午前0〜9時に前日になってしまう問題を完全に解消します。
 */

/**
 * Date オブジェクトからローカル時間基準の 'YYYY-MM-DD' 文字列を取得する
 */
export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * 今日のローカル日付文字列 (YYYY-MM-DD) を取得する (offset日も指定可能)
 */
export function getTodayLocalDateStr(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return formatLocalDate(d);
}

/**
 * 過去 N 日分の日付文字列リスト (今日を含む、古い順) をローカル時間で取得する
 */
export function getPastLocalDates(daysCount: number): string[] {
  const arr: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    arr.push(getTodayLocalDateStr(-i));
  }
  return arr;
}
