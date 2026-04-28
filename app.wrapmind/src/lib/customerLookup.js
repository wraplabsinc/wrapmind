/**
 * customerLookup.js — shared customer/estimate/invoice lookup utilities
 *
 * Single source of truth for filtering logic used by CustomerContext,
 * agentTools, and personalityEngine. Eliminates the 3-way duplication
 * of the same (customerId || customerName) filter pattern.
 */

// ─── Status groups ─────────────────────────────────────────────────────────────

export const STATUS_GROUPS = {
  /** Estimates that are actively awaiting a decision */
  PENDING:         ['draft', 'sent'],
  /** Estimates that resulted in a job (including partially-complete) */
  CLOSED_WON:      ['approved', 'converted'],
  /** All terminal estimate states */
  TERMINAL:        ['declined', 'expired', 'archived'],
  /** Invoice states that require no further payment action */
  INVOICE_CLOSED:  ['paid', 'voided'],
};

// ─── Estimate filters ──────────────────────────────────────────────────────────

/**
 * Returns every estimate that belongs to a given customer.
 * Matches on customerId first, falls back to customerName string match.
 */
export function estimatesForCustomer(estimates, customer) {
  const id   = customer?.id;
  const name = customer?.name;
  return estimates.filter(e =>
    (id   && e.customerId   === id)   ||
    (name && e.customerName === name)
  );
}

/**
 * Returns estimates with a "won" status (approved or converted).
 * Used for conversion-rate and LTV calculations.
 */
export function wonEstimates(estimates) {
  return estimates.filter(e => STATUS_GROUPS.CLOSED_WON.includes(e.status));
}

/**
 * Returns estimates still awaiting customer response.
 */
export function pendingEstimates(estimates) {
  return estimates.filter(e => STATUS_GROUPS.PENDING.includes(e.status));
}

// ─── Invoice filters ───────────────────────────────────────────────────────────

/**
 * Returns every invoice belonging to a given customer.
 * Matches on customerId first, falls back to customerName string match.
 */
export function invoicesForCustomer(invoices, customer) {
  const id   = customer?.id;
  const name = customer?.name;
  return invoices.filter(i =>
    (id   && i.customerId   === id)   ||
    (name && i.customerName === name)
  );
}

/**
 * Sums the amountPaid across a set of invoices.
 */
export function lifetimeValue(invoices) {
  return invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
}

// ─── Customer search ───────────────────────────────────────────────────────────

/**
 * Case-insensitive search across name, email, phone, and company.
 * Returns up to `limit` matching customers.
 */
export function searchCustomerList(customers, query, limit = 10) {
  if (!query) return customers.slice(0, limit);
  const q = query.toLowerCase();
  return customers
    .filter(c =>
      c.name?.toLowerCase().includes(q)    ||
      c.email?.toLowerCase().includes(q)   ||
      c.phone?.includes(q)                 ||
      c.company?.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
