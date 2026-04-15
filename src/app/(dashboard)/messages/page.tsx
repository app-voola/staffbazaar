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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const visible = conversations.filter((c) => tab === 'all' || c.type === tab);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const pickable = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return applicants.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.role ?? '').toLowerCase().includes(q)
      );
    });
  }, [applicants, pickerSearch]);

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
      });
      setPickerOpen(false);
      setPickerSearch('');
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
          <div className="conv-header-top">
            <h2>Messages</h2>
            <button
              type="button"
              className="new-chat-btn"
              onClick={() => setPickerOpen(true)}
              title="Start a new chat with an applicant"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </button>
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

      {pickerOpen && (
        <div
          className="picker-overlay"
          onClick={() => {
            setPickerOpen(false);
            setPickerSearch('');
          }}
        >
          <div className="picker-card" onClick={(e) => e.stopPropagation()}>
            <div className="picker-header">
              <h3>Start a chat with an applicant</h3>
              <button
                type="button"
                className="picker-close"
                onClick={() => {
                  setPickerOpen(false);
                  setPickerSearch('');
                }}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              className="picker-search"
              placeholder="Search by name or role"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              autoFocus
            />
            <div className="picker-list">
              {pickable.length === 0 ? (
                <div className="picker-empty">No applicants yet. Post a job and review applications first.</div>
              ) : (
                pickable.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="picker-item"
                    onClick={() => handlePick(a.id)}
                  >
                    <div className="picker-avatar">
                      {a.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatar} alt={a.name} />
                      ) : (
                        <span>{a.initials}</span>
                      )}
                    </div>
                    <div className="picker-body">
                      <div className="picker-name">{a.name}</div>
                      <div className="picker-role">
                        {a.role}
                        {a.experience ? ` · ${a.experience} yrs` : ''}
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="picker-arrow"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-main { min-width: 0 !important; overflow-x: hidden; }
        .messages-layout { display: flex; height: 100vh; overflow: hidden; margin: -32px; min-width: 0; max-width: calc(100% + 64px); }
        .conv-panel { width: 360px; border-right: 1px solid var(--sand); background: white; display: flex; flex-direction: column; flex-shrink: 0; min-width: 0; }
        .conv-header { padding: 20px 20px 12px; border-bottom: 1px solid var(--sand); }
        .conv-header-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .conv-header h2 { font-family: var(--font-display); font-size: 24px; }
        .new-chat-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 100px; font-size: 13px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .new-chat-btn:hover { background: #C7421A; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(220,74,26,0.28); }
        .new-chat-btn svg { width: 14px; height: 14px; }
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

        .picker-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 20px; }
        .picker-card { width: 100%; max-width: 480px; max-height: 80vh; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; }
        .picker-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; border-bottom: 1px solid var(--sand); }
        .picker-header h3 { font-family: var(--font-display); font-size: 20px; color: var(--charcoal); }
        .picker-close { width: 32px; height: 32px; border-radius: 50%; background: var(--cream); border: none; cursor: pointer; color: var(--charcoal-light); display: flex; align-items: center; justify-content: center; }
        .picker-close:hover { background: var(--sand); color: var(--charcoal); }
        .picker-close svg { width: 16px; height: 16px; }
        .picker-search { margin: 16px 20px; padding: 12px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); font-size: 14px; font-family: var(--font-body); background: white; }
        .picker-search:focus { outline: none; border-color: var(--ember); }
        .picker-list { flex: 1; overflow-y: auto; padding: 0 12px 16px; }
        .picker-empty { padding: 32px 16px; text-align: center; color: var(--stone); font-size: 13px; }
        .picker-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); background: transparent; border: none; cursor: pointer; font-family: var(--font-body); text-align: left; transition: background 0.15s; }
        .picker-item:hover { background: var(--cream); }
        .picker-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(145deg, var(--ember), var(--gold)); display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-display); font-size: 15px; flex-shrink: 0; overflow: hidden; }
        .picker-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .picker-body { flex: 1; min-width: 0; }
        .picker-name { font-size: 14px; font-weight: 700; color: var(--charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .picker-role { font-size: 12px; color: var(--charcoal-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .picker-arrow { width: 16px; height: 16px; color: var(--stone); flex-shrink: 0; }

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
