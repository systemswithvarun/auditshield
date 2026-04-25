@AGENTS.md

---

# AuditShield — Claude Code Reference
**Last updated:** April 11, 2026

---

## Session State
<!-- UPDATE THIS AT THE END OF EVERY WORKING SESSION -->

**Current phase:** MVP complete — active sales, invite-only access
**Last completed:** April 8 — major feature sprint
**Blocker:** Email notifications blocked on custom domain (Resend). Multi-manager login not yet built.
**Immediate next step:** Pest control station template + certificate storage (Checklist Items 2 + 17)
**Session goal:** _[Define at start of each session — what does "done" look like today?]_

---

## Product Summary

AuditShield is a digital Operational Compliance OS replacing paper food safety logs in commercial kitchens.
Core value: **unimpeachable, auditable data** — immutable logs, server timestamps, hashed PINs, snapshot records.
Target market: Alberta, Canada → expanding to Lawton, Oklahoma (Fort Sill opportunity).
Parent company: MSDV. Public brand: SystemsWithVarun.

---

## Tech Stack

| Component | Role |
|---|---|
| **Next.js 16** (App Router + Turbopack) | Frontend — server-side route handlers, edge middleware, client-side React state |
| **Supabase** (PostgreSQL) | Database, auth.users, RLS, pgcrypto (PIN hashing), pg_cron (schedule gen), atomic RPCs |
| **Vercel** | Hosting — edge deployment, SSL, continuous deployment from GitHub |
| **Resend** (SMTP) | Email alerts — **deferred, requires custom domain** |
| **@supabase/ssr** | Cookie-based session management, PKCE flow |
| **jsPDF + jspdf-autotable** | Client-side PDF generation for compliance reports |

**Repo:** github.com/systemswithvarun/auditshield (handle: rocket994)
**Live app:** auditshield-three.vercel.app
**Dev environment:** Windows PowerShell — heredoc syntax does NOT work

---

## Database Schema

| Table | Purpose | Key Columns |
|---|---|---|
| `organizations` | Business entities | `id`, `owner_id` → auth.users, `name`, `slug`, `plan_tier` |
| `locations` | Physical sites | `id`, `organization_id`, `name`, `slug` |
| `stations` | Equipment/checkpoints | `id`, `location_id`, `name`, `sop_config` (JSONB) |
| `staff` | Personnel | `id`, `pin_hash` (bcrypt), `role`, `pin_attempts`, `is_active`, `location_id` |
| `schedules` | Recurring time windows | `id`, `station_id`, `window_start`, `window_end`, `days_of_week`, `name` |
| `schedule_instances` | Daily generated slots | `id`, `target_date`, `station_id`, `schedule_id`, `status` (PENDING/COMPLETED/MISSED) |
| `logs` | Compliance records | `id`, `location_id`, `station_id`, `staff_id`, `is_breach`, `entry_data` (JSONB), `staff_name`, `station_name`, `snapshot_config`, `organization_id`, `created_at`, `logged_at` |
| `kiosk_sessions` | Single-use session tokens | `token`, `staff_id`, `location_id`, `expires_at` |

### Key RPCs

| RPC | What It Does |
|---|---|
| `initialize_new_organization` | Atomic provisioning: org + location + admin staff. Uses BEGIN...COMMIT. |
| `create_admin_staff` | Creates staff with server-side bcrypt PIN hashing |
| `validate_kiosk_pin` | Verifies PIN via crypt(), manages pin_attempts, issues single-use session token (30-min expiry) |
| `submit_kiosk_log` | Validates session token, verifies station ownership (cross-tenant check), writes log with snapshots, consumes token |
| `generate_daily_schedules` | Midnight pg_cron job. Evaluates days_of_week, inserts instances with ON CONFLICT DO NOTHING |

---

## Auth Architecture

**Manager Auth (Google OAuth)**
- PKCE flow via @supabase/ssr createBrowserClient (cookies, NOT localStorage)
- Server-side code exchange in /auth/callback/route.ts using createServerClient
- Smart routing in /auth/confirm: existing org → dashboard, new user → /onboard/finish-setup
- Edge middleware on /admin/* validates session before page render

**Kiosk Auth (Staff PIN)**
- 4-digit PIN → validate_kiosk_pin RPC → kiosk_session token (30-min, single-use)
- Token flow: PinPadModal → kiosk page state → StationForm → submit_kiosk_log RPC
- Token consumed (deleted) on successful log submission

---

## Business Rules (Non-Negotiable)

1. **Immutable logs** — Immutability trigger on logs table prevents UPDATE on core fields
2. **No anonymous logs** — Every log linked to staff_id via PIN-authenticated session token
3. **Timestamp integrity** — created_at and logged_at are server-generated via now(). Frontend cannot supply.
4. **Historical snapshotting** — snapshot_config on each log preserves station's sop_config at insert time
5. **Domain specificity** — Thresholds set per-field within each Station's sop_config only
6. **Role-based permissions** — Managers edit; Staff is Create Only via kiosk
7. **Snapshot columns over joins** — logs uses staff_name, station_name, snapshot_config directly. Never join.
8. **PIN security is RPC-only** — PIN hashing exclusively in RPCs, never frontend. pin_code column dropped.
9. **Session tokens are single-use** — Consumed on log submission via DELETE
10. **Cross-tenant isolation** — submit_kiosk_log verifies station belongs to same location as session

---

## Critical Debugging Patterns

**Snapshot columns, not joins.** Dashboard queries must read staff_name, station_name, snapshot_config directly from logs — never join to staff or stations. Broken joins was a recurring bug source. Fixed once; do not reintroduce.

**React hook ordering.** This codebase has had multiple infinite re-render and hook ordering bugs. All hooks (useState, useEffect, useMemo) must be called unconditionally and in the same order on every render — no hooks inside conditionals or after early returns.

**`createBrowserClient` not `createClient`.** If any file imports createClient from @supabase/supabase-js, that's a bug — it won't share session cookies and will cause auth failures.

**Multi-agent drift is the default failure mode.** This codebase was built with Claude, Claude Code, and Gemini. When something breaks unexpectedly, check whether code references match actual DB schema before assuming a logic error.

**Fix, don't rebuild.** Backend is solid. Each individual bug is small in scope. Always diagnose the specific issue.

---

## Security Posture Summary

9 of 13 issues resolved. Key open items:
- `search_path` fix on 7 RPCs (Low — need exact param signatures from pg_proc, then 7 ALTER statements)
- Email/edge function auth (Deferred — Resend not active)
- Leaked password protection (Deferred — requires Supabase Pro)

---

## Working Pattern

1. Claude writes exact SQL or code with explanation
2. Varun runs it and pastes results back
3. Claude verifies before proceeding
4. Claude acts as gatekeeper — no implementation approved without explicit sign-off
5. Flag anything that could compromise data integrity

---

## Key Routes

| Route | Purpose |
|---|---|
| `/onboard` | New user entry — Google OAuth. **Invite-only.** |
| `/auth/callback` | Server-side PKCE code exchange |
| `/auth/confirm` | Smart routing: existing org → dashboard, new user → finish-setup |
| `/admin/dashboard` | Compliance Pulse, Critical Alerts, station status |
| `/admin/staff-accountability` | 30-day per-staff compliance history |
| `/admin/locations` | Location CRUD with kiosk URL display |
| `/[orgSlug]/[locSlug]` | Staff-facing kiosk — PIN entry and log submission |
| `page.tsx` (root) | Public landing — all CTAs go to mailto: |

---

## Sales Context

- **Access model:** Invite-only. All public CTAs → systemswithvarun@gmail.com. Share /onboard directly.
- **Warm pipeline:** Fenyk Coffee (most engaged), First Street Market, Famoso GM (Tim Hortons), Five Guys GM, multi-kiosk studio friend
- **Lawton opportunity:** Fort Sill army base — military food safety compliance underserved
- **Exit/scale:** Compliance layer acquirable by 7shifts, Toast, or scheduling/POS platforms. Build the moat first.
