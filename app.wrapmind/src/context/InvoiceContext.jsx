import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext';
import * as svc from '../lib/invoiceService.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'wm-invoices-v1';
const MIGRATION_KEY = 'wm-invoices-migrated';
const TAX_RATE = 0.0875;

function deriveInvoicePrefix(org) {
  if (org?.settings?.invoicePrefix) return org.settings.invoicePrefix;
  return 'INV';
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_INVOICES = [
  // 1 — paid (Marcus Bell)
  {
    id: 'inv-001',
    locationId: 'loc-001',
    invoiceNumber: 'INV-0001',
    estimateId: 'est-003',
    estimateNumber: 'WM-0003',
    status: 'paid',
    customerId: 'c001',
    customerName: 'Marcus Bell',
    customerEmail: 'marcus.bell@email.com',
    customerPhone: '(310) 555-0192',
    vehicleLabel: '2023 Tesla Model 3',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – 3M 1080 Matte Charcoal', qty: 1, unit: 'job', unitPrice: 2800, total: 2800 },
      { id: 'li-2', description: 'Labor – Installation (18 hrs @ $50/hr)', qty: 18, unit: 'hr', unitPrice: 50, total: 900 },
      { id: 'li-3', description: 'Ceramic Coating Add-on', qty: 1, unit: 'job', unitPrice: 350, total: 350 },
    ],
    subtotal: 4050,
    taxRate: TAX_RATE,
    taxAmount: 354.38,
    discount: 0,
    total: 4404.38,
    amountPaid: 4404.38,
    amountDue: 0,
    payments: [
      { id: 'pay-001', method: 'Card', amount: 2000, note: 'Deposit', recordedAt: '2025-01-21T14:00:00Z', recordedBy: 'Alex R.' },
      { id: 'pay-002', method: 'Card', amount: 2404.38, note: 'Balance – pickup', recordedAt: '2025-02-01T10:30:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Net 15 terms. Full payment due before vehicle is released.',
    terms: 'Net 15',
    issuedAt: '2025-01-20T09:00:00Z',
    dueAt: '2025-02-04T00:00:00Z',
    paidAt: '2025-02-01T10:30:00Z',
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 2 — paid (Devon Walsh)
  {
    id: 'inv-002',
    locationId: 'loc-001',
    invoiceNumber: 'INV-0002',
    estimateId: 'est-007',
    estimateNumber: 'WM-0007',
    status: 'paid',
    customerId: 'c002',
    customerName: 'Devon Walsh',
    customerEmail: 'devon.walsh@email.com',
    customerPhone: '(424) 555-0341',
    vehicleLabel: '2022 BMW M4 Competition',
    lineItems: [
      { id: 'li-1', description: 'Partial Wrap – Hood & Roof – Avery Dennison Gloss Black', qty: 1, unit: 'job', unitPrice: 1400, total: 1400 },
      { id: 'li-2', description: 'Paint Protection Film – Front Bumper', qty: 1, unit: 'job', unitPrice: 650, total: 650 },
      { id: 'li-3', description: 'Labor – 8 hrs', qty: 8, unit: 'hr', unitPrice: 50, total: 400 },
    ],
    subtotal: 2450,
    taxRate: TAX_RATE,
    taxAmount: 214.38,
    discount: 100,
    total: 2564.38,
    amountPaid: 2564.38,
    amountDue: 0,
    payments: [
      { id: 'pay-003', method: 'Zelle', amount: 2564.38, note: 'Paid in full', recordedAt: '2025-02-10T09:15:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Returning customer – 5% loyalty discount applied.',
    terms: 'Due on Receipt',
    issuedAt: '2025-02-08T10:00:00Z',
    dueAt: '2025-02-08T00:00:00Z',
    paidAt: '2025-02-10T09:15:00Z',
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 3 — partial (Tina Marsh)
  {
    id: 'inv-003',
    locationId: 'loc-001',
    invoiceNumber: 'INV-0003',
    estimateId: 'est-011',
    estimateNumber: 'WM-0011',
    status: 'partial',
    customerId: 'c003',
    customerName: 'Tina Marsh',
    customerEmail: 'tina.marsh@email.com',
    customerPhone: '(213) 555-0887',
    vehicleLabel: '2024 Porsche Cayenne',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Satin Midnight Blue', qty: 1, unit: 'job', unitPrice: 3600, total: 3600 },
      { id: 'li-2', description: 'Window Tint – All Windows', qty: 1, unit: 'job', unitPrice: 480, total: 480 },
      { id: 'li-3', description: 'Labor – 22 hrs', qty: 22, unit: 'hr', unitPrice: 50, total: 1100 },
    ],
    subtotal: 5180,
    taxRate: TAX_RATE,
    taxAmount: 453.25,
    discount: 0,
    total: 5633.25,
    amountPaid: 2000,
    amountDue: 3633.25,
    payments: [
      { id: 'pay-004', method: 'Check', amount: 2000, note: '50% deposit at drop-off', recordedAt: '2025-03-05T11:00:00Z', recordedBy: 'Jordan L.' },
    ],
    notes: 'Balance due upon completion.',
    terms: 'Net 30',
    issuedAt: '2025-03-04T09:00:00Z',
    dueAt: '2025-04-03T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Jordan L.',
  },
  // 4 — partial (Kyle Huang)
  {
    id: 'inv-004',
    locationId: 'loc-001',
    invoiceNumber: 'INV-0004',
    estimateId: 'est-015',
    estimateNumber: 'WM-0015',
    status: 'partial',
    customerId: 'c004',
    customerName: 'Kyle Huang',
    customerEmail: 'kyle.huang@email.com',
    customerPhone: '(626) 555-0123',
    vehicleLabel: '2021 Toyota Tacoma TRD',
    lineItems: [
      { id: 'li-1', description: 'Roof & Pillars Wrap – Gloss Black', qty: 1, unit: 'job', unitPrice: 900, total: 900 },
      { id: 'li-2', description: 'Hood Wrap – Matte Gunmetal', qty: 1, unit: 'job', unitPrice: 750, total: 750 },
      { id: 'li-3', description: 'Rear Bumper Guard Film', qty: 1, unit: 'job', unitPrice: 320, total: 320 },
      { id: 'li-4', description: 'Labor – 12 hrs', qty: 12, unit: 'hr', unitPrice: 50, total: 600 },
    ],
    subtotal: 2570,
    taxRate: TAX_RATE,
    taxAmount: 224.88,
    discount: 0,
    total: 2794.88,
    amountPaid: 1000,
    amountDue: 1794.88,
    payments: [
      { id: 'pay-005', method: 'Cash', amount: 1000, note: 'Deposit – cash', recordedAt: '2025-03-18T08:45:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Customer will pay balance on pickup.',
    terms: 'Net 15',
    issuedAt: '2025-03-17T10:00:00Z',
    dueAt: '2025-04-01T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 5 — overdue (Brett Tanaka — fleet invoice 1)
  {
    id: 'inv-005',
    locationId: 'loc-001',
    invoiceNumber: 'INV-0005',
    estimateId: 'est-020',
    estimateNumber: 'WM-0020',
    status: 'overdue',
    customerId: 'c005',
    customerName: 'Brett Tanaka',
    customerEmail: 'brett.tanaka@fleetdepot.com',
    customerPhone: '(818) 555-0456',
    vehicleLabel: '2022 Ford Transit (Fleet #1)',
    lineItems: [
      { id: 'li-1', description: 'Full Commercial Wrap – Fleet Branding, Passenger Side', qty: 1, unit: 'job', unitPrice: 2200, total: 2200 },
      { id: 'li-2', description: 'Full Commercial Wrap – Fleet Branding, Driver Side', qty: 1, unit: 'job', unitPrice: 2200, total: 2200 },
      { id: 'li-3', description: 'Roof Lettering & Logo', qty: 1, unit: 'job', unitPrice: 480, total: 480 },
      { id: 'li-4', description: 'Labor – 20 hrs', qty: 20, unit: 'hr', unitPrice: 55, total: 1100 },
    ],
    subtotal: 5980,
    taxRate: TAX_RATE,
    taxAmount: 523.25,
    discount: 0,
    total: 6503.25,
    amountPaid: 0,
    amountDue: 6503.25,
    payments: [],
    notes: 'Net 30 – Fleet account. PO #FT-2025-44.',
    terms: 'Net 30',
    issuedAt: '2025-01-10T09:00:00Z',
    dueAt: '2025-02-09T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 6 — overdue (Brett Tanaka — fleet invoice 2)
  {
    id: 'inv-006',
    locationId: 'loc-002',
    invoiceNumber: 'INV-0006',
    estimateId: 'est-021',
    estimateNumber: 'WM-0021',
    status: 'overdue',
    customerId: 'c005',
    customerName: 'Brett Tanaka',
    customerEmail: 'brett.tanaka@fleetdepot.com',
    customerPhone: '(818) 555-0456',
    vehicleLabel: '2022 Ford Transit (Fleet #2)',
    lineItems: [
      { id: 'li-1', description: 'Full Commercial Wrap – Fleet Branding', qty: 1, unit: 'job', unitPrice: 4200, total: 4200 },
      { id: 'li-2', description: 'Labor – 18 hrs', qty: 18, unit: 'hr', unitPrice: 55, total: 990 },
    ],
    subtotal: 5190,
    taxRate: TAX_RATE,
    taxAmount: 454.13,
    discount: 0,
    total: 5644.13,
    amountPaid: 0,
    amountDue: 5644.13,
    payments: [],
    notes: 'Net 30 – Fleet account. PO #FT-2025-45. Second van in same fleet order.',
    terms: 'Net 30',
    issuedAt: '2025-01-10T09:00:00Z',
    dueAt: '2025-02-09T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 7 — sent (Jordan Lee)
  {
    id: 'inv-007',
    locationId: 'loc-002',
    invoiceNumber: 'INV-0007',
    estimateId: 'est-028',
    estimateNumber: 'WM-0028',
    status: 'sent',
    customerId: 'c006',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan.lee@email.com',
    customerPhone: '(323) 555-0219',
    vehicleLabel: '2020 Dodge Charger Scat Pack',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Gloss Racing Red', qty: 1, unit: 'job', unitPrice: 2950, total: 2950 },
      { id: 'li-2', description: 'Racing Stripes – White', qty: 1, unit: 'job', unitPrice: 320, total: 320 },
      { id: 'li-3', description: 'Labor – 16 hrs', qty: 16, unit: 'hr', unitPrice: 50, total: 800 },
    ],
    subtotal: 4070,
    taxRate: TAX_RATE,
    taxAmount: 356.13,
    discount: 0,
    total: 4426.13,
    amountPaid: 0,
    amountDue: 4426.13,
    payments: [],
    notes: 'Payment due within 15 days of invoice date.',
    terms: 'Net 15',
    issuedAt: '2025-03-28T09:00:00Z',
    dueAt: '2025-04-12T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 8 — sent (Priya Nair)
  {
    id: 'inv-008',
    locationId: 'loc-002',
    invoiceNumber: 'INV-0008',
    estimateId: 'est-032',
    estimateNumber: 'WM-0032',
    status: 'sent',
    customerId: 'c007',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@email.com',
    customerPhone: '(714) 555-0738',
    vehicleLabel: '2023 Honda CR-V Hybrid',
    lineItems: [
      { id: 'li-1', description: 'Roof Wrap – Satin Black', qty: 1, unit: 'job', unitPrice: 550, total: 550 },
      { id: 'li-2', description: 'Mirror Caps – Carbon Fiber Vinyl', qty: 2, unit: 'ea', unitPrice: 120, total: 240 },
      { id: 'li-3', description: 'Labor – 6 hrs', qty: 6, unit: 'hr', unitPrice: 50, total: 300 },
    ],
    subtotal: 1090,
    taxRate: TAX_RATE,
    taxAmount: 95.38,
    discount: 50,
    total: 1135.38,
    amountPaid: 0,
    amountDue: 1135.38,
    payments: [],
    notes: '$50 new customer discount applied.',
    terms: 'Net 7',
    issuedAt: '2025-04-04T10:00:00Z',
    dueAt: '2025-04-11T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Jordan L.',
  },
  // 9 — draft (Sam Okafor)
  {
    id: 'inv-009',
    locationId: 'loc-002',
    invoiceNumber: 'INV-0009',
    estimateId: 'est-038',
    estimateNumber: 'WM-0038',
    status: 'draft',
    customerId: 'c008',
    customerName: 'Sam Okafor',
    customerEmail: 'sam.okafor@email.com',
    customerPhone: '(562) 555-0884',
    vehicleLabel: '2024 Ram 1500 TRX',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Matte Army Green', qty: 1, unit: 'job', unitPrice: 3800, total: 3800 },
      { id: 'li-2', description: 'Blackout Package – Emblems & Trim', qty: 1, unit: 'job', unitPrice: 450, total: 450 },
      { id: 'li-3', description: 'Labor – 20 hrs', qty: 20, unit: 'hr', unitPrice: 50, total: 1000 },
    ],
    subtotal: 5250,
    taxRate: TAX_RATE,
    taxAmount: 459.38,
    discount: 0,
    total: 5709.38,
    amountPaid: 0,
    amountDue: 5709.38,
    payments: [],
    notes: 'Pending customer approval of wrap sample colors.',
    terms: 'Net 15',
    issuedAt: '2025-04-08T14:00:00Z',
    dueAt: '2025-04-23T00:00:00Z',
    paidAt: null,
    voidedAt: null,
    createdBy: 'Alex R.',
  },
  // 10 — void (Morgan Reyes)
  {
    id: 'inv-010',
    locationId: 'loc-002',
    invoiceNumber: 'INV-0010',
    estimateId: 'est-041',
    estimateNumber: 'WM-0041',
    status: 'void',
    customerId: 'c009',
    customerName: 'Morgan Reyes',
    customerEmail: 'morgan.reyes@email.com',
    customerPhone: '(949) 555-0601',
    vehicleLabel: '2019 Jeep Wrangler Unlimited',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Digital Camo Pattern', qty: 1, unit: 'job', unitPrice: 3100, total: 3100 },
      { id: 'li-2', description: 'Labor – 17 hrs', qty: 17, unit: 'hr', unitPrice: 50, total: 850 },
    ],
    subtotal: 3950,
    taxRate: TAX_RATE,
    taxAmount: 345.63,
    discount: 0,
    total: 4295.63,
    amountPaid: 0,
    amountDue: 4295.63,
    payments: [],
    notes: 'Voided – customer cancelled project before start.',
    terms: 'Net 30',
    issuedAt: '2025-02-14T09:00:00Z',
    dueAt: '2025-03-16T00:00:00Z',
    paidAt: null,
    voidedAt: '2025-02-16T11:30:00Z',
    createdBy: 'Alex R.',
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadInvoices() {
  if (import.meta.env.VITE_DEV_AUTH === '1') return SEED_INVOICES;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return SEED_INVOICES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_INVOICES;
  } catch {
    return SEED_INVOICES;
  }
}

function saveInvoices(invoices) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(invoices));
  } catch {
    // ignore storage errors
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
  const { orgId, org } = useAuth();
  const { activeLocationId } = useLocations();
  const [invoices, setInvoices] = useState(() => loadInvoices());

  // Write-through: persist to localStorage on every state change
  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  // Supabase sync: migrate local data on first auth load, then fetch remote
  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    (async () => {
      try {
        const migrated = localStorage.getItem(MIGRATION_KEY);
        if (!migrated) {
          const local = loadInvoices();
          if (local.length > 0) {
            await svc.migrateLocalInvoices(local, orgId);
          }
          localStorage.setItem(MIGRATION_KEY, orgId);
        }

        const remote = await svc.fetchInvoices(orgId);
        if (!cancelled) {
          setInvoices(remote);
        }
      } catch (err) {
        console.error('[InvoiceContext] Supabase sync failed, using localStorage:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [orgId]);

  const filteredInvoices = activeLocationId === 'all'
    ? invoices
    : invoices.filter(i => !i.locationId || i.locationId === activeLocationId);

  // ── Derived ────────────────────────────────────────────────────────────────

  const invoiceCount = invoices.length;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getNextInvoiceNumber = useCallback(() => {
    const prefix = deriveInvoicePrefix(org);
    const maxNum = invoices.reduce((max, inv) => {
      const n = parseInt(inv.invoiceNumber?.replace(/^[A-Z]+-/, '') || '0', 10);
      return n > max ? n : max;
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }, [invoices, org]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const addInvoice = useCallback((invoiceData) => {
    const newInvoice = {
      id: crypto.randomUUID(),
      locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId,
      invoiceNumber: invoiceData.invoiceNumber,
      status: 'draft',
      payments: [],
      amountPaid: 0,
      amountDue: invoiceData.total ?? 0,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 15 * 86400000).toISOString(),
      paidAt: null,
      voidedAt: null,
      createdBy: 'System',
      ...invoiceData,
    };
    setInvoices(prev => [newInvoice, ...prev]);

    if (orgId) {
      svc.insertInvoice(newInvoice, orgId).catch(err =>
        console.error('[InvoiceContext] Supabase insert failed:', err)
      );
    }

    return newInvoice;
  }, [activeLocationId, orgId]);

  const updateInvoice = useCallback((id, patch) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...patch } : inv))
    );

    if (orgId) {
      svc.patchInvoice(id, patch).catch(err =>
        console.error('[InvoiceContext] Supabase update failed:', err)
      );
    }
  }, [orgId]);

  const deleteInvoice = useCallback((id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));

    if (orgId) {
      svc.removeInvoice(id).catch(err =>
        console.error('[InvoiceContext] Supabase delete failed:', err)
      );
    }
  }, [orgId]);

  const getInvoiceById = useCallback(
    (id) => invoices.find(inv => inv.id === id),
    [invoices]
  );

  // ── Payments ───────────────────────────────────────────────────────────────

  const recordPayment = useCallback((invoiceId, paymentData) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== invoiceId) return inv;
        const payment = {
          id: crypto.randomUUID(),
          ...paymentData,
          recordedAt: new Date().toISOString(),
        };
        const payments = [...(inv.payments || []), payment];
        const amountPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
        const amountDue = Math.max(
          0,
          parseFloat((inv.total - amountPaid).toFixed(2))
        );
        const isPaid = amountDue <= 0;
        return {
          ...inv,
          payments,
          amountPaid: parseFloat(amountPaid.toFixed(2)),
          amountDue,
          status: isPaid
            ? 'paid'
            : amountPaid > 0
            ? 'partial'
            : inv.status,
          paidAt: isPaid && !inv.paidAt ? new Date().toISOString() : inv.paidAt,
        };
      })
    );

    if (orgId) {
      const payment = {
        id: crypto.randomUUID(),
        ...paymentData,
        recordedAt: new Date().toISOString(),
      };
      svc.insertPayment(invoiceId, payment).then(() => {
        const inv = invoices.find(i => i.id === invoiceId);
        if (inv) {
          const payments = [...(inv.payments || []), payment];
          const amountPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
          const amountDue = Math.max(0, parseFloat((inv.total - amountPaid).toFixed(2)));
          const isPaid = amountDue <= 0;
          svc.patchInvoice(invoiceId, {
            amountPaid: parseFloat(amountPaid.toFixed(2)),
            amountDue,
            status: isPaid ? 'paid' : amountPaid > 0 ? 'partial' : inv.status,
            paidAt: isPaid && !inv.paidAt ? new Date().toISOString() : inv.paidAt,
          }).catch(err => console.error('[InvoiceContext] Supabase payment patch failed:', err));
        }
      }).catch(err =>
        console.error('[InvoiceContext] Supabase payment insert failed:', err)
      );
    }
  }, [orgId, invoices]);

  // ── Convert estimate → invoice (atomic) ────────────────────────────────────

  const convertEstimateToInvoice = useCallback(
    (estimate) => {
      const subtotal =
        (estimate.basePrice || 0) +
        (estimate.laborCost || 0) +
        (estimate.materialCost || 0);
      const taxAmount = parseFloat(
        ((subtotal - (estimate.discount || 0)) * TAX_RATE).toFixed(2)
      );
      const total = parseFloat(
        (subtotal - (estimate.discount || 0) + taxAmount).toFixed(2)
      );

      const newInvoice = {
        id: crypto.randomUUID(),
        locationId: estimate.locationId || (activeLocationId === 'all' ? 'loc-001' : activeLocationId),
        invoiceNumber: getNextInvoiceNumber(),
        estimateId: estimate.id,
        estimateNumber: estimate.estimateNumber,
        status: 'draft',
        customerId: estimate.customerId,
        customerName: estimate.customerName,
        customerEmail: estimate.customerEmail || '',
        customerPhone: estimate.customerPhone || '',
        vehicleLabel: estimate.vehicleLabel || '',
        lineItems: [
          {
            id: crypto.randomUUID(),
            description: `${estimate.package} – ${estimate.material} ${estimate.materialColor || ''}`.trim(),
            qty: 1,
            unit: 'job',
            unitPrice: estimate.basePrice || 0,
            total: estimate.basePrice || 0,
          },
          {
            id: crypto.randomUUID(),
            description: `Labor – Installation (${estimate.laborHours || 0} hrs)`,
            qty: estimate.laborHours || 0,
            unit: 'hr',
            unitPrice: estimate.laborHours
              ? Math.round((estimate.laborCost || 0) / estimate.laborHours)
              : 0,
            total: estimate.laborCost || 0,
          },
          ...(estimate.materialCost
            ? [
                {
                  id: crypto.randomUUID(),
                  description: 'Materials & Supplies',
                  qty: 1,
                  unit: 'job',
                  unitPrice: estimate.materialCost,
                  total: estimate.materialCost,
                },
              ]
            : []),
        ],
        subtotal,
        taxRate: TAX_RATE,
        taxAmount,
        discount: estimate.discount || 0,
        total,
        amountPaid: 0,
        amountDue: total,
        payments: [],
        notes: estimate.notes || '',
        terms: 'Net 15',
        issuedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 15 * 86400000).toISOString(),
        paidAt: null,
        voidedAt: null,
        createdBy: estimate.createdBy || 'System',
      };

      setInvoices(prev => [newInvoice, ...prev]);

      if (orgId) {
        svc.insertInvoice(newInvoice, orgId).catch(err =>
          console.error('[InvoiceContext] Supabase convert insert failed:', err)
        );
      }

      return newInvoice;
    },
    [getNextInvoiceNumber, activeLocationId, orgId]
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value = {
    invoices: filteredInvoices,
    allInvoices: invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    getInvoiceById,
    getNextInvoiceNumber,
    convertEstimateToInvoice,
    invoiceCount,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}
