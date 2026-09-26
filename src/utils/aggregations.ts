import type { Session } from '../types';
import { startOfWeek, subDays } from './date';

export interface ActivityBucket {
  label: string;
  value: number; // minutes
}

/** Last N weeks, oldest → newest. Empty weeks return 0. */
export function getWeeklyBuckets(
  sessions: Session[],
  weeks: number = 12
): ActivityBucket[] {
  const out: ActivityBucket[] = [];
  const now = new Date();
  const thisWeekStart = startOfWeek(now);

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subDays(thisWeekStart, i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const value = sessions
      .filter((s) => {
        const d = new Date(s.createdAt);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    out.push({
      label: weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value,
    });
  }
  return out;
}

/** Last N months, oldest → newest. */
export function getMonthlyBuckets(
  sessions: Session[],
  months: number = 6
): ActivityBucket[] {
  const out: ActivityBucket[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const value = sessions
      .filter((s) => {
        const d = new Date(s.createdAt);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    out.push({
      label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      value,
    });
  }
  return out;
}

/** "45m" · "1h 20m" · "3h" · "0m" */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Returns the longest single session duration, or 0 if none. */
export function getLongestSession(sessions: Session[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.durationMinutes), 0);
}