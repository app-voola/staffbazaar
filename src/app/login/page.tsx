'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Step = 'role' | 'form';
type Role = 'worker' | 'owner';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pickRole = async (r: Role) => {
    setRole(r);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_role', r);
    }

    // Both owner and worker authenticate with email/password.
    // If a real session already exists, skip straight to the right dashboard.
    const { data: sess } = await supabase.auth.getSession();
    const isReal = !!sess.session && !sess.session.user.is_anonymous;
    if (isReal) {
      window.location.href = r === 'worker' ? '/worker-dashboard' : '/dashboard';
      return;
    }
    setStep('form');
  };

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
    window.location.href = role === 'worker' ? '/worker-dashboard' : '/dashboard';
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

  const backToRole = () => {
    setStep('role');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        {step === 'role' ? (
          <>
            <h1 className="auth-heading">Welcome to StaffBazaar</h1>
            <p className="auth-sub">Tell us who you are</p>

            <div className="option-grid role-cards">
              <button
                type="button"
                className={`option-card${role === 'worker' ? ' selected' : ''}`}
                onClick={() => pickRole('worker')}
              >
                <div className="opt-icon-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div className="opt-label">I&apos;m looking for work</div>
                <div className="opt-desc">Find restaurant jobs</div>
                <div className="opt-subtypes">Chef, Bartender, Waiter, Kitchen Helper</div>
              </button>

              <button
                type="button"
                className={`option-card${role === 'owner' ? ' selected' : ''}`}
                onClick={() => pickRole('owner')}
              >
                <div className="opt-icon-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 9h1" />
                    <path d="M9 13h1" />
                    <path d="M9 17h1" />
                    <path d="M14 9h1" />
                    <path d="M14 13h1" />
                    <path d="M14 17h1" />
                  </svg>
                </div>
                <div className="opt-label">I&apos;m hiring staff</div>
                <div className="opt-desc">Restaurant owner or manager</div>
                <div className="opt-subtypes">Post jobs and find talent</div>
              </button>
            </div>

            <p className="auth-footer">
              Don&apos;t have an account? <Link href="/signup">Sign up for free</Link>
            </p>
          </>
        ) : (
          <>
            <button type="button" className="back-link" onClick={backToRole}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>

            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-sub">
              {role === 'worker' ? 'Log in to find your next job' : 'Log in to manage your staff'}
            </p>

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

              <div style={{ textAlign: 'right', marginBottom: 12 }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 13,
                    color: 'var(--ember)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Link>
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
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 480px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); position: relative; }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; }

        .option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
        .option-card { padding: 24px 16px; text-align: center; background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .option-card:hover { border-color: var(--ember); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .option-card.selected { border-color: var(--ember); background: var(--ember-glow); }
        .role-cards .opt-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: var(--ember-glow); color: var(--ember); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; transition: all 0.2s; }
        .role-cards .opt-icon-wrap svg { width: 28px; height: 28px; }
        .role-cards .option-card.selected .opt-icon-wrap { background: var(--ember); color: white; }
        .opt-label { font-family: var(--font-display); font-size: 18px; color: var(--charcoal); }
        .opt-desc { font-size: 13px; color: var(--charcoal-light); margin-top: 4px; }
        .role-cards .opt-subtypes { font-size: 11px; color: var(--stone); margin-top: 4px; line-height: 1.4; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }
        .btn-next { margin-top: 6px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--charcoal-light); background: none; border: none; cursor: pointer; margin-bottom: 16px; padding: 0; transition: color 0.2s; }
        .back-link:hover { color: var(--ember); }
        .back-link svg { width: 16px; height: 16px; }
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
          .option-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
