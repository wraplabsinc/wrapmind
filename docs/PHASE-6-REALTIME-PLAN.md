# Phase 6: Supabase Realtime — Implementation Plan

**Issue:** #53 — Supabase Realtime: Enable realtime subscriptions for Lead Hub and live views  
**Status:** Not Started  
**Database:** All tables already in `supabase_realtime` publication ✓

---

## Tables Confirmed in Realtime Publication

| Table | Realtime Enabled | In Publication |
|-------|-----------------|----------------|
| leads | ✅ | ✅ |
| notifications | ✅ | ✅ |
| appointments | ✅ | ✅ |
| customers | ✅ | ✅ |
| shop_kpi_snapshots | ✅ | ✅ |

Verified via Management API query (April 2026).

---

## Implementation Tasks

### 1. SchedulingContext — Add Realtime for Appointments
**File:** `app.wrapmind/src/context/SchedulingContext.jsx`  
**Pattern:** Follow LeadContext/NotificationsContext

Add `useEffect` that:
- Creates channel: `supabase.channel('appointments-realtime')`
- Subscribes to INSERT/UPDATE/DELETE on `appointments` table
- Filter: `org_id=eq.${orgId}` (use orgId from auth)
- Merge into local `appointments` state (dedupe by id)
- Cleanup on unmute

**Dependencies:** Already using Apollo for primary source — realtime acts as patch layer (same as LeadContext).

---

### 2. Dashboard KPI Strip — Live Refresh
**Current state:** KpiStrip (`components/dashboard/KpiStrip.jsx`) derives KPIs from `useEstimates()` and `useInvoices()`.

**Option A (current path):** Add realtime to EstimateContext and InvoiceContext — then KPI strip auto-updates.

**Option B (PRD-aligned):** Create/use `shop_kpi_snapshots` table subscription and recompute KPIs from live snapshot.

**Recommendation:** Option A is smaller — EstimateContext & InvoiceContext get realtime subscriptions mirroring LeadContext pattern. KPIs recompute reactively from `estimates[]` and `invoices[]` arrays.

---

### 3. Presence Tracking for Lead Hub
**Feature:** Show which users are online, viewing same leads/kanban board.

**Implementation:**
- Use Supabase Presence: `supabase.channel('presence-leadhub').track({ user_id, name, online_at })`
- Track presence per-org or per-lead
- Display presence badge on Lead cards / kanban column headers
- Handle `presence` events (join/leave/update)

**Reference:** Supabase Presence docs: `supabase.channel().track()` + `on('presence', ...)`

---

## UI Updates

### LeadHubPage.jsx (LeadHubPage)
- Change "Offline" badge → "Live" indicator when realtime channel connected
- Color: green badge with green dot

### ImportModal.jsx (ImportModal)
- Change "Disconnected" status → "Connected" when appointments realtime active
- Green badge + "Live Push Active"

---

## Testing Checklist

- [ ] New appointment appears in Scheduling without refresh
- [ ] Appointment updates reflect in realtime
- [ ] Appointment deletions propagate
- [ ] Lead edits (already done) propagate — verify no regression
- [ ] Notification badge count updates live
- [ ] KPI strip values update when estimates/invoices change (if Option A chosen)
- [ ] Presence shows online users in Lead Hub
- [ ] Reconnect logic works after network interruption

---

## Open Questions

1. **KPI Strip approach:** Real-time via estimates/invoices (A) or shop_kpi_snapshots (B)?
2. **Presence granularity:** Per-org (all org members) or per-lead (who's viewing same lead)?
3. **Should customers table realtime be used?** Currently not referenced in frontend — where would live customer updates be needed?

---

**Next:** Implement SchedulingContext realtime + UI indicators (can do incrementally).
