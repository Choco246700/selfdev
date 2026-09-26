import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { MostPracticedCard } from '../components/MostPracticedCard';
import { SkillStatCard } from '../components/SkillStatCard';
import { Heatmap } from '../components/Heatmap';
import { TodayTodos } from '../components/TodayTodos';
import { RecentSessions } from '../components/RecentSessions';
import { ImprovementBadge } from '../components/ImprovementBadge';
import { generateHeatmapData } from '../utils/heatmap';
import { calculateImprovement } from '../utils/improvement';
import { formatDateKey } from '../utils/date';
import {
  getSkillStats,
  getHabitStats,
  getMostPracticedSkill,
  getEarliestActivity,
  getEarliestHabitActivity,
} from '../utils/selectors';
import { buildRecentSessions } from '../utils/sessions';
import type { Session, Skill, Habit, HabitLog } from '../types';
import type { Todo } from '../components/TodayTodos';

interface DashboardPageProps {
  skills: Skill[];
  sessions: Session[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onToggleTodo: (habitId: string) => void;
  onFreezeTodo: (habitId: string) => void;
  onDeleteTodo: (habitId: string) => void;
  onEditHabit: (habitId: string) => void;
  onDeleteSkill: (skillId: string) => void;
  onOpenSkill: (skillId: string) => void;
  onSelectSession: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  skills,
  sessions,
  habits,
  habitLogs,
  onToggleTodo,
  onFreezeTodo,
  onDeleteTodo,
  onEditHabit,
  onDeleteSkill,
  onOpenSkill,
  onSelectSession,
}) => {
  const navigate = useNavigate();

  // ─── Today's Todo view model ─────────────────────────────────────
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const todayTodos: Todo[] = useMemo(() => {
    const doneSet = new Set(
      habitLogs
        .filter((l) => l.date === todayKey && l.completed)
        .map((l) => l.habitId)
    );

    return habits.map((h) => {
      const stats = getHabitStats(h.id, habitLogs);
      return {
        id: h.id,
        emoji: h.emoji,
        title: h.name,
        time: h.targetTime,
        location: h.location,
        completed: doneSet.has(h.id),
        frozen: h.frozen,
        streak: stats.streak,
        completionRate: stats.completionRate,
        last7Days: stats.last7Days,
        habit: h, // ← raw Habit object for the SetReminderButton
      };
    });
  }, [habits, habitLogs, todayKey]);

  // ─── Skills ──────────────────────────────────────────────────────
  const heatmapData = useMemo(
    () => generateHeatmapData(sessions),
    [sessions]
  );

  const topSkill = useMemo(
    () => getMostPracticedSkill(skills, sessions),
    [skills, sessions]
  );

  const topSkillStats = useMemo(
    () => (topSkill ? getSkillStats(topSkill, sessions) : null),
    [topSkill, sessions]
  );

  const topSkillImprovement = useMemo(() => {
    if (!topSkill) return null;
    return calculateImprovement(
      sessions.filter((s) => s.skillId === topSkill.id),
      new Date(topSkill.createdAt),
      (s) => new Date(s.createdAt),
      (s) => s.durationMinutes
    );
  }, [topSkill, sessions]);

  const allSkillsImprovement = useMemo(
    () =>
      calculateImprovement(
        sessions,
        getEarliestActivity(skills, sessions),
        (s) => new Date(s.createdAt),
        (s) => s.durationMinutes
      ),
    [sessions, skills]
  );

  const habitsImprovement = useMemo(
    () =>
      calculateImprovement(
        habitLogs,
        getEarliestHabitActivity(habits, habitLogs),
        (l) => new Date(l.date),
        () => 1
      ),
    [habitLogs, habits]
  );

  // ALL skills (including the top one) so newly-created skills always show.
  const skillSummaries = useMemo(() => {
    return skills.map((skill) => {
      const stats = getSkillStats(skill, sessions);
      return {
        ...skill,
        totalHours: stats.totalHours,
        streakDays: stats.streakDays,
      };
    });
  }, [skills, sessions]);

  // ─── Overflow detection for the row fade ─────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [skillSummaries.length]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:min-h-152.5">
        {/* Left Column — Most Practiced */}
        <div className="h-full" data-tour="most-practiced">
          {topSkill && topSkillStats ? (
            <MostPracticedCard
              skillName={topSkill.name}
              progress={topSkillStats.progress}
              totalHours={topSkillStats.totalHours}
              streakDays={topSkillStats.streakDays}
              improvement={topSkillImprovement}
              lastSession={topSkillStats.lastSession}
              markedDates={topSkillStats.markedDates}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col h-full">
              <span className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
                Most Practiced
              </span>
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  No skills yet
                </p>
                <p className="text-xs text-gray-500 max-w-45">
                  Add your first skill to start tracking progress.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="relative">
            <div
              ref={scrollRef}
              data-tour="skills-row"
              className="scroll-row flex gap-4 overflow-x-auto pb-3 -mx-1 px-1"
            >
              {skillSummaries.map((skill) => (
                <div key={skill.id} className="shrink-0 w-56">
                  <SkillStatCard
                    name={skill.name}
                    hours={skill.totalHours}
                    streakDays={skill.streakDays}
                    color={skill.color}
                    onDelete={() => onDeleteSkill(skill.id)}
                    onOpen={() => onOpenSkill(skill.id)}
                  />
                </div>
              ))}

              {skillSummaries.length === 0 && (
                <div className="flex items-center justify-center w-full h-24 text-sm text-gray-400">
                  No skills yet. Add one to get started.
                </div>
              )}
            </div>

            {hasOverflow && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white/90 to-transparent" />
            )}
          </div>

          <div className="flex-1" data-tour="today-todos">
            <TodayTodos
              todos={todayTodos}
              onToggle={onToggleTodo}
              onFreeze={onFreezeTodo}
              onDelete={onDeleteTodo}
              onEdit={onEditHabit}
              improvement={habitsImprovement}
            />
          </div>
        </div>
      </div>

      {/* Practice Activity */}
      <div
        className="bg-white rounded-2xl shadow-card p-6"
        data-tour="heatmap"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900">
              Practice Activity
            </h2>
            <ImprovementBadge improvement={allSkillsImprovement} />
          </div>
          <span className="text-xs text-gray-400">Last 18 weeks</span>
        </div>
        <Heatmap data={heatmapData} />
      </div>

      {/* Recent Sessions */}
      <div data-tour="recent-sessions">
        <RecentSessions
          sessions={buildRecentSessions(sessions, skills)}
          onViewAll={() => navigate('/sessions')}
          onSelect={onSelectSession}
        />
      </div>
    </>
  );
};