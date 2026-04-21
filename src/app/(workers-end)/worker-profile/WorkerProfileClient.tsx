'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';
import type { TranslationKey } from '@/lib/worker-translations';

type Tab = 'profile' | 'aadhaar' | 'work' | 'cities' | 'notifications';
type AadhaarStatus = 'none' | 'uploaded' | 'verified';

interface WorkExp {
  id: string;
  job_title: string;
  restaurant: string;
  from_year: number | null;
  to_year: number | null;
  still_here: boolean;
}

interface FormState {
  full_name: string;
  role: string;
  salary_expected: number;
  skills: string[];
  cities: string[];
  phone: string;
  email: string;
  bio: string;
  avatar_url: string;
  looking_for_work: boolean;
  aadhaar_status: AadhaarStatus;
  notify_job_matches: boolean;
  notify_whatsapp: boolean;
  notify_application_updates: boolean;
}

const EMPTY: FormState = {
  full_name: '',
  role: 'Cooks & Chefs',
  salary_expected: 30000,
  skills: [],
  cities: [],
  phone: '',
  email: '',
  bio: '',
  avatar_url: '',
  looking_for_work: true,
  aadhaar_status: 'none',
  notify_job_matches: true,
  notify_whatsapp: true,
  notify_application_updates: true,
};

const PHOTO_BUCKET = 'restaurant-photos';

const ROLES = ['Cooks & Chefs', 'Bartender', 'Waiter / Steward', 'Kitchen Helper', 'Cleaning Staff', 'Manager'];

const CUISINES = [
  'North Indian',
  'South Indian',
  'Tandoor',
  'Mughlai',
  'Chinese',
  'Continental',
  'Italian',
  'Biryani',
  'Street Food',
  'Bakery',
  'Desserts',
];

const CITIES = [
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Goa',
  'Jaipur',
  'Ahmedabad',
  'Lucknow',
  'Chandigarh',
];

const TABS: { key: Tab; labelKey: TranslationKey; icon: React.ReactElement }[] = [
  {
    key: 'profile',
    labelKey: 'tab_profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'aadhaar',
    labelKey: 'tab_aadhaar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: 'work',
    labelKey: 'tab_work',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    key: 'cities',
    labelKey: 'tab_cities',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: 'notifications',
    labelKey: 'tab_notifs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const currentYear = new Date().getFullYear();
const YEARS: number[] = Array.from({ length: 26 }, (_, i) => currentYear - i);

export function WorkerProfileClient() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [tab, setTab] = useState<Tab>('profile');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState<FormState>(EMPTY);
  const [experience, setExperience] = useState<WorkExp[]>([]);
  const [savedExp, setSavedExp] = useState<WorkExp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [aadhaarModalOpen, setAadhaarModalOpen] = useState(false);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarError, setAadhaarError] = useState('');
  const [aadhaarSubmitting, setAadhaarSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarCameraRef = useRef<HTMLInputElement>(null);
  const aadhaarGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadAll = async () => {
      const [{ data: p }, { data: exps }] = await Promise.all([
        supabase.from('worker_profiles').select('*').eq('worker_id', user.id).maybeSingle(),
        supabase
          .from('work_experience')
          .select('id, job_title, restaurant, from_year, to_year, still_here')
          .eq('worker_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;

      const hydrated: FormState = {
        full_name: (p?.full_name as string | null) ?? '',
        role: (p?.role as string | null) ?? 'Cooks & Chefs',
        salary_expected: (p?.salary_expected as number | null) ?? 30000,
        skills: (p?.skills as string[] | null) ?? [],
        cities: (p?.cities as string[] | null) ?? [],
        phone: (p?.phone as string | null) ?? '',
        email: (p?.email as string | null) ?? '',
        bio: (p?.bio as string | null) ?? '',
        avatar_url: (p?.avatar_url as string | null) ?? '',
        looking_for_work: p?.looking_for_work !== false,
        aadhaar_status: ((p?.aadhaar_status as AadhaarStatus | null) ?? 'none'),
        notify_job_matches: p?.notify_job_matches !== false,
        notify_whatsapp: p?.notify_whatsapp !== false,
        notify_application_updates: p?.notify_application_updates !== false,
      };
      setForm(hydrated);
      setSaved(hydrated);

      const expList: WorkExp[] = (exps ?? []).map((e) => ({
        id: e.id,
        job_title: e.job_title ?? '',
        restaurant: e.restaurant ?? '',
        from_year: e.from_year,
        to_year: e.to_year,
        still_here: e.still_here,
      }));
      if (expList.length === 0) {
        const blank: WorkExp = {
          id: `new-${Date.now()}`,
          job_title: '',
          restaurant: '',
          from_year: null,
          to_year: null,
          still_here: false,
        };
        setExperience([blank]);
        setSavedExp([]);
      } else {
        setExperience(expList);
        setSavedExp(expList);
      }
      setLoading(false);
    };

    loadAll();

    const ch = supabase
      .channel(`worker-profile-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_profiles', filter: `worker_id=eq.${user.id}` }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_experience', filter: `worker_id=eq.${user.id}` }, () => loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const toggleSkill = (s: string) =>
    update({ skills: form.skills.includes(s) ? form.skills.filter((x) => x !== s) : [...form.skills, s] });

  const toggleCity = (c: string) =>
    update({ cities: form.cities.includes(c) ? form.cities.filter((x) => x !== c) : [...form.cities, c] });

  const toggleAllCities = () => {
    const allSelected = CITIES.every((c) => form.cities.includes(c));
    update({ cities: allSelected ? [] : [...CITIES] });
  };

  const completion = useMemo(() => {
    const checks = [
      !!form.full_name.trim(),
      form.aadhaar_status !== 'none',
      experience.some((e) => e.job_title.trim()),
      form.cities.length > 0,
      /chef|cook/i.test(form.role) ? form.skills.length > 0 : true,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, experience]);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!form.full_name.trim()) m.push(t('missing_name'));
    if (form.aadhaar_status === 'none') m.push(t('missing_aadhaar'));
    if (!experience.some((e) => e.job_title.trim())) m.push(t('missing_experience'));
    if (form.cities.length === 0) m.push(t('missing_cities'));
    if (/chef|cook/i.test(form.role) && form.skills.length === 0) m.push(t('missing_cuisines'));
    return m;
  }, [form, experience, t]);

  const dirty =
    JSON.stringify(form) !== JSON.stringify(saved) ||
    JSON.stringify(experience) !== JSON.stringify(savedExp);

  const addExperience = () => {
    setExperience((list) => [
      ...list,
      {
        id: `new-${Date.now()}`,
        job_title: '',
        restaurant: '',
        from_year: null,
        to_year: null,
        still_here: false,
      },
    ]);
  };

  const removeExperience = (id: string) => {
    if (experience.length <= 1) {
      setToast('Keep at least one entry. Edit it instead.');
      setTimeout(() => setToast(''), 1800);
      return;
    }
    setExperience((list) => list.filter((e) => e.id !== id));
  };

  const updateExp = (id: string, patch: Partial<WorkExp>) => {
    setExperience((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const profileRow = {
      worker_id: user.id,
      full_name: form.full_name,
      role: form.role,
      salary_expected: form.salary_expected,
      skills: form.skills,
      cities: form.cities,
      phone: form.phone,
      email: form.email,
      bio: form.bio,
      avatar_url: form.avatar_url || null,
      looking_for_work: form.looking_for_work,
      aadhaar_status: form.aadhaar_status,
      notify_job_matches: form.notify_job_matches,
      notify_whatsapp: form.notify_whatsapp,
      notify_application_updates: form.notify_application_updates,
      updated_at: new Date().toISOString(),
    };
    const { error: pErr } = await supabase.from('worker_profiles').upsert(profileRow, { onConflict: 'worker_id' });
    if (pErr) {
      setBusy(false);
      setToast(`Save failed: ${pErr.message}`);
      setTimeout(() => setToast(''), 2500);
      return;
    }

    // Save experience: delete old, insert current
    await supabase.from('work_experience').delete().eq('worker_id', user.id);
    const rows = experience
      .filter((e) => e.job_title.trim())
      .map((e) => ({
        worker_id: user.id,
        job_title: e.job_title,
        restaurant: e.restaurant,
        from_year: e.from_year,
        to_year: e.still_here ? null : e.to_year,
        still_here: e.still_here,
      }));
    if (rows.length > 0) {
      await supabase.from('work_experience').insert(rows);
    }

    setSaved(form);
    setSavedExp(experience);
    setBusy(false);
    setToast('Profile saved');
    setTimeout(() => setToast(''), 1500);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `workers/${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) {
      setToast(`Upload failed: ${upErr.message}`);
      setTimeout(() => setToast(''), 2500);
      return;
    }
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    const url = data.publicUrl;
    await supabase.from('worker_profiles').upsert(
      { worker_id: user.id, avatar_url: url, updated_at: new Date().toISOString() },
      { onConflict: 'worker_id' },
    );
    setForm((f) => ({ ...f, avatar_url: url }));
    setSaved((s) => ({ ...s, avatar_url: url }));
    setToast('Photo updated');
    setTimeout(() => setToast(''), 1500);
  };

  const openAadhaarModal = () => {
    setAadhaarModalOpen(true);
    setAadhaarFile(null);
    setAadhaarPreview(null);
    setAadhaarError('');
  };

  const handleAadhaarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAadhaarError('Please pick an image file.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setAadhaarError('Image too large. Please use a photo under 6 MB.');
      return;
    }
    setAadhaarError('');
    setAadhaarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAadhaarPreview((ev.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  };

  const submitAadhaar = async () => {
    if (!user || !aadhaarFile) return;
    setAadhaarSubmitting(true);
    const ext = aadhaarFile.name.split('.').pop() || 'jpg';
    const path = `workers/${user.id}/aadhaar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, aadhaarFile, { cacheControl: '3600', upsert: false });
    if (upErr) {
      setAadhaarSubmitting(false);
      setAadhaarError(`Upload failed: ${upErr.message}`);
      return;
    }
    const { data: urlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    const imageUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase.from('worker_profiles').upsert(
      {
        worker_id: user.id,
        aadhaar_status: 'uploaded',
        aadhaar_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'worker_id' },
    );
    setAadhaarSubmitting(false);
    if (dbErr) {
      setAadhaarError(`Save failed: ${dbErr.message}`);
      return;
    }
    update({ aadhaar_status: 'uploaded' });
    setSaved((s) => ({ ...s, aadhaar_status: 'uploaded' }));
    setAadhaarModalOpen(false);
    setToast('Aadhaar photo uploaded. We will review it soon.');
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) {
    return <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 16 }}>Loading…</h1>;
  }

  const isChef = /chef|cook/i.test(form.role);
  const aadhaarBadge: { label: string; cls: string } =
    form.aadhaar_status === 'verified'
      ? { label: t('aadhaar_verified'), cls: 'ok' }
      : form.aadhaar_status === 'uploaded'
        ? { label: t('aadhaar_uploaded_review'), cls: 'warn' }
        : { label: t('aadhaar_not_uploaded'), cls: 'warn' };

  return (
    <div className="sb-page-wrap">
      <div className="sb-page-head">
        <div className="sb-page-head-row">
          <h1>
            <em>{t('page_profile')}</em>
          </h1>
        </div>
      </div>

      {/* Completion banner */}
      <div className={`profile-banner${completion === 100 ? ' complete' : ''}`}>
        <div className="profile-banner-text">
          <strong>
            <span>{t('profile_banner_complete')}</span> — <span>{completion}%</span>
          </strong>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <span className="pct">
            {missing.length ? `${t('banner_add')} ${missing.join(', ')} ${t('banner_to_reach')}` : t('banner_all_set')}
          </span>
        </div>
      </div>

      <div className="ep-layout">
        {/* Side nav */}
        <nav className="ep-nav">
          {TABS.map((tab_) => (
            <button
              key={tab_.key}
              type="button"
              className={`ep-nav-item${tab === tab_.key ? ' active' : ''}`}
              onClick={() => setTab(tab_.key)}
            >
              {tab_.icon}
              {t(tab_.labelKey)}
              {tab_.key === 'aadhaar' && (
                <span className={`ep-nav-badge ${aadhaarBadge.cls}`}>{aadhaarBadge.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="ep-panels">
          {/* Profile */}
          {tab === 'profile' && (
            <section className="ep-panel">
              <div className="ep-panel-head">
                <h2>{t('tab_profile')}</h2>
                <p>{t('profile_sub')}</p>
              </div>

              <div className="profile-photo-section">
                <div className="profile-photo-wrap">
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar_url} alt="Profile" />
                  ) : (
                    <div className="profile-photo-placeholder">
                      {(form.full_name || user?.full_name || 'W')[0].toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    className="photo-edit-btn"
                    onClick={() => photoInputRef.current?.click()}
                    aria-label="Change photo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className="photo-label"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {t('change_photo')}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </div>

              <div className="field">
                <label>{t('field_full_name')}</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => update({ full_name: e.target.value })}
                  placeholder={t('placeholder_full_name')}
                />
              </div>
              <div className="field">
                <label>{t('field_phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+91"
                />
              </div>
              <div className="field">
                <label>{t('field_email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label>{t('field_about_you')}</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  placeholder={t('placeholder_bio')}
                />
              </div>

              <div className="section-title">{t('field_role')}</div>
              <button
                type="button"
                className="current-role"
                onClick={() => setRolePickerOpen((v) => !v)}
              >
                <span className="role-icon">👨‍🍳</span>
                <span className="role-label">{form.role}</span>
                <span className="role-change">{rolePickerOpen ? 'Close' : 'Change'}</span>
              </button>
              {rolePickerOpen && (
                <div className="role-grid">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-option${form.role === r ? ' selected' : ''}`}
                      onClick={() => {
                        update({ role: r });
                        setRolePickerOpen(false);
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Aadhaar */}
          {tab === 'aadhaar' && (
            <section className="ep-panel">
              <div className="ep-panel-head">
                <h2>{t('aadhaar_title')}</h2>
                <p>{t('aadhaar_sub')}</p>
              </div>

              <div className="sb-verify-card">
                <div className="verify-row">
                  <div className={`vr-ic ${form.aadhaar_status === 'verified' ? 'yes' : 'no'}`}>
                    {form.aadhaar_status === 'verified' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : form.aadhaar_status === 'uploaded' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                  <div className="vr-body">
                    <div className="vr-label">
                      Aadhaar{' '}
                      <small>
                        {form.aadhaar_status === 'verified'
                          ? t('aadhaar_approved')
                          : form.aadhaar_status === 'uploaded'
                            ? t('aadhaar_uploaded_review')
                            : t('aadhaar_not_uploaded')}
                      </small>
                    </div>
                  </div>
                  {form.aadhaar_status === 'verified' ? (
                    <div className="vr-status">{t('aadhaar_verified')}</div>
                  ) : (
                    <button type="button" className="vr-action" onClick={openAadhaarModal}>
                      {form.aadhaar_status === 'uploaded' ? t('aadhaar_reupload') : t('aadhaar_upload_now')}
                    </button>
                  )}
                </div>
              </div>

              <ul className="aadhaar-benefits">
                <li>
                  <div className="ab-ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div>
                    <strong>{t('benefit1_title')}</strong>
                    <small>{t('benefit1_sub')}</small>
                  </div>
                </li>
                <li>
                  <div className="ab-ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <strong>{t('benefit2_title')}</strong>
                    <small>{t('benefit2_sub')}</small>
                  </div>
                </li>
                <li>
                  <div className="ab-ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 14" />
                    </svg>
                  </div>
                  <div>
                    <strong>{t('benefit3_title')}</strong>
                    <small>{t('benefit3_sub')}</small>
                  </div>
                </li>
              </ul>
            </section>
          )}

          {/* Work & Experience */}
          {tab === 'work' && (
            <section className="ep-panel">
              <div className="ep-panel-head">
                <h2>{t('tab_work')}</h2>
                <p>{t('work_sub')}</p>
              </div>

              <div className="work-top-grid" style={{ gridTemplateColumns: isChef ? '1fr 1.4fr' : '1fr' }}>
                <div>
                  <div className="section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                    {t('salary_expectation')}
                  </div>
                  <div className="salary-display">
                    <div className="amount">
                      ₹{form.salary_expected.toLocaleString('en-IN')} <small>{t('per_month')}</small>
                    </div>
                  </div>
                  <input
                    type="range"
                    className="salary-range"
                    min={8000}
                    max={80000}
                    step={1000}
                    value={form.salary_expected}
                    onChange={(e) => update({ salary_expected: parseInt(e.target.value, 10) })}
                  />
                  <div className="salary-labels">
                    <span>₹8,000</span>
                    <span>₹80,000</span>
                  </div>
                </div>
                {isChef && (
                  <div>
                    <div className="section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                      {t('cuisines_title')}
                    </div>
                    <div className="chip-selector">
                      {CUISINES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`chip-option${form.skills.includes(c) ? ' selected' : ''}`}
                          onClick={() => toggleSkill(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="section-title">{t('experience')}</div>
              {experience.map((e) => (
                <div key={e.id} className="exp-entry">
                  <button
                    type="button"
                    className="exp-remove-btn"
                    onClick={() => removeExperience(e.id)}
                    aria-label="Remove"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div className="field">
                    <label>{t('field_job_title')}</label>
                    <input
                      type="text"
                      value={e.job_title}
                      onChange={(ev) => updateExp(e.id, { job_title: ev.target.value })}
                      placeholder="e.g. Tandoor Chef"
                    />
                  </div>
                  <div className="exp-row">
                    <div className="field">
                      <label>{t('field_restaurant')}</label>
                      <input
                        type="text"
                        value={e.restaurant}
                        onChange={(ev) => updateExp(e.id, { restaurant: ev.target.value })}
                        placeholder="Restaurant name, City"
                      />
                    </div>
                    <div className="field">
                      <label>{t('field_duration')}</label>
                      <div className="duration-cluster">
                        <div className="duration-row">
                          <select
                            value={e.from_year ?? ''}
                            onChange={(ev) => updateExp(e.id, { from_year: ev.target.value ? parseInt(ev.target.value, 10) : null })}
                          >
                            <option value="">{t('from_year')}</option>
                            {YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                          <select
                            value={e.still_here ? '' : e.to_year ?? ''}
                            disabled={e.still_here}
                            onChange={(ev) => updateExp(e.id, { to_year: ev.target.value ? parseInt(ev.target.value, 10) : null })}
                          >
                            <option value="">{t('to_year')}</option>
                            {YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="still-here-row">
                          <input
                            type="checkbox"
                            checked={e.still_here}
                            onChange={(ev) => updateExp(e.id, { still_here: ev.target.checked })}
                          />
                          <span className={`sb-check-visual${e.still_here ? ' checked' : ''}`} aria-hidden="true" />
                          <span>{t('still_here')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="add-exp-btn" onClick={addExperience}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('add_experience')}
              </button>
            </section>
          )}

          {/* Cities */}
          {tab === 'cities' && (
            <section className="ep-panel">
              <div className="ep-panel-head">
                <h2>{t('tab_cities')}</h2>
                <p>{t('cities_sub')}</p>
              </div>
              <div className="chip-selector">
                <button
                  type="button"
                  className={`chip-option${CITIES.every((c) => form.cities.includes(c)) ? ' selected' : ''}`}
                  onClick={toggleAllCities}
                >
                  {t('all_cities')}
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip-option${form.cities.includes(c) ? ' selected' : ''}`}
                    onClick={() => toggleCity(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <section className="ep-panel">
              <div className="ep-panel-head">
                <h2>{t('tab_notifs')}</h2>
                <p>{t('notifs_sub')}</p>
              </div>
              <div className="toggle-row">
                <div className="toggle-label">
                  {t('notif_job_match')}
                  <small>{t('notif_job_match_sub')}</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.notify_job_matches}
                    onChange={(e) => update({ notify_job_matches: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-label">
                  {t('notif_whatsapp')}
                  <small>{t('notif_whatsapp_sub')}</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.notify_whatsapp}
                    onChange={(e) => update({ notify_whatsapp: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-label">
                  {t('notif_app_updates')}
                  <small>{t('notif_app_updates_sub')}</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.notify_application_updates}
                    onChange={(e) => update({ notify_application_updates: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-label">
                  {t('open_to_work')}
                  <small>{t('open_to_work_sub')}</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.looking_for_work}
                    onChange={(e) => update({ looking_for_work: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </section>
          )}

          <div className="ep-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setForm(saved);
                setExperience(savedExp.length ? savedExp : experience);
              }}
              disabled={!dirty || busy}
            >
              {t('btn_cancel')}
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={save}
              disabled={!dirty || busy}
            >
              {busy ? '…' : t('btn_save_changes')}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="sb-toast">
          <span>{toast}</span>
        </div>
      )}

      {aadhaarModalOpen && (
        <div
          className="aadhaar-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget && !aadhaarSubmitting) setAadhaarModalOpen(false);
          }}
        >
          <div className="aadhaar-modal" role="dialog" aria-modal="true">
            <h3>Upload your Aadhaar card photo</h3>
            <p>
              Take a clear photo of the front of your Aadhaar card, or pick one from your phone.
              Our team will check it for you.
            </p>

            {!aadhaarPreview ? (
              <div className="aadhaar-upload-pickers">
                <button
                  type="button"
                  className="aadhaar-pick-btn"
                  onClick={() => aadhaarCameraRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Take Photo
                  <small>Use camera</small>
                </button>
                <button
                  type="button"
                  className="aadhaar-pick-btn"
                  onClick={() => aadhaarGalleryRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  From Gallery
                  <small>Pick a photo</small>
                </button>
                <input
                  ref={aadhaarCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAadhaarPick}
                  hidden
                />
                <input
                  ref={aadhaarGalleryRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAadhaarPick}
                  hidden
                />
              </div>
            ) : (
              <div className="aadhaar-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={aadhaarPreview} alt="Aadhaar preview" />
                <button
                  type="button"
                  className="retake-link"
                  onClick={() => {
                    setAadhaarFile(null);
                    setAadhaarPreview(null);
                    setAadhaarError('');
                  }}
                >
                  Retake / Choose another
                </button>
              </div>
            )}

            {aadhaarError && <div className="err-line">{aadhaarError}</div>}

            <div className="aadhaar-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setAadhaarModalOpen(false)}
                disabled={aadhaarSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={submitAadhaar}
                disabled={!aadhaarFile || aadhaarSubmitting}
              >
                {aadhaarSubmitting ? 'Uploading…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sb-page-wrap { max-width: 1100px; padding-bottom: 80px; }
        .sb-page-head { margin-bottom: 16px; }
        .sb-page-head-row { display: flex; justify-content: space-between; align-items: center; }
        .sb-page-head h1 { font-family: var(--font-display); font-size: 32px; }
        .sb-page-head h1 em { color: var(--ember); font-style: italic; }

        .profile-banner { background: linear-gradient(135deg, var(--ember-glow), rgba(249,115,22,0.08)); border: 1.5px solid rgba(220,74,26,0.15); border-radius: var(--radius-md); padding: 18px 22px; display: flex; align-items: center; gap: 18px; margin-bottom: 20px; }
        .profile-banner-text { flex: 1; }
        .profile-banner-text strong { font-size: 15px; color: var(--charcoal); display: block; margin-bottom: 8px; }
        .progress-bar { height: 6px; background: var(--sand); border-radius: 100px; overflow: hidden; margin-bottom: 4px; }
        .progress-fill { height: 100%; background: var(--ember); border-radius: 100px; transition: width 0.4s ease, background 0.3s ease; }
        .pct { font-size: 12px; color: var(--charcoal-light); }
        .profile-banner.complete { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(22,163,74,0.08)); border-color: rgba(22,163,74,0.3); }
        .profile-banner.complete .progress-fill { background: #059669; }
        .profile-banner.complete .pct { color: #047857; font-weight: 600; }

        .ep-layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 768px) { .ep-layout { grid-template-columns: 1fr; gap: 12px; } }

        .ep-nav { display: flex; flex-direction: column; gap: 4px; position: sticky; top: 20px; background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); padding: 10px; }
        @media (max-width: 768px) { .ep-nav { flex-direction: row; position: static; overflow-x: auto; padding: 6px; } .ep-nav::-webkit-scrollbar { display: none; } }
        .ep-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-radius: 10px; background: transparent; border: none; cursor: pointer; font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--charcoal-mid); text-align: left; width: 100%; transition: all 0.15s; white-space: nowrap; }
        .ep-nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
        .ep-nav-item:hover { background: var(--cream); color: var(--charcoal); }
        .ep-nav-item.active { background: var(--ember-glow); color: var(--ember); }
        .ep-nav-badge { margin-left: auto; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.4px; }
        .ep-nav-badge.ok { background: rgba(16,185,129,0.14); color: #047857; }
        .ep-nav-badge.warn { background: #FEF3C7; color: #92400E; }
        @media (max-width: 768px) { .ep-nav-badge { display: none; } }

        .ep-panel { background: white; border: 1.5px solid var(--sand); border-radius: 16px; padding: 24px; }
        .ep-panel-head { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--sand); }
        .ep-panel-head h2 { font-family: var(--font-display); font-size: 22px; color: var(--charcoal); margin: 0 0 4px; }
        .ep-panel-head p { font-size: 13px; color: var(--charcoal-light); margin: 0; }

        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--stone); margin: 16px 0 8px; padding-top: 12px; border-top: 1px solid var(--sand); }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px; }
        .field input, .field select, .field textarea { width: 100%; padding: 10px 14px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); box-sizing: border-box; }
        .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: var(--ember); }

        .profile-photo-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; gap: 8px; }
        .profile-photo-wrap { position: relative; width: 90px; height: 90px; }
        .profile-photo-wrap img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .profile-photo-placeholder { width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg,var(--ember),var(--gold)); color: white; font-family: var(--font-display); font-size: 36px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .photo-edit-btn { position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; border-radius: 50%; background: var(--ember); color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .photo-edit-btn:hover { background: #C7421A; }
        .photo-edit-btn svg { width: 14px; height: 14px; }
        .photo-label { background: none; border: none; font-family: var(--font-body); font-size: 13px; color: var(--ember); font-weight: 600; cursor: pointer; padding: 4px 8px; }
        .photo-label:hover { text-decoration: underline; }

        .current-role { display: flex; align-items: center; gap: 14px; width: 100%; background: var(--ember-glow); border: 2px solid var(--ember); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; cursor: pointer; font-family: var(--font-body); text-align: left; transition: all 0.2s; }
        .current-role:hover { background: rgba(220,74,26,0.08); }
        .current-role .role-icon { font-size: 28px; }
        .current-role .role-label { font-weight: 700; font-size: 15px; color: var(--charcoal); }
        .current-role .role-change { font-size: 12px; color: var(--ember); font-weight: 600; margin-left: auto; }
        .role-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; margin-top: 8px; }
        .role-option { padding: 12px 14px; border-radius: var(--radius-md); background: white; border: 1.5px solid var(--sand); font-size: 14px; font-weight: 600; color: var(--charcoal-mid); cursor: pointer; text-align: center; font-family: var(--font-body); transition: all 0.2s; }
        .role-option:hover { border-color: var(--charcoal); color: var(--charcoal); }
        .role-option.selected { background: var(--charcoal); border-color: var(--charcoal); color: white; }

        .chip-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip-option { padding: 8px 14px; border-radius: 100px; background: white; border: 1.5px solid var(--sand); color: var(--charcoal-light); font-size: 13px; font-weight: 600; font-family: var(--font-body); cursor: pointer; transition: all 0.2s; }
        .chip-option:hover { border-color: var(--charcoal); color: var(--charcoal); }
        .chip-option.selected { background: var(--charcoal); border-color: var(--charcoal); color: white; }
        .chip-option.selected:hover { background: #000; border-color: #000; color: white; }

        .sb-verify-card { background: linear-gradient(135deg, #FFF7ED, var(--cream)); border: 1.5px solid var(--ember-glow); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 16px; }
        .verify-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: white; border-radius: var(--radius-md); border: 1px solid var(--sand); }
        .verify-row .vr-ic { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .verify-row .vr-ic svg { width: 14px; height: 14px; }
        .verify-row .vr-ic.yes { background: rgba(16,185,129,0.14); color: #047857; }
        .verify-row .vr-ic.no  { background: #FEE2E2; color: #DC2626; }
        .verify-row .vr-body { flex: 1; min-width: 0; }
        .verify-row .vr-label { font-size: 13px; font-weight: 700; color: var(--charcoal); }
        .verify-row .vr-label small { display: inline; font-size: 12px; color: var(--charcoal-light); font-weight: 500; margin-left: 6px; }
        .verify-row .vr-action { padding: 6px 12px; border-radius: 100px; background: var(--ember); color: white; border: none; font-size: 12px; font-weight: 700; font-family: var(--font-body); cursor: pointer; white-space: nowrap; }
        .verify-row .vr-action:hover { background: #C7421A; }
        .verify-row .vr-status { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.4px; }

        .aadhaar-benefits { list-style: none; padding: 0; margin: 20px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .aadhaar-benefits li { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 18px 16px; border-radius: var(--radius-md); background: white; border: 1.5px solid var(--sand); transition: all 0.2s; }
        .aadhaar-benefits li:hover { border-color: var(--ember-glow); box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .aadhaar-benefits .ab-ic { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .aadhaar-benefits li:nth-child(1) .ab-ic { background: var(--ember-glow); color: var(--ember); }
        .aadhaar-benefits li:nth-child(2) .ab-ic { background: rgba(16,185,129,0.14); color: #047857; }
        .aadhaar-benefits li:nth-child(3) .ab-ic { background: #FEF3C7; color: #92400E; }
        .aadhaar-benefits .ab-ic svg { width: 22px; height: 22px; }
        .aadhaar-benefits strong { display: block; color: var(--charcoal); font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .aadhaar-benefits small { color: var(--charcoal-light); font-size: 12px; line-height: 1.45; }
        @media (max-width: 768px) { .aadhaar-benefits { grid-template-columns: 1fr; } }

        .work-top-grid { display: grid; gap: 24px; align-items: start; margin-bottom: 8px; }
        .salary-display .amount { font-family: var(--font-display); font-size: 26px; color: var(--charcoal); margin-bottom: 12px; }
        .salary-display .amount small { font-size: 13px; color: var(--charcoal-light); }
        .salary-range { width: 100%; accent-color: var(--ember); }
        .salary-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--charcoal-light); margin-top: 6px; }

        .exp-entry { position: relative; background: var(--cream); border: 1px solid var(--sand); border-radius: var(--radius-md); padding: 16px 16px 8px; margin-bottom: 12px; }
        .exp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .exp-row { grid-template-columns: 1fr; } }
        .exp-remove-btn { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: white; border: 1.5px solid var(--sand); color: var(--charcoal-light); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .exp-remove-btn:hover { border-color: #DC2626; color: #DC2626; background: #FEE2E2; }
        .exp-remove-btn svg { width: 14px; height: 14px; }

        .duration-cluster { display: flex; flex-direction: column; gap: 8px; }
        .duration-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .duration-row select:disabled { background: var(--cream); color: var(--stone); cursor: not-allowed; }

        .still-here-row { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--charcoal-mid); cursor: pointer; user-select: none; padding: 4px 0; position: relative; }
        .still-here-row input[type="checkbox"] { position: absolute; opacity: 0; left: 0; top: 0; width: 20px; height: 20px; margin: 0; cursor: pointer; }
        .sb-check-visual { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--sand); background: white; flex-shrink: 0; position: relative; transition: all 0.15s; }
        .sb-check-visual.checked { background: #10B981; border-color: #10B981; }
        .sb-check-visual.checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 6px; height: 12px; border: solid white; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }

        .add-exp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border: 2px dashed var(--sand); border-radius: var(--radius-md); background: white; color: var(--charcoal-mid); font-weight: 700; font-family: var(--font-body); font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .add-exp-btn:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }
        .add-exp-btn svg { width: 14px; height: 14px; }

        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--sand); }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-label { font-size: 14px; font-weight: 600; color: var(--charcoal); }
        .toggle-label small { display: block; font-size: 12px; color: var(--charcoal-light); font-weight: 400; margin-top: 2px; }
        .toggle-switch { position: relative; width: 48px; height: 28px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: var(--sand); border-radius: 100px; cursor: pointer; transition: background 0.3s; }
        .toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .toggle-switch input:checked + .toggle-slider { background: #10B981; }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

        .ep-actions { display: flex; gap: 10px; margin-top: 16px; }
        .btn-cancel { flex: 1; padding: 12px 20px; background: white; color: var(--charcoal); border: 1.5px solid var(--sand); border-radius: var(--radius-md); font-size: 15px; font-weight: 700; font-family: var(--font-body); cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover:not(:disabled) { border-color: var(--charcoal-light); }
        .btn-cancel:disabled { opacity: 0.5; cursor: default; }
        .btn-save { flex: 2; padding: 12px 20px; background: var(--ember); color: white; border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 700; font-family: var(--font-body); cursor: pointer; box-shadow: 0 4px 14px rgba(220,74,26,0.22); transition: all 0.2s; }
        .btn-save:hover:not(:disabled) { background: #C7421A; }
        .btn-save:disabled { opacity: 0.5; cursor: default; }

        .sb-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 12px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; z-index: 400; box-shadow: var(--shadow-lg); }

        .aadhaar-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 9998; padding: 16px; }
        .aadhaar-modal-overlay.open { display: flex; }
        .aadhaar-modal { background: white; border-radius: 16px; width: 100%; max-width: 460px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .aadhaar-modal h3 { font-family: var(--font-display); font-size: 22px; color: var(--charcoal); margin: 0 0 6px; }
        .aadhaar-modal p { font-size: 14px; color: var(--charcoal-light); margin: 0 0 18px; line-height: 1.5; }

        .aadhaar-upload-pickers { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .aadhaar-pick-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 12px; border-radius: var(--radius-md); border: 2px dashed var(--sand); background: var(--cream); color: var(--charcoal); font-family: var(--font-body); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; }
        .aadhaar-pick-btn:hover { border-color: var(--charcoal); color: var(--charcoal); background: rgba(0,0,0,0.04); }
        .aadhaar-pick-btn svg { width: 28px; height: 28px; }
        .aadhaar-pick-btn small { font-size: 11px; font-weight: 500; color: var(--charcoal-light); }

        .aadhaar-preview { border: 1.5px solid var(--sand); border-radius: var(--radius-md); padding: 10px; background: var(--cream); margin-bottom: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .aadhaar-preview img { max-width: 100%; max-height: 240px; border-radius: var(--radius-sm); object-fit: contain; background: white; }
        .retake-link { font-size: 13px; font-weight: 700; color: var(--ember); background: none; border: none; cursor: pointer; padding: 4px 8px; font-family: var(--font-body); }
        .retake-link:hover { text-decoration: underline; }

        .aadhaar-modal .err-line { font-size: 12px; color: #DC2626; margin-top: 6px; font-weight: 600; min-height: 16px; }
        .aadhaar-modal-actions { display: flex; gap: 10px; margin-top: 12px; }
        .aadhaar-modal-actions .btn-cancel { flex: 1; padding: 12px; background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); font-size: 14px; font-weight: 700; color: var(--charcoal); font-family: var(--font-body); cursor: pointer; }
        .aadhaar-modal-actions .btn-cancel:disabled { opacity: 0.5; cursor: default; }
        .aadhaar-modal-actions .btn-submit { flex: 2; padding: 12px; background: var(--ember); border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 700; color: white; font-family: var(--font-body); cursor: pointer; }
        .aadhaar-modal-actions .btn-submit:hover:not(:disabled) { background: #C7421A; }
        .aadhaar-modal-actions .btn-submit:disabled { background: var(--sand); color: var(--stone); cursor: not-allowed; }
      `}</style>
    </div>
  );
}
