import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import { supabase } from '../lib/supabase.js';
import {
  USE_NOTIFICATIONS, USE_CREATE_NOTIFICATION, USE_MARK_NOTIFICATION_READ, USE_DELETE_NOTIFICATION,
} from '../api/notifications.graphql.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

function daysAgo(d, h = 0, m = 0) {
  const now = new Date();
  return new Date(now - d * 86_400_000 - h * 3_600_000 - m * 60_000).toISOString();
}


// ─── Storage helpers ──────────────────────────────────────────────────────────

const LS_KEY = 'wm-notifications-v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(notifications) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notifications)); } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { orgId, profileId } = useAuth();

    // Apollo: notifications for this profile
  const { notifications: apolloNotifs, loading: apolloLoading, error: apolloError } =
    USE_NOTIFICATIONS({ profileId, first: 100 });

  // Apollo mutations
  const [createNotificationMutation] = USE_CREATE_NOTIFICATION();
  const [markNotificationReadMutation] = USE_MARK_NOTIFICATION_READ();
  const [deleteNotificationMutation] = USE_DELETE_NOTIFICATION();

  // State: Apollo once loaded, otherwise localStorage/seed
  const hasApolloData = !apolloLoading && !apolloError && apolloNotifs.length > 0;

  const [notifications, setNotifications] = useState(() => {
    // seed removed
    return loadFromStorage() ?? [];
  });

  // Sync Apollo once available
  const initRef = useRef(false);
  useEffect(() => {

    if (!initRef.current && hasApolloData) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications(apolloNotifs);
    }
  }, [hasApolloData, apolloNotifs]);

  // Persist when not in dev mode
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  // ── Realtime subscriptions (patch layer — Apollo remains primary source) ────
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase.channel('notifications-realtime');

    channel
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profileId}`, }, (payload) => {
        const newNotif = {
          id: payload.new.id, type: payload.new.type, title: payload.new.title, body: payload.new.body, link: payload.new.link, recordId: payload.new.record_id, read: payload.new.read ?? false, createdAt: payload.new.created_at, };
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profileId}`, }, (payload) => {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id
            ? {
                ...n, type: payload.new.type, title: payload.new.title, body: payload.new.body, link: payload.new.link, recordId: payload.new.record_id, read: payload.new.read, createdAt: payload.new.created_at, }
            : n
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profileId}`, }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  // ── Sorted view ────────────────────────────────────────────────────────────
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt), );
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const addNotification = useCallback((data = {}) => {
    const newNotif = {
      icon: 'bell', link: null, read: false, ...data, id: uuid(), createdAt: new Date().toISOString(), };
    setNotifications(prev => [newNotif, ...prev]);

    if (orgId && profileId) {
      createNotificationMutation({
        variables: {
          orgId, profileId, type:    newNotif.type    ?? null, title:   newNotif.title, body:    newNotif.body    ?? null, link:    newNotif.link     ?? null, recordId: newNotif.recordId ?? null, read:    newNotif.read, }, }).catch(err => console.error('[NotificationsContext] createNotification failed:', err));
    }

    return newNotif;
  }, [orgId, profileId, createNotificationMutation]);

  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    if (orgId && profileId) {
      markNotificationReadMutation({ variables: { id, read: true } })
        .catch(err => console.error('[NotificationsContext] markRead failed:', err));
    }
  }, [orgId, profileId, markNotificationReadMutation]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // In production, mark each individually via mutation
    if (orgId && profileId) {
      notifications.filter(n => !n.read).forEach(n => {
        markNotificationReadMutation({ variables: { id: n.id, read: true } })
          .catch(err => console.error('[NotificationsContext] markAllRead failed:', err));
      });
    }
  }, [orgId, profileId, notifications, markNotificationReadMutation]);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (orgId) {
      deleteNotificationMutation({ variables: { id } })
        .catch(err => console.error('[NotificationsContext] deleteNotification failed:', err));
    }
  }, [orgId, deleteNotificationMutation]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    // Note: production would need a batch delete; skip for prototype mode
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    notifications: sorted, unreadCount, loading:  apolloLoading, error:    apolloError, realtimeConnected, addNotification, markRead, markAllRead, clearNotification, clearAll, };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
