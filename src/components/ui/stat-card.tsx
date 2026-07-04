"use client";

import styles from "./stat-card.module.scss";

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "secondary" | "info" | "warning" | "danger";
}

export function StatCard({ title, value, icon, trend, trendLabel, color = "primary" }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value.toLocaleString()}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={styles.trend}>
          <span className={styles.trendValue}>+{trend}</span>
          <span className={styles.trendLabel}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
