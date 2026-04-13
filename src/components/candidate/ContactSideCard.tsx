'use client';

import type { MockWorker } from '@/services/mock/workers';
import type { WorkerProfileDetail } from '@/services/mock/workerProfiles';

export function ContactSideCard({
  worker,
  profile,
}: {
  worker: MockWorker;
  profile: WorkerProfileDetail;
}) {
  return (
    <div className="side-card contact-side">
      <div className="side-card-title">📞 Contact</div>
      <div className="side-contact-row">
        <div className="sc-icon phone">📞</div>
        <div>
          <div className="sc-label">Phone</div>
          <div className="sc-value">{worker.phone}</div>
        </div>
      </div>
      <div className="side-contact-row">
        <div className="sc-icon email">✉</div>
        <div>
          <div className="sc-label">Email</div>
          <div className="sc-value">{profile.email}</div>
        </div>
      </div>
      <a className="side-call-btn" href={`tel:${worker.phone}`}>
        📞 Call Now
      </a>

      <style>{`
        .side-card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px; }
        .side-card.contact-side { background: linear-gradient(145deg, #FFF7ED, var(--cream)); border-color: var(--ember-glow); }
        .side-card-title { font-family: var(--font-display); font-size: 18px; margin-bottom: 14px; }
        .side-contact-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--sand); }
        .side-contact-row:last-of-type { border-bottom: none; }
        .sc-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
        .sc-icon.phone { background: var(--green-light); color: var(--green-dark); }
        .sc-icon.email { background: var(--ember-glow); color: var(--ember); }
        .sc-label { font-size: 10px; color: var(--stone); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .sc-value { font-size: 14px; color: var(--charcoal); font-weight: 700; word-break: break-word; }
        .side-call-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 14px; padding: 12px 16px; border-radius: var(--radius-md); background: var(--green); color: white; text-decoration: none; font-size: 14px; font-weight: 700; transition: all 0.2s; }
        .side-call-btn:hover { background: #12A150; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
