import { type HeatmapDay } from '../types';

/**
 * Generates a heatmap grid for the last N weeks.
 * Aligns the grid so the last column contains "today".
 */
export function generateHeatmapData(
  sessions: { createdAt: string }[],
  weeks: number = 18
): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start of the grid: `weeks` weeks ago, aligned to Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks - 1) * 7);
  // Align to the start of that week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const totalDays = weeks * 7;

  // Group sessions by date string
  const sessionsByDate = sessions.reduce<Record<string, number>>((acc, s) => {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Max sessions in a day, to compute intensity relative to peak
  const maxCount = Math.max(1, ...Object.values(sessionsByDate));

  const days: HeatmapDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const count = sessionsByDate[key] || 0;
    const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));

    days.push({
      date: key,
      count,
      intensity: intensity as 0 | 1 | 2 | 3 | 4,
    });
  }

  return days;
}