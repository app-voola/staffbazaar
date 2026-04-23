'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  type MockWorker,
  type WorkerRole,
  type Availability,
} from '@/services/mock/workers';

interface WorkersContextValue {
  workers: MockWorker[];
  loading: boolean;
  getById: (id: string) => MockWorker | undefined;
}

const WorkersContext = createContext<WorkersContextValue | undefined>(undefined);

type WorkerRow = {
  id: string;
  name: string;
  role: string;
  role_label: string;
  city: string | null;
  availability: Availability | null;
  experience: number | null;
  salary: number | null;
  rating: number | null;
  phone: string | null;
  avatar: string | null;
  initials: string | null;
  verified: boolean | null;
};

function rowToWorker(r: WorkerRow): MockWorker {
  return {
    id: r.id,
    name: r.name,
    role: r.role as WorkerRole,
    roleLabel: r.role_label,
    city: r.city ?? '',
    availability: (r.availability ?? 'month') as Availability,
    experience: r.experience ?? 0,
    salary: r.salary ?? 0,
    rating: r.rating ?? 0,
    phone: r.phone ?? '',
    avatar: r.avatar ?? undefined,
    initials: r.initials ?? '',
    verified: r.verified ?? true,
  };
}

type WorkerProfileRow = {
  worker_id: string;
  full_name: string | null;
  role: string | null;
  experience_years: number | null;
  city: string | null;
  cities: string[] | null;
  phone: string | null;
  avatar_url: string | null;
  salary_expected: number | null;
  looking_for_work: boolean | null;
  aadhaar_status: string | null;
};

function roleToEnum(role: string | null): WorkerRole {
  const r = (role ?? '').toLowerCase();
  if (/chef|cook/.test(r)) return 'chef';
  if (/bartend/.test(r)) return 'bartender';
  if (/helper|kitchen/.test(r)) return 'helper';
  if (/waiter|steward|captain|server/.test(r)) return 'captain';
  if (/runner/.test(r)) return 'runner';
  return 'support';
}

function initialsFrom(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'W';
}

function profileToWorker(p: WorkerProfileRow): MockWorker {
  const name = p.full_name || 'Worker';
  return {
    id: p.worker_id,
    name,
    role: roleToEnum(p.role),
    roleLabel: p.role ?? 'Worker',
    city: p.city || (p.cities && p.cities[0]) || '',
    availability: (p.looking_for_work === false ? 'month' : 'week') as Availability,
    experience: p.experience_years ?? 0,
    salary: p.salary_expected ?? 0,
    rating: 0,
    phone: p.phone ?? '',
    avatar: p.avatar_url ?? undefined,
    initials: initialsFrom(p.full_name),
    verified: p.aadhaar_status === 'verified',
  };
}

export function WorkersProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<MockWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const [seedRes, profileRes] = await Promise.all([
        supabase.from('workers').select('*').order('created_at', { ascending: true }),
        supabase.from('worker_profiles').select('*').order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      if (seedRes.error) console.error('[workers] load failed', seedRes.error);
      if (profileRes.error) console.error('[worker_profiles] load failed', profileRes.error);

      const seedWorkers = (seedRes.data ?? []).map((r) => rowToWorker(r as WorkerRow));
      const realWorkers = (profileRes.data ?? [])
        .filter((p) => !!p.full_name)
        .map((p) => profileToWorker(p as WorkerProfileRow));

      const byId = new Map<string, MockWorker>();
      seedWorkers.forEach((w) => byId.set(w.id, w));
      // Real profiles win over any mock row with the same id
      realWorkers.forEach((w) => byId.set(w.id, w));
      setWorkers(Array.from(byId.values()));
      setLoading(false);
    };

    loadAll();

    const channel = supabase
      .channel('workers-combined')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_profiles' }, () => loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<WorkersContextValue>(
    () => ({
      workers,
      loading,
      getById: (id: string) => workers.find((w) => w.id === id),
    }),
    [workers, loading],
  );

  return <WorkersContext.Provider value={value}>{children}</WorkersContext.Provider>;
}

export function useWorkers() {
  const ctx = useContext(WorkersContext);
  if (!ctx) throw new Error('useWorkers must be used within WorkersProvider');
  return ctx;
}
