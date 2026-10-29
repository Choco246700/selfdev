import { useAuth } from "./useAuth";
import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";

export function useOnboarding() {
   const { user, refreshUser } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowTour(false);
      setChecked(true);
      return;
    }
    const localSeen =
      localStorage.getItem(`selfdev.onboarding.${user.id}`) === "1";
    const metaSeen = user.onboardingCompleted === true;
    setShowTour(!(localSeen || metaSeen));
    setChecked(true);
  }, [user]);

   const completeTour = async () => {
    setShowTour(false);
    if (user) {
      localStorage.setItem(`selfdev.onboarding.${user.id}`, "1");
    }
    await apiFetch("/api/auth/me", {
      method: "PATCH",
      json: { onboardingCompleted: true },
    }).catch(() => {});
    await refreshUser().catch(() => {});
  };

  const restartTour = () => {
    if (!user) return;
    localStorage.removeItem(`selfdev.onboarding.${user.id}`);
    setShowTour(true);
  };

  return { showTour, checked, completeTour, restartTour };
}