'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OTPInput } from '@/components/ui/OTPInput';
import { supabase } from '@/lib/supabase';

type Step = 'email' | 'otp';
type Role = 'worker' | 'owner';

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [role, setRole] = useState<Role>('worker');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendLeft(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setSending(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    setStep('otp');
    startResendTimer();
  };

  const resendCode = async () => {
    if (resendLeft > 0 || sending) return;
    setOtp('');
    setError('');
    setSending(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    startResendTimer();
  };

  const backToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    if (timerRef.current) clearInterval(timerRef.current);
    setResendLeft(0);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setError('');
    setVerifying(true);
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'email',
    });
    if (vErr) {
      setVerifying(false);
      setError(vErr.message);
      return;
    }
    router.push('/dashboard');
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

        {step === 'email' ? (
          <>
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-sub">Log in with your email</p>

            <div className="role-toggle">
              <button
                type="button"
                className={role === 'worker' ? 'active' : ''}
                onClick={() => setRole('worker')}
              >
                I&apos;m a Worker
              </button>
              <button
                type="button"
                className={role === 'owner' ? 'active' : ''}
                onClick={() => setRole('owner')}
              >
                I&apos;m an Owner
              </button>
            </div>

            <form onSubmit={sendCode} noValidate>
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
                {error && (
                  <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn-next"
                style={{ width: '100%' }}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send Code'}
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
              Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              className="back-link"
              onClick={backToEmail}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
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

            <h1 className="auth-heading">Enter code</h1>
            <p className="otp-sent-msg">
              We sent a 6-digit code to
              <br />
              <strong>{email}</strong>
            </p>

            <form onSubmit={verifyCode} noValidate>
              <OTPInput value={otp} onChange={setOtp} />

              {error && (
                <div
                  style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 12 }}
                >
                  {error}
                </div>
              )}

              <div className="resend-row">
                <button
                  type="button"
                  className="resend-link"
                  disabled={resendLeft > 0 || sending}
                  onClick={resendCode}
                >
                  Resend code
                </button>
                {resendLeft > 0 && (
                  <span> in 0:{String(resendLeft).padStart(2, '0')}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-next"
                style={{ width: '100%' }}
                disabled={otp.length !== 6 || verifying}
              >
                {verifying ? 'Verifying…' : 'Verify & Log In'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 440px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); position: relative; }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; }
        .role-toggle { display: flex; background: var(--cream); border-radius: 100px; padding: 4px; margin-bottom: 28px; }
        .role-toggle button { flex: 1; padding: 12px 8px; border-radius: 100px; font-size: 13px; font-weight: 600; font-family: var(--font-body); border: none; cursor: pointer; background: transparent; color: var(--charcoal-light); transition: all 0.25s; white-space: nowrap; }
        .role-toggle button.active { background: white; color: var(--charcoal); box-shadow: var(--shadow-sm); }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }
        .btn-next { margin-top: 8px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
        .otp-sent-msg { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 24px; line-height: 1.5; }
        .otp-sent-msg strong { color: var(--charcoal); }
        .otp-boxes { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .otp-boxes input { width: 52px; height: 60px; text-align: center; font-size: 24px; font-weight: 700; font-family: var(--font-body); border: 2px solid var(--sand); border-radius: var(--radius-md); background: white; color: var(--charcoal); transition: border-color 0.2s; -webkit-appearance: none; }
        .otp-boxes input:focus { outline: none; border-color: var(--ember); }
        .otp-boxes input.filled { border-color: var(--ember); background: var(--ember-glow); }
        .resend-row { text-align: center; margin-bottom: 20px; font-size: 13px; color: var(--charcoal-light); }
        .resend-link { color: var(--ember); font-weight: 600; text-decoration: none; cursor: pointer; border: none; background: none; font-size: 13px; font-family: var(--font-body); padding: 0; }
        .resend-link:hover:not(:disabled) { text-decoration: underline; }
        .resend-link:disabled { color: var(--stone); cursor: not-allowed; text-decoration: none; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--charcoal-light); text-decoration: none; margin-bottom: 16px; transition: color 0.2s; padding: 0; }
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
        }
      `}</style>
    </div>
  );
}
