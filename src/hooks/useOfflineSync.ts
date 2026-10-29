import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../lib/api";
import { offlineQueue, type QueuedOperation } from "../utils/offlineQueue";
import { isNetworkError } from "../utils/network";

/**
 * Replays a single queued operation against Supabase.
 * Returns:
 *   ok             — operation completed (or was safely ignored)
 *   isNetworkError — if true, keep the op queued and stop the drain
 */
async function replayOp(
  op: QueuedOperation,
): Promise<{ ok: boolean; isNetworkError: boolean }> {
  try {
    const { entity, type, payload } = op;

    if (entity === "skills") {
      if (type === "add") {
        await apiFetch("/api/skills", {
          method: "POST",
          json: {
            id: payload.id,
            name: payload.name,
            color: payload.color,
            weeklyGoalHours: payload.weeklyGoalHours,
          },
        });
      } else if (type === "update") {
        await apiFetch(`/api/skills/${payload.id}`, {
          method: "PATCH",
          json: payload.patch,
        });
      } else {
        await apiFetch(`/api/skills/${payload.id}`, { method: "DELETE" });
      }
    }

    if (entity === "sessions") {
      if (type === "add") {
        await apiFetch("/api/sessions", {
          method: "POST",
          json: {
            id: payload.id,
            skillId: payload.skillId,
            durationMinutes: payload.durationMinutes,
            notes: payload.notes,
          },
        });
      } else if (type === "update") {
        await apiFetch(`/api/sessions/${payload.id}`, {
          method: "PATCH",
          json: payload.patch,
        });
      } else {
        await apiFetch(`/api/sessions/${payload.id}`, { method: "DELETE" });
      }
    }

    if (entity === "habits") {
      if (type === "add") {
        await apiFetch("/api/habits", {
          method: "POST",
          json: {
            id: payload.id,
            emoji: payload.emoji,
            name: payload.name,
            targetTime: payload.targetTime,
            location: payload.location,
          },
        });
      } else if (type === "update") {
        await apiFetch(`/api/habits/${payload.id}`, {
          method: "PATCH",
          json: payload.patch,
        });
      } else {
        await apiFetch(`/api/habits/${payload.id}`, { method: "DELETE" });
      }
    }

    if (entity === "habit_logs") {
      if (type === "add") {
        await apiFetch("/api/habit-logs", {
          method: "POST",
          json: {
            id: payload.id,
            habitId: payload.habitId,
            date: payload.date,
            completed: payload.completed ?? true,
          },
        });
      } else {
        await apiFetch(`/api/habit-logs/${payload.id}`, { method: "DELETE" });
      }
    }

    return { ok: true, isNetworkError: false };
  } catch (err) {
    return { ok: false, isNetworkError: isNetworkError(err) };
  }
}

/**
 * Watches online status. When transitioning offline → online with a
 * non-empty queue, drains the queue in FIFO order.
 */
export function useOfflineSync(isOnline: boolean, onDrained: () => void) {
  const drainingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    const justCameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;

    if (!isOnline || drainingRef.current) return;
    if (!justCameOnline && offlineQueue.size() === 0) return;

    const queue = offlineQueue.getAll();
    if (queue.length === 0) return;

    drainingRef.current = true;
    setIsSyncing(true);

    (async () => {
      const toastId = toast.loading(
        `Syncing ${queue.length} change${queue.length === 1 ? '' : 's'}…`
      );

      let succeeded = 0;
      let failed = 0;

      for (const op of queue) {
        const result = await replayOp(op);

        if (result.ok) {
          offlineQueue.remove(op.id);
          succeeded++;
        } else if (result.isNetworkError) {
          // Still no connection — stop, keep the rest queued
          break;
        } else {
          // Server rejected (validation, RLS, etc.) — discard to avoid
          // an infinite retry loop
          offlineQueue.remove(op.id);
          failed++;
        }
      }

      const remaining = offlineQueue.size();
      setIsSyncing(false);
      drainingRef.current = false;

      if (remaining === 0 && failed === 0) {
        toast.success(
          `Synced ${succeeded} change${succeeded === 1 ? '' : 's'}`,
          { id: toastId }
        );
        onDrained();
      } else if (remaining === 0 && failed > 0) {
        toast.error(
          `${failed} change${failed === 1 ? '' : 's'} couldn't be synced`,
          { id: toastId }
        );
        onDrained();
      } else {
        toast.error(
          `${remaining} change${remaining === 1 ? '' : 's'} still pending`,
          { id: toastId }
        );
      }
    })();
  }, [isOnline, onDrained]);

  return isSyncing;
}