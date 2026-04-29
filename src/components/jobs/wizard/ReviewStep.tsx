'use client';

import type { WizardData } from './types';

export function ReviewStep({
  data,
  onPublish,
  onSaveDraft,
  publishDisabled,
}: {
  data: WizardData;
  onPublish: () => void;
  onSaveDraft: () => void;
  publishDisabled?: boolean;
}) {
  return (
    <div className="step active">
      <div className="step-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2>Review &amp; publish</h2>
      <p className="step-desc">Make sure everything looks good before posting</p>

      <div className="review-card">
        <div className="review-row">
          <div className="review-label">Role</div>
          <div className="review-value">{data.role || '—'}</div>
        </div>
        {data.specs.length > 0 && (
          <div className="review-row">
            <div className="review-label">Specializations</div>
            <div className="review-value">{data.specs.join(', ')}</div>
          </div>
        )}
        <div className="review-row">
          <div className="review-label">Salary Range</div>
          <div className="review-value">
            ₹{data.salaryMin || '?'} - ₹{data.salaryMax || '?'}/mo
          </div>
        </div>
        <div className="review-row">
          <div className="review-label">Shift</div>
          <div className="review-value">{data.shift || 'Not set'}</div>
        </div>
        <div className="review-row">
          <div className="review-label">Job Type</div>
          <div className="review-value">{data.jobType}</div>
        </div>
        <div className="review-row">
          <div className="review-label">Tips</div>
          <div className="review-value">{data.tips ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="review-actions">
        <button type="button" className="btn-draft" onClick={onSaveDraft}>
          Save as Draft
        </button>
        <button
          type="button"
          className="btn-next"
          style={{ flex: 1 }}
          onClick={onPublish}
          disabled={publishDisabled}
        >
          {publishDisabled ? 'Quota reached — upgrade' : 'Publish Job'}
        </button>
      </div>

      <style>{`
        .review-card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .review-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cream); gap: 16px; }
        .review-row:last-child { border-bottom: none; }
        .review-label { font-size: 13px; color: var(--stone); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .review-value { font-size: 14px; font-weight: 600; color: var(--charcoal); text-align: right; }
        .review-actions { display: flex; gap: 12px; }
        .btn-draft { padding: 14px 28px; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; font-family: var(--font-body); background: white; color: var(--charcoal); border: 1.5px solid var(--sand); cursor: pointer; transition: all 0.2s; }
        .btn-draft:hover { border-color: var(--charcoal-light); }
        .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
