'use client';

interface Feature {
  text: string;
  included: boolean;
}

export function PlanCard({
  label,
  price,
  priceSub,
  subtitle,
  features,
  ctaLabel,
  ctaHref,
  popular,
  dark,
  disabled,
}: {
  label: string;
  price: React.ReactNode;
  priceSub?: string;
  subtitle: string;
  features: Feature[];
  ctaLabel: string;
  ctaHref?: string;
  popular?: boolean;
  dark?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={`pricing-card${popular ? ' pricing-card--popular' : ''}${dark ? ' pricing-card--dark' : ''}`}>
      {popular && <div className="popular-badge">Most Popular</div>}
      <div className="plan-label">{label}</div>
      <div className="plan-price">
        {price} {priceSub && <small>{priceSub}</small>}
      </div>
      <div className="plan-subtitle">{subtitle}</div>
      <ul className="feature-list">
        {features.map((f, i) => (
          <li key={i} className={f.included ? '' : 'disabled'}>
            <span>{f.included ? '✓' : '✕'}</span> {f.text}
          </li>
        ))}
      </ul>
      {ctaHref && !disabled ? (
        <a
          className={`btn-plan ${popular ? 'btn-plan--ember' : dark ? 'btn-plan--white' : 'btn-plan--outline'}`}
          href={ctaHref}
        >
          {ctaLabel}
        </a>
      ) : (
        <button type="button" className="btn-plan btn-plan--disabled" disabled>
          {ctaLabel}
        </button>
      )}

      <style>{`
        .pricing-card { background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-xl); padding: 36px 28px; position: relative; transition: transform 0.25s, box-shadow 0.25s; }
        .pricing-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .pricing-card--popular { border-color: var(--ember); border-width: 2px; box-shadow: 0 8px 40px rgba(220,74,26,0.12); }
        .pricing-card--dark { background: var(--charcoal); border-color: var(--charcoal); color: rgba(255,255,255,0.85); }
        .popular-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); padding: 5px 18px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: var(--ember); color: white; white-space: nowrap; }
        .plan-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--charcoal-light); margin-bottom: 16px; }
        .pricing-card--dark .plan-label { color: rgba(255,255,255,0.5); }
        .pricing-card--popular .plan-label { color: var(--ember); }
        .plan-price { font-family: var(--font-display); font-size: 44px; color: var(--charcoal); line-height: 1; margin-bottom: 4px; }
        .plan-price small { font-family: var(--font-body); font-size: 16px; font-weight: 500; color: var(--charcoal-light); }
        .pricing-card--dark .plan-price { color: white; }
        .plan-subtitle { font-size: 13px; color: var(--charcoal-light); margin-bottom: 28px; }
        .pricing-card--dark .plan-subtitle { color: rgba(255,255,255,0.5); }
        .feature-list { list-style: none; margin-bottom: 32px; padding: 0; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: 14px; color: var(--charcoal-mid); border-bottom: 1px solid var(--cream); }
        .feature-list li:last-child { border-bottom: none; }
        .feature-list li span { flex-shrink: 0; width: 18px; color: var(--green); font-weight: 700; }
        .feature-list li.disabled { color: var(--stone); }
        .feature-list li.disabled span { color: var(--stone); }
        .pricing-card--dark .feature-list li { color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.08); }
        .btn-plan { display: block; width: 100%; padding: 14px 24px; border-radius: var(--radius-md); font-size: 15px; font-weight: 700; font-family: var(--font-body); text-align: center; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-plan--outline { background: transparent; color: var(--charcoal); border: 1.5px solid var(--sand); }
        .btn-plan--outline:hover { border-color: var(--ember); color: var(--ember); }
        .btn-plan--ember { background: var(--ember); color: white; box-shadow: 0 4px 16px rgba(220,74,26,0.25); }
        .btn-plan--ember:hover { background: #C7421A; transform: translateY(-1px); }
        .btn-plan--white { background: white; color: var(--charcoal); }
        .btn-plan--white:hover { background: var(--cream); }
        .btn-plan--disabled { background: var(--cream); color: var(--stone); cursor: default; border: 1.5px solid var(--sand); }
      `}</style>
    </div>
  );
}
