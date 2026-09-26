import React, { useEffect, useState } from 'react';
import {
  X,
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useSaveAction } from '../hooks/useSaveAction';
import toast from 'react-hot-toast';

type Category = 'bug' | 'feature' | 'general';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: {
  value: Category;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'bug', label: 'Bug', icon: <Bug size={14} /> },
  { value: 'feature', label: 'Feature idea', icon: <Lightbulb size={14} /> },
  { value: 'general', label: 'General', icon: <MessageSquare size={14} /> },
];

const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 5;

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Reset whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory('general');
      setMessage('');
      setSent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const { run: submit, isSaving } = useSaveAction(
    async () => {
      if (!user) throw new Error('Not authenticated');

      const trimmed = message.trim();
      if (trimmed.length < MIN_MESSAGE) {
        throw new Error('Message is too short.');
      }

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        user_email: user.email ?? null,
        category,
        message: trimmed,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
      setSent(true);
    },
    { cooldownMs: 800 }
  );

  if (!isOpen) return null;

  const trimmedLength = message.trim().length;
  const isValid = trimmedLength >= MIN_MESSAGE && trimmedLength <= MAX_MESSAGE;
  const remaining = MAX_MESSAGE - message.length;

  const handleSubmit = async () => {
    if (!isValid || isSaving) return;
    try {
      await submit();
      toast.success('Thanks for the feedback!');
      // Auto-close shortly after the success screen
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      console.error(err);
      toast.error('Could not send feedback.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {sent ? (
          // ─── Success state ────────────────────────────────────
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={26} className="text-emerald-500" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Feedback sent
            </h2>
            <p className="text-sm text-gray-500">
              We read every message. Thanks for helping make SkillTrack better.
            </p>
          </div>
        ) : (
          <>
            {/* ─── Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Send feedback
              </h2>
              <button
                onClick={() => !isSaving && onClose()}
                disabled={isSaving}
                aria-label="Close"
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* ─── Category chips ─────────────────────────────── */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                What's this about?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isActive = cat.value === category;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => !isSaving && setCategory(cat.value)}
                      disabled={isSaving}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Message ────────────────────────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">
                  Message
                </label>
                <span
                  className={`text-[10px] font-medium tabular-nums ${
                    remaining < 50 ? 'text-amber-600' : 'text-gray-400'
                  }`}
                >
                  {remaining} left
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder={
                  category === 'bug'
                    ? "What went wrong? What were you doing when it happened?"
                    : category === 'feature'
                    ? "What would you like to see?"
                    : "Tell us what's on your mind…"
                }
                rows={6}
                disabled={isSaving}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:bg-gray-50"
              />
              {trimmedLength > 0 && trimmedLength < MIN_MESSAGE && (
                <p className="text-[11px] text-amber-600 mt-1">
                  A little more detail would help.
                </p>
              )}
            </div>

            {/* ─── Context note ───────────────────────────────── */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                We'll automatically include your email, the page you were on,
                and your browser — that's it. No other tracking.
              </p>
            </div>

            {/* ─── Actions ────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => !isSaving && onClose()}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send size={13} />
                {isSaving ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};