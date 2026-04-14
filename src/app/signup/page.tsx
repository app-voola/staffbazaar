'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { OTPInput } from '@/components/ui/OTPInput';
import { supabase } from '@/lib/supabase';

type Role = 'worker' | 'owner';
type Step = 1 | 2 | 3;

const RESEND_SECONDS = 30;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
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

  const headings: Record<Step, { h1: string; sub: string }> = {
    1: { h1: 'Join StaffBazaar', sub: 'Connect with restaurants and opportunities' },
    2: {
      h1: 'Create your account',
      sub:
        role === 'worker'
          ? 'Start finding restaurant jobs today'
          : 'Start hiring great restaurant staff',
    },
    3: { h1: 'Verify your email', sub: 'Enter the code we sent you' },
  };

  const pickRole = (r: Role) => {
    setRole(r);
    setTimeout(() => setStep(2), 250);
  };

  const sendCode = async (e: React.FormEvent) => {
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
    setError('');
    setSending(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName.trim(), role: role ?? 'worker' },
      },
    });
    setSending(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    setStep(3);
    setOtp('');
    startResendTimer();
  };

  const resendCode = async () => {
    if (resendLeft > 0 || sending) return;
    setError('');
    setOtp('');
    setSending(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName.trim(), role: role ?? 'worker' },
      },
    });
    setSending(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    startResendTimer();
  };

  const backToForm = () => {
    setStep(2);
    setOtp('');
    setError('');
    if (timerRef.current) clearInterval(timerRef.current);
    setResendLeft(0);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
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
    window.location.href = role === 'owner' ? '/onboarding' : '/dashboard';
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        <h1 className="auth-heading">{headings[step].h1}</h1>
        <p className="auth-sub">{headings[step].sub}</p>

        {step === 1 && (
          <div className="signup-step active">
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
          </div>
        )}

        {step === 2 && (
          <form className="signup-step active" onSubmit={sendCode} noValidate>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                type="text"
                id="fullName"
                placeholder="Enter your full name"
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
              {error && <div className="error-text">{error}</div>}
            </div>

            <button
              type="submit"
              className="btn-next"
              style={{ width: '100%' }}
              disabled={sending}
            >
              {sending ? 'Sending…' : 'Send Code'}
            </button>

            <p className="terms-text">
              By signing up, you agree to our <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>
            </p>
          </form>
        )}

        {step === 3 && (
          <form className="signup-step active" onSubmit={verifyCode} noValidate>
            <button type="button" className="back-link" onClick={backToForm}>
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

            <p className="otp-sent-msg">
              We sent a 6-digit code to
              <br />
              <strong>{email}</strong>
            </p>

            <OTPInput value={otp} onChange={setOtp} />

            {error && (
              <div
                className="error-text"
                style={{ textAlign: 'center', marginBottom: 12 }}
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
              {resendLeft > 0 && <span> in 0:{String(resendLeft).padStart(2, '0')}</span>}
            </div>

            <button
              type="submit"
              className="btn-next"
              style={{ width: '100%' }}
              disabled={verifying || otp.length !== 6}
            >
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .auth-card { width: 100%; max-width: 480px; background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-md); }
        .auth-logo { font-family: var(--font-display); font-size: 28px; color: var(--charcoal); text-decoration: none; display: block; text-align: center; margin-bottom: 32px; }
        .auth-logo em { color: var(--ember); font-style: italic; }
        .auth-heading { font-family: var(--font-display); font-size: 32px; text-align: center; margin-bottom: 4px; }
        .auth-sub { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; }

        .signup-step { display: block; }

        .option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .option-card { padding: 24px 16px; text-align: center; background: white; border: 1.5px solid var(--sand); border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .option-card:hover { border-color: var(--ember); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .option-card.selected { border-color: var(--ember); background: var(--ember-glow); }

        .role-cards .opt-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: var(--ember-glow); color: var(--ember); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; transition: all 0.2s; }
        .role-cards .opt-icon-wrap svg { width: 28px; height: 28px; }
        .role-cards .option-card.selected .opt-icon-wrap { background: var(--ember); color: white; }
        .opt-label { font-family: var(--font-display); font-size: 18px; color: var(--charcoal); }
        .opt-desc { font-size: 13px; color: var(--charcoal-light); margin-top: 4px; }
        .role-cards .opt-subtypes { font-size: 11px; color: var(--stone); margin-top: 4px; line-height: 1.4; }

        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input { width: 100%; padding: 14px 16px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 15px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; }
        .field input:focus { outline: none; border-color: var(--ember); }

        .btn-next { margin-top: 8px; padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; font-family: var(--font-body); background: var(--ember); color: white; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220,74,26,0.28); }
        .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }

        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--charcoal-light); background: none; border: none; cursor: pointer; margin-bottom: 16px; padding: 0; transition: color 0.2s; }
        .back-link:hover { color: var(--ember); }
        .back-link svg { width: 16px; height: 16px; }

        .otp-sent-msg { text-align: center; font-size: 15px; color: var(--charcoal-light); margin-bottom: 28px; line-height: 1.5; }
        .otp-sent-msg strong { color: var(--charcoal); }
        .otp-boxes { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; }
        .otp-boxes input { width: 56px; height: 64px; text-align: center; font-size: 24px; font-weight: 700; font-family: var(--font-body); border: 2px solid var(--sand); border-radius: var(--radius-md); background: white; color: var(--charcoal); transition: border-color 0.2s; -webkit-appearance: none; }
        .otp-boxes input:focus { outline: none; border-color: var(--ember); }
        .otp-boxes input.filled { border-color: var(--ember); background: var(--ember-glow); }

        .resend-row { text-align: center; margin-bottom: 24px; font-size: 13px; color: var(--charcoal-light); }
        .resend-link { color: var(--ember); font-weight: 600; border: none; background: none; cursor: pointer; font-size: 13px; font-family: var(--font-body); padding: 0; }
        .resend-link:hover:not(:disabled) { text-decoration: underline; }
        .resend-link:disabled { color: var(--stone); cursor: not-allowed; }

        .terms-text { text-align: center; font-size: 12px; color: var(--stone); margin-top: 20px; line-height: 1.5; }
        .terms-text a { color: var(--charcoal-mid); text-decoration: underline; }

        .error-text { color: #DC2626; font-size: 12px; margin-top: 6px; font-weight: 600; }

        .auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--charcoal-light); }
        .auth-footer a { color: var(--ember); font-weight: 700; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .auth-card { padding: 32px 24px; border-radius: var(--radius-md); }
          .auth-heading { font-size: 26px; }
          .otp-boxes input { width: 48px; height: 56px; font-size: 20px; }
          .otp-boxes { gap: 8px; }
          .option-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
