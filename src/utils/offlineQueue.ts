export type QueuedEntity = 'skills' | 'sessions' | 'habits' | 'habit_logs';
export type QueuedOpType = 'add' | 'update' | 'delete';

export interface QueuedOperation {
  id: string;
  type: QueuedOpType;
  entity: QueuedEntity;
  /** For 'add': the full row (camelCase). For 'update': { id, patch }. For 'delete': { id }. */
  payload: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = 'skilltrack.offlineQueue.v1';

function read(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
  } catch {
    return [];
  }
}

function write(ops: QueuedOperation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    window.dispatchEvent(new CustomEvent('skilltrack:queue-changed'));
  } catch {
    // Quota exceeded or storage blocked — fail silently
  }
}

export const offlineQueue = {
  getAll: read,

  size(): number {
    return read().length;
  },

  enqueue(
    op: Omit<QueuedOperation, 'id' | 'createdAt'>
  ): QueuedOperation {
    const full: QueuedOperation = {
      ...op,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    write([...read(), full]);
    return full;
  },

  remove(id: string): void {
    write(read().filter((o) => o.id !== id));
  },

  /** Removes any queued op matching a predicate. Used for cancelling. */
  removeWhere(predicate: (op: QueuedOperation) => boolean): number {
    const before = read();
    const after = before.filter((o) => !predicate(o));
    const removed = before.length - after.length;
    if (removed > 0) write(after);
    return removed;
  },

  clear(): void {
    write([]);
  },
};