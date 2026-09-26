import React, { useEffect, useState } from 'react';
import { X, Clock, Sparkles } from 'lucide-react';
import { useSaveAction } from '../hooks/useSaveAction';
import type { Skill } from '../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onSave: (data: {
    skillId: string;
    durationMinutes: number;
    notes: string;
  }) => Promise<void>;
}

const QUICK_DURATIONS = [15, 30, 45, 60];

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  skills,
  onSave,
}) => {
  const [skillId, setSkillId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');

  const { run: save, isSaving } = useSaveAction(onSave, { cooldownMs: 600 });

  useEffect(() => {
    if (isOpen) {
      setSkillId(skills[0]?.id ?? '');
      setDurationMinutes(30);
      setCustomDuration('');
      setNotes('');
    }
  }, [isOpen, skills]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen) return null;

  const activeSkill = skills.find((s) => s.id === skillId);
  const effectiveDuration = customDuration
    ? parseInt(customDuration, 10) || 0
    : durationMinutes;

  const handleSave = async () => {
    if (isSaving) return;
    if (!skillId || effectiveDuration <= 0) return;

    const ok = await save({
      skillId,
      durationMinutes: effectiveDuration,
      notes: notes.trim(),
    });
    if (ok) onClose();
  };

  const handleQuickDuration = (mins: number) => {
    if (isSaving) return;
    setDurationMinutes(mins);
    setCustomDuration('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white">
              <Sparkles size={14} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Log Session</h2>
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
            Skill
          </label>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((skill) => {
              const isActive = skill.id === skillId;
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => !isSaving && setSkillId(skill.id)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left disabled:opacity-50 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: skill.color }}
                  />
                  <span className="truncate">{skill.name}</span>
                </button>
              );
            })}
          </div>
          {skills.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Create a skill before logging a session.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Duration
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {QUICK_DURATIONS.map((mins) => {
              const isActive = !customDuration && durationMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleQuickDuration(mins)}
                  disabled={isSaving}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Clock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="number"
              min="1"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder="Or enter custom minutes"
              disabled={isSaving}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`What did you work on in ${
              activeSkill?.name ?? 'this skill'
            }?`}
            rows={3}
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:bg-gray-50"
          />
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
            disabled={!skillId || effectiveDuration <= 0 || isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Session'}
          </button>
        </div>
      </div>
    </div>
  );
};