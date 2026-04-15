'use client';

import { useState } from 'react';
import { useJobs } from '@/contexts/JobsContext';
import { useApplicants } from '@/contexts/ApplicantsContext';
import type { MockWorker } from '@/services/mock/workers';

export function ShortlistModal({
  worker,
  onClose,
  onPicked,
}: {
  worker: MockWorker | null;
  onClose: () => void;
  onPicked: (jobTitle: string) => void;
}) {
  const { jobs } = useJobs();
  const { addApplicant, applicants } = useApplicants();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!worker) return null;

  const activeJobs = jobs.filter((j) => j.status === 'active');

  const handlePick = async (jobId: string, jobTitle: string) => {
    const alreadyThere = applicants.some((a) => a.jobId === jobId && a.phone === worker.phone);
    if (alreadyThere) {
      onPicked(jobTitle);
      return;
    }
    setBusy(jobId);
    setError('');
    try {
      await addApplicant({
        jobId,
        name: worker.name,
        role: worker.roleLabel,
        experience: worker.experience,
        salary: worker.salary,
        rating: worker.rating,
        phone: worker.phone,
        avatar: worker.avatar,
        initials: worker.initials,
        stage: 'shortlisted',
      });
      setBusy(null);
      onPicked(jobTitle);
    } catch (err) {
      setBusy(null);
      setError((err as Error).message || 'Failed to shortlist');
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="shortlist-modal">
        <div className="shortlist-modal-title">
          Add <span>{worker.name}</span> to a job
        </div>
        <div className="shortlist-modal-sub">
          They&apos;ll appear in that job&apos;s <strong>Shortlisted</strong> column.
        </div>
        <div className="job-pick-list">
          {activeJobs.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--stone)', textAlign: 'center', padding: 20 }}>
              No active jobs. Post one first.
            </p>
          ) : (
            activeJobs.map((j) => {
              const loadingThis = busy === j.id;
              return (
                <button
                  key={j.id}
                  type="button"
                  className="job-pick"
                  disabled={busy !== null}
                  onClick={() => handlePick(j.id, j.title)}
                >
                  <div>
                    <div className="job-pick-name">{j.title}</div>
                    <div className="job-pick-meta">{j.applicants} applicants</div>
                  </div>
                  <span className="job-pick-arrow">{loadingThis ? '…' : '→'}</span>
                </button>
              );
            })
          )}
        </div>
        {error && (
          <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button type="button" className="modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
        .shortlist-modal { background: white; border-radius: var(--radius-lg); max-width: 440px; width: 100%; padding: 28px; box-shadow: var(--shadow-lg); }
        .shortlist-modal-title { font-family: var(--font-display); font-size: 24px; margin-bottom: 6px; }
        .shortlist-modal-title span { color: var(--ember); }
        .shortlist-modal-sub { font-size: 13px; color: var(--stone); margin-bottom: 20px; }
        .shortlist-modal-sub strong { color: var(--charcoal); }
        .job-pick-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .job-pick { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-radius: var(--radius-md); border: 1.5px solid var(--sand); background: var(--cream); cursor: pointer; transition: all 0.2s; text-align: left; font-family: var(--font-body); }
        .job-pick:hover { border-color: var(--ember); background: var(--ember-glow); }
        .job-pick-name { font-size: 15px; font-weight: 700; color: var(--charcoal); }
        .job-pick-meta { font-size: 12px; color: var(--stone); margin-top: 2px; }
        .job-pick-arrow { color: var(--ember); font-weight: 700; font-size: 18px; }
        .modal-cancel { width: 100%; padding: 14px; border-radius: var(--radius-md); background: transparent; border: 1.5px solid var(--sand); font-size: 14px; font-weight: 700; font-family: var(--font-body); cursor: pointer; color: var(--charcoal-mid); }
        .modal-cancel:hover { background: var(--cream); }
      `}</style>
    </div>
  );
}
