'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';
import { applyToJob } from '@/lib/worker-apply';

interface SavedJobRow {
  id: string;
  title: string;
  role: string;
  salary_min: number;
  salary_max: number;
  owner_id: string;
  saved_at: string;
  restaurant_name: string | null;
  restaurant_city: string | null;
  restaurant_cover: string | null;
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=60';

function formatSalary(min: number, max: number): string {
  if (!min && !max) return '';
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/mo`;
  return `${fmt(min || max)}/mo`;
}

export function SavedJobsClient() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [rows, setRows] = useState<SavedJobRow[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: savedRows } = await supabase
        .from('saved_jobs')
        .select('job_id, saved_at')
        .eq('worker_id', user.id)
        .order('saved_at', { ascending: false });
      if (cancelled) return;

      const jobIds = (savedRows ?? []).map((r: { job_id: string }) => r.job_id);
      if (jobIds.length === 0) {
        setRows([]);
        setApplied(new Set());
        setLoading(false);
        return;
      }

      const [{ data: jobs }, appsRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, role, salary_min, salary_max, owner_id')
          .in('id', jobIds),
        supabase.from('applicants').select('job_id').eq('worker_id', user.id),
      ]);

      const ownerIds = Array.from(new Set((jobs ?? []).map((j) => j.owner_id)));
      const restMap: Record<string, { name: string; city: string; cover_image: string | null }> = {};
      if (ownerIds.length) {
        const { data: rests } = await supabase
          .from('restaurants')
          .select('owner_id, name, city, cover_image')
          .in('owner_id', ownerIds);
        (rests ?? []).forEach((r: { owner_id: string; name: string; city: string; cover_image: string | null }) => {
          restMap[r.owner_id] = { name: r.name, city: r.city, cover_image: r.cover_image };
        });
      }

      const savedAtById: Record<string, string> = {};
      (savedRows ?? []).forEach((r: { job_id: string; saved_at: string }) => {
        savedAtById[r.job_id] = r.saved_at;
      });

      const result: SavedJobRow[] = (jobs ?? [])
        .map((j) => ({
          id: j.id,
          title: j.title,
          role: j.role,
          salary_min: j.salary_min,
          salary_max: j.salary_max,
          owner_id: j.owner_id,
          saved_at: savedAtById[j.id] ?? '',
          restaurant_name: restMap[j.owner_id]?.name ?? null,
          restaurant_city: restMap[j.owner_id]?.city ?? null,
          restaurant_cover: restMap[j.owner_id]?.cover_image ?? null,
        }))
        .sort((a, b) => (a.saved_at < b.saved_at ? 1 : -1));

      setRows(result);
      setApplied(new Set((appsRes.data ?? []).map((r: { job_id: string | null }) => r.job_id).filter((v): v is string => !!v)));
      setLoading(false);
    };

    load();

    const ch = supabase
      .channel(`saved-jobs-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_jobs', filter: `worker_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const unsave = async (jobId: string) => {
    if (!user) return;
    await supabase.from('saved_jobs').delete().eq('worker_id', user.id).eq('job_id', jobId);
    setToast('Removed');
    setTimeout(() => setToast(''), 1500);
  };

  const apply = async (job: SavedJobRow) => {
    if (!user || applied.has(job.id)) return;
    const { error } = await applyToJob(user, job);
    if (error) {
      setToast(`Apply failed: ${error}`);
      setTimeout(() => setToast(''), 2000);
      return;
    }
    setApplied((s) => new Set(s).add(job.id));
    setToast('Applied');
    setTimeout(() => setToast(''), 1500);
  };

  return (
    <div className="sb-page-wrap">
      <div className="sb-page-head">
        <h1>
          <em>{t('page_saved_jobs')}</em>
        </h1>
        <p className="page-sub">{rows.length} {t('page_saved_count_suffix')}</p>
      </div>

      {loading ? (
        <div className="tab-empty">
          <p>Loading…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-saved">
          <div className="big-heart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2>{t('empty_no_saved_title')}</h2>
          <p>{t('empty_no_saved_sub')}</p>
          <Link href="/find-jobs" className="btn-primary-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>{t('btn_find_jobs')}</span>
          </Link>
        </div>
      ) : (
        <div className="job-feed">
          {rows.map((j) => {
            const isApplied = applied.has(j.id);
            return (
              <div key={j.id} className="job-card">
                <div className="job-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.restaurant_cover || PLACEHOLDER_IMG} alt={j.restaurant_name ?? j.title} />
                  <div className="job-card-role">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    {j.role}
                  </div>
                  <button type="button" className="save-btn saved" onClick={() => unsave(j.id)} aria-label="Unsave">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <div className="job-card-info">
                  <div className="job-card-head">
                    <h3 className="job-card-title">{j.restaurant_name ?? j.title}</h3>
                    {j.restaurant_city && (
                      <span className="job-card-rest">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {j.restaurant_city}
                      </span>
                    )}
                  </div>
                  <div className="job-card-salary">{formatSalary(j.salary_min, j.salary_max)}</div>
                  <div className="job-card-bottom">
                    <button
                      type="button"
                      className={`apply-btn${isApplied ? ' applied' : ''}`}
                      onClick={() => apply(j)}
                      disabled={isApplied}
                    >
                      {isApplied ? t('btn_applied') : t('btn_apply')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="sb-toast show">
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        .sb-page-wrap { max-width: 1200px; padding-bottom: 80px; }
        .sb-page-head { margin-bottom: 20px; }
        .sb-page-head h1 { font-family: var(--font-display); font-size: 32px; }
        .sb-page-head h1 em { color: var(--ember); font-style: italic; }
        .page-sub { color: var(--charcoal-light); font-size: 14px; margin-top: 4px; }

        .job-feed { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        @media (max-width: 1100px) { .job-feed { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .job-feed { grid-template-columns: 1fr; } }

        .job-card { background: white; border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); transition: all 0.25s; position: relative; overflow: hidden; }
        .job-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.10); border-color: rgba(220,74,26,0.15); }
        .job-thumb { width: 100%; height: 160px; overflow: hidden; position: relative; }
        .job-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .job-card:hover .job-thumb img { transform: scale(1.05); }
        .job-thumb::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.18), transparent 45%); pointer-events: none; }

        .job-card-role { position: absolute; top: 10px; left: 10px; z-index: 3; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; color: var(--ember); background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
        .job-card-role svg { width: 12px; height: 12px; }

        .save-btn { position: absolute; top: 10px; right: 10px; z-index: 3; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ember); box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: all 0.2s; }
        .save-btn:hover { transform: scale(1.05); }
        .save-btn svg { width: 18px; height: 18px; }

        .job-card-info { padding: 14px 18px 18px; display: flex; flex-direction: column; flex: 1; }
        .job-card-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
        .job-card-title { font-family: var(--font-display); font-size: 22px; color: var(--charcoal); line-height: 1.1; margin: 0; letter-spacing: -0.4px; flex: 0 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .job-card-rest { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--charcoal-light); margin-left: auto; flex-shrink: 0; }
        .job-card-rest svg { width: 13px; height: 13px; color: var(--stone); }
        .job-card-salary { margin: 10px 0 0; font-family: var(--font-display); font-size: 20px; color: var(--charcoal); line-height: 1; font-variant-numeric: tabular-nums; }

        .job-card-bottom { display: flex; margin-top: 12px; }
        .apply-btn { flex: 1; padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 700; background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
        .apply-btn:hover:not(:disabled) { background: #C7421A; }
        .apply-btn:disabled, .apply-btn.applied { background: rgba(16,185,129,0.15); color: #059669; cursor: default; }

        .tab-empty { text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-md); border: 1.5px dashed var(--sand); }
        .tab-empty svg { width: 44px; height: 44px; color: var(--stone); margin-bottom: 10px; }
        .tab-empty h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 6px; }
        .tab-empty p { font-size: 14px; color: var(--charcoal-light); }

        .empty-saved { text-align: center; padding: 72px 24px; background: white; border-radius: 16px; border: 1.5px dashed var(--sand); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 260px); }
        .empty-saved .big-heart { width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; background: var(--ember-glow); display: flex; align-items: center; justify-content: center; }
        .empty-saved .big-heart svg { width: 36px; height: 36px; color: var(--ember); }
        .empty-saved h2 { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); margin-bottom: 8px; }
        .empty-saved p { font-size: 15px; color: var(--charcoal-light); margin-bottom: 24px; line-height: 1.5; max-width: 420px; }
        .empty-saved p strong { color: var(--ember); }
        .btn-primary-lg { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 100px; background: var(--ember); color: white; font-weight: 700; font-size: 15px; text-decoration: none; box-shadow: 0 4px 14px rgba(220,74,26,0.3); transition: all 0.2s; }
        .btn-primary-lg:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,74,26,0.4); }
        .btn-primary-lg svg { width: 18px; height: 18px; }

        .sb-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 12px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; z-index: 400; box-shadow: var(--shadow-lg); }
      `}</style>
    </div>
  );
}
