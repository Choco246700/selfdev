import React, { useEffect, useRef, useState } from 'react';
import { Flame, Trash2 } from 'lucide-react';

interface SkillStatCardProps {
  name: string;
  hours: number;
  streakDays: number;
  color: string;
  onDelete?: () => void;
  onOpen?: () => void;
}

export const SkillStatCard: React.FC<SkillStatCardProps> = ({
  name,
  hours,
  streakDays,
  color,
  onDelete,
  onOpen,
}) => {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (!armed) {
      setArmed(true);
      timerRef.current = window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setArmed(false);
    onDelete();
  };

  const handleOpen = () => {
    if (onOpen) onOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? handleOpen : undefined}
      onKeyDown={onOpen ? handleKeyDown : undefined}
      className={`relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 transition-colors ${
        onOpen ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center gap-2 pr-6">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-gray-700 truncate">
          {name}
        </span>
      </div>

      <p className="text-2xl font-bold text-gray-900 leading-none">{hours}h</p>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Flame size={12} className="text-orange-500 fill-orange-500" />
        <span>{streakDays}-day streak</span>
      </div>

      {onDelete && (
        <button
          onClick={handleDelete}
          aria-label={armed ? `Confirm delete ${name}` : `Delete ${name}`}
          title={armed ? 'Click again to confirm' : 'Delete skill'}
          className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            armed
              ? 'bg-red-500 text-white shadow-sm ring-2 ring-red-200 scale-105'
              : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};