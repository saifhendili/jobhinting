"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { FilterPanel } from "@/components/forms/filter-panel";
import { Pagination } from "@/components/ui/pagination";
import styles from "./page.module.scss";

async function fetchCompanies(params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`/api/companies?${queryString}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

async function fetchFilters() {
  const res = await fetch("/api/industries", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch filters");
  const industries = await res.json();
  const countriesRes = await fetch("/api/countries", { credentials: "include" });
  const countries = await countriesRes.json();
  return { ...industries, ...countries };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["companies", page, filters],
    queryFn: () => fetchCompanies({ page: String(page), limit: "20", ...filters }),
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["filters"],
    queryFn: fetchFilters,
  });

  const columns = [
    { key: "name", label: "Company", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    { key: "country", label: "Country", sortable: true },
    { key: "companySize", label: "Size", sortable: true },
    { key: "hiringScore", label: "Hiring Score", sortable: true },
    { key: "remotePolicy", label: "Remote Policy", sortable: true },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Companies</h1>

      <FilterPanel
        filters={[
          { key: "query", label: "Search", type: "text" },
          { key: "country", label: "Country", type: "select", options: filterOptions?.countries || [] },
          { key: "industry", label: "Industry", type: "select", options: filterOptions?.industries || [] },
          { key: "remotePolicy", label: "Remote Policy", type: "select", options: ["Fully Remote", "Hybrid", "On-site"] },
          { key: "companySize", label: "Company Size", type: "select", options: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] },
        ]}
        onFilterChange={setFilters}
        values={filters}
      />

      {isLoading ? (
        <div className={styles.loading}>Loading companies...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data || []}
            rowKey="id"
            onRowClick={(row) => router.push(`/companies/${row.id}`)}
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
