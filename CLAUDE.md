@AGENTS.md

---

# AuditShield — Agent Reference

**Full project knowledge lives in the Obsidian vault:**
`C:\Users\Varun\Documents\Canada_Archive\Core\SystemsWithVarun\Projects\Apps\AuditShield\`

Key files:
- `CLAUDE.md` — Full technical reference: schema, RPCs, business rules, auth architecture, working features, security posture, debugging patterns
- `AuditShield Production Checklist.md` — Prioritized build queue with status (update this each session)
- `AuditShield Feature Pipeline.md` — Audited feature ideas with build phases and effort estimates

**Read those files at the start of every session before touching any code.**

---

## Critical Rules for Agents

1. Never modify Supabase RPCs without explicit instruction
2. Never reintroduce joins on the `logs` table — use snapshot columns (`staff_name`, `station_name`, `snapshot_config`) directly
3. Never move PIN hashing to the frontend — RPC-only
4. Never add `required` on the `icon` field in station creation — it is optional
5. All hooks must be called unconditionally and in the same order on every render
6. Reading values in the compliance table are type-aware — do not hardcode `°` on all field types

**Last updated:** April 8, 2026
