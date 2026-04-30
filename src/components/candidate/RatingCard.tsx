'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export function RatingCard({ workerId }: { workerId: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Hydrate the owner's saved star count for this worker. Subscribes to
  // realtime so a rating set in another tab/device flips here too.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      const { data, error: lErr } = await supabase
        .from('worker_ratings')
        .select('stars')
        .eq('owner_id', user.id)
        .eq('worker_id', workerId)
        .maybeSingle();
      if (cancelled) return;
      if (lErr) console.error('[rating] load failed', lErr);
      setRating((data?.stars as number | null) ?? 0);
    };

    load();

    const ch = supabase
      .channel(`rating-${user.id}-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_ratings',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { worker_id: string };
            if (old.worker_id === workerId) setRating(0);
            return;
          }
          const row = payload.new as { worker_id: string; stars: number };
          if (row.worker_id === workerId) setRating(row.stars ?? 0);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id, workerId]);

  const persist = async (stars: number) => {
    if (!user) return;
    const prev = rating;
    setRating(stars); // optimistic
    setBusy(true);
    setError('');
    const { error: upErr } = await supabase.from('worker_ratings').upsert(
      {
        owner_id: user.id,
        worker_id: workerId,
        stars,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,worker_id' },
    );
    setBusy(false);
    if (upErr) {
      console.error('[rating] save failed', upErr);
      setRating(prev);
      setError(`Couldn't save: ${upErr.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="card">
      <div className="card-title">⭐ Your Rating</div>
      <div className="star-rating-row">
        <span className="star-rating-label">Rate this candidate</span>
        <div className="star-clickable" aria-busy={busy || undefined}>
          {[1, 2, 3, 4, 5].map((n) => (
            <svg
              key={n}
              viewBox="0 0 24 24"
              className={n <= rating ? 'active' : ''}
              onClick={() => persist(n === rating ? 0 : n)}
              role="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
        <span className="rating-value-text">
          {rating === 0 ? 'Not rated yet' : `${rating} / 5 — ${LABELS[rating]}`}
        </span>
      </div>
      {error && <div className="rating-err">{error}</div>}

      <style>{`
        .card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: var(--font-display); font-size: 20px; color: var(--charcoal); margin-bottom: 16px; }
        .star-rating-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 16px; border-radius: var(--radius-md); background: var(--cream); }
        .star-rating-label { font-size: 13px; font-weight: 700; color: var(--charcoal); }
        .star-clickable { display: flex; gap: 4px; }
        .star-clickable svg { width: 28px; height: 28px; cursor: pointer; transition: all 0.15s; color: var(--sand); fill: none; stroke: currentColor; stroke-width: 2; }
        .star-clickable svg.active { color: var(--gold); fill: var(--gold); }
        .star-clickable svg:hover { transform: scale(1.15); }
        .rating-value-text { font-size: 13px; color: var(--charcoal-light); font-weight: 600; }
        .rating-err { margin-top: 10px; font-size: 12px; color: #DC2626; font-weight: 600; }
      `}</style>
    </div>
  );
}
