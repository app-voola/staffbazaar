'use client';

import { useJobs } from '@/contexts/JobsContext';
import type { JobStatus } from '@/services/mock/jobs';

const TABS: { key: JobStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'paused', label: 'Paused' },
  { key: 'closed', label: 'Closed' },
];

export function JobTabs({
  active,
  onChange,
}: {
  active: JobStatus;
  onChange: (s: JobStatus) => void;
}) {
  const { countByStatus } = useJobs();
  return (
    <div className="job-tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`job-tab${active === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          <span className="tab-count">{countByStatus(t.key)}</span>
        </button>
      ))}
      <style>{`
        .job-tabs { display: flex; gap: 8px; margin-bottom: 20px; padding: 6px; background: white; border: 1.5px solid var(--sand); border-radius: 100px; width: fit-content; max-width: 100%; overflow-x: auto; }
        .job-tab { padding: 10px 22px; border-radius: 100px; font-size: 14px; font-weight: 700; color: var(--charcoal-light); background: transparent; border: none; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
        .job-tab:hover { color: var(--charcoal); }
        .tab-count { padding: 2px 10px; border-radius: 100px; background: var(--cream); font-size: 11px; font-weight: 800; color: var(--charcoal-light); }
        .job-tab.active { background: var(--charcoal); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .job-tab.active .tab-count { background: rgba(255,255,255,0.2); color: white; }
      `}</style>
    </div>
  );
}
