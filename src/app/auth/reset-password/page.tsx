'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase's password recovery email puts a ?code=... in the URL that we
  // need to exchange for a session before the user can call updateUser.
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error: xErr } = await supabase.auth.exchangeCodeForSession(code);
        if (xErr) {
          setError(xErr.message);
          setReady(true);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError(
          'This reset link is invalid or has expired. Request a new one from the login page.',
        );
      }
      setReady(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setBusy(true);
    const { error: uErr } = await supabase.auth.updateUser({ password });
    if (uErr) {
      setBusy(false);
      setError(uErr.message);
      return;
    }
    setBusy(false);
    setDone(true);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1200);
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--charcoal-light)',
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/login" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        {done ? (
          <>
            <h1 className="auth-heading">All set</h1>
            <p className="auth-sub">Your password has been updated. Redirecting…</p>
          </>
        ) : (
          <>
            <h1 className="auth-heading">Set a new password</h1>
            <p className="auth-sub">Choose a password you can remember</p>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="rpPw">New password</label>
                <input
                  type="password"
                  id="rpPw"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="rpConfirm">Confirm password</label>
                <input
                  type="password"
                  id="rpConfirm"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                {error && (
                  <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>
                )}
              </div>

              <button type="submit" className="btn-next" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
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
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }
        .btn-next { margin-top: 6px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
