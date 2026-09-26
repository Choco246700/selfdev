import type { Session, Skill, Habit, HabitLog } from '../types';

/**
 * Triggers a browser download of a text file with the given content.
 */
function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** YYYY-MM-DD for filename stamps. */
function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Full JSON export ────────────────────────────────────────────────
export interface ExportPayload {
  exportedAt: string;
  version: 1;
  userEmail: string | undefined;
  skills: Skill[];
  sessions: Session[];
  habits: Habit[];
  habitLogs: HabitLog[];
}

export function exportAllAsJSON(
  data: Omit<ExportPayload, 'exportedAt' | 'version'>
) {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    ...data,
  };
  const json = JSON.stringify(payload, null, 2);
  download(`skilltrack-backup-${todayStamp()}.json`, json, 'application/json');
}

// ─── Sessions CSV export ─────────────────────────────────────────────

/**
 * Escapes a value for CSV: wraps in quotes if it contains comma,
 * quote, or newline; doubles any internal quotes.
 */
function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(',');
}

export function exportSessionsAsCSV(sessions: Session[], skills: Skill[]) {
  const skillMap = new Map(skills.map((s) => [s.id, s]));

  const headers = [
    'Date',
    'Time',
    'Skill',
    'Duration (min)',
    'Duration (h)',
    'Notes',
  ];

  const rows = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((s) => {
      const d = new Date(s.createdAt);
      const skill = skillMap.get(s.skillId);
      return [
        d.toLocaleDateString('en-CA'), // YYYY-MM-DD
        d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        }),
        skill?.name ?? 'Unknown',
        s.durationMinutes,
        (s.durationMinutes / 60).toFixed(2),
        s.notes || '',
      ];
    });

  const csv = [csvRow(headers), ...rows.map(csvRow)].join('\r\n');
  download(`skilltrack-sessions-${todayStamp()}.csv`, csv, 'text/csv');
}

// ─── Habits CSV export (bonus — useful for habit analysis) ──────────

export function exportHabitsAsCSV(
  habits: Habit[],
  habitLogs: HabitLog[]
) {
  const headers = [
    'Habit',
    'Emoji',
    'Target Time',
    'Location',
    'Frozen',
    'Completed Date',
  ];

  // One row per (habit × completion) — pivot-friendly for spreadsheets
  const rows: (string | number)[][] = [];

  for (const habit of habits) {
    const logs = habitLogs.filter((l) => l.habitId === habit.id);
    if (logs.length === 0) {
      rows.push([
        habit.name,
        habit.emoji,
        habit.targetTime,
        habit.location,
        habit.frozen ? 'yes' : 'no',
        '',
      ]);
    } else {
      for (const log of logs) {
        rows.push([
          habit.name,
          habit.emoji,
          habit.targetTime,
          habit.location,
          habit.frozen ? 'yes' : 'no',
          log.date,
        ]);
      }
    }
  }

  const csv = [csvRow(headers), ...rows.map(csvRow)].join('\r\n');
  download(`skilltrack-habits-${todayStamp()}.csv`, csv, 'text/csv');
}