'use client';

import { useMemo, useState } from 'react';
import { useMessages } from '@/contexts/MessagesContext';
import { useApplicants } from '@/contexts/ApplicantsContext';
import { ConversationItem } from '@/components/messages/ConversationItem';
import { ChatThread } from '@/components/messages/ChatThread';

type Tab = 'all' | 'active' | 'hired';

export default function MessagesPage() {
  const { conversations, send, markRead, startChat } = useMessages();
  const { applicants } = useApplicants();
  const [tab, setTab] = useState<Tab>('all');
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [search, setSearch] = useState('');

  const visible = conversations.filter((c) => tab === 'all' || c.type === tab);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return applicants
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.role ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [applicants, search]);

  const open = (id: string) => {
    setActiveId(id);
    setThreadOpen(true);
    markRead(id);
  };

  const handlePick = async (applicantId: string) => {
    const applicant = applicants.find((a) => a.id === applicantId);
    if (!applicant) return;
    try {
      const convId = await startChat({
        id: `applicant-${applicant.id}`,
        name: applicant.name,
        role: applicant.role,
        avatar: applicant.avatar,
        initials: applicant.initials,
        workerId: applicant.workerId,
      });
      setSearch('');
      setActiveId(convId);
      setThreadOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="messages-layout">
      <div className="conv-panel">
        <div className="conv-header">
          <h2>Messages</h2>

          <div className="search-wrap">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search applicants to chat…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            {search && (
              <div className="suggest-dropdown">
                {suggestions.length === 0 ? (
                  <div className="suggest-empty">No applicants match &ldquo;{search}&rdquo;</div>
                ) : (
                  suggestions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="suggest-item"
                      onClick={() => handlePick(a.id)}
                    >
                      <div className="suggest-avatar">
                        {a.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatar} alt={a.name} />
                        ) : (
                          <span>{a.initials}</span>
                        )}
                      </div>
                      <div className="suggest-body">
                        <div className="suggest-name">{a.name}</div>
                        <div className="suggest-role">
                          {a.role}
                          {a.experience ? ` · ${a.experience} yrs` : ''}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="conv-tabs">
            {(['all', 'active', 'hired'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`conv-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'all' ? 'All' : t === 'active' ? 'Active Candidates' : 'Hired'}
              </button>
            ))}
          </div>
        </div>

        <div className="conv-list chat-list">
          {visible.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--stone)', fontSize: 14 }}>
              No conversations
            </div>
          ) : (
            visible.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={activeId === c.id}
                onClick={() => open(c.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className={`thread-panel${threadOpen ? ' open' : ''}`}>
        {active ? (
          <ChatThread
            conv={active}
            onSend={(text) => send(active.id, text)}
            onBack={() => setThreadOpen(false)}
          />
        ) : (
          <div className="empty-thread">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Select a conversation</p>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-main { min-width: 0 !important; overflow-x: hidden; }
        .messages-layout { display: flex; height: 100vh; overflow: hidden; margin: -32px; min-width: 0; max-width: calc(100% + 64px); }
        .conv-panel { width: 360px; border-right: 1px solid var(--sand); background: white; display: flex; flex-direction: column; flex-shrink: 0; min-width: 0; }
        .conv-header { padding: 20px 20px 12px; border-bottom: 1px solid var(--sand); }
        .conv-header h2 { font-family: var(--font-display); font-size: 24px; margin-bottom: 12px; }

        .search-wrap { position: relative; margin-bottom: 12px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--stone); pointer-events: none; }
        .search-input { width: 100%; padding: 10px 36px 10px 38px; border: 1.5px solid var(--sand); border-radius: 100px; background: var(--cream); font-size: 14px; font-family: var(--font-body); color: var(--charcoal); transition: all 0.2s; box-sizing: border-box; }
        .search-input:focus { outline: none; border-color: var(--ember); background: white; }
        .search-input::placeholder { color: var(--stone); }
        .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; border: none; background: var(--sand); color: var(--charcoal); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .search-clear svg { width: 12px; height: 12px; }
        .search-clear:hover { background: var(--charcoal-light); color: white; }

        .suggest-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: white; border: 1px solid var(--sand); border-radius: var(--radius-md); box-shadow: var(--shadow-md); max-height: 320px; overflow-y: auto; z-index: 40; padding: 6px; }
        .suggest-empty { padding: 16px; text-align: center; color: var(--stone); font-size: 13px; }
        .suggest-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); background: transparent; border: none; cursor: pointer; text-align: left; font-family: var(--font-body); transition: background 0.15s; }
        .suggest-item:hover { background: var(--ember-glow); }
        .suggest-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(145deg, var(--ember), var(--gold)); display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-display); font-size: 13px; flex-shrink: 0; overflow: hidden; }
        .suggest-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .suggest-body { flex: 1; min-width: 0; }
        .suggest-name { font-size: 13px; font-weight: 700; color: var(--charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .suggest-role { font-size: 11px; color: var(--charcoal-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .conv-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .conv-tab { padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; color: var(--charcoal-light); background: transparent; border: 1.5px solid var(--sand); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .conv-tab:hover { border-color: var(--charcoal-light); }
        .conv-tab.active { background: var(--charcoal); color: white; border-color: var(--charcoal); }
        .conv-list { flex: 1; overflow-y: auto; }
        .thread-panel { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--warm-white); overflow: hidden; }
        .thread-panel .chat-thread { min-width: 0; max-width: 100%; box-sizing: border-box; }
        .thread-panel .chat-bubble { word-break: break-word; overflow-wrap: anywhere; max-width: 75%; box-sizing: border-box; }
        .empty-thread { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--stone); gap: 12px; }
        .empty-thread svg { width: 48px; height: 48px; }
        .empty-thread p { font-size: 15px; font-weight: 600; }

        @media (max-width: 768px) {
          .conv-panel { width: 100%; }
          .thread-panel { display: none; position: absolute; inset: 0; z-index: 50; background: var(--warm-white); }
          .thread-panel.open { display: flex; }
          .messages-layout { position: relative; }
        }
      `}</style>
    </div>
  );
}
