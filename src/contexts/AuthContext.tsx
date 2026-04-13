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
import { mockOwner, mockRestaurant, type MockUser, type MockRestaurant } from '@/services/mock';

interface AuthContextValue {
  user: MockUser | null;
  restaurant: MockRestaurant | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'staffbazaar:mock-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Dev mode: start logged in with mock owner. Swap to `null` once real auth lands.
  const [user, setUser] = useState<MockUser | null>(mockOwner);
  const [restaurant, setRestaurant] = useState<MockRestaurant | null>(mockRestaurant);
  const [loading] = useState(false);

  const login = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setUser(mockOwner);
    setRestaurant(mockRestaurant);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
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
