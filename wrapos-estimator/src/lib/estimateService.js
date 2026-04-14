import { supabase } from './supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s) { return typeof s === 'string' && UUID_RE.test(s); }

function toSnakeCase(est, orgId) {
  const metadata = { ...(est.metadata || {}) };
  if (est.locationId && !isUUID(est.locationId)) metadata.local_location_id = est.locationId;
  if (est.customerId && !isUUID(est.customerId)) metadata.local_customer_id = est.customerId;
  if (est.vehicleId && !isUUID(est.vehicleId)) metadata.local_vehicle_id = est.vehicleId;
  if (est.invoiceId && !isUUID(est.invoiceId)) metadata.local_invoice_id = est.invoiceId;

  return {
    id: est.id,
    org_id: orgId,
    location_id: isUUID(est.locationId) ? est.locationId : null,
    estimate_number: est.estimateNumber,
    status: est.status || 'draft',
    customer_id: isUUID(est.customerId) ? est.customerId : null,
    customer_name: est.customerName || null,
    customer_phone: est.customerPhone || null,
    customer_email: est.customerEmail || null,
    vehicle_id: isUUID(est.vehicleId) ? est.vehicleId : null,
    vehicle_label: est.vehicleLabel || null,
    vehicle_vin: est.vehicleVin || null,
    package: est.package || null,
    material: est.material || null,
    material_color: est.materialColor || null,
    labor_hours: est.laborHours ?? 0,
    base_price: est.basePrice ?? 0,
    labor_cost: est.laborCost ?? 0,
    material_cost: est.materialCost ?? 0,
    discount: est.discount ?? 0,
    total: est.total ?? 0,
    notes: est.notes || null,
    created_by: est.createdBy || null,
    assigned_to: est.assignedTo || 'Unassigned',
    sent_at: est.sentAt || null,
    expires_at: est.expiresAt || null,
    approved_at: est.approvedAt || null,
    declined_at: est.declinedAt || null,
    converted_to_invoice: est.convertedToInvoice ?? false,
    invoice_id: isUUID(est.invoiceId) ? est.invoiceId : null,
    metadata,
    created_at: est.createdAt || new Date().toISOString(),
  };
}

function toCamelCase(row) {
  return {
    id: row.id,
    locationId: row.location_id || row.metadata?.local_location_id || null,
    estimateNumber: row.estimate_number,
    status: row.status,
    customerId: row.customer_id || row.metadata?.local_customer_id || null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    vehicleId: row.vehicle_id || row.metadata?.local_vehicle_id || null,
    vehicleLabel: row.vehicle_label,
    vehicleVin: row.vehicle_vin,
    package: row.package,
    material: row.material,
    materialColor: row.material_color,
    laborHours: parseFloat(row.labor_hours) || 0,
    basePrice: parseFloat(row.base_price) || 0,
    laborCost: parseFloat(row.labor_cost) || 0,
    materialCost: parseFloat(row.material_cost) || 0,
    discount: parseFloat(row.discount) || 0,
    total: parseFloat(row.total) || 0,
    notes: row.notes,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    sentAt: row.sent_at,
    expiresAt: row.expires_at,
    approvedAt: row.approved_at,
    declinedAt: row.declined_at,
    convertedToInvoice: row.converted_to_invoice,
    invoiceId: row.invoice_id || row.metadata?.local_invoice_id || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CAMEL_TO_SNAKE = {
  estimateNumber: 'estimate_number',
  locationId: 'location_id',
  customerId: 'customer_id',
  customerName: 'customer_name',
  customerPhone: 'customer_phone',
  customerEmail: 'customer_email',
  vehicleId: 'vehicle_id',
  vehicleLabel: 'vehicle_label',
  vehicleVin: 'vehicle_vin',
  materialColor: 'material_color',
  laborHours: 'labor_hours',
  basePrice: 'base_price',
  laborCost: 'labor_cost',
  materialCost: 'material_cost',
  createdBy: 'created_by',
  assignedTo: 'assigned_to',
  sentAt: 'sent_at',
  expiresAt: 'expires_at',
  approvedAt: 'approved_at',
  declinedAt: 'declined_at',
  convertedToInvoice: 'converted_to_invoice',
  invoiceId: 'invoice_id',
};

const FK_COLUMNS = new Set(['location_id', 'customer_id', 'vehicle_id', 'invoice_id']);

export async function fetchEstimates(orgId) {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelCase);
}

export async function insertEstimate(est, orgId) {
  const row = toSnakeCase(est, orgId);
  const { data, error } = await supabase
    .from('estimates')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data);
}

export async function patchEstimate(id, patch) {
  const snakePatch = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id' || k === 'orgId' || k === 'createdAt' || k === 'updatedAt') continue;
    const snakeKey = CAMEL_TO_SNAKE[k] || k;
    if (FK_COLUMNS.has(snakeKey) && v !== null && !isUUID(v)) continue;
    snakePatch[snakeKey] = v;
  }
  if (Object.keys(snakePatch).length === 0) return;
  const { error } = await supabase.from('estimates').update(snakePatch).eq('id', id);
  if (error) throw error;
}

export async function removeEstimate(id) {
  const { error } = await supabase.from('estimates').delete().eq('id', id);
  if (error) throw error;
}

export async function migrateLocalEstimates(localEstimates, orgId) {
  const existing = await fetchEstimates(orgId);
  const existingNumbers = new Set(existing.map(e => e.estimateNumber));

  const newEstimates = localEstimates.filter(e => !existingNumbers.has(e.estimateNumber));
  if (newEstimates.length === 0) return existing;

  const rows = newEstimates.map(e => {
    const row = toSnakeCase(e, orgId);
    if (!isUUID(row.id)) row.id = crypto.randomUUID();
    return row;
  });

  const { data, error } = await supabase.from('estimates').insert(rows).select();
  if (error) throw error;
  return [...existing, ...(data || []).map(toCamelCase)];
}
