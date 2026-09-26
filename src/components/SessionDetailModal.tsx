import React, { useEffect, useState } from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { useSaveAction } from '../hooks/useSaveAction';
import type { Session, Skill } from '../types';

interface SessionDetailModalProps {
  session: Session | null;
  skill: Skill | undefined;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: Partial<{ durationMinutes: number; notes: string }>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  skill,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { run: saveUpdate, isSaving: isSavingUpdate } = useSaveAction(
    onUpdate,
    { cooldownMs: 500 }
  );
  const { run: saveDelete, isSaving: isSavingDelete } = useSaveAction(
    onDelete,
    { cooldownMs: 500 }
  );
  const isSaving = isSavingUpdate || isSavingDelete;

  useEffect(() => {
    if (isOpen && session) {
      setDurationMinutes(session.durationMinutes);
      setNotes(session.notes);
      setConfirmDelete(false);
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen || !session) return null;

  const hasChanges =
    durationMinutes !== session.durationMinutes || notes !== session.notes;

  const handleSave = async () => {
    if (isSaving) return;
    if (durationMinutes <= 0) return;

    const ok = await saveUpdate(session.id, {
      durationMinutes,
      notes: notes.trim(),
    });
    if (ok) onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (isSaving) return;
    const ok = await saveDelete(session.id);
    if (ok) onClose();
  };

  const sessionDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const sessionTime = new Date(session.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {skill && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: skill.color }}
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {skill?.name ?? 'Session'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {sessionDate} · {sessionTime}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Duration (minutes)
          </label>
          <div className="relative">
            <Clock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(parseInt(e.target.value, 10) || 0)
              }
              disabled={isSaving}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you work on?"
            rows={4}
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 size={14} />
            {isSavingDelete
              ? 'Deleting…'
              : confirmDelete
              ? 'Confirm delete'
              : 'Delete'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => !isSaving && onClose()}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || durationMinutes <= 0 || isSaving}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSavingUpdate ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};