'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';
import { translateText } from '@/lib/translate-text';

interface Conversation {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
  initials: string | null;
  last_message: string | null;
  time: string | null;
  unread: number;
  updated_at: string;
  owner_id: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  from_me: boolean;
  text: string;
  created_at: string;
}

type ConvFilter = 'all' | 'unread';

const QUICK_REPLY_KEYS = ['qr_interested', 'qr_when_visit', 'qr_start_now', 'qr_thank_you'] as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function WorkerMessagesClient() {
  const { user } = useAuth();
  const { t, lang } = useWorkerI18n();
  // cache: key = `${messageId}:${targetLang}` → translated text
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  const [translationPending, setTranslationPending] = useState<Set<string>>(new Set());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConvFilter>('all');
  const [applicationsCount, setApplicationsCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  const backfillConversations = async () => {
    if (!user) return;
    const { data: apps } = await supabase
      .from('applicants')
      .select('job_id, role, jobs(id, role, owner_id)')
      .eq('worker_id', user.id);

    const rows = (apps ?? []) as unknown as Array<{
      job_id: string;
      role: string;
      jobs: { id: string; role: string; owner_id: string } | null;
    }>;

    const ownerIds = Array.from(new Set(rows.map((r) => r.jobs?.owner_id).filter((v): v is string => !!v)));
    if (ownerIds.length === 0) return;

    const { data: rests } = await supabase
      .from('restaurants')
      .select('owner_id, name, cover_image')
      .in('owner_id', ownerIds);
    const restMap: Record<string, { name: string; cover_image: string | null }> = {};
    (rests ?? []).forEach((r: { owner_id: string; name: string; cover_image: string | null }) => {
      restMap[r.owner_id] = { name: r.name, cover_image: r.cover_image };
    });

    const { data: existing } = await supabase
      .from('conversations')
      .select('owner_id')
      .eq('worker_id', user.id);
    const existingOwners = new Set((existing ?? []).map((c: { owner_id: string | null }) => c.owner_id));

    const workerName = user.full_name && user.full_name !== 'Owner' ? user.full_name : 'Worker';
    const missing = rows
      .filter((r) => r.jobs && !existingOwners.has(r.jobs.owner_id))
      .filter((r, i, self) => self.findIndex((x) => x.jobs?.owner_id === r.jobs?.owner_id) === i);

    // Clean any duplicate welcome messages, then make sure each conversation has exactly one
    const existingConvs = (existing ?? []) as Array<{ owner_id: string | null }>;
    for (const c of existingConvs) {
      if (!c.owner_id) continue;
      const convId = `conv-${user.id}-${c.owner_id}`;
      const welcomeId = `${convId}-welcome`;

      // Remove any stale welcome messages with legacy ID pattern (welcome-<timestamp>)
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', convId)
        .eq('from_me', true)
        .like('id', `${convId}-welcome-%`);

      // Check if the canonical welcome already exists
      const { data: alreadyHas } = await supabase
        .from('messages')
        .select('id')
        .eq('id', welcomeId)
        .maybeSingle();
      if (alreadyHas) continue;

      const matchingApp = rows.find((r) => r.jobs?.owner_id === c.owner_id);
      const role = matchingApp?.role ?? 'role';
      const rest = restMap[c.owner_id];
      const name = rest?.name ?? 'Restaurant';
      const welcomeText = `Thanks for your interest in the ${role} role at ${name}. We will review your application and get back to you shortly.`;
      await supabase.from('messages').insert({
        id: welcomeId,
        conversation_id: convId,
        from_me: true,
        text: welcomeText,
        time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      });
      await supabase
        .from('conversations')
        .update({ last_message: welcomeText, updated_at: new Date().toISOString() })
        .eq('id', convId);
    }

    for (const r of missing) {
      if (!r.jobs) continue;
      const rest = restMap[r.jobs.owner_id];
      const name = rest?.name ?? 'Restaurant';
      const convId = `conv-${user.id}-${r.jobs.owner_id}`;
      const welcomeText = `Thanks for your interest in the ${r.role} role at ${name}. We will review your application and get back to you shortly.`;
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      await supabase.from('conversations').insert({
        id: convId,
        worker_id: user.id,
        owner_id: r.jobs.owner_id,
        name,
        role: r.role,
        avatar: rest?.cover_image ?? null,
        initials: name[0]?.toUpperCase() ?? 'R',
        last_message: welcomeText,
        time: timeStr,
        unread: 1,
        type: 'active',
      });
      const now = Date.now();
      await supabase.from('messages').insert([
        {
          id: `${convId}-${now}`,
          conversation_id: convId,
          from_me: false,
          text: `${workerName} applied for ${r.role}`,
          time: timeStr,
        },
        {
          id: `${convId}-${now + 1}`,
          conversation_id: convId,
          from_me: true,
          text: welcomeText,
          time: timeStr,
        },
      ]);
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    const [convRes, appsRes] = await Promise.all([
      supabase
        .from('conversations')
        .select('id, name, role, avatar, initials, last_message, time, unread, updated_at, owner_id')
        .eq('worker_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase.from('applicants').select('id', { count: 'exact', head: true }).eq('worker_id', user.id),
    ]);
    setConversations((convRes.data ?? []) as Conversation[]);
    setApplicationsCount(appsRes.count ?? 0);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, from_me, text, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      await backfillConversations();
      if (cancelled) return;
      await loadConversations();
      if (cancelled) return;
      setLoading(false);
    })();

    const ch = supabase
      .channel(`worker-messages-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `worker_id=eq.${user.id}` }, () => loadConversations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants', filter: `worker_id=eq.${user.id}` }, () => loadConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        if (m.conversation_id === activeIdRef.current) {
          setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
        }
        loadConversations();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (!activeId) {
      setMessages([]);
      return;
    }
    loadMessages(activeId);
    if (user) {
      supabase.from('conversations').update({ unread: 0 }).eq('id', activeId).eq('worker_id', user.id).then(() => {});
    }
  }, [activeId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filtered = useMemo(() => {
    if (filter === 'unread') return conversations.filter((c) => c.unread > 0);
    return conversations;
  }, [conversations, filter]);

  // Refs so the effect doesn't cancel itself on every cache update
  const cacheRef = useRef<Record<string, string>>({});
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    cacheRef.current = translationCache;
  }, [translationCache]);
  useEffect(() => {
    pendingRef.current = translationPending;
  }, [translationPending]);

  // Auto-translate all messages when the language is not English
  useEffect(() => {
    if (lang === 'en' || messages.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const m of messages) {
        if (cancelled) return;
        if (!m.text.trim()) continue;
        const key = `${m.id}:${lang}`;
        if (cacheRef.current[key] !== undefined || pendingRef.current.has(key)) continue;

        pendingRef.current = new Set(pendingRef.current).add(key);
        setTranslationPending(new Set(pendingRef.current));

        try {
          const translated = await translateText(m.text, lang);
          if (cancelled) return;
          cacheRef.current = { ...cacheRef.current, [key]: translated };
          setTranslationCache({ ...cacheRef.current });
        } catch {
          if (cancelled) return;
          cacheRef.current = { ...cacheRef.current, [key]: m.text };
          setTranslationCache({ ...cacheRef.current });
        } finally {
          const next = new Set(pendingRef.current);
          next.delete(key);
          pendingRef.current = next;
          if (!cancelled) setTranslationPending(next);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messages, lang]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeConv || !user) return;
    setDraft('');
    const id = `${activeConv.id}-${Date.now()}`;
    const msg: Message = {
      id,
      conversation_id: activeConv.id,
      from_me: false,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, msg]);
    await supabase.from('messages').insert({ id, conversation_id: activeConv.id, from_me: false, text });

    // Increment unread so the owner's sidebar badge lights up on their end
    const { data: convRow } = await supabase
      .from('conversations')
      .select('unread')
      .eq('id', activeConv.id)
      .maybeSingle();
    const nextUnread = (convRow?.unread ?? 0) + 1;

    await supabase
      .from('conversations')
      .update({
        last_message: text,
        time: formatTime(new Date().toISOString()),
        unread: nextUnread,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeConv.id);
  };

  return (
    <div className="messages-layout">
      {/* Left panel */}
      <div className="conv-panel">
        <div className="conv-header">
          <h2>{t('page_messages')}</h2>
          <div className="conv-tabs">
            <button
              type="button"
              className={`conv-tab${filter === 'all' ? ' active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('tab_all')}
            </button>
            <button
              type="button"
              className={`conv-tab${filter === 'unread' ? ' active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              {t('tab_unread')}
            </button>
          </div>
        </div>

        {applicationsCount === 0 && (
          <div className="msg-gate-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              <strong>{t('gate_banner_title')}</strong> {t('gate_banner_sub')}
            </span>
          </div>
        )}

        <div className="conv-list chat-list">
          {loading ? (
            <div className="conv-empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="conv-empty">
              <strong>{filter === 'unread' ? t('empty_no_unread_title') : t('empty_no_messages_title')}</strong>
              <span>
                {filter === 'unread' ? t('empty_no_unread_sub') : t('empty_no_messages_sub')}
              </span>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className={`chat-item${c.unread > 0 ? ' unread' : ''}${c.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveId(c.id);
                }}
              >
                <div className="chat-avatar">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt={c.name} />
                  ) : (
                    <span>{c.initials ?? (c.name?.[0] ?? 'R').toUpperCase()}</span>
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-name">{c.name}</div>
                  <div className="chat-last-message">{c.last_message ?? 'New conversation'}</div>
                </div>
                <div className="chat-meta">
                  <span className="chat-time">{c.time ?? formatShortTime(c.updated_at)}</span>
                  {c.unread > 0 && <span className="chat-unread-badge">{c.unread}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className={`thread-panel${activeConv ? ' open' : ''}`}>
        {!activeConv ? (
          <div className="empty-thread">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>{t('empty_thread_pick')}</p>
          </div>
        ) : (
          <>
            <div className="thread-header">
              <button type="button" className="back-to-list" onClick={() => setActiveId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div className="chat-avatar">
                {activeConv.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeConv.avatar} alt={activeConv.name} />
                ) : (
                  <span>{activeConv.initials ?? (activeConv.name[0] ?? 'R').toUpperCase()}</span>
                )}
              </div>
              <div className="thread-header-info">
                <span className="name">{activeConv.name}</span>
                {activeConv.role && <span className="role-badge">{activeConv.role}</span>}
                <div className="status-text">{t('online_status')}</div>
              </div>
            </div>

            <div className="quick-replies">
              {QUICK_REPLY_KEYS.map((k) => {
                const text = t(k);
                return (
                  <button
                    key={k}
                    type="button"
                    className="quick-reply"
                    onClick={() => setDraft(text)}
                  >
                    {text}
                  </button>
                );
              })}
            </div>

            <div className="chat-thread">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--stone)', padding: 24, fontSize: 13 }}>
                  {t('msg_say_hello')}
                </div>
              ) : (
                messages.map((m) => {
                  const cacheKey = `${m.id}:${lang}`;
                  const cached = translationCache[cacheKey];
                  const isPending = translationPending.has(cacheKey);
                  const displayText = lang === 'en' ? m.text : cached ?? m.text;
                  return (
                    <div key={m.id} className={`chat-bubble ${m.from_me ? 'received' : 'sent'}`}>
                      <p>{displayText}</p>
                      <div className="bubble-meta">
                        <span className="bubble-time">{formatTime(m.created_at)}</span>
                        {isPending && <span className="bubble-translating">{t('msg_translating')}</span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                type="text"
                placeholder={t('msg_placeholder')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="chat-send-btn" disabled={!draft.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .messages-layout { display: flex; height: calc(100vh); overflow: hidden; margin: -32px; }
        @media (max-width: 968px) { .messages-layout { margin: 0; } }
        .conv-panel { width: 360px; border-right: 1px solid var(--sand); background: white; display: flex; flex-direction: column; flex-shrink: 0; }
        .conv-header { padding: 20px 20px 12px; border-bottom: 1px solid var(--sand); }
        .conv-header h2 { font-family: var(--font-display); font-size: 24px; margin-bottom: 12px; }
        .conv-tabs { display: flex; gap: 4px; }
        .conv-tab { padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; color: var(--charcoal-light); background: transparent; border: 1.5px solid var(--sand); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .conv-tab:hover { border-color: var(--charcoal-light); }
        .conv-tab.active { background: var(--charcoal); color: white; border-color: var(--charcoal); }

        .msg-gate-banner { display: flex; gap: 10px; padding: 12px 16px; background: rgba(245,158,11,0.10); border-bottom: 1px solid rgba(245,158,11,0.25); font-size: 12px; color: var(--charcoal); line-height: 1.4; align-items: flex-start; }
        .msg-gate-banner svg { width: 16px; height: 16px; color: #B45309; flex-shrink: 0; margin-top: 1px; }
        .msg-gate-banner strong { color: var(--charcoal); display: block; margin-bottom: 2px; }

        .conv-list { flex: 1; overflow-y: auto; }
        .conv-empty { padding: 40px 20px; text-align: center; color: var(--charcoal-light); font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
        .conv-empty strong { color: var(--charcoal); font-family: var(--font-display); font-size: 18px; }

        .chat-item { display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--sand); cursor: pointer; transition: background 0.15s; font-family: var(--font-body); }
        .chat-item:hover { background: var(--cream); }
        .chat-item.active { background: var(--ember-glow); }
        .chat-item.unread { background: #FFFBF8; }
        .chat-item.unread.active { background: var(--ember-glow); }

        .chat-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(145deg,var(--ember),var(--gold)); color: white; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 15px; flex-shrink: 0; overflow: hidden; }
        .chat-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: 700; font-size: 14px; color: var(--charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-last-message { font-size: 13px; color: var(--charcoal-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .chat-item.unread .chat-last-message { color: var(--charcoal); font-weight: 600; }

        .chat-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .chat-time { font-size: 11px; color: var(--stone); white-space: nowrap; }
        .chat-unread-badge { background: var(--ember); color: white; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 100px; min-width: 20px; text-align: center; }

        .thread-panel { flex: 1; display: flex; flex-direction: column; background: var(--warm-white, #FAF8F5); }
        .empty-thread { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--stone); gap: 12px; }
        .empty-thread svg { width: 48px; height: 48px; }
        .empty-thread p { font-size: 15px; font-weight: 600; }

        .thread-header { display: flex; align-items: center; gap: 14px; padding: 14px 20px; background: white; border-bottom: 1px solid var(--sand); }
        .thread-header .chat-avatar { width: 40px; height: 40px; font-size: 15px; }
        .thread-header-info { flex: 1; min-width: 0; }
        .thread-header-info .name { font-size: 15px; font-weight: 700; color: var(--charcoal); display: block; }
        .thread-header-info .role-badge { display: inline-block; font-size: 11px; font-weight: 700; color: var(--ember); background: var(--ember-glow); padding: 2px 8px; border-radius: 100px; margin-top: 2px; }
        .thread-header-info .status-text { font-size: 11px; color: var(--green, #059669); margin-top: 2px; }

        .back-to-list { display: none; padding: 8px 12px 8px 0; font-size: 13px; font-weight: 600; color: var(--ember); background: none; border: none; cursor: pointer; font-family: var(--font-body); align-items: center; gap: 4px; }
        .back-to-list svg { width: 16px; height: 16px; }

        .quick-replies { display: flex; gap: 8px; padding: 12px 20px; overflow-x: auto; background: white; border-bottom: 1px solid var(--sand); }
        .quick-reply { padding: 8px 14px; border-radius: 100px; background: var(--cream); border: 1px solid var(--sand); font-size: 12px; font-weight: 600; color: var(--charcoal); cursor: pointer; font-family: var(--font-body); white-space: nowrap; flex-shrink: 0; transition: all 0.2s; }
        .quick-reply:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }

        .chat-thread { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .chat-bubble { max-width: 72%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.4; }
        .chat-bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
        .bubble-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .bubble-time { font-size: 10px; opacity: 0.7; }
        .bubble-translating { font-size: 10px; opacity: 0.7; font-style: italic; }
        .bubble-translate-btn { background: none; border: none; padding: 0; font-size: 11px; font-weight: 600; color: inherit; opacity: 0.8; cursor: pointer; font-family: var(--font-body); text-decoration: underline; }
        .bubble-translate-btn:hover { opacity: 1; }
        .chat-bubble.sent { align-self: flex-end; background: var(--ember); color: white; border-bottom-right-radius: 4px; }
        .chat-bubble.received { align-self: flex-start; background: white; color: var(--charcoal); border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .chat-bubble.received .bubble-translate-btn { color: var(--ember); opacity: 1; }

        .chat-input-bar { display: flex; gap: 8px; padding: 14px 20px; background: white; border-top: 1px solid var(--sand); }
        .chat-input-bar input { flex: 1; padding: 12px 16px; border: 1.5px solid var(--sand); border-radius: 100px; background: var(--cream); font-size: 14px; font-family: var(--font-body); color: var(--charcoal); }
        .chat-input-bar input:focus { outline: none; border-color: var(--ember); background: white; }
        .chat-send-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--ember); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chat-send-btn:disabled { opacity: 0.4; cursor: default; }
        .chat-send-btn svg { width: 18px; height: 18px; }

        @media (max-width: 768px) {
          .conv-panel { width: 100%; }
          .thread-panel { display: none; position: absolute; inset: 0; z-index: 50; }
          .thread-panel.open { display: flex; }
          .messages-layout { position: relative; }
          .back-to-list { display: flex; }
        }
      `}</style>
    </div>
  );
}
