import { useCallback, useEffect, useState } from "react";
import { AuthContext, type User } from "./authContext";
import { apiFetch } from "../lib/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await apiFetch<{ user: User }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await apiFetch<{ user: User }>("/api/auth/signin", {
      method: "POST",
      json: { email, password },
    });
    setUser(user);
  }, []);

  const signOut = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};