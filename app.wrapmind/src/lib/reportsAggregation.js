/**
 * Reports Aggregation Library
 * Pure functions — no React dependencies.
 *
 * All dates are ISO strings (UTC). All dateRange parameters are
 * objects with startDate and endDate as ISO date strings (inclusive).
 *
 * Data sources expect normalized camelCase shapes from GraphQL hooks.
 */

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default date range: last 90 days inclusive.
 */
export const DEFAULT_DAYS = 90;

export function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - DEFAULT_DAYS);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Check if an ISO date string (YYYY-MM-DD) falls within a date range.
 */
export function inRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  return dateStr >= startDate && dateStr <= endDate;
}

/**
 * Parse a YYYY-MM string for monthly grouping.
 */
function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Round a number to 2 decimal places.
 */
export function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════════
// REVENUE REPORT
// Data: invoices[]
// Fields: status, total, amount_paid, issued_at, paid_at, created_at (all snake_cased from DB)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {Array} invoices — normalized invoice objects
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {{
 *   totalInvoiced: number,
 *   totalCollected: number,
 *   outstanding: number,
 *   avgInvoice: number,
 *   monthlyTrend: Array<{month:string, amount:number}>
 * }}
 */
export function aggregateRevenue(invoices, dateRange) {
  const { startDate, endDate } = dateRange;

  // Filter to relevant statuses and date range
  const relevant = invoices.filter(inv => {
    const status = inv.status;
    const isActive = ['issued', 'paid', 'partial'].includes(status);
    const dateField = inv.issuedAt || inv.createdAt;
    return isActive && inRange(dateField, startDate, endDate);
  });

  const paidInvoices = relevant.filter(inv => inv.status === 'paid');

  const totalInvoiced = relevant.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCollected = relevant.reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);
  const outstanding = totalInvoiced - totalCollected;
  const avgInvoice = paidInvoices.length ? totalCollected / paidInvoices.length : 0;

  // Monthly trend (last 12 months within range)
  const monthlyMap = {};
  relevant.forEach(inv => {
    const date = inv.issuedAt || inv.createdAt;
    const mk = monthKey(date);
    if (mk) {
      monthlyMap[mk] = (monthlyMap[mk] || 0) + (Number(inv.total) || 0);
    }
  });
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: round2(amount) }));

  return {
    totalInvoiced: round2(totalInvoiced),
    totalCollected: round2(totalCollected),
    outstanding: round2(outstanding),
    avgInvoice: round2(avgInvoice),
    monthlyTrend,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATES REPORT
// Data: estimates[]
// Fields: status, total, sent_at, created_at
// ═══════════════════════════════════════════════════════════════════════════

const ESTIMATE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  APPROVED: 'approved',
  CONVERTED: 'converted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  VOID: 'voided',
};

const ESTIMATE_CLOSED_WON = [ESTIMATE_STATUS.APPROVED, ESTIMATE_STATUS.CONVERTED];
const ESTIMATE_CLOSED_LOST = [ESTIMATE_STATUS.DECLINED, ESTIMATE_STATUS.EXPIRED];
const ESTIMATE_PENDING = [ESTIMATE_STATUS.DRAFT, ESTIMATE_STATUS.SENT];

/**
 * @param {Array} estimates
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {{
 *   sent: number,
 *   approved: number,
 *   declined: number,
 *   conversionRate: number,
 *   avgDealSize: number,
 *   pipelineValue: number
 * }}
 */
export function aggregateEstimates(estimates, dateRange) {
  const { startDate, endDate } = dateRange;

  const relevant = estimates.filter(est => {
    const date = est.sentAt || est.createdAt;
    return inRange(date, startDate, endDate);
  });

  const sent = relevant.filter(e => e.status === ESTIMATE_STATUS.SENT).length;
  const approved = relevant.filter(e => ESTIMATE_CLOSED_WON.includes(e.status)).length;
  const declined = relevant.filter(e => ESTIMATE_CLOSED_LOST.includes(e.status)).length;
  const conversionRate = sent > 0 ? round2((approved / sent) * 100) : 0;

  const approvedEstimates = relevant.filter(e => ESTIMATE_CLOSED_WON.includes(e.status));
  const avgDealSize = approvedEstimates.length
    ? round2(approvedEstimates.reduce((s, e) => s + (Number(e.total) || 0), 0) / approvedEstimates.length)
    : 0;

  const pipeline = relevant.filter(e => ESTIMATE_PENDING.includes(e.status));
  const pipelineValue = pipeline.reduce((s, e) => s + (Number(e.total) || 0), 0);

  return {
    sent,
    approved,
    declined,
    conversionRate,
    avgDealSize,
    pipelineValue: round2(pipelineValue),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS REPORT
// Data: customers[], estimates[], invoices[], intakeLeads[]
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {Array} customers
 * @param {Array} estimates
 * @param {Array} invoices
 * @param {Array} intakeLeads
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {{
 *   totalActive: number,
 *   newCustomers: number,
 *   repeatCustomers: number,
 *   avgLTV: number,
 *   top10: Array<{customerId,name,totalSpent:number}>
 *   sourceBreakdown: {web:{count:number},phone:{count:number},referral:{count:number}}
 * }}
 */
export function aggregateCustomers(customers, estimates, invoices, intakeLeads, dateRange) {
  const { startDate, endDate } = dateRange;

  // Build customer spend map from invoices
  const customerSpend = {};
  invoices.forEach(inv => {
    const cid = inv.customerId;
    if (!cid) return;
    if (!inRange(inv.issuedAt || inv.createdAt, startDate, endDate)) return;
    customerSpend[cid] = (customerSpend[cid] || 0) + (Number(inv.total) || 0);
  });

  // Build customer first-seen map from estimates
  const customerFirstSeen = {};
  estimates.forEach(est => {
    const cid = est.customerId;
    if (!cid) return;
    const date = est.sentAt || est.createdAt;
    if (!inRange(date, startDate, endDate)) return;
    if (!customerFirstSeen[cid] || date < customerFirstSeen[cid]) {
      customerFirstSeen[cid] = date;
    }
  });

  // Build customer activity set
  const activeCustomers = new Set();
  [...estimates, ...invoices].forEach(r => {
    const cid = r.customerId;
    if (cid && inRange(r.sentAt || r.createdAt || r.issuedAt, startDate, endDate)) {
      activeCustomers.add(cid);
    }
  });

  const activeArray = customers.filter(c => activeCustomers.has(c.id));

  // Repeat customers — those with ≥2 invoices
  const customerInvoiceCount = {};
  invoices.forEach(inv => {
    if (inv.customerId && inRange(inv.issuedAt || inv.createdAt, startDate, endDate)) {
      customerInvoiceCount[inv.customerId] = (customerInvoiceCount[inv.customerId] || 0) + 1;
    }
  });
  const repeatCustomers = Object.values(customerInvoiceCount).filter(c => c >= 2).length;

  // New customers (first-seen date within range)
  const newCustomers = Object.values(customerFirstSeen).filter(d => inRange(d, startDate, endDate)).length;

  // LTV
  const totalSpentAll = Object.values(customerSpend).reduce((s, v) => s + v, 0);
  const avgLTV = activeArray.length ? round2(totalSpentAll / activeArray.length) : 0;

  // Top 10
  const top10 = activeArray
    .map(c => ({
      customerId: c.id,
      name: c.name,
      totalSpent: round2(customerSpend[c.id] || 0),
    }))
    .filter(item => item.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Source breakdown from intake_leads
  const sourceCounts = { web: 0, phone: 0, referral: 0 };
  intakeLeads.forEach(lead => {
    if (!inRange(lead.createdAt, startDate, endDate)) return;
    const ch = (lead.intakeChannel || '').toLowerCase();
    if (ch.includes('web') || ch.includes('form')) sourceCounts.web++;
    else if (ch.includes('phone') || ch.includes('call')) sourceCounts.phone++;
    else if (ch.includes('referral')) sourceCounts.referral++;
    else sourceCounts.web++; // default
  });

  return {
    totalActive: activeArray.length,
    newCustomers,
    repeatCustomers,
    avgLTV,
    top10,
    sourceBreakdown: sourceCounts,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEES REPORT
// Data: employees[], estimates[], invoices[], appointments[]
// Attribution via estimates.created_by or invoices.created_by
// Note: Assuming invoices.created_by exists; if not, derive from estimate→invoice
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {Array} employees
 * @param {Array} estimates
 * @param {Array} invoices
 * @param {Array} appointments
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {Array<{
 *   employeeId:string, name:string, role:string,
 *   revenue:number, jobsCompleted:number, avgJobValue:number,
 *   closeRate:number, scheduledHours:number
 * }>}
 */
export function aggregateEmployees(employees, estimates, invoices, appointments, dateRange) {
  const { startDate, endDate } = dateRange;

  // Revenue attribution map
  const revenueByEmp = {};
  invoices.forEach(inv => {
    // Prefer direct employee_id on invoice, else fallback to estimate creator
    let empId = inv.createdBy || inv.assignedTo;
    if (!empId && inv.estimateId) {
      const est = estimates.find(e => e.id === inv.estimateId);
      empId = est?.createdBy;
    }
    if (!empId || !inRange(inv.issuedAt || inv.createdAt, startDate, endDate)) return;
    revenueByEmp[empId] = (revenueByEmp[empId] || 0) + (Number(inv.total) || 0);
  });

  // Jobs completed (paid invoices)
  const jobsByEmp = {};
  invoices.forEach(inv => {
    let empId = inv.createdBy || inv.assignedTo;
    if (!empId && inv.estimateId) {
      const est = estimates.find(e => e.id === inv.estimateId);
      empId = est?.createdBy;
    }
    if (!empId || inv.status !== 'paid') return;
    if (!inRange(inv.paidAt || inv.issuedAt || inv.createdAt, startDate, endDate)) return;
    jobsByEmp[empId] = (jobsByEmp[empId] || 0) + 1;
  });

  // Estimates sent by employee (close rate)
  const estimatesByEmp = {};
  estimates.forEach(est => {
    const empId = est.createdBy;
    if (!empId || !inRange(est.sentAt || est.createdAt, startDate, endDate)) return;
    estimatesByEmp[empId] = (estimatesByEmp[empId] || 0) + 1;
  });

  const approvedEstimatesByEmp = {};
  estimates.forEach(est => {
    const empId = est.createdBy;
    if (!empId) return;
    const closedWon = ['approved', 'converted'].includes(est.status);
    if (closedWon && inRange(est.approvedAt || est.createdAt, startDate, endDate)) {
      approvedEstimatesByEmp[empId] = (approvedEstimatesByEmp[empId] || 0) + 1;
    }
  });

  // Scheduled hours from appointments (duration from estimate or service duration)
  const hoursByEmp = {};
  appointments.forEach(appt => {
    const empId = appt.technicianId;
    if (!empId || !inRange(appt.date, startDate, endDate)) return;
    // Estimate duration: 480 / 60 = 8h default; derive from estimate if available
    let durationH = 8; // fallback
    if (appt.estimateId) {
      const est = estimates.find(e => e.id === appt.estimateId);
      if (est?.laborHours) {
        durationH = Number(est.laborHours) / 60;
      }
    }
    hoursByEmp[empId] = (hoursByEmp[empId] || 0) + durationH;
  });

  // Build result
  const result = employees.map(emp => {
    const empId = emp.id;
    const revenue = round2(revenueByEmp[empId] || 0);
    const jobs = jobsByEmp[empId] || 0;
    const avgJob = jobs > 0 ? round2(revenue / jobs) : 0;
    const sent = estimatesByEmp[empId] || 0;
    const approved = approvedEstimatesByEmp[empId] || 0;
    const closeRate = sent > 0 ? round2((approved / sent) * 100) : 0;
    const scheduledHrs = round2(hoursByEmp[empId] || 0);

    return {
      employeeId: empId,
      name: emp.name,
      role: emp.role,
      revenue,
      jobsCompleted: jobs,
      avgJobValue: avgJob,
      closeRate,
      scheduledHours: scheduledHrs,
    };
  });

  // Sort by revenue descending
  return result.sort((a, b) => b.revenue - a.revenue);
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING REPORT
// Data: marketingCampaigns[], reviewRequests[], leads[], estimates[]
// Note: marketing_campaigns.stats is JSON; parse defensively
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {Array} marketingCampaigns
 * @param {Array} reviewRequests
 * @param {Array} leads
 * @param {Array} estimates
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {{
 *   campaignsSent: number,
 *   avgOpenRate: number,
 *   avgClickRate: number,
 *   leadConvFunnel: Array<{stage:string,count:number}>,
 *   costPerLead: number,
 *   reviewConversion: number
 * }}
 */
export function aggregateMarketing(marketingCampaigns, reviewRequests, leads, estimates, dateRange) {
  const { startDate, endDate } = dateRange;

  const campaigns = marketingCampaigns.filter(c => {
    return c.status === 'sent' && inRange(c.sentAt || c.createdAt, startDate, endDate);
  });
  const campaignsSent = campaigns.length;

  let totalOpenRate = 0, totalClickRate = 0, campaignsWithStats = 0;
  campaigns.forEach(c => {
    try {
      const stats = typeof c.stats === 'string' ? JSON.parse(c.stats) : c.stats || {};
      if (stats.open_rate != null) { totalOpenRate += Number(stats.open_rate); campaignsWithStats++; }
      if (stats.click_rate != null) { totalClickRate += Number(stats.click_rate); campaignsWithStats++; }
    } catch { /* ignore */ }
  });
  const avgOpenRate = campaignsWithStats ? round2(totalOpenRate / campaignsWithStats) : 0;
  const avgClickRate = campaignsWithStats ? round2(totalClickRate / campaignsWithStats) : 0;

  // Funnel: Web leads → estimates → invoices (using date range)
  const periodLeads = leads.filter(l => inRange(l.createdAt, startDate, endDate)).length;

  const periodEstimates = estimates.filter(e =>
    inRange(e.sentAt || e.createdAt, startDate, endDate) &&
    e.leadId // estimates with a lead source
  ).length;

  // Attribution: if leadId present, count as converted
  const convertedLeads = estimates.filter(e =>
    inRange(e.approvedAt || e.createdAt, startDate, endDate) &&
    e.leadId &&
    ['approved', 'converted'].includes(e.status)
  ).length;

  const leadConvFunnel = [
    { stage: 'Leads Captured', count: periodLeads },
    { stage: 'Estimates Written', count: periodEstimates },
    { stage: 'Deals Closed', count: convertedLeads },
  ];

  // Cost per lead
  const totalSpend = campaigns.reduce((s, c) => {
    try {
      const stats = typeof c.stats === 'string' ? JSON.parse(c.stats) : c.stats || {};
      return s + (Number(stats.spend) || 0);
    } catch { return s; }
  }, 0);
  const costPerLead = periodLeads > 0 ? round2(totalSpend / periodLeads) : 0;

  // Review request conversion
  const rrSent = reviewRequests.filter(r => inRange(r.sentAt || r.createdAt, startDate, endDate)).length;
  const rrClicked = reviewRequests.filter(r => r.clickedAt && inRange(r.clickedAt, startDate, endDate)).length;
  const rrConverted = reviewRequests.filter(r => r.reviewed && inRange(r.reviewed, startDate, endDate)).length;
  const reviewConversion = rrClicked > 0 ? round2((rrConverted / rrClicked) * 100) : 0;

  return {
    campaignsSent,
    avgOpenRate,
    avgClickRate,
    leadConvFunnel,
    costPerLead,
    reviewConversion,
    reviewRequestsSent: rrSent,
    reviewRequestsClicked: rrClicked,
    reviewRequestsConverted: rrConverted,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OPERATIONS REPORT
// Data: appointments[], jobBookings[], bays[] (if present)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {Array} appointments
 * @param {Array} jobBookings
 * @param {Array} bays — optional bay capacity data
 * @param {{startDate:string,endDate:string}} dateRange
 * @returns {{
 *   appointmentsPerDay: number,
 *   avgDuration: number,  // minutes
 *   shopUtilization: number,  // percentage of bay hours booked
 *   technicianLoad: Array<{technicianId,name,totalJobs:number,totalHours:number}>
 * }}
 */
export function aggregateOperations(appointments, jobBookings, bays, dateRange) {
  const { startDate, endDate } = dateRange;

  const periodAppointments = appointments.filter(a => inRange(a.date, startDate, endDate));

  const appointmentsPerDay = periodAppointments.length;
  // Estimate avg duration: parse start/end times → minutes
  const durations = periodAppointments.map(a => {
    if (!a.startTime || !a.endTime) return null;
    const [sh, sm] = a.startTime.split(':').map(Number);
    const [eh, em] = a.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    return diff > 0 ? diff : 0;
  }).filter(d => d !== null);

  const avgDuration = durations.length ? round2(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;

  // Technician load
  const techHours = {};
  const techJobs = {};
  periodAppointments.forEach(a => {
    if (!a.technicianId) return;
    techJobs[a.technicianId] = (techJobs[a.technicianId] || 0) + 1;
    techHours[a.technicianId] = (techHours[a.technicianId] || 0) + ((durations[durations.length - 1]) || avgDuration / 60);
    // Note: using avg duration as proxy; actual duration should come from jobBookings if available
  });

  // Shop utilization: booked bays / total bay hours in range
  // Assuming bays array exists with id for each bay; 8-hour workday default
  const totalBayCount = bays?.length || 4; // default 4 bays if unknown
  const workdays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7 * 5))); // rough business weeks * 5
  const totalAvailableHours = totalBayCount * 8 * workdays; // 8h/day per bay
  const bookedHours = Object.values(techHours).reduce((s, h) => s + h, 0);
  const shopUtilization = totalAvailableHours > 0 ? round2((bookedHours / totalAvailableHours) * 100) : 0;

  const technicianLoad = Object.entries(techJobs).map(([empId, jobs]) => ({
    technicianId: empId,
    totalJobs: jobs,
    totalHours: round2(techHours[empId] || 0),
  }));

  return {
    appointmentsPerDay,
    avgDuration,
    shopUtilization,
    technicianLoad,
  };
}
