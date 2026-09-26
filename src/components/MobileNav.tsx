import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Plus } from 'lucide-react';

interface MobileNavProps {
  onLogSessionClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onLogSessionClick }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="flex items-center justify-around h-16 px-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
              isActive ? 'text-emerald-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">Home</span>
            </>
          )}
        </NavLink>

        <button
          onClick={onLogSessionClick}
          aria-label="Log Session"
          className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
        </button>

        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
              isActive ? 'text-emerald-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <History size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">History</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};