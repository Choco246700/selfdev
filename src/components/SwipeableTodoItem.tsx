import React, { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Clock, Snowflake, Flame, Bell } from 'lucide-react';
import type { Todo } from './TodayTodos';
import { HabitRing } from './HabitRing';
import {
  isAndroid,
  openAndroidAlarm,
  downloadCalendarEvent,
} from '../utils/reminders';

interface SwipeableTodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onFreeze: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

// ─── Layout math (two buttons in the swipe panel now) ────────────────
const BUTTON_WIDTH = 64;
const BUTTON_GAP = 8;
const PANEL_PAD_LEFT = 12;
const PANEL_PAD_RIGHT = 12;
const REVEAL_WIDTH =
  PANEL_PAD_LEFT + BUTTON_WIDTH + BUTTON_GAP + BUTTON_WIDTH + PANEL_PAD_RIGHT;
// = 12 + 64 + 8 + 64 + 12 = 160

const DRAG_THRESHOLD = 6;
const OPEN_THRESHOLD = 40;
const CLICK_AFTER_DRAG_WINDOW = 100;
const BREAK_DURATION = 1000;

const SHARDS = [
  { x: 8, y: 55, tx: -30, ty: -22, r: -50, s: 7, delay: 120 },
  { x: 20, y: 30, tx: -25, ty: -18, r: -30, s: 6, delay: 140 },
  { x: 30, y: 70, tx: -22, ty: 26, r: 60, s: 8, delay: 130 },
  { x: 42, y: 20, tx: -15, ty: -28, r: 80, s: 5, delay: 170 },
  { x: 52, y: 60, tx: -10, ty: 24, r: -25, s: 7, delay: 150 },
  { x: 60, y: 25, tx: 12, ty: -28, r: -70, s: 6, delay: 160 },
  { x: 70, y: 55, tx: 22, ty: 22, r: 45, s: 8, delay: 140 },
  { x: 80, y: 30, tx: 28, ty: -24, r: -55, s: 5, delay: 180 },
  { x: 90, y: 60, tx: 32, ty: 20, r: 35, s: 7, delay: 130 },
  { x: 15, y: 15, tx: -28, ty: -26, r: 45, s: 5, delay: 190 },
  { x: 65, y: 15, tx: 20, ty: -30, r: 55, s: 6, delay: 155 },
  { x: 88, y: 30, tx: 30, ty: -18, r: 40, s: 5, delay: 200 },
];

const CRACK_PATHS = [
  { d: 'M 200 36 L 170 30 L 140 34 L 100 20 L 60 24', delay: 0 },
  { d: 'M 200 36 L 230 42 L 260 38 L 300 50 L 340 46', delay: 30 },
  { d: 'M 200 36 L 195 20 L 185 8 L 170 2', delay: 60 },
  { d: 'M 200 36 L 205 52 L 195 64 L 180 70', delay: 90 },
  { d: 'M 170 30 L 160 44 L 145 55', delay: 120 },
  { d: 'M 260 38 L 270 24 L 285 14', delay: 150 },
];

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export const SwipeableTodoItem: React.FC<SwipeableTodoItemProps> = ({
  todo,
  onToggle,
  onFreeze,
  onDelete,
  onEdit,
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  const offsetRef = useRef(0);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const lastDragEndRef = useRef(0);
  const wasFrozenRef = useRef(todo.frozen);

  useEffect(() => {
    if (wasFrozenRef.current && !todo.frozen) {
      setIsBreaking(true);
      wasFrozenRef.current = todo.frozen;
      const t = setTimeout(() => setIsBreaking(false), BREAK_DURATION);
      return () => clearTimeout(t);
    }
    wasFrozenRef.current = todo.frozen;
  }, [todo.frozen]);

  const applyOffset = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const delta = e.clientX - startXRef.current;

    if (!hasDraggedRef.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      hasDraggedRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const next = Math.max(
      -REVEAL_WIDTH,
      Math.min(0, startOffsetRef.current + delta)
    );
    applyOffset(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (!hasDraggedRef.current) return;

    hasDraggedRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    lastDragEndRef.current = Date.now();
    const live = offsetRef.current;
    applyOffset(live <= -OPEN_THRESHOLD ? -REVEAL_WIDTH : 0);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (Date.now() - lastDragEndRef.current < CLICK_AFTER_DRAG_WINDOW) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (offsetRef.current !== 0) {
      e.stopPropagation();
      e.preventDefault();
      applyOffset(0);
    }
  };

  const handleFreezeClick = () => {
    onFreeze(todo.id);
    applyOffset(0);
  };

  const handleDeleteClick = () => {
    onDelete(todo.id);
    applyOffset(0);
  };

  const handleEditClick = () => {
    if (offsetRef.current !== 0) {
      applyOffset(0);
      return;
    }
    onEdit();
  };

  // ─── Inline reminder handler ──────────────────────────────────────
  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (offsetRef.current !== 0) {
      applyOffset(0);
      return;
    }
    const time = todo.habit.targetTime;
    if (!time || !time.includes(':')) return;

    const [hour, minute] = time.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) return;

    if (isAndroid()) {
      openAndroidAlarm(hour, minute, `${todo.emoji} ${todo.title}`);
    } else {
      downloadCalendarEvent({
        name: todo.title,
        targetTime: time,
        emoji: todo.emoji,
      });
    }
  };

  const isOpen = offset !== 0;
  const showFrost = todo.frozen || isBreaking;
  const hasReminderTime =
    !todo.frozen && Boolean(todo.habit.targetTime?.includes(':'));

  return (
    <li className="relative overflow-hidden">
      {/* ─── Action buttons (Freeze + Delete only) ────────────────── */}
      <div
        className={`absolute inset-y-0 right-0 flex items-stretch gap-2 py-2 transition-opacity duration-150 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingLeft: PANEL_PAD_LEFT,
          paddingRight: PANEL_PAD_RIGHT,
        }}
      >
        <button
          onClick={handleFreezeClick}
          aria-label={todo.frozen ? 'Unfreeze habit' : 'Freeze habit'}
          tabIndex={isOpen ? 0 : -1}
          style={{ width: BUTTON_WIDTH }}
          className={`flex items-center justify-center rounded-lg text-xs font-semibold text-white shadow-sm transition-colors ${
            todo.frozen
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {todo.frozen ? 'Unfreeze' : 'Freeze'}
        </button>

        <button
          onClick={handleDeleteClick}
          aria-label="Delete habit"
          tabIndex={isOpen ? 0 : -1}
          style={{ width: BUTTON_WIDTH }}
          className="flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          Delete
        </button>
      </div>

      {/* ─── Sliding content ─────────────────────────────────────── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onClick={handleEditClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="relative flex items-center gap-3 px-4 py-4 touch-pan-y select-none bg-white cursor-pointer"
      >
        {/* Frost overlay */}
        {showFrost && (
          <div
            className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${
              isBreaking
                ? 'animate-[frost-break-fade_0.9s_ease-out_forwards]'
                : 'animate-[frost-overlay-in_0.7s_ease-out]'
            }`}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-200/70 via-cyan-100/50 to-blue-200/75" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0%, transparent 3%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.85) 0%, transparent 2.5%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.8) 0%, transparent 2%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.9) 0%, transparent 3%)",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-transparent via-white to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-0.75 bg-linear-to-r from-transparent via-blue-300/90 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-0.75 bg-linear-to-b from-transparent via-white/80 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-0.75 bg-linear-to-b from-transparent via-white/80 to-transparent" />

            <Snowflake size={18} strokeWidth={2} className="absolute top-2 left-3 text-blue-400/90 animate-[crystal-drift_4s_ease-in-out_infinite]" />
            <Snowflake size={12} strokeWidth={2} className="absolute top-6 left-24 text-blue-400/80 animate-[crystal-drift_5s_ease-in-out_infinite_0.8s]" />
            <Snowflake size={14} strokeWidth={2} className="absolute bottom-2 left-12 text-blue-400/85 animate-[crystal-drift_4.5s_ease-in-out_infinite_1.5s]" />
            <Snowflake size={10} strokeWidth={2} className="absolute bottom-1 left-40 text-blue-300/80 animate-[crystal-drift_5.5s_ease-in-out_infinite_0.3s]" />
            <Snowflake size={16} strokeWidth={2} className="absolute top-1 right-44 text-blue-400/90 animate-[crystal-drift_4.2s_ease-in-out_infinite_2s]" />
            <Snowflake size={11} strokeWidth={2} className="absolute bottom-3 right-32 text-blue-400/80 animate-[crystal-drift_5.2s_ease-in-out_infinite_1.1s]" />
            <Snowflake size={13} strokeWidth={2} className="absolute top-7 right-20 text-blue-300/85 animate-[crystal-drift_4.8s_ease-in-out_infinite_0.5s]" />
            <Snowflake size={9} strokeWidth={2} className="absolute bottom-2 right-6 text-blue-400/80 animate-[crystal-drift_5.8s_ease-in-out_infinite_1.8s]" />

            {!isBreaking && (
              <div className="absolute inset-y-0 -left-32 w-24 bg-linear-to-r from-transparent via-white to-transparent animate-[ice-shimmer_4.5s_ease-in-out_infinite_0.8s]" />
            )}
          </div>
        )}

        {/* Break effects */}
        {isBreaking && (
          <div
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-white animate-[ice-flash_0.5s_ease-out_forwards]" />
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 72"
              preserveAspectRatio="none"
            >
              {CRACK_PATHS.map((path, i) => (
                <path
                  key={i}
                  d={path.d}
                  stroke="white"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  style={{
                    animation: `crack-draw 0.35s ease-out ${path.delay}ms forwards`,
                    filter: 'drop-shadow(0 0 4px rgba(255,255,255,1))',
                  }}
                />
              ))}
            </svg>
            {SHARDS.map((shard, i) => (
              <span
                key={i}
                className="absolute"
                style={
                  {
                    left: `${shard.x}%`,
                    top: `${shard.y}%`,
                    width: `${shard.s}px`,
                    height: `${shard.s}px`,
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(191,219,254,0.9) 50%, rgba(147,197,253,0.95) 100%)',
                    clipPath: 'polygon(50% 0%, 100% 35%, 75% 100%, 0% 65%)',
                    boxShadow: '0 0 6px rgba(147,197,253,0.9)',
                    '--shard-x': `${shard.tx}px`,
                    '--shard-y': `${shard.ty}px`,
                    '--shard-rotate': `${shard.r}deg`,
                    animation: `shard-fly 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${shard.delay}ms forwards`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Emoji container */}
        <div
          className={`relative z-10 w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-all duration-500 ${
            todo.frozen
              ? 'bg-linear-to-br from-blue-100 via-cyan-50 to-blue-200 ring-2 ring-blue-300/60 shadow-[inset_0_0_12px_rgba(147,197,253,0.7)] animate-[ice-form_0.5s_ease-out]'
              : todo.completed
              ? 'bg-gray-50 opacity-40'
              : 'bg-gray-50'
          }`}
        >
          {todo.emoji}
        </div>

        {/* Title + meta + mini-heatmap */}
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm font-medium transition-all duration-500 ${
                todo.completed
                  ? 'text-gray-400 line-through'
                  : todo.frozen
                  ? 'text-blue-900'
                  : 'text-gray-900'
              }`}
            >
              {todo.title}
            </p>

            {!todo.frozen && todo.streak > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200/70"
                title={`${todo.streak}-day streak`}
              >
                <Flame size={9} className="fill-orange-500 text-orange-500" />
                {todo.streak}
              </span>
            )}

            {todo.frozen && (
              <span
                key={`frozen-${todo.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-300/70 animate-[freeze-in_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]"
              >
                <Snowflake size={9} />
                Frozen
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-3 mt-0.5 text-xs transition-colors duration-500 ${
              todo.frozen ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {todo.time && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formatTime(todo.time)}
              </span>
            )}
            {todo.location && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{todo.location}</span>
              </span>
            )}
          </div>

          {!todo.frozen && (
            <div className="flex items-center gap-1 mt-1.5" title="Last 7 days">
              {todo.last7Days.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date} — ${day.completed ? 'done' : 'missed'}`}
                  className={`w-2 h-2 rounded-[3px] transition-colors ${
                    day.completed ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completion ring */}
        {!todo.frozen && (
          <HabitRing progress={todo.completionRate} size={30} strokeWidth={3} />
        )}

        {/* ─── Inline reminder bell ────────────────────────────────── */}
        {hasReminderTime && (
          <button
          data-tour="reminder-bell"
            onClick={handleReminderClick}
            aria-label={`Set reminder for ${todo.title} at ${todo.time}`}
            title={
              isAndroid()
                ? `Set alarm for ${todo.time}`
                : `Add ${todo.time} reminder to calendar`
            }
            className="relative z-10 w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors shrink-0"
          >
            <Bell size={15} />
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!todo.frozen) onToggle(todo.id);
          }}
          role="checkbox"
          aria-checked={todo.completed}
          aria-disabled={todo.frozen}
          aria-label={
            todo.frozen
              ? `"${todo.title}" is frozen`
              : `Mark "${todo.title}" as ${
                  todo.completed ? 'incomplete' : 'complete'
                }`
          }
          disabled={todo.frozen}
          className={`relative z-10 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
            todo.frozen
              ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
              : todo.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-emerald-400'
          }`}
        >
          {todo.completed && !todo.frozen && (
            <Check size={12} strokeWidth={3} />
          )}
        </button>
      </div>
    </li>
  );
};