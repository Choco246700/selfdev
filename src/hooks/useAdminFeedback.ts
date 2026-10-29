import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiFetch } from "../lib/api";

export type FeedbackStatus = "new" | "read" | "resolved" | "wontfix";

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

export function useAdminFeedback(isAdmin: boolean) {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAdmin || !user) return;
    setLoading(true);
    try {
      const { feedback } = await apiFetch<{ feedback: AdminFeedback[] }>(
        "/api/admin/feedback",
      );
      setItems(feedback);
    } catch {
      /* leave previous items intact */
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      const prev = items;
      setItems((curr) =>
        curr.map((f) => (f.id === id ? { ...f, status } : f)),
      );
      try {
        await apiFetch(`/api/admin/feedback/${id}`, {
          method: "PATCH",
          json: { status },
        });
      } catch (err) {
        setItems(prev);
        throw err;
      }
    },
    [items],
  );

  const updateNotes = useCallback(async (id: string, notes: string) => {
    setItems((curr) =>
      curr.map((f) => (f.id === id ? { ...f, adminNotes: notes } : f)),
    );
    await apiFetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      json: { adminNotes: notes || null },
    });
  }, []);

  const deleteFeedback = useCallback(async (id: string) => {
    setItems((curr) => curr.filter((f) => f.id !== id));
    await apiFetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
  }, []);

  return { items, loading, refresh, updateStatus, updateNotes, deleteFeedback };
}