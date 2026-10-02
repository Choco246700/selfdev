import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { NewHabitModal } from './components/NewHabitModal';
import { NewSessionModal } from './components/NewSessionModal';
import { NewSkillModal } from './components/NewSkillModal';
import { EditSkillModal } from './components/EditSkillModal';
import { EditHabitModal } from './components/EditHabitModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { FeedbackModal } from './components/FeedbackModal';
import { DashboardSkeleton } from './components/Skeleton';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingTour } from './components/OnboardingTour';
import { AdminGuard } from './components/AdminGuard';
import { useAuth } from './hooks/useAuth';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useOnboarding } from './hooks/useOnboarding';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePendingQueue } from './hooks/usePendingQueue';
import { useOfflineSync } from './hooks/useOfflineSync';
import {
  exportAllAsJSON,
  exportSessionsAsCSV,
  exportHabitsAsCSV,
} from './utils/export';
import type { NewHabitInput } from './components/TodayTodos';

// ─── Lazy-loaded pages ───────────────────────────────────────────────
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const SessionHistoryPage = lazy(() =>
  import('./pages/SessionHistoryPage').then((m) => ({
    default: m.SessionHistoryPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  }))
);
const SkillDetailPage = lazy(() =>
  import('./pages/SkillDetailPage').then((m) => ({
    default: m.SkillDetailPage,
  }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);

// ─── Root: auth gate ─────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Notify user if redirected to root with an OAuth error
    const searchParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashString);

    const errorParam =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (errorParam) {
      toast.error(decodeURIComponent(errorParam.replace(/\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return <FullScreenLoader />;
  }

  // Password reset — always accessible, even when logged in
  if (location.pathname === '/reset-password') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <ResetPasswordPage />
      </Suspense>
    );
  }

  // Logged in → straight to the app for any route
  if (user) {
    return <AppContent />;
  }

  // Not logged in → landing page or auth pages
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<AuthPage initialMode="signin" />} />
        <Route path="/signup" element={<AuthPage initialMode="signup" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// ─── Authed shell ────────────────────────────────────────────────────
function AppContent() {
  const {
    skills,
    sessions,
    habits,
    habitLogs,
    loading,
    refetch,
    addSkill,
    updateSkill,
    deleteSkill,
    addSession,
    updateSession,
    deleteSession,
    addHabit,
    updateHabit,
    freezeHabit,
    deleteHabit,
    toggleHabit,
  } = useSupabaseData();

  const { user } = useAuth();

  const {
    showTour,
    checked: onboardingChecked,
    completeTour,
    restartTour,
  } = useOnboarding();

  const navigate = useNavigate();

  // ─── Offline awareness ──────────────────────────────────────────
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingQueue();

  const handleDrained = useCallback(() => {
    refetch();
  }, [refetch]);

  const isSyncing = useOfflineSync(isOnline, handleDrained);

  // ─── Modal state ────────────────────────────────────────────────
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // ─── Derived: current selections ────────────────────────────────
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );
  const selectedSessionSkill = useMemo(
    () => skills.find((s) => s.id === selectedSession?.skillId),
    [skills, selectedSession]
  );
  const editingSkill = useMemo(
    () => skills.find((s) => s.id === editingSkillId) ?? null,
    [skills, editingSkillId]
  );
  const editingHabit = useMemo(
    () => habits.find((h) => h.id === editingHabitId) ?? null,
    [habits, editingHabitId]
  );

  // ─── Handlers: habits ───────────────────────────────────────────
  const handleToggleTodo = async (habitId: string) => {
    try {
      await toggleHabit(habitId);
    } catch (err) {
      console.error(err);
      toast.error('Could not update habit.');
    }
  };

  const handleFreezeTodo = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    try {
      await freezeHabit(habitId, !habit.frozen);
    } catch (err) {
      console.error(err);
      toast.error('Could not freeze habit.');
    }
  };

  const handleDeleteTodo = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      toast.success('Habit deleted');
    } catch (err) {
      console.error(err);
      toast.error('Could not delete habit.');
    }
  };

  const handleAddTodo = async (data: NewHabitInput) => {
    try {
      await addHabit({
        emoji: data.emoji,
        name: data.title,
        targetTime: data.time,
        location: data.location,
      });
      toast.success('Habit created');
    } catch (err) {
      console.error(err);
      toast.error('Could not create habit.');
    }
  };

  const handleUpdateHabit = async (
    id: string,
    patch: {
      emoji: string;
      name: string;
      targetTime: string;
      location: string;
    }
  ) => {
    try {
      await updateHabit(id, patch);
      toast.success('Habit updated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update habit.');
    }
  };

  // ─── Handlers: skills ───────────────────────────────────────────
  const handleCreateSkill = async (data: {
    name: string;
    color: string;
    weeklyGoalHours: number;
  }) => {
    try {
      await addSkill(data);
      toast.success(`Skill "${data.name}" created`);
    } catch (err) {
      console.error(err);
      toast.error('Could not create skill.');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    try {
      await deleteSkill(skillId);
      toast.success(`Skill "${skill.name}" deleted`);
    } catch (err) {
      console.error(err);
      toast.error('Could not delete skill.');
    }
  };

  const handleUpdateSkill = async (
    id: string,
    patch: { name: string; color: string; weeklyGoalHours: number }
  ) => {
    try {
      await updateSkill(id, patch);
      toast.success('Skill updated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update skill.');
    }
  };

  // ─── Handlers: sessions ─────────────────────────────────────────
  const handleLogSession = async (data: {
    skillId: string;
    durationMinutes: number;
    notes: string;
  }) => {
    try {
      await addSession(data);
      toast.success('Session logged');
    } catch (err) {
      console.error(err);
      toast.error('Could not log session.');
    }
  };

  const handleUpdateSession = async (
    id: string,
    patch: Partial<{ durationMinutes: number; notes: string }>
  ) => {
    try {
      await updateSession(id, patch);
      toast.success('Session updated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update session.');
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      toast.success('Session deleted');
    } catch (err) {
      console.error(err);
      toast.error('Could not delete session.');
    }
  };

  // ─── Handlers: export ───────────────────────────────────────────
  const handleExportJSON = () => {
    try {
      exportAllAsJSON({
        userEmail: user?.email,
        skills,
        sessions,
        habits,
        habitLogs,
      });
      toast.success('Backup downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Export failed.');
    }
  };

  const handleExportSessionsCSV = () => {
    try {
      if (sessions.length === 0) {
        toast.error('No sessions to export yet.');
        return;
      }
      exportSessionsAsCSV(sessions, skills);
      toast.success('Sessions exported');
    } catch (err) {
      console.error(err);
      toast.error('Export failed.');
    }
  };

  const handleExportHabitsCSV = () => {
    try {
      if (habits.length === 0) {
        toast.error('No habits to export yet.');
        return;
      }
      exportHabitsAsCSV(habits, habitLogs);
      toast.success('Habits exported');
    } catch (err) {
      console.error(err);
      toast.error('Export failed.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Background layers */}
      <div className="fixed inset-0 -z-10 bg-mesh-c2" aria-hidden="true" />
      <div
        className="fixed inset-0 -z-10 bg-grid pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 -z-10 bg-vignette pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 -z-10 bg-noise opacity-[0.10] mix-blend-multiply pointer-events-none"
        aria-hidden="true"
      />

      <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 font-sans">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <Header
            onNewSkillClick={() => setIsSkillModalOpen(true)}
            onNewHabitClick={() => setIsHabitModalOpen(true)}
            onLogSessionClick={() => setIsSessionModalOpen(true)}
            onReplayTour={restartTour}
            onExportJSON={handleExportJSON}
            onExportSessionsCSV={handleExportSessionsCSV}
            onExportHabitsCSV={handleExportHabitsCSV}
            onSendFeedback={() => setIsFeedbackModalOpen(true)}
          />

          <OfflineBanner
            isOnline={isOnline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
          />

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <Suspense fallback={<DashboardSkeleton />}>
              <Routes>
                <Route
                  path="/skills/:skillId"
                  element={
                    <SkillDetailPage
                      skills={skills}
                      sessions={sessions}
                      onEditSkill={setEditingSkillId}
                      onDeleteSkill={handleDeleteSkill}
                      onSelectSession={setSelectedSessionId}
                    />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/"
                  element={
                    <DashboardPage
                      skills={skills}
                      sessions={sessions}
                      habits={habits}
                      habitLogs={habitLogs}
                      onToggleTodo={handleToggleTodo}
                      onFreezeTodo={handleFreezeTodo}
                      onDeleteTodo={handleDeleteTodo}
                      onEditHabit={setEditingHabitId}
                      onDeleteSkill={handleDeleteSkill}
                      onOpenSkill={(id) => navigate(`/skills/${id}`)}
                      onSelectSession={setSelectedSessionId}
                    />
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <SessionHistoryPage
                      sessions={sessions}
                      skills={skills}
                      onSelectSession={setSelectedSessionId}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          )}
        </div>
      </div>

      <MobileNav onLogSessionClick={() => setIsSessionModalOpen(true)} />

      {/* Modals */}
      <NewHabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleAddTodo}
      />

      <NewSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        skills={skills}
        onSave={handleLogSession}
      />

      <NewSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSave={handleCreateSkill}
        usedColors={skills.map((s) => s.color)}
      />

      <EditSkillModal
        skill={editingSkill}
        isOpen={editingSkillId !== null}
        onClose={() => setEditingSkillId(null)}
        onSave={handleUpdateSkill}
        usedColors={skills.map((s) => s.color)}
      />

      <EditHabitModal
        habit={editingHabit}
        isOpen={editingHabitId !== null}
        onClose={() => setEditingHabitId(null)}
        onSave={handleUpdateHabit}
      />

      <SessionDetailModal
        session={selectedSession}
        skill={selectedSessionSkill}
        isOpen={selectedSessionId !== null}
        onClose={() => setSelectedSessionId(null)}
        onUpdate={handleUpdateSession}
        onDelete={handleDeleteSession}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Onboarding tour */}
      {onboardingChecked && !loading && showTour && (
        <OnboardingTour onComplete={completeTour} />
      )}
    </>
  );
}

// ─── Full-screen loader ──────────────────────────────────────────────
function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Loading SkillTrack…</p>
      </div>
    </div>
  );
}