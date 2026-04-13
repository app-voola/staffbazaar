'use client';

export function PauseJobModal({
  jobTitle,
  open,
  onCancel,
  onConfirm,
}: {
  jobTitle: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card">
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </div>
        <div className="modal-title">Pause {jobTitle}?</div>
        <div className="modal-text">
          Workers will stop seeing it. Your current applicants will still be visible. You can
          resume anytime.
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-btn confirm" onClick={onConfirm}>
            Yes, Pause
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(35,35,35,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-card { background: white; border-radius: 24px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.2); text-align: center; }
        .modal-icon { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: var(--ember-glow); color: var(--ember); }
        .modal-icon svg { width: 30px; height: 30px; }
        .modal-title { font-family: var(--font-display); font-size: 26px; color: var(--charcoal); margin-bottom: 8px; }
        .modal-text { font-size: 14px; color: var(--charcoal-light); margin-bottom: 24px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-btn { flex: 1; padding: 14px; border-radius: 100px; font-size: 14px; font-weight: 700; font-family: var(--font-body); cursor: pointer; border: none; transition: all 0.2s; }
        .modal-btn.cancel { background: var(--cream); color: var(--charcoal); }
        .modal-btn.cancel:hover { background: var(--sand); }
        .modal-btn.confirm { background: var(--ember); color: white; }
        .modal-btn.confirm:hover { background: #C7421A; }
      `}</style>
    </div>
  );
}
