'use client';

export function HireConfirmModal({
  name,
  open,
  onCancel,
  onConfirm,
}: {
  name: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content" style={{ maxWidth: 420, textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', padding: 32, position: 'relative' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--green-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '8px auto 16px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="2.5" style={{ width: 32, height: 32 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>
          Hire {name}?
        </div>
        <div style={{ fontSize: 14, color: 'var(--charcoal-light)', marginBottom: 24 }}>
          This job will close automatically once you confirm the hire.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              border: '1.5px solid var(--sand)',
              color: 'var(--charcoal)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '12px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--green)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Yes, Hire
          </button>
        </div>
      </div>
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 20px; }
      `}</style>
    </div>
  );
}
