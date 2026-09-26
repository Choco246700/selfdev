import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { offlineQueue,type QueuedOperation } from '../utils/offlineQueue';
import { isNetworkError } from '../utils/network';

/**
 * Replays a single queued operation against Supabase.
 * Returns:
 *   ok             — operation completed (or was safely ignored)
 *   isNetworkError — if true, keep the op queued and stop the drain
 */
async function replayOp(
  op: QueuedOperation
): Promise<{ ok: boolean; isNetworkError: boolean }> {
  try {
    const { entity, type, payload } = op;

    if (entity === 'skills') {
      if (type === 'add') {
        const { error } = await supabase.from('skills').insert({
          id: payload.id,
          user_id: payload.userId,
          name: payload.name,
          color: payload.color,
          weekly_goal_hours: payload.weeklyGoalHours,
          created_at: payload.createdAt,
        });
        if (error && error.code !== '23505') throw error;
      } else if (type === 'update') {
        const patch = payload.patch as Record<string, unknown>;
        const dbPatch: Record<string, unknown> = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.color !== undefined) dbPatch.color = patch.color;
        if (patch.weeklyGoalHours !== undefined)
          dbPatch.weekly_goal_hours = patch.weeklyGoalHours;

        const { error } = await supabase
          .from('skills')
          .update(dbPatch)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('skills')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
      }
    }

    if (entity === 'sessions') {
      if (type === 'add') {
        const { error } = await supabase.from('sessions').insert({
          id: payload.id,
          user_id: payload.userId,
          skill_id: payload.skillId,
          duration_minutes: payload.durationMinutes,
          notes: payload.notes || null,
          created_at: payload.createdAt,
        });
        if (error && error.code !== '23505') throw error;
      } else if (type === 'update') {
        const patch = payload.patch as Record<string, unknown>;
        const dbPatch: Record<string, unknown> = {};
        if (patch.durationMinutes !== undefined)
          dbPatch.duration_minutes = patch.durationMinutes;
        if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;

        const { error } = await supabase
          .from('sessions')
          .update(dbPatch)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
      }
    }

    if (entity === 'habits') {
      if (type === 'add') {
        const { error } = await supabase.from('habits').insert({
          id: payload.id,
          user_id: payload.userId,
          emoji: payload.emoji,
          name: payload.name,
          target_time: payload.targetTime || null,
          location: payload.location || null,
          frozen: payload.frozen ?? false,
          created_at: payload.createdAt,
        });
        if (error && error.code !== '23505') throw error;
      } else if (type === 'update') {
        const patch = payload.patch as Record<string, unknown>;
        const dbPatch: Record<string, unknown> = {};
        if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.targetTime !== undefined)
          dbPatch.target_time = patch.targetTime || null;
        if (patch.location !== undefined)
          dbPatch.location = patch.location || null;
        if (patch.frozen !== undefined) dbPatch.frozen = patch.frozen;

        const { error } = await supabase
          .from('habits')
          .update(dbPatch)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
      }
    }

    if (entity === 'habit_logs') {
      if (type === 'add') {
        const { error } = await supabase.from('habit_logs').insert({
          id: payload.id,
          user_id: payload.userId,
          habit_id: payload.habitId,
          date: payload.date,
          completed: payload.completed ?? true,
        });
        // Ignore duplicate (unique on habit_id + date)
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
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