'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      // Supabase's PKCE OAuth flow returns ?code=... in the URL. Exchange it
      // for a session, then hard-redirect so AuthContext remounts with it.
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[auth/callback] exchangeCodeForSession failed', error);
          window.location.href = '/login';
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      window.location.href = data.session ? '/dashboard' : '/login';
    })();
  }, []);

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
