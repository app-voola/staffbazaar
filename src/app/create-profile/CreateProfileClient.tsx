'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 'done';
type RoleKey = 'cook' | 'bartender' | 'waiter' | 'helper';

const ROLE_LABELS: Record<RoleKey, string> = {
  cook: 'Cooks & Chefs',
  bartender: 'Bartender',
  waiter: 'Waiter / Steward',
  helper: 'Kitchen Helper',
};

const CITIES = [
  'Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai',
  'Kolkata', 'Goa', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Chandigarh',
];

const PHOTO_BUCKET = 'restaurant-photos';
const MAX_AADHAAR_BYTES = 6 * 1024 * 1024;

export function CreateProfileClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [role, setRole] = useState<RoleKey | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: boolean; age?: boolean; role?: boolean; city?: boolean }>({});

  // Aadhaar state
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarError, setAadhaarError] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.full_name && user.full_name !== 'Owner') setFullName(user.full_name);
  }, [user?.full_name]);

  const toggleCity = (c: string) => {
    setCities((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setErrors((e) => ({ ...e, city: false }));
  };
  const toggleAllCities = () => {
    setCities((prev) => (prev.length === CITIES.length ? [] : [...CITIES]));
    setErrors((e) => ({ ...e, city: false }));
  };

  const validateStep1 = (): boolean => {
    const ageNum = parseInt(age, 10);
    const next = {
      name: !fullName.trim(),
      age: !(ageNum >= 18 && ageNum <= 70),
      role: !role,
      city: cities.length === 0,
    };
    setErrors(next);
    return !next.name && !next.age && !next.role && !next.city;
  };

  const saveStep1AndAdvance = async () => {
    if (!validateStep1() || !user) return;
    setBusy(true);
    setSubmitError('');
    const ageNum = parseInt(age, 10);
    const { error } = await supabase.from('worker_profiles').upsert(
      {
        worker_id: user.id,
        full_name: fullName.trim(),
        age: ageNum,
        role: ROLE_LABELS[role!],
        cities,
        city: cities[0] ?? null,
        looking_for_work: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'worker_id' },
    );
    setBusy(false);
    if (error) {
      console.error('[create-profile] save step 1 failed', error);
      setSubmitError(`Couldn't save profile: ${error.message}`);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAadhaarError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAadhaarError('Please pick an image file.');
      return;
    }
    if (file.size > MAX_AADHAAR_BYTES) {
      setAadhaarError('Image too large. Please use a photo under 6 MB.');
      return;
    }
    setAadhaarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAadhaarPreview((ev.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  };

  const resetAadhaar = () => {
    setAadhaarFile(null);
    setAadhaarPreview(null);
    setAadhaarError('');
  };

  const submitAadhaarAndFinish = async () => {
    if (!user || !aadhaarFile) return;
    setBusy(true);
    const ext = aadhaarFile.name.split('.').pop() || 'jpg';
    const path = `workers/${user.id}/aadhaar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, aadhaarFile, { cacheControl: '3600', upsert: false });
    if (upErr) {
      setBusy(false);
      setAadhaarError(`Upload failed: ${upErr.message}`);
      return;
    }
    const { data: urlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    const { error: dbErr } = await supabase.from('worker_profiles').upsert(
      {
        worker_id: user.id,
        aadhaar_status: 'uploaded',
        aadhaar_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'worker_id' },
    );
    setBusy(false);
    if (dbErr) {
      setAadhaarError(`Save failed: ${dbErr.message}`);
      return;
    }
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skipAadhaar = () => {
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progressPct = step === 1 ? 50 : step === 2 ? 100 : 100;

  if (authLoading || !user) {
    return (
      <div className="cp-loading">Loading…
        <style>{`.cp-loading { min-height: 100vh; display:flex; align-items:center; justify-content:center; color:var(--charcoal-light); }`}</style>
      </div>
    );
  }

  return (
    <div className="cp-page">
      {/* Top bar */}
      <div className="cp-nav">
        <Link href="/worker-dashboard" className="cp-logo">
          Staff<em>Bazaar</em>
        </Link>
        <Link href="/signup" className="cp-back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </Link>
      </div>

      {/* Progress */}
      {step !== 'done' && (
        <div className="cp-progress-wrap">
          <div className="cp-progress-track">
            <div className="cp-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="cp-progress-label">
            <span>Step <strong>{step}</strong> / <strong>2</strong></span>
            <span>{step === 1 ? 'Basic Info' : 'Aadhaar (Optional)'}</span>
          </div>
        </div>
      )}

      <div className="cp-wizard">
        {step === 1 && (
          <section className="cp-step">
            <div className="cp-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>Tell us about you</h2>
            <p className="cp-desc">Just a few basics so restaurants can find you</p>

            <div className={`cp-field${errors.name ? ' error' : ''}`}>
              <label>Full Name <span className="cp-req">*</span></label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
                placeholder="e.g. Vikram Sharma"
              />
              {errors.name && <div className="cp-err">Please enter your name</div>}
            </div>

            <div className={`cp-field${errors.age ? ' error' : ''}`}>
              <label>Age <span className="cp-req">*</span></label>
              <input
                type="number"
                value={age}
                min={18}
                max={70}
                onChange={(e) => { setAge(e.target.value); setErrors((p) => ({ ...p, age: false })); }}
                placeholder="e.g. 28"
              />
              <div className="cp-hint">You must be 18 or older to work</div>
              {errors.age && <div className="cp-err">Please enter a valid age (18-70)</div>}
            </div>

            <div className={`cp-field${errors.role ? ' error' : ''}`}>
              <label>What work do you do? <span className="cp-req">*</span></label>
              <div className="cp-role-grid">
                {([
                  { key: 'cook',      emoji: '👨‍🍳', label: 'Cook / Chef',    sub: 'Tandoor, line cook, head chef' },
                  { key: 'bartender', emoji: '🍸',    label: 'Bartender',      sub: 'Bartender, mixologist, barista' },
                  { key: 'waiter',    emoji: '🍽️',    label: 'Waiter / Server', sub: 'Captain, waiter, host' },
                  { key: 'helper',    emoji: '🧹',    label: 'Kitchen Helper', sub: 'Prep cook, cleaner, dishwasher' },
                ] as { key: RoleKey; emoji: string; label: string; sub: string }[]).map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={`cp-role-card${role === r.key ? ' selected' : ''}`}
                    onClick={() => { setRole(r.key); setErrors((p) => ({ ...p, role: false })); }}
                  >
                    <span className="cp-role-emoji">{r.emoji}</span>
                    <div className="cp-role-label">{r.label}</div>
                    <div className="cp-role-sub">{r.sub}</div>
                  </button>
                ))}
              </div>
              {errors.role && <div className="cp-err">Please pick the work you do</div>}
            </div>

            <div className={`cp-field${errors.city ? ' error' : ''}`}>
              <label>Where do you want to work? <span className="cp-req">*</span></label>
              <div className="cp-chip-selector">
                <button
                  type="button"
                  className={`cp-chip${cities.length === CITIES.length ? ' selected' : ''}`}
                  onClick={toggleAllCities}
                >
                  All Cities
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`cp-chip${cities.includes(c) ? ' selected' : ''}`}
                    onClick={() => toggleCity(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="cp-hint">Pick one or more. You can change this later.</div>
              {errors.city && <div className="cp-err">Please pick at least one city</div>}
            </div>

            {submitError && <div className="cp-submit-err">{submitError}</div>}
          </section>
        )}

        {step === 2 && (
          <section className="cp-step">
            <div className="cp-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h2>
              Upload Aadhaar Photo <span className="cp-optional-badge">Optional</span>
            </h2>
            <p className="cp-desc">
              Take a clear photo of your Aadhaar card. Our team reviews it within 24 hours.
            </p>

            {aadhaarPreview ? (
              <div className="cp-aadhaar-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={aadhaarPreview} alt="Aadhaar preview" />
                <button type="button" className="cp-retake" onClick={resetAadhaar}>
                  Retake / Choose another
                </button>
              </div>
            ) : (
              <div className="cp-aadhaar-pickers">
                <button type="button" className="cp-pick-btn" onClick={() => cameraRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Take Photo
                  <small>Use camera</small>
                </button>
                <button type="button" className="cp-pick-btn" onClick={() => galleryRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  From Gallery
                  <small>Pick a photo</small>
                </button>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFilePick} hidden />
                <input ref={galleryRef} type="file" accept="image/*" onChange={handleFilePick} hidden />
              </div>
            )}

            {aadhaarError && <div className="cp-err-line">{aadhaarError}</div>}

            <ul className="cp-benefits">
              <li>
                <div className="cp-ab-ic ember">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div><strong>Stand out in search</strong><small>Verified badge shown on your profile</small></div>
              </li>
              <li>
                <div className="cp-ab-ic green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div><strong>Private &amp; secure</strong><small>Only verification status is shown, never your Aadhaar number</small></div>
              </li>
              <li>
                <div className="cp-ab-ic gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
                <div><strong>Reviewed in 24 hours</strong><small>We check your photo and mark you verified within a day</small></div>
              </li>
            </ul>

            <div className="cp-skip-note">
              No Aadhaar photo now? <strong>You can upload it later from your profile.</strong>
            </div>
          </section>
        )}

        {step === 'done' && (
          <section className="cp-success">
            <div className="cp-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Profile Created!</h2>
            <p>Restaurants can now find you. We&apos;ll let you know when there&apos;s a match.</p>
            {aadhaarFile && (
              <div className="cp-verified-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Aadhaar photo uploaded — review pending
              </div>
            )}
            <div className="cp-success-ctas">
              <Link href="/worker-profile" className="cp-cta-primary">Complete Profile</Link>
              <Link href="/worker-dashboard" className="cp-cta-secondary">Go to Dashboard</Link>
            </div>
          </section>
        )}
      </div>

      {step !== 'done' && (
        <div className="cp-bottom-bar">
          <div className="cp-bottom-inner">
            <div className="cp-btn-row">
              {step === 2 ? (
                <button type="button" className="cp-btn-back" onClick={() => setStep(1)} disabled={busy}>
                  Back
                </button>
              ) : null}
              <button
                type="button"
                className="cp-btn-next"
                onClick={step === 1 ? saveStep1AndAdvance : submitAadhaarAndFinish}
                disabled={busy || (step === 2 && !aadhaarFile)}
              >
                {busy ? 'Please wait…' : step === 1 ? 'Next' : 'Finish'}
              </button>
            </div>
            {step === 2 && (
              <button type="button" className="cp-btn-skip" onClick={skipAadhaar} disabled={busy}>
                Skip, verify later
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .cp-page { min-height: 100vh; background: var(--warm-white, #FAF8F5); padding-bottom: 140px; }
        .cp-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 24px; background:white; border-bottom:1px solid var(--sand); position:sticky; top:0; z-index:100; }
        .cp-logo { font-family: var(--font-display); font-size:22px; color:var(--charcoal); text-decoration:none; }
        .cp-logo em { color: var(--ember); font-style: italic; }
        .cp-back-link { display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:600; color:var(--stone); text-decoration:none; }
        .cp-back-link svg { width:16px; height:16px; }

        .cp-progress-wrap { max-width:600px; margin:24px auto 0; padding:0 24px; }
        .cp-progress-track { height:8px; background:var(--sand); border-radius:100px; overflow:hidden; }
        .cp-progress-fill { height:100%; background: linear-gradient(90deg, var(--ember), var(--gold)); border-radius:100px; transition: width 0.4s ease; }
        .cp-progress-label { display:flex; justify-content:space-between; margin-top:8px; font-size:13px; color:var(--stone); font-weight:600; }

        .cp-wizard { max-width:600px; margin:0 auto; padding:32px 24px; }
        .cp-step-icon { width:56px; height:56px; border-radius:50%; background:var(--ember-glow); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
        .cp-step-icon svg { width:28px; height:28px; }
        .cp-step h2 { font-family:var(--font-display); font-size:28px; color:var(--charcoal); margin-bottom:6px; }
        .cp-desc { font-size:15px; color:var(--charcoal-light); margin-bottom:28px; line-height:1.5; }
        .cp-optional-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; background:var(--cream); color:var(--stone); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-left:8px; vertical-align:middle; }

        .cp-field { margin-bottom:20px; }
        .cp-field label { display:block; font-size:14px; font-weight:700; color:var(--charcoal-mid); margin-bottom:8px; }
        .cp-field .cp-req { color: var(--ember); }
        .cp-field input { width:100%; padding:16px; border:1.5px solid var(--sand); border-radius:var(--radius-md); font-size:17px; font-family:var(--font-body); color:var(--charcoal); background:white; transition: border-color 0.2s; box-sizing:border-box; }
        .cp-field input:focus { border-color: var(--ember); outline:none; }
        .cp-field.error input { border-color:#DC2626; background:#FEF2F2; }
        .cp-field .cp-hint { font-size:13px; color:var(--stone); margin-top:6px; }
        .cp-field .cp-err { font-size:12px; color:#DC2626; margin-top:6px; font-weight:600; }

        .cp-role-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:400px) { .cp-role-grid { grid-template-columns:1fr; } }
        .cp-role-card { background:white; border:2px solid var(--sand); border-radius:var(--radius-md); padding:18px 14px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative; font-family: var(--font-body); }
        .cp-role-card:hover { border-color:var(--charcoal-light); transform:translateY(-2px); }
        .cp-role-card.selected { border-color:var(--ember); background:var(--ember-glow); }
        .cp-role-card.selected::after { content:''; position:absolute; top:8px; right:8px; width:20px; height:20px; border-radius:50%; background:var(--ember); background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); background-size:12px; background-position:center; background-repeat:no-repeat; }
        .cp-role-emoji { font-size:32px; margin-bottom:6px; display:block; }
        .cp-role-label { font-size:15px; font-weight:700; color:var(--charcoal); margin-bottom:2px; }
        .cp-role-sub { font-size:12px; color:var(--charcoal-light); }

        .cp-chip-selector { display:flex; flex-wrap:wrap; gap:8px; }
        .cp-chip { padding:8px 14px; border-radius:100px; background:white; border:1.5px solid var(--sand); color:var(--charcoal-light); font-size:13px; font-weight:600; font-family:var(--font-body); cursor:pointer; transition:all 0.2s; }
        .cp-chip:hover { border-color:var(--charcoal); color:var(--charcoal); }
        .cp-chip.selected { background:var(--charcoal); border-color:var(--charcoal); color:white; }
        .cp-field.error .cp-chip-selector { border:1.5px solid #DC2626; border-radius:var(--radius-md); padding:8px; background:#FEF2F2; }

        .cp-aadhaar-pickers { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
        .cp-pick-btn { display:flex; flex-direction:column; align-items:center; gap:8px; padding:26px 14px; border-radius:var(--radius-md); border:2px dashed var(--sand); background:var(--cream); color:var(--charcoal); font-family:var(--font-body); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; text-align:center; }
        .cp-pick-btn:hover { border-color:var(--ember); color:var(--ember); background:var(--ember-glow); }
        .cp-pick-btn svg { width:36px; height:36px; stroke-width:1.8; }
        .cp-pick-btn small { display:block; font-size:11px; font-weight:500; color:var(--charcoal-light); }

        .cp-aadhaar-preview { border:1.5px solid var(--sand); border-radius:var(--radius-md); padding:10px; background:var(--cream); margin-bottom:12px; display:flex; flex-direction:column; align-items:center; gap:8px; }
        .cp-aadhaar-preview img { max-width:100%; max-height:260px; border-radius:var(--radius-sm); object-fit:contain; background:white; }
        .cp-retake { font-size:13px; font-weight:700; color:var(--ember); background:none; border:none; cursor:pointer; padding:4px 8px; font-family:var(--font-body); }
        .cp-retake:hover { text-decoration:underline; }
        .cp-err-line { font-size:12px; color:#DC2626; margin-top:6px; font-weight:600; text-align:center; }

        .cp-benefits { list-style:none; padding:0; margin:20px 0 0; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        @media (max-width:560px) { .cp-benefits { grid-template-columns:1fr; } }
        .cp-benefits li { display:flex; flex-direction:column; gap:10px; padding:16px 14px; border-radius:var(--radius-md); background:white; border:1.5px solid var(--sand); transition:all 0.2s; }
        .cp-benefits li:hover { border-color:var(--ember-glow); box-shadow:0 2px 6px rgba(0,0,0,0.04); }
        .cp-ab-ic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .cp-ab-ic svg { width:20px; height:20px; }
        .cp-ab-ic.ember { background:var(--ember-glow); color:var(--ember); }
        .cp-ab-ic.green { background: rgba(16,185,129,0.14); color: #047857; }
        .cp-ab-ic.gold { background:#FEF3C7; color:#92400E; }
        .cp-benefits strong { display:block; color:var(--charcoal); font-size:14px; font-weight:700; margin-bottom:2px; }
        .cp-benefits small { color:var(--charcoal-light); font-size:12px; line-height:1.45; }

        .cp-skip-note { text-align:center; font-size:13px; color:var(--stone); margin-top:16px; }
        .cp-skip-note strong { color:var(--charcoal-mid); }

        .cp-submit-err { background:#FEF2F2; border:1px solid #FCA5A5; color:#991B1B; padding:10px 14px; border-radius:var(--radius-md); font-size:13px; font-weight:600; margin-top:6px; }

        .cp-success { text-align:center; padding:60px 20px; }
        .cp-success-icon { width:88px; height:88px; border-radius:50%; background: rgba(16,185,129,0.14); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation: cpPop 0.5s cubic-bezier(0.4,0,0.2,1); }
        .cp-success-icon svg { width:44px; height:44px; color:#047857; }
        @keyframes cpPop { 0%{transform:scale(0);} 60%{transform:scale(1.2);} 100%{transform:scale(1);} }
        .cp-success h2 { font-family:var(--font-display); font-size:32px; margin-bottom:10px; color:var(--charcoal); }
        .cp-success p { font-size:16px; color:var(--charcoal-light); line-height:1.6; margin-bottom:20px; }
        .cp-verified-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:100px; background: rgba(16,185,129,0.14); color:#047857; font-size:13px; font-weight:700; margin-bottom:24px; }
        .cp-verified-chip svg { width:14px; height:14px; }
        .cp-success-ctas { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
        .cp-cta-primary, .cp-cta-secondary { display:inline-flex; align-items:center; gap:10px; padding:16px 28px; border-radius:var(--radius-md); font-size:15px; font-weight:700; font-family:var(--font-body); text-decoration:none; transition: all 0.2s; cursor: pointer; }
        .cp-cta-primary { background:var(--ember); color:white; box-shadow: 0 4px 16px rgba(220,74,26,0.25); border: none; }
        .cp-cta-primary:hover { background:#C7421A; transform: translateY(-2px); }
        .cp-cta-secondary { background:white; color:var(--ember); border:1.5px solid var(--ember); }
        .cp-cta-secondary:hover { background:var(--ember-glow); }

        .cp-bottom-bar { position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid var(--sand); padding:16px 24px; z-index:100; display:flex; justify-content:center; }
        .cp-bottom-inner { max-width:600px; width:100%; display:flex; flex-direction:column; gap:12px; }
        .cp-btn-row { display:flex; gap:12px; }
        .cp-btn-back { flex:1; padding:16px; border-radius:var(--radius-md); font-size:16px; font-weight:700; font-family:var(--font-body); background:white; color:var(--charcoal); border:1.5px solid var(--sand); cursor:pointer; transition:all 0.2s; }
        .cp-btn-back:hover:not(:disabled) { border-color:var(--charcoal-light); }
        .cp-btn-back:disabled { opacity:0.5; cursor:default; }
        .cp-btn-next { flex:2; padding:16px; border-radius:var(--radius-md); font-size:16px; font-weight:700; font-family:var(--font-body); background:var(--ember); color:white; border:none; cursor:pointer; transition:all 0.2s; box-shadow: 0 4px 16px rgba(220,74,26,0.2); }
        .cp-btn-next:hover:not(:disabled) { background:#C7421A; }
        .cp-btn-next:disabled { background:var(--sand); color:var(--stone); cursor:not-allowed; box-shadow:none; }
        .cp-btn-skip { width:100%; padding:12px; background:transparent; border:none; font-size:14px; font-weight:700; color:var(--stone); font-family:var(--font-body); cursor:pointer; text-decoration:underline; }
        .cp-btn-skip:hover:not(:disabled) { color:var(--charcoal); }
        .cp-btn-skip:disabled { opacity:0.5; cursor:default; }
      `}</style>
    </div>
  );
}
