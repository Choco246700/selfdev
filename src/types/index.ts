export interface Skill {
  id: string;
  userId: string;
  name: string;
  color: string;
  weeklyGoalHours: number;
  createdAt: string;
}

export interface Session {
  id: string;
  skillId: string;
  userId: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  targetTime: string;
  location: string;
  createdAt: string;
  frozen: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface Improvement {
  value: number;
  label: string;
}