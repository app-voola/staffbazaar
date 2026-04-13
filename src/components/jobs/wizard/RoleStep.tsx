'use client';

import { useState } from 'react';
import type { WizardData } from './types';

const ROLES = [
  'Cooks & Chefs',
  'Bartenders',
  'Waiters & Servers',
  'Kitchen Helpers',
  'Food Runners',
  'Support Staff',
];

const CHEF_SPECS = [
  'North Indian',
  'South Indian',
  'Chinese / Indo-Chinese',
  'Mughlai',
  'Tandoor',
  'Biryani',
  'Continental',
  'Italian / Pizza',
  'Bakery & Desserts',
  'Street Food / Chaat',
  'Sushi / Japanese',
  'Thai',
  'Kebabs & Grills',
  'Bengali',
  'Coastal / Seafood',
];

export function RoleStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}) {
  const [customSpecs, setCustomSpecs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const showSpecs = data.role === 'Cooks & Chefs';

  const toggleSpec = (s: string) => {
    onChange({
      specs: data.specs.includes(s) ? data.specs.filter((x) => x !== s) : [...data.specs, s],
    });
  };

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    setCustomSpecs((prev) => [...prev, v]);
    onChange({ specs: [...data.specs, v] });
    setCustomInput('');
  };

  const allSpecs = [...CHEF_SPECS, ...customSpecs];

  return (
    <div className="step active">
      <div className="step-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
        </svg>
      </div>
      <h2>What role are you hiring for?</h2>
      <p className="step-desc">Select the position you want to fill</p>

      <div className="option-grid role-grid">
        {ROLES.map((r) => (
          <div
            key={r}
            className={`option-card${data.role === r ? ' selected' : ''}`}
            onClick={() => onChange({ role: r, specs: r === data.role ? data.specs : [] })}
          >
            <div className="opt-label">{r}</div>
          </div>
        ))}
      </div>

      {showSpecs && (
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1.5px solid var(--sand)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 4 }}>
            Add cuisine or specialization
          </h3>
          <p className="step-desc" style={{ marginBottom: 16 }}>
            Optional — helps match candidates with the right expertise
          </p>
          <div className="chip-selector">
            {allSpecs.map((s) => (
              <div
                key={s}
                className={`chip-option${data.specs.includes(s) ? ' selected' : ''}`}
                onClick={() => toggleSpec(s)}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Or type a custom specialization..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addCustom}
                style={{
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--charcoal)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add
              </button>
            </div>
          </div>
          {data.specs.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--ember)', fontWeight: 600, marginTop: 8 }}>
              Selected: {data.specs.join(', ')}
            </p>
          )}
        </div>
      )}

      <style>{`.role-grid { grid-template-columns: repeat(3, 1fr); } .role-grid .option-card { padding: 16px 12px; } .role-grid .opt-label { font-size: 13px; } @media (max-width: 640px) { .role-grid { grid-template-columns: 1fr 1fr; } }`}</style>
    </div>
  );
}
