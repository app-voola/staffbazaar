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
import { seedConversations, type MockConversation } from '@/services/mock/conversations';

const STORAGE_KEY = 'sb:conversations';

interface MessagesContextValue {
  conversations: MockConversation[];
  unreadCount: number;
  send: (convId: string, text: string) => void;
  markRead: (convId: string) => void;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<MockConversation[]>(seedConversations);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConversations(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, hydrated]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setConversations(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const send = useCallback<MessagesContextValue['send']>((convId, text) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: text,
              time: 'Just now',
              messages: [
                ...c.messages,
                { id: `m${Date.now()}`, fromMe: true, text, time: 'Just now' },
              ],
            }
          : c,
      ),
    );
  }, []);

  const markRead = useCallback<MessagesContextValue['markRead']>((convId) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)));
  }, []);

  const unreadCount = conversations.reduce((s, c) => s + c.unread, 0);

  const value = useMemo(
    () => ({ conversations, unreadCount, send, markRead }),
    [conversations, unreadCount, send, markRead],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
