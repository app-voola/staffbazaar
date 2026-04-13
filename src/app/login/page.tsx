'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [role, setRole] = useState<'worker' | 'owner'>('worker');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') {
      setError('Invalid OTP. Use 123456 for the demo.');
      return;
    }
    await login();
    router.push(role === 'owner' ? '/dashboard' : '/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard" className="auth-logo">
          Staff<em>Bazaar</em>
        </Link>

        {step === 'phone' ? (
          <>
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-sub">Log in with your phone number</p>

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

            <form onSubmit={sendOtp} noValidate>
              <div className="field">
                <label htmlFor="loginPhone">Phone number</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    id="loginPhone"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoComplete="tel"
                    maxLength={10}
                  />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>}
              </div>
              <button type="submit" className="btn-next" style={{ width: '100%' }}>
                Send OTP
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <button type="button" className="btn-social">
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
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back
            </button>
            <h1 className="auth-heading">Enter code</h1>
            <p className="otp-sent-msg">
              We sent a 6-digit code to
              <br />
              <strong>+91 {phone}</strong>
            </p>
            <form onSubmit={verifyOtp} noValidate>
              <OTPInput value={otp} onChange={setOtp} />
              {error && (
                <div style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stone)', marginBottom: 16 }}>
                Demo OTP: <strong>123456</strong>
              </p>
              <button
                type="submit"
                className="btn-next"
                style={{ width: '100%' }}
                disabled={otp.length !== 6}
              >
                Verify &amp; Log In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
