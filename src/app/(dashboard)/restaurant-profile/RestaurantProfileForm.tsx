'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UnsavedPill } from '@/components/ui/UnsavedPill';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type Hours = Record<DayKey, { open: string; close: string }>;

interface FormState {
  name: string;
  type: string;
  description: string;
  cuisines: string[];
  address: string;
  city: string;
  pin: string;
  phone: string;
  email: string;
  website: string;
  coverImage: string;
  logoImage: string;
  photos: string[];
  hours: Hours;
}

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Continental',
  'Mughlai',
  'Tandoor',
  'Chinese',
  'Italian',
  'Street Food',
  'Biryani',
  'Seafood',
  'Pan-Asian',
  'Desserts & Bakery',
];

const DEFAULT_HOURS: Hours = DAYS.reduce((acc, d) => {
  acc[d.key] = { open: '', close: '' };
  return acc;
}, {} as Hours);

const EMPTY: FormState = {
  name: '',
  type: 'Casual Dining',
  description: '',
  cuisines: [],
  address: '',
  city: 'Bangalore',
  pin: '',
  phone: '',
  email: '',
  website: '',
  coverImage: '',
  logoImage: '',
  photos: [],
  hours: DEFAULT_HOURS,
};

const MAX_PHOTOS = 3;
const BUCKET = 'restaurant-photos';

export function RestaurantProfileForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const hydrate = (data: Record<string, unknown> | null) => {
      const rawHours = (data?.hours as Record<string, { open?: string; close?: string }>) ?? {};
      const mergedHours: Hours = { ...DEFAULT_HOURS };
      DAYS.forEach((d) => {
        const row = rawHours[d.key];
        if (row) {
          mergedHours[d.key] = { open: row.open ?? '', close: row.close ?? '' };
        }
      });
      const next: FormState = {
        name: (data?.name as string | null) ?? '',
        type: (data?.type as string | null) ?? 'Casual Dining',
        description: (data?.description as string | null) ?? '',
        cuisines: (data?.cuisines as string[] | null) ?? [],
        address: (data?.address as string | null) ?? '',
        city: (data?.city as string | null) ?? 'Bangalore',
        pin: (data?.pin as string | null) ?? '',
        phone: (data?.phone as string | null) ?? '',
        email: (data?.email as string | null) ?? '',
        website: (data?.website as string | null) ?? '',
        coverImage: (data?.cover_image as string | null) ?? '',
        logoImage: (data?.logo_image as string | null) ?? '',
        photos: (data?.photos as string[] | null) ?? [],
        hours: mergedHours,
      };
      setForm(next);
      setSaved(next);
    };

    (async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.error('[restaurants] load failed', error);
      hydrate(data as Record<string, unknown> | null);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`restaurants-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `owner_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          hydrate(payload.new as Record<string, unknown>);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const toggleCuisine = (c: string) =>
    setForm((f) => ({
      ...f,
      cuisines: f.cuisines.includes(c)
        ? f.cuisines.filter((x) => x !== c)
        : [...f.cuisines, c],
    }));

  const setDayTime = (day: DayKey, field: 'open' | 'close', value: string) =>
    setForm((f) => ({
      ...f,
      hours: { ...f.hours, [day]: { ...f.hours[day], [field]: value } },
    }));

  const onSave = async () => {
    if (!user) return;
    const row = {
      owner_id: user.id,
      name: form.name,
      type: form.type,
      description: form.description,
      cuisines: form.cuisines,
      address: form.address,
      city: form.city,
      pin: form.pin,
      phone: form.phone,
      email: form.email,
      website: form.website,
      cover_image: form.coverImage || null,
      logo_image: form.logoImage || null,
      photos: form.photos,
      hours: form.hours,
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

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) {
      console.error('[storage] upload failed', upErr);
      setToast(`Upload failed: ${upErr.message}`);
      setTimeout(() => setToast(''), 3000);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const persistPartial = async (patch: Record<string, unknown>) => {
    if (!user) return;
    const { error } = await supabase
      .from('restaurants')
      .upsert(
        { owner_id: user.id, ...patch, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' },
      );
    if (error) {
      console.error('[restaurants] persist partial failed', error);
      setToast(`Save failed: ${error.message}`);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadFile(file);
    if (!url) return;
    await persistPartial({ cover_image: url });
    setForm((f) => ({ ...f, coverImage: url }));
    setSaved((s) => ({ ...s, coverImage: url }));
    setToast('Cover updated');
    setTimeout(() => setToast(''), 2000);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadFile(file);
    if (!url) return;
    await persistPartial({ logo_image: url });
    setForm((f) => ({ ...f, logoImage: url }));
    setSaved((s) => ({ ...s, logoImage: url }));
    setToast('Logo updated');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (form.photos.length >= MAX_PHOTOS) {
      setToast(`You can add up to ${MAX_PHOTOS} photos`);
      setTimeout(() => setToast(''), 2500);
      return;
    }
    const url = await uploadFile(file);
    if (!url) return;
    const nextPhotos = [...form.photos, url];
    await persistPartial({ photos: nextPhotos });
    setForm((f) => ({ ...f, photos: nextPhotos }));
    setSaved((s) => ({ ...s, photos: nextPhotos }));
    setToast('Photo added');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePhotoRemove = async (url: string) => {
    if (!user) return;
    const nextPhotos = form.photos.filter((p) => p !== url);
    await persistPartial({ photos: nextPhotos });
    setForm((f) => ({ ...f, photos: nextPhotos }));
    setSaved((s) => ({ ...s, photos: nextPhotos }));
    const prefix = `${user.id}/`;
    const key = url.split(prefix)[1];
    if (key) await supabase.storage.from(BUCKET).remove([`${prefix}${key}`]);
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
        {/* Cover photo */}
        <div className="form-section">
          <h3>Cover Photo</h3>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} hidden />
          {form.coverImage ? (
            <div className="cover-preview" style={{ backgroundImage: `url(${form.coverImage})` }}>
              <button
                type="button"
                className="cover-change-btn"
                onClick={() => coverInputRef.current?.click()}
              >
                Change
              </button>
            </div>
          ) : (
            <label className="cover-upload" onClick={() => coverInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Photo</span>
            </label>
          )}
        </div>

        {/* Logo */}
        <div className="form-section">
          <h3>Logo</h3>
          <div className="logo-row">
            <label className="logo-wrap">
              {form.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoImage} alt="Logo" />
              ) : (
                <span className="logo-placeholder">
                  {form.name ? form.name[0].toUpperCase() : user?.full_name?.[0]?.toUpperCase() ?? 'R'}
                </span>
              )}
              <span className="logo-camera">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
            </label>
            <div className="logo-info">
              <h1>{form.name || 'Your Restaurant'}</h1>
              <p>
                {form.type}
                {form.city ? ` · ${form.city}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Business Information */}
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

          <label className="section-label">Cuisine Types</label>
          <div className="chip-selector">
            {CUISINE_OPTIONS.map((c) => {
              const active = form.cuisines.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  className={`chip-option${active ? ' selected' : ''}`}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div className="form-section">
          <h3>Photos</h3>
          <div className="photos-grid">
            {form.photos.map((url) => (
              <div key={url} className="photo-item" style={{ backgroundImage: `url(${url})` }}>
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => handlePhotoRemove(url)}
                  aria-label="Remove"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {form.photos.length < MAX_PHOTOS && (
              <label className="photo-add">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoAdd} hidden />
              </label>
            )}
          </div>
        </div>

        {/* Location */}
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
                {['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa'].map((c) => (
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

        {/* Operating Hours */}
        <div className="form-section">
          <h3>Operating Hours</h3>
          <div className="hours-grid">
            {DAYS.map((d) => (
              <div className="hours-row" key={d.key}>
                <span className="day-label">{d.label}</span>
                <input
                  type="time"
                  value={form.hours[d.key].open}
                  onChange={(e) => setDayTime(d.key, 'open', e.target.value)}
                />
                <input
                  type="time"
                  value={form.hours[d.key].close}
                  onChange={(e) => setDayTime(d.key, 'close', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="form-section">
          <h3>Contact Information</h3>
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
                placeholder="contact@yourrestaurant.com"
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Website (optional)</label>
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
        .profile-content { max-width: 900px; padding-bottom: 80px; }

        .cover-upload { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 200px; border: 2px dashed var(--sand); border-radius: var(--radius-lg); background: white; cursor: pointer; color: var(--stone); font-family: var(--font-body); font-size: 14px; font-weight: 600; transition: all 0.2s; }
        .cover-upload:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }
        .cover-upload svg { width: 28px; height: 28px; }
        .cover-preview { height: 200px; border-radius: var(--radius-lg); background-size: cover; background-position: center; border: 1.5px solid var(--sand); position: relative; }
        .cover-change-btn { position: absolute; right: 12px; top: 12px; padding: 8px 16px; border: none; border-radius: 100px; background: white; color: var(--charcoal); font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-body); box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s; }
        .cover-change-btn:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.2); }

        .logo-row { display: flex; align-items: center; gap: 16px; }
        .logo-wrap { position: relative; width: 80px; height: 80px; border-radius: 50%; background: white; box-shadow: var(--shadow-md); cursor: pointer; flex-shrink: 0; }
        .logo-wrap img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .logo-placeholder { width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, var(--ember), var(--gold)); color: white; font-family: var(--font-display); font-size: 32px; }
        .logo-camera { position: absolute; bottom: 2px; right: 2px; width: 26px; height: 26px; border-radius: 50%; background: var(--ember); border: 2px solid white; display: flex; align-items: center; justify-content: center; }
        .logo-camera svg { width: 12px; height: 12px; color: white; }
        .logo-info h1 { font-family: var(--font-display); font-size: 26px; line-height: 1.1; margin-bottom: 2px; }
        .logo-info p { font-size: 13px; color: var(--charcoal-light); }

        .form-section { margin-bottom: 36px; }
        .form-section h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--sand); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input, .field select, .field textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 14px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; box-sizing: border-box; }
        .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: var(--ember); }

        .section-label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal-mid); margin: 8px 0 10px; }
        .chip-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip-option { padding: 8px 16px; border-radius: 100px; background: white; border: 1.5px solid var(--sand); color: var(--charcoal-light); font-size: 13px; font-weight: 600; font-family: var(--font-body); cursor: pointer; transition: all 0.2s; }
        .chip-option:hover { border-color: var(--ember); color: var(--ember); }
        .chip-option.selected { background: var(--ember-glow); border-color: var(--ember); color: var(--ember); }

        .photos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .photo-item { aspect-ratio: 1 / 1; border-radius: var(--radius-md); background: var(--cream); background-size: cover; background-position: center; border: 1.5px solid var(--sand); position: relative; overflow: hidden; }
        .photo-remove { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s, background 0.2s; }
        .photo-item:hover .photo-remove { opacity: 1; }
        .photo-remove:hover { background: rgba(220,74,26,0.95); }
        .photo-remove svg { width: 13px; height: 13px; }
        .photo-add { aspect-ratio: 1 / 1; border: 2px dashed var(--sand); border-radius: var(--radius-md); background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; color: var(--stone); font-family: var(--font-body); font-size: 12px; font-weight: 600; transition: all 0.2s; }
        .photo-add:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }
        .photo-add svg { width: 22px; height: 22px; }

        .hours-grid { display: flex; flex-direction: column; gap: 8px; }
        .hours-row { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 10px; align-items: center; }
        .hours-row .day-label { font-size: 14px; font-weight: 600; color: var(--charcoal); }
        .hours-row input { padding: 10px 12px; border: 1.5px solid var(--sand); border-radius: var(--radius-sm); font-size: 14px; font-family: var(--font-body); color: var(--charcoal); background: white; }
        .hours-row input:focus { outline: none; border-color: var(--ember); }

        .sb-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 14px 22px; border-radius: 100px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); z-index: 400; }
        .sb-toast svg { width: 18px; height: 18px; color: var(--green); }

        @media (max-width: 768px) { .photos-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; }
          .photos-grid { grid-template-columns: repeat(2, 1fr); }
          .hours-row { grid-template-columns: 60px 1fr 1fr; }
          .logo-wrap { width: 64px; height: 64px; }
          .logo-info h1 { font-size: 20px; }
        }
      `}</style>
    </>
  );
}
