# PRD: Reports Module — Revenue, KPI, and Operational Dashboards

**Project:** wrapmind app  
**Status:** Draft  
**Created:** 2026-04-24  
**Related Issues:** #72 (Reports wiring), #54/#55 (PRD), #86 (GraphQL wiring)

---

## 1. Overview

The Reports module provides business intelligence dashboards for shop owners and employees to track revenue, conversion rates, employee performance, marketing ROI, and operational health. Reports are **read-only aggregated views** over the core operational data (estimates, invoices, appointments, leads, employees, marketing campaigns).

Unlike realtime operational pages, Reports prioritize **performance** (pre-aggregated data where beneficial) and **exportability** (CSV/PDF download). The module will be implemented as a dedicated Reports page with tabbed sections and KPI strips.

### Report Categories

| Report | Primary Data Source(s) | Key Metrics |
|--------|----------------------|-------------|
| **Revenue** | invoices, estimates | Total revenue, collected, outstanding, monthly trend |
| **Estimates** | estimates | Sent/approved/declined counts, conversion rate, average deal size |
| **Customers** | customers, estimates, invoices | Lifetime value, visit frequency, satisfaction trends |
| **Employees** | employees, estimates, invoices, appointments | Revenue per employee, jobs completed, average rating |
| **Marketing** | marketing_campaigns, leads, review_requests | ROI, cost per lead, campaign funnel conversion |
| **Operations** | appointments, job_bookings | Shop utilization, schedule density, average job duration |

---

## 2. Data Model & Query Strategy

### Approach: Hybrid (Direct + Aggregated)

Reports will query Supabase **directly** via the existing GraphQL API files (no new backend required). Two patterns will be used:

1. **Direct queries** — For current-period reports (last 30/90 days), fetch raw rows and aggregate client-side. Simpler, always accurate.
2. **Pre-aggregated cache** — For all-time totals (e.g., "Lifetime Revenue"), daily aggregates can be computed and cached to speed up dashboard load. TBD if needed.

**Note:** Supabase `pg_graphql` does not have built-in aggregate functions (COUNT, SUM) across collections; aggregations must be performed client-side unless a dedicated `reports_*` materialized view table is created later. Initial version uses client-side aggregation.

### Required GraphQL Queries

All queries already implemented in `app.wrapmind/src/api/*.graphql.js`:

- `estimatesCollection` → `estimates.graphql.js` (status, total, dates, customerId)
- `invoicesCollection` → `invoices.graphql.js` (status, amounts, dates)
- `appointmentsCollection` → `appointments.graphql.js` (status, technicianId, date, duration)
- `employeesCollection` → `gamification.graphql.js` (id, name, role)
- `leadsCollection` → `leads.graphql.js` (status, source, dates)
- `marketing_campaignsCollection` → `marketing.graphql.js` (stats JSON, sent_at, status)
- `review_requestsCollection` → `marketing.graphql.js` (rating, reviewed, sent_at)
- `customersCollection` → `customers.graphql.js` (id, name, createdAt)
- `locationsCollection` → `locations.graphql.js` (for location-filtered reports)

### Date Range Parameters

All report queries accept:
- `startDate` (ISO date string) — inclusive start of reporting window
- `endDate` (ISO date string) — inclusive end of reporting window
- `locationId` (UUID, optional) — filter by location (default: all)
- `orgId` (UUID, required)

---

## 3. Report Definitions

### 3.1 Revenue Report

**Tab:** Revenue  
**Time granularity:** Daily (chart), Monthly (chart), All-time (KPI strip)

**Metrics:**
- **Total Invoiced** — sum of `invoices.total` where `status IN ('issued', 'paid', 'partial')`
- **Total Collected** — sum of `invoices.amount_paid` where `status = 'paid'`
- **Outstanding A/R** — sum of `(invoices.total - invoices.amount_paid)` where `status != 'voided'`
- **Average Invoice** — avg(`invoices.total`) for paid invoices
- **Monthly Trend** — group by month, sum `invoices.total` (issued date)

**Data sources:** `invoicesCollection` (status, total, amount_paid, issued_at, paid_at, created_at)

**Filters:** Date range picker, location dropdown

---

### 3.2 Estimates Report

**Tab:** Estimates  
**Time granularity:** Weekly, Monthly

**Metrics:**
- **Total Sent** — count of estimates with `status = 'sent'` in period
- **Approved** — count of `status IN ('approved', 'converted')`
- **Declined/Expired** — count of `status IN ('declined', 'expired')`
- **Conversion Rate** — `approved / sent`
- **Average Deal Size** — avg(`estimates.total`)
- **Pipeline Value** — sum of `estimates.total` where `status IN ('draft', 'sent', 'approved')` (pending revenue)

**Data sources:** `estimatesCollection` (status, total, sent_at, created_at)

**Filters:** Date range, status, location

---

### 3.3 Customers Report

**Tab:** Customers  
**View type:** Table (top N), chart (distribution)

**Metrics:**
- **Total Active Customers** — customers with ≥1 estimate or invoice in period
- **New Customers** — customers with first estimate/invoice in period
- **Repeat Customers** — customers with ≥2 closed jobs
- **Avg Lifetime Value** — total spend per customer (invoices only)
- **Top 10 by Revenue** — ranked list
- **Customer Acquisition Source** — breakdown by leads.source or intake_leads.intake_channel

**Data sources:** `customersCollection`, `estimatesCollection`, `invoicesCollection`, `intake_leadsCollection`

**Filters:** Date range, location

---

### 3.4 Employees Report

**Tab:** Employees  
**View type:** Table (ranked), bar charts

**Metrics:**
- **Revenue per Employee** — sum of invoice totals attributed (via `invoices.created_by` or estimate assignment)
- **Jobs Completed** — count of invoices or completed appointments
- **Average Job Value** — avg invoice per employee
- **Estimate Close Rate** — approved / sent ratio per estimator
- **Schedule Utilization** — booked hours vs available hours (from appointments)

**Data sources:** `employeesCollection`, `estimatesCollection`, `invoicesCollection`, `appointmentsCollection`

**Note:** Attribution model: estimates have `created_by`, invoices have `created_by` and `assigned_to` (TBD — confirm schema). If no direct employee foreign key on invoices, estimate→invoice linkage is used.

**Filters:** Date range, employee, role

---

### 3.5 Marketing Report

**Tab:** Marketing  
**View type:** Funnel chart, table

**Metrics:**
- **Campaigns Sent** — count of `marketing_campaigns` with `status = 'sent'`
- **Open Rate** — avg of `marketing_campaigns.stats.open_rate` (JSON field)
- **Click Rate** — avg of `marketing_campaigns.stats.click_rate`
- **Lead Conversion** — leads → estimates → invoices funnel
- **Cost per Lead** — if `marketing_campaigns.stats.spend` present, compute `spend / leads_generated`
- **Review Requests** — count `review_requestsCollection`, `clicked_at`, `reviewed` conversion rate

**Data sources:** `marketing_campaignsCollection`, `review_requestsCollection`, `leadsCollection`, `estimatesCollection`

**Filters:** Campaign type, date range

---

### 3.6 Operations Report

**Tab:** Operations  
**View type:** Heatmap (schedule), metrics

**Metrics:**
- **Appointments per Day** — count, avg duration
- **Shop Utilization** — booked hours / total available bay hours
- **Technician Load** — appointments/estimated hours per technician
- **Average Job Duration** — actual vs estimated (from `job_bookings.actual_hours`)
- **On-time Rate** — appointments where `start_time` matched scheduled

**Data sources:** `appointmentsCollection`, `job_bookingsCollection`, `baysCollection` (for capacity)

**Filters:** Date range, location, technician

---

## 4. UI Layout

### Page Structure

```
/Reports
├─ KPI Strip (across all tabs)
│  └─ Date Range Selector + Location Filter
├─ Tab Navigation
│  [Revenue] [Estimates] [Customers] [Employees] [Marketing] [Operations]
└─ Tab Content
   ├─ Revenue:  Line chart (monthly), 4 KPI cards, Data table
   ├─ Estimates: Funnel chart, 4 KPI cards, Table
   ├─ Customers: Bar chart (top 10), KPI cards, Table (new/repeat)
   ├─ Employees:  Bar charts (revenue/jobs), Ranked table
   ├─ Marketing:  Funnel chart, Campaign table
   └─ Operations: Heatmap (calendar), Technician load table
```

### Components to Use/Reuse

- `StatTile` (existing) — KPI cards
- `Spinner` + `ErrorBoundary` (existing) — loading states
- `EmptyState` (existing) — no data
- Recharts or lightweight SVGGraph for charts (TBD — check existing chart library)
- `react-datepicker` or native `<input type="date">` for date range

---

## 5. Technical Implementation Plan

### Phase 1 — GraphQL Hooks (Context Layer)

Create `ReportsContext.jsx` that:
- Exposes `useReports()` hook with state: `{ revenue, estimates, customers, employees, marketing, operations, loading, error, dateRange, locationId }`
- Fetches raw data from each `USE_*` hook based on `dateRange` + `locationId`
- Performs in-memory aggregation (filter by date, group/sum/count)
- Caches aggregated results to avoid refetching on tab switch

**New file:** `app.wrapmind/src/context/ReportsContext.jsx`

**Aggregation helpers:** `app.wrapmind/src/lib/reportsAggregation.js`
- `aggregateRevenue(invoices[], dateRange) → { totalInvoiced, totalCollected, outstanding, monthlyTrend[] }`
- `aggregateEstimates(estimates[], dateRange) → { sent, approved, declined, conversionRate, avgDealSize, pipelineValue }`
- etc.

### Phase 2 — UI Components (View Layer)

**New directory:** `app.wrapmind/src/components/reports/`
- `ReportsPage.jsx` — Tab layout wrapper
- `reports/RevenueTab.jsx`
- `reports/EstimatesTab.jsx`
- `reports/CustomersTab.jsx`
- `reports/EmployeesTab.jsx`
- `reports/MarketingTab.jsx`
- `reports/OperationsTab.jsx`
- `reports/charts/` — reusable chart components if needed

### Phase 3 — Routing

Add `/reports` route to `App.jsx` → ReportsPage component

### Phase 4 — Export (Optional Extension)

Add CSV export button per tab using ` PapaParse` or native CSV generation

---

## 6. Performance & Caching Considerations

- **Client-side aggregation** of raw rows is acceptable for datasets up to ~10k records (typical shop: <1k invoices/year, <2k estimates/year, <5k appointments/year).
- **Pagination**: Initial fetch uses `first=300` (estimates/invoices) and `first=500` (appointments) to cover 1+ year of data comfortably.
- **Cache invalidation**: When an estimate/invoice/appointment mutates, Apollo cache updates automatically reflect in Reports queries on next navigation. No realtime required.
- **Future optimization**: If performance degrades, add Supabase `pg_cron` materialized view refresh for daily aggregates stored in a `report_snapshots` table.

---

## 7. Open Questions

1. **Employee attribution on revenue** — confirm whether `invoices` has a direct employee foreign key, or if attribution must be derived via estimate (`estimates.created_by` → `invoices.estimate_id`).
2. **Marketing stats schema** — confirm `marketing_campaigns.stats` JSON shape (open_rate, click_rate, spend, leads_generated keys). May need normalization.
3. **Charting library** — is there an existing chart component in the codebase, or should we use a lightweight SVG approach?
4. **Date range presets** — include "This Month", "Last 30 Days", "Quarter", "Year to Date", "Custom"?

---

## 8. Success Criteria

- [ ] All 6 report tabs render data from Supabase (no localStorage fallback needed for production)
- [ ] KPI cards show correct aggregated numbers matching direct DB queries
- [ ] Charts render without library bloat (<50KB added bundle size)
- [ ] Page loads in <1s for a shop with 2 years of data (~10k rows)
- [ ] Export to CSV works for all table views
- [ ] All filters (date range, location) function correctly

---

## 9. Out of Scope (v1)

- Realtime dashboard updates (use polling or manual refresh)
- Scheduled report emails (sendgrid/resend edge function)
- Custom report builder (drag-drop metrics)
- Advanced cohort analysis (customer retention curves)
- Multi-org consolidated views (single-org only)

---

## 10. Dependencies

- **GraphQL API files** — all collections used must be fully wired (estimates, invoices, customers, employees, appointments, leads, marketing_campaigns, review_requests, locations)
- **EstimateContext integration** — if reports pull from Apollo cache, ensure EstimateContext mutations properly update cache (already done via `cache.modify`)
- **Date handling** — use native Date + UTC normalization; no moment.js dependency

---

## 11. Milestones

| Milestone | Deliverable | Estimate |
|-----------|-------------|----------|
| M1 | ReportsContext with all aggregation functions | 4h |
| M2 | Revenue & Estimates tabs (charts + tables) | 6h |
| M3 | Customers & Employees tabs | 6h |
| M4 | Marketing & Operations tabs | 6h |
| M5 | Routing, filters, polish | 4h |
| **Total** | | **26h** |

---

## 12. Implementation Checklist

### GraphQL Wiring (already done)
- [x] `estimates.graphql.js` (#62)
- [x] `invoices.graphql.js` (#64)
- [x] `appointments.graphql.js` (#66)
- [x] `employees.graphql.js` (in `gamification.graphql.js`) (#70)
- [x] `leads.graphql.js` (#67)
- [x] `marketing.graphql.js` (#69)
- [x] `customers.graphql.js` (#58)
- [x] `locations.graphql.js` (#52)

### New Context
- [ ] `ReportsContext.jsx` — fetch all raw data via `useQuery` hooks
- [ ] `reportsAggregation.js` — pure functions for each report's calculations

### UI Components
- [ ] `ReportsPage.jsx` layout + tab system
- [ ] `RevenueTab.jsx` — KPI cards + monthly trend line chart
- [ ] `EstimatesTab.jsx` — funnel + table
- [ ] `CustomersTab.jsx` — top 10 bar + metrics
- [ ] `EmployeesTab.jsx` — ranked table + bar charts
- [ ] `MarketingTab.jsx` — funnel + campaign table
- [ ] `OperationsTab.jsx` — utilization metrics + technician load

### Wiring
- [ ] Add route `/reports` to `App.jsx`
- [ ] Add Reports to navigation menu

### Polish
- [ ] Date range picker component (presets + custom)
- [ ] Location filter dropdown
- [ ] CSV export per tab
- [ ] Loading spinners + error states
- [ ] Empty state when no data

---

**Next:** Implementation begins with `ReportsContext.jsx` and aggregation library.
