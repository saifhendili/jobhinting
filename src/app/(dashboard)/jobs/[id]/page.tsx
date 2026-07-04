"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import styles from "./page.module.scss";

async function fetchJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJob(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className={styles.loading}>Loading job...</div>;
  }

  const job = data?.job;
  if (!job) {
    return <div className={styles.loading}>Job not found</div>;
  }

  const company = job.company;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{job.title}</h1>
        {company && (
          <div className={styles.company}>
            <span className={styles.companyName}>{company.name}</span>
            <span className={styles.companyMeta}>
              {company.industry} • {company.country}
            </span>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Job Details</h2>
          <div className={styles.details}>
            <DetailItem label="Department" value={job.department} />
            <DetailItem label="Location" value={job.location} />
            <DetailItem label="Remote Status" value={job.remoteStatus} />
            <DetailItem label="Worldwide Remote" value={job.isWorldwideRemote ? "Yes" : "No"} />
            <DetailItem label="Employment Type" value={job.employmentType} />
            <DetailItem label="Experience Level" value={job.experienceLevel} />
            <DetailItem label="Salary" value={job.salary} />
            <DetailItem label="Currency" value={job.currency} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Skills & Technologies</h2>
          {job.requiredSkills?.length > 0 && (
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>Required:</span>
              <div className={styles.tags}>
                {job.requiredSkills.map((skill: string) => (
                  <span key={skill} className={styles.tag}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {job.preferredSkills?.length > 0 && (
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>Preferred:</span>
              <div className={styles.tags}>
                {job.preferredSkills.map((skill: string) => (
                  <span key={skill} className={styles.tagPreferred}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {job.technologies?.length > 0 && (
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>Technologies:</span>
              <div className={styles.tags}>
                {job.technologies.map((tech: string) => (
                  <span key={tech} className={styles.tagTech}>{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>Description</h2>
          <p className={styles.description}>{job.description || "No description available."}</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Actions</h2>
          <div className={styles.actions}>
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                View Job Posting
              </a>
            )}
            {job.applyUrl && (
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.apply}`}>
                Apply Now
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={styles.detail}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || "—"}</span>
    </div>
  );
}
