import React from 'react';
import { Flame, Pencil, Trash2, Clock } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { ImprovementBadge } from './ImprovementBadge';
import type { Improvement } from '../types';

interface SkillHeaderCardProps {
  name: string;
  color: string;
  progress: number;
  totalHours: number;
  streakDays: number;
  sessionCount: number;
  longestSession: number; // minutes
  lastSession?: { relativeDay: string; durationMinutes: number };
  improvement: Improvement | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const SkillHeaderCard: React.FC<SkillHeaderCardProps> = ({
  name,
  color,
  progress,
  totalHours,
  streakDays,
  sessionCount,
  longestSession,
  lastSession,
  improvement,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      {/* Top row: name + actions */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {name}
            </h1>
            {improvement && (
              <div className="mt-1">
                <ImprovementBadge improvement={improvement} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Edit skill"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete skill"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-white border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* Main stats row */}
      <div className="flex items-center gap-8 flex-wrap">
        <ProgressRing progress={progress} size={120} strokeWidth={8} />

        <div className="grid grid-cols-3 gap-8 flex-1 min-w-65">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
            <p className="text-xs text-gray-500 mt-1">Total hours</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 flex items-center gap-1.5">
              <Flame size={18} className="text-orange-500 fill-orange-500" />
              {streakDays}
            </p>
            <p className="text-xs text-gray-500 mt-1">Day streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{sessionCount}</p>
            <p className="text-xs text-gray-500 mt-1">Sessions</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500 flex-wrap">
        {lastSession && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Last session: {lastSession.relativeDay} —{' '}
            {lastSession.durationMinutes} min
          </span>
        )}
        {longestSession > 0 && (
          <span>
            Longest session:{' '}
            <span className="font-medium text-gray-700">
              {longestSession} min
            </span>
          </span>
        )}
      </div>
    </div>
  );
};