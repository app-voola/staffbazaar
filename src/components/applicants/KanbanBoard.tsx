'use client';

import { useState } from 'react';
import { useApplicants } from '@/contexts/ApplicantsContext';
import { useJobs } from '@/contexts/JobsContext';
import type { ApplicantStage } from '@/services/mock/applicants';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { HireConfirmModal } from './HireConfirmModal';

const STAGES: { key: ApplicantStage; title: string }[] = [
  { key: 'applied', title: 'Applied' },
  { key: 'shortlisted', title: 'Shortlisted' },
  { key: 'called', title: 'Called' },
  { key: 'hired', title: 'Hired' },
];

const NEXT: Record<ApplicantStage, ApplicantStage> = {
  applied: 'shortlisted',
  shortlisted: 'called',
  called: 'hired',
  hired: 'hired',
};

export function KanbanBoard({ jobId }: { jobId: string }) {
  const { byJobAndStage, moveTo } = useApplicants();
  const { updateJob } = useJobs();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingHireId, setPendingHireId] = useState<string | null>(null);

  const requestHire = (id: string) => setPendingHireId(id);

  const confirmHire = () => {
    if (!pendingHireId) return;
    moveTo(pendingHireId, 'hired');
    updateJob(jobId, { status: 'closed' });
    setPendingHireId(null);
  };

  const handleDrop = (stage: ApplicantStage) => {
    if (!draggedId) return;
    if (stage === 'hired') {
      setPendingHireId(draggedId);
    } else {
      moveTo(draggedId, stage);
    }
    setDraggedId(null);
  };

  const pendingName = pendingHireId
    ? byJobAndStage(jobId, 'applied')
        .concat(byJobAndStage(jobId, 'shortlisted'))
        .concat(byJobAndStage(jobId, 'called'))
        .find((a) => a.id === pendingHireId)?.name ?? ''
    : '';

  return (
    <>
      <div className="kanban-scroll">
        <div className="kanban-board">
          {STAGES.map((s) => {
            const cards = byJobAndStage(jobId, s.key);
            return (
              <KanbanColumn
                key={s.key}
                stage={s.key}
                title={s.title}
                count={cards.length}
                onDrop={handleDrop}
              >
                {cards.map((a) => (
                  <KanbanCard
                    key={a.id}
                    applicant={a}
                    onDragStart={setDraggedId}
                    onMoveNext={(id) => moveTo(id, NEXT[a.stage])}
                    onHireRequest={requestHire}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      </div>

      <HireConfirmModal
        name={pendingName}
        open={Boolean(pendingHireId)}
        onCancel={() => setPendingHireId(null)}
        onConfirm={confirmHire}
      />

      <style>{`
        /* Outer wrapper owns the horizontal scrollbar so it stays visible
           regardless of the parent layout's max-width. */
        .kanban-scroll { width: 100%; overflow-x: auto; overflow-y: visible; padding-bottom: 12px; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
        .kanban-scroll::-webkit-scrollbar { height: 10px; }
        .kanban-scroll::-webkit-scrollbar-track { background: var(--cream); border-radius: 100px; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 100px; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: var(--charcoal-light); }
        /* min-width forces all 4 columns + gaps to render at full size,
           guaranteeing the outer wrapper overflows even on 13" laptops. */
        .kanban-board { display: flex; gap: 16px; padding: 4px 4px 8px; min-width: max-content; }
        .kanban-board > * { scroll-snap-align: start; }
      `}</style>
    </>
  );
}
