'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setBusy(true);
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setBusy(false);
    if (rErr) {
      setError(rErr.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/login" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        {sent ? (
          <>
            <h1 className="auth-heading">Check your email</h1>
            <p className="auth-sub">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
              Click the link in the email to choose a new password.
            </p>
            <Link href="/login" className="btn-next" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-heading">Forgot password?</h1>
            <p className="auth-sub">Enter your email and we&apos;ll send you a reset link</p>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="fpEmail">Email address</label>
                <input
                  type="email"
                  id="fpEmail"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {error && (
                  <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>
                )}
              </div>

              <button type="submit" className="btn-next" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="auth-footer">
              <Link href="/login">← Back to log in</Link>
            </p>
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 440px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; line-height: 1.5; }
        .auth-sub strong { color: var(--charcoal); }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }
        .btn-next { margin-top: 6px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--charcoal-light); }
        .auth-footer a { color: var(--ember); font-weight: 700; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
