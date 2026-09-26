import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Activity,
  MessageSquare,
  Shield,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  Trash2,
  Inbox,
  FileText,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminData } from '../hooks/useAdminData';
import {
  useAdminFeedback,
  type FeedbackStatus,
} from '../hooks/useAdminFeedback';
import { formatRelativeDay } from '../utils/date';

type Tab = 'overview' | 'users' | 'feedback';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const { users, stats, loading, error, refresh } = useAdminData(true);
  const feedback = useAdminFeedback(true);

  const handleRefresh = async () => {
    toast.promise(Promise.all([refresh(), feedback.refresh()]), {
      loading: 'Refreshing…',
      success: 'Data refreshed',
      error: 'Refresh failed',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500 text-white">
              <Shield size={14} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, monitor activity, and read feedback.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Couldn't load admin data
            </p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 self-start">
        {(['overview', 'users', 'feedback'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors capitalize ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'overview' && <Activity size={12} />}
            {t === 'users' && <Users size={12} />}
            {t === 'feedback' && (
              <>
                <MessageSquare size={12} />
                {stats && stats.unreadFeedback > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {stats.unreadFeedback}
                  </span>
                )}
              </>
            )}
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
      {tab === 'users' && <UsersTab users={users} loading={loading} />}
      {tab === 'feedback' && (
        <FeedbackTab
          items={feedback.items}
          loading={feedback.loading}
          onStatusChange={async (id, status) => {
            try {
              await feedback.updateStatus(id, status);
            } catch {
              toast.error('Could not update status');
            }
          }}
          onNotesChange={feedback.updateNotes}
          onDelete={async (id) => {
            try {
              await feedback.deleteFeedback(id);
              toast.success('Feedback deleted');
            } catch {
              toast.error('Could not delete');
            }
          }}
        />
      )}
    </div>
  );
};

// ─── Overview Tab ────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  stats: ReturnType<typeof useAdminData>['stats'];
  loading: boolean;
}> = ({ stats, loading }) => {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-gray-200/70 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total users',
      value: stats.totalUsers,
      sub: `${stats.confirmedUsers} confirmed`,
      icon: <Users size={16} />,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'New this week',
      value: stats.newUsersThisWeek,
      sub: 'Signed up in last 7 days',
      icon: <Clock size={16} />,
      tone: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Active this week',
      value: stats.activeUsersThisWeek,
      sub: 'Signed in within 7 days',
      icon: <Activity size={16} />,
      tone: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Skills',
      value: stats.totalSkills,
      sub: 'Across all users',
      icon: <FileText size={16} />,
      tone: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Sessions',
      value: stats.totalSessions,
      sub: 'Logged total',
      icon: <Activity size={16} />,
      tone: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Habits',
      value: stats.totalHabits,
      sub: 'Created total',
      icon: <CheckCircle2 size={16} />,
      tone: 'text-pink-600 bg-pink-50',
    },
    {
      label: 'Habit logs',
      value: stats.totalHabitLogs,
      sub: 'Completions total',
      icon: <CheckCircle2 size={16} />,
      tone: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'Feedback',
      value: stats.totalFeedback,
      sub:
        stats.unreadFeedback > 0
          ? `${stats.unreadFeedback} unread`
          : 'All read',
      icon: <MessageSquare size={16} />,
      tone: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {c.label}
            </span>
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.tone}`}
            >
              {c.icon}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {c.value.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Users Tab ───────────────────────────────────────────────────────

const UsersTab: React.FC<{
  users: ReturnType<typeof useAdminData>['users'];
  loading: boolean;
}> = ({ users, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Mail
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-gray-400">
          {filtered.length} of {users.length}
        </span>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-400">
          No users match.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Joined
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Last sign in
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium truncate max-w-60">
                        {u.email}
                      </span>
                      {u.isAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-200">
                          <Shield size={8} />
                          ADMIN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.emailConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 size={11} />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <Clock size={11} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatRelativeDay(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {u.lastSignInAt
                      ? formatRelativeDay(u.lastSignInAt)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Feedback Tab ────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  FeedbackStatus,
  { label: string; classes: string }
> = {
  new: {
    label: 'New',
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
  read: {
    label: 'Read',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  wontfix: {
    label: "Won't fix",
    classes: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

const FeedbackTab: React.FC<{
  items: ReturnType<typeof useAdminFeedback>['items'];
  loading: boolean;
  onStatusChange: (id: string, status: FeedbackStatus) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ items, loading, onStatusChange, onNotesChange, onDelete }) => {
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.status === filter);

  if (loading && items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-12 text-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'new', 'read', 'resolved', 'wontfix'] as const).map((f) => {
          const count =
            f === 'all'
              ? items.length
              : items.filter((i) => i.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f === 'all'
                ? 'All'
                : STATUS_STYLES[f as FeedbackStatus].label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Inbox size={20} className="text-gray-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            No feedback in this view.
          </p>
        </div>
      )}

      {/* Cards */}
      {filtered.map((f) => {
        const isExpanded = expanded === f.id;
        const status = STATUS_STYLES[f.status];
        return (
          <div
            key={f.id}
            className="bg-white rounded-2xl shadow-card overflow-hidden"
          >
            {/* Summary row */}
            <button
              onClick={() => setExpanded(isExpanded ? null : f.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.classes}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {f.category}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    · {formatRelativeDay(f.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 font-medium truncate">
                  {f.message.slice(0, 120)}
                  {f.message.length > 120 && '…'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {f.userEmail ?? 'Anonymous'}
                </p>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 flex flex-col gap-4 border-t border-gray-100">
                <div className="pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Full message
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {f.message}
                  </p>
                </div>

                {f.pageUrl && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Page
                    </p>
                    <p className="text-xs text-gray-600 break-all">
                      {f.pageUrl}
                    </p>
                  </div>
                )}

                {/* Status buttons */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Status
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      ['new', 'read', 'resolved', 'wontfix'] as FeedbackStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => onStatusChange(f.id, s)}
                        disabled={s === f.status}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                          s === f.status
                            ? `${STATUS_STYLES[s].classes} cursor-default`
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {STATUS_STYLES[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin notes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Your notes
                  </p>
                  <textarea
                    defaultValue={f.adminNotes ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (f.adminNotes ?? '')) {
                        onNotesChange(f.id, e.target.value);
                        toast.success('Notes saved');
                      }
                    }}
                    rows={2}
                    placeholder="Internal notes (not shown to user)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Delete */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Permanently delete this feedback?'
                        )
                      ) {
                        onDelete(f.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};