'use client';

import { useState } from 'react';
import { useMessages } from '@/contexts/MessagesContext';
import { ConversationItem } from '@/components/messages/ConversationItem';
import { ChatThread } from '@/components/messages/ChatThread';

type Tab = 'all' | 'active' | 'hired';

export default function MessagesPage() {
  const { conversations, send, markRead } = useMessages();
  const [tab, setTab] = useState<Tab>('all');
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [threadOpen, setThreadOpen] = useState(false);

  const visible = conversations.filter((c) => tab === 'all' || c.type === tab);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const open = (id: string) => {
    setActiveId(id);
    setThreadOpen(true);
    markRead(id);
  };

  return (
    <div className="messages-layout">
      <div className="conv-panel">
        <div className="conv-header">
          <h2>Messages</h2>
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
