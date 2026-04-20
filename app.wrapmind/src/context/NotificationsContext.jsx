import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import { supabase } from '../lib/supabase.js';
import {
  USE_NOTIFICATIONS,
  USE_CREATE_NOTIFICATION,
  USE_MARK_NOTIFICATION_READ,
  USE_DELETE_NOTIFICATION,
} from '../api/notifications.graphql.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

function daysAgo(d, h = 0, m = 0) {
  const now = new Date();
  return new Date(now - d * 86_400_000 - h * 3_600_000 - m * 60_000).toISOString();
}

const SEED_NOTIFICATIONS = [
  // ── UNREAD (8) ─────────────────────────────────────────────────────────────
  { id: 'notif-001', type: 'approval',  title: 'Estimate Approved',    body: 'Kyle Huang approved WM-0004 for $6,250',                                 link: 'estimates', recordId: 'est-002', read: false, createdAt: daysAgo(0, 1, 15), icon: 'check'   },
  { id: 'notif-002', type: 'overdue',   title: 'Invoice Overdue',      body: 'INV-0003 for Tina Marsh is 5 days overdue ($3,890)',                     link: 'invoices',  recordId: 'inv-003',  read: false, createdAt: daysAgo(0, 3, 40), icon: 'clock'   },
  { id: 'notif-003', type: 'lead',      title: 'Lead Assigned',         body: 'New lead from Instagram assigned to Jamie K.',                             link: 'leadhub',   recordId: null,     read: false, createdAt: daysAgo(1, 0, 30), icon: 'user'    },
  { id: 'notif-004', type: 'estimate',  title: 'Estimate Expiring Soon',body: 'WM-0007 for Chris Valdez expires in 2 days',                             link: 'estimates', recordId: 'est-007', read: false, createdAt: daysAgo(1, 5, 0),  icon: 'alert'   },
  { id: 'notif-005', type: 'payment',   title: 'Deposit Received',     body: 'Riley Carson paid $2,000 deposit on INV-0005',                            link: 'invoices',  recordId: 'inv-005', read: false, createdAt: daysAgo(2, 2, 10), icon: 'dollar'  },
  { id: 'notif-006', type: 'invoice',   title: 'Invoice Viewed',        body: 'Devon Walsh viewed INV-0002 ($2,150)',                                     link: 'invoices',  recordId: 'inv-002', read: false, createdAt: daysAgo(3, 0, 45), icon: 'document'},
  { id: 'notif-007', type: 'system',    title: 'Integration Connected',body: 'Carfax integration connected successfully',                             link: null,        recordId: null,     read: false, createdAt: daysAgo(4, 1, 0),  icon: 'bell'    },
  { id: 'notif-008', type: 'overdue',   title: 'Estimate Expired',    body: 'WM-0005 for Sandra Ortiz expired yesterday — follow up now',              link: 'estimates', recordId: 'est-005', read: false, createdAt: daysAgo(5, 8, 0),  icon: 'alert'   },
  // ── READ (7) ───────────────────────────────────────────────────────────────
  { id: 'notif-009', type: 'approval',  title: 'Estimate Approved',    body: 'Lisa Park approved WM-0003 for $8,900',                                 link: 'estimates', recordId: 'est-003', read: true,  createdAt: daysAgo(5, 10, 20), icon: 'check'   },
  { id: 'notif-010', type: 'lead',      title: 'New Lead Submitted',   body: 'Web form submission from Robert Diaz — full wrap inquiry',                link: 'leadhub',   recordId: null,     read: true,  createdAt: daysAgo(6, 3, 0),  icon: 'user'    },
  { id: 'notif-011', type: 'payment',   title: 'Payment Received',     body: 'Stephanie Nguyen paid $1,875 deposit on INV-0004',                        link: 'invoices',  recordId: 'inv-004', read: true,  createdAt: daysAgo(7, 0, 0),  icon: 'dollar'  },
  { id: 'notif-012', type: 'estimate',  title: 'Estimate Sent',        body: 'WM-0006 emailed to Jordan Lee for $5,600 — awaiting approval',            link: 'estimates', recordId: 'est-006', read: true,  createdAt: daysAgo(8, 2, 30), icon: 'document'},
  { id: 'notif-013', type: 'system',    title: 'Backup Complete',      body: 'Weekly data backup completed — all records secure',                      link: null,        recordId: null,     read: true,  createdAt: daysAgo(9, 6, 0),  icon: 'bell'    },
  { id: 'notif-014', type: 'invoice',   title: 'Invoice Paid in Full', body: 'INV-0005 for Anthony Reed marked as paid ($7,200)',                     link: 'invoices',  recordId: 'inv-005', read: true,  createdAt: daysAgo(11, 4, 15),icon: 'dollar'  },
  { id: 'notif-015', type: 'lead',      title: 'Lead Status Updated',   body: 'Maria Santos moved to "Proposal Sent" stage',                             link: 'leadhub',   recordId: null,     read: true,  createdAt: daysAgo(13, 9, 0), icon: 'user'    },
];

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

  const isDevAuth = import.meta.env.VITE_DEV_AUTH === '1';

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
    if (isDevAuth) return SEED_NOTIFICATIONS;
    return loadFromStorage() ?? SEED_NOTIFICATIONS;
  });

  // Sync Apollo once available
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && hasApolloData) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications(apolloNotifs);
    }
  }, [hasApolloData, apolloNotifs, isDevAuth]);

  // Persist when not in dev mode
  useEffect(() => {
    if (!isDevAuth) saveToStorage(notifications);
  }, [notifications, isDevAuth]);

  // ── Realtime subscriptions (patch layer — Apollo remains primary source) ────
  useEffect(() => {
    if (!profileId || isDevAuth) return;

    const channel = supabase.channel('notifications-realtime');

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      }, (payload) => {
        const newNotif = {
          id: payload.new.id,
          type: payload.new.type,
          title: payload.new.title,
          body: payload.new.body,
          link: payload.new.link,
          recordId: payload.new.record_id,
          read: payload.new.read ?? false,
          createdAt: payload.new.created_at,
        };
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      }, (payload) => {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id
            ? {
                ...n,
                type: payload.new.type,
                title: payload.new.title,
                body: payload.new.body,
                link: payload.new.link,
                recordId: payload.new.record_id,
                read: payload.new.read,
                createdAt: payload.new.created_at,
              }
            : n
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, isDevAuth]);

  // ── Sorted view ────────────────────────────────────────────────────────────
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const addNotification = useCallback((data = {}) => {
    const newNotif = {
      icon: 'bell',
      link: null,
      read: false,
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (orgId && profileId && !isDevAuth) {
      createNotificationMutation({
        variables: {
          orgId,
          profileId,
          type:    newNotif.type    ?? null,
          title:   newNotif.title,
          body:    newNotif.body    ?? null,
          link:    newNotif.link     ?? null,
          recordId: newNotif.recordId ?? null,
          read:    newNotif.read,
        },
      }).catch(err => console.error('[NotificationsContext] createNotification failed:', err));
    }

    return newNotif;
  }, [orgId, profileId, isDevAuth, createNotificationMutation]);

  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    if (orgId && profileId && !isDevAuth) {
      markNotificationReadMutation({ variables: { id, read: true } })
        .catch(err => console.error('[NotificationsContext] markRead failed:', err));
    }
  }, [orgId, profileId, isDevAuth, markNotificationReadMutation]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // In production, mark each individually via mutation
    if (orgId && profileId && !isDevAuth) {
      notifications.filter(n => !n.read).forEach(n => {
        markNotificationReadMutation({ variables: { id: n.id, read: true } })
          .catch(err => console.error('[NotificationsContext] markAllRead failed:', err));
      });
    }
  }, [orgId, profileId, isDevAuth, notifications, markNotificationReadMutation]);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (orgId && !isDevAuth) {
      deleteNotificationMutation({ variables: { id } })
        .catch(err => console.error('[NotificationsContext] deleteNotification failed:', err));
    }
  }, [orgId, isDevAuth, deleteNotificationMutation]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    // Note: production would need a batch delete; skip for prototype mode
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    notifications: sorted,
    unreadCount,
    loading:  !isDevAuth && apolloLoading,
    error:    apolloError,
    addNotification,
    markRead,
    markAllRead,
    clearNotification,
    clearAll,
  };

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
