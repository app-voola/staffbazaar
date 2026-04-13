'use client';

const REPLIES = [
  'When can you start?',
  'Please come for interview at our restaurant.',
  'Congratulations! You are selected for the position.',
  'Thank you for your interest. We will get back to you soon.',
];

export function QuickReplies({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="quick-replies">
      {REPLIES.map((r) => (
        <button key={r} type="button" className="quick-reply" onClick={() => onPick(r)}>
          {r}
        </button>
      ))}
      <style>{`
        .quick-replies { display: flex; gap: 10px; padding: 14px 24px; background: white; border-bottom: 1px solid var(--sand); overflow-x: auto; flex-shrink: 0; }
        .quick-replies::-webkit-scrollbar { display: none; }
        .quick-reply { padding: 9px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; color: var(--charcoal-mid); background: var(--cream); border: 1.5px solid var(--sand); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; white-space: nowrap; }
        .quick-reply:hover { border-color: var(--ember); color: var(--ember); background: var(--ember-glow); }
      `}</style>
    </div>
  );
}
