"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import styles from "./dashboard-layout.module.scss";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
