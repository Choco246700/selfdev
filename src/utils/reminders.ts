// src/utils/reminders.ts

// Check if the user is on an Android device.
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

// Check if the user is on an iOS device.
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// ─── Android Alarm Intent ───────────────────────────────────────────
// Opens the Android Clock app with the alarm pre-filled.
export function openAndroidAlarm(
  hour: number,
  minute: number,
  message: string
) {
  if (!isAndroid()) {
    console.warn('Android alarm intent is only available on Android.');
    return;
  }

  // Ensure integers are passed for hour and minute.
  const h = Math.floor(hour);
  const m = Math.floor(minute);

  // Encode the message for the URL.
  const encodedMessage = encodeURIComponent(message);

  // The intent URL for setting an alarm.
  // Note: EXTRA_SKIP_UI is deprecated on Android 12+ and is not used here.
  const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;` +
    `S.android.intent.extra.alarm.MESSAGE=${encodedMessage};` +
    `i.android.intent.extra.alarm.HOUR=${h};` +
    `i.android.intent.extra.alarm.MINUTES=${m};` +
    `end`;

  window.location.href = intentUrl;
}

// ─── Calendar (.ics) Generation ──────────────────────────────────────
// Generates and downloads a calendar file for iOS and desktop users.
export function downloadCalendarEvent(habit: {
  name: string;
  targetTime: string; // "HH:mm"
  emoji: string;
}) {
  const [hour, minute] = habit.targetTime.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return;

  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  // If the time has already passed today, set it for tomorrow.
  if (startDate < now) {
    startDate.setDate(startDate.getDate() + 1);
  }

  // Set the duration to 15 minutes.
  const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);

  // Format dates for the .ics file (UTC format: YYYYMMDDTHHMMSSZ).
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStart = formatICSDate(startDate);
  const dtEnd = formatICSDate(endDate);

  // A simple, unique identifier for the event.
  const uid = `skilltrack-${Date.now()}@skilltrack.app`;

  // Build the .ics file content.
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillTrack//Habit Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${habit.emoji} ${habit.name}`,
    `DESCRIPTION:Time for your habit: ${habit.name}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M', // Trigger at the start time.
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder for ${habit.name}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Create a Blob and trigger the download.
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reminder-${habit.name.toLowerCase().replace(/\s/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}