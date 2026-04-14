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

interface SavedStaffContextValue {
  savedIds: string[];
  loading: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  count: number;
}

const SavedStaffContext = createContext<SavedStaffContextValue | undefined>(undefined);

export function SavedStaffProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('saved_staff')
        .select('worker_id')
        .eq('owner_id', user.id);
      if (cancelled) return;
      if (error) console.error('[saved_staff] load failed', error);
      else if (data) setSavedIds(data.map((r) => r.worker_id as string));
      setLoading(false);
    })();

    const channel = supabase
      .channel('saved-staff-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_staff' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as { worker_id: string };
            setSavedIds((prev) => (prev.includes(row.worker_id) ? prev : [...prev, row.worker_id]));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { worker_id: string };
            setSavedIds((prev) => prev.filter((id) => id !== old.worker_id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggle = useCallback<SavedStaffContextValue['toggle']>(async (id) => {
    if (!user) throw new Error('Not signed in');
    const wasSaved = savedIds.includes(id);
    setSavedIds((prev) => (wasSaved ? prev.filter((x) => x !== id) : [...prev, id]));

    const { error } = wasSaved
      ? await supabase
          .from('saved_staff')
          .delete()
          .eq('worker_id', id)
          .eq('owner_id', user.id)
      : await supabase.from('saved_staff').insert({ worker_id: id, owner_id: user.id });

    if (error) {
      console.error('[saved_staff] toggle failed', error);
      setSavedIds((prev) => (wasSaved ? [...prev, id] : prev.filter((x) => x !== id)));
      throw error;
    }
  }, [savedIds, user]);

  const value = useMemo(
    () => ({ savedIds, loading, isSaved, toggle, count: savedIds.length }),
    [savedIds, loading, isSaved, toggle],
  );

  return <SavedStaffContext.Provider value={value}>{children}</SavedStaffContext.Provider>;
}

export function useSavedStaff() {
  const ctx = useContext(SavedStaffContext);
  if (!ctx) throw new Error('useSavedStaff must be used within SavedStaffProvider');
  return ctx;
}
