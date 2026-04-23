'use client';

import type { MockMessage } from '@/services/mock/conversations';
import { formatBubbleTime } from '@/lib/format-time';

export function ChatBubble({ message }: { message: MockMessage }) {
  const timeLabel = formatBubbleTime(message.createdAt) || message.time;
  return (
    <div className={`chat-bubble-row ${message.fromMe ? 'right' : 'left'}`}>
      <div className={`chat-bubble ${message.fromMe ? 'sent' : 'received'}`}>
        <p>{message.text}</p>
        <div className="bubble-time">{timeLabel}</div>
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
      `}</style>
    </div>
  );
}
