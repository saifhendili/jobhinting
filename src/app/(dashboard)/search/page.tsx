"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/tables/data-table";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

interface SearchResult {
  id: string;
  name: string;
  type: string;
  industry?: string;
  country?: string;
  slug?: string;
  title?: string;
  company?: string;
  location?: string;
  remoteStatus?: string;
  postedDate?: string;
  source?: string;
  url?: string;
}

async function searchAll(query: string, type: string, days: number, includeWeb: boolean) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("type", type);
  params.set("days", String(days));
  params.set("web", String(includeWeb));
  
  const res = await fetch(`/api/search?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [daysFilter, setDaysFilter] = useState(7);
  const [includeWeb, setIncludeWeb] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchParams, setSearchParams] = useState({ query: "", days: 7, web: false });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", searchParams.query, searchType, searchParams.days, searchParams.web],
    queryFn: () => searchAll(searchParams.query, searchType, searchParams.days, searchParams.web),
    enabled: searchParams.query.length > 0,
  });

  const handleSearch = () => {
    setSearchParams({ query, days: daysFilter, web: includeWeb });
    setDebouncedQuery(query);
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "industry", label: "Industry" },
    { key: "country", label: "Country" },
    { key: "postedDate", label: "Posted" },
    { key: "source", label: "Source" },
  ];

  const handleRowClick = (row: SearchResult) => {
    if (row.type === "company" || row.slug) {
      router.push(`/companies/${row.id}`);
    } else if (row.type === "job" || row.title) {
      router.push(`/jobs/${row.id}`);
    } else if (row.url) {
      window.open(row.url, "_blank");
    }
  };

  const totalResults = data?.pagination?.total || 0;
  const webResults = data?.webResults?.length || 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search</h1>

      <div className={styles.searchBox}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search companies, jobs, technologies..."
          className={styles.searchInput}
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className={styles.typeSelect}
        >
          <option value="all">All</option>
          <option value="companies">Companies</option>
          <option value="jobs">Jobs</option>
        </select>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          className={styles.daysSelect}
        >
          <option value={1}>Last 24 hours</option>
          <option value={2}>Last 2 days</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={0}>All time</option>
        </select>
        <button onClick={handleSearch} className={styles.searchBtn} disabled={isFetching}>
          {isFetching ? "Searching..." : "Search"}
        </button>
      </div>

      <div className={styles.options}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={includeWeb}
            onChange={(e) => setIncludeWeb(e.target.checked)}
          />
          <span>Also search live job boards (RemoteOK, WeWorkRemotely, etc.)</span>
        </label>
      </div>

      {totalResults > 0 && (
        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>{totalResults} results found</span>
          {webResults > 0 && (
            <span className={styles.webBadge}>+{webResults} from live sources</span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>Searching...</div>
      ) : data?.data?.length > 0 ? (
        <DataTable columns={columns} data={data.data} rowKey="id" onRowClick={handleRowClick} />
      ) : searchParams.query ? (
        <div className={styles.noResults}>
          <p>No results found for &quot;{searchParams.query}&quot;</p>
          {searchParams.days > 0 && (
            <p className={styles.hint}>Try expanding the date range or searching live job boards.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
