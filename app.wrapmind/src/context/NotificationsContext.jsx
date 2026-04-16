import { createContext, useContext, useState, useEffect } from 'react';

// ── Seed data ─────────────────────────────────────────────────────────────────
// 15 realistic notifications — 8 unread, 7 read — spread over the past 14 days.
// Timestamps are relative to 2026-04-10T00:00:00Z (today).

function daysAgo(d, h = 0, m = 0) {
  const now = new Date();
  return new Date(now - d * 86_400_000 - h * 3_600_000 - m * 60_000).toISOString();
}

const SEED_NOTIFICATIONS = [
  // ── UNREAD (8) ──────────────────────────────────────────────────────────────
  {
    id: 'notif-001',
    type: 'approval',
    title: 'Estimate Approved',
    body: 'Kyle Huang approved WM-0004 for $6,250',
    link: 'estimates',
    recordId: 'est-002',
    read: false,
    createdAt: daysAgo(0, 1, 15),
    icon: 'check',
  },
  {
    id: 'notif-002',
    type: 'overdue',
    title: 'Invoice Overdue',
    body: 'INV-0003 for Tina Marsh is 5 days overdue ($3,890)',
    link: 'invoices',
    recordId: 'inv-003',
    read: false,
    createdAt: daysAgo(0, 3, 40),
    icon: 'clock',
  },
  {
    id: 'notif-003',
    type: 'lead',
    title: 'Lead Assigned',
    body: 'New lead from Instagram assigned to Jamie K.',
    link: 'leadhub',
    read: false,
    createdAt: daysAgo(1, 0, 30),
    icon: 'user',
  },
  {
    id: 'notif-004',
    type: 'estimate',
    title: 'Estimate Expiring Soon',
    body: 'WM-0007 for Chris Valdez expires in 2 days',
    link: 'estimates',
    read: false,
    createdAt: daysAgo(1, 5, 0),
    icon: 'document',
  },
  {
    id: 'notif-005',
    type: 'payment',
    title: 'Payment Received',
    body: 'Marcus Bell paid $4,404 on INV-0001',
    link: 'invoices',
    read: false,
    createdAt: daysAgo(2, 2, 10),
    icon: 'dollar',
  },
  {
    id: 'notif-006',
    type: 'invoice',
    title: 'Invoice Viewed',
    body: 'Devon Walsh viewed INV-0002 ($2,150)',
    link: 'invoices',
    read: false,
    createdAt: daysAgo(3, 0, 45),
    icon: 'document',
  },
  {
    id: 'notif-007',
    type: 'system',
    title: 'Integration Connected',
    body: 'Carfax integration connected successfully',
    link: null,
    read: false,
    createdAt: daysAgo(4, 1, 0),
    icon: 'bell',
  },
  {
    id: 'notif-008',
    type: 'overdue',
    title: 'Estimate Expired',
    body: 'WM-0005 for Sandra Ortiz expired yesterday — follow up now',
    link: 'estimates',
    read: false,
    createdAt: daysAgo(5, 8, 0),
    icon: 'alert',
  },
  // ── READ (7) ─────────────────────────────────────────────────────────────────
  {
    id: 'notif-009',
    type: 'approval',
    title: 'Estimate Approved',
    body: 'Lisa Park approved WM-0003 for $8,900',
    link: 'estimates',
    read: true,
    createdAt: daysAgo(5, 10, 20),
    icon: 'check',
  },
  {
    id: 'notif-010',
    type: 'lead',
    title: 'New Lead Submitted',
    body: 'Web form submission from Robert Diaz — full wrap inquiry',
    link: 'leadhub',
    read: true,
    createdAt: daysAgo(6, 3, 0),
    icon: 'user',
  },
  {
    id: 'notif-011',
    type: 'payment',
    title: 'Payment Received',
    body: 'Stephanie Nguyen paid $1,875 deposit on INV-0004',
    link: 'invoices',
    read: true,
    createdAt: daysAgo(7, 0, 0),
    icon: 'dollar',
  },
  {
    id: 'notif-012',
    type: 'estimate',
    title: 'Estimate Sent',
    body: 'WM-0006 emailed to Jordan Lee for $5,600 — awaiting approval',
    link: 'estimates',
    read: true,
    createdAt: daysAgo(8, 2, 30),
    icon: 'document',
  },
  {
    id: 'notif-013',
    type: 'system',
    title: 'Backup Complete',
    body: 'Weekly data backup completed — all records secure',
    link: null,
    read: true,
    createdAt: daysAgo(9, 6, 0),
    icon: 'bell',
  },
  {
    id: 'notif-014',
    type: 'invoice',
    title: 'Invoice Paid in Full',
    body: 'INV-0005 for Anthony Reed marked as paid ($7,200)',
    link: 'invoices',
    read: true,
    createdAt: daysAgo(11, 4, 15),
    icon: 'dollar',
  },
  {
    id: 'notif-015',
    type: 'lead',
    title: 'Lead Status Updated',
    body: 'Maria Santos moved to "Proposal Sent" stage',
    link: 'leadhub',
    read: true,
    createdAt: daysAgo(13, 9, 0),
    icon: 'user',
  },
];

// ── Context ───────────────────────────────────────────────────────────────────
const NotificationsContext = createContext(null);

const STORAGE_KEY = 'wm-notifications-v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return null;
}

function saveToStorage(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // ignore quota errors
  }
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    const stored = loadFromStorage();
    return stored ?? SEED_NOTIFICATIONS;
  });

  // Persist on every change
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  // Ensure newest-first ordering is maintained
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  function addNotification(notif) {
    const newNotif = {
      icon: 'bell',
      link: null,
      read: false,
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }

  function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setNotifications([]);
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications: sorted,
        unreadCount,
        addNotification,
        markRead,
        markAllRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
