import { supabase } from './supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s) { return typeof s === 'string' && UUID_RE.test(s); }

// ─── Invoice conversion ─────────────────────────────────────────────────────

function invoiceToSnakeCase(inv, orgId) {
  const metadata = { ...(inv.metadata || {}) };
  if (inv.locationId && !isUUID(inv.locationId)) metadata.local_location_id = inv.locationId;
  if (inv.customerId && !isUUID(inv.customerId)) metadata.local_customer_id = inv.customerId;
  if (inv.estimateId && !isUUID(inv.estimateId)) metadata.local_estimate_id = inv.estimateId;

  return {
    id: inv.id,
    org_id: orgId,
    location_id: isUUID(inv.locationId) ? inv.locationId : null,
    invoice_number: inv.invoiceNumber,
    estimate_id: isUUID(inv.estimateId) ? inv.estimateId : null,
    estimate_number: inv.estimateNumber || null,
    status: inv.status || 'draft',
    customer_id: isUUID(inv.customerId) ? inv.customerId : null,
    customer_name: inv.customerName || null,
    customer_email: inv.customerEmail || null,
    customer_phone: inv.customerPhone || null,
    vehicle_label: inv.vehicleLabel || null,
    subtotal: inv.subtotal ?? 0,
    tax_rate: inv.taxRate ?? 0,
    tax_amount: inv.taxAmount ?? 0,
    discount: inv.discount ?? 0,
    total: inv.total ?? 0,
    amount_paid: inv.amountPaid ?? 0,
    amount_due: inv.amountDue ?? 0,
    notes: inv.notes || null,
    terms: inv.terms || 'Due on Receipt',
    created_by: inv.createdBy || null,
    issued_at: inv.issuedAt || new Date().toISOString(),
    due_at: inv.dueAt || null,
    paid_at: inv.paidAt || null,
    voided_at: inv.voidedAt || null,
    created_at: inv.createdAt || new Date().toISOString(),
    metadata,
  };
}

function invoiceToCamelCase(row, lineItems = [], payments = []) {
  return {
    id: row.id,
    locationId: row.location_id || row.metadata?.local_location_id || null,
    invoiceNumber: row.invoice_number,
    estimateId: row.estimate_id || row.metadata?.local_estimate_id || null,
    estimateNumber: row.estimate_number,
    status: row.status,
    customerId: row.customer_id || row.metadata?.local_customer_id || null,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    vehicleLabel: row.vehicle_label,
    lineItems,
    subtotal: parseFloat(row.subtotal) || 0,
    taxRate: parseFloat(row.tax_rate) || 0,
    taxAmount: parseFloat(row.tax_amount) || 0,
    discount: parseFloat(row.discount) || 0,
    total: parseFloat(row.total) || 0,
    amountPaid: parseFloat(row.amount_paid) || 0,
    amountDue: parseFloat(row.amount_due) || 0,
    payments,
    notes: row.notes,
    terms: row.terms,
    createdBy: row.created_by,
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    voidedAt: row.voided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata || {},
  };
}

// ─── Line item conversion ────────────────────────────────────────────────────

function lineItemToSnakeCase(li, invoiceId, idx) {
  return {
    id: isUUID(li.id) ? li.id : crypto.randomUUID(),
    invoice_id: invoiceId,
    description: li.description,
    qty: li.qty ?? 1,
    unit: li.unit || 'job',
    unit_price: li.unitPrice ?? 0,
    total: li.total ?? 0,
    sort_order: idx,
  };
}

function lineItemToCamelCase(row) {
  return {
    id: row.id,
    description: row.description,
    qty: parseFloat(row.qty) || 1,
    unit: row.unit,
    unitPrice: parseFloat(row.unit_price) || 0,
    total: parseFloat(row.total) || 0,
    sortOrder: row.sort_order,
  };
}

// ─── Payment conversion ─────────────────────────────────────────────────────

function paymentToSnakeCase(pay, invoiceId) {
  return {
    id: isUUID(pay.id) ? pay.id : crypto.randomUUID(),
    invoice_id: invoiceId,
    method: pay.method,
    amount: pay.amount ?? 0,
    note: pay.note || null,
    recorded_by: pay.recordedBy || null,
    recorded_at: pay.recordedAt || new Date().toISOString(),
  };
}

function paymentToCamelCase(row) {
  return {
    id: row.id,
    method: row.method,
    amount: parseFloat(row.amount) || 0,
    note: row.note,
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at,
  };
}

// ─── Patch mapping ──────────────────────────────────────────────────────────

const CAMEL_TO_SNAKE = {
  invoiceNumber: 'invoice_number',
  estimateId: 'estimate_id',
  estimateNumber: 'estimate_number',
  locationId: 'location_id',
  customerId: 'customer_id',
  customerName: 'customer_name',
  customerEmail: 'customer_email',
  customerPhone: 'customer_phone',
  vehicleLabel: 'vehicle_label',
  taxRate: 'tax_rate',
  taxAmount: 'tax_amount',
  amountPaid: 'amount_paid',
  amountDue: 'amount_due',
  createdBy: 'created_by',
  issuedAt: 'issued_at',
  dueAt: 'due_at',
  paidAt: 'paid_at',
  voidedAt: 'voided_at',
};

const FK_COLUMNS = new Set(['location_id', 'customer_id', 'estimate_id']);

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function fetchInvoices(orgId) {
  const { data: rows, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const invoiceIds = rows.map(r => r.id);

  const [liResult, payResult] = await Promise.all([
    supabase
      .from('invoice_line_items')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('invoice_payments')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('recorded_at', { ascending: true }),
  ]);

  if (liResult.error) throw liResult.error;
  if (payResult.error) throw payResult.error;

  const liByInvoice = {};
  (liResult.data || []).forEach(li => {
    if (!liByInvoice[li.invoice_id]) liByInvoice[li.invoice_id] = [];
    liByInvoice[li.invoice_id].push(lineItemToCamelCase(li));
  });

  const payByInvoice = {};
  (payResult.data || []).forEach(p => {
    if (!payByInvoice[p.invoice_id]) payByInvoice[p.invoice_id] = [];
    payByInvoice[p.invoice_id].push(paymentToCamelCase(p));
  });

  return rows.map(row =>
    invoiceToCamelCase(
      row,
      liByInvoice[row.id] || [],
      payByInvoice[row.id] || [],
    )
  );
}

export async function insertInvoice(inv, orgId) {
  const invRow = invoiceToSnakeCase(inv, orgId);
  if (!isUUID(invRow.id)) invRow.id = crypto.randomUUID();

  const { data, error } = await supabase
    .from('invoices')
    .insert(invRow)
    .select()
    .single();
  if (error) throw error;

  const invoiceId = data.id;

  let lineItems = [];
  let payments = [];

  if (inv.lineItems?.length > 0) {
    const liRows = inv.lineItems.map((li, idx) => lineItemToSnakeCase(li, invoiceId, idx));
    const { data: liData, error: liErr } = await supabase
      .from('invoice_line_items')
      .insert(liRows)
      .select();
    if (liErr) throw liErr;
    lineItems = (liData || []).map(lineItemToCamelCase);
  }

  if (inv.payments?.length > 0) {
    const payRows = inv.payments.map(p => paymentToSnakeCase(p, invoiceId));
    const { data: payData, error: payErr } = await supabase
      .from('invoice_payments')
      .insert(payRows)
      .select();
    if (payErr) throw payErr;
    payments = (payData || []).map(paymentToCamelCase);
  }

  return invoiceToCamelCase(data, lineItems, payments);
}

export async function patchInvoice(id, patch) {
  const snakePatch = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id' || k === 'orgId' || k === 'createdAt' || k === 'updatedAt'
        || k === 'lineItems' || k === 'payments' || k === 'metadata') continue;
    const snakeKey = CAMEL_TO_SNAKE[k] || k;
    if (FK_COLUMNS.has(snakeKey) && v !== null && !isUUID(v)) continue;
    snakePatch[snakeKey] = v;
  }

  if (Object.keys(snakePatch).length > 0) {
    const { error } = await supabase.from('invoices').update(snakePatch).eq('id', id);
    if (error) throw error;
  }

  if (patch.lineItems) {
    await supabase.from('invoice_line_items').delete().eq('invoice_id', id);
    if (patch.lineItems.length > 0) {
      const liRows = patch.lineItems.map((li, idx) => lineItemToSnakeCase(li, id, idx));
      const { error: liErr } = await supabase.from('invoice_line_items').insert(liRows);
      if (liErr) throw liErr;
    }
  }
}

export async function removeInvoice(id) {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

export async function insertPayment(invoiceId, payment) {
  const row = paymentToSnakeCase(payment, invoiceId);
  const { data, error } = await supabase
    .from('invoice_payments')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return paymentToCamelCase(data);
}

export async function migrateLocalInvoices(localInvoices, orgId) {
  const existing = await fetchInvoices(orgId);
  const existingNumbers = new Set(existing.map(i => i.invoiceNumber));

  const newInvoices = localInvoices.filter(i => !existingNumbers.has(i.invoiceNumber));
  if (newInvoices.length === 0) return existing;

  const results = [];
  for (const inv of newInvoices) {
    const inserted = await insertInvoice(inv, orgId);
    results.push(inserted);
  }

  return [...existing, ...results];
}
