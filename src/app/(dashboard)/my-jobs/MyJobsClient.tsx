'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useJobs } from '@/contexts/JobsContext';
import type { JobStatus } from '@/services/mock/jobs';
import { QuotaStrip } from '@/components/jobs/QuotaStrip';
import { JobTabs } from '@/components/jobs/JobTabs';
import { JobCard } from '@/components/jobs/JobCard';
import { PauseJobModal } from '@/components/jobs/PauseJobModal';

export function MyJobsClient() {
  const params = useSearchParams();
  const initial = (params?.get('tab') as JobStatus) || 'active';
  const { jobs, updateJob, quotaReached } = useJobs();
  const [activeTab, setActiveTab] = useState<JobStatus>(initial);
  const [pauseId, setPauseId] = useState<string | null>(null);

  useEffect(() => {
    const t = params?.get('tab');
    if (t) setActiveTab(t as JobStatus);
  }, [params]);

  const visible = jobs.filter((j) => j.status === activeTab);
  const pauseTarget = pauseId ? jobs.find((j) => j.id === pauseId) : null;

  return (
    <>
      <div className="page-top">
        <div>
          <h1>My Jobs</h1>
          <div className="subtitle">Manage your job posts and applicants</div>
        </div>
        <Link
          href={quotaReached ? '/pricing' : '/post-job'}
          className={`btn-post${quotaReached ? ' disabled' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {quotaReached ? 'Upgrade to Post More' : 'Post New Job'}
        </Link>
      </div>

      <QuotaStrip />
      <JobTabs active={activeTab} onChange={setActiveTab} />

      {visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__art empty-state__art--ember">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3>No {activeTab} jobs</h3>
          <p>
            {activeTab === 'active'
              ? 'Post your first job and start receiving applications today.'
              : `You have no ${activeTab} jobs right now.`}
          </p>
          {activeTab === 'active' && (
            <div className="empty-state__actions">
              <Link href="/post-job" className="btn-primary">
                + Post a New Job
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="jobs-list">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} onRequestPause={setPauseId} />
          ))}
        </div>
      )}

      <PauseJobModal
        jobTitle={pauseTarget?.title ?? ''}
        open={Boolean(pauseTarget)}
        onCancel={() => setPauseId(null)}
        onConfirm={() => {
          if (pauseId) updateJob(pauseId, { status: 'paused' });
          setPauseId(null);
        }}
      />

      <style>{`
        .page-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
        .page-top h1 { font-family: var(--font-display); font-size: 36px; line-height: 1; }
        .page-top .subtitle { font-size: 14px; color: var(--stone); margin-top: 4px; }
        .btn-post { display: inline-flex; align-items: center; gap: 10px; padding: 16px 28px; border-radius: 100px; background: var(--ember); color: white; font-size: 15px; font-weight: 700; font-family: var(--font-body); text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; box-shadow: 0 8px 24px rgba(220,74,26,0.3); }
        .btn-post:hover { background: #C7421A; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(220,74,26,0.35); }
        .btn-post svg { width: 20px; height: 20px; }
        .btn-post.disabled { background: var(--sand); color: var(--stone); box-shadow: none; }

        .jobs-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; }
        .job-card { background: white; border: 1.5px solid var(--sand); border-radius: 20px; padding: 0; transition: all 0.25s; text-decoration: none; color: inherit; overflow: hidden; display: flex; flex-direction: column; position: relative; }
        .job-card:hover { border-color: var(--ember); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }
        .job-card.dimmed { opacity: 0.7; }
        .job-card.dimmed:hover { opacity: 1; }
        .job-card-header { padding: 20px 22px 16px; border-bottom: 1px dashed var(--sand); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .job-title-wrap { flex: 1; min-width: 0; }
        .job-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .job-status-pill .status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .job-status-pill.active { background: #E8F5E9; color: #2E7D32; }
        .job-status-pill.active .status-dot { background: #2E7D32; }
        .job-status-pill.paused { background: #FFF8E1; color: #B8860B; }
        .job-status-pill.paused .status-dot { background: #B8860B; }
        .job-status-pill.closed { background: var(--cream); color: var(--stone); }
        .job-status-pill.closed .status-dot { background: var(--stone); }
        .job-status-pill.draft { background: var(--cream); color: var(--charcoal-light); }
        .job-status-pill.draft .status-dot { background: var(--charcoal-light); }
        .job-title { font-family: var(--font-display); font-size: 24px; color: var(--charcoal); line-height: 1.15; }
        .job-posted { font-size: 12px; color: var(--stone); margin-top: 4px; }
        .job-hero-stats { padding: 22px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; background: linear-gradient(180deg, #fff, var(--cream)); }
        .hero-stat { border-radius: 14px; padding: 14px 16px; background: white; border: 1px solid var(--sand); }
        .hero-stat.applicants { background: var(--ember-glow); border-color: transparent; }
        .hero-stat-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--stone); display: flex; align-items: center; gap: 5px; }
        .hero-stat.applicants .hero-stat-label { color: var(--ember); }
        .hero-stat-label svg { width: 12px; height: 12px; }
        .hero-stat-value { font-family: var(--font-display); font-size: 36px; line-height: 1; margin-top: 4px; color: var(--charcoal); }
        .hero-stat.applicants .hero-stat-value { color: var(--ember); }
        .hero-stat-sub { font-size: 11px; color: var(--stone); margin-top: 2px; }
        .job-actions { padding: 14px 18px; display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--sand); background: white; }
        .action-primary { flex: 1; padding: 12px 16px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; color: white; background: var(--charcoal); border: none; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        .action-primary:hover { background: var(--ember); }
        .action-primary svg { width: 14px; height: 14px; }
        .action-icon { width: 42px; height: 42px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--charcoal-light); background: var(--cream); border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .action-icon:hover { background: var(--sand); color: var(--charcoal); }
        .action-icon svg { width: 18px; height: 18px; }
      `}</style>
    </>
  );
}
