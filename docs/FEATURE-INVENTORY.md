# WrapMind UI Feature Inventory

> **Generated:** April 16, 2026  
> **Source:** `/home/duke/wrapmind/app.wrapmind/src/components/` and `/pages/`  
> **Total Components Scanned:** ~133 JSX files  
> **Total Features:** ~250+ discrete UI capabilities

---

## 1. Authentication

- **Login Form** — Email + password form, POST to Supabase auth endpoint, error handling for invalid credentials. Data: `email`, `password`.
- **Signup / Invite Flow** — Account creation with invite-based onboarding. Data: `email`, `password`, `role`, `inviteCode`.
- **Auth Page (`AuthPage.jsx`)** — Full-page auth layout with dark mode support via `dark:` Tailwind classes. Switches between login/signup modes.
- **Role-Based Access** — Context-based roles (`owner`, `manager`, `writer`, `viewer`) via `RolesContext`. Feature-gated UI based on `currentRole`.
- **Dev Mode Badge** — `VITE_DEV_AUTH === '1'` shows a "DEV" badge in the `TopBar`. Data: `import.meta.env.VITE_DEV_AUTH`.
- **Session Persistence** — Auth state stored in `AuthContext`; session restored on reload via Supabase token refresh.
- **Logout** — Clears auth state, redirects to `/auth`. Data: user session from `AuthContext`.

---

## 2. Navigation

- **SideNav (`SideNav.jsx`)** — Collapsible desktop sidebar with icon + label nav items. Feature-gated visibility via `FeatureFlagsContext` (e.g., `xpEnabled`, `workflowEnabled`). Data: `currentView` state.
- **HamburgerMenu (`HamburgerMenu.jsx`)** — Mobile drawer overlay with nav links and user avatar. Triggered by hamburger icon in `TopBar`.
- **TopBar** — Sticky header with: hamburger toggle, WrapMind logo, location switcher, notification bell, user avatar, dark mode toggle. Data: `currentLocation`, `currentRole`.
- **Location Switcher** — Dropdown to switch between multiple shop locations (enabled when `multiLocationEnabled` feature flag is true). Data: `locations[]` from context.
- **Breadcrumb** — Current page label shown in TopBar. Data: `currentView` state.
- **Notification Bell Icon** — Shows unread notification count badge. Click navigates to `/notifications`. Data: `unreadCount` from `NotificationsContext`.
- **Feature-Gated Nav Items** — Nav items conditionally rendered based on feature flags: `xpEnabled` (Performance), `workflowEnabled` (Workflow), `marketingEnabled` (Marketing), `leadHubEnabled` (Lead Hub).

---

## 3. Dashboard

- **KPI Strip (`KpiStrip.jsx`)** — Row of 6 metric tiles with sparkline indicators. Data: `approvalRate`, `averageOrderSize`, `totalRevenue`, `proposalsSent`, `followUpRate`, `revenuePerProposal`. Thresholds stored in `localStorage` under `wm-kpi-thresholds`.
- **Revenue Chart Widget** — Time-series chart showing revenue over selectable periods (7d, 30d, 90d). Data: `revenueData[]` with date + amount fields. Clicking a data point drills into a specific time range.
- **XP Leaderboard Widget** — Compact top-3 podium display with avatars, XP counts, and level badges. Data: `employees[]`, `totalXP`, `level` from `GamificationContext`. Real-time rank ordering.
- **Calendar Widget** — Small month-view calendar with event dots on days with appointments. Data: `appointments[]` from `SchedulingContext`. Today highlighted.
- **Team Activity Widget** — Shows recent team activity events with timestamps and actor info. Data: `events[]` from `AuditLogContext`. Filterable by activity type.
- **Writer Leaderboard Widget** — Sub-leaderboard showing writer-specific metrics. Data: writer performance metrics from `GamificationContext`.
- **Shop Streak Widget** — Shows consecutive days with completed jobs. Data: `streak` from `GamificationContext`.
- **Monthly MVP Badge Widget** — Displays current month's top performer with avatar and badge. Data: `mvp` from `GamificationContext`.
- **Sortable Widget Grid** — Drag-and-drop reordering of dashboard widgets using `@dnd-kit/core`. Widget order persisted to `localStorage` (`wm-dashboard-order`). Data: `widgetOrder[]`.
- **Widget Visibility Toggle** — Per-widget eye icon to show/hide widgets. Config persisted to `localStorage` (`wm-widget-configs`).
- **Dashboard Add/Remove Widgets** — "+ Add Widget" button opens a modal listing available widgets for activation.

---

## 4. Customers

- **Customer List (`CustomersPage.jsx`)** — Searchable, sortable table with pagination. Columns: name, phone, email, vehicles, total jobs, total spent, last activity. Data: `customers[]` from `CustomerContext`.
- **Search Input** — Real-time filter on `name`, `phone`, `email`. Uses fuzzy matching against combined string.
- **Sortable Columns** — Click column headers to sort ascending/descending. Sort state: `sortCol`, `sortDir`.
- **Pagination** — Page size of 20, prev/next controls. Data: paginated slice of `filteredCustomers[]`.
- **Customer Detail Panel (`CustomerDetailPanel.jsx`)** — Slide-over panel (420px wide) with tabbed interface. Tabs: Overview, Vehicles, History. Data: selected `customer` object.
- **Customer Form** — Add/edit customer form with fields: name, phone, email, address, source, assigned-to, tags, notes. Data: `customer` object. Validates required fields.
- **Tag System** — Color-coded tags (VIP, Active, Inactive, Referral, etc.) with style constants in `listsData.js`. Tags displayed as pills on customer cards.
- **DISC Personality Card** — Renders `DiscPersonalityCard` component showing personality type, scores (D/I/S/C), behavioral signals, communication style, closing tips. Data: `personality` from `CustomerContext`.
- **Vehicle Assignment** — Links vehicles to customer in detail panel. Data: `customer.vehicles[]`.
- **Activity Timeline** — Customer interaction history in detail panel. Data: `activities[]` associated with customer.
- **Duplicate Detection** — On customer creation, checks for existing `email` or `phone` matches. Prevents duplicate entries.
- **Audit Logging** — All customer create/update/delete actions logged via `AuditLogContext`.

---

## 5. Vehicles

- **Vehicle List (`VehiclesPage.jsx`)** — Searchable table of all vehicles. Columns: year, make, model, VIN, customer, color, registered. Data: `vehicles[]` from context.
- **Search Input** — Filters by combined `year + make + model + VIN` string.
- **VIN Decoder** — Auto-populates year/make/model when valid VIN is entered in vehicle form. Data: VIN validation logic.
- **Year/Make/Model Picker** — Three-step dropdown cascade for vehicle selection. Data: static vehicle make/model data.
- **Vehicle by Image** — Upload vehicle photo to auto-identify year/make/model using `analyzeVehicleImage()` from `lib/ai.js`.
- **Vehicle Detail Panel** — Shows full vehicle info, linked customer, wrap history, service records. Data: selected `vehicle` object.
- **Brand Logo Fetching** — Vehicle brand logos fetched via `https://www.google.com/s2/favicons?domain=[domain]&sz=128`. Data: vehicle `make` → domain mapping.
- **Add/Edit Vehicle Form** — Form with fields: year, make, model, VIN, color, trim, type, fuel, mileage. Data: `vehicle` object.
- **Vehicle Assignment to Customer** — Links vehicle to a customer record. Data: `vehicle.customerId`.
- **Audit Logging** — Vehicle create/update/delete logged.

---

## 6. Estimates

- **Multi-Step Wizard (`EstimateWizard.jsx`)** — Step indicator with 4 steps: Customer & Vehicle, Package & Modifiers, Review, Confirm. State managed in `EstimateContext`. Data: `estimateForm` state object.
- **Package Cards** — Selection UI for wrap packages (Full Wrap, Partial Wrap, Chrome Delete, etc.) with price display. Data: `packages[]` with `basePrice`, `laborHours`.
- **Modifiers Step (`ModifiersStep.jsx`)** — Add-on options for each package (paint protection, ceramic coating, etc.). Toggles with +/- quantity. Data: `modifiers[]`.
- **AI Estimate Generator (`AIEstimateGenerator.jsx`)** — Modal with two modes: text description and photo upload. AI-powered vehicle identification from photo via `analyzeVehicleImage()`. Generates: vehicle label, package, material, labor hours, costs, total. Data: AI-generated `draftEstimate` object. Shows loading phases ("Identifying vehicle…", "Generating estimate…"). Supports alternative suggestions.
- **Review Step (`EstimateReview.jsx`)** — Summary of all entered data with edit buttons per section. Shows price breakdown (base, labor, material, discount, total).
- **Right Panel** — Persistent summary sidebar during wizard showing: customer info, vehicle info, selected package, price total. Slides in from right.
- **Estimate Templates (`EstimateTemplate.jsx`)** — Save current estimate as template for reuse. Templates stored in `localStorage`. Load template to pre-fill wizard.
- **Status Workflow** — Statuses: draft → sent → approved/declined → converted/expired. Status change triggers audit log entry. Data: `estimate.status`.
- **Send Estimate** — Action to mark estimate as "sent" and set `sentAt` timestamp.
- **Mark Approved/Declined** — One-click status transitions with confirmation for decline. Sets `approvedAt` or `declinedAt`.
- **Convert to Invoice** — Available when status is "approved". Creates `InvoiceContext` entry and sets `convertedToInvoice: true`, `invoiceId`.
- **Duplicate Estimate** — Creates copy with new ID, status reset to "draft".
- **Archive Estimate** — Soft-delete, sets status to "archived".
- **Delete Estimate** — Hard delete with confirmation.
- **AI Follow-up Writer (`AIFollowUpModal.jsx`)** — Generates SMS and email follow-up text based on estimate data. Tone selector: friendly, professional, urgent. SMS character count (160 limit). Copy-to-clipboard on generated text. Data: `generateFollowUp()` from `lib/ai.js`.
- **Schedule Job from Estimate** — Opens `QuickScheduleModal` pre-filled with customer/vehicle from estimate. Data: estimate → appointment mapping.
- **Expiry Tracking** — Shows "Expires in X days" warning. Expired estimates auto-update status to "expired". Data: `expiresAt` field.

---

## 7. Invoices

- **Invoice List (`InvoicesPage.jsx`)** — Full-page invoice list with summary stat tiles. Data: `invoices[]` from `InvoiceContext`.
- **Status Badges** — Visual badges for: Draft, Sent, Viewed, Partial, Paid, Overdue, Void. Color-coded with dot indicator. Data: `invoice.status`.
- **Filter Tabs** — Filter by status: All, Draft, Sent, Paid, Overdue. Active tab highlighted.
- **Search** — Filters by invoice number, customer name, vehicle. Data: `searchQuery`.
- **Invoice Detail Panel** — Slide-over panel with three tabs: Invoice (line items, totals), Payments (payment history, record payment form), Activity (audit trail). Data: selected `invoice`.
- **Line Item Table** — Editable line items with description, qty, unit, unit price, total. Auto-calculates line totals. Data: `invoice.lineItems[]`.
- **Tax Calculation** — Auto-applies 8.75% tax rate to subtotal. Configurable via `TAX_RATE` constant. Data: `invoice.subtotal`, `invoice.taxAmount`.
- **Discount Support** — Optional discount subtracted before tax. Data: `invoice.discount`.
- **Payment Recording** — Inline form to record payment: amount, method (Card/Cash/Check/Zelle/ACH), reference/note, date. Multiple partial payments supported. Data: `invoice.payments[]`.
- **Balance Due Display** — Shows amount remaining. Color: green if paid, red if outstanding. Data: `invoice.amountDue`.
- **Payment Terms** — Dropdown for Net 7/15/30/60/Due on Receipt/Custom. Displayed on invoice. Data: `invoice.terms`.
- **Mark as Sent** — Status transition from draft → sent. Sets `sentAt` timestamp.
- **Mark Void** — Marks invoice as void (strikethrough styling). Prevents further payment recording.
- **Duplicate Invoice** — Creates copy with new invoice number, status reset to draft.
- **Delete Invoice** — Removes from context with confirmation.
- **Print / Export PDF** — Triggers `window.print()` for physical/export.
- **Convert from Estimate** — Creates invoice pre-filled from approved estimate data. Data: `estimateId`, `estimateNumber`.
- **Overdue Detection** — Auto-detects overdue based on `dueAt` vs current date. Visual warning on overdue invoices.

---

## 8. Scheduling

- **Calendar Page (`SchedulingPage.jsx`)** — Full-page scheduling view with day/week/month view modes. Data: `appointments[]`, `blockedTimes[]` from `SchedulingContext`.
- **Day View** — Single-day timeline (7am–8pm) with technician columns. Shows appointment blocks positioned by time. Current time indicator (blue line). Data: `appointments` filtered by date.
- **Week View** — 7-day grid with condensed time slots. Appointment blocks show customer name and service. Data: `appointments` filtered by week.
- **Month View** — Calendar month grid with appointment dots per day. Click day to expand. Data: `appointments` grouped by day.
- **Current Time Indicator** — Red/blue horizontal line showing current time in day/week views. Updates every minute via `setInterval`. Data: `Date.now()`.
- **Appointment Modal (`AppointmentModal`)** — Modal form for creating/editing appointments. Fields: customer name, phone, vehicle, service, technician, date, start time, end time, status, notes. Data: `appointment` object.
- **Service Duration Calculation** — Auto-calculates end time based on service type and `SERVICE_DURATIONS` map. Data: `SERVICE_DURATIONS` from context.
- **Quick Schedule Modal (`QuickScheduleModal`)** — Simplified scheduling from estimate/customer context. Pre-fills customer and vehicle info. Data: `prefill` object from parent context.
- **Appointment Types** — Toggle between "Appointment" (customer job) and "Block Time" (unavailable slot). Block time hides customer fields. Data: `appointment.type`.
- **Technician Management** — Color-coded technician columns. Filter by active technicians. Assign appointments to specific technicians. Data: `technicians[]`, `technicianName`.
- **Technician Color Coding** — Each technician gets a color from `TECH_COLORS` palette. Applied to appointment block borders. Data: `technician.color`.
- **Appointment Status** — Statuses: scheduled (blue), confirmed (green), cancelled (red). Color-coded blocks. Data: `appointment.status`.
- **Block Time** — Create unavailable blocks (lunch, holiday, prep). Label field for description. Data: `blockedTimes[]`.
- **Reminder Status** — Shows reminder status badge (queued vs sent). Data: `reminderQueued`, `reminderAt`, `reminderSent`.
- **Delete Appointment** — Removes appointment from context. Available in appointment modal edit mode.
- **Edit Appointment** — Opens modal pre-filled with existing appointment data. Available by clicking appointment block.
- **Time Slot Click** — Click empty time slot in day/week view to open appointment modal pre-filled with that slot's time. Data: `{ date, startTime, technicianName }`.

---

## 9. Lead Hub

- **Kanban Board (`LeadKanban.jsx`)** — Drag-and-drop kanban with `DndContext`/`@dnd-kit`. Columns: New, Contacted, Qualified, Won, Lost. Lead cards draggable between columns. Data: `leads[]` with `status`.
- **Drag-and-Drop** — `PointerSensor` with 5px activation distance. `DragOverlay` shows card ghost while dragging. Same-column reordering supported. Triggers `handleDragEnd` with status change logging.
- **List View (`LeadList.jsx`)** — Tabular view alternative to kanban. Columns: name, status, source, priority, budget, assignee, follow-up date. Sortable columns. Data: `filteredLeads[]`.
- **View Toggle** — Switch between Kanban and List views. Pill-style toggle buttons. State: `view`.
- **Lead Card (`LeadCard.jsx`)** — Compact card showing: name, phone, email, vehicle, budget, priority badge, follow-up date, appointment indicator. Data: `lead` object.
- **Lead Detail Panel (`LeadDetailPanel.jsx`)** — Slide-over panel with tabs: Activity, Details, Personality. Activity feed with timestamps. Data: `lead` object, `activities[]`.
- **New Lead Modal (`NewLeadModal.jsx`)** — Form to create new lead. Fields: name, phone, email, source, priority, assignee, vehicle (year/make/model), service interest, budget, notes, follow-up date. Data: `lead` object.
- **Import Modal (`ImportModal.jsx`)** — Bulk CSV import for leads. Accepts file upload, parses CSV, validates rows, imports in batch. Data: `imported[]`.
- **Filters Panel** — Dropdown with checkboxes for: Status (LEAD_STATUSES), Source (LEAD_SOURCES), Priority (PRIORITIES), Assignee (TEAM_MEMBERS), budget range (min/max), has follow-up toggle. Data: `filterStatuses[]`, `filterSources[]`, etc.
- **Active Filter Count** — Shows number badge on "Filters" button when filters active. Badge: blue pill with count.
- **Clear Filters** — Resets all filter states to default. One-click in filter panel.
- **Lead Stats Strip** — Header stats: Total leads, New this week, Contacted rate (%), Won rate (%), Avg response days, Pipeline value. Data: computed from `leads[]` array.
- **Lead Assignment** — Reassign lead to different team member via dropdown on card or detail panel. Data: `lead.assignee`.
- **Follow-up Scheduling** — Schedule follow-up appointment from lead detail. Opens `QuickScheduleModal`. Data: `lead.followUpDate`.
- **Lead Conversion to Won** — "Convert" button on lead card. Marks lead as "won", creates customer record, navigates to estimate wizard with pre-fill. Data: `convertLeadToWon()`, `createCustomerFromLead()`.
- **Lead Delete / Archive** — Delete permanently removes. Archive (soft delete) also available. Both trigger audit log entries.
- **Lead Search** — Filters by combined text: name, phone, email, vehicle year/make/model, service interest. Data: `search` string.
- **Personality Analysis** — `analyzeCustomerPersonality()` from `lib/personalityEngine.js` runs on lead detail open. Matches by email/phone/name against `CustomerContext`. Data: `personality` object.
- **Lead Activity Feed** — Timestamped activity entries on lead detail panel. Activities added when status changes, notes added, follow-ups scheduled. Data: `lead.activities[]`.
- **Real-time Indicator** — "Offline" badge in header indicating realtime subscriptions not yet implemented.

---

## 10. Marketing

- **Marketing Page (`MarketingPage.jsx`)** — Tabbed page with 7 tabs. Header shows summary stats: reviews sent, leads, active campaigns. Experimental feature badge. Data: `reviews[]`, `leads[]`, `campaigns[]` from `MarketingContext`.
- **Reviews Tab (`ReviewsTab.jsx`)** — Review request management. Shows sent reviews, request status, response tracking. Data: `reviews[]`.
- **Leads Tab (`LeadsTab.jsx`)** — Marketing-qualified leads from campaigns. Pipeline view. Data: `leads[]`.
- **Follow-ups Tab (`FollowUpsTab.jsx`)** — Automated follow-up sequences. Shows pending/completed follow-ups. Data: `followUps[]`.
- **Campaigns Tab (`CampaignsTab.jsx`)** — Marketing campaign management. Create/edit campaigns with targeting, channels, budget. Data: `campaigns[]`.
- **Gallery Tab (`GalleryTab.jsx`)** — Photo gallery of completed wraps for marketing use. Upload/manage images. Data: `galleryImages[]`.
- **Referrals Tab (`ReferralsTab.jsx`)** — Referral tracking and management. Shows referral sources, converted referrals. Data: `referrals[]`.
- **Analytics Tab (`AnalyticsTab.jsx`)** — Marketing performance metrics. ROI, conversion rates, channel performance. Data: computed from `campaigns[]`, `leads[]`.
- **Reputation Widget** — Shows aggregate review rating across platforms. Data: `reviews[]` averaged score.
- **Campaign Widgets** — Individual campaign cards showing performance metrics. Data: `campaign` object.

---

## 11. Performance

- **Performance Page (`PerformancePage.jsx`)** — Gamification hub with XP leaderboard, history, challenges. Feature-gated by `xpEnabled` flag. Data: `GamificationContext`.
- **XP Leaderboard Tab** — Full leaderboard with period selector (This Week, This Month, All Time). Podium display for top 3 with crown icon, avatar rings, podium blocks. Data: `employees[]`, `events[]`.
- **Period Selector** — Toggle between week/month/all-time rankings. Recalculates `periodXP` for each employee. State: `period`.
- **Podium Display** — 1st/2nd/3rd place with gold/silver/bronze colors, crown icon for 1st, medal labels, avatar with colored ring, XP count, level badge, podium block.
- **Full Rankings Table** — All employees with: rank, avatar+name+role, level badge, progress bar to next level, weekly/monthly/all-time XP columns, award button. Data: `getRankedEmployees()`.
- **Award XP Modal (`AwardXPModal`)** — Form to manually award XP to employees. Fields: employee dropdown, achievement dropdown (grouped by category), XP amount (fixed or manual for variable XP), note. Submits to `awardXP()`.
- **XP Progress Bar** — Visual bar showing progress to next level. Shows "X to [next level title]". Data: `emp.progressPct`, `emp.xpToNext`.
- **Level Badge** — Colored pill showing level number and title. Data: `emp.level.color`, `emp.level.level`, `emp.level.title`.
- **History Tab** — Paginated XP event log with filters. Employee filter, category filter. 20 events per page. Data: `events[]`.
- **Daily Challenge Widget** — Shows today's challenge, progress, reward XP. Data: `challenges[]`, current date.
- **Team Activity Widget** — Recent XP events across team. Data: `events[]` slice.
- **Writer Leaderboard** — Sub-board for writer-specific metrics (proposals written, approval rate). Data: writer-specific metrics.
- **Shop Streak** — Consecutive day counter for completed jobs. Data: `streak` count.
- **Monthly MVP Badge** — Top performer badge display. Data: `mvp` object.
- **Achievement System** — Achievement definitions by category (sales, customer, performance, special). Each has: icon, label, XP value, variableXP flag. Data: `achievements[]`.
- **Category Color Coding** — Sales (blue), customer (green), performance (purple), special (amber) for achievement badges.

---

## 12. Workflow / Orders

- **Workflow Page (`WorkflowPage.jsx`)** — Kanban-style pipeline for job orders. Syncs with `EstimateContext`. Data: `estimates[]` mapped to `cards[]`.
- **Kanban Board (`KanbanBoard.jsx`)** — Drag-and-drop board using `@dnd-kit`. Default columns: Active, Scheduled, Complete, Dead, Invoice. Data: `cards[]`, `columnsState[]`.
- **Drag-and-Drop Cards** — Cards draggable between columns. Status change syncs back to `EstimateContext`. Audit logged on drop. Data: `card.id`, `card.columnId`.
- **Column Customization** — Add new columns (label + color), rename columns, delete custom columns, reorder columns, toggle visibility. Persisted to `localStorage` (`wm.workflow.columns.v1`). Data: `columnsState[]`, `hiddenColumns[]`.
- **Move Column Up/Down** — Reorder columns via arrow buttons in customize panel.
- **List View (`ListView.jsx`)** — Tabular alternative showing all cards as rows. Columns: ID, customer, vehicle, services, total, payment status, priority, assignee, days in column. Data: `filteredCards[]`.
- **View Toggle** — Switch between Columns and List views. State: `view`.
- **Search** — Filters by combined: ID, customer name, vehicle year/make/model, services. Data: `search` string.
- **Filters** — Multi-select filters: Assignee, Tags, Payment status, Priority, amount range, age (>7 days, >14 days). Active filter count badge. Data: `filterAssignees[]`, etc.
- **Clear Filters** — One-click reset of all filter states.
- **Stats Strip** — Shows: pipeline value (non-complete cards), closed this month (complete cards), card counts per column. Data: computed from `cards[]`.
- **Kanban Cards** — Show: title, services list, customer name/phone/email, vehicle, tags, total amount, payment status badge, priority indicator, assignee avatar, days-in-column counter, estimate link. Data: `card` object.
- **Priority Badges** — Color-coded: urgent (red), high (orange), normal (gray). Data: `card.priority`.
- **Payment Status on Cards** — Badge showing: paid (green), partial (yellow), unpaid (red). Data: `card.paymentStatus`.
- **Schedule from Card** — "Schedule" button on card opens `QuickScheduleModal`. Data: `scheduleCard` state.
- **Open Estimate from Card** — Click card or "View" button navigates to estimate detail (or wizard if no estimate ID). Data: `card.estimateId`.
- **Add Card** — "+" button in column opens estimate wizard. Column ID passed as context.
- **Archive Card** — Removes card from board, logs to audit.
- **Delete Card** — Hard delete with confirmation, audit logged.

---

## 13. Reports

> Note: Reports page (`ReportsPage.jsx`) appears to be a placeholder/not fully implemented based on file scan.

- **Reports Page** — Placeholder for reporting features (not yet fully built out).
- **Report Generation** — Stub/placeholder for various report types.
- **Report Filters** — Stub for date range, location, category filters.
- **Export Reports** — Stub for PDF/CSV export of report data.

---

## 14. Settings

- **Integrations Page (`IntegrationsPage.jsx`)** — Grid of integration cards. Categories: Payments, Vehicle Data, Notifications, Shop Management, Automation, Productivity, Project Management. Data: `INTEGRATIONS` registry.
- **Integration Registry** — Configured integrations: Stripe (payments), Carfax (VIN/vehicle data), Slack (notifications), Shopmonkey (shop sync), Zapier (automation, coming soon), Google Workspace (calendar/drive, coming soon), Trello (project mgmt, coming soon). Data: `INTEGRATIONS[]`.
- **Integration Cards** — Show: integration name, logo (from `/integrations/`), description, category, status badge (Connected/Available/Coming Soon). Data: `integration` object.
- **Integration Filters** — Filter tabs: All, Connected, Available, Coming Soon. State: `filter`.
- **Integration Slide-Over (`IntegrationSlideOver.jsx`)** — Configuration panel for selected integration. Fields vary by integration (API keys, webhook URLs). Submit saves to `localStorage` (`wm-integrations`). Data: `integration.fields[]`.
- **Stripe Integration Fields** — Publishable Key, Secret Key, Webhook Secret. All password-type inputs.
- **Slack Integration Fields** — Incoming Webhook URL (url-type input).
- **Shopmonkey Integration Fields** — API Key.
- **Carfax Integration** — Shows "Active" status with usage stats: "24/100 lookups used this month". Links to existing Carfax page.
- **Connected Status Persistence** — Connection state stored in `localStorage`. Reads on mount to determine active/available status.
- **Location Management (`LocationsPage.jsx`)** — Manage multiple shop locations. Add/edit/delete locations with address, phone, hours. Data: `locations[]` from context.
- **Shop Profiles** — Shop profile data persisted to `localStorage` (`wm-shop-profile`). Used by AI for shop context. Data: shop name, address, phone, hours.

---

## 15. Notifications

- **Notifications Page (`NotificationsPage.jsx`)** — Full-page notification center. Data: `notifications[]` from `NotificationsContext`.
- **Notification Bell Icon** — Shows unread count badge in `TopBar`. Links to `/notifications`. Data: `unreadCount`.
- **Unread Badge** — Blue pill showing count of unread notifications. Data: `unreadCount > 0`.
- **Filter Tabs** — Tabs: All, Unread, Estimates, Invoices, Leads, System. Active tab highlighted. Data: `activeFilter`.
- **Notification List** — Grouped by date (Today, Yesterday, This Week, Earlier). Each row: icon, title, body, relative timestamp, unread dot. Data: `notifications[]`.
- **Notification Icon** — Contextual icon per type: check (estimate/invoice approval), dollar (payment), user (lead/customer), alert (system), clock (scheduling), document (general). Data: `notif.icon`, `notif.type`.
- **Type Color Coding** — Blue (estimate), green (invoice/payment), purple (lead), emerald (system approval), red (overdue), gray (system).
- **Mark as Read (Individual)** — Click notification to mark read and navigate to linked record. Data: `markRead(notif.id)`.
- **Mark All Read** — Button in header to mark all unread notifications as read. Data: `markAllRead()`.
- **Clear Notification (Individual)** — X button on hover to dismiss single notification. Data: `clearNotification(id)`.
- **Clear All** — Button to clear all notifications. Data: `clearAll()`.
- **Notification Navigation** — Click notification to navigate: `link` (e.g., 'lists-customers') + optional `recordId` for deep linking. Data: `notif.link`, `notif.recordId`.
- **Stats Tiles** — Row of tiles: Total, Unread, This Week, Estimates. Data: computed from `notifications[]`.
- **Empty State** — Shown when no notifications match filter. Icon + message.

---

## 16. Chat / AI

- **AI Estimate Generator (`AIEstimateGenerator.jsx`)** — Modal with two input modes: text description and photo upload. Two-phase AI: vehicle identification then estimate generation. Data: `generateEstimateFromText()`, `analyzeVehicleImage()` from `lib/ai.js`.
- **Photo Mode (AI)** — Upload vehicle photo via file input. Preview shown. Base64 encoded for API call. `analyzeVehicleImage()` extracts year/make/model/trim. Data: `photoBase64`.
- **Text Mode (AI)** — Free-text job description. Placeholder example: "Full wrap Tesla Model 3 in 3M 1080 Matte Black". Data: `description` string.
- **Loading States** — Phase indicator: "Identifying vehicle…" → "Generating estimate…". Animated spinner. Data: `phase` state.
- **Draft Estimate Display** — Shows AI-generated: vehicle label, service, material + color, labor hours + cost, material cost + sq ft, total, notes. Data: `draft` object.
- **Alternative Suggestions** — AI may return multiple material alternatives. Shown as selectable options. Click to switch active draft. Data: `draft.suggestedAlternatives[]`.
- **Use This Estimate** — Button to apply AI draft to estimate wizard form. Closes modal. Data: `onUse(activeDraft)`.
- **AI Follow-up Writer (`AIFollowUpModal.jsx`)** — Generates SMS + email follow-up messages. Tone selector: Friendly, Professional, Urgent. Data: `generateFollowUp()` from `lib/ai.js`.
- **SMS Character Count** — Live count display `{n}/160`. Turns red when >160. Data: `result.sms.length`.
- **Copy to Clipboard** — Copy button for SMS and email (subject + body separately). Visual feedback: "Copied!" for 2 seconds. Data: `navigator.clipboard.writeText()`.
- **Email/SMS Tabs** — Switch between SMS and Email output formats. Email includes subject line. Data: `activeTab`.
- **DISC Personality Analysis** — `analyzeCustomerPersonality()` in `lib/personalityEngine.js`. Input: customer name, interactions, notes, emails. Output: primary/secondary DISC type (D/I/S/C), confidence level, scores, signals, traits, communication style, closing tips, follow-up cadence, warning flags. Data: `personality` object.
- **Shop Context for AI** — `buildWrapMindContext()` builds shop profile string from `localStorage` (`wm-shop-profile`). Passed to AI functions for contextual generation. Data: labor rates, shop name, services.
- **AI Rate Limiting** — Implicit via Supabase API (rate limiting handled server-side). No explicit client-side rate limiting UI detected in current components.

---

## 17. Audit Log

- **Audit Log Integration** — `AuditLogContext` provides `addLog()` used across all modules. Logs: action type, severity, actor (role + label), target, details object, timestamp. Data: `events[]` in context.
- **Severity Levels** — info, success, warning, critical. Used for visual styling in log displays.
- **Logged Actions** — LEAD_CREATED, LEAD_DELETED, LEAD_ARCHIVED, LEAD_STATUS_CHANGED, LEAD_ASSIGNED, LEADS_IMPORTED, LEAD_CONVERTED_TO_ESTIMATE, XP_AWARDED, ESTIMATE_STATUS_CHANGED, ESTIMATE_ARCHIVED, ESTIMATE_DELETED, DATA (generic).
- **Actor Tracking** — Every log entry includes actor object: `{ role: currentRole, label: ROLES[currentRole]?.label }`. Enables user-level audit trail.
- **Team Activity Widget** — Uses audit log data to show recent team actions in Dashboard. Data: `events[]` sliced to recent.
- **Lead Activity Feed** — Lead-specific activity entries logged and displayed in lead detail panel. Data: `lead.activities[]`.

---

## 18. Feedback / Beta

- **Feedback Widget** — Not found as dedicated component. Placeholder for in-app feedback mechanism.
- **Bug Reporting** — Not found as dedicated component. Placeholder for bug reporting flow.
- **Experimental Badge** — "Experimental" yellow badge on Marketing page indicating feature is in beta.

---

## 19. UI Primitives

- **Button (`Button.jsx`)** — Primary, secondary, danger, ghost variants. Sizes: sm, md, lg. Loading state with spinner. Icon support (left/right). Disabled state. `type` prop for form integration.
- **Badge** — Inline status indicators. Color-coded for severity/status. Dot + label format.
- **Card** — Container with white/dark backgrounds, border, rounded corners, shadow options. Padding variants.
- **Modal** — Overlay dialog with backdrop blur. Header with title + close button. Footer with action buttons. Max-height with scroll. Animation: `slideInRight` keyframe for right-side panels.
- **SlideOver** — Right-side panel variant of Modal. Fixed to right edge, full height. Used by: CustomerDetailPanel, LeadDetailPanel, EstimateDetailPanel, InvoiceDetailPanel, IntegrationSlideOver.
- **Input** — Text input with label, placeholder, focus ring (blue), error state, disabled state. Used throughout all forms.
- **Select** — Dropdown select with styled option groups. Used for: technician, service, status, etc.
- **Textarea** — Multi-line text input. Used for notes, descriptions, job details. Resize handle.
- **Toggle (`Toggle.jsx`)** — Binary on/off switch. Used in: Workflow page column visibility toggle.
- **Tooltip** — Hover-over tooltip with text. Used for icon-only buttons.
- **WMIcon (`WMIcon.jsx`)** — Centralized icon system. Renders named icons from a registry. Used across all modules for emoji/icon display.
- **CelebrationOverlay (`celebrate.jsx`)** — Confetti/celebration animation trigger. Used on successful estimate approval, lead conversion, payment received. Data: `celebrate()` function.
- **ErrorBoundary** — React error boundary component. Catches render errors, displays fallback UI, reports to error service.
- **DiscPersonalityCard** — See section 4 (Customers) for full feature list.
- **Spinner** — Animated loading indicator. Used in: AI generators, modals, buttons.
- **Avatar** — User/initials avatar with customizable size and background color. Used in: leaderboard, team activity, top bar.
- **LevelBadge** — Gamification level indicator. Shows level number + title in colored pill.
- **CategoryBadge** — Color-coded category label. Used in: performance page achievements.
- **XPBar** — Progress bar for XP to next level. Animated fill.
- **StatTile** — Dashboard stat display: label, value, optional subtitle, optional accent color.
- **EmptyState** — Placeholder for empty lists/tables. Icon + message + optional CTA.
- **PageHeader** — Reusable page header with title, optional subtitle, optional right-side actions.
- **CheckRow** — Checkbox row used in filter panels. Label + checkbox with onChange handler.

---

## 20. Theme / i18n

- **Dark Mode** — Full dark mode support via Tailwind `dark:` classes. All components have `dark:` equivalents. Dark backgrounds: `#0F1923` (base), `#1B2A3E` (elevated), `#243348` (borders). Data: `ThemeContext` or system preference via `prefers-color-scheme`.
- **CSS Variable System** — Custom properties: `--wm-bg-primary`, `--wm-bg-secondary`, `--wm-bg-border`, `--accent-primary` (blue `#2E8BF0`). Applied via `var()` in component styles.
- **Dark Mode Toggle** — TopBar toggle to switch between light/dark. Persists to `localStorage` (`theme` or `darkMode`).
- **Language Switching** — Not explicitly found in components. Placeholder for i18n (internationalization) system.
- **Unit Preferences** — Not explicitly found in components. Placeholder for imperial/metric unit preferences.
- **Responsive Design** — Mobile-first breakpoints. SideNav collapses to hamburger on mobile. Table columns hidden on small screens. Font sizes scale with viewport.
- **Custom Scrollbar** — Styled scrollbar on overflow containers (dark bg, thin track).

---

## 21. Global

- **Feature Flags (`FeatureFlagsContext`)** — Centralized feature gate system. Flags: `xpEnabled`, `multiLocationEnabled`, `workflowEnabled`, `marketingEnabled`, `aiEnabled`, `leadHubEnabled`. Conditionally renders nav items and dashboard widgets.
- **Toast Notifications** — In-page toast system with auto-dismiss (4s). Used for: successful actions, errors. Data: `toasts[]` array with id, type, message. Dismiss on click or timeout.
- **IOSAddToHomeScreen** — Mobile PWA prompt component. Detects iOS, shows install banner. Data: `isIOS`, `isStandalone`.
- **WelcomeScreen** — First-time onboarding overlay. Shown on initial app load. Dismissible. Data: `localStorage` (`wm-welcomed`).
- **LocalStorage Persistence** — Dashboard order, widget configs, KPI thresholds, workflow columns, integration connections, shop profile, theme preference, welcome screen state. All use `localStorage`.
- **Supabase Integration** — Backend via Supabase (`@supabase/supabase-js`). Project ID: `nbewyeoiizlsfmbqoist`. Auth, database, realtime subscriptions (noted as not yet implemented in Lead Hub).
- **Apollo Client** — GraphQL client for some data operations (customers, leads). `apolloClient` instance in `lib/`.
- **Context Architecture** — 12+ React contexts: Auth, Roles, FeatureFlags, Theme, Notifications, Customers, Leads, Estimates, Invoices, Scheduling, Marketing, Gamification, AuditLog. All provide state + dispatch functions.
- **Environment Variables** — `VITE_DEV_AUTH`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for configuration.
- **Print Styling** — `window.print()` in estimate and invoice detail panels. Print-specific CSS via `@media print`.

---

*End of Feature Inventory — 21 modules, ~250+ discrete features.*
