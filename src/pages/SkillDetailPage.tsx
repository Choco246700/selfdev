import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { SkillHeaderCard } from '../components/SkillHeaderCard';
import { ActivityBarChart } from '../components/ActivityBarChart';
import { getSkillStats } from '../utils/selectors';
import { calculateImprovement } from '../utils/improvement';
import {
  getWeeklyBuckets,
  getMonthlyBuckets,
  getLongestSession,
  formatDuration,
} from '../utils/aggregations';
import { formatRelativeDay } from '../utils/date';
import type { Session, Skill } from '../types';

interface SkillDetailPageProps {
  skills: Skill[];
  sessions: Session[];
  onEditSkill: (skillId: string) => void;
  onDeleteSkill: (skillId: string) => void;
  onSelectSession: (id: string) => void;
}

type Granularity = 'week' | 'month';

export const SkillDetailPage: React.FC<SkillDetailPageProps> = ({
  skills,
  sessions,
  onEditSkill,
  onDeleteSkill,
  onSelectSession,
}) => {
  const navigate = useNavigate();
  const { skillId } = useParams<{ skillId: string }>();
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const skill = useMemo(
    () => skills.find((s) => s.id === skillId) ?? null,
    [skills, skillId]
  );

  const skillSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.skillId === skillId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        ),
    [sessions, skillId]
  );

  const stats = useMemo(
    () => (skill ? getSkillStats(skill, sessions) : null),
    [skill, sessions]
  );

  const improvement = useMemo(() => {
    if (!skill) return null;
    return calculateImprovement(
      skillSessions,
      new Date(skill.createdAt),
      (s) => new Date(s.createdAt),
      (s) => s.durationMinutes
    );
  }, [skill, skillSessions]);

  const buckets = useMemo(() => {
    if (!skill) return [];
    return granularity === 'week'
      ? getWeeklyBuckets(skillSessions, 12)
      : getMonthlyBuckets(skillSessions, 6);
  }, [skill, skillSessions, granularity]);

  const longestSession = useMemo(
    () => getLongestSession(skillSessions),
    [skillSessions]
  );

  const sessionsWithNotes = useMemo(
    () => skillSessions.filter((s) => s.notes.trim().length > 0),
    [skillSessions]
  );

  const avgSession = useMemo(() => {
    if (skillSessions.length === 0) return 0;
    const total = skillSessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );
    return Math.round(total / skillSessions.length);
  }, [skillSessions]);

  // ─── Not found ───────────────────────────────────────────────────
  if (!skill || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate('/')}
          className="self-start flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-500" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Skill not found
          </h2>
          <p className="text-sm text-gray-500">
            This skill may have been deleted, or the link is broken.
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDeleteSkill(skill.id);
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="self-start flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>

      {/* Header */}
      <SkillHeaderCard
        name={skill.name}
        color={skill.color}
        progress={stats.progress}
        totalHours={stats.totalHours}
        streakDays={stats.streakDays}
        sessionCount={skillSessions.length}
        longestSession={longestSession}
        lastSession={stats.lastSession}
        improvement={improvement}
        onEdit={() => onEditSkill(skill.id)}
        onDelete={handleDelete}
      />

      {/* Delete confirmation banner */}
      {confirmDelete && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-red-700 font-medium">
            This will permanently delete "{skill.name}" and all its sessions.
            Click Delete again to confirm.
          </p>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Activity chart */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Practice Activity
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {granularity === 'week' ? 'Last 12 weeks' : 'Last 6 months'}
            </p>
          </div>

          {/* Granularity toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setGranularity('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                granularity === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setGranularity('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                granularity === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <ActivityBarChart bars={buckets} accent={skill.color} />

        {/* Summary row under the chart */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatDuration(avgSession)}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Avg session</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatDuration(buckets.reduce((sum, b) => sum + b.value, 0))}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {granularity === 'week' ? 'Last 12 weeks' : 'Last 6 months'}
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatDuration(Math.max(0, ...buckets.map((b) => b.value)))}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Best {granularity}
            </p>
          </div>
        </div>
      </div>

      {/* Notes timeline */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Notes & reflections
          </h2>
          <span className="text-xs text-gray-400">
            {sessionsWithNotes.length}{' '}
            {sessionsWithNotes.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {sessionsWithNotes.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No notes yet. Add a note when you log a session to see it here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {sessionsWithNotes.map((s, idx) => (
              <li
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`flex gap-4 py-4 -mx-2 px-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  idx !== sessionsWithNotes.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 pt-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: skill.color }}
                  />
                  {idx !== sessionsWithNotes.length - 1 && (
                    <span className="w-px flex-1 bg-gray-100 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {formatRelativeDay(s.createdAt)}
                      {' · '}
                      {new Date(s.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-900 shrink-0">
                      <Clock size={11} className="text-gray-400" />
                      {s.durationMinutes} min
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {s.notes}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};