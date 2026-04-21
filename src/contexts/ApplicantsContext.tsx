'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type MockApplicant, type ApplicantStage } from '@/services/mock/applicants';

interface ApplicantsContextValue {
  applicants: MockApplicant[];
  loading: boolean;
  byJob: (jobId: string) => MockApplicant[];
  byJobAndStage: (jobId: string, stage: ApplicantStage) => MockApplicant[];
  moveTo: (id: string, stage: ApplicantStage) => Promise<void>;
  addApplicant: (
    applicant: Omit<MockApplicant, 'id'> & { id?: string },
  ) => Promise<MockApplicant>;
}

const ApplicantsContext = createContext<ApplicantsContextValue | undefined>(undefined);

type ApplicantRow = {
  id: string;
  job_id: string;
  worker_id: string | null;
  name: string;
  role: string | null;
  experience: number | null;
  salary: number | null;
  rating: number | null;
  phone: string | null;
  avatar: string | null;
  initials: string | null;
  stage: ApplicantStage;
};

function rowToApplicant(r: ApplicantRow): MockApplicant {
  return {
    id: r.id,
    jobId: r.job_id,
    workerId: r.worker_id,
    name: r.name,
    role: r.role ?? '',
    experience: r.experience ?? 0,
    salary: r.salary ?? 0,
    rating: r.rating ?? 0,
    phone: r.phone ?? '',
    avatar: r.avatar ?? undefined,
    initials: r.initials ?? '',
    stage: r.stage,
  };
}

export function ApplicantsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<MockApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setApplicants([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    let ownerJobIds: Set<string> = new Set();

    const loadAll = async () => {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('owner_id', user.id);
      ownerJobIds = new Set((jobs ?? []).map((j: { id: string }) => j.id));
      if (cancelled) return;

      if (ownerJobIds.size === 0) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .in('job_id', Array.from(ownerJobIds))
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) console.error('[applicants] load failed', error);
      else if (data) setApplicants((data as ApplicantRow[]).map(rowToApplicant));

      setLoading(false);
    };

    loadAll();

    const channel = supabase
      .channel(`applicants-owner-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applicants' },
        (payload) => {
          const row = (payload.new || payload.old) as ApplicantRow & { job_id: string };
          if (!row.job_id || !ownerJobIds.has(row.job_id)) return;

          if (payload.eventType === 'INSERT') {
            const r = payload.new as ApplicantRow;
            setApplicants((prev) =>
              prev.some((a) => a.id === r.id) ? prev : [...prev, rowToApplicant(r)],
            );
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new as ApplicantRow;
            setApplicants((prev) => prev.map((a) => (a.id === r.id ? rowToApplicant(r) : a)));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            setApplicants((prev) => prev.filter((a) => a.id !== old.id));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `owner_id=eq.${user.id}` },
        () => {
          // When owner's job list changes, re-derive the allowed set and reload
          loadAll();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const byJob = useCallback(
    (jobId: string) => applicants.filter((a) => a.jobId === jobId),
    [applicants],
  );

  const byJobAndStage = useCallback(
    (jobId: string, stage: ApplicantStage) =>
      applicants.filter((a) => a.jobId === jobId && a.stage === stage),
    [applicants],
  );

  const moveTo = useCallback<ApplicantsContextValue['moveTo']>(async (id, stage) => {
    const snapshot = applicants;
    const target = applicants.find((a) => a.id === id);
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));

    const { error } = await supabase.from('applicants').update({ stage }).eq('id', id);
    if (error) {
      console.error('[applicants] moveTo failed', error);
      setApplicants(snapshot);
      throw error;
    }

    // Notify the worker of the stage change (if we know who they are)
    if (target?.workerId) {
      const titleByStage: Record<ApplicantStage, { title: string; body: string; type: string }> = {
        applied: { title: 'Application received', body: `Your application for ${target.role} has been received.`, type: 'application' },
        shortlisted: { title: "You've been shortlisted", body: `Your application for ${target.role} has been shortlisted. Expect a call soon.`, type: 'shortlist' },
        called: { title: 'Interview invitation', body: `You've been called for the ${target.role} role.`, type: 'shortlist' },
        hired: { title: "Congratulations! You've been hired", body: `You've been hired for the ${target.role} role.`, type: 'hired' },
      };
      const meta = titleByStage[stage];
      if (meta) {
        await supabase.from('notifications').insert({
          user_id: target.workerId,
          type: meta.type,
          title: meta.title,
          body: meta.body,
          link: '/my-applications',
        });
      }
    }
  }, [applicants]);

  const addApplicant = useCallback<ApplicantsContextValue['addApplicant']>(
    async (applicant) => {
      if (!user) throw new Error('Not signed in');
      const created: MockApplicant = {
        ...applicant,
        id: applicant.id ?? `app-${Date.now()}`,
      };

      setApplicants((prev) =>
        prev.some((a) => a.id === created.id) ? prev : [...prev, created],
      );

      const { error } = await supabase.from('applicants').insert({
        id: created.id,
        job_id: created.jobId,
        name: created.name,
        role: created.role,
        experience: created.experience,
        salary: created.salary,
        rating: created.rating,
        phone: created.phone,
        avatar: created.avatar ?? null,
        initials: created.initials,
        stage: created.stage,
      });

      if (error) {
        console.error('[applicants] insert failed', error);
        setApplicants((prev) => prev.filter((a) => a.id !== created.id));
        throw error;
      }

      return created;
    },
    [user],
  );

  const value = useMemo(
    () => ({ applicants, loading, byJob, byJobAndStage, moveTo, addApplicant }),
    [applicants, loading, byJob, byJobAndStage, moveTo, addApplicant],
  );

  return <ApplicantsContext.Provider value={value}>{children}</ApplicantsContext.Provider>;
}

export function useApplicants() {
  const ctx = useContext(ApplicantsContext);
  if (!ctx) throw new Error('useApplicants must be used within ApplicantsProvider');
  return ctx;
}
