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

const STORAGE_KEY = 'sb:saved_staff';

interface SavedStaffContextValue {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

const SavedStaffContext = createContext<SavedStaffContextValue | undefined>(undefined);

export function SavedStaffProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedIds(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
  }, [savedIds, hydrated]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setSavedIds(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const value = useMemo(
    () => ({ savedIds, isSaved, toggle, count: savedIds.length }),
    [savedIds, isSaved, toggle],
  );

  return <SavedStaffContext.Provider value={value}>{children}</SavedStaffContext.Provider>;
}

export function useSavedStaff() {
  const ctx = useContext(SavedStaffContext);
  if (!ctx) throw new Error('useSavedStaff must be used within SavedStaffProvider');
  return ctx;
}
