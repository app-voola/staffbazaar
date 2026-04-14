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
import { mockRestaurant, type MockUser, type MockRestaurant } from '@/services/mock';

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

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) console.error('[auth] getSession failed', error);
      const mock = toMockUser(data.session?.user ?? null);
      setUser(mock);
      setRestaurant(mock ? mockRestaurant : null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const mock = toMockUser(session?.user ?? null);
      setUser(mock);
      setRestaurant(mock ? mockRestaurant : null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

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
