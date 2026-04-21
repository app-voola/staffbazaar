'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { LanguagePicker } from '@/components/worker/LanguagePicker';
import { WorkStatusCard } from '@/components/worker/WorkStatusCard';
import type { TranslationKey } from '@/lib/worker-translations';

const DashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const HeartIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const BriefcaseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const MessageIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const UserIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const LogoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ReactElement;
}

const mainItems: NavItem[] = [
  { href: '/worker-dashboard', labelKey: 'nav_dashboard', icon: DashboardIcon },
  { href: '/find-jobs', labelKey: 'nav_find_jobs', icon: SearchIcon },
  { href: '/saved-jobs', labelKey: 'nav_saved', icon: HeartIcon },
  { href: '/my-applications', labelKey: 'nav_applications', icon: BriefcaseIcon },
  { href: '/worker-messages', labelKey: 'nav_messages', icon: MessageIcon },
];

const accountItems: NavItem[] = [
  { href: '/worker-profile', labelKey: 'nav_profile', icon: UserIcon },
  { href: '/notifications', labelKey: 'nav_notifications', icon: BellIcon },
];

export function WorkerSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useWorkerI18n();

  const handleLogout = () => {
    onNavigate?.();
    // Intentionally do NOT call supabase.auth.signOut() here.
    // Anonymous workers can't re-authenticate, so signing out would
    // orphan their applications and saved jobs. We just clear the role
    // marker and go back to the login picker; the anon session stays
    // persisted in localStorage so the next "Worker" click resumes as
    // the same auth.uid().
    if (typeof window !== 'undefined') localStorage.removeItem('sb_role');
    window.location.href = '/login';
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="sidebar-nav" id="sidebarNav">
      <Link
        href="/worker-dashboard"
        className="nav-logo"
        style={{ fontSize: 22, textDecoration: 'none' }}
        onClick={onNavigate}
      >
        Staff<em>Bazaar</em>
      </Link>

      <div className="sidebar-nav-section">{t('nav_main')}</div>
      {mainItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-nav-item${isActive(item.href) ? ' active' : ''}`}
          onClick={onNavigate}
        >
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </Link>
      ))}

      <div className="sidebar-nav-section">{t('nav_account')}</div>
      {accountItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-nav-item${isActive(item.href) ? ' active' : ''}`}
          onClick={onNavigate}
        >
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </Link>
      ))}

      <LanguagePicker />
      <WorkStatusCard />

      <a
        href="#"
        className="sidebar-nav-item"
        onClick={(e) => {
          e.preventDefault();
          handleLogout();
        }}
        style={{
          cursor: 'pointer',
          marginTop: 24,
          padding: '12px 14px',
          border: '1.5px solid var(--sand)',
          borderRadius: 12,
          justifyContent: 'center',
        }}
      >
        {LogoutIcon}
        <span>{t('nav_logout')}</span>
      </a>
    </nav>
  );
}
