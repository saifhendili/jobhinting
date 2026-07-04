"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/tables/data-table";
import styles from "./page.module.scss";

async function fetchSavedSearches() {
  const res = await fetch("/api/saved-searches", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch saved searches");
  return res.json();
}

export default function SavedSearchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-searches"],
    queryFn: fetchSavedSearches,
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "query", label: "Query" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Saved Searches</h1>
      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <DataTable columns={columns} data={data?.data || []} rowKey="id" />
      )}
    </div>
  );
}
