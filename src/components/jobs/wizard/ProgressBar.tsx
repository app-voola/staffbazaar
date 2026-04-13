'use client';

const titles = ['', 'Select Role', 'Job Description', 'Compensation & Schedule', 'Review & Publish'];

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="progress-wrap" style={{ padding: '0' }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <div className="progress-label">
          <span>
            Step <strong>{step}</strong> of <strong>{total}</strong>
          </span>
          <span>{titles[step]}</span>
        </div>
      </div>
    </div>
  );
}
