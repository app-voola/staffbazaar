'use client';

import type { WorkExperience } from '@/services/mock/workerProfiles';

export function ExperienceTimeline({ items }: { items: WorkExperience[] }) {
  return (
    <div className="card">
      <div className="card-title">📋 Work Experience</div>
      <div className="timeline-list">
        {items.map((it, i) => (
          <div key={i} className="tl-row">
            <div className="tl-years-badge">
              <div className="num">{it.years}</div>
              <div className="lbl">years</div>
            </div>
            <div>
              <div className="tl-body-role">{it.role}</div>
              <div className="tl-body-place">{it.place}</div>
              <div className="tl-body-date">{it.date}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: var(--font-display); font-size: 20px; color: var(--charcoal); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .timeline-list { display: flex; flex-direction: column; gap: 14px; }
        .tl-row { display: flex; gap: 16px; align-items: flex-start; padding: 14px 16px; border-radius: var(--radius-md); background: var(--cream); }
        .tl-years-badge { flex-shrink: 0; width: 58px; height: 58px; border-radius: 50%; background: white; border: 2px solid var(--ember-glow); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .tl-years-badge .num { font-family: var(--font-display); font-size: 20px; color: var(--ember); line-height: 1; }
        .tl-years-badge .lbl { font-size: 10px; color: var(--stone); font-weight: 700; text-transform: uppercase; }
        .tl-body-role { font-size: 15px; font-weight: 700; color: var(--charcoal); margin-bottom: 2px; }
        .tl-body-place { font-size: 13px; color: var(--charcoal-light); margin-bottom: 4px; }
        .tl-body-date { font-size: 11px; color: var(--stone); font-weight: 600; }
      `}</style>
    </div>
  );
}
