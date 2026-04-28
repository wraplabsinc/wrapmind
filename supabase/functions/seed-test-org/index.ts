// Clean rebuild: quarantine non-essential seed files, fix missing imports
//
// USAGE EXAMPLE (see README.md for full docs):
//
// 1) Deploy (after code changes):
//    supabase functions deploy seed-test-org --project-ref nbewyeoiizlsfmbqoist --no-verify-jwt
//
// 2) Execute (seed production DB):
//    curl -X POST https://nbewyeoiizlsfmbqoist.supabase.co/functions/v1/seed-test-org \
//      -H "Authorization: Bearer $(cat ~/.supabase/access-token)" \
//      -H "Content-Type: application/json" \
//      -d '{"refresh": true}'
//
// Success: { "ok": true, "orgId": "6d182e47-3faa-4a04-11ff-6c4ad7d7f9c5" }
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function genUUID(): string {
  const hex = '0123456789abcdef';
  let r = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) r += '-';
    else if (i === 14) r += '4';
    else if (i === 19) r += hex[Math.floor(Math.random() * 16)];
    else r += hex[Math.floor(Math.random() * 16)];
  }
  return r;
}

// Import only the seed modules present in ./seed/
import { SEED_LOCATIONS } from './seed/seed_locations.js';
import { SEED_TECHNICIANS } from './seed/seed_technicians.js';
import { SEED_EMPLOYEES } from './seed/seed_employees.js';
import { SEED_CUSTOMERS } from './seed/seed_customers.js';
import { SEED_VEHICLES } from './seed/seed_vehicles.js';
import { SEED_ESTIMATES } from './seed/seed_estimates.js';
import { SEED_INVOICES } from './seed/seed_invoices.js';
import { SEED_LEADS } from './seed/seed_leads.js';
import { SEED_APPOINTMENTS } from './seed/seed_appointments.js';
import { SEED_GAMIFICATION_EVENTS } from './seed/seed_gamification_events.js';
import { SEED_NOTIFICATIONS } from './seed/seed_notifications.js';

serve(async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405 });

  console.log('[seed-test-org] Invoked');
  const supabaseUrl = 'https://nbewyeoiizlsfmbqoist.supabase.co';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!key) {
    console.error('[seed-test-org] MISSING SUPABASE_SERVICE_ROLE_KEY');
    return new Response(JSON.stringify({ error: 'Missing service key' }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, key, { db: { schema: 'public' } });

  try {
    const orgName = 'WrapMind Test Shop';
    const { data: existing } = await supabase.from('organizations').select('id').eq('name', orgName);
    if (existing?.length) await supabase.from('organizations').delete().eq('id', existing[0].id);

    const orgId = genUUID();
    await supabase.from('organizations').insert({
      id: orgId, name: orgName, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });

    const locIds = {}, profIds = {}, empIds = {}, custIds = {}, vehIds = {}, estIds = {}, invIds = {};
    const adminId = genUUID(); profIds.admin = adminId;
    await supabase.from('profiles').insert({ id: adminId, user_id: adminId, org_id: orgId, email: 'admin@example.com', full_name: 'Test Admin', role: 'admin' });

    // Locations
    for (const loc of SEED_LOCATIONS) {
      const id = genUUID(); locIds[loc.id] = id;
      await supabase.from('locations').insert({
        id, org_id: orgId, name: loc.name, address: loc.address ?? null,
        city: loc.city ?? null, state: loc.state ?? null, zip: loc.zip ?? null,
        phone: loc.phone ?? null, is_active: loc.isPrimary ?? true
      });
    }

    // Employees + Profiles
    for (const emp of SEED_EMPLOYEES) {
      const empId = genUUID(); empIds[emp.id] = empId;
      const profId = genUUID(); profIds[emp.id] = profId;
        await supabase.from('profiles').insert({ id: profId, user_id: profId, org_id: orgId, email: `${emp.name.toLowerCase().replace(/\s+/g,'.')}@example.com`, full_name: emp.name, role: emp.role });
      await supabase.from('employees').insert({
        id: empId, org_id: orgId, profile_id: profId,
        name: emp.name, initials: emp.initials, role: emp.role,
        color: emp.color, is_active: emp.isActive ?? true
      });
    }

    // Customers
    for (const cust of SEED_CUSTOMERS) {
      const id = genUUID(); custIds[cust.id] = id;
            // Parse name into first_name and last_name
      const nameParts = cust.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      await supabase.from('customers').insert({
        id, org_id: orgId,
        first_name: firstName,
        last_name: lastName,
        email: cust.email ?? null,
        phone: cust.phone ?? null
      });
    }

    // Vehicles
    for (const v of SEED_VEHICLES) {
      const id = genUUID(); vehIds[v.id] = id;
        await supabase.from('vehicles').insert({
          id, org_id: orgId, customer_id: custIds[v.customerId] ?? null,
          make: v.make, model: v.model, year: v.year, trim: v.trim ?? null,
          vin: v.vin ?? null, vehicle_type: v.type ?? null, color: v.color ?? null,
          wrap_status: v.wrapStatus ?? null, wrap_color: v.wrapColor ?? null,
          notes: v.notes ?? null,
          last_service_at: v.lastServiceAt ?? null
        });
    }

    // Estimates
    for (const e of SEED_ESTIMATES) {
      const id = genUUID(); estIds[e.id] = id;
      await supabase.from('estimates').insert({
        org_id: orgId, location_id: locIds[e.locationId] ?? null,
        estimate_number: e.estimateNumber, customer_id: custIds[e.customerId] ?? null,
        vehicle_id: vehIds[e.vehicleId] ?? null, status: e.status,
        package: e.package ?? null, material: e.material ?? null,
        material_color: e.materialColor ?? null, labor_hours: e.laborHours ?? null,
        base_price: e.basePrice ?? null, labor_cost: e.laborCost ?? null,
        material_cost: e.materialCost ?? null, discount: e.discount ?? null, total: e.total,
        sent_at: e.sentAt ?? null, expires_at: e.expiresAt ?? null,
        approved_at: e.approvedAt ?? null, declined_at: e.declinedAt ?? null,
        created_by_id: empIds[e.createdBy] ?? adminId,
        assigned_to_id: empIds[e.assignedTo] ?? null,
        created_at: new Date().toISOString()
      });
    }

    // Invoices
    for (const inv of SEED_INVOICES) {
      // Skip invoices whose estimate was not seeded
      if (estIds[inv.estimateId] === undefined) {
        console.log(`Skipping invoice ${inv.invoiceId}: estimate ${inv.estimateId} not found`);
        continue;
      }
      
      const id = genUUID(); invIds[inv.id] = id;
      try {
        const { error } = await supabase.from('invoices').insert({
          org_id: orgId, location_id: locIds[inv.locationId] ?? null,
          invoice_number: inv.invoiceNumber, estimate_id: estIds[inv.estimateId] ?? null,
          customer_id: custIds[inv.customerId] ?? null, vehicle_id: vehIds[inv.vehicleId] ?? null,
          status: inv.status, line_items: inv.lineItems ?? [],
          subtotal: inv.subtotal ?? 0, tax_rate: inv.taxRate ?? null, tax_amount: inv.taxAmount ?? null,
          total: inv.total,
          amount_paid: inv.amountPaid ?? 0, amount_due: inv.amountDue ?? 0, payments: inv.payments ?? [],
          terms: inv.terms ?? null, notes: inv.notes ?? null,
          issued_at: inv.issuedAt ?? null, due_at: inv.dueAt ?? null,
          paid_at: inv.paidAt ?? null, voided_at: inv.voidedAt ?? null,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('[seed] invoice', inv.invoiceId, 'estimate', inv.estimateId, 'UUID', estIds[inv.estimateId], 'failed:', err.message);
        // Continue — don't abort entire seed for one bad invoice
      }
    }

    // Leads
    for (const lead of SEED_LEADS) {
      await supabase.from('leads').insert({
        org_id: orgId, location_id: locIds[lead.locationId] ?? null,
        customer_id: custIds[lead.customerId] ?? null,
        name: lead.name, phone: lead.phone ?? null, email: lead.email ?? null,
        source: lead.source ?? null, service_interest: lead.serviceInterest ?? null,
        budget: lead.budget ?? null, priority: lead.priority ?? null,
        status: lead.status, assignee_id: empIds[lead.assignedTo] ?? null,
        notes: lead.notes ?? null
      });
    }

    // Appointments
    for (const appt of SEED_APPOINTMENTS) {
      await supabase.from('appointments').insert({
        org_id: orgId, location_id: locIds[appt.locationId] ?? null,
        estimate_id: estIds[appt.estimateId] ?? null,
        customer_id: custIds[appt.customerId] ?? null,
        vehicle_id: vehIds[appt.vehicleId] ?? null,
        technician_id: profIds[appt.technicianId] ?? null,
        service: appt.service, date: appt.date, start_time: appt.startTime,
        end_time: appt.endTime, status: appt.status
      });
    }

    // Gamification Events
    for (const ev of SEED_GAMIFICATION_EVENTS) {
      await supabase.from('achievement_events').insert({
        org_id: orgId, employee_id: empIds[ev.employeeId] ?? null,
        achievement_id: ev.achievementId, xp: ev.xp, note: ev.note ?? null,
        awarded_by: empIds[ev.awardedBy] ?? null,
        awarded_at: ev.awardedAt ?? new Date().toISOString()
      });
    }

    // Notifications
    for (const n of SEED_NOTIFICATIONS) {
      await supabase.from('notifications').insert({
        org_id: orgId, profile_id: profIds[n.profileId] ?? null,
        type: n.type, title: n.title, body: n.body ?? null,
        link: n.link ?? null, record_id: n.recordId ?? null, read: n.read ?? false,
        created_at: n.createdAt ?? new Date().toISOString()
      });
    }

    // Link estimates → invoices
    for (const e of SEED_ESTIMATES) {
      if (e.convertedToInvoice && e.invoiceId && invIds[e.invoiceId]) {
        await supabase.from('estimates')
          .update({ converted_to_invoice_id: invIds[e.invoiceId] })
          .eq('id', estIds[e.id]);
      }
    }

    return new Response(JSON.stringify({ ok: true, message: 'Seeded', orgId }));
  } catch (e: any) {
    console.error('[seed-test-org] RUNTIME ERROR:', e);
    return new Response(JSON.stringify({ ok: false, error: e.message, stack: e.stack }), { status: 500 });
  }
});
