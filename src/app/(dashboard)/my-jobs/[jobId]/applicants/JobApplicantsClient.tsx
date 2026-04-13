'use client';

import Link from 'next/link';
import { useJobs } from '@/contexts/JobsContext';
import { KanbanBoard } from '@/components/applicants/KanbanBoard';

export function JobApplicantsClient({ jobId }: { jobId: string }) {
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <>
        <Link href="/my-jobs" className="back-link">
          ← Back to My Jobs
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 16 }}>
          Job not found
        </h1>
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/my-jobs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--charcoal-light)',
            textDecoration: 'none',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to My Jobs
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>
          {job.title} — Spice Garden
        </h1>
        <div style={{ fontSize: 13, color: 'var(--stone)', marginTop: 2 }}>
          Posted {job.postedDaysAgo} days ago · {job.applicants} applicants · {job.views} views
        </div>
      </div>

      <KanbanBoard jobId={jobId} />
    </>
  );
}
