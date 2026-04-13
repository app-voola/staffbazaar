'use client';

import type { MockConversation } from '@/services/mock/conversations';

export function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: MockConversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`chat-item${conv.unread > 0 ? ' unread' : ''}${active ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div className="chat-avatar">
        {conv.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={conv.avatar} alt={conv.name} />
        ) : (
          <span>{conv.initials}</span>
        )}
      </div>
      <div className="chat-info">
        <div className="chat-name">{conv.name}</div>
        <div className="chat-last-message">{conv.lastMessage}</div>
      </div>
      <div className="chat-meta">
        <div className="chat-time">{conv.time}</div>
        {conv.unread > 0 && <div className="chat-unread-badge">{conv.unread}</div>}
      </div>

      <style>{`
        .chat-item.selected { background: var(--ember-glow); }
      `}</style>
    </div>
  );
}
