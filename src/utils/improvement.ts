import { type Improvement } from "../types";
import { subDays } from "./date";

interface Progression {
  days: number;
  label: string;
}

/**
 * Progressive comparison window based on account age.
 * Newer users compare against shorter windows; established users
 * compare against longer ones.
 */
export function getProgression(firstActivity: Date): Progression | null {
  const ageMs = Date.now() - firstActivity.getTime();
  const ageDays = Math.floor(ageMs / 86400000);

  if (ageDays < 7) return null;
  if (ageDays < 14) return { days: 7, label: "vs last week" };
  if (ageDays < 21) return { days: 14, label: "vs last 2 weeks" };
  if (ageDays < 30) return { days: 21, label: "vs last 3 weeks" };
  if (ageDays < 60) return { days: 30, label: "vs last month" };
  if (ageDays < 90) return { days: 60, label: "vs last 2 months" };
  return { days: 90, label: "vs last 3 months" };
}

function sumInRange<T>(
  items: T[],
  start: Date,
  end: Date,
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
): number {
  return items
    .filter((item) => {
      const d = getDate(item);
      return d >= start && d < end;
    })
    .reduce((sum, item) => sum + getValue(item), 0);
}

/**
 * Generic improvement calculator — works for both habits (binary
 * completions) and skills (duration in minutes).
 */
export function calculateImprovement<T>(
  items: T[],
  firstActivity: Date,
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
): Improvement | null {
  const progression = getProgression(firstActivity);
  if (!progression) return null;

  const now = new Date();
  const periodStart = subDays(now, progression.days);
  const priorStart = subDays(now, progression.days * 2);

  const current = sumInRange(items, periodStart, now, getDate, getValue);
  const prior = sumInRange(items, priorStart, periodStart, getDate, getValue);

  if (prior === 0) {
    return current > 0 ? { value: 100, label: progression.label } : null;
  }

  const pct = Math.round(((current - prior) / prior) * 100);
  return { value: pct, label: progression.label };
}
