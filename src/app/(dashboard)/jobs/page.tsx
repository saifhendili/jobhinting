"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { FilterPanel } from "@/components/forms/filter-panel";
import { Pagination } from "@/components/ui/pagination";
import styles from "./page.module.scss";

async function fetchJobs(params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`/api/jobs?${queryString}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export default function JobsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", page, filters],
    queryFn: () => fetchJobs({ page: String(page), limit: "20", ...filters }),
  });

  const columns = [
    { key: "title", label: "Job Title", sortable: true },
    { key: "company.name", label: "Company", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "location", label: "Location", sortable: true },
    { key: "remoteStatus", label: "Remote", sortable: true },
    { key: "employmentType", label: "Type", sortable: true },
    { key: "postedDate", label: "Posted", sortable: true },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Jobs</h1>

      <FilterPanel
        filters={[
          { key: "query", label: "Search", type: "text" },
          { key: "remoteStatus", label: "Remote Status", type: "select", options: ["FULLY_REMOTE", "HYBRID", "ON_SITE"] },
          { key: "employmentType", label: "Employment Type", type: "select", options: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] },
          { key: "experienceLevel", label: "Experience", type: "select", options: ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"] },
          { key: "days", label: "Posted Within", type: "select", options: ["1", "2", "3", "7", "14", "30"] },
        ]}
        onFilterChange={setFilters}
        values={filters}
      />

      {isLoading ? (
        <div className={styles.loading}>Loading jobs...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data || []}
            rowKey="id"
            onRowClick={(row) => router.push(`/jobs/${row.id}`)}
          />
          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
