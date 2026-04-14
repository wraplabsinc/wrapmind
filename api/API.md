# WrapIQ API Documentation

Base URL: `http://localhost:3001/api` (dev) | `https://api.wrapiq.com/api` (prod)

All routes return JSON. All authenticated routes require `Authorization: Bearer <jwt>`.

---

## Authentication

### POST /api/auth/login

Login with email + password. Returns JWT session token.

**Request:**
```json
{
  "email": "user@wraplabs.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@wraplabs.com",
    "first_name": "Tim",
    "last_name": "Steuer",
    "role": "owner",
    "org_id": "uuid"
  }
}
```

**Response (401):**
```json
{ "error": "Invalid email or password" }
```

---

### POST /api/auth/logout

Invalidate current session.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

### GET /api/auth/me

Return current authenticated user + role.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@wraplabs.com",
  "first_name": "Tim",
  "last_name": "Steuer",
  "role": "owner",
  "org_id": "uuid",
  "is_active": true,
  "last_login_at": "2026-03-08T14:30:00Z"
}
```

---

## Estimates

### GET /api/estimates

List estimates with pagination and filtering.

**Headers:** `Authorization: Bearer <jwt>`

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Per page |
| status | string | - | Filter: draft, sent, approved, booked, archived |
| client_id | uuid | - | Filter by client |
| created_by | uuid | - | Filter by service writer |
| date_from | date | - | Filter from date |
| date_to | date | - | Filter to date |
| sort | string | created_at | Sort field |
| order | string | desc | asc or desc |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "estimate_id": "WL-2026-0308-0047",
      "version": 1,
      "client_id": "uuid",
      "vehicle_json": { "year": 2024, "make": "Porsche", "model": "911 Carrera S", "color": "GT Silver", "complexity_tier": "B" },
      "services_json": ["Full Color Change Wrap", "Ceramic Coating"],
      "status": "draft",
      "subtotal": 8500.00,
      "tax": 616.25,
      "total": 9116.25,
      "deposit_amount": 4558.13,
      "confidence_score": 82.00,
      "confidence_tier": "high",
      "created_at": "2026-03-08T14:30:00Z",
      "updated_at": "2026-03-08T14:30:00Z",
      "created_by": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 147,
    "total_pages": 8
  }
}
```

---

### GET /api/estimates/:id

Get single estimate with all JSON fields.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "id": "uuid",
  "estimate_id": "WL-2026-0308-0047",
  "version": 1,
  "client_id": "uuid",
  "client": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+18055551234",
    "email": "john@example.com"
  },
  "vehicle_json": {
    "year": 2024,
    "make": "Porsche",
    "model": "911 Carrera S",
    "color": "GT Silver",
    "size_class": "sportsCoupe",
    "vin": "WP0AA2A9XPS123456",
    "complexity_tier": "B"
  },
  "services_json": [
    { "name": "Full Color Change Wrap", "film": "Inozetek DOD200", "color": "Dodge Destroyer" },
    { "name": "Ceramic Coating", "layers": 2 }
  ],
  "details_json": {
    "complexity_flags": ["door_jambs", "rush"],
    "timeline": "5-7 days",
    "referral_source": "instagram",
    "notes": "Client wants matte finish"
  },
  "vision_json": {
    "year_make_model": "2024 Porsche 911 Carrera S",
    "base_color": "GT Silver Metallic",
    "paint_condition": "excellent",
    "chrome_level": "minimal",
    "chrome_inventory": ["door handles", "window trim"],
    "existing_film": false,
    "vehicle_dirty": false,
    "confidence_modifiers": {
      "photo_quality": "high",
      "vehicle_identifiable": true,
      "chrome_complexity": "low",
      "existing_film_detected": false,
      "paint_condition_clear": true
    }
  },
  "line_items_json": [
    { "service": "Full Color Change Wrap", "type": "labor", "labor_hours": 40, "labor_rate": 125, "labor_cost": 5000, "total": 5000 },
    { "service": "Inozetek DOD200 Film", "type": "material", "material_cost": 2800, "total": 2800 },
    { "service": "Ceramic Coating (2-layer)", "type": "labor", "labor_hours": 8, "labor_rate": 125, "labor_cost": 1000, "total": 1000 },
    { "service": "Shop Supplies", "type": "fee", "amount": 300, "total": 300 },
    { "service": "Referral Discount", "type": "discount", "amount": 500, "total": -500 }
  ],
  "subtotal": 8600.00,
  "tax": 224.00,
  "total": 8824.00,
  "deposit_amount": 4412.00,
  "status": "draft",
  "shopmonkey_order_id": null,
  "shopmonkey_order_url": null,
  "signature_data": null,
  "approved_at": null,
  "expires_at": "2026-03-22T14:30:00Z",
  "created_at": "2026-03-08T14:30:00Z",
  "updated_at": "2026-03-08T14:30:00Z",
  "created_by": "uuid",
  "confidence_score": 82.00,
  "confidence_tier": "high",
  "confidence_factors_json": [
    { "name": "Photo quality", "score": 25, "maxScore": 25, "level": "high" },
    { "name": "Vehicle identifiable", "score": 20, "maxScore": 20, "level": "confirmed" },
    { "name": "Chrome complexity", "score": 15, "maxScore": 20, "level": "low" },
    { "name": "Existing film", "score": 15, "maxScore": 15, "level": "none" },
    { "name": "Paint condition clear", "score": 10, "maxScore": 10, "level": "clear" },
    { "name": "Service scope completeness", "score": 10, "maxScore": 10, "level": "complete" }
  ]
}
```

---

### POST /api/estimates/generate

Generate estimate via Claude AI. Requires vehicle, services, and optional details + vision input.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "vehicle": {
    "year": 2024,
    "make": "Porsche",
    "model": "911 Carrera S",
    "color": "GT Silver",
    "size_class": "sportsCoupe",
    "complexity_tier": "B"
  },
  "services": [
    { "name": "Full Color Change Wrap", "film": "Inozetek DOD200" },
    { "name": "Ceramic Coating" }
  ],
  "details": {
    "complexity_flags": ["door_jambs"],
    "timeline": "rush",
    "referral_source": "instagram",
    "notes": "Client wants matte finish"
  },
  "vision_report": {
    "paint_condition": "excellent",
    "chrome_level": "minimal",
    "existing_film": false,
    "vehicle_dirty": false
  }
}
```

**Response (200):**
```json
{
  "estimate": {
    "line_items": [...],
    "subtotal": 8600.00,
    "tax": 224.00,
    "total": 8824.00,
    "deposit_amount": 4412.00,
    "timeline_estimate": { "min_days": 5, "max_days": 7, "notes": "Rush job - 20% labor surcharge applied" },
    "upsell_suggestions": [
      { "service": "Window Tint", "reason": "Pairs well with color change", "estimated_value": 450 },
      { "service": "Blackout Package", "reason": "Chrome delete on door handles and trim", "estimated_value": 1200 }
    ],
    "technician_notes": "Sport package body kit adds complexity. Door jambs require door removal - quote separately."
  },
  "confidence_score": 82.00,
  "confidence_tier": "high",
  "confidence_factors": [...]
}
```

**Response (429):**
```json
{
  "error": "AI generation rate limit exceeded. Max 60 requests per hour.",
  "retryAfter": 3600
}
```

---

### POST /api/estimates

Save estimate to database. Auto-assigns estimate_id.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "client_id": "uuid",
  "vehicle_json": { "year": 2024, "make": "Porsche", "model": "911 Carrera S", "color": "GT Silver", "complexity_tier": "B" },
  "services_json": [{ "name": "Full Color Change Wrap" }],
  "details_json": { "timeline": "5-7 days", "referral_source": "instagram" },
  "line_items_json": [...],
  "subtotal": 8600.00,
  "tax": 224.00,
  "total": 8824.00,
  "deposit_amount": 4412.00,
  "confidence_score": 82.00,
  "confidence_tier": "high",
  "confidence_factors_json": [...]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "estimate_id": "WL-2026-0308-0047",
  "version": 1,
  "status": "draft",
  "total": 8824.00,
  "created_at": "2026-03-08T14:30:00Z"
}
```

---

### PATCH /api/estimates/:id

Update estimate fields (status, notes, signature, etc).

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "status": "sent",
  "details_json": { "notes": "Updated after client call" }
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "estimate_id": "WL-2026-0308-0047",
  "status": "sent",
  "updated_at": "2026-03-08T15:00:00Z"
}
```

---

### DELETE /api/estimates/:id

Soft delete (archive) an estimate.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{ "message": "Estimate archived", "estimate_id": "WL-2026-0308-0047" }
```

---

### POST /api/estimates/:id/push-shopmonkey

Push estimate to Shopmonkey as order. Executes 5-step chain: customer lookup/create → create order → add line items → apply discount → return SM URL.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "success": true,
  "orderId": "sm-order-uuid",
  "orderUrl": "https://app.shopmonkey.io/orders/sm-order-uuid",
  "steps": [
    { "step": 1, "action": "customer_lookup", "status": "found_existing", "customerId": "sm-cust-uuid" },
    { "step": 2, "action": "create_order", "status": "success", "orderId": "sm-order-uuid" },
    { "step": 3, "action": "add_line_items", "status": "success", "count": 5 },
    { "step": 4, "action": "apply_discount", "status": "success" },
    { "step": 5, "action": "complete", "status": "success", "orderUrl": "https://app.shopmonkey.io/orders/sm-order-uuid" }
  ]
}
```

**Response (200) - Failure with rollback:**
```json
{
  "success": false,
  "error": "Failed to add line items: invalid labor rate",
  "steps": [
    { "step": 1, "action": "customer_lookup", "status": "created_new", "customerId": "sm-cust-uuid" },
    { "step": 2, "action": "create_order", "status": "success", "orderId": "sm-order-uuid" },
    { "step": 3, "action": "add_line_items", "status": "failed", "error": "invalid labor rate" },
    { "step": "rollback", "action": "delete_order", "status": "success" }
  ]
}
```

---

### GET /api/estimates/:id/pdf

Generate client-facing PDF estimate. Returns file stream.

**Headers:** `Authorization: Bearer <jwt>`

**Response:** `application/pdf` binary stream

---

### POST /api/estimates/:id/approve

Client digital approval. No auth required — token-based, time-limited.

**Request:**
```json
{
  "token": "uuid-estimate-view-token",
  "signature_data": "base64-signature-pad-data"
}
```

**Response (200):**
```json
{
  "message": "Estimate approved",
  "estimate_id": "WL-2026-0308-0047",
  "approved_at": "2026-03-08T16:00:00Z",
  "deposit_amount": 4412.00
}
```

**Response (400):**
```json
{ "error": "Invalid or expired approval token" }
```

---

### GET /api/estimates/:id/notes

Get internal notes thread for an estimate.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "notes": [
    {
      "id": "uuid",
      "estimate_id": "uuid",
      "body": "Client called to confirm timeline — wants drop-off Monday",
      "author": "Tim Steuer",
      "created_at": "2026-03-08T14:35:00Z"
    },
    {
      "id": "uuid",
      "estimate_id": "uuid",
      "body": "System: Estimate status changed from draft to sent",
      "author": "system",
      "created_at": "2026-03-08T15:00:00Z"
    }
  ]
}
```

---

### POST /api/estimates/:id/notes

Add internal note to estimate.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{ "body": "Client approved via phone — sending signature link" }
```

**Response (201):**
```json
{
  "id": "uuid",
  "body": "Client approved via phone — sending signature link",
  "author": "Tim Steuer",
  "created_at": "2026-03-08T16:00:00Z"
}
```

---

## Clients

### GET /api/clients

Search and list clients.

**Headers:** `Authorization: Bearer <jwt>`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search by name, phone, email |
| page | int | Page number |
| limit | int | Per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+18055551234",
      "email": "john@example.com",
      "preferred_contact": "text",
      "referral_source": "instagram",
      "is_vip": false,
      "total_jobs": 2,
      "lifetime_value": 12500.00,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "total_pages": 3 }
}
```

---

### POST /api/clients

Create client with dedup check (phone/email).

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+18055559876",
  "email": "jane@example.com",
  "preferred_contact": "email",
  "referral_source": "referral",
  "referred_by": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+18055559876",
  "email": "jane@example.com",
  "is_vip": false,
  "total_jobs": 0,
  "lifetime_value": 0,
  "created_at": "2026-03-08T14:30:00Z"
}
```

**Response (409) - Duplicate:**
```json
{
  "error": "Client already exists",
  "existing_client": { "id": "uuid", "first_name": "Jane", "last_name": "Smith", "phone": "+18055559876" }
}
```

---

### GET /api/clients/:id

Get single client with job history and lifetime value.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+18055551234",
  "email": "john@example.com",
  "preferred_contact": "text",
  "referral_source": "instagram",
  "is_vip": true,
  "internal_notes": "Prefers dark colors, always pays cash",
  "total_jobs": 3,
  "lifetime_value": 18500.00,
  "estimates": [
    { "estimate_id": "WL-2026-0308-0047", "vehicle": "2024 Porsche 911", "total": 8824.00, "status": "approved", "created_at": "2026-03-08T14:30:00Z" }
  ],
  "created_at": "2026-01-15T10:00:00Z"
}
```

---

### PATCH /api/clients/:id

Update client.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "phone": "+18055551234",
  "internal_notes": "Updated: VIP client, prefers weekend drop-off"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+18055551234",
  "internal_notes": "Updated: VIP client, prefers weekend drop-off",
  "updated_at": "2026-03-08T15:00:00Z"
}
```

---

## Settings

### GET /api/settings

Get all shop settings.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "id": "uuid",
  "shop_name": "Wrap Labs",
  "address": "123 Auto Center Dr, Westlake Village, CA 91362",
  "phone": "805-338-8443",
  "email": "hello@wraplabs.com",
  "labor_rate_general": 125.00,
  "labor_rate_ppf": 195.00,
  "shop_supplies_pct": 5.00,
  "cc_fee_pct": 3.50,
  "tax_rate": 7.25,
  "deposit_pct": 50.00,
  "quote_expiry_days": 14,
  "rush_multiplier": 1.20,
  "estimate_id_prefix": "WL",
  "film_prefs_json": [
    { "sku_id": "ino-dod200", "brand": "Inozetek", "product_name": "DOD200 Destroyer", "category": "vinyl", "finish": "gloss", "roll_width_inches": 60, "cost_per_yard": 58.00, "active": true }
  ],
  "payment_links_json": { "zelle": "hello@wraplabs.com", "stripe": "https://pay.wrapiq.com/wraplabs" },
  "costs_json": { "caliper_standard": 600, "wheel_under20": 400, "wheel_over20": 500, "ceramic_per_application": 150, "dirty_vehicle_surcharge": 150, "referral_discount": 500 },
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-03-08T10:00:00Z"
}
```

---

### PATCH /api/settings

Update shop settings.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "labor_rate_general": 130.00,
  "tax_rate": 7.50
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "labor_rate_general": 130.00,
  "tax_rate": 7.50,
  "updated_at": "2026-03-08T15:00:00Z"
}
```

---

### POST /api/settings/sync-shopmonkey

Pull labor rates, users, statuses, and tax from Shopmonkey.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "success": true,
  "synced": {
    "labor_rates": 4,
    "users": 6,
    "workflow_statuses": 8,
    "shop_info": true
  },
  "mappings": [
    { "sm_rate_id": "lr-001", "sm_rate_name": "General Labor", "mapped_to": "labor_rate_general", "rate": 125.00 },
    { "sm_rate_id": "lr-002", "sm_rate_name": "PPF Install", "mapped_to": "labor_rate_ppf", "rate": 195.00 }
  ]
}
```

---

## Film Calculator

### POST /api/film/calculate

Calculate linear feet, waste, rolls needed, and cost for vehicle wrap.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "vehicle_class": "sportsCoupe",
  "services": [
    { "name": "Full Color Change Wrap", "door_jambs": true, "blackout": true, "blackout_parts": ["front_grille", "window_surrounds", "door_handles"] }
  ]
}
```

**Response (200):**
```json
{
  "vehicle_class": "sportsCoupe",
  "base_raw_footage": 46.0,
  "base_waste_pct": 15,
  "base_order_footage": 52.9,
  "addons": [
    { "item": "Door jambs", "footage": 10 },
    { "item": "Blackout: front grille", "footage": 2.3 },
    { "item": "Blackout: window surrounds", "footage": 4.6 },
    { "item": "Blackout: door handles", "footage": 1.15 }
  ],
  "total_raw_footage": 64.05,
  "total_order_footage": 73.66,
  "linear_feet": 73.66,
  "linear_yards": 24.55,
  "yards_to_order": 25,
  "film_options": [
    { "sku_id": "ino-dod200", "brand": "Inozetek", "product_name": "DOD200 Destroyer", "roll_width": 60, "cost_per_yard": 58.00, "total_material_cost": 1450.00 }
  ]
}
```

---

### GET /api/film/supplier-sheet/:id

Generate formatted supplier order sheet.

**Headers:** `Authorization: Bearer <jwt>`

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| format | string | text | text or pdf |

**Response (200) — text/plain:**
```
SUPPLIER ORDER SHEET
====================
Vehicle: 2024 Porsche 911 Carrera S (GT Silver)
Estimate: WL-2026-0308-0047

FILM ORDER
----------
Supplier: Inozetek USA
Product: DOD200 Dodge Destroyer
Roll Width: 60"
Yards Ordered: 25
Vendor Cost: $1,450.00
Client Price: $3,222.22
Gross Margin: 55%

PER-PART BREAKDOWN
------------------
Hood: 65" x 58" + 3" bleed → 71" x 64" (bulk install)
Roof: 58" x 48" + 2" bleed → 62" x 52" (bulk install)
Door Jambs: +10 ft
Blackout - Front Grille: 2.3 ft (wrap only - rock chip zone)
Blackout - Window Surrounds: 4.6 ft
Blackout - Door Handles: 1.15 ft

TOTAL: 25 yards @ $58/yd = $1,450.00
```

---

## Vision Analysis

### POST /api/vision/analyze

Upload vehicle photos → Claude vision analysis. Up to 8 images.

**Headers:** `Authorization: Bearer <jwt>`
**Content-Type:** `multipart/form-data`

**Request:**
```
files: [photo1.jpg, photo2.jpg, ...] (up to 8)
```

**Response (200):**
```json
{
  "year_make_model": "2024 Porsche 911 Carrera S",
  "base_color": "GT Silver Metallic",
  "paint_condition": "excellent",
  "chrome_level": "minimal",
  "chrome_inventory": ["door handles", "window trim"],
  "blackout_candidates": ["door handles", "window trim"],
  "existing_film": false,
  "existing_film_notes": "",
  "wheel_condition": "clean",
  "vehicle_dirty": false,
  "ppf_recommendation": "Full front clip PPF recommended for rock chip protection",
  "technician_notes": "Sport package body kit visible. Paint in excellent condition. No existing film detected.",
  "confidence_modifiers": {
    "photo_quality": "high",
    "vehicle_identifiable": true,
    "chrome_complexity": "low",
    "existing_film_detected": false,
    "paint_condition_clear": true
  }
}
```

---

## AI Generation

### POST /api/ai/generate-estimate

Generate full estimate from prompt + vision output. Rate limited to 60/hr.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "shop_settings": { ... },
  "vehicle": { ... },
  "services": [ ... ],
  "details": { ... },
  "vision_report": { ... }
}
```

**Response (200):** Same as `POST /api/estimates/generate`

---

## VIN / Plate Decode

### GET /api/vin/:vin

Decode VIN via NHTSA API.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "vin": "WP0AA2A9XPS123456",
  "year": 2024,
  "make": "Porsche",
  "model": "911",
  "trim": "Carrera S",
  "body_style": "Coupe",
  "engine": "3.0L H6 Twin Turbo",
  "drive": "RWD",
  "plant_country": "Germany",
  "verified": true
}
```

**Response (400):**
```json
{ "error": "Invalid VIN format" }
```

---

### GET /api/plate/:state/:plate

Decode license plate. Silent fallback to manual entry.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "state": "CA",
  "plate": "8ABC123",
  "year": 2024,
  "make": "Porsche",
  "model": "911",
  "color": "Silver",
  "source": "dmv_lookup"
}
```

**Response (200) - Fallback:**
```json
{
  "state": "CA",
  "plate": "8ABC123",
  "error": "Plate lookup unavailable for this state",
  "fallback": true,
  "message": "Enter vehicle details manually"
}
```

---

## Intake Leads

### POST /api/intake

Public intake form submission. No auth required. Rate limited to 5/hr per IP.

**Request:**
```json
{
  "first_name": "Mike",
  "last_name": "Johnson",
  "phone": "+18055554321",
  "email": "mike@example.com",
  "year": 2024,
  "make": "BMW",
  "model": "M4",
  "services_requested": ["Full Color Change Wrap", "Window Tint"],
  "notes": "Saw you on Instagram, want a full wrap",
  "photos": ["base64-image-data-1", "base64-image-data-2"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "status": "new",
  "first_name": "Mike",
  "last_name": "Johnson",
  "vehicle": "2024 BMW M4",
  "services_requested": ["Full Color Change Wrap", "Window Tint"],
  "created_at": "2026-03-08T14:30:00Z"
}
```

**Response (429):**
```json
{
  "error": "Too many submissions. Please try again later.",
  "retryAfter": 3600
}
```

---

### GET /api/leads

List intake leads with status filter.

**Headers:** `Authorization: Bearer <jwt>`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: new, contacted, converted, dismissed |
| page | int | Page number |
| limit | int | Per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Mike",
      "last_name": "Johnson",
      "phone": "+18055554321",
      "email": "mike@example.com",
      "year": 2024,
      "make": "BMW",
      "model": "M4",
      "services_requested": ["Full Color Change Wrap", "Window Tint"],
      "status": "new",
      "intake_channel": "form",
      "created_at": "2026-03-08T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 23, "total_pages": 2 }
}
```

---

### GET /api/leads/:id

Get single lead detail.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "Mike",
  "last_name": "Johnson",
  "phone": "+18055554321",
  "email": "mike@example.com",
  "year": 2024,
  "make": "BMW",
  "model": "M4",
  "services_requested": ["Full Color Change Wrap", "Window Tint"],
  "notes": "Saw you on Instagram, want a full wrap",
  "status": "new",
  "intake_channel": "form",
  "photos": ["https://signed-url-1", "https://signed-url-2"],
  "created_at": "2026-03-08T14:30:00Z"
}
```

---

### POST /api/leads/:id/convert

Convert lead to estimate — opens estimate wizard pre-filled.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "message": "Lead converted to estimate",
  "estimate_id": "WL-2026-0308-0048",
  "client_id": "uuid",
  "prefill_data": {
    "vehicle": { "year": 2024, "make": "BMW", "model": "M4" },
    "services": ["Full Color Change Wrap", "Window Tint"]
  }
}
```

---

### PATCH /api/leads/:id/status

Update lead status.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{ "status": "contacted" }
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "contacted",
  "updated_at": "2026-03-08T15:00:00Z"
}
```

---

## Upsells

### GET /api/upsells/analytics

Aggregate upsell conversion statistics.

**Headers:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{
  "total_suggested": 245,
  "total_presented": 180,
  "total_accepted": 67,
  "overall_acceptance_rate": 37.22,
  "by_service": [
    {
      "service": "Ceramic Coating",
      "suggested": 85,
      "presented": 72,
      "accepted": 31,
      "acceptance_rate": 43.06,
      "total_upsell_value": 24800.00
    },
    {
      "service": "Window Tint",
      "suggested": 62,
      "presented": 50,
      "accepted": 22,
      "acceptance_rate": 44.00,
      "total_upsell_value": 9900.00
    },
    {
      "service": "Blackout Package",
      "suggested": 48,
      "presented": 35,
      "accepted": 10,
      "acceptance_rate": 28.57,
      "total_upsell_value": 12000.00
    }
  ]
}
```

---

### PATCH /api/upsells/:id

Toggle presented/accepted status.

**Headers:** `Authorization: Bearer <jwt>`

**Request:**
```json
{
  "presented_to_client": true,
  "accepted_by_client": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "service": "Ceramic Coating",
  "presented_to_client": true,
  "accepted_by_client": true,
  "upsell_value": 800.00
}
```

---

## Search

### GET /api/search

Global search across estimates, clients, vehicles, leads. <200ms via Postgres GIN indexes.

**Headers:** `Authorization: Bearer <jwt>`

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Search query (min 2 chars) |

**Response (200):**
```json
{
  "query": "porsche",
  "results": {
    "estimates": [
      { "id": "uuid", "estimate_id": "WL-2026-0308-0047", "vehicle": "2024 Porsche 911 Carrera S", "status": "draft", "total": 8824.00 }
    ],
    "clients": [],
    "leads": [
      { "id": "uuid", "name": "Mike Johnson", "vehicle": "2024 Porsche Cayenne", "status": "new" }
    ]
  },
  "total_results": 2,
  "elapsed_ms": 45
}
```

---

## Export

### GET /api/export/estimates

Export estimates as CSV or JSON. Owner role required.

**Headers:** `Authorization: Bearer <jwt>` (owner role)

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| format | string | csv | csv or json |
| date_from | date | - | Filter from date |
| date_to | date | - | Filter to date |
| status | string | - | Filter by status |

**Response (200) - CSV:**
```
Content-Type: text/csv; charset=utf-8 with BOM
Content-Disposition: attachment; filename="wrapiq_estimates_2026-03-08.csv"

estimate_id,client_name,vehicle,status,total,deposit,created_at
WL-2026-0308-0047,John Doe,2024 Porsche 911,approved,8824.00,4412.00,2026-03-08T14:30:00Z
```

**Response (200) - JSON:**
```json
[
  {
    "estimate_id": "WL-2026-0308-0047",
    "client_name": "John Doe",
    "vehicle": "2024 Porsche 911 Carrera S",
    "status": "approved",
    "total": 8824.00,
    "deposit_amount": 4412.00,
    "created_at": "2026-03-03-08T14:30:00Z"
  }
]
```

**Response (403):**
```json
{ "error": "Owner access required" }
```

---

## Health Check

### GET /api/health

Server health check. No auth required.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-08T14:30:00Z",
  "version": "6.0.0"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation failed or malformed input |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — insufficient role/permissions |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate resource (e.g., client already exists) |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error — unexpected failure |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| AI generation (`/estimates/generate`, `/ai/generate-estimate`) | 60 requests | 1 hour per session |
| Intake form (`/intake`) | 5 submissions | 1 hour per IP |
| All other endpoints | 100 requests | 15 minutes per IP |

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1709920800
```

---

## Authentication Flow

1. **Login:** `POST /api/auth/login` → receive JWT token
2. **Store token:** Save in localStorage / secure cookie
3. **Include in requests:** `Authorization: Bearer <token>` header
4. **Token expiry:** 24 hours (configurable in `config.jwt.expiresIn`)
5. **Refresh:** Re-login when token expires

### Role Permissions

| Resource | Owner | Manager | Writer |
|----------|-------|---------|--------|
| Estimates (CRUD) | ✅ | ✅ | ✅ |
| Estimates (generate) | ✅ | ✅ | ✅ |
| Estimates (push to SM) | ✅ | ✅ | ✅ |
| Estimates (export) | ✅ | ❌ | ❌ |
| Clients (CRUD) | ✅ | ✅ | ✅ |
| Settings (read) | ✅ | ✅ | ✅ |
| Settings (write) | ✅ | ✅ | ❌ |
| Settings (SM sync) | ✅ | ✅ | ❌ |
| Leads (read) | ✅ | ✅ | ✅ |
| Leads (convert) | ✅ | ✅ | ✅ |
| Upsell analytics | ✅ | ✅ | ✅ |
| Users (manage) | ✅ | ❌ | ❌ |

---

## Business Rules (Enforced Server-Side)

| Rule | Enforcement |
|------|-------------|
| Black vehicle + blackout | Mandatory 3M 2080 High Gloss (not 1080) |
| Chrome wrap floor | $8,500 minimum — no exceptions |
| Fresh paint → PPF | 3-4 week delay flagged |
| Dirty vehicle | Auto-add $150 surcharge when `vehicle_dirty: true` |
| Referral discount | $500 flat when referral source selected |
| Tax | Applied to parts/materials only, never labor |
| Shop supplies | 5% of labor subtotal (configurable) |
| CC fee | 3.5% of total (configurable, disclosed before charging) |
| Deposit | 50% of total (configurable), non-refundable |
| Door jambs | Always separate line item, never included in standard quote |
| Customer-supplied film | Never permitted — rejected at validation |
| Front-facing chrome | Wrap/PPF only — never paint (rock chip warranty) |
