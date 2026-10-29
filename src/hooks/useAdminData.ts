import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiFetch } from "../lib/api";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  emailConfirmed: boolean;
}

export interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  confirmedUsers: number;
  activeUsersThisWeek: number;
  totalSkills: number;
  totalSessions: number;
  totalHabits: number;
  totalHabitLogs: number;
  totalFeedback: number;
  unreadFeedback: number;
}

export function useAdminData(isAdmin: boolean) {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAdmin || !user) return;
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiFetch<{ users: AdminUser[] }>("/api/admin/users"),
        apiFetch<{ stats: AdminStats }>("/api/admin/stats"),
      ]);
      setUsers(usersRes.users);
      setStats(statsRes.stats);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load admin data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, stats, loading, error, refresh };
}