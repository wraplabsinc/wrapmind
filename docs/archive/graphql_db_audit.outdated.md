# Prod Database GraphQL Audit — Cross-Reference with PRD

> **Audited:** April 23, 2026  
> **Prod DB:** https://nbewyeoiizlsfmbqoist.supabase.co/graphql/v1  
> **Source:** Introspection via GraphQL `__schema` query  
> **Reference:** `docs/PRD-feature-implementation-audit.md`

---

## Summary

The prod Supabase instance has a **rich, well-structured schema** with 60+ tables covering core CRM, scheduling, estimates, invoices, gamification, and audit logging. The vast majority of PRD "Needs Supabase" features have corresponding tables. Key gaps are identified below.

---

## ✅ PRD Features WITH Matching DB Tables

### Section 3 — Dashboard
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| KPI Strip | `shop_kpi_snapshots` (close_rate, avg_ticket, upsell_rate, on_time_rate, review_score, composite_score) | ✅ Table exists with all needed KPI fields |
| Revenue Chart | `revenue_target_pct` (target_date, target_pct, actual_pct) | ✅ Table exists |
| XP Leaderboard | `achievement_events` (employee_id, xp, achievement_id, awarded_at) | ✅ Table exists |
| Calendar Widget | `appointments` (date, start_time, end_time, technician_id, service, status) | ✅ Table exists |
| Team Activity Widget | `audit_log` (entity_type, entity_id, action, user_id, created_at) | ✅ Table exists |

### Section 4 — Customers
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Customer List | `customers` (first_name, last_name, phone, email, preferred_contact, referral_source, lifetime_value) | ✅ Table exists |
| Vehicle Assignment | `vehicles.client_id` FK to `customers` | ✅ FK exists |
| Activity Timeline | `audit_log` with `entity_type='customer'` | ✅ Table exists |
| Duplicate Detection | `customers.phone`, `customers.email` — unique index likely exists | ✅ Fields exist |
| Audit Logging | `audit_log` (entity_type, entity_id, action, before_json, after_json) | ✅ Table exists |
| Tag System | No explicit tags table — check if `customers.referral_source` or JSON field covers this | ⚠️ See gaps |

### Section 5 — Vehicles
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Vehicle List | `vehicles` (year, make, model, trim, vin, color, license_plate, vehicle_type, wrap_status) | ✅ Table exists |
| Add/Edit Vehicle | `vehiclesInsertInput`, `vehiclesUpdateInput` | ✅ Mutations exist |
| Vehicle Assignment | `vehicles.client_id` FK to `customers` | ✅ FK exists |
| Audit Logging | `audit_log` | ✅ Table exists |

### Section 6 — Estimates
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Status Workflow | `estimates.status` (sent, approved, declined, expired) | ✅ Field exists |
| Send Estimate | `estimates.sent_at` → not found; `issued_at` on invoices only | ⚠️ See gaps |
| Mark Approved/Declined | `estimates.approved_at` | ✅ Field exists |
| Convert to Invoice | `estimates.invoicesCollection`, `invoices.estimate_id` FK | ✅ FK + relation exists |
| Duplicate Estimate | `estimate_versions` (estimate_id, version, line_items_json) | ✅ Table exists |
| Archive Estimate | `estimates.status` — soft-delete via status | ✅ Field exists |
| Delete Estimate | `estimatesDeleteResponse` | ✅ Mutation exists |
| AI Follow-up Writer | `follow_up_log`, `follow_up_sequences` (message_template, delay_days) | ✅ Tables exist |
| Schedule Job from Estimate | `appointments.estimate_id` | ✅ FK exists |
| Expiry Tracking | `estimates.expires_at` | ✅ Field exists |

### Section 7 — Invoices
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Invoice List | `invoices` (invoice_number, status, total, amount_paid, amount_due, issued_at, due_at) | ✅ Table exists |
| Line Item Table | `invoices.line_items_json` (JSONB) | ✅ Field exists |
| Tax Calculation | `invoices.tax` (8.75% stored per PRD notes) | ✅ Field exists |
| Payment Recording | `invoices.payments` (JSONB), `invoices.amount_paid`, `invoices.amount_due` | ✅ Fields exist |
| Mark as Sent | `invoices.issued_at` | ✅ Field exists |
| Mark Void | `invoices.voided_at` | ✅ Field exists |
| Duplicate Invoice | `estimate_versions` as reference; no dedicated duplicate mutation | ⚠️ See gaps |
| Delete Invoice | `invoicesDeleteResponse` | ✅ Mutation exists |
| Convert from Estimate | `invoices.estimate_id` FK to `estimates` | ✅ FK exists |
| Overdue Detection | `invoices.due_at`, `invoices.status` | ✅ Fields exist |

### Section 8 — Scheduling
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Calendar Page (All Views) | `appointments` (date, start_time, end_time, status) | ✅ Table exists |
| Appointment Modal | `appointmentsInsertInput`, `appointmentsUpdateInput` | ✅ Mutations exist |
| Quick Schedule Modal | `appointments` with prefilled fields | ✅ Supports prefilling |
| Appointment Types | `appointments.service` field | ✅ Field exists |
| Technician Management | `employees` (name, role, color, is_active) + `appointments.technician_id` | ✅ FK exists |
| Appointment Status | `appointments.status` | ✅ Field exists |
| Reminder Status | `appointments.reminder_queued`, `reminder_sent`, `reminder_at` | ✅ Fields exist |
| Delete/Edit Appointment | `appointmentsDeleteResponse`, `appointmentsUpdateResponse` | ✅ Mutations exist |

### Section 9 — Lead Hub
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Kanban Board | `leads` (name, phone, email, source, status, priority, budget) | ✅ Table exists |
| Lead Card / Detail Panel | `leads` with all core fields | ✅ Table exists |
| New Lead Modal | `leadsInsertInput` | ✅ Mutation exists |
| Import Modal | `intake_leads` (first_name, last_name, phone, email, vehicle_year/make/model, services_requested, photos_json, status) | ✅ Separate intake table exists |
| Lead Stats Strip | Computed from `leads` (status counts) | ✅ All fields present |
| Lead Assignment | `leads.assignee_id` | ✅ Field exists |
| Follow-up Scheduling | `follow_up_sequences` (trigger_event, delay_days, channel, message_template) | ✅ Table exists |
| Lead Delete/Archive | `leadsDeleteResponse` | ✅ Mutation exists |
| Lead Activity Feed | `audit_log` with `entity_type='lead'` | ✅ Table exists |

### Section 10 — Marketing
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Reviews Tab | `review_requests` (estimate_id, client_id, sent_at, rating, reviewed) | ✅ Table exists |
| Leads Tab | `intake_leads` (imported leads) | ✅ Table exists |
| Follow-ups Tab | `follow_up_log`, `follow_up_sequences` | ✅ Tables exist |
| Referrals Tab | `referrals` (referral_code, activated_at, credit_applied) | ✅ Table exists |
| Analytics Tab | `shop_kpi_snapshots` (composite_score, close_rate, avg_ticket, review_score) | ✅ Table exists |
| Reputation Widget | `review_requests.rating` | ✅ Field exists |

### Section 11 — Performance (Gamification)
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Performance Page | `employees`, `achievement_events` | ✅ Tables exist |
| XP Leaderboard Tab | `achievement_events` (employee_id, xp, awarded_at) | ✅ Table exists |
| Period Selector | `achievement_events.awarded_at` for period filtering | ✅ Field exists |
| Podium Display | Ranked via `achievement_events` grouped by employee | ✅ Data model supports |
| Award XP Modal | `achievement_eventsInsertInput` | ✅ Mutation exists |
| History Tab | `achievement_events` with pagination | ✅ Pagination exists |
| Daily Challenge Widget | `achievement_events.achievement_id` | ✅ Field exists |
| Team Activity Widget | `audit_log` | ✅ Table exists |
| Monthly MVP Badge | `achievement_events.achievement_id='monthly_mvp'` | ✅ Field exists |
| Achievement System | `achievement_events.achievement_id`, `xp` | ✅ Table exists |

### Section 12 — Workflow / Orders
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Kanban Board | `estimates.status` | ✅ Field exists |
| Stats Strip | Computed from `estimates` (status counts, revenue) | ✅ All fields exist |
| Kanban Cards | `estimates` (status, total, deposit_amount, vehicle_json) | ✅ Table exists |
| Payment Status on Cards | `estimates.deposit_amount`, `invoices.amount_paid` | ✅ FK exists |
| Schedule from Card | `appointments.estimate_id` | ✅ FK exists |
| Open Estimate from Card | `estimates` → UI navigate | ✅ Data exists |
| Add Card | `estimatesInsertInput` | ✅ Mutation exists |
| Archive/Delete Card | `estimatesUpdateInput` (status), `estimatesDeleteResponse` | ✅ Mutations exist |

### Section 15 — Notifications
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Notifications Page | `notifications` (type, title, body, link, record_id, read, created_at) | ✅ Table exists |
| Notification Bell | `notifications.profile_id`, `notifications.read` | ✅ FK + field exist |
| Unread Badge | Count `notifications` where `read=false` | ✅ Queryable |
| Notification List | Full CRUD with date grouping | ✅ All fields present |
| Mark as Read | `notificationsUpdateInput` on `read` field | ✅ Mutation exists |
| Mark All Read | Batch update via GraphQL | ✅ Possible |
| Clear Notification | `notificationsDeleteResponse` | ✅ Mutation exists |
| Notification Navigation | `notifications.link`, `notifications.record_id` | ✅ Fields exist |
| Stats Tiles | Computed from `notifications.type` counts | ✅ All fields present |

### Section 17 — Audit Log
| PRD Feature | DB Table(s) | Status |
|------------|-------------|--------|
| Audit Log Integration | `audit_log` (entity_type, entity_id, user_id, action, before_json, after_json, created_at) | ✅ Table exists |
| Logged Actions | `audit_log.action` (String — logged actions enum) | ✅ Field exists |
| Actor Tracking | `audit_log.user_id` → `users` FK | ✅ FK exists |
| Team Activity Widget | `audit_log` filtered by org | ✅ Table exists |
| Lead Activity Feed | `audit_log` filtered by `entity_type='leads'`, `entity_id` | ✅ Table exists |

---

## ⚠️ PRD Features WITH Partial Gaps in DB

### Block Time (Scheduling)
PRD references `blockedTimes[]` for the calendar. The `appointments` table does **not** have an explicit `is_blocked` or `block_type` field. A workaround would be using `appointments.status='blocked'` or a separate `blocked_times` table if needed.

### AI Rate Limiting
No explicit `rate_limiting` or `ai_rate_limits` table found. Rate limiting would need to be implemented via Supabase Edge Functions or a dedicated table.

### Customers — Tag System
No explicit `tags` or `customer_tags` table. The PRD notes tags come from `listsData.js` (static). If dynamic tagging is needed, a new table would be required.

### Estimates — sent_at
`estimates` table has no `sent_at` field. Status transitions should track sent state via `estimates.status='sent'` unless a dedicated timestamp is added.

### Invoices — Duplicate Invoice
No dedicated "duplicate" mutation. Duplication would require a client-side copy operation using `estimates` data as template, then inserting a new invoice.

---

## ❌ PRD Features NOT Covered by DB Schema

### Lead Hub — Personality Analysis
PRD references `analyzeCustomerPersonality()` for leads. No `personality_type`, `disc_type`, or `personality_score` field exists on `leads` or `customers`. This is marked 🔌 Needs External in PRD, confirmed by DB gap.

### Marketing — Campaigns Tab
No `campaigns` table exists in the schema. Marketing campaigns (Google Ads, Facebook, etc.) are not represented. This section of the PRD cannot be wired to Supabase without creating a new table.

### Marketing — Gallery Tab
No `gallery_images` or `marketing_gallery` table exists. The PRD references `galleryImages[] — file storage needed`. Supabase Storage (not GraphQL) would be the appropriate solution here.

### Performance — Shop Streak
No `streak` field on `employees` or a separate `shop_streaks` table. The `achievement_events` table may cover this via a `streak_started` achievement_id, but no explicit streak logic visible.

### Performance — XP/Level on Employees
`employees` table has no `current_xp`, `level`, or `shop_streak` fields. XP data lives entirely in `achievement_events`. The UI would need to compute XP by aggregating `achievement_events` per employee — which is viable but requires careful GraphQL query design.

### Scheduling — Block Time Preferences
Reminder preferences (`reminder_minutes_before` etc.) not found as dedicated fields on `appointments`. Current `reminder_at` field stores a single datetime, not a preference list.

---

## 📋 Complete Table List (Prod DB)

```
OBJECT TABLES:
achievement_events     audit_log             appointments         
bays                  billing_events        cars                 
condition_reports     customers             dimension_references 
employees             estimate_notes        estimate_templates   
estimate_upsells      estimate_versions     estimates            
feedback_log          film_calculator_results fleet_accounts     
follow_up_log         follow_up_sequences   intake_leads         
inventory             inventory_transactions invoices            
job_bookings          job_tracker_tokens    labor_logs           
leads                 locations             notifications        
notifications_log     organizations         package_materials     
photo_timeline        portfolio_tags        profile_locations    
profiles              referrals             revenue_target_pct   
review_requests       shop_kpi_snapshots    shop_settings       
sm_ai_insights        sm_comparison_line_items sm_import_customers
sm_import_labor_rates sm_import_log         sm_import_order_lines
sm_import_orders      sm_import_vehicles    sm_quote_comparisons 
sms_threads           users                 vehicle_size_multipliers
vehicles              vin_plant_codes       vin_year_codes      
wmi_codes             wrap_materials        wrap_packages       
```

---

## 🔍 Key Observations

1. **Schema is production-ready for core CRM:** Customers, Vehicles, Estimates, Invoices, Appointments, Leads, Employees, Notifications, Audit Log — all core tables exist with proper FKs and relationships.

2. **Gamification is structured correctly:** `achievement_events` is a proper event-logging table (not a static XP field on employees), which allows flexible history and period-based aggregation.

3. **Marketing gap is significant:** No `campaigns` table means the entire Marketing → Campaigns Tab and Campaign Widgets cannot be wired. A dedicated `marketing_campaigns` table needs to be added.

4. **Gallery requires Supabase Storage (not GraphQL):** The Gallery Tab needs file storage, which is a different Supabase product (Storage bucket) not visible in GraphQL introspection.

5. **Estimates/Invoices use JSONB for flexible fields:** `vehicle_json`, `services_json`, `line_items_json`, `payments`, `details_json`, `vision_json`, `confidence_factors_json` — this is a good pattern for prototype flexibility but may need querying helpers.

6. **No dedicated `sent_at` on estimates:** Status-based tracking (`status='sent'`) is the current pattern. If precise sent timestamp is needed, add `sent_at` to `estimates`.

7. **AI features are external stubs by design:** No `ai_requests`, `ai_logs`, or `rate_limits` table — AI calls go directly to OpenAI/Anthropic per PRD notes.

---

*Generated via GraphQL introspection: `POST {SUPABASE_URL}/graphql/v1` with `__schema { types { ... } } }`*
