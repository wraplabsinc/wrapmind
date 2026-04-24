import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useLocations } from './LocationContext';
import {
  USE_ESTIMATES,
  USE_INVOICES,
  USE_CUSTOMERS,
  USE_EMPLOYEES,
  USE_APPOINTMENTS,
  USE_LEADS,
  USE_INTAKE_LEADS,
  USE_CAMPAIGNS,
  USE_REVIEW_REQUESTS,
  USE_EMPLOYEES as USE_GAMIFICATION_EMPLOYEES,
} from '../api';
import { USE_EMPLOYEES as USE_EMP_FROM_GAMIFICATION } from '../api/gamification.graphql.js';
import { aggregateRevenue, aggregateEstimates, aggregateCustomers, aggregateEmployees, aggregateMarketing, aggregateOperations, DEFAULT_DAYS } from '../lib/reportsAggregation';

const ReportsContext = createContext(null);

/**
 * Default date range: last 90 days.
 */
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - DEFAULT_DAYS);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Reports Provider — fetches raw data from GraphQL, runs in-memory aggregations.
 */
export function ReportsProvider({ children }) {
  const { orgId } = useAuth();
  const { activeLocationId } = useLocations();

  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';

  // Date range filter state
  const [dateRange, setDateRange] = useState(defaultRange);
  const [locationId, setLocationId] = useState(activeLocationId === 'all' ? null : activeLocationId);

  // Apollo data
  const { estimates: apolloEstimates, loading: estLoading, error: estError } = USE_ESTIMATES({ orgId, first: 500 });
  const { invoices: apolloInvoices, loading: invLoading, error: invError } = USE_INVOICES({ orgId, first: 500 });
  const { customers: apolloCustomers, loading: custLoading, error: custError } = USE_CUSTOMERS({ orgId, first: 200 });
  const { employees: apolloEmployees, loading: empLoading, error: empError } = USE_EMPLOYEES({ orgId, first: 200 });
  const { appointments: apolloAppointments, loading: apptLoading, error: apptError } = USE_APPOINTMENTS({ orgId, first: 1000 });
  const { leads: apolloLeads, loading: leadsLoading, error: leadsError } = USE_LEADS({ orgId, first: 500 });
  const { intakeLeads: apolloIntakeLeads, loading: intakeLoading, error: intakeError } = USE_INTAKE_LEADS({ orgId, first: 300 });
  const { campaigns: apolloCampaigns, loading: campLoading, error: campError } = USE_CAMPAIGNS({ shopId: orgId, first: 200 });
  const { reviewRequests: apolloReviewRequests, loading: rrLoading, error: rrError } = USE_REVIEW_REQUESTS({ orgId, first: 300 });

  // Bays (for utilization) — short fetch
  const { bays: apolloBays } = USE_BAYS ? USE_BAYS({ orgId, first: 50 }) : { bays: [], loading: false, error: null };

  // Derived data: apply location filter (locationId === null means all)
  const estimates = useMemo(() => {
    if (!locationId) return apolloEstimates;
    return apolloEstimates.filter(e => e.locationId === locationId);
  }, [apolloEstimates, locationId]);

  const invoices = useMemo(() => {
    if (!locationId) return apolloInvoices;
    return apolloInvoices.filter(inv => inv.locationId === locationId);
  }, [apolloInvoices, locationId]);

  const customers = useMemo(() => {
    if (!locationId) return apolloCustomers;
    // Customers don't have locationId; derive from their estimates/invoices
    const idsWithLoc = new Set();
    apolloEstimates.forEach(e => {
      if (e.locationId === locationId && e.customerId) idsWithLoc.add(e.customerId);
    });
    apolloInvoices.forEach(inv => {
      if (inv.locationId === locationId && inv.customerId) idsWithLoc.add(inv.customerId);
    });
    return apolloCustomers.filter(c => idsWithLoc.has(c.id));
  }, [apolloCustomers, apolloEstimates, apolloInvoices, locationId]);

  const employees = apolloEmployees; // employees global (not location-scoped)

  const appointments = useMemo(() => {
    if (!locationId) return apolloAppointments;
    return apolloAppointments.filter(a => a.locationId === locationId);
  }, [apolloAppointments, locationId]);

  const leads = useMemo(() => {
    if (!locationId) return apolloLeads;
    return apolloLeads.filter(l => l.locationId === locationId);
  }, [apolloLeads, locationId]);

  const intakeLeads = useMemo(() => {
    if (!locationId) return apolloIntakeLeads;
    // intake_leads have location? Check schema — if no location field, treat as org-wide
    return apolloIntakeLeads;
  }, [apolloIntakeLeads, locationId]);

  const campaigns = useMemo(() => {
    if (!locationId) return apolloCampaigns;
    // marketing_campaigns has shop_id (org level); cross-shop not scoped
    return apolloCampaigns;
  }, [apolloCampaigns, locationId]);

  const reviewRequests = useMemo(() => {
    if (!locationId) return apolloReviewRequests;
    return apolloReviewRequests.filter(r => r.locationId === locationId);
  }, [apolloReviewRequests, locationId]);

  const bays = apolloBays || [];

  // Aggregations
  const revenue = useMemo(() => aggregateRevenue(invoices, dateRange), [invoices, dateRange]);
  const estimatesAgg = useMemo(() => aggregateEstimates(estimates, dateRange), [estimates, dateRange]);
  const customersAgg = useMemo(() => aggregateCustomers(customers, estimates, invoices, intakeLeads, dateRange), [customers, estimates, invoices, intakeLeads, dateRange]);
  const employeesAgg = useMemo(() => aggregateEmployees(employees, estimates, invoices, appointments, dateRange), [employees, estimates, invoices, appointments, dateRange]);
  const marketingAgg = useMemo(() => aggregateMarketing(campaigns, reviewRequests, leads, estimates, dateRange), [campaigns, reviewRequests, leads, estimates, dateRange]);
  const operationsAgg = useMemo(() => aggregateOperations(appointments, [], bays, dateRange), [appointments, bays, dateRange]);

  const loading = estLoading || invLoading || custLoading || empLoading || apptLoading || leadsLoading || intakeLoading || campLoading || rrLoading;
  const error = estError || invError || custError || empError || apptError || leadsError || intakeError || campError || rrError;

  const value = {
    // Filters
    dateRange,
    setDateRange,
    locationId,
    setLocationId,

    // Raw data (for drill-down tables)
    estimates,
    invoices,
    customers,
    employees,
    appointments,
    leads,
    intakeLeads,
    campaigns,
    reviewRequests,

    // Aggregated reports (KPI + chart data)
    revenue,
    estimates: estimatesAgg,
    customers: customersAgg,
    employees: employeesAgg,
    marketing: marketingAgg,
    operations: operationsAgg,

    // Loading
    loading,
    error,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

/**
 * Hook — returns all 6 report datasets + raw arrays + filters.
 */
export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
