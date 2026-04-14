'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[auth/callback] getSession failed', error);
        router.replace('/login');
        return;
      }
      router.replace(data.session ? '/dashboard' : '/login');
    })();
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        color: 'var(--charcoal-light)',
      }}
    >
      Signing you in…
    </div>
  );
}
