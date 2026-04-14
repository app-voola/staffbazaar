'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setBusy(true);
    const { error: pErr } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (pErr) {
      setBusy(false);
      setError(pErr.message);
      return;
    }
    window.location.href = '/dashboard';
  };

  const signInWithGoogle = async () => {
    setError('');
    const { error: gErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (gErr) setError(gErr.message);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Log in with your email and password</p>

        <form onSubmit={signIn} noValidate>
          <div className="field">
            <label htmlFor="loginEmail">Email address</label>
            <input
              type="email"
              id="loginEmail"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="loginPw">Password</label>
            <input
              type="password"
              id="loginPw"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              minLength={6}
            />
            {error && (
              <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn-next"
            style={{ width: '100%' }}
            disabled={busy}
          >
            {busy ? 'Please wait…' : 'Log In'}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button type="button" className="btn-social" onClick={signInWithGoogle}>
          <svg viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/signup">Sign up for free</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 440px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); position: relative; }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }
        .btn-next { margin-top: 6px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--sand); }
        .divider span { font-size: 12px; color: var(--stone); font-weight: 500; white-space: nowrap; }
        .btn-social { width: 100%; padding: 13px; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; font-family: var(--font-body); background: white; color: var(--charcoal); border: 1.5px solid var(--sand); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; }
        .btn-social:hover { border-color: var(--charcoal-light); background: var(--cream); }
        .btn-social svg { width: 20px; height: 20px; }
        .auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--charcoal-light); }
        .auth-footer a { color: var(--ember); font-weight: 700; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
        @media (max-width: 480px) {
          .auth-card { padding: 32px 24px; border-radius: var(--radius-md); }
          .auth-heading { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}
