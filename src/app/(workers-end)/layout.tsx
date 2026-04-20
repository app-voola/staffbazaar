'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { WorkerShell } from '@/components/layout/WorkerShell';
import { useAuth } from '@/contexts/AuthContext';
import { WorkerI18nProvider } from '@/contexts/WorkerI18nContext';

export default function WorkersEndLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
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
        Loading…
      </div>
    );
  }

  return (
    <WorkerI18nProvider>
      <WorkerShell>{children}</WorkerShell>
    </WorkerI18nProvider>
  );
}
