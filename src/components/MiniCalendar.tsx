import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  /** Optional: callback fired when a day is selected */
  onSelectDate?: (date: Date) => void;
  /** Optional: a set of "YYYY-MM-DD" strings to mark as having activity */
  markedDates?: Set<string>;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  onSelectDate,
  markedDates,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const isViewingCurrentMonth =
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const monthLabel = viewDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const hasActivity = (day: number) => {
    if (!markedDates) return false;
    const key = `${viewDate.getFullYear()}-${String(
      viewDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return markedDates.has(key);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    onSelectDate?.(
      new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    );
  };

  const prevMonth = () =>
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    );

  const goToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  return (
    <div className="w-full select-none">
      {/* Month / Year + Nav */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">
          {monthLabel}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Today shortcut — only shows when navigated away from current month */}
      {!isViewingCurrentMonth && (
        <button
          onClick={goToToday}
          className="w-full mb-2 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-1 rounded-md transition-colors"
        >
          Back to today
        </button>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-[10px] text-gray-400 font-medium text-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="aspect-square" />;
          }

          const today = isToday(day);
          const selected = selectedDay === day;
          const activity = hasActivity(day);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square flex items-center justify-center text-xs rounded-md transition-colors ${
                today
                  ? 'bg-emerald-500 text-white font-semibold'
                  : selected
                  ? 'bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-300'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
              {activity && !today && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};