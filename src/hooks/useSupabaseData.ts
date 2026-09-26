import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { offlineQueue } from '../utils/offlineQueue';
import { isNetworkError } from '../utils/network';
import type { Session, Skill, Habit, HabitLog } from '../types';

// ─── Row mappers: DB (snake_case) ↔ App (camelCase) ──────────────────
interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  weekly_goal_hours: number;
  created_at: string;
}
interface SessionRow {
  id: string;
  user_id: string;
  skill_id: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}
interface HabitRow {
  id: string;
  user_id: string;
  emoji: string;
  name: string;
  target_time: string | null;
  location: string | null;
  frozen: boolean;
  created_at: string;
}
interface HabitLogRow {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

const toSkill = (r: SkillRow): Skill => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  color: r.color,
  weeklyGoalHours: r.weekly_goal_hours,
  createdAt: r.created_at,
});

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  userId: r.user_id,
  skillId: r.skill_id,
  durationMinutes: r.duration_minutes,
  notes: r.notes ?? '',
  createdAt: r.created_at,
});

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  userId: r.user_id,
  emoji: r.emoji,
  name: r.name,
  targetTime: r.target_time ?? '',
  location: r.location ?? '',
  frozen: r.frozen,
  createdAt: r.created_at,
});

const toHabitLog = (r: HabitLogRow): HabitLog => ({
  id: r.id,
  userId: r.user_id,
  habitId: r.habit_id,
  date: r.date,
  completed: r.completed,
});

// ─── Helper: run a network write, queue if it fails due to connectivity ──
async function tryWriteOrQueue(
  write: () => Promise<void>,
  rollback: () => void,
  queuedOp: Parameters<typeof offlineQueue.enqueue>[0]
): Promise<void> {
  try {
    await write();
  } catch (err) {
    if (isNetworkError(err)) {
      offlineQueue.enqueue(queuedOp);
      return;
    }
    // Server rejected — roll back the optimistic update and re-throw
    rollback();
    throw err;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────
export function useSupabaseData() {
  const { user } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch all ───────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [skillsRes, sessionsRes, habitsRes, logsRes] = await Promise.all([
      supabase.from('skills').select('*').order('created_at'),
      supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('habits').select('*').order('created_at'),
      supabase
        .from('habit_logs')
        .select('*')
        .order('date', { ascending: false }),
    ]);

    if (skillsRes.data)
      setSkills((skillsRes.data as SkillRow[]).map(toSkill));
    if (sessionsRes.data)
      setSessions((sessionsRes.data as SessionRow[]).map(toSession));
    if (habitsRes.data)
      setHabits((habitsRes.data as HabitRow[]).map(toHabit));
    if (logsRes.data)
      setHabitLogs((logsRes.data as HabitLogRow[]).map(toHabitLog));

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSkills([]);
      setSessions([]);
      setHabits([]);
      setHabitLogs([]);
      setLoading(false);
      return;
    }
    refetch();
  }, [user, refetch]);

  // ─── Skills ──────────────────────────────────────────────────────
  const addSkill = useCallback(
    async (data: { name: string; color: string; weeklyGoalHours: number }) => {
      if (!user) throw new Error('Not authenticated');

      const skill: Skill = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: data.name,
        color: data.color,
        weeklyGoalHours: data.weeklyGoalHours,
        createdAt: new Date().toISOString(),
      };

      setSkills((prev) => [...prev, skill]);

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase.from('skills').insert({
            id: skill.id,
            user_id: skill.userId,
            name: skill.name,
            color: skill.color,
            weekly_goal_hours: skill.weeklyGoalHours,
            created_at: skill.createdAt,
          });
          if (error) throw error;
        },
        () => setSkills((prev) => prev.filter((s) => s.id !== skill.id)),
        { type: 'add', entity: 'skills', payload: skill as unknown as Record<string, unknown> }
      );
    },
    [user]
  );

  const updateSkill = useCallback(
    async (
      id: string,
      patch: { name?: string; color?: string; weeklyGoalHours?: number }
    ) => {
      const prevSnapshot = skills.find((s) => s.id === id);
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );

      await tryWriteOrQueue(
        async () => {
          const dbPatch: Record<string, unknown> = {};
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.color !== undefined) dbPatch.color = patch.color;
          if (patch.weeklyGoalHours !== undefined)
            dbPatch.weekly_goal_hours = patch.weeklyGoalHours;

          const { error } = await supabase
            .from('skills')
            .update(dbPatch)
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (prevSnapshot) {
            setSkills((prev) =>
              prev.map((s) => (s.id === id ? prevSnapshot : s))
            );
          }
        },
        { type: 'update', entity: 'skills', payload: { id, patch } }
      );
    },
    [skills]
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      const skillSnapshot = skills.find((s) => s.id === id);
      const sessionsSnapshot = sessions.filter((s) => s.skillId === id);

      setSkills((prev) => prev.filter((s) => s.id !== id));
      setSessions((prev) => prev.filter((s) => s.skillId !== id));

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase
            .from('skills')
            .delete()
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (skillSnapshot)
            setSkills((prev) => [...prev, skillSnapshot]);
          if (sessionsSnapshot.length > 0)
            setSessions((prev) => [...prev, ...sessionsSnapshot]);
        },
        { type: 'delete', entity: 'skills', payload: { id } }
      );
    },
    [skills, sessions]
  );

  // ─── Sessions ────────────────────────────────────────────────────
  const addSession = useCallback(
    async (data: {
      skillId: string;
      durationMinutes: number;
      notes: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const session: Session = {
        id: crypto.randomUUID(),
        userId: user.id,
        skillId: data.skillId,
        durationMinutes: data.durationMinutes,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => [session, ...prev]);

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase.from('sessions').insert({
            id: session.id,
            user_id: session.userId,
            skill_id: session.skillId,
            duration_minutes: session.durationMinutes,
            notes: session.notes || null,
            created_at: session.createdAt,
          });
          if (error) throw error;
        },
        () => setSessions((prev) => prev.filter((s) => s.id !== session.id)),
        { type: 'add', entity: 'sessions', payload: session as unknown as Record<string, unknown> }
      );
    },
    [user]
  );

  const updateSession = useCallback(
    async (
      id: string,
      patch: Partial<{ durationMinutes: number; notes: string }>
    ) => {
      const prevSnapshot = sessions.find((s) => s.id === id);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );

      await tryWriteOrQueue(
        async () => {
          const dbPatch: Record<string, unknown> = {};
          if (patch.durationMinutes !== undefined)
            dbPatch.duration_minutes = patch.durationMinutes;
          if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;

          const { error } = await supabase
            .from('sessions')
            .update(dbPatch)
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (prevSnapshot) {
            setSessions((prev) =>
              prev.map((s) => (s.id === id ? prevSnapshot : s))
            );
          }
        },
        { type: 'update', entity: 'sessions', payload: { id, patch } }
      );
    },
    [sessions]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const snapshot = sessions.find((s) => s.id === id);
      setSessions((prev) => prev.filter((s) => s.id !== id));

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (snapshot) setSessions((prev) => [...prev, snapshot]);
        },
        { type: 'delete', entity: 'sessions', payload: { id } }
      );
    },
    [sessions]
  );

  // ─── Habits ──────────────────────────────────────────────────────
  const addHabit = useCallback(
    async (data: {
      emoji: string;
      name: string;
      targetTime: string;
      location: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const habit: Habit = {
        id: crypto.randomUUID(),
        userId: user.id,
        emoji: data.emoji,
        name: data.name,
        targetTime: data.targetTime,
        location: data.location,
        frozen: false,
        createdAt: new Date().toISOString(),
      };

      setHabits((prev) => [...prev, habit]);

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase.from('habits').insert({
            id: habit.id,
            user_id: habit.userId,
            emoji: habit.emoji,
            name: habit.name,
            target_time: habit.targetTime || null,
            location: habit.location || null,
            frozen: false,
            created_at: habit.createdAt,
          });
          if (error) throw error;
        },
        () => setHabits((prev) => prev.filter((h) => h.id !== habit.id)),
        { type: 'add', entity: 'habits', payload: habit as unknown as Record<string, unknown> }
      );
    },
    [user]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      patch: {
        emoji?: string;
        name?: string;
        targetTime?: string;
        location?: string;
      }
    ) => {
      const prevSnapshot = habits.find((h) => h.id === id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h))
      );

      await tryWriteOrQueue(
        async () => {
          const dbPatch: Record<string, unknown> = {};
          if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.targetTime !== undefined)
            dbPatch.target_time = patch.targetTime || null;
          if (patch.location !== undefined)
            dbPatch.location = patch.location || null;

          const { error } = await supabase
            .from('habits')
            .update(dbPatch)
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (prevSnapshot) {
            setHabits((prev) =>
              prev.map((h) => (h.id === id ? prevSnapshot : h))
            );
          }
        },
        { type: 'update', entity: 'habits', payload: { id, patch } }
      );
    },
    [habits]
  );

  const freezeHabit = useCallback(
    async (id: string, frozen: boolean) => {
      const prevSnapshot = habits.find((h) => h.id === id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, frozen } : h))
      );

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase
            .from('habits')
            .update({ frozen })
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (prevSnapshot) {
            setHabits((prev) =>
              prev.map((h) => (h.id === id ? prevSnapshot : h))
            );
          }
        },
        { type: 'update', entity: 'habits', payload: { id, patch: { frozen } } }
      );
    },
    [habits]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const habitSnapshot = habits.find((h) => h.id === id);
      const logsSnapshot = habitLogs.filter((l) => l.habitId === id);

      setHabits((prev) => prev.filter((h) => h.id !== id));
      setHabitLogs((prev) => prev.filter((l) => l.habitId !== id));

      await tryWriteOrQueue(
        async () => {
          const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', id);
          if (error) throw error;
        },
        () => {
          if (habitSnapshot) setHabits((prev) => [...prev, habitSnapshot]);
          if (logsSnapshot.length > 0)
            setHabitLogs((prev) => [...prev, ...logsSnapshot]);
        },
        { type: 'delete', entity: 'habits', payload: { id } }
      );
    },
    [habits, habitLogs]
  );

  // ─── Habit logs ──────────────────────────────────────────────────
  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const existing = habitLogs.find(
        (l) => l.habitId === habitId && l.date === dateKey
      );

      if (existing) {
        // ─── Turn off ────────────────────────────────────────────
        setHabitLogs((prev) => prev.filter((l) => l.id !== existing.id));

        // Cancel any queued "add" for this exact log (it never reached the server)
        const cancelled = offlineQueue.removeWhere(
          (op) =>
            op.entity === 'habit_logs' &&
            op.type === 'add' &&
            op.payload.id === existing.id
        );

        // If we cancelled a queued add, there's nothing to delete server-side
        if (cancelled > 0) return;

        await tryWriteOrQueue(
          async () => {
            const { error } = await supabase
              .from('habit_logs')
              .delete()
              .eq('id', existing.id);
            if (error) throw error;
          },
          () => setHabitLogs((prev) => [...prev, existing]),
          { type: 'delete', entity: 'habit_logs', payload: { id: existing.id } }
        );
      } else {
        // ─── Turn on ─────────────────────────────────────────────
        const newLog: HabitLog = {
          id: crypto.randomUUID(),
          userId: user.id,
          habitId,
          date: dateKey,
          completed: true,
        };

        setHabitLogs((prev) => [newLog, ...prev]);

        await tryWriteOrQueue(
          async () => {
            const { error } = await supabase.from('habit_logs').insert({
              id: newLog.id,
              user_id: newLog.userId,
              habit_id: newLog.habitId,
              date: newLog.date,
              completed: true,
            });
            if (error) throw error;
          },
          () =>
            setHabitLogs((prev) => prev.filter((l) => l.id !== newLog.id)),
          {
            type: 'add',
            entity: 'habit_logs',
            payload: newLog as unknown as Record<string, unknown>,
          }
        );
      }
    },
    [user, habitLogs]
  );

  return {
    skills,
    sessions,
    habits,
    habitLogs,
    loading,
    refetch,
    addSkill,
    updateSkill,
    deleteSkill,
    addSession,
    updateSession,
    deleteSession,
    addHabit,
    updateHabit,
    freezeHabit,
    deleteHabit,
    toggleHabit,
  };
}