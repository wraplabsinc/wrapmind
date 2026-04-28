# PRD: Image-Based Vehicle Workflows (VIN Decoder + Vehicle Image Analysis)

**Status:** Draft — Scope Definition  
**Parent:** Retired AI/OpenRouter feature set (issues #61, #63, #77, #89)  
**Date:** April 25, 2026  

---

## 1. Overview

Narrow the AI scope from general-purpose chat/text generation to **two focused image/vehicle-data features only**:

1. **VIN Decoder** — As-is, production-deployed (`vin-decoder` Edge Function). Combines NHTSA API + local Postgres persistence.
2. **Vehicle Image Analysis** — Use `ai-vision-analyze` Edge Function (currently calls Anthropic Claude Sonnet) to identify make/model/year from a customer-uploaded vehicle photo, then auto-populate the VIN search form.

No OpenRouter. No generic AI chat. No estimate generation. No follow-up writer. No personality analysis.

---

## 2. In-Scope Features

| Feature | Current State | Notes |
|---------|---------------|-------|
| VIN Decoder | ✅ Deployed & wired | `supabase/functions/vin-decoder` — NHTSA fallback + DB persist |
| Vehicle-by-Image | ⚠️ Needs API key | `supabase/functions/ai-vision-analyze` exists, requires `OPENROUTER_API_KEY (already set)` and image upload UI |

---

## 3. Non-Goals (Out of Scope)

- ❌ OpenRouter integration or any chat/text-generation AI
- ❌ AI estimate generation
- ❌ AI follow-up writer
- ❌ AI DISC/personality analysis
- ❌ Generic AI assistant or agent workflow
- ❌ Settings Integrations (#74) — Slack/ShopMonkey/Carfax/Stripe — deferred to separate epic

---

## 4. Technical Requirements

### 4.1 `ai-vision-analyze` Edge Function

- **Runtime:** Deno (Supabase Edge Function)
- **Model:** OpenRouter vision-capable model (e.g. `openai/gpt-4o`)
- **Input:** `multipart/form-data` with image file, or JSON with imageDataUrl (base64)
- **Output:** `{ success: true, vehicle: { make, model, year, confidence } }`
- **Auth:** JWT required (userId derived from token; optionally log to `ai_usage_ledger` if retained)
- **Circuit breaker:** optional (can be removed; low-volume feature)

### 4.2 Frontend Integration (`VinSearch.jsx` → `VehicleByImage.jsx`)

- Image upload/drag-drop → convert to base64 → call `ai-vision-analyze`
- On success, fill VIN search form with detected make/model/year (not VIN; vision gives visual ID only)
- Fallback: if API key not set or analysis fails, show manual VIN entry as alternate path

### 4.3 Secrets Required

| Key | Source | Purpose |
|-----|--------|---------|
| `OPENROUTER_API_KEY (already set)` | User-provided (env) | Claude Sonnet 4 calls |
| (Optional) `ENABLE_AI_VISION` | `true`/`false` | Feature flag — default true if key present |

---

## 5. Implementation Checklist

- [ ] User provides `OPENROUTER_API_KEY (already set)` → set as Supabase secret
- [ ] Verify `ai-vision-analyze` EF is deployed (already deployed per triage)
- [ ] Test `ai-vision-analyze` directly via `supabase functions invoke ai-vision-analyze`
- [ ] Wire `VehicleByImage.jsx` to:
  - Read image file from `<input type="file">` or drag-drop
  - Send to `supabase.functions.invoke('ai-vision-analyze', { body: { image: base64 } })`
  - On return, populate make/model/year fields in `VinSearch.jsx` parent via `onSelect(vehicle)`
- [ ] Handle edge cases: no API key, API error, low confidence, multiple matches
- [ ] Add loading state + error toast
- [ ] (Optional) Log usage to `ai_usage_ledger` only if table exists (progressive enhancement)

---

## 6. Acceptance Criteria

- User can upload a vehicle photo → analysis completes → form fields pre-filled with detected make/model/year
- If `OPENROUTER_API_KEY (already set)` not set, UI degrades gracefully: hide image tab or show "Contact admin to enable"
- No other AI features are accessible or referenced in UI (chat/text/estimate/follow-up flows disabled/removed)

---

## 7. Open Questions

- Q: Should `ai-vision-analyze` be retained or replaced with a simpler direct Anthropic API call from client?  
  A: Keep Edge Function for key isolation + future circuit breaker, but can be simplified.
- Q: Usage tracking needed? Cost control?  
  A: Not critical — low-volume feature. Can be added later.
- Q: What if Claude returns multiple candidate vehicles?  
  A: Show top-3 matches in UI; let user pick.

---

## 8. Related Issues

- #87 (VIN Decoder integration) — already closed ✅
- #61 (Vehicles) — retired 🚫

---

## 9. Next Steps

1. Provide `OPENROUTER_API_KEY (already set)` so we can enable `ai-vision-analyze`
2. Verify EF invocation end-to-end
3. Wire `VehicleByImage.jsx` to call EF
4. QA with real vehicle photos

