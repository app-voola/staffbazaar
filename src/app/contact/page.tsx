'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setName('');
      setEmail('');
      setMessage('');
    }, 2500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-white)' }}>
      <nav style={{ padding: '20px 32px', borderBottom: '1px solid var(--sand)' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--charcoal)', textDecoration: 'none' }}>
          Staff<em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>Bazaar</em>
        </Link>
      </nav>

      <section className="contact-hero">
        <h1>
          Get in <em>Touch</em>
        </h1>
        <p>We&apos;d love to hear from you. Reach out with questions or feedback.</p>
      </section>

      <div className="contact-grid">
        <div className="contact-form-wrap">
          <h2>Send us a message</h2>
          <form onSubmit={submit} className="contact-form-fields">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="general">General Inquiry</option>
                <option value="restaurant">Restaurant Owner Support</option>
                <option value="worker">Worker Support</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div className="field">
              <label>Message</label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-send"
              style={{ background: sent ? 'var(--green)' : 'var(--ember)' }}
            >
              {sent ? '✓ Message Sent!' : 'Send Message'}
            </button>
          </form>
        </div>

        <div className="contact-info-col">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <div>
              <div className="info-label">Office</div>
              <div className="info-value">
                WeWork BKC, Bandra Kurla Complex
                <br />
                Mumbai, Maharashtra 400051
              </div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">✉</div>
            <div>
              <div className="info-label">Email</div>
              <div className="info-value">
                <a href="mailto:support@staffbazaar.in">support@staffbazaar.in</a>
              </div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">📞</div>
            <div>
              <div className="info-label">Phone</div>
              <div className="info-value">+91 22 6789 0123</div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🕐</div>
            <div>
              <div className="info-label">Working Hours</div>
              <div className="info-value">
                Mon – Sat, 9 AM – 6 PM IST
                <small style={{ display: 'block', fontSize: 12, color: 'var(--stone)', marginTop: 2 }}>
                  Closed on Sundays
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-hero { text-align: center; padding: 64px 32px 48px; max-width: 680px; margin: 0 auto; }
        .contact-hero h1 { font-family: var(--font-display); font-size: 44px; color: var(--charcoal); margin-bottom: 8px; }
        .contact-hero h1 em { color: var(--ember); font-style: italic; }
        .contact-hero p { font-size: 17px; color: var(--charcoal-light); }
        .contact-grid { max-width: 1000px; margin: 0 auto; padding: 0 32px 80px; display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }
        .contact-form-wrap { background: white; border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm); }
        .contact-form-wrap h2 { font-family: var(--font-display); font-size: 24px; margin-bottom: 24px; }
        .contact-form-fields { display: flex; flex-direction: column; gap: 18px; }
        .contact-form-fields .field { margin-bottom: 0; }
        .contact-info-col { display: flex; flex-direction: column; gap: 16px; }
        .info-card { background: white; border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs); display: flex; align-items: flex-start; gap: 14px; }
        .info-icon { width: 42px; height: 42px; border-radius: var(--radius-sm); background: var(--cream); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; }
        .info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--stone); margin-bottom: 3px; }
        .info-value { font-size: 14px; font-weight: 600; color: var(--charcoal); line-height: 1.4; }
        .info-value a { color: var(--ember); text-decoration: none; }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; gap: 32px; padding: 0 20px 60px; } .contact-hero h1 { font-size: 32px; } }
      `}</style>
    </div>
  );
}
