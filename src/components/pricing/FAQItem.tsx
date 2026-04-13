'use client';

import { useState } from 'react';

export function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button type="button" className="faq-question" onClick={() => setOpen((v) => !v)}>
        {q}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="faq-answer">
        <div className="faq-answer-inner">{a}</div>
      </div>

      <style>{`
        .faq-item { border: 1.5px solid var(--sand); border-radius: var(--radius-md); margin-bottom: 10px; overflow: hidden; background: white; }
        .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 600; font-family: var(--font-body); color: var(--charcoal); text-align: left; transition: background 0.2s; }
        .faq-question:hover { background: var(--cream); }
        .faq-question svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--charcoal-light); transition: transform 0.3s; }
        .faq-item.open .faq-question svg { transform: rotate(180deg); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .faq-item.open .faq-answer { max-height: 200px; }
        .faq-answer-inner { padding: 0 20px 18px; font-size: 14px; line-height: 1.7; color: var(--charcoal-mid); }
      `}</style>
    </div>
  );
}
