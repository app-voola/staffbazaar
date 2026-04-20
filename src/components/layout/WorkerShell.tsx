'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { WorkerSidebar } from './WorkerSidebar';

export function WorkerShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="dashboard-layout">
      <div className={open ? 'sidebar-nav-mobile-open' : undefined}>
        <WorkerSidebar onNavigate={() => setOpen(false)} />
      </div>

      {open && (
        <div
          className="sidebar-overlay open"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="mobile-hamburger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <main className="dashboard-main">{children}</main>

      <style>{`
        .mobile-hamburger {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 200;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1.5px solid var(--sand);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .mobile-hamburger svg { width: 22px; height: 22px; color: var(--charcoal); }
        @media (max-width: 968px) {
          .mobile-hamburger { display: flex; }
          .sidebar-nav-mobile-open .sidebar-nav { display: flex !important; z-index: 100; }
          .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 99; }
        }
      `}</style>
    </div>
  );
}
