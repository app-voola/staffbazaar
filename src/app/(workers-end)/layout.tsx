'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WorkerShell } from '@/components/layout/WorkerShell';
import { useAuth } from '@/contexts/AuthContext';
import { WorkerI18nProvider } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';

export default function WorkersEndLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Bounce workers who never finished the create-profile wizard back
  // into it — but only if the worker_profiles row says onboarding_complete
  // is false. Once true, we never redirect again, even if the worker
  // later clears a field on the full editor.
  useEffect(() => {
    if (!user) return;
    const exempt = pathname?.startsWith('/create-profile') || pathname?.startsWith('/worker-profile');
    if (exempt) return;
    let cancelled = false;
    supabase
      .from('worker_profiles')
      .select('onboarding_complete, full_name, role, cities')
      .eq('worker_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.onboarding_complete === true) return;
        // Fallback for accounts created before the column existed: treat
        // a populated profile as already onboarded so we don't bounce
        // existing users to the wizard.
        const looksDone =
          !!data &&
          !!(data.full_name as string | null)?.trim() &&
          !!(data.role as string | null) &&
          Array.isArray(data.cities) &&
          (data.cities as string[]).length > 0;
        if (looksDone) return;
        router.replace('/create-profile');
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, pathname, router]);

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
