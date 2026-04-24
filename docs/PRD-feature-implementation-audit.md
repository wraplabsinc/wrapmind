# WrapMind Feature Implementation & Data Source Audit

> **PRD:** Feature Implementation & Data Source Audit  
> **Issue:** [#49](https://github.com/wraplabsinc/wrapmind/issues/49)  
> **Generated:** April 23, 2026  
> **Source:** `docs/FEATURE-INVENTORY.md` (April 16, 2026)  
> **Status:** Draft / In Progress

---

## Overview

This PRD systematically audits every feature in the WrapMind UI against three states:

| State | Meaning |
|-------|---------|
| **✅ Implemented** | UI is wired to localStorage / in-memory context (prototype mode — no backend required) |
| **🔗 Needs Supabase** | UI exists but data is not yet connected to Supabase GraphQL / RLS |
| **🔌 Needs External Source** | Feature depends on a third-party API (ShopMonkey, Stripe, AI, etc.) that is not yet integrated |

---

## Legend

- `🔗` — Needs Supabase connection (GraphQL / RLS queries)
- `🔌` — Needs external API / integration
- `✅` — Fully implemented in prototype (localStorage / context)

---

## 1. Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| Login Form | ✅ Implemented | localStorage / AuthContext; Supabase auth endpoint ready |
| Signup / Invite Flow | ✅ Implemented | localStorage prototype; Supabase invite flow ready |
| Auth Page | ✅ Implemented | Dark mode support |
| Role-Based Access | ✅ Implemented | RolesContext, feature-gated |
| Dev Mode Badge | ✅ Implemented | VITE_DEV_AUTH check |
| Session Persistence | ✅ Implemented | Supabase token refresh |
| Logout | ✅ Implemented | AuthContext clear |

**Summary:** Auth is fully wired to Supabase Auth.

---

## 2. Navigation

| Feature | Status | Notes |
|---------|--------|-------|
| SideNav | ✅ Implemented | FeatureFlagsContext gated |
| HamburgerMenu | ✅ Implemented | Mobile drawer |
| TopBar | ✅ Implemented | All components present |
| Location Switcher | ✅ Implemented | multiLocationEnabled flag |
| Breadcrumb | ✅ Implemented | currentView state |
| Notification Bell | ✅ Implemented | NotificationsContext |
| Feature-Gated Nav Items | ✅ Implemented | Feature flags |

**Summary:** Navigation fully implemented.

---

## 3. Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| KPI Strip | 🔗 Needs Supabase | Data from localStorage KPI thresholds; needs revenue/approval metrics from DB |
| Revenue Chart | 🔗 Needs Supabase | revenueData[] hardcoded; needs time-series queries |
| XP Leaderboard | 🔗 Needs Supabase | GamificationContext; needs employee XP from DB |
| Calendar Widget | 🔗 Needs Supabase | SchedulingContext; needs appointments from DB |
| Team Activity Widget | 🔗 Needs Supabase | AuditLogContext; needs events from DB |
| Writer Leaderboard | 🔗 Needs Supabase | GamificationContext |
| Shop Streak Widget | 🔗 Needs Supabase | GamificationContext |
| Monthly MVP Badge | 🔗 Needs Supabase | GamificationContext |
| Sortable Widget Grid | ✅ Implemented | @dnd-kit, localStorage persistence |
| Widget Visibility Toggle | ✅ Implemented | localStorage |
| Add/Remove Widgets | ✅ Implemented | Modal with available widgets |

**Summary:** Dashboard UI is complete; all data widgets need Supabase queries.

---

## 4. Customers

| Feature | Status | Notes |
|---------|--------|-------|
| Customer List | 🔗 Needs Supabase | customers[] from CustomerContext; needs GraphQL |
| Search Input | ✅ Implemented | Fuzzy match on combined string |
| Sortable Columns | ✅ Implemented | Client-side sort |
| Pagination | ✅ Implemented | 20 per page |
| Customer Detail Panel | 🔗 Needs Supabase | Tabs: Overview, Vehicles, History — all need DB |
| Customer Form | 🔗 Needs Supabase | Create/update — needs DB insert |
| Tag System | ✅ Implemented | Static from listsData.js |
| DISC Personality Card | 🔌 Needs External | personalityEngine.js — needs AI/personality analysis service |
| Vehicle Assignment | 🔗 Needs Supabase | Links vehicles to customer |
| Activity Timeline | 🔗 Needs Supabase | activities[] from DB |
| Duplicate Detection | 🔗 Needs Supabase | Email/phone check against DB |
| Audit Logging | 🔗 Needs Supabase | AuditLogContext → DB |

**Summary:** Core UI done; CRUD and queries need Supabase. Personality AI is an external dependency.

---

## 5. Vehicles

| Feature | Status | Notes |
|---------|--------|-------|
| Vehicle List | 🔗 Needs Supabase | vehicles[] from context |
| Search Input | ✅ Implemented | Combined string match |
| VIN Decoder | 🔌 Needs External | Logic present; needs VIN API (NHTSA or similar) |
| Year/Make/Model Picker | ✅ Implemented | Static data |
| Vehicle by Image | 🔌 Needs External | analyzeVehicleImage() in lib/ai.js — needs AI vision |
| Vehicle Detail Panel | 🔗 Needs Supabase | DB data |
| Brand Logo Fetching | ✅ Implemented | Google favicon API |
| Add/Edit Vehicle Form | 🔗 Needs Supabase | DB insert/update |
| Vehicle Assignment | 🔗 Needs Supabase | FK to customer |
| Audit Logging | 🔗 Needs Supabase | DB |

**Summary:** Core vehicle CRUD needs Supabase. VIN decode and AI image analysis need external services.

---

## 6. Estimates

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-Step Wizard | ✅ Implemented | EstimateContext state |
| Package Cards | ✅ Implemented | Static package data |
| Modifiers Step | ✅ Implemented | Static modifiers |
| AI Estimate Generator | 🔌 Needs External | lib/ai.js — needs AI API (OpenAI/Anthropic) |
| Review Step | ✅ Implemented | Price breakdown UI |
| Right Panel Summary | ✅ Implemented | Persistent sidebar |
| Estimate Templates | ✅ Implemented | localStorage |
| Status Workflow | 🔗 Needs Supabase | Status transitions need DB |
| Send Estimate | 🔗 Needs Supabase | sentAt timestamp → DB |
| Mark Approved/Declined | 🔗 Needs Supabase | approvedAt/declinedAt → DB |
| Convert to Invoice | 🔗 Needs Supabase | InvoiceContext + DB |
| Duplicate Estimate | 🔗 Needs Supabase | Copy logic → DB |
| Archive Estimate | 🔗 Needs Supabase | Soft delete → DB |
| Delete Estimate | 🔗 Needs Supabase | Hard delete → DB |
| AI Follow-up Writer | 🔌 Needs External | generateFollowUp() in lib/ai.js |
| Schedule Job from Estimate | 🔗 Needs Supabase | QuickScheduleModal → SchedulingContext |
| Expiry Tracking | 🔗 Needs Supabase | expiresAt → DB update |

**Summary:** Wizard UI is complete. AI features need external API. All status/state changes need Supabase.

---

## 7. Invoices

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice List | 🔗 Needs Supabase | invoices[] from InvoiceContext |
| Status Badges | ✅ Implemented | Static badge UI |
| Filter Tabs | ✅ Implemented | Client-side filter |
| Search | ✅ Implemented | Combined string match |
| Invoice Detail Panel | 🔗 Needs Supabase | Line items, payments, activity from DB |
| Line Item Table | 🔗 Needs Supabase | Editable rows → DB |
| Tax Calculation | ✅ Implemented | 8.75% constant |
| Discount Support | ✅ Implemented | UI present |
| Payment Recording | 🔗 Needs Supabase | payments[] → DB |
| Balance Due Display | ✅ Implemented | Computed |
| Payment Terms | ✅ Implemented | Dropdown UI |
| Mark as Sent | 🔗 Needs Supabase | sentAt → DB |
| Mark Void | 🔗 Needs Supabase | Status → DB |
| Duplicate Invoice | 🔗 Needs Supabase | Copy → DB |
| Delete Invoice | 🔗 Needs Supabase | Remove from DB |
| Print / Export PDF | 🔌 Needs External | window.print() — PDF generation not implemented |
| Convert from Estimate | 🔗 Needs Supabase | Estimate → Invoice mapping |
| Overdue Detection | 🔗 Needs Supabase | dueAt vs now → DB query |

**Summary:** Invoice UI complete. All CRUD and status changes need Supabase. PDF export needs external library.

---

## 8. Scheduling

| Feature | Status | Notes |
|---------|--------|-------|
| Calendar Page | 🔗 Needs Supabase | SchedulingContext; appointments from DB |
| Day View | 🔗 Needs Supabase | Time-series data from DB |
| Week View | 🔗 Needs Supabase | DB queries |
| Month View | 🔗 Needs Supabase | DB queries |
| Current Time Indicator | ✅ Implemented | setInterval + Date.now() |
| Appointment Modal | 🔗 Needs Supabase | Create/edit → DB |
| Service Duration | ✅ Implemented | SERVICE_DURATIONS map |
| Quick Schedule Modal | 🔗 Needs Supabase | Prefill → DB insert |
| Appointment Types | 🔗 Needs Supabase | Type enum → DB |
| Technician Management | 🔗 Needs Supabase | technicians[] from DB |
| Technician Color Coding | ✅ Implemented | Static TECH_COLORS |
| Appointment Status | 🔗 Needs Supabase | DB status field |
| Block Time | 🔗 Needs Supabase | blockedTimes[] → DB |
| Reminder Status | 🔗 Needs Supabase | reminder fields → DB |
| Delete Appointment | 🔗 Needs Supabase | DB delete |
| Edit Appointment | 🔗 Needs Supabase | DB update |
| Time Slot Click | ✅ Implemented | UI interaction only |

**Summary:** Calendar UI complete. All data needs Supabase.

---

## 9. Lead Hub

| Feature | Status | Notes |
|---------|--------|-------|
| Kanban Board | 🔗 Needs Supabase | DndContext + leads[] from DB |
| Drag-and-Drop | 🔗 Needs Supabase | Status change → DB update |
| List View | 🔗 Needs Supabase | DB query |
| View Toggle | ✅ Implemented | State toggle |
| Lead Card | 🔗 Needs Supabase | lead object from DB |
| Lead Detail Panel | 🔗 Needs Supabase | Activities from DB |
| New Lead Modal | 🔗 Needs Supabase | Create → DB |
| Import Modal | 🔗 Needs Supabase | CSV parse → DB batch insert |
| Filters Panel | 🔗 Needs Supabase | Filter → DB query |
| Active Filter Count | ✅ Implemented | Client-side count |
| Clear Filters | ✅ Implemented | Reset state |
| Lead Stats Strip | 🔗 Needs Supabase | Computed from DB |
| Lead Assignment | 🔗 Needs Supabase | assignee → DB |
| Follow-up Scheduling | 🔗 Needs Supabase | QuickScheduleModal → DB |
| Lead Conversion to Won | 🔗 Needs Supabase | Convert → Customer + Estimate |
| Lead Delete / Archive | 🔗 Needs Supabase | DB delete/soft-delete |
| Lead Search | 🔗 Needs Supabase | DB FTS query |
| Personality Analysis | 🔌 Needs External | analyzeCustomerPersonality() → AI service |
| Lead Activity Feed | 🔗 Needs Supabase | DB activities |
| Real-time Indicator | 🔗 Needs Supabase | Supabase realtime not yet connected |

**Summary:** Lead Hub UI complete. All data needs Supabase. Personality AI needs external service. Realtime not connected.

---

## 10. Marketing

| Feature | Status | Notes |
|---------|--------|-------|
| Marketing Page | 🔗 Needs Supabase | Tabs, stats from DB |
| Reviews Tab | 🔗 Needs Supabase | reviews[] from DB |
| Leads Tab | 🔗 Needs Supabase | MQLs from campaigns |
| Follow-ups Tab | 🔗 Needs Supabase | followUps[] from DB |
| Campaigns Tab | 🔗 Needs Supabase | campaigns[] from DB |
| Gallery Tab | 🔗 Needs Supabase | galleryImages[] — file storage needed |
| Referrals Tab | 🔗 Needs Supabase | referrals[] from DB |
| Analytics Tab | 🔗 Needs Supabase | Computed from campaigns + leads |
| Reputation Widget | 🔗 Needs Supabase | Reviews averaged from DB |
| Campaign Widgets | 🔗 Needs Supabase | Campaign metrics from DB |

**Summary:** All marketing features need Supabase. Gallery may also need Supabase Storage.

---

## 11. Performance (Gamification)

| Feature | Status | Notes |
|---------|--------|-------|
| Performance Page | 🔗 Needs Supabase | GamificationContext; xpEnabled gate |
| XP Leaderboard Tab | 🔗 Needs Supabase | employees[], events[] from DB |
| Period Selector | 🔗 Needs Supabase | periodXP from DB |
| Podium Display | 🔗 Needs Supabase | Ranked employees from DB |
| Full Rankings Table | 🔗 Needs Supabase | getRankedEmployees() → DB |
| Award XP Modal | 🔗 Needs Supabase | awardXP() → DB insert |
| XP Progress Bar | 🔗 Needs Supabase | progressPct from DB |
| Level Badge | 🔗 Needs Supabase | level data from DB |
| History Tab | 🔗 Needs Supabase | Paginated events from DB |
| Daily Challenge Widget | 🔗 Needs Supabase | challenges[] from DB |
| Team Activity Widget | 🔗 Needs Supabase | events[] from DB |
| Writer Leaderboard | 🔗 Needs Supabase | Writer metrics from DB |
| Shop Streak | 🔗 Needs Supabase | streak from DB |
| Monthly MVP Badge | 🔗 Needs Supabase | mvp from DB |
| Achievement System | 🔗 Needs Supabase | achievements[] from DB |
| Category Color Coding | ✅ Implemented | Static constants |

**Summary:** All gamification features need Supabase.

---

## 12. Workflow / Orders

| Feature | Status | Notes |
|---------|--------|-------|
| Workflow Page | 🔗 Needs Supabase | Kanban + EstimateContext → DB |
| Kanban Board | 🔗 Needs Supabase | Cards from DB |
| Drag-and-Drop | 🔗 Needs Supabase | Status change → DB |
| Column Customization | ✅ Implemented | localStorage persistence |
| Move Column Up/Down | ✅ Implemented | localStorage |
| List View | 🔗 Needs Supabase | DB query |
| View Toggle | ✅ Implemented | State toggle |
| Search | 🔗 Needs Supabase | DB FTS |
| Filters | 🔗 Needs Supabase | DB filter query |
| Clear Filters | ✅ Implemented | Reset state |
| Stats Strip | 🔗 Needs Supabase | Computed from DB |
| Kanban Cards | 🔗 Needs Supabase | card object from DB |
| Priority Badges | ✅ Implemented | Static UI |
| Payment Status on Cards | 🔗 Needs Supabase | DB payment data |
| Schedule from Card | 🔗 Needs Supabase | QuickScheduleModal → DB |
| Open Estimate from Card | 🔗 Needs Supabase | Navigate to estimate |
| Add Card | 🔗 Needs Supabase | Estimate wizard → DB |
| Archive Card | 🔗 Needs Supabase | Soft delete → DB |
| Delete Card | 🔗 Needs Supabase | Hard delete → DB |

**Summary:** Workflow UI complete. All data needs Supabase.

---

## 13. Reports

| Feature | Status | Notes |
|---------|--------|-------|
| Reports Page | 🔌 Placeholder | Not implemented — needs PRD |
| Report Generation | 🔌 Placeholder | Stub |
| Report Filters | 🔌 Placeholder | Stub |
| Export Reports | 🔌 Placeholder | Stub (PDF/CSV) |

**Summary:** Reports section is entirely a placeholder. Needs dedicated PRD for scope.

---

## 14. Settings

| Feature | Status | Notes |
|---------|--------|-------|
| Integrations Page | ✅ Implemented | UI only; fields → localStorage |
| Integration Registry | ✅ Implemented | Static INTEGRATIONS registry |
| Integration Cards | ✅ Implemented | Status from localStorage |
| Integration Filters | ✅ Implemented | Client-side filter |
| Integration Slide-Over | ✅ Implemented | localStorage persistence |
| Stripe Integration | 🔌 Needs External | Requires Stripe API keys + webhook handler |
| Slack Integration | 🔌 Needs External | Requires Slack webhook URL + handler |
| ShopMonkey Integration | 🔌 Needs External | API key + ShopMonkey API v3 connection |
| Carfax Integration | 🔌 Needs External | Carfax API (existing 24/100 usage) |
| Connected Status Persistence | ✅ Implemented | localStorage |
| Location Management | 🔗 Needs Supabase | locations[] → DB CRUD |
| Shop Profiles | ✅ Implemented | localStorage (wm-shop-profile) |

**Summary:** Integration UI is complete. Stripe, Slack, ShopMonkey, Carfax need external API connections. Location management needs Supabase.

---

## 15. Notifications

| Feature | Status | Notes |
|---------|--------|-------|
| Notifications Page | 🔗 Needs Supabase | notifications[] from DB |
| Notification Bell | 🔗 Needs Supabase | unreadCount from DB |
| Unread Badge | 🔗 Needs Supabase | DB count query |
| Filter Tabs | ✅ Implemented | Client-side filter |
| Notification List | 🔗 Needs Supabase | DB query with date grouping |
| Notification Icon | ✅ Implemented | Static icon mapping |
| Type Color Coding | ✅ Implemented | Static color mapping |
| Mark as Read | 🔗 Needs Supabase | DB update |
| Mark All Read | 🔗 Needs Supabase | DB batch update |
| Clear Notification | 🔗 Needs Supabase | DB delete |
| Clear All | 🔗 Needs Supabase | DB batch delete |
| Notification Navigation | 🔗 Needs Supabase | Deep link + recordId |
| Stats Tiles | 🔗 Needs Supabase | Computed from DB |
| Empty State | ✅ Implemented | Static UI |

**Summary:** Notifications UI complete. All data needs Supabase.

---

## 16. Chat / AI

> **Status Update (April 24, 2026):** All AI features below are now fully implemented via Supabase Edge Functions + OpenRouter. Phase 1 & 2 complete.

|| Feature | Status | Notes |
|---------|--------|-------|
|| AI Estimate Generator | ✅ Implemented | `ai-generate-estimate` EF → `ai-text-generate` → OpenRouter |
|| Photo Mode (AI) | ✅ Implemented | `ai-vision-analyze` EF → OpenRouter vision |
|| Text Mode (AI) | ✅ Implemented | `ai-text-generate` EF → OpenRouter |
|| Loading States | ✅ Implemented | Phase UI states |
|| Draft Estimate Display | ✅ Implemented | AI output → wizard |
|| Alternative Suggestions | ✅ Implemented | AI multi-option via `ai-text-generate` |
|| Use This Estimate | ✅ Implemented | AI output → wizard |
|| AI Follow-up Writer | ✅ Implemented | `ai-follow-up-writer` EF → OpenRouter |
|| SMS Character Count | ✅ Implemented | Client-side count |
|| Copy to Clipboard | ✅ Implemented | navigator API |
|| Email/SMS Tabs | ✅ Implemented | Tab state |
|| DISC Personality Analysis | ✅ Implemented | `ai-personality-analysis` EF (hybrid heuristic + AI) |
|| Shop Context for AI | ✅ Implemented | `buildWrapMindContext()` |
|| AI Rate Limiting | ✅ Implemented | Client-side `aiRateLimiter.js` + circuit breaker in EF |
|| Streaming Chat | ✅ Implemented | `ai-chat` EF with SSE streaming |

**Summary:** All AI features are fully wired. OpenRouter handles LLM inference. PII scrubbing, usage ledger, and circuit breaker are all in place. Conversation history (`ai_conversations`) GraphQL wiring is complete; migration `20250426000000_create_ai_conversations.sql` is ready to apply.

---

## 17. Audit Log

| Feature | Status | Notes |
|---------|--------|-------|
| Audit Log Integration | 🔗 Needs Supabase | AuditLogContext → DB |
| Severity Levels | ✅ Implemented | Static constants |
| Logged Actions | 🔗 Needs Supabase | Enum → DB insert |
| Actor Tracking | 🔗 Needs Supabase | currentRole → DB |
| Team Activity Widget | 🔗 Needs Supabase | events[] → DB |
| Lead Activity Feed | 🔗 Needs Supabase | lead.activities[] → DB |

**Summary:** Audit log UI (context, severity, formatting) is implemented. All storage needs Supabase.

---

## 18. Feedback / Beta

| Feature | Status | Notes |
|---------|--------|-------|
| Feedback Widget | 🔌 Not Implemented | Placeholder — no component found |
| Bug Reporting | 🔌 Not Implemented | Placeholder — no component found |
| Experimental Badge | ✅ Implemented | Yellow badge on Marketing page |

**Summary:** Feedback and bug reporting are not built.

---

## 19. UI Primitives

| Feature | Status | Notes |
|---------|--------|-------|
| Button | ✅ Implemented | All variants |
| Badge | ✅ Implemented | Status indicators |
| Card | ✅ Implemented | Container component |
| Modal | ✅ Implemented | Overlay + slideOver |
| Input | ✅ Implemented | Form input |
| Select | ✅ Implemented | Dropdown |
| Textarea | ✅ Implemented | Multi-line |
| Toggle | ✅ Implemented | Binary switch |
| Tooltip | ✅ Implemented | Hover tooltip |
| WMIcon | ✅ Implemented | Icon registry |
| CelebrationOverlay | ✅ Implemented | Confetti |
| ErrorBoundary | ✅ Implemented | React error boundary |
| DiscPersonalityCard | ✅ Implemented | See Customers section |
| Spinner | ✅ Implemented | Loading state |
| Avatar | ✅ Implemented | User/initials |
| LevelBadge | ✅ Implemented | Gamification |
| CategoryBadge | ✅ Implemented | Performance page |
| XPBar | ✅ Implemented | Progress bar |
| StatTile | ✅ Implemented | Dashboard tiles |
| EmptyState | ✅ Implemented | Empty list UI |
| PageHeader | ✅ Implemented | Reusable header |
| CheckRow | ✅ Implemented | Filter checkbox |

**Summary:** All UI primitives are fully implemented.

---

## 20. Theme / i18n

| Feature | Status | Notes |
|---------|--------|-------|
| Dark Mode | ✅ Implemented | Tailwind dark: classes + ThemeContext |
| CSS Variable System | ✅ Implemented | Custom properties |
| Dark Mode Toggle | ✅ Implemented | localStorage persistence |
| Language Switching | 🔌 Not Implemented | i18n system not present |
| Unit Preferences | 🔌 Not Implemented | Imperial/metric not present |
| Responsive Design | ✅ Implemented | Mobile-first breakpoints |
| Custom Scrollbar | ✅ Implemented | CSS styling |

**Summary:** Theme system complete. i18n and unit preferences are not implemented.

---

## 21. Global / Context Architecture

| Feature | Status | Notes |
|---------|--------|-------|
| Feature Flags | ✅ Implemented | FeatureFlagsContext |
| Toast Notifications | ✅ Implemented | In-memory toasts[] |
| IOSAddToHomeScreen | ✅ Implemented | PWA install prompt |
| WelcomeScreen | ✅ Implemented | localStorage dismissed state |
| LocalStorage Persistence | ✅ Implemented | Dashboard, widgets, workflow, integrations, theme |
| Supabase Integration | ✅ Implemented | RLS policies + auth_org_id() helper in place |
| Apollo Client | ✅ Implemented | All 16 *.graphql.js files aligned with pg_graphql v1 schema |
| Context Architecture | ✅ Implemented | 12+ contexts in-memory |

**Summary:** Context architecture is complete for prototype mode. GraphQL wiring (Apollo + pg_graphql v1) and Supabase RLS are fully implemented. Remaining: apply `ai_conversations` migration and wire external integrations.

---

## Summary Table

| Section | ✅ Implemented | 🔗 Needs Supabase | 🔌 Needs External | 🔌 Not Built |
|---------|:---:|:---:|:---:|:---:|
| 1. Authentication | 7 | 0 | 0 | 0 |
| 2. Navigation | 7 | 0 | 0 | 0 |
| 3. Dashboard | 3 | 8 | 0 | 0 |
| 4. Customers | 3 | 7 | 1 | 0 |
| 5. Vehicles | 2 | 6 | 2 | 0 |
| 6. Estimates | 6 | 9 | 2 | 0 |
| 7. Invoices | 4 | 12 | 1 | 0 |
| 8. Scheduling | 2 | 15 | 0 | 0 |
| 9. Lead Hub | 2 | 17 | 2 | 0 |
| 10. Marketing | 0 | 10 | 0 | 0 |
| 11. Performance | 1 | 16 | 0 | 0 |
| 12. Workflow | 4 | 14 | 0 | 0 |
| 13. Reports | 0 | 0 | 0 | 4 |
| 14. Settings | 7 | 1 | 4 | 0 |
| 15. Notifications | 2 | 13 | 0 | 0 |
| 16. Chat / AI | 16 | 0 | 0 | 0 |
| 17. Audit Log | 2 | 5 | 0 | 0 |
| 18. Feedback / Beta | 1 | 0 | 0 | 2 |
| 19. UI Primitives | 23 | 0 | 0 | 0 |
| 20. Theme / i18n | 5 | 0 | 0 | 2 |
| 21. Global | 7 | 0 | 0 | 0 |
| **Totals** | **104** | **133** | **12** | **8** |

---

## High-Priority Gaps

1. **Supabase GraphQL Wiring** ~~(135 features)~~ — ✅ **RESOLVED** — All 16 `*.graphql.js` files are aligned with pg_graphql v1 schema. Apollo contexts are wired. Remaining: apply DB migrations (e.g. `ai_conversations`).

2. ~~**AI Features**~~ **(RESOLVED — Phase 1 & 2 complete)** — All AI features now connected via Supabase Edge Functions + OpenRouter. PII scrubbing, usage ledger, and circuit breaker in place.

3. **External Integrations** — Stripe (payments), ShopMonkey (shop sync), Carfax (VIN data), Slack (notifications) are wired in Settings UI but not connected.

4. **Reports** — Entirely a placeholder. Needs a dedicated PRD.

5. **Realtime** — Supabase realtime subscriptions noted as not yet implemented in Lead Hub and other live-updating views.

6. **PDF Generation** — Invoice and estimate print/export not implemented.

7. **i18n / Language Switching** — Not built.

---

## Next Steps

1. ~~**Phase 1:** Supabase Schema & RLS~~ ✅ **COMPLETE** — Core schema, RLS policies, and `auth_org_id()` helper in place.
2. ~~**Phase 2:** GraphQL Queries~~ ✅ **COMPLETE** — All 16 `*.graphql.js` Apollo queries/mutations aligned with pg_graphql v1.
3. **Phase 3:** Apply DB Migrations — Run `20250426000000_create_ai_conversations.sql` to unblock AI chat history.
4. **Phase 4:** External Integrations — Stripe, ShopMonkey, Carfax, Slack
5. **Phase 5:** Reports — Dedicated PRD and implementation
6. **Phase 6:** Realtime — Supabase subscriptions
7. **Phase 7:** i18n, PDF Generation, Feedback System
