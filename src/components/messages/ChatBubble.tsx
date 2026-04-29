'use client';

import type { MockMessage } from '@/services/mock/conversations';
import { formatBubbleTime } from '@/lib/format-time';

export function ChatBubble({ message }: { message: MockMessage }) {
  const timeLabel = formatBubbleTime(message.createdAt) || message.time;
  const isRead = !!message.readAt;
  return (
    <div className={`chat-bubble-row ${message.fromMe ? 'right' : 'left'}`}>
      <div className={`chat-bubble ${message.fromMe ? 'sent' : 'received'}`}>
        <p>{message.text}</p>
        <div className="bubble-time">
          <span>{timeLabel}</span>
          {message.fromMe && (
            <span className={`bubble-ticks${isRead ? ' read' : ''}`} aria-label={isRead ? 'Read' : 'Sent'}>
              {isRead ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                  <polyline points="14.5 12.5 11 16 9.5 14.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .chat-bubble-row {
          display: flex;
          width: 100%;
          min-width: 0;
        }
        .chat-bubble-row.right { justify-content: flex-end; }
        .chat-bubble-row.left { justify-content: flex-start; }
        .chat-bubble-row .chat-bubble {
          max-width: 75%;
          box-sizing: border-box;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .bubble-time { display: inline-flex; align-items: center; gap: 4px; }
        .bubble-ticks { display: inline-flex; }
        .bubble-ticks svg { width: 14px; height: 12px; opacity: 0.7; }
        .bubble-ticks.read svg { opacity: 1; color: #38BDF8; }
      `}</style>
    </div>
  );
}
