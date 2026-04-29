'use client';

import { useState } from 'react';
import type { WizardData } from './types';

interface ShiftPreset {
  label: string;
  time: string;
}

const DEFAULT_SHIFTS: ShiftPreset[] = [
  { label: 'Morning', time: '7am - 3pm' },
  { label: 'Evening', time: '3pm - 11pm' },
  { label: 'Night', time: '11pm - 7am' },
  { label: 'Split Shift', time: 'Flexible' },
];

const JOB_TYPES: WizardData['jobType'][] = ['Full-time', 'Part-time', 'Contract'];

function shiftToString(s: ShiftPreset): string {
  return `${s.label} · ${s.time}`;
}

export function CompensationStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}) {
  const [shifts, setShifts] = useState<ShiftPreset[]>(DEFAULT_SHIFTS);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const startEdit = (idx: number) => setEditingIdx(idx);

  const updateShift = (idx: number, patch: Partial<ShiftPreset>) => {
    setShifts((prev) => {
      const next = prev.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      // If the edited card is currently selected, keep the wizard data in sync
      if (data.shift === shiftToString(prev[idx])) {
        onChange({ shift: shiftToString(next[idx]) });
      }
      return next;
    });
  };

  const finishEdit = () => setEditingIdx(null);

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
        Shift Type <span style={{ color: 'var(--stone)', fontWeight: 500 }}>— click ✎ to edit</span>
      </label>
      <div className="shift-grid">
        {shifts.map((s, idx) => {
          const isEditing = editingIdx === idx;
          const isSelected = data.shift === shiftToString(s);
          return (
            <div
              key={idx}
              className={`shift-card${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`}
              onClick={() => {
                if (isEditing) return;
                onChange({ shift: shiftToString(s) });
              }}
            >
              <button
                type="button"
                className="shift-edit-btn"
                aria-label={isEditing ? 'Save shift' : 'Edit shift'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditing) finishEdit();
                  else startEdit(idx);
                }}
              >
                {isEditing ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                )}
              </button>
              {isEditing ? (
                <>
                  <input
                    className="shift-edit-input shift-edit-label"
                    value={s.label}
                    placeholder="Title"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); finishEdit(); } }}
                    onChange={(e) => updateShift(idx, { label: e.target.value })}
                  />
                  <input
                    className="shift-edit-input shift-edit-time"
                    value={s.time}
                    placeholder="e.g. 7am - 3pm"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); finishEdit(); } }}
                    onChange={(e) => updateShift(idx, { time: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <div className="shift-label">{s.label}</div>
                  <div className="shift-time">{s.time}</div>
                </>
              )}
            </div>
          );
        })}
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
        .shift-card { background: white; border: 2px solid var(--sand); border-radius: var(--radius-md); padding: 18px 12px 14px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
        .shift-card:hover { border-color: var(--charcoal-light); }
        .shift-card.selected { border-color: var(--ember); background: var(--ember-glow); }
        .shift-card.editing { border-color: var(--ember); cursor: default; }
        .shift-label { font-size: 13px; font-weight: 700; color: var(--charcoal); }
        .shift-time { font-size: 11px; color: var(--stone); }
        .shift-edit-btn { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; padding: 0; border-radius: 50%; background: white; border: 1px solid var(--sand); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--charcoal-light); transition: all 0.15s; }
        .shift-edit-btn:hover { color: var(--ember); border-color: var(--ember); }
        .shift-edit-btn svg { width: 11px; height: 11px; }
        .shift-card.editing .shift-edit-btn { background: var(--ember); color: white; border-color: var(--ember); }
        .shift-edit-input { width: 100%; padding: 6px 8px; border: 1px solid var(--sand); border-radius: 6px; font-family: var(--font-body); color: var(--charcoal); background: white; box-sizing: border-box; }
        .shift-edit-input:focus { outline: none; border-color: var(--ember); }
        .shift-edit-label { font-size: 13px; font-weight: 700; }
        .shift-edit-time { font-size: 11px; color: var(--stone); }
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
