"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SCRAPER_NAMES } from "@/services/scraper/scraper-names";
import styles from "./page.module.scss";

// Sourced from the same list scraper.registry.ts is typed against, so this
// can never reference a scraper that doesn't actually exist.
const SCRAPER_SOURCES: readonly string[] = SCRAPER_NAMES;

export default function AdminPage() {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleScrape = async () => {
    if (selectedSources.length === 0) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sources: selectedSources }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Queued ${data.jobs.length} scrape jobs`);
      } else {
        setMessage(data.error || "Failed to queue jobs");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={styles.container}>
        <h1 className={styles.title}>Admin Panel</h1>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Run Scrapers</h2>
          <p className={styles.description}>Select sources to scrape:</p>

          <div className={styles.sourceGrid}>
            {SCRAPER_SOURCES.map((source) => (
              <button
                key={source}
                onClick={() => toggleSource(source)}
                className={`${styles.sourceBtn} ${selectedSources.includes(source) ? styles.selected : ""}`}
              >
                {source}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleScrape}
              disabled={loading || selectedSources.length === 0}
              className={styles.scrapeBtn}
            >
              {loading ? "Starting..." : `Scrape ${selectedSources.length} Source(s)`}
            </button>
            {message && <p className={styles.message}>{message}</p>}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
