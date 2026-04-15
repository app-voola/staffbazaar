'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MockApplicant } from '@/services/mock/applicants';
import { useMessages } from '@/contexts/MessagesContext';

const STAGES_ORDER = ['applied', 'shortlisted', 'called', 'hired'] as const;

export function KanbanCard({
  applicant,
  onMoveNext,
  onHireRequest,
  onDragStart,
}: {
  applicant: MockApplicant;
  onMoveNext: (id: string) => void;
  onHireRequest: (id: string) => void;
  onDragStart: (id: string) => void;
}) {
  const idx = STAGES_ORDER.indexOf(applicant.stage);
  const isCalled = applicant.stage === 'called';
  const isHired = applicant.stage === 'hired';
  const stars = Array.from({ length: 5 }, (_, i) => i < applicant.rating);
  const router = useRouter();
  const { startChat } = useMessages();

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await startChat({
        id: `applicant-${applicant.id}`,
        name: applicant.name,
        role: applicant.role,
        avatar: applicant.avatar,
        initials: applicant.initials,
      });
      router.push('/messages');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="kanban-card"
      draggable={!isHired}
      onDragStart={() => onDragStart(applicant.id)}
      style={isHired ? { borderLeft: '3px solid var(--green)' } : undefined}
    >
      <div className="kanban-card-top">
        <div className="kanban-card-avatar">
          {applicant.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={applicant.avatar} alt={applicant.name} />
          ) : (
            <span>{applicant.initials}</span>
          )}
          <span className="verified-tick">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>
        <div>
          <div className="kanban-card-name">{applicant.name}</div>
          <div className="kanban-card-role">{applicant.role}</div>
        </div>
      </div>

      <div className="kanban-card-exp">{applicant.experience} years experience</div>

      <div className="kanban-card-footer">
        <div className="kanban-card-salary">₹{applicant.salary.toLocaleString('en-IN')}/mo</div>
        <div className="star-rating">
          {stars.map((on, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className={on ? 'filled' : 'empty'}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>

      <div className="kanban-card-actions">
        <Link href={`/candidate/${applicant.id}`} title="View" onClick={(e) => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
        <a
          className="btn-call"
          title="Call"
          href={`tel:${applicant.phone}`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
        <button
          type="button"
          className="btn-message"
          title="Message"
          onClick={handleMessage}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        {!isHired && (
          <button
            type="button"
            className="btn-move-next"
            title={isCalled ? 'Hire' : 'Move to next stage'}
            onClick={() => (isCalled ? onHireRequest(applicant.id) : onMoveNext(applicant.id))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isCalled ? 2.5 : 2}>
              {isCalled ? <polyline points="20 6 9 17 4 12" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
          </button>
        )}
      </div>

      <style>{`
        .kanban-card { background: white; border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-xs); cursor: grab; transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; display: flex; flex-direction: column; gap: 10px; }
        .kanban-card:active { cursor: grabbing; }
        .kanban-card-top { display: flex; align-items: center; gap: 10px; }
        .kanban-card-avatar { position: relative; overflow: visible; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(145deg,var(--ember),var(--gold)); display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-display); font-size: 14px; flex-shrink: 0; }
        .kanban-card-avatar img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .verified-tick { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; background: var(--green); color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; }
        .verified-tick svg { width: 7px; height: 7px; stroke-width: 4; }
        .kanban-card-name { font-weight: 600; font-size: 14px; color: var(--charcoal); }
        .kanban-card-role { font-size: 12px; color: var(--charcoal-light); }
        .kanban-card-exp { font-size: 12px; color: var(--charcoal-light); }
        .kanban-card-footer { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
        .kanban-card-salary { font-weight: 700; color: var(--charcoal-mid); }
        .star-rating { display: flex; gap: 1px; }
        .star-rating svg { width: 12px; height: 12px; }
        .star-rating svg.filled { fill: var(--gold); color: var(--gold); }
        .star-rating svg.empty { fill: none; color: var(--sand); }
        .kanban-card-actions { display: flex; align-items: center; gap: 6px; }
        .kanban-card-actions button, .kanban-card-actions a { width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--cream); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--charcoal); transition: all 0.2s; text-decoration: none; }
        .kanban-card-actions a.btn-call { background: var(--green-light); color: var(--green-dark); }
        .kanban-card-actions a.btn-call:hover { background: var(--green); color: white; }
        .kanban-card-actions button.btn-message { background: var(--ember-glow); color: var(--ember); }
        .kanban-card-actions button.btn-message:hover { background: var(--ember); color: white; }
        .kanban-card-actions button.btn-move-next { background: var(--ember-glow); color: var(--ember); }
        .kanban-card-actions button.btn-move-next:hover { background: var(--ember); color: white; }
        .kanban-card-actions svg { width: 15px; height: 15px; }
      `}</style>
    </div>
  );
}
