'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/contexts/JobsContext';
import { useApplicants } from '@/contexts/ApplicantsContext';
import { useMessages } from '@/contexts/MessagesContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function OwnerDashboardPage() {
  const { user, restaurant } = useAuth();
  const { activeCount, postsUsed, postsLimit } = useJobs();
  const { applicants } = useApplicants();
  const { unreadCount } = useMessages();
  // Fallback fetch so the welcome name appears even if AuthContext's
  // restaurant state hasn't hydrated yet (or is stale on this tab).
  const [fallbackName, setFallbackName] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id || restaurant?.name) return;
    let cancelled = false;
    supabase
      .from('restaurants')
      .select('name')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('[dashboard] restaurant fetch failed', error);
        if (data?.name) setFallbackName(data.name as string);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, restaurant?.name]);

  const restaurantName = restaurant?.name || fallbackName;
  const newApplicants = applicants.filter((a) => a.stage === 'applied').length;
  const hiredCount = applicants.filter((a) => a.stage === 'hired').length;
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const quotaPct = Math.min(100, Math.round((postsUsed / postsLimit) * 100));
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="welcome-row">
        <div className="welcome-header">
          <h1>
            {greeting()}, {firstName}
          </h1>
          <div className="subtitle">{restaurantName || 'Your restaurant'}</div>
          <div className="date-text">{dateStr}</div>
        </div>
        <div className="quick-actions">
          <Link href="/post-job" className="btn-action btn-action-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New Job
          </Link>
          <Link href="/browse-staff" className="btn-action btn-action-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Browse Staff
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="stat-number">{activeCount}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-number">{newApplicants}</div>
          <div className="stat-label">New Applicants</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="stat-number">{hiredCount}</div>
          <div className="stat-label">Total Hires All Time</div>
        </div>
        <Link
          href="/pricing"
          className="stat-card"
          style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
        >
          <div className="stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-number">
            {postsUsed} <span style={{ fontSize: 22, color: 'var(--stone)', fontWeight: 400 }}>/ {postsLimit}</span>
          </div>
          <div className="stat-label">Job Posts This Month</div>
          <div style={{ height: 6, background: 'var(--cream)', borderRadius: 100, marginTop: 10, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${quotaPct}%`,
                background: 'linear-gradient(90deg,var(--ember),var(--gold))',
                borderRadius: 100,
              }}
            />
          </div>
        </Link>
      </div>

      <div className="section-block">
        <h2>Needs Your Attention</h2>
        <div className="attention-list">
          <div className="attention-card">
            <div className="attention-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div className="attention-body">
              <div className="attention-title">
                {newApplicants} new applicant{newApplicants === 1 ? '' : 's'}
                <span className="attention-count">{newApplicants}</span>
              </div>
              <div className="attention-sub">
                Review and shortlist before they take another job
              </div>
            </div>
            <Link href="/my-jobs" className="attention-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View
            </Link>
          </div>

          <div className="attention-card">
            <div className="attention-icon ember">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="attention-body">
              <div className="attention-title">
                {unreadCount} unread message{unreadCount === 1 ? '' : 's'}
                <span className="attention-count">{unreadCount}</span>
              </div>
              <div className="attention-sub">Reply to keep candidates engaged</div>
            </div>
            <Link href="/messages" className="attention-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Reply
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .welcome-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
        .section-block { margin-bottom: 40px; }
        .section-block h2 { font-family: var(--font-display); font-size: 24px; margin-bottom: 18px; }
        .attention-list { display: flex; flex-direction: column; gap: 12px; }
        .attention-card { display: flex; align-items: center; gap: 16px; padding: 18px 20px; background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); transition: all 0.2s; }
        .attention-card:hover { border-color: var(--ember); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .attention-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .attention-icon svg { width: 26px; height: 26px; }
        .attention-icon.blue { background: var(--blue-light); color: var(--blue); }
        .attention-icon.ember { background: var(--ember-glow); color: var(--ember); }
        .attention-body { flex: 1; min-width: 0; }
        .attention-title { font-size: 17px; font-weight: 700; color: var(--charcoal); line-height: 1.3; }
        .attention-sub { font-size: 14px; color: var(--charcoal-light); margin-top: 2px; }
        .attention-count { display: inline-block; background: var(--ember); color: white; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; margin-left: 6px; }
        .attention-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-size: 15px; font-weight: 700; text-decoration: none; background: var(--ember); color: white; border: none; cursor: pointer; flex-shrink: 0; transition: all 0.2s; }
        .attention-btn:hover { background: #C7421A; transform: scale(1.03); }
        .attention-btn svg { width: 18px; height: 18px; }
        @media (max-width: 640px) { .attention-card { flex-wrap: wrap; padding: 14px; } .attention-btn { width: 100%; justify-content: center; } }
        .welcome-header h1 { font-family: var(--font-display); font-size: 32px; margin-bottom: 2px; }
        .welcome-header .subtitle { font-size: 15px; color: var(--charcoal-light); }
        .welcome-header .date-text { font-size: 13px; color: var(--stone); margin-top: 4px; }
        .quick-actions { display: flex; gap: 12px; flex-shrink: 0; }
        .btn-action { display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px; border-radius: var(--radius-md); font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: all 0.25s; }
        .btn-action-primary { background: var(--ember); color: white; box-shadow: 0 4px 16px rgba(220,74,26,0.25); }
        .btn-action-primary:hover { background: #C7421A; transform: translateY(-2px); }
        .btn-action-outline { background: white; color: var(--charcoal); border: 1.5px solid var(--sand); }
        .btn-action-outline:hover { border-color: var(--ember); color: var(--ember); }
        .btn-action svg { width: 18px; height: 18px; }
        @media (max-width: 640px) { .welcome-row { flex-direction: column; } .quick-actions { width: 100%; flex-direction: column; } .welcome-header h1 { font-size: 26px; } }
      `}</style>
    </>
  );
}
