'use client';

import Link from 'next/link';
import { useJobs } from '@/contexts/JobsContext';

export function QuotaStrip() {
  const { postsUsed, postsLimit } = useJobs();
  const pct = Math.min(100, Math.round((postsUsed / postsLimit) * 100));
  return (
    <div className="quota-strip">
      <div className="quota-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11l-3 3-2-2" />
        </svg>
      </div>
      <div className="quota-text">
        <div className="quota-strip-label">Job posts this month</div>
        <div className="quota-strip-value">
          <span>{postsUsed}</span> / <span>{postsLimit}</span>
        </div>
      </div>
      <div className="quota-bar">
        <div className="quota-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="quota-plan-chip">Starter</span>
      <Link href="/pricing" className="quota-upgrade">
        Upgrade
      </Link>
      <style>{`
        .quota-strip { display: flex; align-items: center; gap: 20px; background: linear-gradient(135deg,#fff 0%,var(--cream) 100%); border: 1.5px solid var(--sand); border-radius: 20px; padding: 20px 24px; margin-bottom: 28px; }
        .quota-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--ember-glow); color: var(--ember); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quota-icon svg { width: 24px; height: 24px; }
        .quota-text { flex-shrink: 0; }
        .quota-strip-label { font-size: 12px; font-weight: 700; color: var(--stone); text-transform: uppercase; letter-spacing: 0.5px; }
        .quota-strip-value { font-family: var(--font-display); font-size: 26px; color: var(--charcoal); line-height: 1.1; }
        .quota-strip-value span:first-child { color: var(--ember); }
        .quota-bar { flex: 1; height: 10px; background: var(--cream); border-radius: 100px; overflow: hidden; min-width: 120px; }
        .quota-bar-fill { height: 100%; background: linear-gradient(90deg, var(--ember), var(--gold)); border-radius: 100px; transition: width 0.4s; }
        .quota-plan-chip { padding: 6px 14px; border-radius: 100px; background: white; color: var(--ember); font-size: 11px; font-weight: 800; text-transform: uppercase; border: 1.5px solid var(--ember-glow); }
        .quota-upgrade { padding: 10px 20px; border-radius: 100px; background: var(--ember); color: white; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: all 0.2s; }
        .quota-upgrade:hover { background: #C7421A; transform: translateY(-1px); }
        @media (max-width: 720px) { .quota-strip { flex-wrap: wrap; } .quota-bar { order: 10; width: 100%; flex-basis: 100%; } }
      `}</style>
    </div>
  );
}
