"use client";

import { useState } from "react";
import styles from "./pagination.module.scss";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const [inputPage, setInputPage] = useState("");

  const getPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={styles.btn}
      >
        ← Prev
      </button>
      
      {getPages().map((p, i) => (
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${styles.btn} ${p === page ? styles.active : ""}`}
          >
            {p}
          </button>
        )
      ))}
      
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={styles.btn}
      >
        Next →
      </button>
      
      <div className={styles.jump}>
        <span>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const p = parseInt(inputPage);
              if (p >= 1 && p <= totalPages) onPageChange(p);
              setInputPage("");
            }
          }}
          className={styles.input}
        />
      </div>
    </div>
  );
}
