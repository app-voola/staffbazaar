'use client';

import type { WizardData } from './types';

const SHIFTS: { key: WizardData['shift']; label: string; time: string }[] = [
  { key: 'morning', label: 'Morning', time: '7am - 3pm' },
  { key: 'evening', label: 'Evening', time: '3pm - 11pm' },
  { key: 'night', label: 'Night', time: '11pm - 7am' },
  { key: 'split', label: 'Split Shift', time: 'Flexible' },
];

const JOB_TYPES: WizardData['jobType'][] = ['Full-time', 'Part-time', 'Contract'];

export function CompensationStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}) {
  return (
    <div className="step active">
      <div className="step-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h2>Compensation &amp; schedule</h2>
      <p className="step-desc">Set salary, shift timings, and job type</p>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--charcoal-mid)', marginBottom: 8 }}>
        Monthly Salary Range
      </label>
      <div className="salary-row">
        <div className="field">
          <label>Minimum (₹)</label>
          <input
            type="number"
            placeholder="25000"
            value={data.salaryMin}
            onChange={(e) => onChange({ salaryMin: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Maximum (₹)</label>
          <input
            type="number"
            placeholder="45000"
            value={data.salaryMax}
            onChange={(e) => onChange({ salaryMax: e.target.value })}
          />
        </div>
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--charcoal-mid)', marginBottom: 10 }}>
        Shift Type
      </label>
      <div className="shift-grid">
        {SHIFTS.map((s) => (
          <div
            key={s.key}
            className={`shift-card${data.shift === s.key ? ' selected' : ''}`}
            onClick={() => onChange({ shift: s.key })}
          >
            <div className="shift-label">{s.label}</div>
            <div className="shift-time">{s.time}</div>
          </div>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--charcoal-mid)', marginBottom: 10 }}>
        Job Type
      </label>
      <div className="chip-selector">
        {JOB_TYPES.map((t) => (
          <div
            key={t}
            className={`chip-option${data.jobType === t ? ' selected' : ''}`}
            onClick={() => onChange({ jobType: t })}
          >
            {t}
          </div>
        ))}
      </div>

      <div className="toggle-row">
        <label>Tips included?</label>
        <button
          type="button"
          className={`toggle-switch${data.tips ? ' on' : ''}`}
          onClick={() => onChange({ tips: !data.tips })}
        />
      </div>

      <style>{`
        .salary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .shift-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .shift-card { background: white; border: 2px solid var(--sand); border-radius: var(--radius-md); padding: 16px 12px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .shift-card:hover { border-color: var(--charcoal-light); }
        .shift-card.selected { border-color: var(--ember); background: var(--ember-glow); }
        .shift-label { font-size: 13px; font-weight: 700; color: var(--charcoal); }
        .shift-time { font-size: 11px; color: var(--stone); }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--sand); margin-top: 8px; }
        .toggle-row label { font-size: 14px; font-weight: 600; color: var(--charcoal); }
        .toggle-switch { width: 48px; height: 26px; background: var(--sand); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: none; }
        .toggle-switch::after { content: ''; width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: var(--shadow-xs); }
        .toggle-switch.on { background: var(--ember); }
        .toggle-switch.on::after { transform: translateX(22px); }
        @media (max-width: 640px) { .salary-row { grid-template-columns: 1fr; } .shift-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
