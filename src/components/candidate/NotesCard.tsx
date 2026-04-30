'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SavedNote {
  id: string;
  text: string;
  date: string;
  created_at: string;
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NotesCard({ workerId }: { workerId: string }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      const { data, error: lErr } = await supabase
        .from('worker_notes')
        .select('id, text, created_at')
        .eq('owner_id', user.id)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (lErr) {
        console.error('[notes] load failed', lErr);
        return;
      }
      setNotes(
        (data ?? []).map((r) => ({
          id: r.id as string,
          text: r.text as string,
          created_at: r.created_at as string,
          date: formatNoteDate(r.created_at as string),
        })),
      );
    };

    load();

    const ch = supabase
      .channel(`notes-${user.id}-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_notes',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as { id: string; worker_id: string; text: string; created_at: string };
            if (row.worker_id !== workerId) return;
            setNotes((prev) =>
              prev.some((n) => n.id === row.id)
                ? prev
                : [{ id: row.id, text: row.text, created_at: row.created_at, date: formatNoteDate(row.created_at) }, ...prev],
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            setNotes((prev) => prev.filter((n) => n.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id, workerId]);

  const save = async () => {
    if (!user) return;
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError('');
    const { data, error: insErr } = await supabase
      .from('worker_notes')
      .insert({ owner_id: user.id, worker_id: workerId, text })
      .select('id, text, created_at')
      .maybeSingle();
    setBusy(false);
    if (insErr) {
      console.error('[notes] save failed', insErr);
      setError(`Couldn't save: ${insErr.message}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (data) {
      setNotes((prev) =>
        prev.some((n) => n.id === (data.id as string))
          ? prev
          : [
              {
                id: data.id as string,
                text: data.text as string,
                created_at: data.created_at as string,
                date: formatNoteDate(data.created_at as string),
              },
              ...prev,
            ],
      );
    }
    setDraft('');
  };

  const removeNote = async (id: string) => {
    if (!user) return;
    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const { error: dErr } = await supabase
      .from('worker_notes')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);
    if (dErr) {
      console.error('[notes] delete failed', dErr);
      setNotes(prev);
    }
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
      <button type="button" className="note-save-btn" onClick={save} disabled={busy || !draft.trim()}>
        {busy ? 'Saving…' : 'Save Note'}
      </button>
      {error && <div className="note-err">{error}</div>}
      <div className="saved-notes-list">
        {notes.map((n) => (
          <div key={n.id} className="saved-note">
            <div className="saved-note-text">{n.text}</div>
            <div className="saved-note-foot">
              <span className="note-date">{n.date}</span>
              <button
                type="button"
                className="note-remove-btn"
                onClick={() => removeNote(n.id)}
                aria-label="Delete note"
                title="Delete note"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: var(--font-display); font-size: 20px; color: var(--charcoal); margin-bottom: 16px; }
        .notes-textarea { width: 100%; min-height: 100px; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 14px; color: var(--charcoal); background: var(--cream); resize: vertical; transition: border-color 0.2s; box-sizing: border-box; }
        .notes-textarea:focus { outline: none; border-color: var(--ember); background: white; }
        .note-save-btn { margin-top: 12px; padding: 10px 22px; border-radius: var(--radius-md); background: var(--ember); color: white; border: none; cursor: pointer; font-size: 13px; font-weight: 700; font-family: var(--font-body); transition: all 0.2s; }
        .note-save-btn:hover:not(:disabled) { background: #C7421A; }
        .note-save-btn:disabled { opacity: 0.5; cursor: default; }
        .note-err { margin-top: 8px; font-size: 12px; color: #DC2626; font-weight: 600; }
        .saved-notes-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .saved-note { padding: 12px 14px; border-radius: var(--radius-md); background: var(--cream); border-left: 3px solid var(--gold); font-size: 13px; color: var(--charcoal); line-height: 1.5; }
        .saved-note-text { white-space: pre-wrap; word-break: break-word; }
        .saved-note-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .note-date { font-size: 11px; color: var(--stone); font-weight: 600; }
        .note-remove-btn { background: none; border: none; padding: 2px 4px; color: var(--stone); cursor: pointer; display: inline-flex; align-items: center; }
        .note-remove-btn:hover { color: #DC2626; }
        .note-remove-btn svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}
