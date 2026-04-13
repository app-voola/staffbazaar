'use client';

import type { MockWorker } from '@/services/mock/workers';

export function StatsBanner({ worker }: { worker: MockWorker }) {
  return (
    <div className="stats-banner">
      <div className="stat-cell">
        <div className="stat-cell-label">Salary</div>
        <div className="stat-cell-value">
          ₹{worker.salary.toLocaleString('en-IN')} <small>/mo</small>
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-cell-label">Ready to Join</div>
        <div className="stat-cell-value">
          <span className="hl-green">
            {worker.availability === 'now' ? 'Immediate' : worker.availability === 'week' ? 'This Week' : 'This Month'}
          </span>
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-cell-label">Experience</div>
        <div className="stat-cell-value">
          {worker.experience} <small>years</small>
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-cell-label">Rating</div>
        <div className="stat-cell-value">
          {worker.rating}.0 <small>/5</small>
        </div>
      </div>

      <style>{`
        .stats-banner { display: grid; grid-template-columns: repeat(4, 1fr); background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .stat-cell { padding: 0 16px; border-right: 1.5px solid var(--sand); }
        .stat-cell:last-child { border-right: none; }
        .stat-cell-label { font-size: 11px; font-weight: 700; color: var(--stone); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
        .stat-cell-value { font-family: var(--font-display); font-size: 26px; color: var(--charcoal); line-height: 1.1; }
        .stat-cell-value small { font-size: 13px; color: var(--stone); font-family: var(--font-body); font-weight: 500; }
        .hl-green { color: var(--green-dark); }
        @media (max-width: 968px) { .stats-banner { grid-template-columns: repeat(2, 1fr); gap: 16px; } .stat-cell { border-right: none; padding: 0; } }
      `}</style>
    </div>
  );
}
