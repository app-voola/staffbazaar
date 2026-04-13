'use client';

import { useState } from 'react';

interface SavedNote {
  text: string;
  date: string;
}

export function NotesCard() {
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState<SavedNote[]>([]);

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setNotes((prev) => [{ text, date }, ...prev]);
    setDraft('');
  };

  return (
    <div className="card">
      <div className="card-title">📝 Your Notes</div>
      <textarea
        className="notes-textarea"
        placeholder="Write a private note about this candidate..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button type="button" className="note-save-btn" onClick={save}>
        Save Note
      </button>
      <div className="saved-notes-list">
        {notes.map((n, i) => (
          <div key={i} className="saved-note">
            <div>{n.text}</div>
            <span className="note-date">{n.date}</span>
          </div>
        ))}
      </div>

      <style>{`
        .card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: var(--font-display); font-size: 20px; color: var(--charcoal); margin-bottom: 16px; }
        .notes-textarea { width: 100%; min-height: 100px; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 14px; color: var(--charcoal); background: var(--cream); resize: vertical; transition: border-color 0.2s; }
        .notes-textarea:focus { outline: none; border-color: var(--ember); background: white; }
        .note-save-btn { margin-top: 12px; padding: 10px 22px; border-radius: var(--radius-md); background: var(--ember); color: white; border: none; cursor: pointer; font-size: 13px; font-weight: 700; font-family: var(--font-body); transition: all 0.2s; }
        .note-save-btn:hover { background: #C7421A; }
        .saved-notes-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .saved-note { padding: 12px 14px; border-radius: var(--radius-md); background: var(--cream); border-left: 3px solid var(--gold); font-size: 13px; color: var(--charcoal); line-height: 1.5; }
        .note-date { display: block; font-size: 11px; color: var(--stone); font-weight: 600; margin-top: 4px; }
      `}</style>
    </div>
  );
}
