import type { Session, Skill } from '../types';
import { formatDateKey, formatRelativeDay } from './date';
import type { RecentSession } from '../components/RecentSessions';

/** Adapts raw sessions to the RecentSessions view model. */
export function buildRecentSessions(
  sessions: Session[],
  skillList: Skill[]
): RecentSession[] {
  const skillMap = new Map(skillList.map((s) => [s.id, s]));
  return [...sessions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
    .map((s) => {
      const skill = skillMap.get(s.skillId);
      return {
        id: s.id,
        skillName: skill?.name ?? 'Unknown',
        skillColor: skill?.color ?? 'bg-gray-400',
        notes: s.notes || 'Practice session',
        durationMinutes: s.durationMinutes,
        relativeDay: formatRelativeDay(s.createdAt),
      };
    });
}

/** Groups sessions by their calendar day (YYYY-MM-DD), newest day first. */
export function groupSessionsByDay(
  sessions: Session[]
): { dateKey: string; sessions: Session[] }[] {
  const groups = new Map<string, Session[]>();

  for (const s of sessions) {
    const key = formatDateKey(s.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, list]) => ({
      dateKey,
      sessions: [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
}