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
import {
  seedApplicants,
  APPLICANTS_SCHEMA_VERSION,
  type MockApplicant,
  type ApplicantStage,
} from '@/services/mock/applicants';

const STORAGE_KEY = 'sb:applicants';
const VERSION_KEY = 'sb:applicants_v';

interface ApplicantsContextValue {
  applicants: MockApplicant[];
  byJob: (jobId: string) => MockApplicant[];
  byJobAndStage: (jobId: string, stage: ApplicantStage) => MockApplicant[];
  moveTo: (id: string, stage: ApplicantStage) => void;
}

const ApplicantsContext = createContext<ApplicantsContextValue | undefined>(undefined);

export function ApplicantsProvider({ children }: { children: ReactNode }) {
  const [applicants, setApplicants] = useState<MockApplicant[]>(seedApplicants);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
      if (storedVersion !== APPLICANTS_SCHEMA_VERSION) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedApplicants));
        localStorage.setItem(VERSION_KEY, String(APPLICANTS_SCHEMA_VERSION));
        setApplicants(seedApplicants);
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setApplicants(JSON.parse(raw));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(applicants));
  }, [applicants, hydrated]);

  // Cross-tab sync — listen to changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setApplicants(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const byJob = useCallback(
    (jobId: string) => applicants.filter((a) => a.jobId === jobId),
    [applicants],
  );

  const byJobAndStage = useCallback(
    (jobId: string, stage: ApplicantStage) =>
      applicants.filter((a) => a.jobId === jobId && a.stage === stage),
    [applicants],
  );

  const moveTo = useCallback<ApplicantsContextValue['moveTo']>((id, stage) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
  }, []);

  const value = useMemo(
    () => ({ applicants, byJob, byJobAndStage, moveTo }),
    [applicants, byJob, byJobAndStage, moveTo],
  );

  return <ApplicantsContext.Provider value={value}>{children}</ApplicantsContext.Provider>;
}

export function useApplicants() {
  const ctx = useContext(ApplicantsContext);
  if (!ctx) throw new Error('useApplicants must be used within ApplicantsProvider');
  return ctx;
}
