'use client';

import { useState } from 'react';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export function RatingCard() {
  const [rating, setRating] = useState(0);

  return (
    <div className="card">
      <div className="card-title">⭐ Your Rating</div>
      <div className="star-rating-row">
        <span className="star-rating-label">Rate this candidate</span>
        <div className="star-clickable">
          {[1, 2, 3, 4, 5].map((n) => (
            <svg
              key={n}
              viewBox="0 0 24 24"
              className={n <= rating ? 'active' : ''}
              onClick={() => setRating(n)}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
        <span className="rating-value-text">
          {rating === 0 ? 'Not rated yet' : `${rating} / 5 — ${LABELS[rating]}`}
        </span>
      </div>

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
      `}</style>
    </div>
  );
}
