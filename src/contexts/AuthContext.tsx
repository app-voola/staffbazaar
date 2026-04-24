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
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { type MockUser, type MockRestaurant } from '@/services/mock';

interface AuthContextValue {
  user: MockUser | null;
  restaurant: MockRestaurant | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toMockUser(su: SupabaseUser | null): MockUser | null {
  if (!su) return null;
  const meta = (su.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    su.email ||
    'Owner';
  return {
    id: su.id,
    full_name: fullName,
    phone: su.phone ?? (meta.phone as string | undefined) ?? '',
    role: 'owner',
    avatar_url: (meta.avatar_url as string | undefined) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [restaurant, setRestaurant] = useState<MockRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRestaurant = async (ownerId: string): Promise<MockRestaurant | null> => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, owner_id, name, type, city')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) {
        console.error('[auth] restaurant load failed', error);
        return null;
      }
      console.debug('[auth] loadRestaurant', { ownerId, hasRow: !!data, name: data?.name });
      if (!data) return null;
      return {
        id: data.id,
        owner_id: data.owner_id,
        name: data.name ?? '',
        type: data.type ?? '',
        city: data.city ?? '',
      };
    };

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) console.error('[auth] getSession failed', error);
      const mock = toMockUser(data.session?.user ?? null);
      setUser(mock);
      // Unblock the UI immediately — restaurant load happens in the
      // background so a slow/failed lookup can't strand the layout on
      // its "Loading…" screen.
      setLoading(false);
      if (mock) {
        loadRestaurant(mock.id).then((rest) => {
          if (!cancelled) setRestaurant(rest);
        });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const mock = toMockUser(session?.user ?? null);
      setUser(mock);
      if (mock) {
        loadRestaurant(mock.id).then((rest) => {
          if (!cancelled) setRestaurant(rest);
        });
      } else {
        setRestaurant(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Keep the restaurant in sync when the owner edits their profile
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`auth-restaurant-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `owner_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRestaurant(null);
            return;
          }
          const row = payload.new as Record<string, unknown>;
          setRestaurant({
            id: (row.id as string) ?? '',
            owner_id: (row.owner_id as string) ?? user.id,
            name: (row.name as string) ?? '',
            type: (row.type as string) ?? '',
            city: (row.city as string) ?? '',
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const login = useCallback(async () => {
    // Sessions are managed by supabase.auth directly (see login page).
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRestaurant(null);
  }, []);

  const value = useMemo(
    () => ({ user, restaurant, loading, login, logout }),
    [user, restaurant, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
