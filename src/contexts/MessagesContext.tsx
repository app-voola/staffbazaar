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
import { type MockConversation, type MockMessage } from '@/services/mock/conversations';

interface StartChatInput {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  initials?: string;
  workerId?: string | null;
}

interface MessagesContextValue {
  conversations: MockConversation[];
  loading: boolean;
  unreadCount: number;
  send: (convId: string, text: string) => Promise<void>;
  markRead: (convId: string) => Promise<void>;
  startChat: (input: StartChatInput) => Promise<string>;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

type ConversationRow = {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
  initials: string | null;
  type: 'active' | 'hired' | null;
  last_message: string | null;
  time: string | null;
  unread: number | null;
  unread_for_owner: number | null;
  unread_for_worker: number | null;
  updated_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  from_me: boolean | null;
  text: string;
  time: string | null;
  created_at: string | null;
  read_at: string | null;
};

function rowToMsg(r: MessageRow): MockMessage {
  return {
    id: r.id,
    fromMe: r.from_me ?? false,
    text: r.text,
    time: r.time ?? '',
    createdAt: r.created_at ?? undefined,
    readAt: r.read_at ?? undefined,
  };
}

function rowToConv(r: ConversationRow, messages: MockMessage[]): MockConversation {
  // The owner-side context renders the count owed to the *owner*. Falling
  // back to the legacy single-column unread keeps pre-migration rows from
  // showing 0 incorrectly.
  const ownerUnread = r.unread_for_owner ?? r.unread ?? 0;
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? '',
    avatar: r.avatar ?? undefined,
    initials: r.initials ?? '',
    type: (r.type ?? 'active') as MockConversation['type'],
    lastMessage: r.last_message ?? '',
    time: r.time ?? '',
    updatedAt: r.updated_at ?? undefined,
    unread: ownerUnread,
    messages,
  };
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MockConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: convRows, error: cErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      const convIds = (convRows ?? []).map((c: { id: string }) => c.id);
      const { data: msgRows, error: mErr } = convIds.length
        ? await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null as unknown as typeof cErr };

      if (cancelled) return;

      if (cErr) console.error('[conversations] load failed', cErr);
      if (mErr) console.error('[messages] load failed', mErr);

      if (convRows) {
        const msgsByConv = new Map<string, MockMessage[]>();
        (msgRows as MessageRow[] | null)?.forEach((m) => {
          const arr = msgsByConv.get(m.conversation_id) ?? [];
          arr.push(rowToMsg(m));
          msgsByConv.set(m.conversation_id, arr);
        });
        setConversations(
          (convRows as ConversationRow[]).map((c) => rowToConv(c, msgsByConv.get(c.id) ?? [])),
        );
      }

      setLoading(false);
    })();

    const convChannel = supabase
      .channel(`conversations-owner-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `owner_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as ConversationRow;
            setConversations((prev) =>
              prev.some((c) => c.id === row.id) ? prev : [rowToConv(row, []), ...prev],
            );
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as ConversationRow;
            setConversations((prev) =>
              prev.map((c) => (c.id === row.id ? rowToConv(row, c.messages) : c)),
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            setConversations((prev) => prev.filter((c) => c.id !== old.id));
          }
        },
      )
      .subscribe();

    const msgChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as MessageRow;
            setConversations((prev) =>
              prev.map((c) =>
                c.id === row.conversation_id && !c.messages.some((m) => m.id === row.id)
                  ? { ...c, messages: [...c.messages, rowToMsg(row)] }
                  : c,
              ),
            );
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as MessageRow;
            setConversations((prev) =>
              prev.map((c) =>
                c.id === row.conversation_id
                  ? {
                      ...c,
                      messages: c.messages.map((m) => (m.id === row.id ? rowToMsg(row) : m)),
                    }
                  : c,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string; conversation_id: string };
            setConversations((prev) =>
              prev.map((c) =>
                c.id === old.conversation_id
                  ? { ...c, messages: c.messages.filter((m) => m.id !== old.id) }
                  : c,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user?.id]);

  const send = useCallback<MessagesContextValue['send']>(async (convId, text) => {
    const msg: MockMessage = {
      id: `m${Date.now()}`,
      fromMe: true,
      text,
      time: 'Just now',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: text, time: 'Just now', messages: [...c.messages, msg] }
          : c,
      ),
    );

    const { error: msgErr } = await supabase.from('messages').insert({
      id: msg.id,
      conversation_id: convId,
      from_me: true,
      text,
      time: 'Just now',
    });
    if (msgErr) console.error('[messages] insert failed', msgErr);

    // Bump the *worker's* unread badge only — the owner is the sender so
    // their own count must not change.
    const { data: convRow } = await supabase
      .from('conversations')
      .select('unread_for_worker, worker_id, name, restaurant_name')
      .eq('id', convId)
      .maybeSingle();
    const nextWorkerUnread = (convRow?.unread_for_worker ?? 0) + 1;

    const { error: convErr } = await supabase
      .from('conversations')
      .update({
        last_message: text,
        unread_for_worker: nextWorkerUnread,
        updated_at: new Date().toISOString(),
      })
      .eq('id', convId);
    if (convErr) console.error('[conversations] update failed', convErr);

    // Notify the worker of the new message — use restaurant name, not the
    // conversation.name (which stores the worker's own name for owner's view).
    if (convRow?.worker_id) {
      await supabase.from('notifications').insert({
        user_id: convRow.worker_id,
        type: 'message',
        title: `New message from ${convRow.restaurant_name ?? 'Restaurant'}`,
        body: text.length > 120 ? `${text.slice(0, 120)}…` : text,
        link: '/worker-messages',
      });
    }
  }, []);

  const markRead = useCallback<MessagesContextValue['markRead']>(async (convId) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)));
    const nowIso = new Date().toISOString();
    // Reset *only* the owner's badge, and stamp inbound (from_me=false)
    // messages as read so the worker sees the double-tick on their side.
    const [{ error: convErr }, { error: msgErr }] = await Promise.all([
      supabase.from('conversations').update({ unread_for_owner: 0 }).eq('id', convId),
      supabase
        .from('messages')
        .update({ read_at: nowIso })
        .eq('conversation_id', convId)
        .eq('from_me', false)
        .is('read_at', null),
    ]);
    if (convErr) console.error('[conversations] markRead failed', convErr);
    if (msgErr) console.error('[messages] mark read_at failed', msgErr);
  }, []);

  const startChat = useCallback<MessagesContextValue['startChat']>(
    async (input) => {
      if (!user) throw new Error('Not signed in');

      // If the applicant has a worker_id, use the same deterministic id
      // that the worker's apply helper uses so both sides share ONE thread.
      const convId = input.workerId
        ? `conv-${input.workerId}-${user.id}`
        : input.id;

      const existing = conversations.find((c) => c.id === convId);
      if (existing) return existing.id;

      const newConv: MockConversation = {
        id: convId,
        name: input.name,
        role: input.role ?? '',
        avatar: input.avatar,
        initials: input.initials ?? input.name.slice(0, 2).toUpperCase(),
        type: 'active',
        lastMessage: '',
        time: 'Just now',
        unread: 0,
        messages: [],
      };

      setConversations((prev) => [newConv, ...prev]);

      const { error } = await supabase.from('conversations').upsert(
        {
          id: newConv.id,
          owner_id: user.id,
          worker_id: input.workerId ?? null,
          name: newConv.name,
          role: newConv.role,
          avatar: newConv.avatar ?? null,
          initials: newConv.initials,
          type: 'active',
          last_message: '',
          time: 'Just now',
          unread: 0,
        },
        { onConflict: 'id' },
      );

      if (error) {
        console.error('[conversations] startChat failed', error);
        setConversations((prev) => prev.filter((c) => c.id !== newConv.id));
        throw error;
      }

      return newConv.id;
    },
    [conversations, user],
  );

  const unreadCount = conversations.reduce((s, c) => s + c.unread, 0);

  const value = useMemo(
    () => ({ conversations, loading, unreadCount, send, markRead, startChat }),
    [conversations, loading, unreadCount, send, markRead, startChat],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
