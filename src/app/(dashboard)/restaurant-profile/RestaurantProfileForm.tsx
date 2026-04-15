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
  coverImage: string;
  photos: string[];
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
  coverImage: '',
  photos: [],
};

const MAX_PHOTOS = 3;
const BUCKET = 'restaurant-photos';

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

    const hydrate = (data: Record<string, unknown> | null) => {
      const next: FormState = {
        name: (data?.name as string | null) ?? '',
        type: (data?.type as string | null) ?? 'Casual Dining',
        description: (data?.description as string | null) ?? '',
        address: (data?.address as string | null) ?? '',
        city: (data?.city as string | null) ?? 'Bangalore',
        pin: (data?.pin as string | null) ?? '',
        phone: (data?.phone as string | null) ?? '',
        email: (data?.email as string | null) ?? '',
        website: (data?.website as string | null) ?? '',
        coverImage: (data?.cover_image as string | null) ?? '',
        photos: (data?.photos as string[] | null) ?? [],
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

  const onSave = async () => {
    if (!user) return;
    const row = {
      owner_id: user.id,
      name: form.name,
      type: form.type,
      description: form.description,
      address: form.address,
      city: form.city,
      pin: form.pin,
      phone: form.phone,
      email: form.email,
      website: form.website,
      cover_image: form.coverImage || null,
      photos: form.photos,
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

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadFile(file);
    if (!url || !user) return;
    const { error } = await supabase
      .from('restaurants')
      .upsert(
        { owner_id: user.id, cover_image: url, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' },
      );
    if (error) {
      console.error('[restaurants] cover update failed', error);
      setToast(`Save failed: ${error.message}`);
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setForm((f) => ({ ...f, coverImage: url }));
    setSaved((s) => ({ ...s, coverImage: url }));
    setToast('Cover updated');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (form.photos.length >= MAX_PHOTOS) {
      setToast(`You can add up to ${MAX_PHOTOS} photos`);
      setTimeout(() => setToast(''), 2500);
      return;
    }
    const url = await uploadFile(file);
    if (!url) return;
    const nextPhotos = [...form.photos, url];
    const { error } = await supabase
      .from('restaurants')
      .upsert(
        { owner_id: user.id, photos: nextPhotos, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' },
      );
    if (error) {
      console.error('[restaurants] photos update failed', error);
      setToast(`Save failed: ${error.message}`);
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setForm((f) => ({ ...f, photos: nextPhotos }));
    setSaved((s) => ({ ...s, photos: nextPhotos }));
    setToast('Photo added');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePhotoRemove = async (url: string) => {
    if (!user) return;
    const nextPhotos = form.photos.filter((p) => p !== url);
    const { error } = await supabase
      .from('restaurants')
      .upsert(
        { owner_id: user.id, photos: nextPhotos, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' },
      );
    if (error) {
      console.error('[restaurants] photo remove failed', error);
      return;
    }
    setForm((f) => ({ ...f, photos: nextPhotos }));
    setSaved((s) => ({ ...s, photos: nextPhotos }));
    // Best-effort: delete the underlying object too
    const prefix = `${user.id}/`;
    const key = url.split(prefix)[1];
    if (key) {
      await supabase.storage.from(BUCKET).remove([`${prefix}${key}`]);
    }
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
        <div
          className="cover-banner"
          style={
            form.coverImage
              ? { backgroundImage: `url(${form.coverImage})` }
              : undefined
          }
        >
          {!form.coverImage && <div className="cover-placeholder">Add a cover photo</div>}
          <label className="cover-upload-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {form.coverImage ? 'Change cover' : 'Upload cover'}
            <input type="file" accept="image/*" onChange={handleCoverChange} hidden />
          </label>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '24px 0' }}>
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
            <label>Website</label>
            <input
              value={form.website}
              placeholder="https://..."
              onChange={(e) => update({ website: e.target.value })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Photos</h3>
          <div className="photos-grid">
            {form.photos.map((url) => (
              <div key={url} className="photo-tile" style={{ backgroundImage: `url(${url})` }}>
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => handlePhotoRemove(url)}
                  title="Remove"
                  aria-label="Remove photo"
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoAdd} hidden />
              </label>
            )}
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

        .cover-banner { position: relative; height: 220px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--cream), var(--sand)); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .cover-placeholder { color: var(--charcoal-light); font-size: 14px; font-weight: 600; letter-spacing: 0.3px; }
        .cover-upload-btn { position: absolute; right: 16px; bottom: 16px; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 100px; background: rgba(0,0,0,0.65); color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: background 0.2s; }
        .cover-upload-btn:hover { background: rgba(0,0,0,0.85); }
        .cover-upload-btn svg { width: 16px; height: 16px; }

        .photos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .photo-tile { position: relative; aspect-ratio: 1 / 1; border-radius: var(--radius-md); background: var(--cream); background-size: cover; background-position: center; overflow: hidden; border: 1.5px solid var(--sand); }
        .photo-remove { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; border: none; background: rgba(0,0,0,0.65); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .photo-remove:hover { background: rgba(220,74,26,0.95); }
        .photo-remove svg { width: 13px; height: 13px; }
        .photo-add { aspect-ratio: 1 / 1; border: 2px dashed var(--sand); border-radius: var(--radius-md); background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; color: var(--charcoal-light); font-family: var(--font-body); font-size: 12px; font-weight: 600; transition: all 0.2s; }
        .photo-add:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }
        .photo-add svg { width: 20px; height: 20px; }
        @media (max-width: 640px) { .photos-grid { grid-template-columns: repeat(2, 1fr); } }

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
