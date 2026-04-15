'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UnsavedPill } from '@/components/ui/UnsavedPill';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  notifyApplicants: boolean;
  notifyWhatsapp: boolean;
  language: 'English' | 'Hindi';
}

const EMPTY: FormState = {
  fullName: '',
  email: '',
  phone: '',
  notifyApplicants: true,
  notifyWhatsapp: true,
  language: 'English',
};

export function OwnerProfileForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: profile, error }, { data: authUser }] = await Promise.all([
        supabase.from('profiles').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (error) console.error('[profiles] load failed', error);

      const authEmail = authUser.user?.email ?? '';
      const metaName = (authUser.user?.user_metadata?.full_name as string | undefined) ?? '';

      const next: FormState = {
        fullName: profile?.full_name ?? metaName,
        email: profile?.email ?? authEmail,
        phone: profile?.phone ?? '',
        notifyApplicants: profile?.notify_applicants ?? true,
        notifyWhatsapp: profile?.notify_whatsapp ?? true,
        language: (profile?.language as FormState['language']) ?? 'English',
      };
      setForm(next);
      setSaved(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = async () => {
    if (!user) return;
    const row = {
      owner_id: user.id,
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      notify_applicants: form.notifyApplicants,
      notify_whatsapp: form.notifyWhatsapp,
      language: form.language,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'owner_id' });
    if (error) {
      console.error('[profiles] save failed', error);
      setToast(`Save failed: ${error.message}`);
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setSaved(form);
    setToast('Profile saved');
    setTimeout(() => setToast(''), 2000);
  };

  if (loading) {
    return (
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 16 }}>
        Loading…
      </h1>
    );
  }

  return (
    <>
      <div className="profile-content">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 24 }}>
          My Profile
        </h1>

        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="field">
            <label>Full Name</label>
            <input
              value={form.fullName}
              placeholder="Your full name"
              onChange={(e) => update({ fullName: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Phone</label>
              <input
                value={form.phone}
                placeholder="+91"
                onChange={(e) => update({ phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                placeholder="you@example.com"
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notifications</h3>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">New applicant alerts</div>
              <div className="toggle-desc">Get notified when someone applies to your jobs</div>
            </div>
            <button
              type="button"
              className={`toggle-switch${form.notifyApplicants ? ' on' : ''}`}
              onClick={() => update({ notifyApplicants: !form.notifyApplicants })}
            />
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">WhatsApp notifications</div>
              <div className="toggle-desc">Receive important updates on WhatsApp</div>
            </div>
            <button
              type="button"
              className={`toggle-switch${form.notifyWhatsapp ? ' on' : ''}`}
              onClick={() => update({ notifyWhatsapp: !form.notifyWhatsapp })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Language</h3>
          <div className="lang-toggle">
            {(['English', 'Hindi'] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={`lang-opt${form.language === l ? ' active' : ''}`}
                onClick={() => update({ language: l })}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Subscription</h3>
          <div className="subscription-bar">
            <span className="plan-badge">Starter Plan</span>
            <span style={{ fontSize: 14, color: 'var(--charcoal-mid)' }}>3 free job posts / month</span>
            <Link href="/pricing" style={{ marginLeft: 'auto', color: 'var(--ember)', fontWeight: 700 }}>
              Upgrade →
            </Link>
          </div>
        </div>
      </div>

      <UnsavedPill show={dirty} onDiscard={() => setForm(saved)} onSave={onSave} />

      {toast && (
        <div className="sb-toast show">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        .profile-content { max-width: 700px; padding-bottom: 80px; }
        .form-section { margin-bottom: 36px; }
        .form-section h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--sand); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--sand); }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-label { font-size: 14px; font-weight: 600; color: var(--charcoal); }
        .toggle-desc { font-size: 12px; color: var(--stone); margin-top: 2px; }
        .toggle-switch { width: 48px; height: 26px; background: var(--sand); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: none; flex-shrink: 0; }
        .toggle-switch::after { content: ''; width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: var(--shadow-xs); }
        .toggle-switch.on { background: var(--ember); }
        .toggle-switch.on::after { transform: translateX(22px); }
        .lang-toggle { display: flex; gap: 4px; }
        .lang-opt { padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; border: 1.5px solid var(--sand); background: white; color: var(--charcoal-light); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .lang-opt.active { background: var(--charcoal); color: white; border-color: var(--charcoal); }
        .subscription-bar { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--cream); border-radius: var(--radius-md); flex-wrap: wrap; }
        .plan-badge { padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; background: var(--gold-light); color: var(--gold); }
        @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
        .sb-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 14px 22px; border-radius: 100px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); z-index: 400; }
        .sb-toast svg { width: 18px; height: 18px; color: var(--green); }
      `}</style>
    </>
  );
}
