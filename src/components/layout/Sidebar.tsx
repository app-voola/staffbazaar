'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedStaff } from '@/contexts/SavedStaffContext';
import { useMessages } from '@/contexts/MessagesContext';

const DashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const PostJobIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const BriefcaseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const UsersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const StarIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const MessageIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const StoreIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const UserIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
  </svg>
);
const LoginIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactElement;
  badge?: number;
}

const baseMain: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/post-job', label: 'Post Job', icon: PostJobIcon },
  { href: '/my-jobs', label: 'My Jobs', icon: BriefcaseIcon },
  { href: '/browse-staff', label: 'Browse Staff', icon: UsersIcon },
  { href: '/saved-staff', label: 'Saved Staff', icon: StarIcon },
  { href: '/messages', label: 'Messages', icon: MessageIcon },
];

const settingsItems = [
  { href: '/restaurant-profile', label: 'Restaurant Profile', icon: StoreIcon },
  { href: '/profile', label: 'My Profile', icon: UserIcon },
  { href: '/login', label: 'Log In', icon: LoginIcon },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, restaurant } = useAuth();
  const { count: savedCount } = useSavedStaff();
  const { unreadCount } = useMessages();
  const mainItems: NavItem[] = baseMain.map((item) => {
    if (item.href === '/saved-staff' && savedCount > 0) return { ...item, badge: savedCount };
    if (item.href === '/messages' && unreadCount > 0) return { ...item, badge: unreadCount };
    return item;
  });

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname?.startsWith(href);

  const initial = user?.full_name?.[0]?.toUpperCase() ?? 'R';

  return (
    <nav className="sidebar-nav" id="sidebarNav">
      <Link
        href="/dashboard"
        className="nav-logo"
        style={{ fontSize: 22, textDecoration: 'none' }}
        onClick={onNavigate}
      >
        Staff<em>Bazaar</em>
      </Link>

      <div className="sidebar-nav-section">Main</div>
      {mainItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-nav-item${isActive(item.href) ? ' active' : ''}`}
          onClick={onNavigate}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge ? <span className="sidebar-badge">{item.badge}</span> : null}
        </Link>
      ))}

      <div className="sidebar-nav-section">Settings</div>
      {settingsItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-nav-item${isActive(item.href) ? ' active' : ''}`}
          onClick={onNavigate}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}

      <Link
        href="/profile"
        onClick={onNavigate}
        style={{
          marginTop: 'auto',
          padding: '16px 12px',
          borderTop: '1px solid var(--sand)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(145deg,var(--ember),var(--gold))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
          }}
        >
          {initial}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>
            {user?.full_name?.split(' ')[0] ?? 'Guest'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--stone)' }}>
            {restaurant?.name ?? 'No restaurant'}
          </div>
        </div>
      </Link>
    </nav>
  );
}
