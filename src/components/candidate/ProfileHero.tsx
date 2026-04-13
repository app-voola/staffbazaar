'use client';

import type { MockWorker } from '@/services/mock/workers';
import type { WorkerProfileDetail } from '@/services/mock/workerProfiles';

export function ProfileHero({
  worker,
  profile,
  onAddToJob,
}: {
  worker: MockWorker;
  profile: WorkerProfileDetail;
  onAddToJob: () => void;
}) {
  return (
    <div className="profile-hero">
      <div className="profile-hero-avatar-wrap">
        <div className="profile-hero-avatar">
          {worker.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.avatar} alt={worker.name} />
          ) : (
            <span>{worker.initials}</span>
          )}
        </div>
        <span className="verified-dot" title="Verified">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </div>
      <div className="profile-hero-main">
        <h1>{worker.name}</h1>
        <div className="profile-hero-role">{worker.roleLabel}</div>
        <div className="profile-meta">
          <span className="chip">
            📍 {worker.city} · {profile.area}
          </span>
          <span className="chip">🗣 {profile.languages.join(', ')}</span>
          <span className="chip verified">✓ Verified</span>
        </div>
      </div>
      <div className="profile-hero-actions">
        <a className="btn-primary-action btn-call" href={`tel:${worker.phone}`}>
          📞 Call
        </a>
        <button type="button" className="btn-primary-action btn-add" onClick={onAddToJob}>
          🔖 Add to Job
        </button>
      </div>

      <style>{`
        .profile-hero { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 28px; display: flex; gap: 24px; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; }
        .profile-hero-avatar-wrap { position: relative; flex-shrink: 0; width: 160px; height: 160px; }
        .profile-hero-avatar { width: 160px; height: 160px; border-radius: 50%; background: linear-gradient(145deg, var(--ember), var(--gold)); display: flex; align-items: center; justify-content: center; overflow: hidden; color: white; font-family: var(--font-display); font-size: 56px; box-shadow: 0 8px 28px rgba(0,0,0,0.08); border: 4px solid white; }
        .profile-hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .verified-dot { position: absolute; bottom: 6px; right: 6px; width: 42px; height: 42px; border-radius: 50%; background: var(--green); color: white; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2; }
        .verified-dot svg { width: 20px; height: 20px; stroke-width: 3; }
        .profile-hero-main { flex: 1; min-width: 260px; }
        .profile-hero-main h1 { font-family: var(--font-display); font-size: 34px; line-height: 1.1; margin-bottom: 4px; }
        .profile-hero-role { font-size: 15px; color: var(--charcoal-light); font-weight: 600; margin-bottom: 14px; }
        .profile-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .profile-meta .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; background: var(--cream); color: var(--charcoal-mid); font-size: 13px; font-weight: 600; }
        .profile-meta .chip.verified { background: var(--green-light); color: var(--green-dark); }
        .profile-hero-actions { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; min-width: 200px; }
        .btn-primary-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 22px; border-radius: var(--radius-md); font-size: 14px; font-weight: 700; font-family: var(--font-body); border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .btn-call { background: var(--green-light); color: var(--green-dark); }
        .btn-call:hover { background: var(--green); color: white; }
        .btn-add { background: var(--ember); color: white; box-shadow: 0 4px 16px rgba(220,74,26,0.22); }
        .btn-add:hover { background: #C7421A; transform: translateY(-1px); }
        @media (max-width: 640px) { .profile-hero-avatar-wrap, .profile-hero-avatar { width: 120px; height: 120px; } .profile-hero-avatar { font-size: 44px; } .profile-hero-main h1 { font-size: 26px; } }
      `}</style>
    </div>
  );
}
