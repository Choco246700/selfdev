import React, { useEffect, useState } from 'react';
import { X, Clock, MapPin } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { EMOJI_PRESETS } from '../constants/emoji';
import { useSaveAction } from '../hooks/useSaveAction';
import type { NewHabitInput } from './TodayTodos';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: NewHabitInput) => Promise<void>;
}

function getCurrentTimeValue(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const NewHabitModal: React.FC<NewHabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(getCurrentTimeValue);
  const [location, setLocation] = useState('');

  const { run: save, isSaving } = useSaveAction(onSave, { cooldownMs: 600 });

  useEffect(() => {
    if (isOpen) {
      setEmoji(EMOJI_PRESETS[0]);
      setTitle('');
      setTime(getCurrentTimeValue());
      setLocation('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isSaving) return;
    if (!title.trim()) return;

    const ok = await save({
      emoji,
      title: title.trim(),
      time,
      location: location.trim(),
    });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New Habit</h2>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">
            {emoji || '❓'}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What habit do you want to build?"
            autoFocus
            disabled={isSaving}
            className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Pick an emoji
          </label>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Time
            </label>
            <div className="relative">
              <Clock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSaving}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Location
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Gym"
                disabled={isSaving}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};