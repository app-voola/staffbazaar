'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';

type Stage = 'applied' | 'viewed' | 'shortlisted' | 'called' | 'hired' | 'rejected';

interface Application {
  id: string;
  stage: Stage;
  created_at: string;
  job_id: string | null;
  job_title: string | null;
  job_role: string | null;
  salary_min: number | null;
  salary_max: number | null;
  owner_id: string | null;
  restaurant_name: string | null;
  restaurant_city: string | null;
  restaurant_cover: string | null;
}

type FilterKey = 'all' | 'active' | 'shortlisted' | 'hired';

const STAGE_LABEL_KEY: Record<Stage, 'status_applied' | 'status_viewed' | 'status_shortlisted' | 'status_hired' | 'status_rejected'> = {
  applied: 'status_applied',
  viewed: 'status_viewed',
  shortlisted: 'status_shortlisted',
  called: 'status_shortlisted',
  hired: 'status_hired',
  rejected: 'status_rejected',
};

const STAGE_CLASS: Record<Stage, string> = {
  applied: 'status-applied',
  viewed: 'status-viewed',
  shortlisted: 'status-shortlisted',
  called: 'status-viewed',
  hired: 'status-hired',
  rejected: 'status-rejected',
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=60';

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/mo`;
  return `${fmt(min || max || 0)}/mo`;
}

function formatAppliedDate(iso: string, prefix: string): string {
  const d = new Date(iso);
  return `${prefix} ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export function MyApplicationsClient() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('applicants')
        .select('id, stage, created_at, job_id, jobs(id, title, role, salary_min, salary_max, owner_id)')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('[my-applications] load failed', error);
        setApps([]);
        setLoading(false);
        return;
      }

      const base = (rows ?? []) as unknown as Array<{
        id: string;
        stage: Stage;
        created_at: string;
        job_id: string | null;
        jobs: { id: string; title: string; role: string; salary_min: number; salary_max: number; owner_id: string } | null;
      }>;

      const ownerIds = Array.from(
        new Set(base.map((r) => r.jobs?.owner_id).filter((v): v is string => !!v)),
      );

      const restaurantsById: Record<string, { name: string; city: string; cover_image: string | null }> = {};
      if (ownerIds.length > 0) {
        const { data: rests } = await supabase
          .from('restaurants')
          .select('owner_id, name, city, cover_image')
          .in('owner_id', ownerIds);
        (rests ?? []).forEach((r: { owner_id: string; name: string; city: string; cover_image: string | null }) => {
          restaurantsById[r.owner_id] = { name: r.name, city: r.city, cover_image: r.cover_image };
        });
      }

      const mapped: Application[] = base.map((r) => {
        const rest = r.jobs?.owner_id ? restaurantsById[r.jobs.owner_id] : undefined;
        return {
          id: r.id,
          stage: r.stage,
          created_at: r.created_at,
          job_id: r.job_id,
          job_title: r.jobs?.title ?? null,
          job_role: r.jobs?.role ?? null,
          salary_min: r.jobs?.salary_min ?? null,
          salary_max: r.jobs?.salary_max ?? null,
          owner_id: r.jobs?.owner_id ?? null,
          restaurant_name: rest?.name ?? null,
          restaurant_city: rest?.city ?? null,
          restaurant_cover: rest?.cover_image ?? null,
        };
      });

      setApps(mapped);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`applicants-worker-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const counts = useMemo(() => {
    const c = { all: apps.length, active: 0, shortlisted: 0, hired: 0 };
    for (const a of apps) {
      if (a.stage === 'applied' || a.stage === 'viewed') c.active += 1;
      else if (a.stage === 'shortlisted' || a.stage === 'called') c.shortlisted += 1;
      else if (a.stage === 'hired') c.hired += 1;
    }
    return c;
  }, [apps]);

  const visible = useMemo(() => {
    if (filter === 'all') return apps;
    if (filter === 'active') return apps.filter((a) => a.stage === 'applied' || a.stage === 'viewed');
    if (filter === 'shortlisted') return apps.filter((a) => a.stage === 'shortlisted' || a.stage === 'called');
    if (filter === 'hired') return apps.filter((a) => a.stage === 'hired');
    return apps;
  }, [apps, filter]);

  return (
    <div className="sb-page-wrap">
      <div className="sb-page-head">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>
          <em>{t('page_my_applications')}</em>
        </h1>
      </div>

      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('tab_all')} ({counts.all})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === 'active' ? ' active' : ''}`}
          onClick={() => setFilter('active')}
        >
          {t('tab_active')} ({counts.active})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === 'shortlisted' ? ' active' : ''}`}
          onClick={() => setFilter('shortlisted')}
        >
          {t('tab_shortlisted')} ({counts.shortlisted})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === 'hired' ? ' active' : ''}`}
          onClick={() => setFilter('hired')}
        >
          {t('tab_hired')} ({counts.hired})
        </button>
      </div>

      {loading ? (
        <div className="tab-empty" style={{ display: 'block' }}>
          <p style={{ color: 'var(--charcoal-light)' }}>Loading your applications…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="tab-empty" style={{ display: 'block' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h3>
            {filter === 'all'
              ? t('empty_no_applications')
              : filter === 'shortlisted'
              ? t('empty_shortlisted_title')
              : filter === 'hired'
              ? t('empty_hired_title')
              : t('empty_no_active')}
          </h3>
          <p>
            {filter === 'all'
              ? t('empty_no_applications_sub')
              : filter === 'shortlisted'
              ? t('empty_shortlisted_sub')
              : filter === 'hired'
              ? t('empty_hired_sub')
              : t('empty_no_applications_sub')}
          </p>
        </div>
      ) : (
        <div className="job-feed">
          {visible.map((a) => {
            const salary = formatSalary(a.salary_min, a.salary_max);
            return (
              <Link key={a.id} href={a.job_id ? `/jobs/${a.job_id}` : '#'} className="job-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="job-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.restaurant_cover || PLACEHOLDER_IMG} alt={a.restaurant_name ?? 'Restaurant'} />
                  {a.job_role && (
                    <div className="job-card-role">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      {a.job_role}
                    </div>
                  )}
                  <div className="job-badges-overlay">
                    <span className="job-badge-time">{formatAppliedDate(a.created_at, t('applied_prefix'))}</span>
                  </div>
                </div>
                <div className="job-card-info">
                  <div className="job-card-head">
                    <h3 className="job-card-title">{a.restaurant_name ?? a.job_title ?? 'Restaurant'}</h3>
                    {a.restaurant_city && (
                      <span className="job-card-rest">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {a.restaurant_city}
                      </span>
                    )}
                  </div>
                  {salary && <div className="job-card-salary">{salary}</div>}
                  <div className="job-card-bottom">
                    <span className={`status-chip ${STAGE_CLASS[a.stage]}`}>{t(STAGE_LABEL_KEY[a.stage])}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .sb-page-wrap { max-width: 1200px; padding-bottom: 80px; }
        .sb-page-head { margin-bottom: 24px; }
        .sb-page-head h1 em { color: var(--ember); font-style: italic; }

        .filter-tabs { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 1px solid var(--sand); }
        .filter-tab { padding: 10px 18px; font-size: 13px; font-weight: 600; font-family: var(--font-body); color: var(--charcoal-light); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .filter-tab:hover { color: var(--charcoal); }
        .filter-tab.active { color: var(--ember); border-bottom-color: var(--ember); }

        .job-feed { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        @media (max-width: 1100px) { .job-feed { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .job-feed { grid-template-columns: 1fr; } }

        .job-card { background: white; border-radius: 16px; padding: 0; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); transition: transform 0.25s, box-shadow 0.25s; position: relative; overflow: hidden; }
        .job-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.10); border-color: rgba(220,74,26,0.15); }

        .job-thumb { width: 100%; height: 160px; overflow: hidden; position: relative; flex-shrink: 0; }
        .job-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .job-card:hover .job-thumb img { transform: scale(1.05); }
        .job-thumb::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.18), transparent 45%); pointer-events: none; }

        .job-card-role { position: absolute; top: 10px; left: 10px; z-index: 3; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; color: var(--ember); background: white; white-space: nowrap; box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
        .job-card-role svg { width: 12px; height: 12px; color: var(--ember); flex-shrink: 0; }

        .job-badges-overlay { position: absolute; bottom: 10px; left: 10px; z-index: 2; display: flex; flex-wrap: wrap; gap: 6px; }
        .job-badge-time { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 100px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.95); color: var(--charcoal); backdrop-filter: blur(8px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

        .job-card-info { padding: 14px 18px 18px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .job-card-head { display: flex; flex-wrap: nowrap; justify-content: flex-start; align-items: baseline; gap: 8px; min-width: 0; }
        .job-card-title { font-family: var(--font-display); font-weight: 400; font-size: 22px; color: var(--charcoal); line-height: 1.1; margin: 0; letter-spacing: -0.4px; flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .job-card-rest { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--charcoal-light); margin-left: auto; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .job-card-rest svg { width: 13px; height: 13px; color: var(--stone); flex-shrink: 0; }

        .job-card-salary { margin: 10px 0 0; font-family: var(--font-display); font-size: 20px; color: var(--charcoal); line-height: 1; font-variant-numeric: tabular-nums; }

        .job-card-bottom { display: flex; align-items: center; margin-top: 12px; }
        .status-chip { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 700; border: 1px solid transparent; letter-spacing: 0.2px; }
        .status-chip.status-hired { background: rgba(16,185,129,0.10); color: #059669; border-color: rgba(16,185,129,0.28); }
        .status-chip.status-shortlisted { background: rgba(245,158,11,0.10); color: #B45309; border-color: rgba(245,158,11,0.30); }
        .status-chip.status-viewed { background: rgba(59,130,246,0.10); color: #1D4ED8; border-color: rgba(59,130,246,0.30); }
        .status-chip.status-applied { background: var(--cream); color: var(--charcoal-mid); border-color: var(--sand); }
        .status-chip.status-rejected { background: rgba(148,163,184,0.12); color: var(--charcoal-light); border-color: rgba(148,163,184,0.28); }

        .tab-empty { text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-md); border: 1.5px dashed var(--sand); }
        .tab-empty svg { width: 44px; height: 44px; color: var(--stone); margin-bottom: 10px; }
        .tab-empty h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 6px; }
        .tab-empty p { font-size: 14px; color: var(--charcoal-light); }
      `}</style>
    </div>
  );
}
