/**
 * wrapmindContext.js
 * Builds a structured JSON context string from localStorage for the AI system prompt.
 * Called synchronously at message send time — reads localStorage only.
 *
 * Expanded to include: invoice/revenue summary, customer insights,
 * supply orders, and personality distribution breakdown.
 */

function safeParseJSON(raw, fallback = null) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function buildWrapMindContext() {
  const shopProfile = safeParseJSON(localStorage.getItem('wm-shop-profile'), {});
  const laborRates  = safeParseJSON(localStorage.getItem('wm-labor-rates-v1'), {});
  const currentRole = localStorage.getItem('wm-current-role') || 'unknown';
  const units       = localStorage.getItem('wm-units') || 'imperial';
  const todayStr    = new Date().toISOString().split('T')[0];

  // ── Estimates ───────────────────────────────────────────────────────────────
  const estimates = safeParseJSON(localStorage.getItem('wm-estimates-v1'), []);
  const byStatus  = estimates.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1; return acc;
  }, {});
  const openStatuses  = ['draft', 'sent', 'approved'];
  const pipelineValue = estimates
    .filter(e => openStatuses.includes(e.status))
    .reduce((s, e) => s + (e.total || 0), 0);
  const recentSent = estimates
    .filter(e => e.status === 'sent')
    .slice(0, 5)
    .map(e => ({
      id: e.id, number: e.estimateNumber,
      customer: e.customerName, vehicle: e.vehicleLabel,
      total: e.total, sentAt: e.sentAt,
    }));
  // Overdue — sent > 14 days ago with no response
  const overdueEstimates = estimates
    .filter(e => {
      if (e.status !== 'sent' || !e.sentAt) return false;
      const days = (Date.now() - new Date(e.sentAt)) / 86_400_000;
      return days > 14;
    })
    .map(e => ({ number: e.estimateNumber, customer: e.customerName, daysSinceSent: Math.floor((Date.now() - new Date(e.sentAt)) / 86_400_000) }));

  // ── Invoices ────────────────────────────────────────────────────────────────
  const invoices = safeParseJSON(localStorage.getItem('wm-invoices-v1'), []);
  const invoiceByStatus = invoices.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1; return acc;
  }, {});
  const totalRevenue    = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.total || 0), 0);
  const outstandingBalance = invoices
    .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.amountDue || 0), 0);
  const overdueInvoices = invoices
    .filter(i => i.status === 'overdue')
    .map(i => ({ number: i.invoiceNumber, customer: i.customerName, amountDue: i.amountDue, dueAt: i.dueAt }));

  // ── Appointments ────────────────────────────────────────────────────────────
  const appointments = safeParseJSON(localStorage.getItem('wm-scheduling-v1'), []);
  const upcoming     = appointments
    .filter(a => a.date >= todayStr && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map(a => ({
      date: a.date, time: a.startTime,
      customer: a.customerName, service: a.service,
      tech: a.technicianName, status: a.status,
    }));

  const technicians     = safeParseJSON(localStorage.getItem('wm-scheduling-techs-v1'), []);
  const activeTechs     = technicians.filter(t => t.active).map(t => t.name);
  const todayAppts      = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;
  const apptEstIds      = new Set(appointments.map(a => a.estimateId).filter(Boolean));
  const unscheduledApproved = estimates.filter(e => e.status === 'approved' && !apptEstIds.has(e.id)).length;

  // ── Supply Orders ───────────────────────────────────────────────────────────
  const orders       = safeParseJSON(localStorage.getItem('wm-orders-v1'), []);
  const activeOrders = orders.filter(o => !o.archived && o.status !== 'delivered' && o.status !== 'returned');
  const inTransit    = activeOrders.filter(o => ['in_transit', 'out_for_delivery'].includes(o.status?.toLowerCase().replace(' ', '_')));
  const urgentOrders = activeOrders.filter(o => o.priority === 'Urgent');

  // ── Customer overview (aggregated from localStorage) ────────────────────────
  // Note: full enrichment happens in CustomerContext — this is a lightweight summary
  const estimatesByCustomer = estimates.reduce((acc, e) => {
    const k = e.customerName || 'Unknown';
    if (!acc[k]) acc[k] = { name: k, total: 0, count: 0 };
    acc[k].total += e.total || 0;
    acc[k].count++;
    return acc;
  }, {});
  const topCustomers = Object.values(estimatesByCustomer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => ({ name: c.name, estimateTotal: c.total, estimateCount: c.count }));

  // ── Recent activity ──────────────────────────────────────────────────────────
  const recentEstimates = [...estimates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(e => ({ number: e.estimateNumber, customer: e.customerName, status: e.status, total: e.total, createdAt: e.createdAt }));

  return JSON.stringify({
    shopProfile: {
      name:    shopProfile.name    || null,
      city:    shopProfile.city    || null,
      state:   shopProfile.state   || null,
      phone:   shopProfile.phone   || null,
      email:   shopProfile.email   || null,
      taxRate: shopProfile.taxRate ?? null,
    },
    laborRates,
    currentRole,
    units,
    today: todayStr,

    estimates: {
      total:          estimates.length,
      byStatus,
      pipelineValue,
      recentSent,
      overdueEstimates,   // sent >14 days without response
      recentActivity:     recentEstimates,
      unscheduledApproved,
    },

    revenue: {
      totalPaid:         totalRevenue,
      outstandingBalance,
      invoicesByStatus:  invoiceByStatus,
      overdueInvoices,
    },

    scheduling: {
      todayAppointments:  todayAppts,
      activeTechnicians:  activeTechs,
      upcomingCount:      upcoming.length,
      upcomingAppointments: upcoming,
    },

    supplyOrders: {
      activeCount:  activeOrders.length,
      inTransit:    inTransit.length,
      urgentCount:  urgentOrders.length,
      urgentItems:  urgentOrders.slice(0, 3).map(o => ({ supplier: o.supplier, item: o.item, status: o.status })),
    },

    customers: {
      topByEstimateValue: topCustomers,
    },

  }, null, 2);
}
