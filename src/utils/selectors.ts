import { type Skill, type Session, type HabitLog } from "../types";
import { formatDateKey, formatRelativeDay, startOfWeek, subDays } from "./date";
import { calculateStreak } from "./streaks";

export function getSkillStats(skill: Skill, sessions: Session[]) {
  const skillSessions = sessions.filter((s) => s.skillId === skill.id);

  const totalMinutes = skillSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const weekStart = startOfWeek(new Date());
  const thisWeekMinutes = skillSessions
    .filter((s) => new Date(s.createdAt) >= weekStart)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const progress = Math.min(
    100,
    Math.round((thisWeekMinutes / (skill.weeklyGoalHours * 60)) * 100),
  );

  const dateKeys = Array.from(
    new Set(skillSessions.map((s) => formatDateKey(s.createdAt))),
  ).sort();

  const streakDays = calculateStreak(dateKeys);

  const sorted = [...skillSessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const last = sorted[0];

  return {
    totalHours,
    progress,
    streakDays,
    lastSession: last
      ? {
          relativeDay: formatRelativeDay(last.createdAt),
          durationMinutes: last.durationMinutes,
        }
      : undefined,
    markedDates: new Set(dateKeys),
  };
}

export function getMostPracticedSkill(
  skills: Skill[],
  sessions: Session[],
): Skill | null {
  if (skills.length === 0) return null;
  const totals = skills.map((skill) => ({
    skill,
    minutes: sessions
      .filter((s) => s.skillId === skill.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0),
  }));
  totals.sort((a, b) => b.minutes - a.minutes);
  return totals[0]?.skill ?? null;
}

/**
 * Returns the earliest date across all skill activity.
 * Falls back to "now" if there's no activity yet.
 */
export function getEarliestActivity(
  skills: Skill[],
  sessions: Session[],
): Date {
  const dates: number[] = [];
  skills.forEach((s) => dates.push(new Date(s.createdAt).getTime()));
  sessions.forEach((s) => dates.push(new Date(s.createdAt).getTime()));

  if (dates.length === 0) return new Date();
  return new Date(Math.min(...dates));
}

export function getHabitLogsForHabit(
  logs: HabitLog[],
  habitId: string,
): HabitLog[] {
  return logs.filter((l) => l.habitId === habitId);
}

/**
 * Returns the earliest date across habit activity.
 * Falls back to "now" if there's no activity yet.
 */
export function getEarliestHabitActivity(
  habits: { createdAt: string }[],
  logs: HabitLog[],
): Date {
  const dates: number[] = [];
  habits.forEach((h) => dates.push(new Date(h.createdAt).getTime()));
  logs.forEach((l) => dates.push(new Date(l.date).getTime()));

  if (dates.length === 0) return new Date();
  return new Date(Math.min(...dates));
}

export interface HabitStats {
  streak: number;
  completionRate: number; // 0–100 over trailing window
  last7Days: { date: string; completed: boolean }[];
}

export function getHabitStats(
  habitId: string,
  logs: HabitLog[],
  windowDays: number = 30,
): HabitStats {
  const completedKeys = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date);

  const completedSet = new Set(completedKeys);
  const streak = calculateStreak(completedKeys);

  // Completion rate over trailing window (inclusive of today)
  const windowStart = subDays(new Date(), windowDays - 1);
  const windowStartKey = formatDateKey(windowStart);
  const inWindow = completedKeys.filter((k) => k >= windowStartKey).length;
  const completionRate = Math.round((inWindow / windowDays) * 100);

  // Last 7 days (oldest → today)
  const last7Days: { date: string; completed: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = formatDateKey(d);
    last7Days.push({ date: key, completed: completedSet.has(key) });
  }

  return { streak, completionRate, last7Days };
}
