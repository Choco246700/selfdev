import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export type FeedbackStatus = 'new' | 'read' | 'resolved' | 'wontfix';

export interface AdminFeedback {
  id: string;
  userId: string | null;
  userEmail: string | null;
  category: string;
  message: string;
  pageUrl: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  adminNotes: string | null;
  createdAt: string;
}

interface FeedbackRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const toFeedback = (r: FeedbackRow): AdminFeedback => ({
  id: r.id,
  userId: r.user_id,
  userEmail: r.user_email,
  category: r.category,
  message: r.message,
  pageUrl: r.page_url,
  userAgent: r.user_agent,
  status: r.status as FeedbackStatus,
  adminNotes: r.admin_notes,
  createdAt: r.created_at,
});

export function useAdminFeedback(isAdmin: boolean) {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAdmin || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems((data as FeedbackRow[]).map(toFeedback));
    }
    setLoading(false);
  }, [isAdmin, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      setItems((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      );
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id);
      if (error) {
        // Roll back
        setItems((prev) => prev.map((f) => (f.id === id ? { ...f } : f)));
        throw error;
      }
    },
    []
  );

  const updateNotes = useCallback(async (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, adminNotes: notes } : f))
    );
    const { error } = await supabase
      .from('feedback')
      .update({ admin_notes: notes || null })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const deleteFeedback = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((f) => f.id !== id));
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return { items, loading, refresh, updateStatus, updateNotes, deleteFeedback };
}