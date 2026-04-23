import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import {
  USE_INVOICES,
  USE_INVOICE,
  USE_CREATE_INVOICE,
  USE_UPDATE_INVOICE,
  USE_DELETE_INVOICE,
} from '../api/invoices.graphql.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'wm-invoices-v1';
const TAX_RATE = 0.0875;

function deriveInvoicePrefix(org) {
  if (org?.settings?.invoicePrefix) return org.settings.invoicePrefix;
  return 'INV';
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_INVOICES = [
  {
    id: 'inv-001', locationId: 'loc-001', invoiceNumber: 'INV-0001',
    estimateId: 'est-003', estimateNumber: 'WM-0003',
    status: 'paid',
    customerId: 'c001', customerName: 'Marcus Bell',
    customerEmail: 'marcus.bell@email.com', customerPhone: '(310) 555-0192',
    vehicleLabel: '2023 Tesla Model 3',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – 3M 1080 Matte Charcoal', qty: 1, unit: 'job', unitPrice: 2800, total: 2800 },
      { id: 'li-2', description: 'Labor – Installation (18 hrs @ $50/hr)', qty: 18, unit: 'hr', unitPrice: 50, total: 900 },
      { id: 'li-3', description: 'Ceramic Coating Add-on', qty: 1, unit: 'job', unitPrice: 350, total: 350 },
    ],
    subtotal: 4050, taxRate: TAX_RATE, taxAmount: 354.38, discount: 0,
    total: 4404.38, amountPaid: 4404.38, amountDue: 0,
    payments: [
      { id: 'pay-001', method: 'Card', amount: 2000, note: 'Deposit', recordedAt: '2025-01-21T14:00:00Z', recordedBy: 'Alex R.' },
      { id: 'pay-002', method: 'Card', amount: 2404.38, note: 'Balance – pickup', recordedAt: '2025-02-01T10:30:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Net 15 terms. Full payment due before vehicle is released.',
    terms: 'Net 15',
    issuedAt: '2025-01-20T09:00:00Z', dueAt: '2025-02-04T00:00:00Z',
    paidAt: '2025-02-01T10:30:00Z', voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-002', locationId: 'loc-001', invoiceNumber: 'INV-0002',
    estimateId: 'est-007', estimateNumber: 'WM-0007',
    status: 'paid',
    customerId: 'c002', customerName: 'Devon Walsh',
    customerEmail: 'devon.walsh@email.com', customerPhone: '(424) 555-0341',
    vehicleLabel: '2022 BMW M4 Competition',
    lineItems: [
      { id: 'li-1', description: 'Partial Wrap – Hood & Roof – Avery Dennison Gloss Black', qty: 1, unit: 'job', unitPrice: 1400, total: 1400 },
      { id: 'li-2', description: 'Paint Protection Film – Front Bumper', qty: 1, unit: 'job', unitPrice: 650, total: 650 },
      { id: 'li-3', description: 'Labor – 8 hrs', qty: 8, unit: 'hr', unitPrice: 50, total: 400 },
    ],
    subtotal: 2450, taxRate: TAX_RATE, taxAmount: 214.38, discount: 100,
    total: 2564.38, amountPaid: 2564.38, amountDue: 0,
    payments: [
      { id: 'pay-003', method: 'Zelle', amount: 2564.38, note: 'Paid in full', recordedAt: '2025-02-10T09:15:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Returning customer – 5% loyalty discount applied.',
    terms: 'Due on Receipt',
    issuedAt: '2025-02-08T10:00:00Z', dueAt: '2025-02-08T00:00:00Z',
    paidAt: '2025-02-10T09:15:00Z', voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-003', locationId: 'loc-001', invoiceNumber: 'INV-0003',
    estimateId: 'est-011', estimateNumber: 'WM-0011',
    status: 'partial',
    customerId: 'c003', customerName: 'Tina Marsh',
    customerEmail: 'tina.marsh@email.com', customerPhone: '(213) 555-0887',
    vehicleLabel: '2024 Porsche Cayenne',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Satin Midnight Blue', qty: 1, unit: 'job', unitPrice: 3600, total: 3600 },
      { id: 'li-2', description: 'Window Tint – All Windows', qty: 1, unit: 'job', unitPrice: 480, total: 480 },
      { id: 'li-3', description: 'Labor – 22 hrs', qty: 22, unit: 'hr', unitPrice: 50, total: 1100 },
    ],
    subtotal: 5180, taxRate: TAX_RATE, taxAmount: 453.25, discount: 0,
    total: 5633.25, amountPaid: 2000, amountDue: 3633.25,
    payments: [
      { id: 'pay-004', method: 'Check', amount: 2000, note: '50% deposit at drop-off', recordedAt: '2025-03-05T11:00:00Z', recordedBy: 'Jordan L.' },
    ],
    notes: 'Balance due upon completion.',
    terms: 'Net 30',
    issuedAt: '2025-03-04T09:00:00Z', dueAt: '2025-04-03T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Jordan L.',
  },
  {
    id: 'inv-004', locationId: 'loc-001', invoiceNumber: 'INV-0004',
    estimateId: 'est-015', estimateNumber: 'WM-0015',
    status: 'partial',
    customerId: 'c004', customerName: 'Kyle Huang',
    customerEmail: 'kyle.huang@email.com', customerPhone: '(626) 555-0123',
    vehicleLabel: '2021 Toyota Tacoma TRD',
    lineItems: [
      { id: 'li-1', description: 'Roof & Pillars Wrap – Gloss Black', qty: 1, unit: 'job', unitPrice: 900, total: 900 },
      { id: 'li-2', description: 'Hood Wrap – Matte Gunmetal', qty: 1, unit: 'job', unitPrice: 750, total: 750 },
      { id: 'li-3', description: 'Rear Bumper Guard Film', qty: 1, unit: 'job', unitPrice: 320, total: 320 },
      { id: 'li-4', description: 'Labor – 12 hrs', qty: 12, unit: 'hr', unitPrice: 50, total: 600 },
    ],
    subtotal: 2570, taxRate: TAX_RATE, taxAmount: 224.88, discount: 0,
    total: 2794.88, amountPaid: 1500, amountDue: 1294.88,
    payments: [
      { id: 'pay-005', method: 'Cash', amount: 1500, note: 'Deposit at booking', recordedAt: '2025-03-10T16:00:00Z', recordedBy: 'Sam T.' },
    ],
    notes: 'Split payment — remaining balance on completion.',
    terms: 'Net 15',
    issuedAt: '2025-03-09T09:00:00Z', dueAt: '2025-03-24T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Sam T.',
  },
  {
    id: 'inv-005', locationId: 'loc-001', invoiceNumber: 'INV-0005',
    estimateId: 'est-017', estimateNumber: 'WM-0017',
    status: 'sent',
    customerId: 'c005', customerName: 'Riley Carson',
    customerEmail: 'riley.carson@email.com', customerPhone: '(818) 555-0277',
    vehicleLabel: '2022 Mercedes-AMG GT',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – ORACAL 970RA Satin Pearl White', qty: 1, unit: 'job', unitPrice: 3100, total: 3100 },
      { id: 'li-2', description: 'Chrome Delete – Window Trim', qty: 1, unit: 'job', unitPrice: 280, total: 280 },
      { id: 'li-3', description: 'Labor – 16 hrs', qty: 16, unit: 'hr', unitPrice: 50, total: 800 },
    ],
    subtotal: 4180, taxRate: TAX_RATE, taxAmount: 365.75, discount: 0,
    total: 4545.75, amountPaid: 0, amountDue: 4545.75,
    payments: [],
    notes: 'Sent for review. Awaiting customer confirmation.',
    terms: 'Due on Receipt',
    issuedAt: '2025-03-18T10:00:00Z', dueAt: '2025-04-02T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-006', locationId: 'loc-001', invoiceNumber: 'INV-0006',
    estimateId: 'est-019', estimateNumber: 'WM-0019',
    status: 'overdue',
    customerId: 'c005', customerName: 'Avery Nguyen',
    customerEmail: 'avery.nguyen@email.com', customerPhone: '(714) 555-0443',
    vehicleLabel: '2023 Rivian R1T',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – 3M 2080 Satin Military Green', qty: 1, unit: 'job', unitPrice: 3300, total: 3300 },
      { id: 'li-2', description: 'Bedliner Protection Film', qty: 1, unit: 'job', unitPrice: 420, total: 420 },
      { id: 'li-3', description: 'Labor – 18 hrs', qty: 18, unit: 'hr', unitPrice: 50, total: 900 },
    ],
    subtotal: 4620, taxRate: TAX_RATE, taxAmount: 404.25, discount: 200,
    total: 4824.25, amountPaid: 0, amountDue: 4824.25,
    payments: [],
    notes: 'Past due — sent two reminder emails.',
    terms: 'Net 15',
    issuedAt: '2025-02-01T09:00:00Z', dueAt: '2025-02-16T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Morgan L.',
  },
  {
    id: 'inv-007', locationId: 'loc-002', invoiceNumber: 'INV-0007',
    estimateId: 'est-021', estimateNumber: 'WM-0021',
    status: 'paid',
    customerId: 'c006', customerName: 'Cameron Poe',
    customerEmail: 'cameron.poe@fleetlogistics.com', customerPhone: '(949) 555-0556',
    vehicleLabel: '2023 Ford Transit (Fleet)',
    lineItems: [
      { id: 'li-1', description: 'Full Fleet Wrap – 4 Units – Gloss White + Branding', qty: 4, unit: 'units', unitPrice: 3800, total: 15200 },
      { id: 'li-2', description: 'Logo Design & Print Setup', qty: 1, unit: 'flat', unitPrice: 600, total: 600 },
      { id: 'li-3', description: 'Labor – 96 hrs total (24/unit)', qty: 96, unit: 'hr', unitPrice: 50, total: 4800 },
    ],
    subtotal: 20600, taxRate: TAX_RATE, taxAmount: 1802.50, discount: 500,
    total: 21902.50, amountPaid: 21902.50, amountDue: 0,
    payments: [
      { id: 'pay-006', method: 'Wire', amount: 21902.50, note: 'Full payment – wire transfer', recordedAt: '2025-03-01T12:00:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Fleet wrap project – units delivered and approved.',
    terms: 'Net 30',
    issuedAt: '2025-02-25T09:00:00Z', dueAt: '2025-03-27T00:00:00Z',
    paidAt: '2025-03-01T12:00:00Z', voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-008', locationId: 'loc-002', invoiceNumber: 'INV-0008',
    estimateId: 'est-023', estimateNumber: 'WM-0023',
    status: 'partial',
    customerId: 'c006', customerName: 'Cameron Poe',
    customerEmail: 'cameron.poe@fleetlogistics.com', customerPhone: '(949) 555-0556',
    vehicleLabel: '2023 Ford E-Transit (Fleet)',
    lineItems: [
      { id: 'li-1', description: 'Full Fleet Wrap – 3 Units – Gloss White + Branding', qty: 3, unit: 'units', unitPrice: 3600, total: 10800 },
      { id: 'li-2', description: 'EV Decal Package – Charge Port & Trim', qty: 3, unit: 'units', unitPrice: 180, total: 540 },
      { id: 'li-3', description: 'Labor – 72 hrs total (24/unit)', qty: 72, unit: 'hr', unitPrice: 50, total: 3600 },
    ],
    subtotal: 14940, taxRate: TAX_RATE, taxAmount: 1307.25, discount: 0,
    total: 16247.25, amountPaid: 8000, amountDue: 8247.25,
    payments: [
      { id: 'pay-007', method: 'ACH', amount: 8000, note: '50% deposit', recordedAt: '2025-03-12T10:00:00Z', recordedBy: 'Alex R.' },
    ],
    notes: 'Fleet EV wrap – in progress, remaining balance due on completion.',
    terms: 'Net 30',
    issuedAt: '2025-03-10T09:00:00Z', dueAt: '2025-04-09T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-009', locationId: 'loc-002', invoiceNumber: 'INV-0009',
    estimateId: 'est-038', estimateNumber: 'WM-0038',
    status: 'draft',
    customerId: 'c008', customerName: 'Sam Okafor',
    customerEmail: 'sam.okafor@email.com', customerPhone: '(562) 555-0884',
    vehicleLabel: '2024 Ram 1500 TRX',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Matte Army Green', qty: 1, unit: 'job', unitPrice: 3800, total: 3800 },
      { id: 'li-2', description: 'Blackout Package – Emblems & Trim', qty: 1, unit: 'job', unitPrice: 450, total: 450 },
      { id: 'li-3', description: 'Labor – 20 hrs', qty: 20, unit: 'hr', unitPrice: 50, total: 1000 },
    ],
    subtotal: 5250, taxRate: TAX_RATE, taxAmount: 459.38, discount: 0,
    total: 5709.38, amountPaid: 0, amountDue: 5709.38,
    payments: [],
    notes: 'Pending customer approval of wrap sample colors.',
    terms: 'Net 15',
    issuedAt: '2025-04-08T14:00:00Z', dueAt: '2025-04-23T00:00:00Z',
    paidAt: null, voidedAt: null,
    createdBy: 'Alex R.',
  },
  {
    id: 'inv-010', locationId: 'loc-002', invoiceNumber: 'INV-0010',
    estimateId: 'est-041', estimateNumber: 'WM-0041',
    status: 'voided',
    customerId: 'c009', customerName: 'Morgan Reyes',
    customerEmail: 'morgan.reyes@email.com', customerPhone: '(949) 555-0601',
    vehicleLabel: '2019 Jeep Wrangler Unlimited',
    lineItems: [
      { id: 'li-1', description: 'Full Body Wrap – Digital Camo Pattern', qty: 1, unit: 'job', unitPrice: 3100, total: 3100 },
      { id: 'li-2', description: 'Labor – 17 hrs', qty: 17, unit: 'hr', unitPrice: 50, total: 850 },
    ],
    subtotal: 3950, taxRate: TAX_RATE, taxAmount: 345.63, discount: 0,
    total: 4295.63, amountPaid: 0, amountDue: 4295.63,
    payments: [],
    notes: 'Voided – customer cancelled project before start.',
    terms: 'Net 30',
    issuedAt: '2025-02-14T09:00:00Z', dueAt: '2025-03-16T00:00:00Z',
    paidAt: null, voidedAt: '2025-02-16T11:30:00Z',
    createdBy: 'Alex R.',
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_INVOICES;
}

function saveToStorage(invoices) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(invoices)); } catch { /* ignore */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
  const { orgId, org } = useAuth();
  const { activeLocationId } = useLocations();

  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';

  // Apollo: all invoices for the org
  const { invoices: apolloInvoices, loading: apolloLoading, error: apolloError, refetch } =
    USE_INVOICES({ orgId, first: 300 });

  const [invoices, setInvoices] = useState(() => {
    if (isDevAuth) return SEED_INVOICES;
    if (!apolloLoading && !apolloError && apolloInvoices.length > 0) return apolloInvoices;
    return loadFromStorage();
  });

  // Sync Apollo data once available (run once, guard with ref)
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && !apolloLoading && !apolloError && apolloInvoices.length > 0) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvoices(apolloInvoices);
    }
  }, [apolloLoading, apolloError, apolloInvoices, isDevAuth]);

  // Write-through: persist local state changes to localStorage
  useEffect(() => {
    if (!isDevAuth) saveToStorage(invoices);
  }, [invoices, isDevAuth]);

  // ── Filtered view ──────────────────────────────────────────────────────────

  const filteredInvoices = activeLocationId === 'all' || !activeLocationId
    ? invoices
    : invoices.filter(i => !i.locationId || i.locationId === activeLocationId);

  // ── Apollo mutations ──────────────────────────────────────────────────────

  const [createInvoiceMutation] = USE_CREATE_INVOICE();
  const [updateInvoiceMutation] = USE_UPDATE_INVOICE();
  const [deleteInvoiceMutation] = USE_DELETE_INVOICE();

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

  const addInvoice = useCallback((invoiceData = {}) => {
    const newInvoice = {
      id: uuid(),
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

    if (orgId && !isDevAuth) {
      createInvoiceMutation({
        variables: {
          orgId,
          locationId:  newInvoice.locationId,
          invoiceNumber: newInvoice.invoiceNumber,
          customerId:   newInvoice.customerId,
          estimateId:   newInvoice.estimateId    ?? null,
          vehicleId:    newInvoice.vehicleId     ?? null,
          status:       newInvoice.status,
          lineItems:    JSON.stringify(newInvoice.lineItems ?? []),
          subtotal:     newInvoice.subtotal      ?? null,
          taxRate:      newInvoice.taxRate       ?? TAX_RATE,
          taxAmount:    newInvoice.taxAmount     ?? null,
          discount:     newInvoice.discount      ?? 0,
          total:        newInvoice.total,
          amountPaid:   newInvoice.amountPaid    ?? 0,
          amountDue:    newInvoice.amountDue     ?? newInvoice.total,
          payments:     JSON.stringify([]),
          terms:        newInvoice.terms         ?? null,
          notes:        newInvoice.notes         ?? null,
          issuedAt:     newInvoice.issuedAt,
          dueAt:        newInvoice.dueAt,
        },
      }).catch(err => console.error('[InvoiceContext] GraphQL create failed:', err));
    }

    return newInvoice;
  }, [activeLocationId, orgId, isDevAuth, createInvoiceMutation]);

  const updateInvoice = useCallback((id, patch) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...patch, updatedAt: new Date().toISOString() } : inv))
    );

    if (orgId && !isDevAuth) {
      const { lineItems, payments, ...rest } = patch;
      updateInvoiceMutation({
        variables: {
          id,
          ...rest,
          lineItems:  lineItems != null ? JSON.stringify(lineItems) : undefined,
          payments:   payments  != null ? JSON.stringify(payments)  : undefined,
        },
      }).catch(err => console.error('[InvoiceContext] GraphQL update failed:', err));
    }
  }, [orgId, isDevAuth, updateInvoiceMutation]);

  const deleteInvoice = useCallback((id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));

    if (orgId && !isDevAuth) {
      deleteInvoiceMutation({ variables: { id } })
        .catch(err => console.error('[InvoiceContext] GraphQL delete failed:', err));
    }
  }, [orgId, isDevAuth, deleteInvoiceMutation]);

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
          id: uuid(),
          ...paymentData,
          recordedAt: new Date().toISOString(),
        };
        const payments = [...(inv.payments || []), payment];
        const amountPaid = parseFloat(
          payments.reduce((s, p) => s + (p.amount || 0), 0).toFixed(2)
        );
        const amountDue = Math.max(0, parseFloat((inv.total - amountPaid).toFixed(2)));
        const isPaid = amountDue <= 0;
        return {
          ...inv,
          payments,
          amountPaid,
          amountDue,
          status: isPaid
            ? 'paid'
            : amountPaid > 0
            ? 'partial'
            : inv.status,
          paidAt: isPaid && !inv.paidAt ? new Date().toISOString() : inv.paidAt,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    if (orgId && !isDevAuth) {
      const inv = invoices.find(i => i.id === invoiceId);
      if (!inv) return;
      const payment = {
        id: uuid(),
        ...paymentData,
        recordedAt: new Date().toISOString(),
      };
      const payments = [...(inv.payments || []), payment];
      const amountPaid = parseFloat(payments.reduce((s, p) => s + (p.amount || 0), 0).toFixed(2));
      const amountDue = Math.max(0, parseFloat((inv.total - amountPaid).toFixed(2)));
      const isPaid = amountDue <= 0;
      updateInvoiceMutation({
        variables: {
          id: invoiceId,
          payments: JSON.stringify(payments),
          amountPaid,
          amountDue,
          status: isPaid ? 'paid' : amountPaid > 0 ? 'partial' : inv.status,
          paidAt: isPaid && !inv.paidAt ? new Date().toISOString() : inv.paidAt,
        },
      }).catch(err => console.error('[InvoiceContext] GraphQL recordPayment failed:', err));
    }
  }, [orgId, isDevAuth, invoices, updateInvoiceMutation]);

  // ── Convert estimate → invoice ────────────────────────────────────────────

  const convertEstimateToInvoice = useCallback((estimate) => {
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
      id: uuid(),
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
          id: uuid(),
          description: `${estimate.package} – ${estimate.material} ${estimate.materialColor || ''}`.trim(),
          qty: 1, unit: 'job',
          unitPrice: estimate.basePrice || 0,
          total: estimate.basePrice || 0,
        },
        {
          id: uuid(),
          description: `Labor – Installation (${estimate.laborHours || 0} hrs)`,
          qty: estimate.laborHours || 0, unit: 'hr',
          unitPrice: estimate.laborHours
            ? Math.round((estimate.laborCost || 0) / estimate.laborHours)
            : 0,
          total: estimate.laborCost || 0,
        },
        ...(estimate.materialCost
          ? [{
              id: uuid(),
              description: 'Materials & Supplies',
              qty: 1, unit: 'job',
              unitPrice: estimate.materialCost,
              total: estimate.materialCost,
            }]
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

    if (orgId && !isDevAuth) {
      createInvoiceMutation({
        variables: {
          orgId,
          locationId:   newInvoice.locationId,
          invoiceNumber: newInvoice.invoiceNumber,
          customerId:    newInvoice.customerId,
          estimateId:    newInvoice.estimateId    ?? null,
          vehicleId:     newInvoice.vehicleId    ?? null,
          status:        newInvoice.status,
          lineItems:     JSON.stringify(newInvoice.lineItems),
          subtotal:      newInvoice.subtotal,
          taxRate:       newInvoice.taxRate,
          taxAmount:     newInvoice.taxAmount,
          discount:      newInvoice.discount,
          total:         newInvoice.total,
          amountPaid:    0,
          amountDue:     newInvoice.total,
          payments:      JSON.stringify([]),
          terms:         newInvoice.terms,
          notes:         newInvoice.notes         ?? null,
          issuedAt:      newInvoice.issuedAt,
          dueAt:         newInvoice.dueAt,
        },
      }).catch(err => console.error('[InvoiceContext] GraphQL convert failed:', err));
    }

    return newInvoice;
  }, [getNextInvoiceNumber, activeLocationId, orgId, isDevAuth, createInvoiceMutation]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    invoices:       filteredInvoices,
    allInvoices:   invoices,
    loading:       !isDevAuth && apolloLoading,
    error:         apolloError,
    refetch,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    getInvoiceById,
    getNextInvoiceNumber,
    convertEstimateToInvoice,
    invoiceCount:  filteredInvoices.length,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}
