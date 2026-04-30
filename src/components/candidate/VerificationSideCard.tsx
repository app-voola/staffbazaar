'use client';

import type { WorkerProfileDetail } from '@/services/mock/workerProfiles';

export function VerificationSideCard({ profile }: { profile: WorkerProfileDetail }) {
  const bg = profile.verifications.background;
  type Tri = 'yes' | 'pending' | 'no';
  const items: { state: Tri; label: string; sub: string }[] = [
    {
      state: profile.verifications.aadhaar ? 'yes' : 'no',
      label: 'Aadhaar Verified',
      sub: profile.verifications.aadhaar ? 'Identity confirmed' : 'Not yet uploaded',
    },
    {
      state: profile.verifications.phone ? 'yes' : 'no',
      label: 'Phone Verified',
      sub: profile.verifications.phone ? 'Number confirmed' : 'Not yet provided',
    },
    {
      state: bg === 'verified' ? 'yes' : bg === 'pending' ? 'pending' : 'no',
      label: 'Background Check',
      sub: bg === 'verified' ? 'Cleared' : bg === 'pending' ? 'Review in progress' : 'Not yet completed',
    },
  ];

  return (
    <div className="side-card">
      <div className="side-card-title">🛡 Verification</div>
      {items.map((it, i) => (
        <div key={i} className="side-verify-row">
          <div className={`sv-icon ${it.state}`}>
            {it.state === 'yes' ? '✓' : it.state === 'pending' ? '…' : '✕'}
          </div>
          <div className="sv-label">
            {it.label}
            <small>{it.sub}</small>
          </div>
        </div>
      ))}

      <style>{`
        .side-card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px; }
        .side-card-title { font-family: var(--font-display); font-size: 18px; margin-bottom: 14px; }
        .side-verify-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--sand); }
        .side-verify-row:last-child { border-bottom: none; }
        .sv-icon { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; font-weight: 700; }
        .sv-icon.yes { background: var(--green-light); color: var(--green-dark); }
        .sv-icon.no { background: #FEE2E2; color: #DC2626; }
        .sv-icon.pending { background: #FEF3C7; color: #92400E; }
        .sv-label { font-size: 13px; color: var(--charcoal); font-weight: 600; }
        .sv-label small { display: block; font-size: 11px; color: var(--stone); font-weight: 500; margin-top: 1px; }
      `}</style>
    </div>
  );
}
