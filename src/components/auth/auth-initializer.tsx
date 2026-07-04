"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/hooks/use-auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user, null);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, logout, setLoading]);

  return <>{children}</>;
}
