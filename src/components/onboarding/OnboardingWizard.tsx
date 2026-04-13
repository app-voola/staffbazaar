'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingData {
  name: string;
  type: string;
  city: string;
  area: string;
  address: string;
  pin: string;
  cuisines: string[];
  capacity: string;
  openTime: string;
  closeTime: string;
  fssai: string;
  gst: string;
}

const INITIAL: OnboardingData = {
  name: '',
  type: '',
  city: '',
  area: '',
  address: '',
  pin: '',
  cuisines: [],
  capacity: '',
  openTime: '11:00',
  closeTime: '23:00',
  fssai: '',
  gst: '',
};

const TYPES = ['Fine Dining', 'Casual Dining', 'QSR / Fast Food', 'Cafe', 'Bar & Lounge', 'Cloud Kitchen', 'Catering'];
const CITIES = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa', 'Chandigarh', 'Lucknow', 'Kochi', 'Indore'];
const CUISINES = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Continental', 'Mughlai', 'Street Food', 'Biryani', 'Seafood', 'Pan-Asian', 'Tandoor', 'Desserts & Bakery', 'Beverages & Bar'];

const TITLES = ['', 'Business Name & Type', 'Location', 'Cuisine & Details', 'Photos & Branding', 'All Done!'];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL);

  const update = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }));
  const toggleCuisine = (c: string) =>
    update({ cuisines: data.cuisines.includes(c) ? data.cuisines.filter((x) => x !== c) : [...data.cuisines, c] });

  const canContinue = () => {
    if (step === 1) return Boolean(data.name && data.type);
    if (step === 2) return Boolean(data.city && data.area && data.address && data.pin.length === 6);
    if (step === 3) return data.cuisines.length > 0 && Boolean(data.capacity);
    return true;
  };

  return (
    <>
      <div className="progress-wrap" style={{ paddingTop: 24 }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
        <div className="progress-label">
          <span>
            Step <strong>{step}</strong> of <strong>5</strong>
          </span>
          <span>{TITLES[step]}</span>
        </div>
      </div>

      <div className="wizard">
        {step === 1 && (
          <div className="step active">
            <h2>Your restaurant details</h2>
            <p className="step-desc">Tell us about your business</p>
            <div className="field">
              <label>Restaurant Name</label>
              <input
                type="text"
                placeholder="e.g. Spice Garden"
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Type of Restaurant</label>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {TYPES.map((t) => (
                <div
                  key={t}
                  className={`option-card${data.type === t ? ' selected' : ''}`}
                  onClick={() => update({ type: t })}
                >
                  <div className="opt-label">{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step active">
            <h2>Where are you located?</h2>
            <p className="step-desc">Help staff in your area find you</p>
            <div className="field">
              <label>City</label>
              <select value={data.city} onChange={(e) => update({ city: e.target.value })}>
                <option value="">Select your city</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Area / Locality</label>
              <input
                type="text"
                placeholder="e.g. Koramangala"
                value={data.area}
                onChange={(e) => update({ area: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Full Address</label>
              <textarea
                rows={3}
                value={data.address}
                onChange={(e) => update({ address: e.target.value })}
              />
            </div>
            <div className="field">
              <label>PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={data.pin}
                onChange={(e) => update({ pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step active">
            <h2>Cuisine &amp; operations</h2>
            <p className="step-desc">What do you serve and when?</p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Cuisines (select all)</label>
            <div className="chip-selector">
              {CUISINES.map((c) => (
                <div
                  key={c}
                  className={`chip-option${data.cuisines.includes(c) ? ' selected' : ''}`}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="field">
              <label>Seating Capacity</label>
              <input
                type="number"
                placeholder="e.g. 60"
                value={data.capacity}
                onChange={(e) => update({ capacity: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label>Opening Time</label>
                <input type="time" value={data.openTime} onChange={(e) => update({ openTime: e.target.value })} />
              </div>
              <div className="field">
                <label>Closing Time</label>
                <input type="time" value={data.closeTime} onChange={(e) => update({ closeTime: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step active">
            <h2>Photos &amp; branding</h2>
            <p className="step-desc">Optional for now</p>
            <div className="field">
              <label>FSSAI License Number</label>
              <input
                type="text"
                placeholder="14-digit FSSAI number"
                value={data.fssai}
                onChange={(e) => update({ fssai: e.target.value })}
              />
            </div>
            <div className="field">
              <label>GST Number (optional)</label>
              <input type="text" value={data.gst} onChange={(e) => update({ gst: e.target.value })} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="success-screen">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Your restaurant is set up!</h2>
            <p>{data.name || 'Spice Garden'} is now live on StaffBazaar.</p>
            <button
              type="button"
              className="btn-next"
              style={{ display: 'inline-flex', padding: '14px 36px', flex: 'none' }}
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="bottom-bar">
          <div className="bottom-inner">
            <button
              type="button"
              className={`btn-back${step === 1 ? ' hidden' : ''}`}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="btn-next"
              disabled={!canContinue()}
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              style={{ opacity: canContinue() ? 1 : 0.5 }}
            >
              {step === 4 ? 'Finish Setup' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
