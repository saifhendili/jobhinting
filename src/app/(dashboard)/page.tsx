"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/charts/chart-card";
import { RecentScrapes } from "@/components/tables/recent-scrapes";
import styles from "./page.module.scss";

async function fetchDashboardStats() {
  const res = await fetch("/api/dashboard", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Companies"
          value={data?.totalCompanies || 0}
          icon="🏢"
          trend={data?.newCompaniesToday || 0}
          trendLabel="new today"
        />
        <StatCard
          title="Total Jobs"
          value={data?.totalJobs || 0}
          icon="💼"
          trend={data?.activeJobs || 0}
          trendLabel="active"
          color="secondary"
        />
        <StatCard
          title="Fully Remote"
          value={data?.fullyRemoteJobs || 0}
          icon="🌍"
          trend={data?.newJobsToday || 0}
          trendLabel="new today"
          color="info"
        />
        <StatCard
          title="Countries"
          value={data?.topCountries?.length || 0}
          icon="🌐"
          color="warning"
        />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Jobs by Remote Status" type="pie" data={data?.jobsByRemoteStatus || []} />
        <ChartCard title="Top Countries" type="bar" data={data?.topCountries || []} labelKey="country" valueKey="count" />
        <ChartCard title="Top Industries" type="bar" data={data?.topIndustries || []} labelKey="industry" valueKey="count" />
        <ChartCard title="Companies by Hiring Score" type="bar" data={data?.companiesByScore || []} labelKey="score" valueKey="count" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Scrapes</h2>
        <RecentScrapes data={data?.recentScrapes || []} />
      </div>
    </div>
  );
}
