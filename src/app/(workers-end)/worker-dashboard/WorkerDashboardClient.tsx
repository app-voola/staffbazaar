'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';
import { applyToJob } from '@/lib/worker-apply';

interface JobRow {
  id: string;
  title: string;
  role: string;
  salary_min: number;
  salary_max: number;
  owner_id: string;
  created_at: string;
  restaurant_name: string | null;
  restaurant_city: string | null;
  restaurant_cover: string | null;
}

interface Stats {
  applications: number;
  replies: number;
  profileViews: number;
  shortlisted: number;
  unreadMessages: number;
  profileComplete: number;
}

const EMPTY_STATS: Stats = {
  applications: 0,
  replies: 0,
  profileViews: 0,
  shortlisted: 0,
  unreadMessages: 0,
  profileComplete: 0,
};

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=60';

function formatSalary(min: number, max: number): string {
  if (!min && !max) return '';
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/mo`;
  return `${fmt(min || max)}/mo`;
}

function timeAgo(iso: string, tr: (k: 'time_just_now' | 'time_hours_ago' | 'time_day_ago' | 'time_days_ago') => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return tr('time_just_now');
  if (h < 24) return `${h} ${tr('time_hours_ago')}`;
  const d = Math.floor(h / 24);
  if (d === 1) return tr('time_day_ago');
  if (d < 7) return `${d} ${tr('time_days_ago')}`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function WorkerDashboardClient() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [workingStatus, setWorkingStatus] = useState(false);
  const [greetingKey, setGreetingKey] = useState<'greeting_morning' | 'greeting_afternoon' | 'greeting_evening'>('greeting_morning');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreetingKey(hour < 12 ? 'greeting_morning' : hour < 18 ? 'greeting_afternoon' : 'greeting_evening');
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const [apps, convs, profile, jobsRes, appsJobs] = await Promise.all([
        supabase.from('applicants').select('stage').eq('worker_id', user.id),
        supabase.from('conversations').select('unread').eq('worker_id', user.id),
        supabase.from('worker_profiles').select('*').eq('worker_id', user.id).maybeSingle(),
        supabase
          .from('jobs')
          .select('id, title, role, salary_min, salary_max, owner_id, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('applicants').select('job_id').eq('worker_id', user.id),
      ]);
      if (cancelled) return;

      const stageRows = (apps.data ?? []) as Array<{ stage: string }>;
      const replies = stageRows.filter((r) => r.stage !== 'applied').length;
      const shortlisted = stageRows.filter((r) => r.stage === 'shortlisted' || r.stage === 'called').length;
      const unreadMessages = (convs.data ?? []).reduce(
        (sum: number, c: { unread?: number }) => sum + (c.unread ?? 0),
        0,
      );

      const p = profile.data as Record<string, unknown> | null;
      setWorkingStatus(p?.looking_for_work === false);
      const fields = ['full_name', 'role', 'experience_years', 'city', 'phone', 'bio', 'salary_expected'];
      const filled = p ? fields.filter((f) => {
        const v = p[f];
        return v !== null && v !== undefined && v !== '' && v !== 0;
      }).length : 0;
      const profileComplete = Math.round((filled / fields.length) * 100);

      setStats({
        applications: stageRows.length,
        replies,
        profileViews: 0,
        shortlisted,
        unreadMessages,
        profileComplete,
      });

      const ownerIds = Array.from(new Set((jobsRes.data ?? []).map((j) => j.owner_id)));
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

      setJobs(
        (jobsRes.data ?? []).map((j) => ({
          ...j,
          restaurant_name: restMap[j.owner_id]?.name ?? null,
          restaurant_city: restMap[j.owner_id]?.city ?? null,
          restaurant_cover: restMap[j.owner_id]?.cover_image ?? null,
        })),
      );

      setApplied(new Set((appsJobs.data ?? []).map((r: { job_id: string | null }) => r.job_id).filter((v): v is string => !!v)));
      setLoading(false);
    };

    load();

    const ch = supabase
      .channel(`worker-dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `worker_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_profiles', filter: `worker_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const firstName = useMemo(() => {
    if (user?.full_name && user.full_name !== 'Owner') return user.full_name.split(' ')[0];
    return 'there';
  }, [user?.full_name]);

  const apply = async (job: JobRow) => {
    if (!user || applied.has(job.id)) return;
    await applyToJob(user, job);
    setApplied((s) => new Set(s).add(job.id));
  };

  const switchToLooking = async () => {
    if (!user) return;
    setWorkingStatus(false);
    await supabase
      .from('worker_profiles')
      .upsert(
        { worker_id: user.id, looking_for_work: true, updated_at: new Date().toISOString() },
        { onConflict: 'worker_id' },
      );
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        .welcome-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .welcome-header h1 { font-family: var(--font-display); font-size: 36px; line-height: 1.1; margin: 0; }
        .welcome-header h1 em { color: var(--ember); font-style: italic; }
        .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-action { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 100px; font-size: 14px; font-weight: 700; font-family: var(--font-body); text-decoration: none; cursor: pointer; transition: all 0.2s; border: 1.5px solid transparent; }
        .btn-action svg { width: 16px; height: 16px; }
        .btn-action-primary { background: var(--ember); color: white; box-shadow: 0 2px 8px rgba(220,74,26,0.25); }
        .btn-action-primary:hover { background: #C7421A; transform: translateY(-1px); }
        .btn-action-outline { background: white; color: var(--charcoal); border-color: var(--sand); }
        .btn-action-outline:hover { border-color: var(--charcoal-light); }

        .profile-banner { background: linear-gradient(135deg, var(--ember-glow), rgba(249,115,22,0.08)); border: 1.5px solid rgba(220,74,26,0.15); border-radius: var(--radius-md); padding: 20px 24px; display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .profile-banner-text { flex: 1; }
        .profile-banner-text strong { font-size: 15px; color: var(--charcoal); display: block; margin-bottom: 8px; }
        .profile-banner-text a { font-size: 13px; font-weight: 600; color: var(--ember); text-decoration: none; }
        .profile-banner-text a:hover { text-decoration: underline; }
        .progress-bar { height: 6px; background: var(--sand); border-radius: 100px; overflow: hidden; margin-bottom: 4px; }
        .progress-fill { height: 100%; background: var(--ember); border-radius: 100px; }
        .pct { font-size: 11px; color: var(--stone); }

        .section-block { margin-bottom: 36px; }
        .section-block h2 { font-family: var(--font-display); font-size: 22px; margin-bottom: 16px; color: var(--charcoal); }

        .attention-list { display: flex; flex-direction: column; gap: 10px; }
        .attention-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .attention-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .attention-icon svg { width: 20px; height: 20px; }
        .attention-icon.blue  { background: rgba(59,130,246,0.12);  color: #2563EB; }
        .attention-icon.ember { background: rgba(220,74,26,0.12);   color: var(--ember); }
        .attention-icon.green { background: rgba(16,185,129,0.12);  color: #059669; }
        .attention-body { flex: 1; min-width: 0; }
        .attention-title { font-size: 14px; font-weight: 700; color: var(--charcoal); display: flex; align-items: center; gap: 8px; }
        .attention-count { background: var(--ember); color: white; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 100px; }
        .attention-sub { font-size: 12px; color: var(--charcoal-light); margin-top: 2px; }
        .attention-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 100px; background: var(--ember); color: white; text-decoration: none; font-size: 13px; font-weight: 700; flex-shrink: 0; transition: all 0.2s; }
        .attention-btn svg { width: 14px; height: 14px; }
        .attention-btn:hover { background: #C7421A; }
        .attention-btn.green-btn { background: #059669; }
        .attention-btn.green-btn:hover { background: #047857; }

        .stat-number { font-family: var(--font-display); font-size: 30px; color: var(--charcoal); line-height: 1; margin: 8px 0 4px; }
        .stat-label { font-size: 13px; color: var(--charcoal-light); font-weight: 600; }

        .job-feed { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 900px) { .job-feed { grid-template-columns: 1fr; } }

        .job-card { background: white; border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); transition: all 0.25s; position: relative; overflow: hidden; }
        .job-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.10); border-color: rgba(220,74,26,0.15); }

        .job-thumb { width: 100%; height: 160px; overflow: hidden; position: relative; flex-shrink: 0; }
        .job-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .job-card:hover .job-thumb img { transform: scale(1.05); }
        .job-thumb::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.18), transparent 45%); pointer-events: none; }

        .job-badges-overlay { position: absolute; top: 10px; left: 10px; z-index: 2; display: flex; flex-wrap: wrap; gap: 6px; }
        .job-badge-new { display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 100px; font-size: 10px; font-weight: 800; background: var(--ember); color: white; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 2px 10px rgba(220,74,26,0.35); }
        .job-badge-new svg { width: 11px; height: 11px; }
        .job-badge-time { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 100px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.95); color: var(--charcoal); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

        .job-card-info { padding: 14px 18px 18px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .job-card-role { order: -1; display: inline-flex; align-items: center; gap: 4px; align-self: flex-end; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; color: var(--ember); background: var(--ember-glow); white-space: nowrap; margin-bottom: 4px; }
        .job-card-role svg { width: 12px; height: 12px; color: var(--ember); flex-shrink: 0; }
        .job-card-title { font-weight: 700; font-size: 17px; color: var(--charcoal); line-height: 1.2; margin: 0; letter-spacing: -0.2px; }
        .job-card-rest { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--charcoal-light); margin: 0; }
        .job-card-rest svg { width: 13px; height: 13px; color: var(--stone); flex-shrink: 0; }
        .job-card-salary { font-size: 20px; font-weight: 800; color: var(--charcoal); margin: 10px 0 0; line-height: 1; letter-spacing: -0.3px; font-variant-numeric: tabular-nums; }

        .job-card-bottom { display: flex; align-items: center; margin-top: 12px; }
        .apply-chip { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 13px 18px; border-radius: 12px; font-size: 14px; font-weight: 700; background: linear-gradient(135deg, var(--ember) 0%, #E25B2B 100%); color: white; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 8px rgba(220,74,26,0.25); font-family: var(--font-body); }
        .apply-chip:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,74,26,0.35); }
        .apply-chip svg { width: 14px; height: 14px; }
        .apply-chip.applied, .apply-chip:disabled { background: linear-gradient(135deg, #10B981 0%, #059669 100%); box-shadow: 0 2px 8px rgba(16,185,129,0.25); cursor: default; }
        .apply-chip.applied:hover, .apply-chip:disabled:hover { transform: none; }

        .feed-empty { text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-md); border: 1.5px dashed var(--sand); }
        .feed-empty svg { width: 48px; height: 48px; color: var(--stone); margin-bottom: 12px; }
        .feed-empty h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 6px; }
        .feed-empty p { font-size: 14px; color: var(--charcoal-light); margin-bottom: 16px; }
        .feed-empty a { display: inline-flex; padding: 10px 24px; border-radius: 100px; background: var(--ember); color: white; text-decoration: none; font-size: 14px; font-weight: 700; }
      `}</style>

      {/* Welcome row */}
      <div className="welcome-row">
        <div className="welcome-header">
          <h1>
            <span>{t(greetingKey)}</span> <em>{firstName}</em>
          </h1>
        </div>
        <div className="quick-actions">
          <Link href="/find-jobs" className="btn-action btn-action-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>{t('btn_find_jobs')}</span>
          </Link>
          <Link href="/worker-profile" className="btn-action btn-action-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{t('btn_edit_profile')}</span>
          </Link>
        </div>
      </div>

      {/* Profile completion banner */}
      {stats.profileComplete < 100 && (
        <div className="profile-banner">
          <div className="profile-banner-text">
            <strong>{t('profile_banner_complete')} — {stats.profileComplete}%</strong>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.profileComplete}%` }} />
            </div>
            <span className="pct">{t('profile_banner_reach_100')}</span>
            <br />
            <Link href="/worker-profile">{t('profile_banner_cta')}</Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-light, rgba(59,130,246,0.12))', color: 'var(--blue, #2563EB)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="stat-number">{loading ? '—' : stats.applications}</div>
          <div className="stat-label">{t('stat_applications_sent')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-light, rgba(245,158,11,0.12))', color: 'var(--gold, #B45309)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="stat-number">{loading ? '—' : stats.replies}</div>
          <div className="stat-label">{t('stat_restaurant_replies')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="stat-number">{loading ? '—' : stats.profileViews}</div>
          <div className="stat-label">{t('stat_profile_views')}</div>
        </div>
      </div>

      {/* Needs Your Attention */}
      <div className="section-block">
        <h2>{t('attention_title')}</h2>
        <div className="attention-list">
          {stats.shortlisted > 0 && (
            <div className="attention-card">
              <div className="attention-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="attention-body">
                <div className="attention-title">
                  {stats.shortlisted} {t('attn_shortlisted')}
                  <span className="attention-count">{stats.shortlisted}</span>
                </div>
                <div className="attention-sub">{t('attn_shortlisted_sub')}</div>
              </div>
              <Link href="/my-applications" className="attention-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{t('btn_view')}</span>
              </Link>
            </div>
          )}

          {stats.unreadMessages > 0 && (
            <div className="attention-card">
              <div className="attention-icon ember">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="attention-body">
                <div className="attention-title">
                  {stats.unreadMessages} {t('attn_unread_msgs')}
                  <span className="attention-count">{stats.unreadMessages}</span>
                </div>
                <div className="attention-sub">{t('attn_unread_msgs_sub')}</div>
              </div>
              <Link href="/worker-messages" className="attention-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                <span>{t('btn_reply')}</span>
              </Link>
            </div>
          )}

          {stats.profileComplete < 100 && (
            <div className="attention-card">
              <div className="attention-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="attention-body">
                <div className="attention-title">{t('attn_complete_profile')}</div>
                <div className="attention-sub">{t('attn_complete_profile_sub')}</div>
              </div>
              <Link href="/worker-profile" className="attention-btn green-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{t('btn_complete')}</span>
              </Link>
            </div>
          )}

          {!loading && stats.shortlisted === 0 && stats.unreadMessages === 0 && stats.profileComplete >= 100 && (
            <div className="attention-card">
              <div className="attention-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="attention-body">
                <div className="attention-title">{t('attn_all_caught_up')}</div>
                <div className="attention-sub">{t('attn_all_caught_up_sub')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest Jobs */}
      <div className="section-block">
        {workingStatus ? (
          <div
            className="job-gate"
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              marginTop: 8,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>💼</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
              {t('gate_title')}
            </h3>
            <p style={{ margin: '0 0 24px', color: 'var(--stone)', fontSize: 15 }}>
              {t('gate_body')}
            </p>
            <button
              type="button"
              onClick={switchToLooking}
              style={{
                background: 'var(--ember)',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 100,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {t('gate_btn')}
            </button>
          </div>
        ) : (
          <>
            <h2>{t('latest_jobs_title')}</h2>
            {loading ? (
              <div className="feed-empty">
                <p>Loading…</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="feed-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <h3>{t('empty_no_jobs')}</h3>
                <p>{t('empty_no_jobs_sub')}</p>
                <Link href="/find-jobs">{t('btn_browse_all')}</Link>
              </div>
            ) : (
              <div className="job-feed">
                {jobs.map((j) => {
                  const isApplied = applied.has(j.id);
                  return (
                    <Link key={j.id} href={`/jobs/${j.id}`} className="job-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="job-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={j.restaurant_cover || PLACEHOLDER_IMG} alt={j.restaurant_name ?? j.title} />
                        <div className="job-badges-overlay">
                          {(() => {
                            const hours = (Date.now() - new Date(j.created_at).getTime()) / 3_600_000;
                            if (hours < 24) {
                              return (
                                <span className="job-badge-new">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                  </svg>
                                  <span>{t('badge_new')}</span>
                                </span>
                              );
                            }
                            return null;
                          })()}
                          <span className="job-badge-time">{timeAgo(j.created_at, t)}</span>
                        </div>
                      </div>
                      <div className="job-card-info">
                        <div className="job-card-role">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          {j.role}
                        </div>
                        <div className="job-card-title">{j.restaurant_name ?? j.title}</div>
                        <div className="job-card-rest">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {j.restaurant_city ?? ''}
                        </div>
                        <div className="job-card-salary">
                          {formatSalary(j.salary_min, j.salary_max)}
                        </div>
                        <div className="job-card-bottom">
                          <button
                            type="button"
                            className={`apply-chip${isApplied ? ' applied' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); apply(j); }}
                            disabled={isApplied}
                          >
                            {isApplied ? (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('btn_applied')}
                              </>
                            ) : (
                              t('btn_apply')
                            )}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
