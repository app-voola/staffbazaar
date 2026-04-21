'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Role = 'worker' | 'owner';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('owner');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sb_role') as Role | null;
    if (stored === 'worker' || stored === 'owner') setRole(stored);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
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

    const target = role === 'worker' ? '/worker-dashboard' : '/dashboard';

    const { data, error: sErr } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: { data: { full_name: fullName.trim(), role } },
    });

    if (sErr && /already/i.test(sErr.message)) {
      const { error: lErr } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (lErr) {
        setBusy(false);
        setError(lErr.message);
        return;
      }
      window.location.href = target;
      return;
    }

    if (sErr) {
      setBusy(false);
      setError(sErr.message);
      return;
    }

    if (data.session) {
      window.location.href = target;
      return;
    }

    setBusy(false);
    setError(
      'Account created. Turn off "Confirm email" in Supabase Authentication → Providers → Email so the session is returned immediately.',
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Join StaffBazaar in 30 seconds</p>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-toggle-btn${role === 'worker' ? ' active' : ''}`}
            onClick={() => setRole('worker')}
          >
            I&apos;m looking for work
          </button>
          <button
            type="button"
            className={`role-toggle-btn${role === 'owner' ? ' active' : ''}`}
            onClick={() => setRole('owner')}
          >
            I&apos;m hiring staff
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="signupName">Full name</label>
            <input
              type="text"
              id="signupName"
              placeholder="your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="signupEmail">Email address</label>
            <input
              type="email"
              id="signupEmail"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="signupPw">Password</label>
            <input
              type="password"
              id="signupPw"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
            {busy ? 'Please wait…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 440px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); position: relative; }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; }
        .role-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; padding: 4px; background: var(--cream); border-radius: 100px; }
        .role-toggle-btn { padding: 10px 14px; border-radius: 100px; background: transparent; border: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--charcoal-light); cursor: pointer; transition: all 0.2s; }
        .role-toggle-btn:hover { color: var(--charcoal); }
        .role-toggle-btn.active { background: white; color: var(--ember); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }

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
        @media (max-width: 480px) {
          .auth-card { padding: 32px 24px; border-radius: var(--radius-md); }
          .auth-heading { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}
