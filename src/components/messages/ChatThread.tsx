'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { MockConversation } from '@/services/mock/conversations';
import { ChatBubble } from './ChatBubble';
import { QuickReplies } from './QuickReplies';

export function ChatThread({
  conv,
  onSend,
  onBack,
}: {
  conv: MockConversation;
  onSend: (text: string) => void;
  onBack?: () => void;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conv.messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <>
      <div className="thread-header">
        {onBack && (
          <button type="button" className="back-to-list" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        )}
        <div className="chat-avatar">
          {conv.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.avatar} alt={conv.name} />
          ) : (
            <span>{conv.initials}</span>
          )}
        </div>
        <div className="thread-header-info">
          <span className="name">{conv.name}</span>
          <span className="role-badge">{conv.role}</span>
        </div>
        <Link href={`/candidate/${conv.id}`}>View Profile</Link>
      </div>

      <QuickReplies onPick={(t) => setDraft(t)} />

      <div className="chat-thread" ref={scrollRef}>
        {conv.messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" className="chat-send-btn" onClick={submit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <style>{`
        .thread-header { display: flex; align-items: center; gap: 14px; padding: 18px 24px; background: white; border-bottom: 1px solid var(--sand); min-width: 0; }
        .thread-header .chat-avatar { width: 40px; height: 40px; font-size: 15px; }
        .thread-header-info { flex: 1; }
        .thread-header-info .name { font-size: 15px; font-weight: 700; color: var(--charcoal); }
        .thread-header-info .role-badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ember); background: var(--ember-glow); padding: 2px 8px; border-radius: 100px; margin-left: 6px; }
        .thread-header a { font-size: 13px; font-weight: 600; color: var(--ember); text-decoration: none; }
        .back-to-list { display: none; padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--ember); background: none; border: none; cursor: pointer; align-items: center; gap: 4px; }
        .back-to-list svg { width: 16px; height: 16px; }
        @media (max-width: 768px) { .back-to-list { display: flex; } }
      `}</style>
    </>
  );
}
