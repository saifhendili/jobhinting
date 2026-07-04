"use client";

import { useState } from "react";
import styles from "./data-table.module.scss";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  rowKey: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({ columns, data, rowKey, onRowClick }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getValue = (obj: any, path: string) => {
    return path.split(".").reduce((o, p) => o?.[p], obj);
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = getValue(a, sortKey);
        const bVal = getValue(b, sortKey);
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? styles.sortable : ""}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span className={styles.sortIcon}>{sortOrder === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? styles.clickable : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key}>{getValue(row, col.key) || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
