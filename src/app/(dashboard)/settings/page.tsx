"use client";

import { useAuthStore } from "@/hooks/use-auth";
import styles from "./page.module.scss";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Profile</h2>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <p className={styles.value}>{user?.name || "—"}</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <p className={styles.value}>{user?.email}</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Role</label>
          <p className={styles.value}>{user?.role}</p>
        </div>
      </div>
    </div>
  );
}
