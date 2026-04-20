'use client';

import { useEffect, useState } from 'react';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { LANGS, type LangCode } from '@/lib/worker-translations';

export function LanguagePicker() {
  const { lang, setLang, t } = useWorkerI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const pick = (code: LangCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="sb-lang-trigger" onClick={() => setOpen(true)}>
        <span className="sb-lang-trigger-glyph">{current.glyph}</span>
        <span className="sb-lang-trigger-label">{current.label}</span>
        <span className="sb-lang-trigger-caret">▾</span>
      </button>

      {open && (
        <div
          className="sb-lang-modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="sb-lang-modal" role="dialog" aria-modal="true">
            <div className="sb-lang-modal-header">
              <div>
                <h3 className="sb-lang-modal-title">{t('lang_modal_title')}</h3>
                <p className="sb-lang-modal-subtitle">{t('lang_modal_sub')}</p>
              </div>
              <button
                type="button"
                className="sb-lang-modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="sb-lang-grid">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`sb-lang-card${l.code === lang ? ' active' : ''}`}
                  onClick={() => pick(l.code)}
                >
                  <span className="sb-lang-card-glyph">{l.glyph}</span>
                  <span className="sb-lang-card-label">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sb-lang-trigger { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; margin-top: 12px; background: white; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-family: var(--font-body); color: var(--charcoal); cursor: pointer; text-align: left; transition: border-color 0.2s; }
        .sb-lang-trigger:hover { border-color: var(--ember); }
        .sb-lang-trigger-glyph { font-size: 22px; font-weight: 700; line-height: 1; width: 28px; text-align: center; color: var(--ember); }
        .sb-lang-trigger-label { flex: 1; font-size: 14px; font-weight: 600; }
        .sb-lang-trigger-caret { font-size: 14px; color: var(--stone); }

        .sb-lang-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: none; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
        .sb-lang-modal-overlay.open { display: flex; }
        .sb-lang-modal { background: white; border-radius: 16px; width: 100%; max-width: 380px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .sb-lang-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 20px 8px; }
        .sb-lang-modal-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--charcoal); margin: 0 0 4px; }
        .sb-lang-modal-subtitle { font-size: 13px; color: var(--stone); margin: 0; }
        .sb-lang-modal-close { background: transparent; border: none; font-size: 24px; color: var(--stone); cursor: pointer; line-height: 1; padding: 0 4px; }

        .sb-lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px 20px 20px; }
        .sb-lang-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; aspect-ratio: 1 / 1; background: #f7f5f2; border: 2px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.15s; padding: 12px; font-family: var(--font-body); }
        .sb-lang-card:hover { background: #efebe5; }
        .sb-lang-card.active { border-color: var(--ember); background: white; }
        .sb-lang-card-glyph { font-size: 38px; font-weight: 700; line-height: 1; color: var(--charcoal); }
        .sb-lang-card-label { font-size: 13px; font-weight: 600; color: var(--stone); }
        .sb-lang-card.active .sb-lang-card-label { color: var(--ember); }
      `}</style>
    </>
  );
}
