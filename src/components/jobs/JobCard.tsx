'use client';

import Link from 'next/link';
import type { MockJob } from '@/services/mock/jobs';
import { useJobs } from '@/contexts/JobsContext';

const PauseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);
const PlayIcon = (
  <svg viewBox="0 0 24 24" fill="#2E7D32" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const EditIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export function JobCard({
  job,
  onRequestPause,
}: {
  job: MockJob;
  onRequestPause: (id: string) => void;
}) {
  const { updateJob } = useJobs();
  const isActive = job.status === 'active';
  const isPaused = job.status === 'paused';

  return (
    <div className={`job-card${job.status === 'closed' ? ' dimmed' : ''}`}>
      <div className="job-card-header">
        <div className="job-title-wrap">
          <div className={`job-status-pill ${job.status}`}>
            <span className="status-dot" />
            {job.status[0].toUpperCase() + job.status.slice(1)}
          </div>
          <div className="job-title">{job.title}</div>
          <div className="job-posted">Posted {job.postedDaysAgo} days ago</div>
        </div>
      </div>

      <div className="job-hero-stats">
        <div className="hero-stat applicants">
          <div className="hero-stat-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Applicants
          </div>
          <div className="hero-stat-value">{job.applicants}</div>
          {job.newToday > 0 && <div className="hero-stat-sub">{job.newToday} new today</div>}
        </div>
        <div className="hero-stat">
          <div className="hero-stat-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Views
          </div>
          <div className="hero-stat-value">{job.views}</div>
        </div>
      </div>

      <div className="job-actions">
        <Link href={`/my-jobs/${job.id}/applicants`} className="action-primary">
          View Applicants
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        {isActive && (
          <button
            type="button"
            className="action-icon"
            aria-label="Pause"
            onClick={() => onRequestPause(job.id)}
          >
            {PauseIcon}
          </button>
        )}
        {isPaused && (
          <button
            type="button"
            className="action-icon"
            aria-label="Resume"
            style={{ color: '#2E7D32', background: '#E8F5E9' }}
            onClick={() => updateJob(job.id, { status: 'active' })}
          >
            {PlayIcon}
          </button>
        )}
        <Link href={`/my-jobs/${job.id}/edit`} className="action-icon" aria-label="Edit">
          {EditIcon}
        </Link>
      </div>
    </div>
  );
}
