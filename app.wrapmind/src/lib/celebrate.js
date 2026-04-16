/**
 * celebrate(type, detail) — fire a one-time celebration animation.
 *
 * type: 'estimate_approved' | 'invoice_paid' | 'payment_received'
 *       | 'deal_won' | 'portal_approved'
 * detail: { customer?, amount?, label? }
 */
export function celebrate(type, detail = {}) {
  window.dispatchEvent(new CustomEvent('wm-celebrate', { detail: { type, ...detail } }));
}
