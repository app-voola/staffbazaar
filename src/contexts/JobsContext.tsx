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
import { seedJobs, type MockJob, type JobStatus } from '@/services/mock/jobs';

const STORAGE_JOBS = 'sb:jobs';
const STORAGE_USED = 'sb:posts_used';
const STORAGE_LIMIT = 'sb:posts_limit';
const DEFAULT_LIMIT = 3;

interface JobsContextValue {
  jobs: MockJob[];
  postsUsed: number;
  postsLimit: number;
  quotaReached: boolean;
  addJob: (job: Omit<MockJob, 'id'> & { id?: string }, opts?: { consumeQuota?: boolean }) => MockJob;
  updateJob: (id: string, patch: Partial<MockJob>) => void;
  deleteJob: (id: string) => void;
  countByStatus: (status: JobStatus) => number;
  activeCount: number;
}

const JobsContext = createContext<JobsContextValue | undefined>(undefined);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<MockJob[]>(seedJobs);
  const [postsUsed, setPostsUsed] = useState(2);
  const [postsLimit, setPostsLimit] = useState(DEFAULT_LIMIT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const j = localStorage.getItem(STORAGE_JOBS);
      if (j) setJobs(JSON.parse(j));
      const u = localStorage.getItem(STORAGE_USED);
      if (u) setPostsUsed(parseInt(u, 10));
      const l = localStorage.getItem(STORAGE_LIMIT);
      if (l) setPostsLimit(parseInt(l, 10));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_JOBS, JSON.stringify(jobs));
  }, [jobs, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_USED, String(postsUsed));
  }, [postsUsed, hydrated]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_JOBS && e.newValue) {
        try { setJobs(JSON.parse(e.newValue)); } catch {}
      } else if (e.key === STORAGE_USED && e.newValue) {
        setPostsUsed(parseInt(e.newValue, 10));
      } else if (e.key === STORAGE_LIMIT && e.newValue) {
        setPostsLimit(parseInt(e.newValue, 10));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addJob = useCallback<JobsContextValue['addJob']>(
    (job, opts) => {
      const created: MockJob = {
        ...job,
        id: job.id ?? `job-${Date.now()}`,
      };
      setJobs((prev) => [created, ...prev]);
      if (opts?.consumeQuota && created.status === 'active') {
        setPostsUsed((n) => n + 1);
      }
      return created;
    },
    [],
  );

  const updateJob = useCallback<JobsContextValue['updateJob']>((id, patch) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const deleteJob = useCallback<JobsContextValue['deleteJob']>((id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const countByStatus = useCallback(
    (status: JobStatus) => jobs.filter((j) => j.status === status).length,
    [jobs],
  );

  const value = useMemo<JobsContextValue>(
    () => ({
      jobs,
      postsUsed,
      postsLimit,
      quotaReached: postsUsed >= postsLimit,
      addJob,
      updateJob,
      deleteJob,
      countByStatus,
      activeCount: jobs.filter((j) => j.status === 'active').length,
    }),
    [jobs, postsUsed, postsLimit, addJob, updateJob, deleteJob, countByStatus],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
