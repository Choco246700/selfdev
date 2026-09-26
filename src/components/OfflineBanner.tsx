import React from 'react';
import { WifiOff, CloudUpload, Loader2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
}) => {
  // Nothing to show
  if (isOnline && pendingCount === 0) return null;

  // Offline with no pending — just a quiet notice
  if (!isOnline && pendingCount === 0) {
    return (
      <Banner
        tone="amber"
        icon={<WifiOff size={14} />}
        text="You're offline. Changes you make will sync automatically."
      />
    );
  }

  // Offline with pending ops
  if (!isOnline && pendingCount > 0) {
    return (
      <Banner
        tone="amber"
        icon={<WifiOff size={14} />}
        text={`Offline — ${pendingCount} change${
          pendingCount === 1 ? '' : 's'
        } waiting to sync.`}
      />
    );
  }

  // Online, syncing
  if (isSyncing) {
    return (
      <Banner
        tone="indigo"
        icon={<Loader2 size={14} className="animate-spin" />}
        text={`Syncing ${pendingCount} change${
          pendingCount === 1 ? '' : 's'
        }…`}
      />
    );
  }

  // Online, still has pending (sync failed silently)
  return (
    <Banner
      tone="indigo"
      icon={<CloudUpload size={14} />}
      text={`${pendingCount} change${
        pendingCount === 1 ? '' : 's'
      } pending upload.`}
    />
  );
};

const Banner: React.FC<{
  tone: 'amber' | 'indigo';
  icon: React.ReactNode;
  text: string;
}> = ({ tone, icon, text }) => {
  const toneClasses =
    tone === 'amber'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-indigo-50 border-indigo-200 text-indigo-800';

  return (
    <div
      role="status"
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium ${toneClasses}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};