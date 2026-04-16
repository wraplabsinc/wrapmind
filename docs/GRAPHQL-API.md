# GraphQL API — app.wrapmind

## Endpoint
```
POST http://127.0.0.1:54321/graphql/v1
Authorization: Bearer {supabase_session_token}
apikey: {ANON_KEY}  (for initial connection checks)
```

## Verified — April 16, 2026
- [x] GraphQL endpoint responds with HTTP 200
- [x] pg_graphql correctly exposes all tables as collections
- [x] RLS active — unauthenticated requests return empty edges (not errors)
- [x] React app serves at localhost:5173 with title "WrapMind Estimator"
- [x] Apollo Client configured and will make queries with Bearer token from Supabase session

## pg_graphql Query Format (important differences from standard GraphQL)
```graphql
# Pagination uses first/offset, NOT limit
query { customersCollection(first: 10, offset: 0) { edges { node { id name email } } } }

# Single record lookup
query { customer(id: "uuid-here") { id name } }
```

## Test Queries (from terminal)
```bash
# Verify Apollo → GraphQL (anon key — RLS blocks data, but endpoint works)
curl -s -H "apikey: {ANON_KEY}" -H "Content-Type: application/json" \
  -d '{"query":"query { customersCollection(first: 2) { edges { node { id name } } } }"}' \
  http://127.0.0.1:54321/graphql/v1
# Returns: {"data":{"customersCollection":{"edges":[]}}}  ← RLS working (no auth session)

# With auth session — replace Bearer token with actual session token
curl -s -H "Authorization: Bearer {session_token}" \
  -H "apikey: {ANON_KEY}" -H "Content-Type: application/json" \
  -d '{"query":"query { customersCollection(first: 2) { edges { node { id name } } } }"}' \
  http://127.0.0.1:54321/graphql/v1
```

## Available Collections (verified via __typename)
- achievement_eventsCollection
- appointmentsCollection
- audit_logCollection
- carsCollection
- clientsCollection
- customersCollection ✅
- employeesCollection
- estimatesCollection ✅
- invoicesCollection ✅
- leadsCollection ✅
- locationsCollection ✅
- notificationsCollection ✅
- organizationsCollection ✅
- profile_locationsCollection ✅
- profilesCollection ✅
- vehiclesCollection ✅

## RLS Behavior
- Without auth session: queries return `{"edges": []}` — no error, just empty
- With valid auth session: returns only rows belonging to the user's org
- Apollo Client passes `auth.uid()` via Bearer token → RLS filters server-side
