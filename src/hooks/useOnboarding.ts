import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export function useOnboarding() {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowTour(false);
      setChecked(true);
      return;
    }

    // Local flag (fast) OR server flag (authoritative across devices)
    const localSeen =
      localStorage.getItem(`skilltrack.onboarding.${user.id}`) === '1';
    const metaSeen =
      user.user_metadata?.onboarding_completed === true;

    setShowTour(!(localSeen || metaSeen));
    setChecked(true);
  }, [user]);

  const completeTour = async () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`skilltrack.onboarding.${user.id}`, '1');
    }
    // Best-effort server persist — if it fails, the local flag still covers
    // this device, and the next sign-in on another device will re-show the tour.
    await supabase.auth
      .updateUser({ data: { onboarding_completed: true } })
      .catch(() => {});
  };

  const restartTour = () => {
    if (!user) return;
    localStorage.removeItem(`skilltrack.onboarding.${user.id}`);
    setShowTour(true);
  };

  return { showTour, checked, completeTour, restartTour };
}