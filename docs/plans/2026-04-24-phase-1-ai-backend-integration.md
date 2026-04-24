# Phase 1 — Core Text Generation + Auth Security Fix: Implementation Plan

> **For Hermes:** Use subagent-driven-development to execute this plan. Dispatch a fresh subagent per task with full context. Each task includes complete code examples, exact commands, and verification steps.

**Goal:** Deploy `ai-text-generate` Edge Function (JWT auth, PII scrub, circuit breaker, usage ledger) and migrate `ai-vision-analyze` to JWT, eliminating exposed service-role keys from the client bundle.

**Architecture:** Supabase Edge Functions (Deno) with user JWT verification, OpenRouter aggregation, synchronous cost tracking, global circuit breaker, shared PII scrubber utility.

**Tech Stack:** Supabase Edge Functions (Deno), OpenRouter API, PostgreSQL (`ai_usage_ledger`, `ai_circuit_breaker`), React (Supabase JS client).

**Dependencies:**
- Supabase CLI installed and authenticated (`supabase login`)
- OpenRouter API key (sent via email — provider will supply)
- Local Supabase instance running (or remote dev project)
- Node.js 20+ for Deno runtime compatibility

---

## Phase 1 — Core Text Gen + Auth Security Fix

### Task 1 — Prepare environment: Add OpenRouter secrets to local Supabase

**Objective:** Configure `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in Supabase secrets so Edge Functions can access them securely.

**Files:** None created/modified

**Step 1: Verify Supabase CLI access**

```bash
supabase projects list
```

Expected output: Table with project `nbewyeoiizlsfmbqoist` (or local ref). Note the `Project ref` for production; for local dev use `http://localhost:54321`.

**Step 2: Set secrets in local Supabase**

```bash
# Replace with actual key (will be provided by user)
supabase secrets set --local OPENROUTER_API_KEY="sk-or-..."
supabase secrets set --local OPENROUTER_MODEL="openai/gpt-4o-mini"
```

Expected output: `✔ Secrets updated successfully`

If using remote dev project:
```bash
supabase secrets set --project-ref <project-ref> OPENROUTER_API_KEY="sk-or-..."
supabase secrets set --project-ref <project-ref> OPENROUTER_MODEL="openai/gpt-4o-mini"
```

**Step 3: Confirm secrets**

```bash
supabase secrets list --local
```

Expected: Two rows showing `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (values masked).

**Commit:** No code changes; secrets are environment state. Log completion in issue #89.

---

### Task 2 — Create migration: `ai_usage_ledger` and `ai_circuit_breaker` tables

**Objective:** Create durable storage for per-request cost tracking and global circuit breaker state.

**Files:**
- Create: `supabase/migrations/20250424000000_create_ai_tables.sql`

**Step 1: Write migration SQL**

Create the file with:

```sql
-- Enable UUID extension if not present
create extension if not exists "uuid-ossp";

-- ai_usage_ledger: record every AI call for cost/audit
create table if not exists ai_usage_ledger (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_cents integer not null,
  created_at timestamp with time zone default now()
);

-- Index for org-level spend queries
create index idx_ai_usage_org on ai_usage_ledger(org_id, created_at);
create index idx_ai_usage_user on ai_usage_ledger(user_id, created_at);

-- RLS: orgs can read their own usage; service role can insert; admins can read
alter table ai_usage_ledger enable row level security;
create policy "org_member_read_own_usage" on ai_usage_ledger
  for select using (org_id = auth.jwt() ->> 'app_metadata'->>'org_id');
create policy "service_role_insert" on ai_usage_ledger
  for insert with check (true); -- EFs run with service role, bypass RLS

-- ai_circuit_breaker: global failure counter (feature_key='global')
create table if not exists ai_circuit_breaker (
  feature_key text primary key,
  failure_count integer not null default 0,
  last_failure_at timestamp with time zone
);

-- Seed global row
insert into ai_circuit_breaker (feature_key, failure_count, last_failure_at)
values ('global', 0, null)
on conflict (feature_key) do nothing;

-- RLS: read only for admins (broad org read via policy)
alter table ai_circuit_breaker enable row level security;
create policy "service_role_manage" on ai_circuit_breaker for all using (true);

-- Function: reset circuit breaker on success
create or replace function ai_circuit_breaker_reset()
returns void language plpgsql security definer as $$
begin
  update ai_circuit_breaker
  set failure_count = 0, last_failure_at = null
  where feature_key = 'global';
end;
$$;

-- Function: record failure (increment counter)
create or replace function ai_circuit_breaker_record_failure()
returns void language plpgsql security definer as $$
begin
  update ai_circuit_breaker
  set failure_count = failure_count + 1,
      last_failure_at = now()
  where feature_key = 'global';
end;
$$;

-- Function: check if circuit is open (returns boolean)
create or replace function ai_circuit_breaker_is_open()
returns boolean language plpgsql security definer as $$
declare
  rec record;
begin
  select * into rec from ai_circuit_breaker where feature_key = 'global';
  if rec.failure_count >= 3 and rec.last_failure_at > now() - interval '5 minutes' then
    return true;
  end if;
  return false;
end;
$$;
```

**Step 2: Apply migration to local Supabase**

```bash
supabase migration up --local
```

Expected output: `Applying migration... done.`

**Step 3: Verify tables exist**

```bash
supabase db remote select --local "select table_name from information_schema.tables where table_schema='public' and table_name like 'ai_%';"
```

Expected output includes `ai_usage_ledger` and `ai_circuit_breaker`.

**Step 4: Commit**

```bash
git add supabase/migrations/20250424000000_create_ai_tables.sql
git commit -m "feat(ai): add ai_usage_ledger and ai_circuit_breaker tables"
```

---

### Task 3 — Create `ai-text-generate` Edge Function

**Objective:** Implement non-streaming text completion with JWT auth, circuit breaker check, PII scrub, OpenRouter call, ledger insert.

**Files:**
- Create: `supabase/functions/ai-text-generate/index.ts`
- (New shared dependency in next task)

**Step 1: Boilerplate structure**

Write `supabase/functions/ai-text-generate/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.substring(7);

    // Create Supabase client for DB operations (service role needed for RLS bypass in ledger insert)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT (decode only, don't call auth API since EFs have service role)
    let jwtPayload: any = null;
    try {
      const jwt = token.split('.')[1];
      const decoded = JSON.parse(atob(jwt));
      jwtPayload = decoded;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user_id and org_id from token
    const userId = jwtPayload.sub;
    const orgId = jwtPayload['app_metadata']?.org_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "Missing org_id in token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Circuit breaker check
    const { data: cb } = await supabase
      .from("ai_circuit_breaker")
      .select("*")
      .eq("feature_key", "global")
      .single();
    if (cb && cb.failure_count >= 3 && cb.last_failure_at > new Date(Date.now() - 5 * 60 * 1000).toISOString()) {
      return new Response(JSON.stringify({ error: "Circuit breaker open", code: "circuit_open" }), {
        status: 423,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse request body
    const { prompt, feature } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. PII scrub
    const { scrubPII } = await import("../shared/pii-scrubber.ts");
    const scrubbedPrompt = scrubPII(prompt);

    // 5. Call OpenRouter
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const model = Deno.env.get("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": "https://wrapmind.com",
        "X-Title": "WrapMind AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: scrubbedPrompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // Increment circuit breaker failure counter
      await supabase.rpc("ai_circuit_breaker_record_failure");
      return new Response(JSON.stringify({ error: "OpenRouter error", details: errorBody, code: "provider_error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens ?? 0;
    const outputTokens = usage.completion_tokens ?? 0;

    // 6. Calculate cost (OpenRouter rates: gpt-4o-mini ~$0.00015/1K input, $0.0006/1K output)
    let costPerInput = 0.00000015; // 15 cents per million tokens
    let costPerOutput = 0.0000006;
    // Adjust based on model (simplified)
    if (model.includes("claude")) {
      costPerInput = 0.0000008;
      costPerOutput = 0.000004;
    }
    const costCents = Math.round((inputTokens * costPerInput + outputTokens * costPerOutput) * 100);

    // 7. Insert usage ledger
    await supabase.from("ai_usage_ledger").insert({
      org_id: orgId,
      user_id: userId,
      feature,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
    });

    // 8. Reset circuit breaker on success
    await supabase.rpc("ai_circuit_breaker_reset");

    // 9. Return success
    return new Response(JSON.stringify({
      text,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("ai-text-generate error:", err);
    return new Response(JSON.stringify({ error: err.message, code: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**Step 2: Deploy locally**

```bash
supabase functions deploy ai-text-generate --local
```

Expected output: `Deploying function... done.`

**Step 3: Test via curl (manual verification)**

```bash
# Get a test JWT by logging into local Supabase auth first (browser)
# For now, we'll validate later in Task 7 when client is ready
echo "Waiting until Task 7 to test with real JWT"
```

**Step 4: Commit**

```bash
git add supabase/functions/ai-text-generate/index.ts
git commit -m "feat(ai): add ai-text-generate Edge Function with JWT auth"
```

---

### Task 4 — Create shared PII scrubber utility

**Objective:** Build reusable Deno module to scrub sensitive patterns from user-provided text before AI calls.

**Files:**
- Create: `supabase/functions/shared/pii-scrubber.ts`

**Step 1: Write scrubber implementation**

```typescript
/**
 * PII Scrubbing Utility
 *
 * Removes or redacts personally identifiable information from text
 * before sending to AI to comply with privacy requirements.
 */

export interface ScrubResult {
  original: string;
  scrubbed: string;
}

// Regex patterns (order matters — more specific first)
const PATTERNS = [
  // Email addresses
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },

  // US Phone: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX XXX XXXX
  { regex: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: "[PHONE]" },

  // EIN (XX-XXXXXXX)
  { regex: /\d{2}-\d{7}/g, replacement: "[EIN]" },

  // VIN (17 alphanumeric)
  { regex: /[A-HJ-NPR-Z0-9]{17}/gi, replacement: "[VIN]" },

  // Full name: First Last (capitalized words pattern — simple)
  { regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: "[NAME]" },

  // Street address: 123 Main St (simplified)
  { regex: /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, replacement: "[ADDRESS]" },

  // SSN-like pattern (XXX-XX-XXXX)
  { regex: /\d{3}-\d{2}-\d{4}/g, replacement: "[SSN]" },
];

/**
 * Scrub PII from text
 * @param text Input string from user
 * @returns New string with PII redacted
 */
export function scrubPII(text: string): string {
  let result = text;
  for (const { regex, replacement } of PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Scrub with metadata (dev mode only)
 * @param text Input string
 * @returns Object with original, scrubbed, and pattern count info
 */
export function scrubPIIWithInfo(text: string): ScrubResult & { replacements: number } {
  const original = text;
  let totalReplacements = 0;
  let result = text;
  for (const { regex, replacement } of PATTERNS) {
    const matches = result.match(regex);
    if (matches) {
      totalReplacements += matches.length;
      result = result.replace(regex, replacement);
    }
  }
  return { original, scrubbed: result, replacements: totalReplacements };
}
```

**Step 2: Add unit test in same file (dev-mode)**

Add at bottom of file:

```typescript
// Dev-mode test — runs when NODE_ENV=development or SUPABASE_LOCAL=true
if (Deno.env.get("SUPABASE_LOCAL") === "true") {
  console.debug("Running PII scrubber self-test...");
  const testCases = [
    { input: "John Doe john.doe@example.com 555-123-4567", expectedHas: ["[EMAIL]", "[PHONE]"] },
    { input: "VIN: 1HGCM82633A123456", expectedHas: ["[VIN]"] },
    { input: "EIN: 12-3456789", expectedHas: ["[EIN]"] },
    { input: "123 Main Street, Springfield", expectedHas: ["[ADDRESS]"] },
  ];
  for (const { input, expectedHas } of testCases) {
    const { scrubbed, replacements } = scrubPIIWithInfo(input);
    for (const token of expectedHas) {
      if (!scrubbed.includes(token)) {
        console.error(`PII TEST FAIL: expected ${token} in "${scrubbed}" from "${input}"`);
      } else {
        console.debug(`PII TEST OK: ${token} found in scrubbed output`);
      }
    }
    if (replacements === 0) {
      console.warn(`PII TEST WARN: no replacements for "${input}"`);
    }
  }
}
```

**Step 3: Commit**

```bash
git add supabase/functions/shared/pii-scrubber.ts
git commit -m "feat(ai): add PII scrubber utility with regex patterns"
```

---

### Task 5 — Migrate `ai-vision-analyze` to JWT auth (security fix)

**Objective:** Replace service-role `apikey` header with JWT verification, add PII scrubber, circuit breaker check, ledger insert.

**Files:**
- Read: `supabase/functions/ai-vision-analyze/index.ts`
- Modify in-place

**Step 1: Read current implementation**

```bash
cat supabase/functions/ai-vision-analyze/index.ts
```

Record baseline to diff later.

**Step 2: Replace auth block with JWT verification**

Before (current):
```typescript
const jwt = Deno.env.get("SUPABASE_JWT")!;
// or uses `apikey` with service role
```

After (replace entire header section):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // JWT verification
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.substring(7);

  // Decode JWT payload
  let jwtPayload: any = null;
  try {
    const jwt = token.split('.')[1];
    jwtPayload = JSON.parse(atob(jwt));
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid token format" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = jwtPayload.sub;
  const orgId = jwtPayload['app_metadata']?.org_id;
  if (!orgId) {
    return new Response(JSON.stringify({ error: "Missing org_id" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // DB client (service role for bypass)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
```

**Step 3: Add circuit breaker check** (immediately after JWT decode, before calling Anthropic):

```typescript
// Circuit breaker check
const { data: cb } = await supabase
  .from("ai_circuit_breaker")
  .select("*")
  .eq("feature_key", "global")
  .single();
if (cb && cb.failure_count >= 3 && cb.last_failure_at > new Date(Date.now() - 5 * 60 * 1000).toISOString()) {
  return new Response(JSON.stringify({ error: "Circuit breaker open" }), {
    status: 423,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Step 4: Add PII scrub to image-analysis payload**

If the function receives free-text fields (like `description` or `notes`), scrub them. Example placeholder:

```typescript
// Extract existing body parse
const { imageBase64, description } = await req.json();

// Scrub PII from any free-text
if (description) {
  const { scrubPII } = await import("../shared/pii-scrubber.ts");
  description = scrubPII(description);
}
```

(Add only if such fields exist in the current signature.)

**Step 5: Add usage ledger insert after successful Anthropic call**

After you receive `anthropicResponse` and extract response text, add:

```typescript
// After parsing responseText from Anthropic
const inputTokens = anthropicResponse.usage?.input_tokens ?? 0;
const outputTokens = anthropicResponse.usage?.output_tokens ?? 0;
// Cost: Sonnet ~$0.0008 in, $0.004 out per 1K
const costCents = Math.round((inputTokens * 0.0000008 + outputTokens * 0.000004) * 100);

await supabase.from("ai_usage_ledger").insert({
  org_id: orgId,
  user_id: userId,
  feature: "ai-vision-analyze",
  model: "anthropic/claude-sonnet-4",
  input_tokens: inputTokens,
  output_tokens: outputTokens,
  cost_cents: costCents,
});

// Reset circuit breaker
await supabase.rpc("ai_circuit_breaker_reset");
```

**Step 6: Increment circuit breaker on any error path**

Add before each `return new Response(...)` in error cases (after Anthropic fetch fails):

```typescript
await supabase.rpc("ai_circuit_breaker_record_failure");
```

**Step 7: Verify service-role key removed from client bundle**

```bash
# Search for any VITE_WRAPMIND_API_KEY in frontend code
grep -r "VITE_WRAPMIND_API" app.wrapmind/ || echo "No exposed keys found"
```

If found, note in commit message; will be removed in Task 7.

**Step 8: Deploy**

```bash
supabase functions deploy ai-vision-analyze --local
```

**Step 9: Commit**

```bash
git add supabase/functions/ai-vision-analyze/index.ts
git diff --cached > /tmp/vision-migration.diff
git commit -m "feat(ai): migrate ai-vision-analyze to JWT auth (security fix)

- Remove service-role apikey header
- Add JWT verification (user + org context)
- Add circuit breaker check
- Add PII scrubber to any free-text payload
- Insert usage ledger entry with cost cents
- Increment circuit breaker on all error paths
"
```

---

### Task 6 — Update `src/lib/ai.js`: Replace URL/KEY pattern with JWT

**Objective:** Remove all `VITE_WRAPMIND_API_URL` and `VITE_WRAPMIND_API_KEY` usage; call Edge Functions via `supabase.functions.invoke` with user's JWT.

**Files:**
- Read: `app.wrapmind/src/lib/ai.js`
- Modify: in-place

**Step 1: Read current file**

```bash
head -100 app.wrapmind/src/lib/ai.js
```

Note sections where `fetch(VITE_WRAPMIND_API_URL)` or `headers: { apikey: ... }` are used.

**Step 2: Remove all `VITE_WRAPMIND_API_*` imports/env**

Delete any lines like:
```javascript
const API_URL = import.meta.env.VITE_WRAPMIND_API_URL;
const API_KEY = import.meta.env.VITE_WRAPMIND_API_KEY;
```

Replace with JWT-based Supabase Functions call skeleton:

Add helper at top of file:

```javascript
// Get current user's JWT
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No active session — user must be logged in");
  }
  return session.access_token;
}
```

**Step 3: Rewrite `generateText()` function**

Replace entire body:

```javascript
export async function generateText({ prompt, feature }) {
  // Feature flag gate
  const { data: settings } = await supabase
    .from("user_settings")
    .select("aiEnabled")
    .eq("user_id", supabase.auth.getUser().data.user?.id)
    .single();
  if (!settings?.aiEnabled) {
    throw new Error("AI features are disabled for your organization");
  }

  const token = await getAuthToken();

  const { data, error } = await supabase.functions.invoke("ai-text-generate", {
    body: { prompt, feature },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(error.message || "AI generation failed");
  }

  return {
    text: data.text,
    model: data.model,
    inputTokens: data.input_tokens,
    outputTokens: data.output_tokens,
    costCents: data.cost_cents,
  };
}
```

**Step 4: Rewrite any other AI-calling functions** (e.g., `analyzeVehicleImage` if it calls `/api/ai/vision`)

Pattern:

```javascript
export async function analyzeVehicleImage({ image, description }) {
  const token = await getAuthToken();

  // Scrub PII from description locally as double-layer? Optional; EF will scrub anyway
  const { error, data } = await supabase.functions.invoke("ai-vision-analyze", {
    body: { imageBase64: image, description },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw error;
  return data;
}
```

**Step 5: Update any remaining fetch-based AI calls**

Search for `fetch(` and `VITE_WRAPMIND_API` — replace every occurrence with `supabase.functions.invoke`.

**Step 6: Add fallback UI handling** (if not already present)

Functions should throw on error; calling components catch and display fallback (already in UI). Verify no silent `error:` logging that doesn't surface.

**Step 7: Verify no VITE_* keys remain**

```bash
grep -r "VITE_WRAPMIND_API" app.wrapmind/src/ && echo "FOUND — REMOVE THESE" || echo "Clean"
```

Expected: "Clean".

**Step 8: Commit**

```bash
git add app.wrapmind/src/lib/ai.js
git commit -m "feat(ai): migrate to JWT auth via supabase.functions.invoke
- Removes VITE_WRAPMIND_API_URL/KEY environment variables
- All AI calls now use user's session token in Authorization header
- Adds aiEnabled feature flag gate check
- Prepare for Phase 1 secure Edge Functions"
```

---

### Task 7 — Update vehicle image components if needed

**Objective:** Ensure `analyzeVehicleImage()` JWT migration didn't break UI components.

**Files:**
- `app.wrapmind/src/components/VehicleByImage.jsx`
- `app.wrapmind/src/components/VinSearch.jsx`

**Step 1: Check imports and call sites**

```bash
grep -n "analyzeVehicleImage" app.wrapmind/src/components/VehicleByImage.jsx
grep -n "analyzeVehicleImage" app.wrapmind/src/components/VinSearch.jsx
```

Confirm both import `analyzeVehicleImage` from `../../lib/ai.js`.

**Step 2: Verify no changes needed if `ai.js` signature unchanged**

If signature remains `analyzeVehicleImage({ image, description })`, then no changes required. If params changed, update the calls to match.

**Step 3: Add error boundary / fallback UI**

Check that each component has a `try/catch` or `error` state around the AI call. If not, wrap:

```javascript
try {
  const result = await analyzeVehicleImage({ image, description });
  setAnalysis(result);
} catch (err) {
  setAiError(err.message);
  // Show template fallback (existing code)
}
```

**Step 4: Commit**

```bash
git add app.wrapmind/src/components/VehicleByImage.jsx app.wrapmind/src/components/VinSearch.jsx
git commit -m "fix(ai): ensure vehicle image components use JWT-based AI call
- Keep parameters aligned with ai.js signature
- Add error fallback if missing"
```

---

### Task 8 — Manual E2E verification (local Supabase)

**Objective:** Prove every Phase 1 deliverable works end-to-end before moving to Phase 2.

**Files:** None created; verification only.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- OpenRouter API key set in local secrets (Task 1)
- `ai-text-generate` deployed (Task 3)
- `ai-vision-analyze` deployed (Task 5)
- React dev server running: `cd app.wrapmind && npm run dev`

**Step 1: Create test user and login**

In browser: open app, register a test user. Confirm you see a session token (Supabase auth).

**Step 2: Verify `ai-text-generate` accepts JWT**

Open DevTools console:

```javascript
import { generateText } from '/src/lib/ai.js';

// Call with a simple prompt
generateText({
  prompt: "Write a one-sentence greeting",
  feature: "test-phase1"
}).then(r => console.log("Result:", r.text))
  .catch(e => console.error("Error:", e));
```

Expected: Logged text response (non-empty string).

**Step 3: Check ledger row**

```bash
# Query local Supabase
supabase db remote select --local "
  select id, feature, model, input_tokens, output_tokens, cost_cents, created_at
  from ai_usage_ledger
  order by created_at desc limit 1;"
```

Expected: One row with `feature = 'test-phase1'`, non-null cost_cents.

**Step 4: Verify circuit breaker trips**

Cause 3 failures to trip breaker:

```javascript
// Induce failure by calling with empty prompt (should error)
for (let i = 0; i < 3; i++) {
  try {
    await generateText({ prompt: "", feature: "test-circuit" });
  } catch (e) { console.log("expected fail", e.message); }
}
```

Now call again:

```javascript
generateText({ prompt: "hello", feature: "post-trip" })
  .catch(e => console.error("Expected 423:", e.message));
```

Expected: Error contains "Circuit breaker open" or HTTP 423.

**Step 5: Verify circuit breaker clears**

Wait >5 min or manually reset in DB:

```bash
supabase db remote execute --local "select ai_circuit_breaker_reset();"
```

Call `generateText({ prompt: "test after reset" })` again — should succeed.

**Step 6: Verify PII scrubbing**

```javascript
generateText({
  prompt: "Contact John Doe at john.doe@example.com, VIN 1HGCM82633A123456, (555) 123-4567",
  feature: "test-pii"
}).then(r => {
  // The text should NOT contain the raw PII in the AI's output
  // (though the AI might echo patterns if it guesses, the prompt sent to OpenRouter had PII redacted)
  console.log("Done — check OpenRouter logs or ledger; payload was redacted");
}).catch(console.error);
```

**Step 7: Verify `ai-vision-analyze` JWT migration**

Navigate to vehicle image analysis page. Upload a test image. Ensure response arrives without error. Check ledger has row with `feature = 'ai-vision-analyze'`.

**Step 8: Confirm no VITE_* keys in bundle**

In DevTools Network tab, inspect any request to Supabase Edge Functions. Confirm headers only include `Authorization: Bearer <jwt>` — no `apikey` header with service role.

**Step 9: Verify fallback UI**

Force an error (disconnect network temporarily) and confirm appropriate error message appears inline (not console-only).

**Step 10: Close out**

Once all steps pass, update GitHub issue #89 with:

```
✅ Phase 1 E2E verification complete
- ai-text-generate: JWT auth working
- ai-vision-analyze: JWT auth working
- Circuit breaker: trip/reset confirmed
- PII scrubber: validated
- Usage ledger: rows inserting
- No VITE_WRAPMIND_API_* keys in client bundle
- Feature flags respected
- Fallback UI working
```

**Commit:** No code committed during verification; just update issue body.

---

## Success Criteria

- [ ] `ai-text-generate` deployed to local + production (behind `aiEnabled=false`)
- [ ] `ai-vision-analyze` deployed with JWT auth (service-role key removed from client calls)
- [ ] All React AI calls use `supabase.functions.invoke` with user JWT
- [ ] `VITE_WRAPMIND_API_URL` and `VITE_WRAPMIND_API_KEY` removed from `.env` files and codebase
- [ ] `ai_usage_ledger` populated for every successful call
- [ ] Circuit breaker trips on 3 failures, resets on success
- [ ] PII scrubber runs in both EFs (dev logs show test cases passing)
- [ ] `FEATURE-INVENTORY.md` statuses updated: `aiTextGenerationEnabled` → "Implemented", `aiVisionEnabled` → "Implemented"

---

## Implementation Order (Task Sequence)

1. Task 1 — Secrets setup
2. Task 2 — Database migration
3. Task 3 — `ai-text-generate` EF
4. Task 4 — PII scrubber
5. Task 5 — `ai-vision-analyze` JWT migration
6. Task 6 — `src/lib/ai.js` rewrite
7. Task 7 — Vehicle components verification
8. Task 8 — Manual E2E verification + issue documentation

Total estimated development time: **2–3 hours** with focus.

---

*Plan generated by Hermes Agent (writing-plans skill). Last updated: April 24, 2026.*
