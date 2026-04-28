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
  normalizeInvoice,
} from '../api/invoices.graphql.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'wm-invoices-v1';
const TAX_RATE = 0.0875;

function deriveInvoicePrefix(org) {
  if (org?.settings?.invoicePrefix) return org.settings.invoicePrefix;
  return 'INV';
}

// ─── Seed Data ───────────────────────────────────────────────────────────────


// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
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
    // seed removed
    if (!apolloLoading && !apolloError && apolloInvoices.length > 0) return apolloInvoices;
    return loadFromStorage();
  });

  // Sync Apollo data once available (run once, guard with ref)
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && !apolloLoading && !apolloError && apolloInvoices.length > 0) {
      initRef.current = true;
      // Normalize snake_case DB rows → camelCase app shape
      const normalized = apolloInvoices.map(normalizeInvoice).filter(Boolean);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvoices(normalized);
    }
  }, [apolloLoading, apolloError, apolloInvoices, isDevAuth]);

  // Write-through: persist local state changes to localStorage
  useEffect(() => {
    if (!isDevAuth) saveToStorage(invoices);
  }, [invoices, isDevAuth]);

  // ── Realtime subscriptions (patch layer — Apollo remains primary source) ────
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!orgId || isDevAuth) return;

    setRealtimeConnected(false);
    const channel = supabase.channel('invoices-realtime');

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'invoices',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        const newInv = {
          id: payload.new.id,
          orgId: payload.new.org_id,
          locationId: payload.new.location_id,
          invoiceNumber: payload.new.invoice_number,
          estimateId: payload.new.estimate_id,
          customerId: payload.new.customer_id,
          vehicleId: payload.new.vehicle_id,
          lineItems: payload.new.line_items_json ? JSON.parse(payload.new.line_items_json) : [],
          subtotal: payload.new.subtotal,
          tax: payload.new.tax,
          discount: payload.new.discount,
          total: payload.new.total,
          amountPaid: payload.new.amount_paid,
          amountDue: payload.new.amount_due,
          status: payload.new.status,
          payments: payload.new.payments ? JSON.parse(payload.new.payments) : [],
          terms: payload.new.terms,
          notes: payload.new.notes,
          issuedAt: payload.new.issued_at,
          dueAt: payload.new.due_at,
          paidAt: payload.new.paid_at,
          voidedAt: payload.new.voided_at,
          createdAt: payload.new.created_at,
          updatedAt: payload.new.updated_at,
        };
        setInvoices(prev => {
          if (prev.some(i => i.id === newInv.id)) return prev;
          return [newInv, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'invoices',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setInvoices(prev =>
          prev.map(inv => inv.id === payload.new.id
            ? {
                ...inv,
                orgId: payload.new.org_id,
                locationId: payload.new.location_id,
                invoiceNumber: payload.new.invoice_number,
                estimateId: payload.new.estimate_id,
                customerId: payload.new.customer_id,
                vehicleId: payload.new.vehicle_id,
                lineItems: payload.new.line_items_json ? JSON.parse(payload.new.line_items_json) : inv.lineItems,
                subtotal: payload.new.subtotal,
                tax: payload.new.tax,
                discount: payload.new.discount,
                total: payload.new.total,
                amountPaid: payload.new.amount_paid,
                amountDue: payload.new.amount_due,
                status: payload.new.status,
                payments: payload.new.payments ? JSON.parse(payload.new.payments) : inv.payments,
                terms: payload.new.terms,
                notes: payload.new.notes,
                issuedAt: payload.new.issued_at,
                dueAt: payload.new.due_at,
                paidAt: payload.new.paid_at,
                voidedAt: payload.new.voided_at,
                updatedAt: payload.new.updated_at,
              }
            : inv
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'invoices',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        setInvoices(prev => prev.filter(inv => inv.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, isDevAuth]);

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
      vehicleId: invoiceData.vehicleId ?? null,
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
          locationId:    newInvoice.locationId,
          invoiceNumber: newInvoice.invoiceNumber,
          customerId:  newInvoice.customerId,
          estimateId:   newInvoice.estimateId    ?? null,
          vehicleId:   newInvoice.vehicleId,
          status:       newInvoice.status,
          lineItems:     JSON.stringify(newInvoice.lineItems ?? []),
          subtotal:     newInvoice.subtotal      ?? null,
          taxAmount:    newInvoice.taxAmount     ?? null,
          discount:     newInvoice.discount      ?? 0,
          total:        newInvoice.total,
          amountPaid:   0,
          amountDue:    newInvoice.total,
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
      vehicleId: estimate.vehicleId,
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
    realtimeConnected,
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
