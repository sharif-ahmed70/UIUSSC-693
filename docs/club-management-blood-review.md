# Club Management and Blood Support Review

## Executive Summary

The drafted Club Management and Blood Support system is now kept entirely in `supabase/drafts/` and cannot be applied by a normal Supabase migration push. The review tightened public grants, workflow ownership, identity normalization, delete behavior, bootstrap administration, and privacy controls. No production-like schema was modified.

## Review Scope

- Club departments, volunteer profiles, memberships, platform roles, histories, and audit logs.
- Blood donors, requests, assignments, contact attempts, donation history, settings, notifications, proof storage, and bulk import.
- RLS recursion risk, authorization helpers, public column grants, seed/verify/security-test files, and deployment safety.

## Critical Findings

- Active migration risk: the draft was in `supabase/migrations/`, where future CLI commands could deploy it.
- Public request insert allowed client-supplied `public_reference`.
- Public request insert allowed client-supplied `proof_storage_path`.
- Several foreign keys used cascading deletes that could erase operational history.
- First-super-admin bootstrap was undefined.

## Confirmed Fixes

- Moved draft to `supabase/drafts/202606240001_club_management_blood_support.sql`.
- Removed the Club/Blood draft from active migrations.
- Added operator-only bootstrap draft with placeholder UUID.
- Removed public insert grant for `public_reference` and `proof_storage_path`.
- Added server-generated blood request reference.
- Added normalized volunteer identity columns and indexes.
- Tightened donor unique indexes to ignore blank identities.
- Replaced destructive cascades on important history paths with `restrict` where appropriate.
- Added notification idempotency and attempt fields.
- Added settings type/validation metadata.
- Expanded verification and security-test plans.

## Unresolved Design Decisions

- Whether to physically split the reviewed combined SQL draft into three final migration files before deployment.
- Whether donor duplicate records are strictly blocked forever or routed to a manual merge workflow after MVP.
- Exact Blood volunteer read surface: limited donor/request fields need final operational approval.
- Exact rate-limit/CAPTCHA provider.
- Retention periods for proof files, donor notes, and contact attempts.

## Migration Decomposition

Recommended final split before deployment:

1. Club Management foundation: departments, profiles, memberships, platform roles, histories, audit.
2. Blood Support foundation: donors, requests, assignments, contact attempts, donation history, settings, notification outbox.
3. RLS helpers, grants, policies, and private proof Storage policies.

The current combined file remains a review draft only to avoid creating multiple near-duplicate draft schemas.

## RLS Design Summary

Public users get only column-level INSERT grants for safe public submission columns. They get no SELECT, UPDATE, or DELETE on private Blood or volunteer tables. Staff access should be added only after reviewed helper functions avoid policy recursion and rely on trusted database state.

## Bootstrap Admin Approach

`supabase/drafts/202606240001_bootstrap_super_admin.sql` is an operator-only manual draft. It requires an existing Supabase Auth user UUID, writes an audit log, avoids public/browser execution, and is never run as a migration or seed.

## Status-Transition Strategy

Arbitrary status updates are denied. Trusted Server Actions or reviewed RPCs validate actor permission, current status, allowed transition, reason, and audit logging in one transaction.

## Privacy Controls

- No public donor list.
- No public proof bucket.
- Proof access only through short-lived signed URLs.
- No requester access to unrelated files.
- Donor contact details stay staff-only until consent and policy approval.
- Audit high-risk data access.

## Deployment Prerequisites

- Human approval of all draft SQL.
- Final migration split decision.
- Reviewed authorization helpers.
- Reviewed RLS policies under anon/authenticated test contexts.
- Private Storage bucket and policy review.
- Regenerate Supabase database types only after applying approved migrations.

## Rollback Considerations

Prefer phased migrations. Each phase should include reversible operational guidance, but private operational data should be archived rather than destructively removed. Avoid deploying broad admin policies that would require emergency rollback.

## Files Requiring Approval

- `supabase/drafts/202606240001_club_management_blood_support.sql`
- `supabase/drafts/202606240001_settings_seed.sql`
- `supabase/drafts/202606240001_verify.sql`
- `supabase/drafts/202606240001_security_tests.sql`
- `supabase/drafts/202606240001_bootstrap_super_admin.sql`
- `docs/blood-bank/*`
- `docs/club-management/*`
- `docs/architecture-decisions/*`

## Recommended Next Action

Review and approve the draft architecture, then split the SQL into phased migrations before any remote application.
