import { formatDateKey, subDays } from './date';

/**
 * Calculates a streak of consecutive days ending today (or yesterday,
 * to give users a grace day if they haven't logged yet today).
 * Pass an array of "YYYY-MM-DD" date keys.
 */
export function calculateStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;

  const dateSet = new Set(dateKeys);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  if (!dateSet.has(formatDateKey(cursor))) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while (dateSet.has(formatDateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}