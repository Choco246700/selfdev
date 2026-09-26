// src/components/SetReminderButton.tsx

import React from 'react';
import { Bell, CalendarPlus } from 'lucide-react';
import {
  isAndroid,
  isIOS,
  openAndroidAlarm,
  downloadCalendarEvent,
} from '../utils/reminders';
import type { Habit } from '../types';

interface SetReminderButtonProps {
  habit: Habit;
}

export const SetReminderButton: React.FC<SetReminderButtonProps> = ({
  habit,
}) => {
  const handleSetReminder = () => {
    if (isAndroid()) {
      // If on Android, open the alarm intent.
      const [hour, minute] = habit.targetTime.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        openAndroidAlarm(hour, minute, `${habit.emoji} ${habit.name}`);
      }
    } else {
      // For iOS and Desktop, download the .ics file.
      downloadCalendarEvent(habit);
    }
  };

  // Don't render if the habit has no target time.
  if (!habit.targetTime) {
    return null;
  }

  // Render different buttons based on the platform.
  if (isAndroid()) {
    return (
      <button
        onClick={handleSetReminder}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
      >
        <Bell size={14} />
        Set Alarm
      </button>
    );
  }

  if (isIOS()) {
    return (
      <button
        onClick={handleSetReminder}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
      >
        <CalendarPlus size={14} />
        Add to Calendar
      </button>
    );
  }

  // Fallback for desktop.
  return (
    <button
      onClick={handleSetReminder}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <CalendarPlus size={14} />
      Add to Calendar
    </button>
  );
};