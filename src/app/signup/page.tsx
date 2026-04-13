'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'worker' | 'owner';
type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const headings: Record<Step, { h1: string; sub: string }> = {
    1: { h1: 'Join StaffBazaar', sub: 'Connect with restaurants and opportunities' },
    2: {
      h1: 'Create your account',
      sub:
        role === 'worker'
          ? 'Start finding restaurant jobs today'
          : 'Start hiring great restaurant staff',
    },
    3: { h1: 'Verify your phone', sub: 'Enter the code we sent you' },
  };

  const pickRole = (r: Role) => {
    setRole(r);
    setTimeout(() => setStep(2), 250);
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Please enter your full name');
    if (phone.length < 10) return setError('Enter a valid 10-digit number');
    setError('');
    setStep(3);
    setOtp('');
    setResendIn(30);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter all 6 digits');
    if (otp !== '123456') return setError('Invalid OTP. Use 123456 for the demo.');
    setError('');
    setVerifying(true);
    await login();
    setTimeout(() => {
      router.push(role === 'owner' ? '/onboarding' : '/dashboard');
    }, 600);
  };

  const formattedPhone = phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;

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
              <div
                className={`option-card${role === 'worker' ? ' selected' : ''}`}
                onClick={() => pickRole('worker')}
              >
                <div className="opt-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div className="opt-label">I&apos;m looking for work</div>
                <div className="opt-desc">Find restaurant jobs</div>
                <div className="opt-subtypes">Chef, Bartender, Waiter, Kitchen Helper</div>
              </div>

              <div
                className={`option-card${role === 'owner' ? ' selected' : ''}`}
                onClick={() => pickRole('owner')}
              >
                <div className="opt-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="signup-step active" onSubmit={sendOtp} noValidate>
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
              <label htmlFor="signupPhone">Phone number</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  id="signupPhone"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoComplete="tel"
                  maxLength={10}
                  required
                />
              </div>
              {error && <div className="error-text">{error}</div>}
            </div>
            <button type="submit" className="btn-next" style={{ width: '100%' }}>
              Send OTP
            </button>
            <p className="terms-text">
              By signing up, you agree to our{' '}
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </form>
        )}

        {step === 3 && (
          <form className="signup-step active" onSubmit={verifyOtp} noValidate>
            <button
              type="button"
              className="back-link"
              onClick={() => {
                setStep(2);
                setOtp('');
                setError('');
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <p className="otp-sent-msg">
              We sent a 6-digit code to
              <br />
              <strong>+91 {formattedPhone}</strong>
            </p>

            <OTPInput value={otp} onChange={setOtp} />

            <div className="resend-row">
              <button
                type="button"
                className="resend-link"
                disabled={resendIn > 0}
                onClick={() => {
                  setResendIn(30);
                  setOtp('');
                }}
              >
                Resend code
              </button>
              {resendIn > 0 && (
                <span> in 0:{resendIn.toString().padStart(2, '0')}</span>
              )}
            </div>

            {error && <div className="error-text" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</div>}
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stone)', marginBottom: 12 }}>
              Demo OTP: <strong>123456</strong>
            </p>

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
        .signup-step.active { display: block; }
        .role-cards .option-card { padding: 24px 16px; cursor: pointer; }
        .role-cards .opt-icon-wrap {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--ember-glow); color: var(--ember);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; transition: all 0.2s;
        }
        .role-cards .opt-icon-wrap svg { width: 28px; height: 28px; }
        .role-cards .option-card.selected .opt-icon-wrap { background: var(--ember); color: white; }
        .role-cards .opt-subtypes { font-size: 11px; color: var(--stone); margin-top: 4px; line-height: 1.4; }

        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--charcoal-light);
          background: none; border: none; cursor: pointer;
          margin-bottom: 16px; padding: 0; transition: color 0.2s;
        }
        .back-link:hover { color: var(--ember); }
        .back-link svg { width: 16px; height: 16px; }

        .terms-text { text-align: center; font-size: 12px; color: var(--stone); margin-top: 20px; line-height: 1.5; }
        .terms-text a { color: var(--charcoal-mid); text-decoration: underline; }

        .resend-row { text-align: center; margin: 16px 0 20px; font-size: 13px; color: var(--charcoal-light); }
        .resend-link {
          color: var(--ember); font-weight: 600;
          border: none; background: none; cursor: pointer;
          font-size: 13px; font-family: var(--font-body);
        }
        .resend-link:hover:not(:disabled) { text-decoration: underline; }
        .resend-link:disabled { color: var(--stone); cursor: not-allowed; }

        .error-text {
          color: #DC2626; font-size: 12px; margin-top: 6px; font-weight: 600;
        }
        .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
