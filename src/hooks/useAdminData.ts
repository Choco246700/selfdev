import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

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

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  return (
    Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000
  );
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
      // Parallel fetch: user list via RPC + aggregate counts + feedback
      const [usersRes, skillsRes, sessionsRes, habitsRes, logsRes, fbRes] =
        await Promise.all([
          supabase.rpc('admin_get_users'),
          supabase.from('skills').select('id', { count: 'exact', head: true }),
          supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true }),
          supabase.from('habits').select('id', { count: 'exact', head: true }),
          supabase
            .from('habit_logs')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('feedback')
            .select('status')
            .order('created_at', { ascending: false }),
        ]);

      if (usersRes.error) throw usersRes.error;

      const rawUsers = usersRes.data as {
        id: string;
        email: string;
        created_at: string;
        last_sign_in_at: string | null;
        is_admin: boolean;
        email_confirmed: boolean;
      }[];

      const normalized: AdminUser[] = (rawUsers ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        isAdmin: u.is_admin,
        emailConfirmed: u.email_confirmed,
      }));

      setUsers(normalized);

      const feedbackRows = (fbRes.data ?? []) as { status: string }[];
      const unread = feedbackRows.filter((f) => f.status === 'new').length;

      setStats({
        totalUsers: normalized.length,
        newUsersThisWeek: normalized.filter((u) =>
          isWithinDays(u.createdAt, 7)
        ).length,
        confirmedUsers: normalized.filter((u) => u.emailConfirmed).length,
        activeUsersThisWeek: normalized.filter((u) =>
          isWithinDays(u.lastSignInAt, 7)
        ).length,
        totalSkills: skillsRes.count ?? 0,
        totalSessions: sessionsRes.count ?? 0,
        totalHabits: habitsRes.count ?? 0,
        totalHabitLogs: logsRes.count ?? 0,
        totalFeedback: feedbackRows.length,
        unreadFeedback: unread,
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load admin data';
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