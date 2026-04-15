'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UnsavedPill } from '@/components/ui/UnsavedPill';

interface FormState {
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  pin: string;
  phone: string;
  email: string;
  website: string;
}

const EMPTY: FormState = {
  name: '',
  type: 'Casual Dining',
  description: '',
  address: '',
  city: 'Bangalore',
  pin: '',
  phone: '',
  email: '',
  website: '',
};

export function RestaurantProfileForm() {
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
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[restaurants] load failed', error);
      }
      const next: FormState = {
        name: data?.name ?? '',
        type: data?.type ?? 'Casual Dining',
        description: data?.description ?? '',
        address: data?.address ?? '',
        city: data?.city ?? 'Bangalore',
        pin: data?.pin ?? '',
        phone: data?.phone ?? '',
        email: data?.email ?? '',
        website: data?.website ?? '',
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
      ...form,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('restaurants').upsert(row, { onConflict: 'owner_id' });
    if (error) {
      console.error('[restaurants] save failed', error);
      setToast(`Save failed: ${error.message}`);
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setSaved(form);
    setToast('Profile updated');
    setTimeout(() => setToast(''), 2000);
  };

  const onDiscard = () => setForm(saved);

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
          Restaurant Profile
        </h1>

        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-row">
            <div className="field">
              <label>Restaurant Name</label>
              <input
                value={form.name}
                placeholder="Your restaurant name"
                onChange={(e) => update({ name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => update({ type: e.target.value })}>
                <option>Fine Dining</option>
                <option>Casual Dining</option>
                <option>QSR / Fast Food</option>
                <option>Cafe</option>
                <option>Bar &amp; Lounge</option>
                <option>Cloud Kitchen</option>
                <option>Catering</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              rows={4}
              placeholder="Tell candidates about your restaurant"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Location</h3>
          <div className="field">
            <label>Full Address</label>
            <textarea
              rows={2}
              placeholder="Shop number, street, locality"
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>City</label>
              <select value={form.city} onChange={(e) => update({ city: e.target.value })}>
                {['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Goa'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>PIN Code</label>
              <input
                value={form.pin}
                placeholder="560001"
                onChange={(e) => update({ pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="field">
              <label>Phone</label>
              <input
                value={form.phone}
                placeholder="+91 98765 43210"
                onChange={(e) => update({ phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                placeholder="contact@yourrestaurant.com"
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Website</label>
            <input
              value={form.website}
              placeholder="https://..."
              onChange={(e) => update({ website: e.target.value })}
            />
          </div>
        </div>
      </div>

      <UnsavedPill show={dirty} onDiscard={onDiscard} onSave={onSave} />

      {toast && (
        <div className="sb-toast show">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        .profile-content { max-width: 760px; padding-bottom: 80px; }
        .form-section { margin-bottom: 36px; }
        .form-section h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--sand); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
        .sb-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 14px 22px; border-radius: 100px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); z-index: 400; }
        .sb-toast svg { width: 18px; height: 18px; color: var(--green); }
      `}</style>
    </>
  );
}
