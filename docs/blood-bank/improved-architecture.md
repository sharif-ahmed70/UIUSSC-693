# UIUSSC Blood Support Improved Architecture

Blood Support is a native module inside the UIUSSC Next.js/Supabase platform, not a separate app.

## Integrated Platform

```text
UIUSSC Website
├── Public Club Website
├── Events
├── Membership
├── Notices
├── Gallery
├── Contact
├── Blood Support
└── Staff and Department Management
```

Use Next.js App Router, TypeScript, Supabase PostgreSQL/Auth/Storage, Server Actions, Zod, RLS, column grants, generated database types, and server-only authorization helpers.

## Public Routes

- `/blood`: public Blood Support landing page.
- `/blood/request`: public blood request form.
- `/blood/donor-register`: public donor-interest registration.
- `/blood/request-submitted`: safe acknowledgement page.

Do not create a public donor directory.

## Blood Staff Routes

- `/staff/blood`
- `/staff/blood/requests`
- `/staff/blood/requests/[id]`
- `/staff/blood/donors`
- `/staff/blood/donors/[id]`
- `/staff/blood/matching/[requestId]`
- `/staff/blood/assignments`
- `/staff/blood/history`
- `/staff/blood/settings`
- `/staff/blood/audit`

Access depends on approved volunteer profile, active account, active Blood Department, approved Blood membership, and department role.

## Tables

- `blood_donors`: private donor records; auth account optional.
- `blood_requests`: private request records with public reference and workflow fields.
- `blood_request_status_history`: immutable request status changes.
- `blood_donor_assignments`: request-to-potential-donor assignments.
- `blood_assignment_status_history`: immutable assignment status changes.
- `blood_contact_attempts`: contact result history.
- `blood_donation_history`: verified donation records.
- `blood_module_settings`: operational settings and policy references.
- `notification_outbox`: provider-independent notification queue.
- Shared `club_audit_logs` for sensitive access/actions.

## Request State Machine

Statuses:

- `submitted`
- `under_review`
- `verified`
- `matching`
- `donor_contacting`
- `donor_confirmed`
- `partially_fulfilled`
- `fulfilled`
- `cancelled`
- `rejected`
- `expired`

Allowed transitions:

- `submitted` -> `under_review`, `rejected`, `cancelled`, `expired`
- `under_review` -> `verified`, `rejected`, `cancelled`, `expired`
- `verified` -> `matching`, `cancelled`, `expired`
- `matching` -> `donor_contacting`, `cancelled`, `expired`
- `donor_contacting` -> `donor_confirmed`, `matching`, `cancelled`, `expired`
- `donor_confirmed` -> `partially_fulfilled`, `fulfilled`, `donor_contacting`, `cancelled`, `expired`
- `partially_fulfilled` -> `donor_contacting`, `fulfilled`, `cancelled`, `expired`

`units_fulfilled` drives fulfilment:

- `0` fulfilled units is not fulfilled.
- `0 < units_fulfilled < units_required` means `partially_fulfilled`.
- `units_fulfilled >= units_required` means `fulfilled`.

## Assignment State Machine

Statuses:

- `suggested`
- `assigned`
- `contacted`
- `agreed`
- `declined`
- `unreachable`
- `follow_up_required`
- `donated`
- `failed`
- `cancelled`

Rules:

- Assignment creation starts as `assigned`.
- `contacted` requires a contact attempt.
- `agreed` requires donor consent.
- `donated` requires verified donation result.
- Donor availability is not permanently changed merely because a donor was suggested.
- Failed/cancelled assignments retain history.

## Matching Strategy

Return ranked potential donors. Do not describe results as medical eligibility.

Mandatory filters:

- Exact requested blood group by default.
- Donor verified.
- Donor active and not archived.
- Contact consent is true.
- Currently available.
- Not already active on the same request.
- Not inside contact cooldown.
- Donation-policy condition satisfied where applicable.

Ranking factors:

- Same hospital area.
- Nearby area.
- Longer time since last verified donation.
- No recent contact.
- Positive response history.
- Low current assignment load.
- Emergency opt-in.
- Preferred contact availability.

Return explainable ranking reasons such as `Same area`, `Verified`, `Available`, `No recent contact`, `Longer time since last donation`.

Do not expose scores publicly. Do not automatically assign donors. Do not auto-apply alternative compatibility groups without medically reviewed policy.

Recommended implementation: server-side query composition or a reviewed parameterized SQL function that returns only authorized staff results. Do not expose the score publicly; return human-readable reasons only.

## Privacy and Consent

- No public donor list.
- Public forms insert only; no public read on blood tables.
- Staff-only donor contact details.
- Requester receives donor contact only after donor consent and policy approval.
- Proof files go to private Supabase Storage.
- Use short-lived signed URLs.
- Collect minimum health data.
- Do not collect detailed medical history in MVP.
- Support donor contact consent and opt-out.
- Audit sensitive record access where practical.

## Proof Storage

- Use a private Supabase Storage bucket, for example `blood-request-proofs`.
- Public form requests upload through a server-controlled flow.
- Validate file type and size.
- Store only `proof_storage_path` in `blood_requests`.
- Staff access uses signed URLs after authorization.
- Do not store proof URLs in public rows.
- Use randomized object paths, for example `blood-requests/{request_id}/{random_id}.pdf`.
- Allow PDF, JPEG, and PNG only.
- Validate MIME type, extension, and maximum size.
- Do not trust original filenames.
- Do not create a public Storage SELECT policy.
- Log proof access where practical.
- Define retention/deletion with request archival.

## Public Forms

Use Server Actions, Zod, honeypot, Bangladesh phone normalization, blood-group allowlist, future CAPTCHA, rate-limiting strategy, column-level INSERT grants, RLS, and no `.select()` after private insert.

Public users must not insert verification status, workflow status, staff assignment, staff notes, timestamps, public reference, proof path, or approval fields.

The database generates `public_reference`; public clients must not submit it. Proof paths are assigned only by the server-controlled upload flow.

## Trusted Workflow Operations

Direct arbitrary status updates are denied. Authorized staff use trusted Server Actions or reviewed RPCs that:

1. Validate the current status.
2. Validate actor permission from trusted profile, role, and department membership tables.
3. Apply the allowed transition atomically.
4. Record status history.
5. Record a reason.
6. Write an audit log.

Do not allow `submitted` -> `fulfilled` jumps.

## Units Fulfilled Strategy

Use one trusted donation-confirmation transaction:

1. Insert verified donation-history row.
2. Mark assignment `donated`.
3. Calculate total verified units for the request.
4. Update `units_fulfilled`.
5. Set request to `partially_fulfilled` or `fulfilled`.
6. Update donor last verified donation date.
7. Update donor availability according to reviewed policy.
8. Create histories.
9. Create audit records.

One donation never completes a multi-unit request unless total verified units fulfil the request.

## Notification Outbox

Provider-independent `notification_outbox` supports email, SMS, WhatsApp, and in-app staff notifications.

Events:

- request received
- request under review
- request verified/rejected
- donor contact requested
- donor agreed/declined
- donor confirmed
- request partially fulfilled/fulfilled/cancelled

No automatic phone calling is implied; human blood-team communication remains required.

## Bulk Import

Protected workflow:

1. Upload to protected temporary storage.
2. Validate actual file type.
3. Parse safely.
4. Validate each row.
5. Normalize phone/email/UIU ID/blood group/date/area/availability.
6. Dry-run preview.
7. Separate valid, invalid, duplicate rows.
8. Staff confirmation.
9. Transaction or safe batch import.
10. Imported donors start `pending`.
11. No fake login accounts.
12. Audit importer and import result.

## Auditing

Use shared `club_audit_logs` for donor record viewed, blood request verified, potential donor matched, donor assigned, donor contacted, donation confirmed, and settings changed.
