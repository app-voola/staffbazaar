'use client';

import { useEffect } from 'react';
import type { WizardData } from './types';

const TEMPLATES: Record<string, string> = {
  'Cooks & Chefs': `We are looking for an experienced Chef to join our team.

Responsibilities:
- Plan and prepare dishes
- Supervise kitchen staff
- Maintain hygiene and food safety standards

Requirements:
- Minimum 3 years of cooking experience
- Knowledge of multiple cuisines
- Strong teamwork and time management`,
  Bartenders: `We are hiring a skilled Bartender for our restaurant.

Responsibilities:
- Prepare cocktails and beverages
- Manage bar inventory and supplies
- Provide excellent guest service

Requirements:
- 2+ years of bartending experience
- Knowledge of mixology
- Good communication skills`,
  'Waiters & Servers': `We are looking for a friendly and attentive Waiter to join our service team.

Responsibilities:
- Take orders and serve food
- Provide menu recommendations
- Ensure guest satisfaction

Requirements:
- Prior experience in restaurants
- Polite and well-groomed
- Knowledge of basic English and Hindi`,
  'Kitchen Helpers': `We are hiring a Kitchen Helper to support our kitchen team.

Responsibilities:
- Wash and prep ingredients
- Keep kitchen clean and organized
- Assist chefs with daily tasks

Requirements:
- Hardworking and reliable
- Willing to learn
- Training will be provided`,
  'Food Runners': `We need active Food Runners to join our service team.

Responsibilities:
- Deliver dishes from kitchen to tables
- Ensure plates are presented well
- Communicate with chefs and waiters

Requirements:
- Good stamina
- Punctual and team-oriented`,
  'Support Staff': `We are hiring Support Staff for our restaurant.

Responsibilities:
- Assist with cleaning and dishwashing
- Help maintain a tidy work area
- Support kitchen and service teams as needed

Requirements:
- Reliable and hardworking
- No prior experience needed`,
};

export function DescriptionStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}) {
  useEffect(() => {
    if (data.role && !data.description.trim() && TEMPLATES[data.role]) {
      onChange({ description: TEMPLATES[data.role] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.role]);

  const wordCount = data.description.trim() ? data.description.trim().split(/\s+/).length : 0;

  return (
    <div className="step active">
      <div className="step-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <h2>Job description</h2>
      <p className="step-desc">We&apos;ve pre-filled a template. Edit it to match your needs.</p>
      <div className="field">
        <label>Description</label>
        <textarea
          rows={12}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          style={{ resize: 'vertical', lineHeight: 1.7 }}
        />
        <div style={{ fontSize: 12, color: 'var(--stone)', textAlign: 'right', marginTop: 4 }}>
          {wordCount} words {wordCount < 30 && <span style={{ color: '#DC2626' }}>(min 30)</span>}
        </div>
      </div>
    </div>
  );
}
