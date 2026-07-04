"use client";

import styles from "./recent-scrapes.module.scss";

interface ScrapeLog {
  id: string;
  source: string;
  status: string;
  itemsFound: number;
  itemsAdded: number;
  itemsUpdated: number;
  errors: string[];
  duration?: number;
  createdAt: string;
}

interface RecentScrapesProps {
  data: ScrapeLog[];
}

export function RecentScrapes({ data }: RecentScrapesProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Source</th>
            <th>Status</th>
            <th>Found</th>
            <th>Added</th>
            <th>Updated</th>
            <th>Duration</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((scrape) => (
            <tr key={scrape.id}>
              <td className={styles.source}>{scrape.source}</td>
              <td>
                <span className={`${styles.status} ${styles[scrape.status.toLowerCase()]}`}>
                  {scrape.status}
                </span>
              </td>
              <td>{scrape.itemsFound}</td>
              <td>{scrape.itemsAdded}</td>
              <td>{scrape.itemsUpdated}</td>
              <td>{scrape.duration ? `${scrape.duration}ms` : "—"}</td>
              <td className={styles.time}>
                {new Date(scrape.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
