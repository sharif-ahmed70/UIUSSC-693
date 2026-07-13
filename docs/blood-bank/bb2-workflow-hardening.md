# BB-2.1 Blood Support Workflow Hardening

BB-2.1 improves the Blood Support workflow without creating a separate Blood admin system.

## Workflow

The staff-facing workflow is written in real club language:

- Pending Review
- Reviewing
- Verified
- Searching Donor
- Donation Process
- Completed

The database continues to use the existing BB-1 request statuses, but pages avoid exposing raw database terms.

## Priority

Blood requests now have a human-friendly priority:

- Normal
- Urgent
- Critical

Critical requests appear first in staff lists and dashboard summaries. Priority changes require a reason and are written to `blood_request_priority_history` plus `club_audit_logs` as `BLOOD_PRIORITY_CHANGED`.

## Donor Availability

Blood staff can update donor availability:

- Available
- Temporarily Unavailable
- Do Not Contact
- Unknown

Availability changes are recorded in `blood_donor_availability_history` and audited as `DONOR_AVAILABILITY_CHANGED`.

## Blood Executive Actions

Blood Executive assignments now include a simple action label and optional deadline, such as:

- Contact donor
- Confirm availability
- Hospital coordination
- Follow up patient

Executives see “My Assigned Actions” and can mark an action complete. This keeps the UI simple without introducing a second task architecture.

## Timeline

The request detail page combines existing request history, priority history, matches, donations, and assignments into a readable timeline. It does not expose private phone/email contact data.

## Permissions

BB-2.1 preserves:

- RLS
- CM-4 permission resolver
- Blood Department boundaries
- RPC-only workflow changes
- No separate Blood roles

Expected behavior:

- Super Admin: full Blood management.
- President / General Secretary: read-only operational oversight.
- Head of Blood: Blood Department management.
- Blood Executive: assigned actions only.
- Head of Marketing: denied Blood management unless separately assigned Blood access.
- Normal Member: no internal Blood access.

## UX Decisions

Technical terms such as RPC, scope, permission key, and table names are intentionally hidden from the UI. Buttons use operational language:

- Verify Request
- Start Donor Search
- Change Priority
- Assign Action
- Mark Complete
- Update Availability
