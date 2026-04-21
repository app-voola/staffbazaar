'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';

type NotifType = 'application' | 'message' | 'shortlist' | 'hired' | 'job_match' | 'system';
type Category = 'jobs' | 'applications' | 'messages';
type FilterKey = 'all' | Category;

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function categorize(type: NotifType): Category {
  if (type === 'job_match' || type === 'hired') return 'jobs';
  if (type === 'message') return 'messages';
  return 'applications';
}

const CHIP_KEY: Record<Category, 'chip_new_job' | 'chip_message' | 'chip_application'> = {
  jobs: 'chip_new_job',
  messages: 'chip_message',
  applications: 'chip_application',
};

function icon(cat: Category): React.ReactElement {
  if (cat === 'jobs') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (cat === 'messages') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
      <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
      <path d="M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <polyline points="9 14 11 16 15 12" />
    </svg>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${d >= 14 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function NotificationsClient() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      await load();
      if (cancelled) return;
      setLoading(false);
    })();

    const ch = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => categorize(n.type) === filter);
  }, [items, filter]);

  const markRead = async (id: string) => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  return (
    <div className="sb-page-wrap">
      <div className="sb-page-head">
        <div className="sb-page-head-row">
          <h1>
            <em>{t('page_notifications')}</em>
          </h1>
          {unreadCount > 0 && (
            <button type="button" className="mark-all-btn" onClick={markAllRead}>
              {t('btn_mark_all_read')}
            </button>
          )}
        </div>
      </div>

      <div className="notif-tabs">
        <button
          type="button"
          className={`notif-tab${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('tab_all')}
        </button>
        <button
          type="button"
          className={`notif-tab${filter === 'jobs' ? ' active' : ''}`}
          onClick={() => setFilter('jobs')}
        >
          {t('tab_jobs')}
        </button>
        <button
          type="button"
          className={`notif-tab${filter === 'applications' ? ' active' : ''}`}
          onClick={() => setFilter('applications')}
        >
          {t('tab_apps')}
        </button>
        <button
          type="button"
          className={`notif-tab${filter === 'messages' ? ' active' : ''}`}
          onClick={() => setFilter('messages')}
        >
          {t('tab_msgs')}
        </button>
      </div>

      {loading ? (
        <div className="notif-empty visible">
          <p>Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty visible">
          <h3>{t('empty_no_notifs')}</h3>
          <p>{t('empty_no_notifs_sub')}</p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((n) => {
            const cat = categorize(n.type);
            const inner = (
              <>
                <div className={`notif-icon cat-${cat}`}>{icon(cat)}</div>
                <div className="notif-content">
                  <span className={`notif-chip cat-${cat}`}>{t(CHIP_KEY[cat])}</span>
                  <span className="notif-title">{n.title}</span>
                  {n.body && <div className="notif-desc">{n.body}</div>}
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                <div className="notif-dot" />
              </>
            );
            const className = `notif-card${n.read ? '' : ' unread'} cat-${cat}`;
            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                className={className}
                onClick={() => !n.read && markRead(n.id)}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={n.id}
                className={className}
                onClick={() => !n.read && markRead(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !n.read) markRead(n.id);
                }}
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .sb-page-wrap { max-width: 900px; padding-bottom: 80px; }
        .sb-page-head { margin-bottom: 20px; }
        .sb-page-head-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sb-page-head h1 { font-family: var(--font-display); font-size: 32px; }
        .sb-page-head h1 em { color: var(--ember); font-style: italic; }

        .mark-all-btn { background: none; border: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--ember); cursor: pointer; padding: 8px 14px; border-radius: var(--radius-sm); transition: background 0.2s; }
        .mark-all-btn:hover { background: var(--ember-glow); }

        .notif-tabs { display: flex; background: white; border-radius: 100px; border: 1.5px solid var(--sand); overflow: hidden; margin-bottom: 24px; width: fit-content; }
        .notif-tab { padding: 8px 18px; font-size: 13px; font-weight: 600; color: var(--charcoal-light); background: transparent; border: none; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; white-space: nowrap; }
        .notif-tab:hover { color: var(--charcoal); }
        .notif-tab.active { background: var(--charcoal); color: white; }

        .notif-list { display: flex; flex-direction: column; gap: 6px; }
        .notif-card { background: white; border-radius: 10px; padding: 10px 14px 10px 12px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04)); transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; position: relative; text-decoration: none; color: inherit; border-left: 4px solid transparent; }
        .notif-card:hover { transform: translateX(2px); box-shadow: var(--shadow-sm, 0 2px 6px rgba(0,0,0,0.06)); }
        .notif-card.cat-jobs { border-left-color: #10B981; }
        .notif-card.cat-applications { border-left-color: #2563EB; }
        .notif-card.cat-messages { border-left-color: #8B5CF6; }
        .notif-card.unread { background: #FFFBF8; }
        .notif-card.unread .notif-title { font-weight: 700; }

        .notif-dot { position: absolute; top: 50%; right: 14px; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 50%; background: var(--ember); display: none; box-shadow: 0 0 0 3px rgba(220,74,26,0.15); }
        .notif-card.unread .notif-dot { display: block; }

        .notif-chip { display: inline-flex; align-items: center; font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 7px; border-radius: 100px; line-height: 1.3; margin-right: 8px; vertical-align: 1px; }
        .notif-chip.cat-jobs { background: rgba(16,185,129,0.14); color: #047857; }
        .notif-chip.cat-applications { background: rgba(37,99,235,0.14); color: #1E40AF; }
        .notif-chip.cat-messages { background: rgba(139,92,246,0.14); color: #6D28D9; }

        .notif-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; box-shadow: 0 3px 8px -3px currentColor, inset 0 1px 0 rgba(255,255,255,0.22); }
        .notif-icon svg { width: 18px; height: 18px; color: white; }
        .notif-icon.cat-jobs { background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #10B981; }
        .notif-icon.cat-applications { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #2563EB; }
        .notif-icon.cat-messages { background: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%); color: #8B5CF6; }

        .notif-content { flex: 1; min-width: 0; padding-right: 22px; }
        .notif-title { font-size: 13.5px; font-weight: 600; color: var(--charcoal); line-height: 1.35; display: inline; }
        .notif-desc { font-size: 12px; color: var(--charcoal-light); line-height: 1.4; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .notif-time { font-size: 10.5px; color: var(--stone); margin-top: 3px; white-space: nowrap; }

        .notif-empty { text-align: center; padding: 60px 20px; }
        .notif-empty.visible { display: block; }
        .notif-empty h3 { font-size: 18px; color: var(--charcoal); margin-bottom: 4px; font-family: var(--font-display); }
        .notif-empty p { font-size: 14px; color: var(--charcoal-light); }

        @media (max-width: 640px) {
          .notif-tabs { width: 100%; overflow-x: auto; scrollbar-width: none; }
          .notif-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
}
