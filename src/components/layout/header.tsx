"use client";

import { useAuthStore } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import styles from "./header.module.scss";

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore network errors, still logout locally
    }
    logout();
    router.push("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Search companies, jobs..."
          className={styles.searchInput}
        />
      </div>
      <div className={styles.actions}>
        <div className={styles.user}>
          <span className={styles.avatar}>{user?.name?.[0] || user?.email?.[0] || "?"}</span>
          <span className={styles.userName}>{user?.name || user?.email}</span>
          {user?.role === "ADMIN" && <span className={styles.badge}>Admin</span>}
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </header>
  );
}
