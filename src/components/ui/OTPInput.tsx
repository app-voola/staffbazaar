'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OTPInput({ value, onChange, length = 6, autoFocus = true }: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, length));
  };

  const handleInput = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    if (!d) return;
    setDigit(i, d);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        setDigit(i, '');
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setDigit(i - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, length - 1);
    refs.current[nextIdx]?.focus();
  };

  return (
    <div className="otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={d}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={d ? 'filled' : ''}
        />
      ))}
    </div>
  );
}
