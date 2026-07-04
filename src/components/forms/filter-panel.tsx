"use client";

import { useState } from "react";
import styles from "./filter-panel.module.scss";

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "date";
  options?: string[];
}

interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, string>) => void;
  values: Record<string, string>;
}

export function FilterPanel({ filters, onFilterChange, values }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localValues, setLocalValues] = useState(values);

  const handleChange = (key: string, value: string) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
    onFilterChange(newValues);
  };

  const handleClear = () => {
    setLocalValues({});
    onFilterChange({});
  };

  const activeCount = Object.values(localValues).filter(Boolean).length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button onClick={() => setIsExpanded(!isExpanded)} className={styles.toggle}>
          <span>🔍 Filters</span>
          {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
          <span>{isExpanded ? "▲" : "▼"}</span>
        </button>
        {activeCount > 0 && (
          <button onClick={handleClear} className={styles.clear}>
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className={styles.filters}>
          {filters.map((filter) => (
            <div key={filter.key} className={styles.filter}>
              <label className={styles.label}>{filter.label}</label>
              {filter.type === "select" ? (
                <select
                  value={localValues[filter.key] || ""}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  className={styles.input}
                >
                  <option value="">All</option>
                  {filter.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type}
                  value={localValues[filter.key] || ""}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  placeholder={`Filter by ${filter.label.toLowerCase()}`}
                  className={styles.input}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
