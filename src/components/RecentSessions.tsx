import React from 'react';

export interface RecentSession {
  id: string;
  skillName: string;
  skillColor: string; // hex
  notes: string;
  durationMinutes: number;
  relativeDay: string;
}

interface RecentSessionsProps {
  sessions: RecentSession[];
  onViewAll?: () => void;
  onSelect?: (id: string) => void;
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  onViewAll,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Recent Sessions</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View all
        </button>
      </div>

      <ul className="flex flex-col">
        {sessions.map((session, idx) => (
          <li
            key={session.id}
            onClick={() => onSelect?.(session.id)}
            className={`flex items-center gap-4 py-3 -mx-2 px-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
              idx !== sessions.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-2 w-28 shrink-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: session.skillColor }}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {session.skillName}
              </span>
            </div>

            <p className="flex-1 text-sm text-gray-500 truncate min-w-0">
              {session.notes}
            </p>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">
                {session.durationMinutes} min
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {session.relativeDay}
              </p>
            </div>
          </li>
        ))}

        {sessions.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">
            No sessions logged yet. Start your first practice!
          </li>
        )}
      </ul>
    </div>
  );
};