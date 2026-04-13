'use client';

export function UnsavedPill({
  show,
  onDiscard,
  onSave,
}: {
  show: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className={`unsaved-pill${show ? ' show' : ''}`}>
      <span className="pill-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Unsaved changes
      </span>
      <button type="button" className="pill-btn discard" onClick={onDiscard}>
        Discard
      </button>
      <button type="button" className="pill-btn save" onClick={onSave}>
        Save
      </button>

      <style>{`
        .unsaved-pill { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(120%); display: flex; align-items: center; gap: 14px; padding: 12px 14px 12px 22px; border-radius: 100px; background: var(--charcoal); color: white; box-shadow: 0 12px 40px rgba(0,0,0,0.25); z-index: 150; opacity: 0; visibility: hidden; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s, visibility 0.25s; font-family: var(--font-body); }
        .unsaved-pill.show { transform: translateX(-50%) translateY(0); opacity: 1; visibility: visible; }
        .pill-text { font-size: 14px; font-weight: 600; color: white; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
        .pill-text svg { width: 16px; height: 16px; color: var(--gold); }
        .pill-btn { padding: 9px 20px; border-radius: 100px; font-size: 13px; font-weight: 700; font-family: var(--font-body); border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .pill-btn.discard { background: transparent; color: #D1D5DB; }
        .pill-btn.discard:hover { color: white; }
        .pill-btn.save { background: var(--ember); color: white; }
        .pill-btn.save:hover { background: #C7421A; transform: scale(1.04); }
        @media (max-width: 640px) { .unsaved-pill { left: 16px; right: 16px; transform: translateY(120%); justify-content: space-between; } .unsaved-pill.show { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
