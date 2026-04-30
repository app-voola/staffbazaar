'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';
import { applyToJob } from '@/lib/worker-apply';

interface Job {
  id: string;
  title: string;
  role: string;
  salary_min: number;
  salary_max: number;
  shift: string | null;
  job_type: string | null;
  tips: boolean | null;
  description: string | null;
  custom_details: string | null;
  owner_id: string;
  created_at: string;
}

interface Restaurant {
  owner_id: string;
  name: string;
  city: string | null;
  address: string | null;
  description: string | null;
  cover_image: string | null;
  photos: string[] | null;
  cuisines: string[] | null;
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=70';

function formatSalary(min: number, max: number): string {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (!min && !max) return '';
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

export function JobDetailClient({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data: j } = await supabase
        .from('jobs')
        .select('id, title, role, salary_min, salary_max, shift, job_type, tips, description, custom_details, owner_id, created_at')
        .eq('id', jobId)
        .maybeSingle();
      if (cancelled) return;

      if (!j) {
        setJob(null);
        setLoading(false);
        return;
      }
      setJob(j as Job);

      const [{ data: r }, appsRes, savedRes] = await Promise.all([
        supabase
          .from('restaurants')
          .select('owner_id, name, city, address, description, cover_image, photos, cuisines')
          .eq('owner_id', j.owner_id)
          .maybeSingle(),
        supabase.from('applicants').select('id').eq('worker_id', user.id).eq('job_id', jobId).maybeSingle(),
        supabase.from('saved_jobs').select('job_id').eq('worker_id', user.id).eq('job_id', jobId).maybeSingle(),
      ]);
      if (cancelled) return;

      setRestaurant((r as Restaurant | null) ?? null);
      setApplied(!!appsRes.data);
      setSaved(!!savedRes.data);
      setLoading(false);
    };

    load();

    const ch = supabase
      .channel(`job-detail-${jobId}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_jobs', filter: `worker_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [jobId, user?.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const toggleSave = async () => {
    if (!user || !job) return;
    if (saved) {
      await supabase.from('saved_jobs').delete().eq('worker_id', user.id).eq('job_id', job.id);
      setSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({ worker_id: user.id, job_id: job.id });
      setSaved(true);
    }
  };

  const submitApplication = async () => {
    if (!user || !job || applied) return;
    setSubmitting(true);
    const { error } = await applyToJob(user, {
      id: job.id,
      role: job.role,
      owner_id: job.owner_id,
      title: job.title,
      restaurant_name: restaurant?.name ?? null,
      restaurant_cover: restaurant?.cover_image ?? null,
    });
    if (error) {
      setSubmitting(false);
      showToast(`Apply failed: ${error}`);
      return;
    }

    if (message.trim()) {
      const convId = `conv-${user.id}-${job.owner_id}`;
      await supabase.from('messages').insert({
        id: `${convId}-${Date.now()}`,
        conversation_id: convId,
        from_me: false,
        text: message.trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      });
    }

    setApplied(true);
    setSubmitting(false);
    setModalOpen(false);
    setMessage('');
    showToast(t('applied_prefix'));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--charcoal-light)' }}>
        {t('jd_loading')}
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', textAlign: 'center', padding: 40, background: 'white', borderRadius: 16, border: '1.5px dashed var(--sand)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>{t('jd_not_found')}</h2>
        <p style={{ color: 'var(--charcoal-light)', marginBottom: 20 }}>{t('jd_not_found_sub')}</p>
        <Link href="/find-jobs" style={{ padding: '10px 22px', borderRadius: 100, background: 'var(--ember)', color: 'white', textDecoration: 'none', fontWeight: 700 }}>
          {t('btn_find_jobs')}
        </Link>
      </div>
    );
  }

  const coverSrc = restaurant?.cover_image || PLACEHOLDER_IMG;
  const requirements: string[] = [];
  if (job.shift) requirements.push(job.shift);
  if (job.job_type) requirements.push(job.job_type);
  if (job.tips) requirements.push('Tips available');
  (restaurant?.cuisines ?? []).slice(0, 4).forEach((c) => requirements.push(c));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div className="job-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc} alt={restaurant?.name ?? job.title} />
        <div className="job-hero-overlay" />
        <button type="button" className="back-btn" onClick={() => router.back()} aria-label={t('jd_back')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <button
          type="button"
          className={`save-job-btn${saved ? ' saved' : ''}`}
          onClick={toggleSave}
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <div className="job-hero-content">
          <div className="rest-name">{restaurant?.name ?? job.title}</div>
        </div>
      </div>

      <div className="job-two-col">
        {/* LEFT */}
        <div>
          <h1 className="job-title">{job.title}</h1>
          {(restaurant?.address || restaurant?.city) && (
            <div className="job-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {[restaurant?.address, restaurant?.city].filter(Boolean).join(', ')}
            </div>
          )}

          <div className="salary-box">
            <div className="salary-label">{t('jd_salary')}</div>
            <div className="salary-amount">{formatSalary(job.salary_min, job.salary_max)}</div>
            <div className="salary-meta">
              <span>{t('jd_per_month')}</span>
            </div>
          </div>

          {requirements.length > 0 && (
            <div className="info-section">
              <div className="info-section-title">{t('jd_requirements')}</div>
              <div className="req-chips">
                {requirements.map((req, i) => (
                  <div key={`${req}-${i}`} className="req-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {req}
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.description && (
            <div className="info-section">
              <div className="info-section-title">{t('jd_description')}</div>
              <p className="job-desc">{job.description}</p>
            </div>
          )}

          {job.custom_details && job.custom_details.trim() && (
            <div className="info-section">
              <div className="info-section-title">Additional Details</div>
              <p className="job-desc">{job.custom_details}</p>
            </div>
          )}

          <button
            type="button"
            className={`apply-btn-main${applied ? ' applied' : ''}`}
            onClick={() => !applied && setModalOpen(true)}
            disabled={applied}
          >
            {applied ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('jd_already_applied')}
              </>
            ) : (
              t('jd_apply_now')
            )}
          </button>
        </div>

        {/* RIGHT: restaurant sidebar */}
        <div>
          {restaurant && (
            <div className="about-restaurant">
              <h4>
                {t('jd_about')} {restaurant.name}
              </h4>
              {restaurant.description && <p>{restaurant.description}</p>}
              {(restaurant.photos ?? []).length > 0 && (
                <div className="rest-photos">
                  {(restaurant.photos ?? []).slice(0, 3).map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p} alt="Restaurant" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {modalOpen && (
        <div
          className="modal-overlay-jd active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal-content-jd">
            <button
              type="button"
              className="modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title">
              {t('jd_apply_modal_title')} {restaurant?.name ?? job.title}
            </h3>
            <p className="modal-subtitle">
              {job.role} · {formatSalary(job.salary_min, job.salary_max)} {t('jd_per_month')}
            </p>
            <div className="modal-body">
              <label>{t('jd_add_message')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('jd_message_placeholder')}
                rows={4}
              />
            </div>
            <p className="modal-note">{t('jd_shared_note')}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-next"
                onClick={submitApplication}
                disabled={submitting}
              >
                {submitting ? '…' : t('jd_submit_application')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sb-toast"><span>{toast}</span></div>}

      <style>{`
        .job-hero { position: relative; height: 300px; overflow: hidden; border-radius: var(--radius-lg); margin-bottom: 28px; }
        .job-hero img { width: 100%; height: 100%; object-fit: cover; }
        .job-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(28,25,23,0.85) 0%, rgba(28,25,23,0.2) 60%, transparent 100%); }
        .back-btn { position: absolute; top: 16px; left: 16px; z-index: 10; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
        .back-btn svg { width: 18px; height: 18px; }
        .save-job-btn { position: absolute; top: 16px; right: 16px; z-index: 10; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); color: var(--charcoal-mid); }
        .save-job-btn.saved { color: var(--ember); }
        .save-job-btn svg { width: 18px; height: 18px; }
        .job-hero-content { position: absolute; bottom: 24px; left: 28px; right: 28px; z-index: 2; }
        .job-hero-content .rest-name { font-family: var(--font-display); font-size: 24px; color: white; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

        .job-two-col { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        @media (max-width: 900px) { .job-two-col { grid-template-columns: 1fr; } }

        .job-title { font-family: var(--font-display); font-size: 32px; color: var(--charcoal); line-height: 1.2; margin-bottom: 6px; }
        .job-location { font-size: 14px; color: var(--charcoal-light); display: flex; align-items: center; gap: 5px; margin-bottom: 20px; }
        .job-location svg { width: 14px; height: 14px; color: var(--stone); }

        .salary-box { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); padding: 18px 22px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 6px; }
        .salary-box .salary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--stone); }
        .salary-box .salary-amount { font-family: var(--font-display); font-size: 34px; color: var(--charcoal); line-height: 1; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
        .salary-box .salary-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--charcoal-light); }

        .info-section { margin-bottom: 24px; }
        .info-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--stone); margin-bottom: 12px; }
        .req-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .req-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: white; border: 1px solid var(--sand); border-radius: 100px; font-size: 13px; font-weight: 600; color: var(--charcoal-mid); transition: border-color 0.2s; }
        .req-chip:hover { border-color: var(--charcoal-light); }
        .req-chip svg { width: 14px; height: 14px; color: var(--ember); flex-shrink: 0; }
        .job-desc { font-size: 14px; color: var(--charcoal-light); line-height: 1.7; white-space: pre-wrap; }

        .apply-btn-main { width: 100%; padding: 14px 18px; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: linear-gradient(135deg, var(--ember) 0%, #E25B2B 100%); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(220,74,26,0.25); letter-spacing: 0.2px; margin-bottom: 24px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .apply-btn-main:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,74,26,0.35); }
        .apply-btn-main.applied, .apply-btn-main:disabled { background: linear-gradient(135deg, #10B981 0%, #059669 100%); cursor: default; box-shadow: 0 2px 8px rgba(16,185,129,0.25); }
        .apply-btn-main svg { width: 14px; height: 14px; }

        .about-restaurant { background: white; border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .about-restaurant h4 { font-family: var(--font-display); font-size: 22px; color: var(--charcoal); margin-bottom: 8px; }
        .about-restaurant p { font-size: 13px; color: var(--charcoal-light); line-height: 1.6; margin-bottom: 12px; }
        .rest-photos { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .rest-photos img { width: 100%; height: 80px; object-fit: cover; border-radius: var(--radius-sm); }

        .modal-overlay-jd { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
        .modal-content-jd { background: white; border-radius: 16px; width: 100%; max-width: 480px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); position: relative; }
        .modal-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; color: var(--stone); display: flex; align-items: center; justify-content: center; }
        .modal-close svg { width: 16px; height: 16px; }
        .modal-title { font-family: var(--font-display); font-size: 22px; color: var(--charcoal); margin-bottom: 4px; padding-right: 32px; }
        .modal-subtitle { font-size: 13px; color: var(--charcoal-light); margin-bottom: 18px; }
        .modal-body label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal-mid); margin-bottom: 6px; }
        .modal-body textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 14px; font-family: var(--font-body); color: var(--charcoal); box-sizing: border-box; resize: vertical; min-height: 100px; }
        .modal-body textarea:focus { outline: none; border-color: var(--ember); }
        .modal-note { font-size: 12px; color: var(--stone); margin-top: 12px; }
        .modal-actions { display: flex; margin-top: 18px; }
        .btn-next { flex: 1; padding: 14px 20px; border-radius: var(--radius-md); background: var(--ember); color: white; border: none; font-weight: 700; font-family: var(--font-body); font-size: 15px; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; }
        .btn-next:disabled { opacity: 0.6; cursor: default; }

        .sb-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 12px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; z-index: 400; box-shadow: var(--shadow-lg); }
      `}</style>
    </div>
  );
}
