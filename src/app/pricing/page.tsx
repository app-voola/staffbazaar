'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlanCard } from '@/components/pricing/PlanCard';
import { FAQItem } from '@/components/pricing/FAQItem';

const FAQS = [
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated amount for the remaining billing period.' },
  { q: 'What happens when my trial ends?', a: 'After your 14-day free trial ends, you\'ll be automatically moved to the Free plan unless you choose to subscribe.' },
  { q: 'Do you offer refunds?', a: 'We offer a full refund within the first 7 days of any paid subscription. No questions asked.' },
  { q: 'How does contact info access work?', a: 'On the Free plan, worker contact details are hidden. With Professional, you get unlimited access to phone, WhatsApp, and email.' },
  { q: 'Can I add multiple restaurant locations?', a: 'Pro covers one location. For multiple locations, choose our Enterprise plan with a multi-location dashboard.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)' }}>
      <nav style={{ padding: '20px 32px', borderBottom: '1px solid var(--sand)' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--charcoal)', textDecoration: 'none' }}>
          Staff<em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>Bazaar</em>
        </Link>
      </nav>

      <section className="pricing-hero">
        <h1>
          Find the perfect <em>staff</em>, faster
        </h1>
        <p>Choose a plan that fits your hiring needs</p>

        <div className="toggle-wrap">
          <span className={`toggle-label${!annual ? ' active' : ''}`} onClick={() => setAnnual(false)}>
            Monthly
          </span>
          <div className={`toggle-track${annual ? ' annual' : ''}`} onClick={() => setAnnual((v) => !v)}>
            <div className="toggle-thumb" />
          </div>
          <span className={`toggle-label${annual ? ' active' : ''}`} onClick={() => setAnnual(true)}>
            Annual
          </span>
          <span className="save-badge">Save 20%</span>
        </div>
      </section>

      <div className="pricing-grid">
        <PlanCard
          label="Starter"
          price="₹0"
          subtitle="Free forever"
          features={[
            { text: '3 job posts per month', included: true },
            { text: 'Unlimited hires', included: true },
            { text: 'View worker profiles', included: true },
            { text: 'Basic applicant tracking', included: true },
            { text: 'Access contact info', included: false },
            { text: 'WhatsApp messaging', included: false },
            { text: 'Priority listing', included: false },
          ]}
          ctaLabel="Current Plan"
          disabled
        />
        <PlanCard
          label="Professional"
          price={annual ? '₹1,999' : '₹2,499'}
          priceSub="/mo"
          subtitle="per restaurant location"
          popular
          features={[
            { text: 'Unlimited job posts', included: true },
            { text: 'Unlimited hires', included: true },
            { text: 'Access worker contact info', included: true },
            { text: 'WhatsApp messaging', included: true },
            { text: 'Kanban applicant pipeline', included: true },
            { text: 'Priority in search results', included: true },
            { text: 'Interview scheduling', included: true },
            { text: 'Pre-built message templates', included: true },
          ]}
          ctaLabel="Start 14-day Free Trial"
          ctaHref="/signup"
        />
        <PlanCard
          label="Enterprise"
          price="Custom"
          subtitle="For chains & multi-location"
          dark
          features={[
            { text: 'Everything in Pro', included: true },
            { text: 'Multi-location dashboard', included: true },
            { text: 'Bulk hiring tools', included: true },
            { text: 'Dedicated account manager', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Priority support', included: true },
          ]}
          ctaLabel="Contact Sales"
          ctaHref="/contact"
        />
      </div>

      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        {FAQS.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </section>

      <style>{`
        .pricing-hero { text-align: center; padding: 64px 24px 48px; max-width: 680px; margin: 0 auto; }
        .pricing-hero h1 { font-family: var(--font-display); font-size: 48px; color: var(--charcoal); margin-bottom: 12px; line-height: 1.1; }
        .pricing-hero h1 em { color: var(--ember); font-style: italic; }
        .pricing-hero p { font-size: 17px; color: var(--charcoal-light); }
        .toggle-wrap { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 32px; }
        .toggle-label { font-size: 14px; font-weight: 600; color: var(--charcoal-light); cursor: pointer; }
        .toggle-label.active { color: var(--charcoal); }
        .toggle-track { width: 52px; height: 28px; background: var(--sand); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.3s; }
        .toggle-track.annual { background: var(--ember); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: white; transition: transform 0.3s; }
        .toggle-track.annual .toggle-thumb { transform: translateX(24px); }
        .save-badge { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; background: var(--green-light); color: var(--green-dark); }
        .pricing-grid { max-width: 1100px; margin: 0 auto; padding: 0 24px 64px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
        .faq-section { max-width: 720px; margin: 0 auto; padding: 0 24px 80px; }
        .faq-section h2 { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 32px; }
        @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr; max-width: 440px; } .pricing-hero h1 { font-size: 36px; } }
      `}</style>
    </div>
  );
}
