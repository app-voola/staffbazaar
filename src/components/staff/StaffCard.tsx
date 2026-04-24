'use client';

import Link from 'next/link';
import type { MockWorker } from '@/services/mock/workers';
import { useSavedStaff } from '@/contexts/SavedStaffContext';

const AVAIL_LABELS: Record<MockWorker['availability'], { cls: string; text: string }> = {
  now: { cls: 'avail-now', text: 'Available Now' },
  week: { cls: 'avail-week', text: 'This Week' },
  month: { cls: 'avail-month', text: 'This Month' },
};

export function StaffCard({
  worker,
  onShortlist,
}: {
  worker: MockWorker;
  onShortlist: (w: MockWorker) => void;
}) {
  const { isSaved, toggle } = useSavedStaff();
  const saved = isSaved(worker.id);
  const avail = AVAIL_LABELS[worker.availability];

  const stars = Array.from({ length: 5 }, (_, i) => i < worker.rating);

  return (
    <div className="kanban-card staff-card">
      <button
        type="button"
        className={`saved-star${saved ? ' active' : ''}`}
        title={saved ? 'Unsave' : 'Save'}
        onClick={(e) => {
          e.stopPropagation();
          toggle(worker.id).catch((err) => {
            console.error('[StaffCard] save toggle failed', err);
          });
        }}
      >
        <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      <div className={`avail-pill ${avail.cls}`}>
        <span className="dot" />
        {avail.text}
      </div>

      <div className="kanban-card-top">
        <div className="kanban-card-avatar">
          {worker.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.avatar} alt={worker.name} />
          ) : (
            <span>{worker.initials}</span>
          )}
          {worker.verified && (
            <span className="verified-tick" title="Verified">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>
        <div>
          <div className="kanban-card-name">{worker.name}</div>
          <div className="kanban-card-role">{worker.roleLabel}</div>
        </div>
      </div>

      <div className="kanban-card-exp">
        {worker.experience} years experience · {worker.city}
      </div>

      <div className="kanban-card-footer">
        <div className="kanban-card-salary">₹{worker.salary.toLocaleString('en-IN')}/mo</div>
        <div className="star-rating">
          {stars.map((on, i) => (
            <svg key={i} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={on ? 'filled' : 'empty'}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>

      <div className="kanban-card-actions">
        <Link href={`/candidate/${worker.id}`} title="View" onClick={(e) => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
        <a
          className="btn-call"
          title="Call"
          href={`tel:${worker.phone}`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
        <button
          type="button"
          className="btn-shortlist"
          title="Add to Job"
          onClick={(e) => {
            e.stopPropagation();
            onShortlist(worker);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <style>{`
        .staff-card.kanban-card { background: white !important; align-items: center !important; text-align: center !important; padding: 20px 18px 16px !important; display: flex !important; flex-direction: column !important; gap: 12px !important; cursor: pointer; position: relative; border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); transition: transform 0.2s, box-shadow 0.2s; border: 1.5px solid transparent; }
        .staff-card.kanban-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--ember-glow); }
        .staff-card .kanban-card-top { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; width: 100%; }
        .staff-card .kanban-card-avatar { position: relative; overflow: visible !important; width: 84px !important; height: 84px !important; border-radius: 50%; background: linear-gradient(145deg, var(--ember), var(--gold)); display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-display); font-size: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .staff-card .kanban-card-avatar img { border-radius: 50%; width: 84px; height: 84px; object-fit: cover; }
        .staff-card .kanban-card-name { font-family: var(--font-display); font-size: 19px !important; color: var(--charcoal); line-height: 1.2; }
        .staff-card .kanban-card-role { font-size: 14px !important; color: var(--charcoal-light); margin-top: 3px; font-weight: 600; }
        .verified-tick { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; background: var(--green); color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; z-index: 2; }
        .verified-tick svg { width: 7px; height: 7px; stroke-width: 4; }
        .avail-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }
        .avail-pill .dot { width: 7px; height: 7px; border-radius: 50%; }
        .avail-pill.avail-now { background: var(--green-light); color: var(--green-dark); }
        .avail-pill.avail-now .dot { background: var(--green-dark); box-shadow: 0 0 0 3px rgba(21,128,61,0.2); }
        .avail-pill.avail-week { background: #FEF3C7; color: #92400E; }
        .avail-pill.avail-week .dot { background: #92400E; }
        .avail-pill.avail-month { background: var(--cream); color: var(--charcoal-light); }
        .avail-pill.avail-month .dot { background: var(--charcoal-light); }
        .saved-star { position: absolute; top: 10px; right: 10px; width: 26px; height: 26px; border-radius: 50%; background: white; border: 1px solid var(--sand); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 3; }
        .saved-star svg { width: 13px; height: 13px; color: var(--stone); fill: none; transition: all 0.2s; }
        .saved-star:hover { transform: scale(1.1); border-color: var(--ember); }
        .saved-star.active svg { color: var(--ember); fill: var(--ember); }
        .kanban-card-exp { font-size: 13px; color: var(--charcoal-light); font-weight: 600; }
        .staff-card .kanban-card-footer { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; }
        .staff-card .kanban-card-salary { font-family: var(--font-display); font-size: 22px !important; color: var(--charcoal); font-weight: 400; }
        .star-rating { display: flex; gap: 1px; }
        .star-rating svg { width: 12px; height: 12px; }
        .star-rating svg.filled { fill: var(--gold); color: var(--gold); }
        .star-rating svg.empty { fill: none; color: var(--sand); }
        .kanban-card-actions { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding-top: 4px; }
        .kanban-card-actions button, .kanban-card-actions a { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--cream); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--charcoal); transition: all 0.2s; text-decoration: none; }
        .kanban-card-actions button:hover, .kanban-card-actions a:hover { background: var(--ember-glow); color: var(--ember); transform: scale(1.08); }
        .kanban-card-actions a.btn-call { background: var(--green-light); color: var(--green-dark); }
        .kanban-card-actions a.btn-call:hover { background: var(--green); color: white; }
        .kanban-card-actions button.btn-shortlist { background: var(--ember-glow); color: var(--ember); }
        .kanban-card-actions button.btn-shortlist:hover { background: var(--ember); color: white; }
        .kanban-card-actions svg { width: 17px; height: 17px; }
      `}</style>
    </div>
  );
}
