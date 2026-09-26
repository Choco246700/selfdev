import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Palette,
  Bell,
} from 'lucide-react';

interface TourStep {
  id: string;
  /** CSS selector for the element to spotlight. Empty string = centered modal. */
  selector: string;
  title: string;
  description: string;
  /** Preferred tooltip placement relative to the target. */
  preferred?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional "mini-visual" to show inside the tooltip. */
  visual?: 'colorPalette' | 'bellPreview';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    selector: '',
    title: 'Welcome to SkillTrack 👋',
    description:
      "Let's take a quick tour. I'll show you how to track skills, build habits, and see your progress at a glance. This takes about 60 seconds.",
  },
  {
    id: 'header',
    selector: '[data-tour="header-actions"]',
    title: 'The three buttons you’ll use most',
    description:
      'Log Session records practice time for an existing skill. New Skill adds a skill you want to master. New Habit creates a daily routine you want to build. Tap your avatar (top-right) to sign out anytime.',
    preferred: 'bottom',
  },
  {
    id: 'most-practiced',
    selector: '[data-tour="most-practiced"]',
    title: 'Your top skill at a glance',
    description:
      'Your most-practiced skill lives here. The ring shows how close you are to this week’s goal. Total hours and current streak sit below. The calendar lets you jump back in time and see when you practiced.',
    preferred: 'right',
  },
  {
    id: 'skills-row',
    selector: '[data-tour="skills-row"]',
    title: 'All your skills, one row',
    description:
      'Every skill you add appears here. Scroll sideways when you have many. Each card shows total hours and streak — and a trash icon to remove it (you’ll be asked to confirm). Tap a card to open its detail page with charts and notes.',
    preferred: 'bottom',
  },
  {
    id: 'color-picker',
    selector: '',
    title: 'Make each skill feel like yours',
    description:
      'When you create a skill, pick a preset color from our palette, or use the custom picker to dial in any hex code you like. That color follows your skill everywhere — stat cards, session rows, the heatmap, all of it.',
    visual: 'colorPalette',
  },
  {
    id: 'today-todos',
    selector: '[data-tour="today-todos"]',
    title: 'Today’s habits',
    description:
      'Check the box to mark a habit done for today. Swipe a row left to reveal Freeze and Delete: freezing pauses the habit until you’re ready to bring it back. Frozen habits turn to ice — literally.',
    preferred: 'bottom',
  },
  {
    id: 'reminder-bell',
    selector: '[data-tour="reminder-bell"]',
    title: 'Set an alarm in one tap',
    description:
      'That little bell next to each habit is your reminder shortcut. On Android, it opens your Clock app with the alarm pre-filled — just tap Save. On iPhone and desktop, it downloads a calendar reminder you can drop straight into your calendar app.',
    preferred: 'left',
    visual: 'bellPreview',
  },
  {
    id: 'heatmap',
    selector: '[data-tour="heatmap"]',
    title: 'See your consistency',
    description:
      'Each square is a day from the last 18 weeks. The darker the green, the more you practiced. You’ll spot patterns fast — great weeks, gaps, streaks you didn’t notice.',
    preferred: 'top',
  },
  {
    id: 'recent-sessions',
    selector: '[data-tour="recent-sessions"]',
    title: 'Your recent sessions',
    description:
      'The last five sessions you logged. Click any row to edit the duration or notes, or delete it entirely. Tap "View all" to open the full history with filters.',
    preferred: 'top',
  },
  {
    id: 'done',
    selector: '',
    title: 'You’re all set 🎉',
    description:
      'Start by creating your first skill, then log a session. Habits can wait until you’re ready — SkillTrack will be right here. Have fun!',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  onComplete,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 200 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isCentered = step.selector === '';

  // ─── Scroll target into view + measure ───────────────────────────
  useEffect(() => {
    if (isCentered) {
      setTargetRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(step.selector);
      setTargetRect(el ? el.getBoundingClientRect() : null);
    };

    const el = document.querySelector(step.selector);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const t = setTimeout(measure, 450);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, isCentered]);

  // ─── Measure tooltip ─────────────────────────────────────────────
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [stepIndex, targetRect]);

  // ─── Keyboard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) onComplete();
        else setStepIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && !isFirst) {
        setStepIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFirst, isLast, onComplete]);

  // ─── Tooltip position ─────────────────────────────────────────────
  const position = useMemo(() => {
    const GAP = 18;
    const MARGIN = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      return {
        top: vh / 2 - tooltipSize.height / 2,
        left: vw / 2 - tooltipSize.width / 2,
        arrow: 'none' as const,
      };
    }

    const canFit = {
      below: targetRect.bottom + GAP + tooltipSize.height < vh - MARGIN,
      above: targetRect.top - GAP - tooltipSize.height > MARGIN,
      right: targetRect.right + GAP + tooltipSize.width < vw - MARGIN,
      left: targetRect.left - GAP - tooltipSize.width > MARGIN,
    };

    const order: Array<'below' | 'above' | 'right' | 'left'> = [
      'below',
      'above',
      'right',
      'left',
    ];
    if (step.preferred === 'top') order.unshift('above');
    if (step.preferred === 'bottom') order.unshift('below');
    if (step.preferred === 'left') order.unshift('left');
    if (step.preferred === 'right') order.unshift('right');

    for (const dir of order) {
      if (dir === 'below' && canFit.below) {
        return {
          top: targetRect.bottom + GAP,
          left: Math.max(
            MARGIN,
            Math.min(
              vw - tooltipSize.width - MARGIN,
              targetRect.left + targetRect.width / 2 - tooltipSize.width / 2
            )
          ),
          arrow: 'top' as const,
        };
      }
      if (dir === 'above' && canFit.above) {
        return {
          top: targetRect.top - GAP - tooltipSize.height,
          left: Math.max(
            MARGIN,
            Math.min(
              vw - tooltipSize.width - MARGIN,
              targetRect.left + targetRect.width / 2 - tooltipSize.width / 2
            )
          ),
          arrow: 'bottom' as const,
        };
      }
      if (dir === 'right' && canFit.right) {
        return {
          top: Math.max(
            MARGIN,
            Math.min(
              vh - tooltipSize.height - MARGIN,
              targetRect.top + targetRect.height / 2 - tooltipSize.height / 2
            )
          ),
          left: targetRect.right + GAP,
          arrow: 'left' as const,
        };
      }
      if (dir === 'left' && canFit.left) {
        return {
          top: Math.max(
            MARGIN,
            Math.min(
              vh - tooltipSize.height - MARGIN,
              targetRect.top + targetRect.height / 2 - tooltipSize.height / 2
            )
          ),
          left: targetRect.left - GAP - tooltipSize.width,
          arrow: 'right' as const,
        };
      }
    }

    return {
      top: vh - tooltipSize.height - 32,
      left: vw / 2 - tooltipSize.width / 2,
      arrow: 'none' as const,
    };
  }, [targetRect, tooltipSize, step.preferred]);

  const progress = `${stepIndex + 1} / ${TOUR_STEPS.length}`;

  return (
    <div
      className="fixed inset-0 z-100"
      role="dialog"
      aria-label="Onboarding tour"
      aria-modal="true"
    >
      {/* Spotlight / backdrop */}
      {targetRect ? (
        <Spotlight rect={targetRect} />
      ) : (
        <div className="fixed inset-0 bg-black/60 animate-[fade-in_0.3s_ease-out]" />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          top: position.top,
          left: position.left,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
        }}
        className="fixed z-101 bg-white rounded-2xl shadow-2xl p-5 animate-[fade-in_0.35s_ease-out]"
      >
        {/* Arrow */}
        {position.arrow !== 'none' && targetRect && (
          <Arrow arrow={position.arrow} rect={targetRect} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white shrink-0">
              <Sparkles size={14} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onComplete}
            aria-label="Skip tour"
            className="p-1 -m-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Optional mini-visual */}
        {step.visual === 'colorPalette' && <ColorPalettePreview />}
        {step.visual === 'bellPreview' && <BellPreview />}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-4 bg-emerald-500'
                    : i < stepIndex
                    ? 'w-1.5 bg-emerald-300'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStepIndex((i) => i - 1)}
                className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={12} />
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setStepIndex((i) => i + 1);
              }}
              className="flex items-center gap-0.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              {isFirst ? 'Start tour' : isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight size={12} />}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-3 text-center">{progress}</p>
      </div>
    </div>
  );
};

// ─── Spotlight: SVG mask with a cutout ─────────────────────────────
const Spotlight: React.FC<{ rect: DOMRect }> = ({ rect }) => {
  const PAD = 8;
  const x = rect.left - PAD;
  const y = rect.top - PAD;
  const w = rect.width + PAD * 2;
  const h = rect.height + PAD * 2;

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
    >
      <defs>
        <mask id="tour-spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx="14" fill="black" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.65)"
        mask="url(#tour-spotlight-mask)"
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="14"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        opacity="0.9"
      />
    </svg>
  );
};

// ─── Tooltip arrow ─────────────────────────────────────────────────
const Arrow: React.FC<{
  arrow: 'top' | 'bottom' | 'left' | 'right';
  rect: DOMRect;
}> = ({ arrow, rect }) => {
  const size = 12;
  const common = 'absolute w-3 h-3 bg-white rotate-45';

  if (arrow === 'top') {
    const centerX = rect.left + rect.width / 2;
    return (
      <div
        style={{
          top: -size / 2,
          left: `calc(${centerX}px - 50% - ${size / 2}px)`,
          transform: 'translateX(50%)',
        }}
        className={`${common} shadow-[-2px_-2px_4px_rgba(0,0,0,0.04)]`}
      />
    );
  }
  if (arrow === 'bottom') {
    return (
      <div
        style={{
          bottom: -size / 2,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        className={`${common} shadow-[2px_2px_4px_rgba(0,0,0,0.04)]`}
      />
    );
  }
  if (arrow === 'left') {
    return (
      <div
        style={{ left: -size / 2, top: '50%', transform: 'translateY(-50%)' }}
        className={`${common} shadow-[-2px_2px_4px_rgba(0,0,0,0.04)]`}
      />
    );
  }
  return (
    <div
      style={{ right: -size / 2, top: '50%', transform: 'translateY(-50%)' }}
      className={`${common} shadow-[2px_-2px_4px_rgba(0,0,0,0.04)]`}
    />
  );
};

// ─── Inline color palette preview ──────────────────────────────────
const ColorPalettePreview: React.FC = () => {
  const palette = [
    ['#34d399', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'],
    ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
    ['#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b'],
  ];
  return (
    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
      <div className="flex flex-col gap-1.5">
        {palette.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map((hex) => (
              <div
                key={hex}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center">
          <Palette size={11} className="text-white" />
        </div>
        <span className="text-[10px] text-gray-500 font-medium">
          Or pick any custom color
        </span>
      </div>
    </div>
  );
};

// ─── Inline bell preview ───────────────────────────────────────────
const BellPreview: React.FC = () => {
  return (
    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
      {/* Fake habit row */}
      <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
          🎸
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            Practice guitar
          </p>
          <p className="text-[10px] text-gray-400">6:00 PM</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Bell size={12} />
        </div>
        <div className="w-4 h-4 rounded border border-gray-300 shrink-0" />
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
        <span className="text-[10px] text-gray-500 font-medium">
          Tap the bell → Android: set alarm · iOS: add to calendar
        </span>
      </div>
    </div>
  );
};