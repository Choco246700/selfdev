import React from 'react';
import { Flame } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { MiniCalendar } from './MiniCalendar';
import { ImprovementBadge } from './ImprovementBadge';
import type { Improvement } from '../types';

interface MostPracticedCardProps {
  skillName: string;
  progress: number;
  totalHours: number;
  streakDays: number;
  improvement: Improvement | null;
  lastSession?: {
    relativeDay: string;
    durationMinutes: number;
  };
  markedDates?: Set<string>;
}

export const MostPracticedCard: React.FC<MostPracticedCardProps> = ({
  skillName,
  progress,
  totalHours,
  streakDays,
  improvement,
  lastSession,
  markedDates,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col h-full">
      <div>
        <span className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
          Most Practiced
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">{skillName}</h2>
      </div>

      <div className="flex items-center justify-center py-4">
        <ProgressRing progress={progress} size={100} strokeWidth={7} />
      </div>

      <div className="border-t border-gray-100" />

      <div className="grid grid-cols-2 gap-3 py-4">
        <div>
          <p className="text-lg font-bold text-gray-900">{totalHours}h</p>
          <p className="text-xs text-gray-500 mt-0.5">Total hours</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            {streakDays}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Day streak</p>
        </div>
      </div>

      {improvement && (
        <div className="pb-4">
          <ImprovementBadge improvement={improvement} />
        </div>
      )}

      <div className="border-t border-gray-100" />

      <div className="pt-3">
        <p className="text-xs text-gray-500">
          {lastSession
            ? `Last session: ${lastSession.relativeDay} — ${lastSession.durationMinutes} min`
            : 'No sessions logged yet'}
        </p>
      </div>

      <div className="border-t border-gray-100 mt-4 pt-4">
        <MiniCalendar markedDates={markedDates} />
      </div>
    </div>
  );
};