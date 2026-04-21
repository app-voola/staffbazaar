'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { WorkerShell } from '@/components/layout/WorkerShell';
import { useAuth } from '@/contexts/AuthContext';
import { WorkerI18nProvider } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';

export default function WorkersEndLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Ensure every worker has a worker_profiles row so fan-out queries
  // (e.g. new-job notifications for looking_for_work=true) find them.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('worker_profiles')
      .upsert(
        {
          worker_id: user.id,
          full_name: user.full_name ?? null,
          looking_for_work: true,
        },
        { onConflict: 'worker_id', ignoreDuplicates: true },
      )
      .then(() => {});
  }, [user?.id]);

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
