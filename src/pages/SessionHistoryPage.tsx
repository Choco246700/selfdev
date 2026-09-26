import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Clock, X } from 'lucide-react';
import type { Session, Skill } from '../types';
import { groupSessionsByDay } from '../utils/sessions';
import { subDays } from '../utils/date';

interface SessionHistoryPageProps {
  sessions: Session[];
  skills: Skill[];
  onSelectSession: (id: string) => void;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatGroupHeader(dateKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateKey);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / 86400000
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return new Date(dateKey).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year:
      new Date(dateKey).getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
}

export const SessionHistoryPage: React.FC<SessionHistoryPageProps> = ({
  sessions,
  skills,
  onSelectSession,
}) => {
  const navigate = useNavigate();

  const [range, setRange] = useState<DateRange>('30d');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);

  const filtered = useMemo(() => {
    let list = [...sessions];

    if (range !== 'all') {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const cutoff = subDays(new Date(), days);
      list = list.filter((s) => new Date(s.createdAt) >= cutoff);
    }

    if (skillFilter !== 'all') {
      list = list.filter((s) => s.skillId === skillFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.notes.toLowerCase().includes(q) ||
          (skills.find((sk) => sk.id === s.skillId)?.name ?? '')
            .toLowerCase()
            .includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sessions, skills, range, skillFilter, search]);

  const totalSessions = filtered.length;
  const totalMinutes = filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgDuration =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  const visible = filtered.slice(0, visibleCount);
  const grouped = useMemo(() => groupSessionsByDay(visible), [visible]);
  const hasMore = filtered.length > visibleCount;

  const skillMap = useMemo(
    () => new Map(skills.map((s) => [s.id, s])),
    [skills]
  );

  const resetPagination = () => setVisibleCount(30);

  const handleRange = (r: DateRange) => {
    setRange(r);
    resetPagination();
  };

  const handleSkillFilter = (id: string) => {
    setSkillFilter(id);
    resetPagination();
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    resetPagination();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        <p className="text-sm text-gray-500 mt-1">
          A complete log of your practice sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
          <p className="text-xs text-gray-500 mt-1">Total time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{avgDuration}m</p>
          <p className="text-xs text-gray-500 mt-1">Average session</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search notes or skills"
            className="w-full pl-8 pr-9 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 text-gray-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  range === r
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          <select
            value={skillFilter}
            onChange={(e) => handleSkillFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <p className="text-sm text-gray-500">
              No sessions match your filters.
            </p>
          </div>
        )}

        {grouped.map((group) => {
          const groupMinutes = group.sessions.reduce(
            (sum, s) => sum + s.durationMinutes,
            0
          );
          return (
            <div
              key={group.dateKey}
              className="bg-white rounded-2xl shadow-card p-6"
            >
              <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  {formatGroupHeader(group.dateKey)}
                </h3>
                <span className="text-xs text-gray-400">
                  {group.sessions.length}{' '}
                  {group.sessions.length === 1 ? 'session' : 'sessions'} ·{' '}
                  {groupMinutes} min
                </span>
              </div>

              <ul className="flex flex-col">
                {group.sessions.map((s, idx) => {
                  const skill = skillMap.get(s.skillId);
                  return (
                    <li
                      key={s.id}
                      onClick={() => onSelectSession(s.id)}
                      className={`flex items-center gap-4 py-3 -mx-2 px-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        idx !== group.sessions.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 w-32 shrink-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: skill?.color ?? '#9ca3af',
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {skill?.name ?? 'Unknown'}
                        </span>
                      </div>

                      <p className="flex-1 text-sm text-gray-500 truncate min-w-0">
                        {s.notes || 'Practice session'}
                      </p>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} />
                          {formatSessionTime(s.createdAt)}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {s.durationMinutes} min
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setVisibleCount((n) => n + 30)}
            className="self-center px-4 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition-colors shadow-sm"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        )}

        {!hasMore && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">
            That's everything — {filtered.length}{' '}
            {filtered.length === 1 ? 'session' : 'sessions'} shown.
          </p>
        )}
      </div>
    </div>
  );
};