import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  Flame,
  BarChart3,
  Bell,
  WifiOff,
  Download,
  Trophy,
  Target,
  Shield,
  // ─── Skill icons ───
  Music,
  Code2,
  Languages,
  Dumbbell,
  ChefHat,
  Palette,
  BookOpen,
  Camera,
  Mic,
  Plane,
  PenTool,
  Brain,
  Heart,
  Zap,
  Footprints,
  Bike,
  Coffee,
  Leaf,
  Flower,
  Sun,
  Mountain,
  CloudRain,
} from 'lucide-react';

// ─── Inline GitHub icon ─────────────────────────────────────────────
const GithubIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    aria-hidden="true"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

// ─── Mini visual components for the hero mockup ─────────────────────

const MiniRing: React.FC<{ progress: number }> = ({ progress }) => {
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
};

const MiniSkillRow: React.FC<{
  color: string;
  name: string;
  hours: string;
  streak: number;
}> = ({ color, name, hours, streak }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="text-[11px] font-medium text-gray-700">{name}</span>
    <span className="ml-auto text-[11px] font-bold text-gray-900">{hours}</span>
    <span className="flex items-center gap-0.5 text-[9px] text-orange-500">
      <Flame size={8} className="fill-orange-500" />
      {streak}
    </span>
  </div>
);

const MiniHeatmap: React.FC = () => {
  const cells = [
    0, 1, 2, 0, 1, 3, 2, 4, 1, 0, 2, 3, 1, 4, 2, 0, 1, 3, 1, 0, 2, 4, 3, 1, 2,
    0, 1, 3, 4, 2, 0, 1, 2, 3, 1, 4, 0, 2, 1, 3, 0, 1, 4, 2, 3, 1, 0, 2, 1, 3,
    4, 2, 0, 1, 2, 3, 1, 0, 2, 4, 1, 3, 2, 0, 1, 3, 4, 2, 1, 0, 3, 2, 1, 0, 2,
    3, 1, 4, 2, 0, 1, 3, 2, 4, 1, 0, 2, 3, 1, 4, 0, 2, 1, 3, 2, 0, 4, 1, 3, 2,
    0, 1, 4, 3, 2, 1, 0, 3, 2, 1, 0, 3, 1, 4, 2, 3, 0, 1, 2, 4, 3, 1, 0, 2, 1,
    3,
  ];
  const colors = ['#f3f4f6', '#d1fae5', '#6ee7b7', '#10b981', '#047857'];

  return (
    <div className="grid grid-rows-7 grid-flow-col gap-1">
      {cells.map((level, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-[2px]"
          style={{ backgroundColor: colors[level] }}
        />
      ))}
    </div>
  );
};

const HeroMockup: React.FC = () => (
  <div className="relative">
    <div
      className="absolute -inset-6 bg-emerald-400/20 blur-3xl rounded-3xl"
      aria-hidden="true"
    />

    <div className="relative bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
          <Sparkles size={12} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold text-gray-900 tracking-tight">
          SkillTrack
        </span>
        <span className="ml-auto text-[10px] text-gray-400 hidden sm:block">
          Good afternoon, Jordan
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
          <MiniRing progress={75} />
          <p className="text-[9px] text-gray-500 mt-2 font-medium">
            Weekly goal
          </p>
        </div>

        <div className="col-span-2 flex flex-col gap-2 justify-center">
          <MiniSkillRow
            color="#10b981"
            name="Spanish"
            hours="47.5h"
            streak={12}
          />
          <MiniSkillRow
            color="#8b5cf6"
            name="Guitar"
            hours="32h"
            streak={8}
          />
          <MiniSkillRow
            color="#3b82f6"
            name="TypeScript"
            hours="18h"
            streak={3}
          />
        </div>
      </div>

      <div className="mt-3 bg-gray-50 rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-700">
            Practice Activity
          </span>
          <span className="text-[9px] text-gray-400">Last 18 weeks</span>
        </div>
        <MiniHeatmap />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-emerald-600">
          +12%
        </span>
        <span className="text-[10px] text-emerald-500">from last month</span>
      </div>
    </div>
  </div>
);

// ─── Nav ────────────────────────────────────────────────────────────

const LandingNav: React.FC = () => (
  <nav className="flex items-center justify-between py-4 shrink-0">
    <Link to="/" className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-sm">
        <Sparkles size={17} strokeWidth={2.5} />
      </div>
      <span className="text-base font-bold text-gray-900 tracking-tight">
        SkillTrack
      </span>
    </Link>

    <div className="flex items-center gap-3">
      <Link
        to="/signin"
        className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
      >
        Sign in
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
      >
        Get started
        <ArrowRight size={14} />
      </Link>
    </div>
  </nav>
);

// ─── Animated skill icons ───────────────────────────────────────────

interface SkillIconDef {
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  position: React.CSSProperties;
  size: number;
  color: string;
  animation: string;
  duration: number;
  delay?: number;
}

const SKILL_ICONS: SkillIconDef[] = [
  // ── Top band ──
  {
    Icon: Music,
    position: { top: '3%', left: '8%', transform: 'rotate(-12deg)' },
    size: 52,
    color: '#5E7A66',
    animation: 'sway',
    duration: 4,
  },
  {
    Icon: Languages,
    position: { top: '8%', left: '33%' },
    size: 60,
    color: '#736A95',
    animation: 'speak',
    duration: 3.5,
    delay: 0.5,
  },
  {
    Icon: Camera,
    position: { top: '2%', left: '58%', transform: 'rotate(9deg)' },
    size: 44,
    color: '#9E6A64',
    animation: 'flash',
    duration: 5,
    delay: 1.2,
  },
  {
    Icon: Mountain,
    position: { top: '6%', left: '86%' },
    size: 56,
    color: '#4E8D85',
    animation: 'rise',
    duration: 6,
  },

  // ── Upper-mid band ──
  {
    Icon: Code2,
    position: { top: '20%', left: '3%', transform: 'rotate(-18deg)' },
    size: 38,
    color: '#5A7891',
    animation: 'jitter',
    duration: 2.4,
  },
  {
    Icon: Brain,
    position: { top: '26%', left: '19%' },
    size: 34,
    color: '#736A95',
    animation: 'think',
    duration: 5,
    delay: 0.8,
  },
  {
    Icon: Palette,
    position: { top: '19%', left: '45%', transform: 'rotate(6deg)' },
    size: 64,
    color: '#9E6A64',
    animation: 'mix',
    duration: 7,
  },
  {
    Icon: Mic,
    position: { top: '28%', left: '72%' },
    size: 46,
    color: '#736A95',
    animation: 'broadcast',
    duration: 2.8,
    delay: 0.3,
  },
  {
    Icon: Zap,
    position: { top: '22%', left: '93%', transform: 'rotate(-14deg)' },
    size: 32,
    color: '#94794E',
    animation: 'spark',
    duration: 4,
    delay: 2,
  },

  // ── Center band ──
  {
    Icon: BookOpen,
    position: { top: '42%', left: '1%' },
    size: 48,
    color: '#94794E',
    animation: 'open',
    duration: 4.2,
  },
  {
    Icon: Leaf,
    position: { top: '55%', left: '12%', transform: 'rotate(-28deg)' },
    size: 38,
    color: '#5E7A66',
    animation: 'rustle',
    duration: 5.5,
    delay: 1,
  },
  {
    Icon: Bike,
    position: { top: '48%', left: '95%', transform: 'rotate(8deg)' },
    size: 58,
    color: '#4E8D85',
    animation: 'coast',
    duration: 3.2,
  },
  {
    Icon: CloudRain,
    position: { top: '58%', left: '82%' },
    size: 56,
    color: '#4E8D85',
    animation: 'rain',
    duration: 3.8,
  },

  // ── Lower-mid band ──
  {
    Icon: Footprints,
    position: { top: '68%', left: '6%', transform: 'rotate(20deg)' },
    size: 42,
    color: '#5E7A66',
    animation: 'step',
    duration: 3.6,
    delay: 0.4,
  },
  {
    Icon: Heart,
    position: { top: '74%', left: '24%' },
    size: 36,
    color: '#9E6A64',
    animation: 'heartbeat',
    duration: 2.2,
  },
  {
    Icon: Coffee,
    position: { top: '70%', left: '48%', transform: 'rotate(-10deg)' },
    size: 40,
    color: '#94794E',
    animation: 'steam',
    duration: 3.4,
    delay: 1.5,
  },
  {
    Icon: PenTool,
    position: { top: '78%', left: '68%', transform: 'rotate(12deg)' },
    size: 36,
    color: '#5A7891',
    animation: 'write',
    duration: 2.6,
  },
  {
    Icon: Dumbbell,
    position: { top: '66%', left: '88%' },
    size: 52,
    color: '#5A7891',
    animation: 'pump',
    duration: 1.8,
  },

  // ── Bottom band ──
  {
    Icon: Plane,
    position: { top: '88%', left: '14%' },
    size: 54,
    color: '#736A95',
    animation: 'fly',
    duration: 14,
    delay: 2,
  },
  {
    Icon: Flower,
    position: { top: '92%', left: '40%' },
    size: 42,
    color: '#5E7A66',
    animation: 'bloom',
    duration: 5,
    delay: 0.8,
  },
  {
    Icon: Sun,
    position: { top: '86%', left: '62%', transform: 'rotate(15deg)' },
    size: 50,
    color: '#94794E',
    animation: 'spin',
    duration: 18,
  },
  {
    Icon: ChefHat,
    position: { top: '90%', left: '83%' },
    size: 44,
    color: '#94794E',
    animation: 'bob',
    duration: 3.5,
    delay: 0.6,
  },
];

const SkillIconsBackground: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    {SKILL_ICONS.map(
      ({ Icon, position, size, color, animation, duration, delay }, i) => (
        <div key={i} style={{ position: 'absolute', ...position }}>
          <Icon
            size={size}
            strokeWidth={2.2}
            style={{
              color,
              opacity: 0.22,
              animation: `icon-${animation} ${duration}s ease-in-out ${
                delay ?? 0
              }s infinite`,
              willChange: 'transform, filter, opacity',
            }}
          />
        </div>
      )
    )}
  </div>
);

// ─── Feature data ───────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <TrendingUp size={20} />,
    tone: 'bg-[#E5EDE6] text-[#5E7A66]',
    title: 'Track any skill',
    description:
      'Log practice sessions with duration and notes. Watch your total hours and streaks build up automatically.',
  },
  {
    icon: <Flame size={20} />,
    tone: 'bg-[#F2E5E4] text-[#9E6A64]',
    title: 'Build daily habits',
    description:
      'Check off habits, build streaks, and see a 7-day mini-heatmap on every row. Freeze habits you need a break from.',
  },
  {
    icon: <BarChart3 size={20} />,
    tone: 'bg-[#E2EBF1] text-[#5A7891]',
    title: 'See your consistency',
    description:
      'An 18-week heatmap shows every day you showed up. Spot patterns, gaps, and streaks you didn’t know you had.',
  },
  {
    icon: <Bell size={20} />,
    tone: 'bg-[#ECE7F2] text-[#736A95]',
    title: 'One-tap reminders',
    description:
      'Set a native alarm on Android, or export a calendar event on iOS and desktop. Never miss a session or habit again.',
  },
  {
    icon: <WifiOff size={20} />,
    tone: 'bg-[#F1EBDD] text-[#94794E]',
    title: 'Works offline',
    description:
      'Log sessions on a plane, in the subway, anywhere. Changes queue locally and sync the moment you reconnect.',
  },
  {
    icon: <Download size={20} />,
    tone: 'bg-[#DFEDEB] text-[#4E8D85]',
    title: 'Your data, exportable',
    description:
      'Download a full JSON backup or CSV exports of every session and habit. No lock-in, ever.',
  },
];

const Features: React.FC = () => (
  <section className="relative py-16 md:py-24 overflow-hidden min-h-[700px]">
    {/* Soft veil so the icons read against a calmer base */}
    

    {/* Scattered animated skill icons */}
    <SkillIconsBackground />

    <div className="relative z-10">
      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5E7A66]">
          Everything you need
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 leading-tight">
          Built for people who actually want to get better
        </h2>
        <p className="text-base text-gray-500 mt-4">
          Not another habit tracker. SkillTrack brings skills, habits, and
          visualization together into one calm dashboard you’ll actually open
          every day.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl shadow-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${f.tone}`}
            >
              {f.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How it works ───────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Target size={20} />,
    title: 'Add a skill or habit',
    description:
      'Skills are things you practice. Habits are things you do daily. Set up your first one in under a minute.',
  },
  {
    step: '02',
    icon: <Check size={20} />,
    title: 'Log as you go',
    description:
      'Log practice sessions with a duration and notes. Check off habits when you complete them. One tap each.',
  },
  {
    step: '03',
    icon: <Trophy size={20} />,
    title: 'Watch it compound',
    description:
      'Rings fill, streaks grow, the heatmap darkens. Week after week you’ll see evidence of showing up.',
  },
];

const HowItWorks: React.FC = () => (
  <section className="py-16 md:py-24">
    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
        How it works
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 leading-tight">
        Three minutes to set up. Years of payoff.
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
      <div
        className="hidden md:block absolute top-12 left-16 right-16 h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200"
        aria-hidden="true"
      />

      {HOW_IT_WORKS.map((s) => (
        <div key={s.step} className="relative">
          <div className="relative z-10 bg-white rounded-2xl shadow-card p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              {s.icon}
            </div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
              Step {s.step}
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-1.5 mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {s.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ─── Final CTA ──────────────────────────────────────────────────────

const FinalCTA: React.FC = () => (
  <section className="py-16 md:py-24">
    <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="relative p-8 md:p-14 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-6">
          <Shield size={12} className="text-white" />
          <span className="text-xs font-semibold text-white">
            Free forever · No credit card
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-2xl mx-auto">
          Start building the skills and habits you keep meaning to start
        </h2>
        <p className="text-base text-white/90 mt-4 max-w-lg mx-auto">
          Set up your first skill or habit in under a minute. Log your first
          session today. Look back in a month and be amazed.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link
            to="/signup"
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Create free account
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/signin"
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ─── Footer ─────────────────────────────────────────────────────────

const Footer: React.FC = () => (
  <footer className="pt-16 pb-8 border-t border-gray-200/60">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500 text-white shadow-sm">
            <Sparkles size={15} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            SkillTrack
          </span>
        </div>
        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
          A calm, focused tracker for the skills and habits that matter to
          you. Built with care, designed for the long game.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-3">
          Product
        </h4>
        <ul className="flex flex-col gap-2">
          <li>
            <a
              href="#features"
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              How it works
            </a>
          </li>
          <li>
            <Link
              to="/signup"
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Get started
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-3">
          Account
        </h4>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              to="/signin"
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Sign in
            </Link>
          </li>
          <li>
            <Link
              to="/signup"
              className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Create account
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-[11px] text-gray-400">
        © {new Date().getFullYear()} SkillTrack. Made with care.
      </p>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <GithubIcon size={14} />
        </a>
        <span className="text-[11px] text-gray-400">
          Built with React · TypeScript · Supabase
        </span>
      </div>
    </div>
  </footer>
);

// ─── Main landing page ──────────────────────────────────────────────

export const LandingPage: React.FC = () => {
  return (
    <>
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

      <div className="min-h-screen font-sans">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          {/* ═══ HERO — fills the viewport ═══ */}
          <div className="min-h-[100svh] flex flex-col">
            <LandingNav />

            <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center py-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-emerald-200/60 rounded-full px-3 py-1.5 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Now with offline support
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.05] tracking-tight">
                  Track the skills and habits that{' '}
                  <span className="bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    actually
                  </span>{' '}
                  stick.
                </h1>

                <p className="text-base md:text-lg text-gray-600 mt-5 leading-relaxed max-w-lg">
                  SkillTrack turns your daily practice into visible progress.
                  Log skill sessions, check off habits, and watch the
                  compounding evidence of showing up — all in one calm
                  dashboard.
                </p>

                <div className="flex items-center gap-3 mt-8 flex-wrap">
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    Start tracking free
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/signin"
                    className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    Sign in
                  </Link>
                </div>

                <div className="flex items-center gap-5 mt-8 flex-wrap">
                  {[
                    'No credit card required',
                    'Works offline',
                    'Export anytime',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-xs text-gray-500"
                    >
                      <Check size={12} className="text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative lg:pl-8">
                <HeroMockup />
              </div>
            </section>
          </div>
          {/* ═══ /HERO ═══ */}

          <div id="features">
            <Features />
          </div>

          <div id="how-it-works">
            <HowItWorks />
          </div>

          <FinalCTA />

          <Footer />
        </div>
      </div>
    </>
  );
};