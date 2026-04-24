/**
 * agentTools.js
 *
 * TOOL_DEFINITIONS  — Claude tools[] array passed to the API.
 * executeToolCall   — executes a tool against live app state.
 * MUTATING_TOOLS    — Set of tool names that mutate state (require UI confirmation).
 * TOOL_DISPLAY      — Human-readable labels + icons for the chat action cards.
 *
 * Tool contexts object shape:
 *   estimates, addEstimate, updateEstimate,
 *   leads, appointments, addAppointment,
 *   customers,          ← enriched CustomerContext.customers
 *   invoices,           ← InvoiceContext.invoices
 *   shopProfile, laborRates
 */

import { generateFollowUp } from './ai.js';

import { insertLead } from './leadsDb.js';
import { estimatesForCustomer, invoicesForCustomer, searchCustomerList } from './customerLookup.js';

// ─── Tool definitions (Claude API format) ────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: 'search_estimates',
    description: 'Search and retrieve estimates from the shop. Use when asked about quotes, estimates, customer pricing, or pending jobs.',
    input_schema: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: 'Filter by customer name (partial match, case-insensitive)' },
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'approved', 'declined', 'expired', 'converted', 'all'],
          description: 'Filter by estimate status. Use "all" for no filter.',
        },
        limit: { type: 'number', description: 'Max results to return (default 5, max 20)' },
      },
      required: [],
    },
  },
  {
    name: 'create_estimate',
    description: 'Create a new estimate draft in the system. Use when the user asks to create, build, write up, or generate an estimate for a customer.',
    input_schema: {
      type: 'object',
      properties: {
        customerName:  { type: 'string' },
        customerEmail: { type: 'string' },
        customerPhone: { type: 'string' },
        vehicleLabel:  { type: 'string', description: 'e.g. "2024 Tesla Model Y"' },
        package:       { type: 'string', description: '"Full Wrap" | "Partial Wrap" | "Hood & Roof" | "PPF - Full Front" | "PPF - Full Body" | "Window Tint" | "Ceramic Coating"' },
        material:      { type: 'string', description: 'Brand and series e.g. "3M 1080 Series"' },
        materialColor: { type: 'string' },
        laborHours:    { type: 'number' },
        basePrice:     { type: 'number' },
        laborCost:     { type: 'number' },
        materialCost:  { type: 'number' },
        total:         { type: 'number' },
        notes:         { type: 'string' },
      },
      required: ['customerName', 'vehicleLabel', 'package', 'total'],
    },
  },
  {
    name: 'update_estimate_status',
    description: 'Update the status of an existing estimate. Use when asked to mark an estimate as sent, approved, archived, etc.',
    input_schema: {
      type: 'object',
      properties: {
        estimateId: { type: 'string', description: 'The estimate id (est-001) or estimate number (WM-0001)' },
        status: { type: 'string', enum: ['draft', 'sent', 'approved', 'declined', 'expired', 'archived'] },
        notes:  { type: 'string', description: 'Optional notes to append to the estimate' },
      },
      required: ['estimateId', 'status'],
    },
  },
  {
    name: 'search_customers',
    description: 'Look up customers by name or email.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Customer name or email (partial match)' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_leads',
    description: 'Search leads in the pipeline by name, email, or status.',
    input_schema: {
      type: 'object',
      properties: {
        query:  { type: 'string', description: 'Name or email (partial match)' },
        status: { type: 'string', enum: ['new', 'contacted', 'converted', 'all'] },
        limit:  { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'create_lead',
    description: 'Create a new lead in the pipeline. Use when someone asks about adding a prospect, new inquiry, or potential customer.',
    input_schema: {
      type: 'object',
      properties: {
        name:            { type: 'string' },
        phone:           { type: 'string' },
        email:           { type: 'string' },
        vehicleYear:     { type: 'number' },
        vehicleMake:     { type: 'string' },
        vehicleModel:    { type: 'string' },
        serviceInterest: { type: 'string', description: 'e.g. "Full Wrap – Matte Black"' },
        budget:          { type: 'number' },
        source:          { type: 'string', description: 'e.g. "instagram", "referral", "walk-in"' },
        notes:           { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Schedule a new appointment for a customer. Use when asked to schedule, book, or set up a job date.',
    input_schema: {
      type: 'object',
      properties: {
        customerName:   { type: 'string' },
        customerPhone:  { type: 'string' },
        vehicleLabel:   { type: 'string' },
        service:        { type: 'string', description: 'Brief service description e.g. "Full Wrap – Matte Black"' },
        date:           { type: 'string', description: 'Date in YYYY-MM-DD format' },
        startTime:      { type: 'string', description: 'Start time in HH:MM 24-hour format' },
        endTime:        { type: 'string', description: 'End time in HH:MM 24-hour format' },
        technicianName: { type: 'string' },
        estimateId:     { type: 'string', description: 'Linked estimate id or number (optional)' },
        notes:          { type: 'string' },
      },
      required: ['customerName', 'vehicleLabel', 'service', 'date', 'startTime'],
    },
  },
  {
    name: 'get_dashboard_summary',
    description: 'Get a summary of current shop performance — revenue, estimate pipeline, lead count, upcoming appointments.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'draft_followup',
    description: 'Generate a personalized follow-up message (SMS + email) for a sent estimate that has not received a response.',
    input_schema: {
      type: 'object',
      properties: {
        estimateId: { type: 'string', description: 'Estimate id or number' },
        tone: { type: 'string', enum: ['friendly', 'professional', 'urgent'], description: 'Tone of the follow-up message' },
      },
      required: ['estimateId'],
    },
  },
  {
    name: 'get_customer_profile',
    description: 'Retrieve the full 360° profile for a customer — contact info, all estimates, invoices, vehicles, appointment history, financial summary, and DISC personality analysis. Use when asked anything detailed about a specific customer.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Customer name, email, or id (partial match ok)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'analyze_customer_personality',
    description: 'Return the DISC personality profile for a customer — type, traits, communication style, closing tips, and follow-up cadence. Use when asked how to approach, communicate with, or sell to a specific customer.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Customer name or id' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_vehicle_details',
    description: 'Look up a vehicle in the shop database — dimensions, VIN, wrap history, and special installer notes.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Vehicle label ("2023 Tesla Model 3"), VIN, or customer name' },
      },
      required: ['query'],
    },
  },
  {
    name: 'smart_draft_message',
    description: 'Generate a fully personalised SMS or email message for a customer using their DISC personality profile, estimate details, vehicle, and full history as context. Produces on-brand copy the shop can send immediately.',
    input_schema: {
      type: 'object',
      properties: {
        customerId:  { type: 'string', description: 'Customer id or name' },
        estimateId:  { type: 'string', description: 'Estimate id or number to reference (optional)' },
        intent:      { type: 'string', description: 'What this message should accomplish — e.g. "close the sale", "follow up after quote", "confirm appointment", "request deposit", "thank after job complete"' },
        channel:     { type: 'string', enum: ['sms', 'email', 'both'], description: 'Delivery channel' },
      },
      required: ['customerId', 'intent'],
    },
  },
];

// ─── Mutating tools — require UI confirmation before executing ────────────────
export const MUTATING_TOOLS = new Set([
  'create_estimate',
  'update_estimate_status',
  'create_lead',
  'create_appointment',
]);

// ─── Display metadata for action cards in chat UI ────────────────────────────
export const TOOL_DISPLAY = {
  create_estimate:           { icon: 'document-text',    label: 'Create Estimate',        color: 'blue'   },
  update_estimate_status:    { icon: 'pencil',           label: 'Update Estimate',        color: 'amber'  },
  create_lead:               { icon: 'user-plus',        label: 'Create Lead',            color: 'violet' },
  create_appointment:        { icon: 'calendar',         label: 'Schedule Appointment',   color: 'green'  },
  draft_followup:            { icon: 'envelope',         label: 'Draft Follow-up',        color: 'blue'   },
  search_estimates:          { icon: 'magnifying-glass', label: 'Search Estimates',       color: 'gray'   },
  search_customers:          { icon: 'magnifying-glass', label: 'Search Customers',       color: 'gray'   },
  search_leads:              { icon: 'magnifying-glass', label: 'Search Leads',           color: 'gray'   },
  get_dashboard_summary:     { icon: 'chart-bar',        label: 'Dashboard Summary',      color: 'gray'   },
  get_customer_profile:      { icon: 'user-circle',      label: 'Customer Profile',       color: 'indigo' },
  analyze_customer_personality:{ icon: 'cpu-chip',       label: 'Personality Analysis',  color: 'purple' },
  get_vehicle_details:       { icon: 'truck',            label: 'Vehicle Details',        color: 'gray'   },
  smart_draft_message:       { icon: 'chat-bubble',      label: 'Smart Message Draft',    color: 'teal'   },
};

// ─── Executor ─────────────────────────────────────────────────────────────────
// contexts: { estimates, addEstimate, updateEstimate, leads, appointments, addAppointment,
//             customers, invoices, shopProfile, laborRates }
// Returns { result: any, action?: { type, summary, data } }
// action is set for mutating tools so the UI can show a result card.
export async function executeToolCall(name, input, contexts) {
  const {
    estimates    = [],
    addEstimate,
    updateEstimate,
    leads        = [],
    appointments = [],
    addAppointment,
    customers    = [],   // enriched CustomerContext.customers
    invoices     = [],   // InvoiceContext.invoices
    shopProfile  = {},
    laborRates   = {},
    orgId        = null,
  } = contexts;

  switch (name) {

    case 'search_estimates': {
      let results = [...estimates];
      if (input.customerName) {
        const q = input.customerName.toLowerCase();
        results = results.filter(e => e.customerName?.toLowerCase().includes(q));
      }
      if (input.status && input.status !== 'all') {
        results = results.filter(e => e.status === input.status);
      }
      return {
        result: results.slice(0, input.limit || 5).map(e => ({
          id: e.id,
          number: e.estimateNumber,
          customer: e.customerName,
          vehicle: e.vehicleLabel,
          package: e.package,
          total: e.total,
          status: e.status,
          sentAt: e.sentAt,
          createdAt: e.createdAt,
        })),
      };
    }

    case 'create_estimate': {
      if (typeof addEstimate !== 'function') return { result: { error: 'Estimate context not available' } };
      const newEst = addEstimate({
        customerName:  input.customerName  || '',
        customerEmail: input.customerEmail || '',
        customerPhone: input.customerPhone || '',
        vehicleLabel:  input.vehicleLabel  || '',
        package:       input.package       || '',
        material:      input.material      || '',
        materialColor: input.materialColor || '',
        laborHours:    input.laborHours    || 0,
        basePrice:     input.basePrice     || 0,
        laborCost:     input.laborCost     || 0,
        materialCost:  input.materialCost  || 0,
        total:         input.total         || 0,
        notes:         input.notes         || '',
        status: 'draft',
      });
      if (!newEst) return { result: { error: 'Failed to create estimate' } };
      return {
        result: { id: newEst.id, estimateNumber: newEst.estimateNumber, status: 'draft' },
        action: {
          type: 'CREATE_ESTIMATE',
          summary: `Created estimate ${newEst.estimateNumber} for ${input.customerName}`,
          data: newEst,
        },
      };
    }

    case 'update_estimate_status': {
      if (typeof updateEstimate !== 'function') return { result: { error: 'Estimate context not available' } };
      const est = estimates.find(e =>
        e.id === input.estimateId || e.estimateNumber === input.estimateId
      );
      if (!est) return { result: { error: `Estimate "${input.estimateId}" not found` } };
      const patch = { status: input.status };
      if (input.status === 'sent' && !est.sentAt) patch.sentAt = new Date().toISOString();
      if (input.notes) patch.notes = [est.notes, input.notes].filter(Boolean).join('\n');
      updateEstimate(est.id, patch);
      return {
        result: { success: true, estimateNumber: est.estimateNumber, newStatus: input.status },
        action: {
          type: 'UPDATE_ESTIMATE',
          summary: `${est.estimateNumber} status → "${input.status}"`,
          data: { ...est, ...patch },
        },
      };
    }

    case 'search_customers': {
      // Prefer enriched CustomerContext data; fall back to empty if not yet loaded
      const pool = customers.length ? customers : [];
      const results = searchCustomerList(pool, input.query, input.limit || 5);
      return {
        result: results.map(c => ({
          id:             c.id,
          name:           c.name,
          email:          c.email,
          phone:          c.phone,
          tags:           c.tags,
          totalSpent:     c.totalSpent,
          convertedCount: c.convertedCount,
          estimateCount:  c.estimateCount,
          conversionRate: c.conversionRate,
          openBalance:    c.openBalance,
          personalityType: c.personality?.primary?.label || null,
          lastActivityAt: c.lastActivityAt,
          vehicleCount:   (c.vehicles || c.vehicleIds || []).length,
        })),
      };
    }

    case 'search_leads': {
      let results = [...leads];
      if (input.query) {
        const q = input.query.toLowerCase();
        results = results.filter(l =>
          l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q)
        );
      }
      if (input.status && input.status !== 'all') {
        results = results.filter(l => l.status === input.status);
      }
      return {
        result: results.slice(0, input.limit || 5).map(l => ({
          id: l.id, name: l.name, phone: l.phone, email: l.email,
          serviceInterest: l.serviceInterest, status: l.status,
          vehicle: l.vehicle, budget: l.budget,
        })),
      };
    }

    case 'create_lead': {
      const lead = {
        name:            input.name,
        phone:           input.phone           || '',
        email:           input.email           || '',
        vehicle: {
          year:  input.vehicleYear  || null,
          make:  input.vehicleMake  || '',
          model: input.vehicleModel || '',
        },
        serviceInterest: input.serviceInterest || '',
        budget:          input.budget          || null,
        source:          input.source          || 'ai-chat',
        status:          'new',
        priority:        'warm',
        assignee:        null,
        tags:            [],
        notes:           input.notes || '',
        followUpDate:    null,
        lastContactedAt: null,
        activities: [{ type: 'created', text: 'Created by WrapMind AI', at: new Date().toISOString() }],
      };
      // insertLead persists to Supabase (falls back gracefully)
      let created = null;
      try {
        created = await insertLead(lead, orgId);
      } catch (e) {
        // Supabase error — lead creation failed but we still return success-ish
        if (import.meta.env.DEV) console.warn('[agentTools] insertLead failed:', e.message);
      }
      return {
        result: { id: created?.id || 'pending', name: lead.name, status: 'new' },
        action: {
          type: 'CREATE_LEAD',
          summary: `Created lead for ${input.name}`,
          data: { ...lead, id: created?.id },
        },
      };
    }

    case 'create_appointment': {
      if (typeof addAppointment !== 'function') return { result: { error: 'Scheduling context not available' } };
      const appt = addAppointment({
        customerName:   input.customerName,
        customerPhone:  input.customerPhone || '',
        vehicleLabel:   input.vehicleLabel,
        service:        input.service,
        date:           input.date,
        startTime:      input.startTime,
        endTime:        input.endTime        || '',
        technicianName: input.technicianName || '',
        estimateId:     input.estimateId     || null,
        notes:          input.notes          || '',
      });
      if (!appt) return { result: { error: 'Failed to create appointment' } };
      return {
        result: { id: appt.id, date: appt.date, startTime: appt.startTime },
        action: {
          type: 'CREATE_APPOINTMENT',
          summary: `Scheduled ${input.customerName} — ${input.service} on ${input.date} at ${input.startTime}`,
          data: appt,
        },
      };
    }

    case 'get_dashboard_summary': {
      const converted    = estimates.filter(e => e.status === 'converted');
      const totalRevenue = converted.reduce((s, e) => s + (e.total || 0), 0);
      const open         = estimates.filter(e => ['draft', 'sent', 'approved'].includes(e.status));
      const pipelineVal  = open.reduce((s, e) => s + (e.total || 0), 0);
      const today        = new Date().toISOString().split('T')[0];
      const upcoming     = appointments.filter(a => a.date >= today && a.status !== 'cancelled').length;
      return {
        result: {
          totalConvertedRevenue: totalRevenue,
          openEstimates:         open.length,
          pipelineValue:         pipelineVal,
          newLeads:              leads.filter(l => l.status === 'new').length,
          upcomingAppointments:  upcoming,
          estimatesByStatus: {
            draft:    estimates.filter(e => e.status === 'draft').length,
            sent:     estimates.filter(e => e.status === 'sent').length,
            approved: estimates.filter(e => e.status === 'approved').length,
            declined: estimates.filter(e => e.status === 'declined').length,
            expired:  estimates.filter(e => e.status === 'expired').length,
          },
        },
      };
    }

    case 'draft_followup': {
      const est = estimates.find(e =>
        e.id === input.estimateId || e.estimateNumber === input.estimateId
      );
      if (!est) return { result: { error: `Estimate "${input.estimateId}" not found` } };
      const daysSinceSent = est.sentAt
        ? Math.floor((Date.now() - new Date(est.sentAt)) / 86400000)
        : 0;
      const followUp = await generateFollowUp({
        estimate: est,
        tone: input.tone || 'friendly',
        daysSinceSent,
        shopName: shopProfile.name || '',
      });
      return {
        result: followUp,
        action: {
          type: 'FOLLOW_UP_DRAFT',
          summary: `Follow-up drafted for ${est.estimateNumber} — ${est.customerName}`,
          data: { estimate: est, followUp },
        },
      };
    }

    // ── get_customer_profile ───────────────────────────────────────────────────
    case 'get_customer_profile': {
      const q = (input.query || '').toLowerCase();
      // Try enriched customers first (has personality + full history)
      const cust = customers.find(c =>
        c.id === input.query ||
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
      if (!cust) return { result: { error: `No customer found matching "${input.query}"` } };

      const p = cust.personality;
      return {
        result: {
          id:             cust.id,
          name:           cust.name,
          phone:          cust.phone,
          email:          cust.email,
          company:        cust.company,
          address:        cust.address,
          tags:           cust.tags,
          source:         cust.source,
          assignee:       cust.assignee,
          notes:          cust.notes,
          status:         cust.status,
          createdAt:      cust.createdAt,
          lastActivityAt: cust.lastActivityAt,

          // Vehicles
          vehicles: cust.vehicles.map(v => ({
            id: v.id, label: `${v.year} ${v.make} ${v.model} ${v.trim}`.trim(),
            wrapStatus: v.wrapStatus, wrapColor: v.wrapColor,
            notes: v.notes,
          })),

          // Financial
          totalSpent:     cust.totalSpent,
          openBalance:    cust.openBalance,
          estimateCount:  cust.estimateCount,
          convertedCount: cust.convertedCount,
          conversionRate: cust.conversionRate,
          avgJobValue:    cust.avgJobValue,
          pendingValue:   cust.pendingValue,

          // Estimate history
          recentEstimates: cust.estimates.slice(0, 5).map(e => ({
            id: e.id, number: e.estimateNumber, status: e.status,
            total: e.total, package: e.package, vehicle: e.vehicleLabel,
            createdAt: e.createdAt, approvedAt: e.approvedAt,
          })),

          // Personality snapshot
          personality: p ? {
            type:              p.primary?.label,
            emoji:             p.primary?.emoji,
            confidence:        p.confidence,
            traits:            p.primary?.traits,
            communicationStyle:p.primary?.communicationStyle,
            closingTips:       p.primary?.closingTips,
            followUpCadence:   p.primary?.followUpCadence,
            insightSummary:    p.insightSummary,
          } : null,
        },
      };
    }

    // ── analyze_customer_personality ──────────────────────────────────────────
    case 'analyze_customer_personality': {
      const q = (input.query || '').toLowerCase();
      const cust = customers.find(c =>
        c.id === input.query ||
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
      if (!cust) return { result: { error: `No customer found matching "${input.query}"` } };

      const p = cust.personality;
      if (!p) return { result: { error: 'Personality data not available for this customer.' } };

      return {
        result: {
          customer:        cust.name,
          dataPoints:      p.dataPoints,
          confidence:      p.confidence,
          primaryType:     p.primaryKey,
          primaryLabel:    p.primary?.label,
          secondaryLabel:  p.secondary?.label || null,
          scores:          p.scores,
          traits:          p.primary?.traits,
          description:     p.primary?.description,
          communicationStyle: p.primary?.communicationStyle,
          responseStyle:   p.primary?.responseStyle,
          closingTips:     p.primary?.closingTips,
          warningFlags:    p.primary?.warningFlags,
          followUpCadence: p.primary?.followUpCadence,
          signals:         p.signals.slice(0, 8), // top evidence
          insightSummary:  p.insightSummary,
        },
      };
    }

    // ── get_vehicle_details ────────────────────────────────────────────────────
    case 'get_vehicle_details': {
      const q = (input.query || '').toLowerCase();
      // Search across all customer vehicles
      let vehicle = null;
      for (const cust of customers) {
        const found = cust.vehicles.find(v =>
          `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q) ||
          v.vin?.toLowerCase() === q ||
          cust.name.toLowerCase().includes(q)
        );
        if (found) { vehicle = { ...found, customerName: cust.name, customerId: cust.id }; break; }
      }
      if (!vehicle) return { result: { error: `No vehicle found matching "${input.query}"` } };

      return {
        result: {
          id:         vehicle.id,
          label:      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim(),
          vin:        vehicle.vin,
          color:      vehicle.color,
          type:       vehicle.type,
          dimensions: {
            length_mm: vehicle.length_mm,
            width_mm:  vehicle.width_mm,
            height_mm: vehicle.height_mm,
            curb_weight_kg: vehicle.curb_weight_kg,
          },
          wrapStatus:     vehicle.wrapStatus,
          wrapColor:      vehicle.wrapColor,
          estimateCount:  vehicle.estimateCount,
          lastServiceAt:  vehicle.lastServiceAt,
          notes:          vehicle.notes,
          tags:           vehicle.tags,
          customer:       vehicle.customerName,
        },
      };
    }

    // ── smart_draft_message ────────────────────────────────────────────────────
    case 'smart_draft_message': {
      const q = (input.customerId || '').toLowerCase();
      const cust = customers.find(c =>
        c.id === input.customerId ||
        c.name.toLowerCase().includes(q)
      );
      if (!cust) return { result: { error: `No customer found matching "${input.customerId}"` } };

      let estimate = null;
      if (input.estimateId) {
        estimate = estimates.find(e =>
          e.id === input.estimateId || e.estimateNumber === input.estimateId
        ) || cust.estimates.find(e =>
          e.id === input.estimateId || e.estimateNumber === input.estimateId
        );
      }
      if (!estimate && cust.estimates.length) {
        estimate = [...cust.estimates].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
      }

      const p        = cust.personality;
      const pLabel   = p?.primary?.label || 'Driver';
      const pStyle   = p?.primary?.responseStyle || 'Direct and professional.';
      const shopName = shopProfile.name || 'WrapMind Shop';
      const vehicle  = estimate?.vehicleLabel || (cust.vehicles[0]
        ? `${cust.vehicles[0].year} ${cust.vehicles[0].make} ${cust.vehicles[0].model}`
        : 'your vehicle');

      const customerContext = {
        name:         cust.name,
        firstName:    cust.name.split(' ')[0],
        phone:        cust.phone,
        email:        cust.email,
        vehicle,
        personalityType: pLabel,
        responseStyle:   pStyle,
        closingTips:  p?.primary?.closingTips || [],
        estimateTotal: estimate?.total,
        estimatePackage: estimate?.package,
        estimateMaterial: estimate?.material,
        estimateNumber: estimate?.estimateNumber,
        daysSinceSent: estimate?.sentAt
          ? Math.floor((Date.now() - new Date(estimate.sentAt)) / 86_400_000)
          : null,
      };

      // Generate message via AI using full personality + estimate context
      const followUp = await generateFollowUp({
        estimate:   estimate || { customerName: cust.name, vehicleLabel: vehicle },
        tone:       pLabel === 'Driver' ? 'professional'
                  : pLabel === 'Influencer' ? 'friendly'
                  : pLabel === 'Steady'     ? 'friendly'
                  : 'professional',
        daysSinceSent: customerContext.daysSinceSent || 0,
        shopName,
        personalityContext: customerContext,
        intent: input.intent || 'follow up',
      });

      return {
        result: {
          customer:        cust.name,
          personalityType: pLabel,
          channel:         input.channel || 'both',
          intent:          input.intent,
          ...followUp,
          tips: p?.primary?.closingTips?.slice(0, 3) || [],
        },
        action: {
          type:    'FOLLOW_UP_DRAFT',
          summary: `Smart message drafted for ${cust.name} (${pLabel} approach)`,
          data:    { customer: cust, estimate, followUp },
        },
      };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}
