"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import styles from "./page.module.scss";

async function fetchCompany(id: string) {
  const res = await fetch(`/api/companies/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch company");
  return res.json();
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => fetchCompany(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className={styles.loading}>Loading company...</div>;
  }

  const company = data?.company;
  if (!company) {
    return <div className={styles.loading}>Company not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.name}>{company.name}</h1>
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer" className={styles.website}>
            {company.website}
          </a>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Overview</h2>
          <p className={styles.description}>{company.description || "No description available."}</p>
          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.label}>Industry</span>
              <span className={styles.value}>{company.industry || "—"}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Sub Industry</span>
              <span className={styles.value}>{company.subIndustry || "—"}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Founded</span>
              <span className={styles.value}>{company.founded || "—"}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Size</span>
              <span className={styles.value}>{company.companySize || "—"}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Headquarters</span>
              <span className={styles.value}>{company.headquarters || "—"}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.label}>Remote Policy</span>
              <span className={styles.value}>{company.remotePolicy || "—"}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Scores</h2>
          <div className={styles.scores}>
            <ScoreBar label="Hiring Score" value={company.hiringScore || 0} />
            <ScoreBar label="Growth Score" value={company.growthScore || 0} />
            <ScoreBar label="Startup Score" value={company.startupScore || 0} />
            <ScoreBar label="Remote Score" value={company.remoteScore || 0} />
            <ScoreBar label="Technology Score" value={company.technologyScore || 0} />
            <ScoreBar label="AI Adoption Score" value={company.aiAdoptionScore || 0} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Social & Contact</h2>
          <div className={styles.links}>
            {company.linkedIn && <a href={company.linkedIn} target="_blank" rel="noopener noreferrer" className={styles.link}>LinkedIn</a>}
            {company.twitter && <a href={company.twitter} target="_blank" rel="noopener noreferrer" className={styles.link}>Twitter</a>}
            {company.github && <a href={company.github} target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub</a>}
            {company.careersPage && <a href={company.careersPage} target="_blank" rel="noopener noreferrer" className={styles.link}>Careers</a>}
          </div>
          {company.publicEmails?.length > 0 && (
            <div className={styles.emails}>
              <span className={styles.label}>Emails:</span>
              {company.publicEmails.map((email: string) => (
                <span key={email} className={styles.email}>{email}</span>
              ))}
            </div>
          )}
        </div>

        {company.jobs?.length > 0 && (
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h2 className={styles.cardTitle}>Active Jobs ({company.jobs.length})</h2>
            <div className={styles.jobsList}>
              {company.jobs.map((job: any) => (
                <div key={job.id} className={styles.jobItem}>
                  <span className={styles.jobTitle}>{job.title}</span>
                  <span className={styles.jobLocation}>{job.location || "—"}</span>
                  <span className={styles.jobType}>{job.employmentType || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.scoreBar}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValue}>{value}</span>
      </div>
      <div className={styles.scoreTrack}>
        <div className={styles.scoreFill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
