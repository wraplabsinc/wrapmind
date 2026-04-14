# Phase 2: Route-by-Route Testing Log

Per [PRD-79](../PRD-79-api-bare-essentials-test.md)

## How to Test

```bash
# Kill any existing server
kill $(lsof -t -i:3001) 2>/dev/null

# Start the server
npm start &> /tmp/wrapos-startup.log &

# Test endpoints
curl http://localhost:3001/<route>

# Kill when done
kill $(lsof -t -i:3001) 2>/dev/null
```

---

## Route Test Log

### Phase 1 — Baseline ✅
**Status:** COMPLETE
- Server starts cleanly with all routes commented out
- `GET /` → `{"status":"ok","service":"WrapIQ API","version":"6.0.0"}`
- `GET /api/health` → `{"status":"ok","timestamp":"...","version":"6.0.0"}`
- No startup errors, no port conflicts (after killing stray process on 3001)

---

### Route 1: `/film`
**Enable:** Uncomment `router.use('/film', require('./film'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/film
curl http://localhost:3001/api/film/calculate
```
**Expected:** JSON response from film calculator
**Notes:**

---

### Route 2: `/vin`
**Enable:** Uncomment `router.use('/', require('./vin'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/vin/<VALID_VIN>
curl http://localhost:3001/api/vin/decode
```
**Expected:** VIN decode response
**Notes:**

---

### Route 3: `/estimates`
**Enable:** Uncomment `router.use('/estimates', require('./estimates'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/estimates
curl http://localhost:3001/api/estimates/:id
```
**Expected:** Estimate CRUD responses
**Notes:**

---

### Route 4: `/clients`
**Enable:** Uncomment `router.use('/clients', require('./clients'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/clients
curl http://localhost:3001/api/clients/:id
```
**Expected:** Client management responses
**Notes:**

---

### Route 5: `/settings`
**Enable:** Uncomment `router.use('/settings', require('./settings'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/settings
```
**Expected:** Settings response
**Notes:**

---

### Route 6: `/intake`
**Enable:** Uncomment `router.use('/intake', require('./intake'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/intake
```
**Expected:** Vehicle intake form response
**Notes:**

---

### Route 7: `/upsells`
**Enable:** Uncomment `router.use('/upsells', require('./upsells'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/upsells
```
**Expected:** Upsell logic response
**Notes:**

---

### Route 8: `/search`
**Enable:** Uncomment `router.use('/search', require('./search'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/search?q=test
```
**Expected:** Full-text search response
**Notes:**

---

### Route 9: `/export`
**Enable:** Uncomment `router.use('/export', require('./export'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/export/estimate/:id
```
**Expected:** PDF/CSV export response
**Notes:**

---

### Route 10: `/auth`
**Enable:** Uncomment `router.use('/auth', require('./auth'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/auth/login
curl http://localhost:3001/api/auth/me
```
**Expected:** Auth responses (JWT)
**Notes:**

---

### Route 11: `/vision`
**Enable:** Uncomment `router.use('/vision', require('./vision'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/vision
```
**Expected:** AI vision analysis response
**Notes:**

---

### Route 12: `/ai`
**Enable:** Uncomment `router.use('/ai', require('./ai'));`
**Status:** PENDING
**Test commands:**
```bash
curl http://localhost:3001/api/ai/generate
```
**Expected:** AI estimate generation response
**Notes:**

---

## Summary

| # | Route | Status | Notes |
|---|-------|--------|-------|
| 1 | `/film` | PENDING | |
| 2 | `/vin` | PENDING | |
| 3 | `/estimates` | PENDING | |
| 4 | `/clients` | PENDING | |
| 5 | `/settings` | PENDING | |
| 6 | `/intake` | PENDING | |
| 7 | `/upsells` | PENDING | |
| 8 | `/search` | PENDING | |
| 9 | `/export` | PENDING | |
| 10 | `/auth` | PENDING | |
| 11 | `/vision` | PENDING | |
| 12 | `/ai` | PENDING | |

✅ = Working  |  ⚠️ = Works with issues  |  ❌ = Broken  |  ⏳ = Not yet tested
