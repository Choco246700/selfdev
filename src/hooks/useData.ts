import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiFetch } from "../lib/api";
import { offlineQueue } from "../utils/offlineQueue";
import { isNetworkError } from "../utils/network";
import type { Session, Skill, Habit, HabitLog } from "../types";

async function tryWriteOrQueue(
  write: () => Promise<void>,
  rollback: () => void,
  queuedOp: Parameters<typeof offlineQueue.enqueue>[0],
): Promise<void> {
  try {
    await write();
  } catch (err) {
    if (isNetworkError(err)) {
      offlineQueue.enqueue(queuedOp);
      return;
    }
    rollback();
    throw err;
  }
}

export function useData() {
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
    try {
      const [skillsRes, sessionsRes, habitsRes, logsRes] = await Promise.all([
        apiFetch<{ skills: Skill[] }>("/api/skills"),
        apiFetch<{ sessions: Session[] }>("/api/sessions"),
        apiFetch<{ habits: Habit[] }>("/api/habits"),
        apiFetch<{ habitLogs: HabitLog[] }>("/api/habit-logs"),
      ]);
      setSkills(skillsRes.skills);
      setSessions(sessionsRes.sessions);
      setHabits(habitsRes.habits);
      setHabitLogs(logsRes.habitLogs);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
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
      if (!user) throw new Error("Not authenticated");
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
          await apiFetch("/api/skills", {
            method: "POST",
            json: {
              id: skill.id,
              name: skill.name,
              color: skill.color,
              weeklyGoalHours: skill.weeklyGoalHours,
            },
          });
        },
        () => setSkills((prev) => prev.filter((s) => s.id !== skill.id)),
        {
          type: "add",
          entity: "skills",
          payload: skill as unknown as Record<string, unknown>,
        },
      );
    },
    [user],
  );

  const updateSkill = useCallback(
    async (
      id: string,
      patch: { name?: string; color?: string; weeklyGoalHours?: number },
    ) => {
      const prevSnapshot = skills.find((s) => s.id === id);
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/skills/${id}`, {
            method: "PATCH",
            json: patch,
          });
        },
        () => {
          if (prevSnapshot) {
            setSkills((prev) =>
              prev.map((s) => (s.id === id ? prevSnapshot : s)),
            );
          }
        },
        { type: "update", entity: "skills", payload: { id, patch } },
      );
    },
    [skills],
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      const skillSnapshot = skills.find((s) => s.id === id);
      const sessionsSnapshot = sessions.filter((s) => s.skillId === id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setSessions((prev) => prev.filter((s) => s.skillId !== id));

      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/skills/${id}`, { method: "DELETE" });
        },
        () => {
          if (skillSnapshot) setSkills((prev) => [...prev, skillSnapshot]);
          if (sessionsSnapshot.length > 0)
            setSessions((prev) => [...prev, ...sessionsSnapshot]);
        },
        { type: "delete", entity: "skills", payload: { id } },
      );
    },
    [skills, sessions],
  );

  // ─── Sessions ────────────────────────────────────────────────────
  const addSession = useCallback(
    async (data: {
      skillId: string;
      durationMinutes: number;
      notes: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
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
          await apiFetch("/api/sessions", {
            method: "POST",
            json: {
              id: session.id,
              skillId: session.skillId,
              durationMinutes: session.durationMinutes,
              notes: session.notes,
            },
          });
        },
        () => setSessions((prev) => prev.filter((s) => s.id !== session.id)),
        {
          type: "add",
          entity: "sessions",
          payload: session as unknown as Record<string, unknown>,
        },
      );
    },
    [user],
  );

  const updateSession = useCallback(
    async (
      id: string,
      patch: Partial<{ durationMinutes: number; notes: string }>,
    ) => {
      const prevSnapshot = sessions.find((s) => s.id === id);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/sessions/${id}`, {
            method: "PATCH",
            json: patch,
          });
        },
        () => {
          if (prevSnapshot) {
            setSessions((prev) =>
              prev.map((s) => (s.id === id ? prevSnapshot : s)),
            );
          }
        },
        { type: "update", entity: "sessions", payload: { id, patch } },
      );
    },
    [sessions],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const snapshot = sessions.find((s) => s.id === id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/sessions/${id}`, { method: "DELETE" });
        },
        () => {
          if (snapshot) setSessions((prev) => [...prev, snapshot]);
        },
        { type: "delete", entity: "sessions", payload: { id } },
      );
    },
    [sessions],
  );

  // ─── Habits ──────────────────────────────────────────────────────
  const addHabit = useCallback(
    async (data: {
      emoji: string;
      name: string;
      targetTime: string;
      location: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
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
          await apiFetch("/api/habits", {
            method: "POST",
            json: {
              id: habit.id,
              emoji: habit.emoji,
              name: habit.name,
              targetTime: habit.targetTime,
              location: habit.location,
            },
          });
        },
        () => setHabits((prev) => prev.filter((h) => h.id !== habit.id)),
        {
          type: "add",
          entity: "habits",
          payload: habit as unknown as Record<string, unknown>,
        },
      );
    },
    [user],
  );

  const updateHabit = useCallback(
    async (
      id: string,
      patch: {
        emoji?: string;
        name?: string;
        targetTime?: string;
        location?: string;
      },
    ) => {
      const prevSnapshot = habits.find((h) => h.id === id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      );
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/habits/${id}`, {
            method: "PATCH",
            json: patch,
          });
        },
        () => {
          if (prevSnapshot) {
            setHabits((prev) =>
              prev.map((h) => (h.id === id ? prevSnapshot : h)),
            );
          }
        },
        { type: "update", entity: "habits", payload: { id, patch } },
      );
    },
    [habits],
  );

  const freezeHabit = useCallback(
    async (id: string, frozen: boolean) => {
      const prevSnapshot = habits.find((h) => h.id === id);
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, frozen } : h)),
      );
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/habits/${id}`, {
            method: "PATCH",
            json: { frozen },
          });
        },
        () => {
          if (prevSnapshot) {
            setHabits((prev) =>
              prev.map((h) => (h.id === id ? prevSnapshot : h)),
            );
          }
        },
        { type: "update", entity: "habits", payload: { id, patch: { frozen } } },
      );
    },
    [habits],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const habitSnapshot = habits.find((h) => h.id === id);
      const logsSnapshot = habitLogs.filter((l) => l.habitId === id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setHabitLogs((prev) => prev.filter((l) => l.habitId !== id));
      await tryWriteOrQueue(
        async () => {
          await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
        },
        () => {
          if (habitSnapshot) setHabits((prev) => [...prev, habitSnapshot]);
          if (logsSnapshot.length > 0)
            setHabitLogs((prev) => [...prev, ...logsSnapshot]);
        },
        { type: "delete", entity: "habits", payload: { id } },
      );
    },
    [habits, habitLogs],
  );

  // ─── Habit logs ──────────────────────────────────────────────────
  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!user) throw new Error("Not authenticated");

      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const existing = habitLogs.find(
        (l) => l.habitId === habitId && l.date === dateKey,
      );

      if (existing) {
        setHabitLogs((prev) => prev.filter((l) => l.id !== existing.id));
        const cancelled = offlineQueue.removeWhere(
          (op) =>
            op.entity === "habit_logs" &&
            op.type === "add" &&
            op.payload.id === existing.id,
        );
        if (cancelled > 0) return;

        await tryWriteOrQueue(
          async () => {
            await apiFetch(`/api/habit-logs/${existing.id}`, {
              method: "DELETE",
            });
          },
          () => setHabitLogs((prev) => [...prev, existing]),
          { type: "delete", entity: "habit_logs", payload: { id: existing.id } },
        );
      } else {
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
            await apiFetch("/api/habit-logs", {
              method: "POST",
              json: {
                id: newLog.id,
                habitId: newLog.habitId,
                date: newLog.date,
                completed: true,
              },
            });
          },
          () => setHabitLogs((prev) => prev.filter((l) => l.id !== newLog.id)),
          {
            type: "add",
            entity: "habit_logs",
            payload: newLog as unknown as Record<string, unknown>,
          },
        );
      }
    },
    [user, habitLogs],
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