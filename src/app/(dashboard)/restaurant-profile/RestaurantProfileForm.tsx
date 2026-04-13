'use client';

import { useState } from 'react';
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

const INITIAL: FormState = {
  name: 'Spice Garden',
  type: 'Casual Dining',
  description:
    'Spice Garden is a beloved casual dining restaurant in Koramangala, Bangalore, known for authentic North Indian and Continental cuisine.',
  address: 'No. 42, 1st Cross Road, 5th Block, Koramangala',
  city: 'Bangalore',
  pin: '560034',
  phone: '+91 98765 43210',
  email: 'info@spicegarden.in',
  website: 'https://www.spicegarden.in',
};

export function RestaurantProfileForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saved, setSaved] = useState<FormState>(INITIAL);
  const [toast, setToast] = useState('');

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = () => {
    setSaved(form);
    setToast('Profile updated');
    setTimeout(() => setToast(''), 2000);
  };

  const onDiscard = () => setForm(saved);

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
              <input value={form.name} onChange={(e) => update({ name: e.target.value })} />
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
              <input value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Website</label>
            <input value={form.website} onChange={(e) => update({ website: e.target.value })} />
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
