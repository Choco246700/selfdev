import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  LogOut,
  Mail,
  ChevronDown,
  HelpCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  MessageSquare,
} from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface HeaderProps {
  onNewSkillClick: () => void;
  onNewHabitClick: () => void;
  onLogSessionClick: () => void;
  onReplayTour?: () => void;
  onExportJSON?: () => void;
  onExportSessionsCSV?: () => void;
  onExportHabitsCSV?: () => void;
  onSendFeedback?: () => void;
}

function getInitials(email: string | undefined): string {
  if (!email) return "?";
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Header: React.FC<HeaderProps> = ({
  onNewSkillClick,
  onNewHabitClick,
  onLogSessionClick,
  onReplayTour,
  onExportJSON,
  onExportSessionsCSV,
  onExportHabitsCSV,
  onSendFeedback,
}) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out.");
      return;
    }
    toast.success("Signed out");
  };

  const runAndClose = (fn?: () => void) => () => {
    setMenuOpen(false);
    fn?.();
  };

  const userAvatar =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined);
  const initials = getInitials(fullName || user?.email);
  const hasExportActions =
    Boolean(onExportJSON) ||
    Boolean(onExportSessionsCSV) ||
    Boolean(onExportHabitsCSV);

  return (
    <header className="flex items-center justify-between py-2 gap-3">
      {/* Brand */}
      <Link to="/" className="flex items-center text-gray-900">
        <Wordmark className="h-8 w-auto" />
      </Link>

      {/* Actions */}
      <div
        className="flex items-center gap-2 flex-wrap justify-end"
        data-tour="header-actions"
      >
        {/* Log Session — hidden on mobile (bottom nav has it) */}
        <button
          onClick={onLogSessionClick}
          className="hidden md:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus size={14} strokeWidth={3} />
          Log Session
        </button>

        {/* New Skill — icon + text at all sizes */}
        <button
          onClick={onNewSkillClick}
          className="flex items-center gap-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
          aria-label="New Skill"
        >
          <Plus size={14} strokeWidth={3} />
          New Skill
        </button>

        {/* New Habit — icon + text at all sizes */}
        <button
          onClick={onNewHabitClick}
          className="flex items-center gap-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
          aria-label="New Habit"
        >
          <Plus size={14} strokeWidth={3} />
          New Habit
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {initials}
              </span>
            )}
            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50"
            >
              {/* User info */}
              <div className="px-3 py-2 border-b border-gray-100">
                {fullName && (
                  <p className="text-xs font-semibold text-gray-900 truncate mb-0.5">
                    {fullName}
                  </p>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {user?.email ?? "Unknown"}
                  </span>
                </div>
              </div>

              {/* Replay tour */}
              {onReplayTour && (
                <button
                  onClick={runAndClose(onReplayTour)}
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle size={13} className="text-gray-400" />
                  Replay tour
                </button>
              )}

              {/* Send feedback */}
              {onSendFeedback && (
                <button
                  onClick={runAndClose(onSendFeedback)}
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare size={13} className="text-gray-400" />
                  Send feedback
                </button>
              )}

              {/* Export */}
              {hasExportActions && (
                <>
                  <div className="px-3 pt-2 pb-1 mt-1 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      <Download size={11} />
                      Export data
                    </div>
                  </div>

                  {onExportJSON && (
                    <button
                      onClick={runAndClose(onExportJSON)}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileJson size={13} className="text-gray-400" />
                      Full backup (JSON)
                    </button>
                  )}

                  {onExportSessionsCSV && (
                    <button
                      onClick={runAndClose(onExportSessionsCSV)}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet size={13} className="text-gray-400" />
                      Sessions (CSV)
                    </button>
                  )}

                  {onExportHabitsCSV && (
                    <button
                      onClick={runAndClose(onExportHabitsCSV)}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet size={13} className="text-gray-400" />
                      Habits (CSV)
                    </button>
                  )}
                </>
              )}

              {/* Sign out */}
              <div className="border-t border-gray-100 mt-1">
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
