/**
 * leadsDb.js — Apollo-backed lead persistence (non-React context)
 *
 * Used by agentTools.js (AI agent) and ImportModal.jsx (Supabase connectivity test).
 * For React components, use LeadContext/useLeads() instead.
 */
import { apolloClient } from './apolloClient.js';
import { CREATE_LEAD } from '../api/leads.graphql.js';

/**
 * Insert a lead into Supabase via Apollo.
 * Returns the created lead node (or throws on network error).
 * Graceful fallback: returns null if Supabase is unreachable.
 */
export async function insertLead(lead, orgId) {
  try {
    const { data, errors } = await apolloClient.mutate({
      mutation: CREATE_LEAD,
      variables: {
        orgId,
        locationId: lead.locationId || null,
        name: lead.name,
        phone: lead.phone || null,
        email: lead.email || null,
        source: lead.source || 'ai-agent',
        serviceInterest: lead.serviceInterest || null,
        budget: lead.budget ? String(lead.budget) : null,
        priority: lead.priority || 'medium',
        status: lead.status || 'new',
        notes: lead.notes || null,
      },
    });
    if (errors?.length) {
      if (import.meta.env.DEV) console.warn('[leadsDb] Apollo errors:', errors);
      return null;
    }
    return data?.leadInsert ?? null;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[leadsDb] insertLead failed:', e.message);
    return null;
  }
}

/**
 * Test Supabase connectivity by inserting a transient test lead.
 * Returns the created lead object on success, null on failure.
 * Used by ImportModal's "Test Connection" button.
 */
export async function pushTestLead(orgId) {
  const testLead = {
    name: 'Test Lead — ' + new Date().toISOString(),
    phone: '+15550000000',
    email: 'test@wrapmind.local',
    source: 'connection-test',
    serviceInterest: 'PPF',
    budget: 1000,
    priority: 'low',
    status: 'new',
    notes: 'Auto-generated test lead from ImportModal connection test.',
    locationId: null,
  };
  return insertLead(testLead, orgId);
}
