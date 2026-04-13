'use client';

import { useState, type DragEvent, type ReactNode } from 'react';
import type { ApplicantStage } from '@/services/mock/applicants';

const ACCENTS: Record<ApplicantStage, { border: string; pill: string }> = {
  applied: { border: 'var(--blue)', pill: 'blue' },
  shortlisted: { border: 'var(--gold)', pill: 'amber' },
  called: { border: '#7C3AED', pill: 'purple' },
  hired: { border: 'var(--green)', pill: 'green' },
};

export function KanbanColumn({
  stage,
  title,
  count,
  onDrop,
  children,
}: {
  stage: ApplicantStage;
  title: string;
  count: number;
  onDrop: (stage: ApplicantStage) => void;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  const a = ACCENTS[stage];

  return (
    <div
      className={`kanban-column${over ? ' drop-target' : ''}`}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={() => {
        setOver(false);
        onDrop(stage);
      }}
    >
      <div className="kanban-column-header" style={{ borderBottomColor: a.border }}>
        <h3>{title}</h3>
        <span className={`kanban-count ${a.pill}`}>{count}</span>
      </div>
      {children}

      <style>{`
        .kanban-column { min-width: 280px; max-width: 320px; flex-shrink: 0; background: var(--cream); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .kanban-column.drop-target { background: var(--ember-glow); outline: 2px dashed var(--ember); outline-offset: -6px; }
        .kanban-column-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1.5px solid var(--sand); }
        .kanban-column-header h3 { font-family: var(--font-body); font-size: 14px; font-weight: 700; color: var(--charcoal); }
        .kanban-count { padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 700; }
        .kanban-count.blue { background: var(--blue-light); color: var(--blue); }
        .kanban-count.amber { background: var(--gold-light); color: var(--gold); }
        .kanban-count.purple { background: #EDE9FE; color: #7C3AED; }
        .kanban-count.green { background: var(--green-light); color: var(--green-dark); }
      `}</style>
    </div>
  );
}
