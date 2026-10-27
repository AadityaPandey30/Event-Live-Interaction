# Supabase setup

The project URL and publishable key are already in `.env`. Two steps remain, both
of which need values only you have (they are not in this repo).

## 1. Add the service role key

Supabase Dashboard → your project → **Project Settings → API → Project API keys**
→ copy the **`service_role`** secret → replace the placeholder in `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role, NOT the publishable/anon key
```

Keep the `service_role` key server-side only. It is read in `lib/supabaseAdmin.js`
and never shipped to the browser (the client bundle is verified free of it).

## 2. Create the tables

Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and Run.
This creates `bhc_sessions`, `bhc_assessments`, the `updated_at` trigger, RLS with
no policies (so anon/authenticated roles can read nothing), and seeds the workshop
session row.

Or, after step 1: `npm run db:setup` (uses Supabase's SQL-over-HTTP endpoint; if
that RPC is unavailable, use the SQL Editor).

## 3. Verify

```
npm run dev
curl http://localhost:3000/api/health
```

Expected, when healthy:

```json
{ "configured": true, "tables": { "bhc_sessions": "ok", "bhc_assessments": "ok" }, "ok": true }
```

A 503 with `"error": "Run supabase/schema.sql..."` means step 2 is outstanding.
A 503 mentioning `SUPABASE_SERVICE_ROLE_KEY` means step 1 is outstanding.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` / Vercel | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` / Vercel (server only) | Postgres reads/writes |
| `SESSION_ID` | `.env` / Vercel | Session identifier (must match the seeded row) |
| `SESSION_START_INDEX` | optional | First question index (default 0) |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is **not** required: there is no Realtime socket and
no client-side database access. You may leave it in `.env`; nothing reads it.
