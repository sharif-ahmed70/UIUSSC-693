# BB-2 Blood Support Operational Management

BB-2 extends the BB-1 Blood Support foundation. It does not create a separate Blood admin system or separate Blood roles.

## Architecture

Blood Support follows the existing UIUSSC governance hierarchy:

- Super Admin
- Core Leadership
- Blood Department
- Head of Blood / Deputy Head
- Blood Executive

All protected operations use existing Supabase RPC authorization and the CM-4 permission resolver. Public users submit through RPC intake functions only.

## Database Reuse

BB-2 reuses:

- `blood_support_settings`
- `blood_donor_profiles`
- `blood_donor_contacts`
- `blood_requests`
- `blood_request_contacts`
- `blood_matches`
- `blood_donations`
- blood status history tables
- `club_audit_logs`

New BB-2 table:

- `blood_request_assignments`

This table records which Blood Executive is assigned to a specific request follow-up. It does not duplicate request, donor, or contact data.

## Permission Model

Super Admin has full Blood access through platform role.

President, Vice President, Assistant Vice President, and General Secretary have Blood operation visibility for oversight.

Head of Blood receives department-scoped Blood permissions:

- manage requests
- manage donors
- manage matches
- assign executives
- verify donations

Blood Executives receive assigned-record visibility through `blood_request_assignments`.

Normal members have no internal Blood Support access.

## Public Intake

Public routes:

- `/blood/request`
- `/blood/donor-registration`

Both use secure server actions and RPCs:

- `submit_public_blood_request`
- `submit_public_blood_donor_interest`

Public intake is controlled by `blood_support_settings`:

- `public_request_intake_enabled`
- `public_donor_interest_enabled`

## Contact Privacy

Donor/request contacts remain in protected contact tables. Staff pages do not select or render phone/email contact records.

Contact access remains controlled by:

- `authorize_blood_match_contact`
- `get_authorized_blood_match_contacts`

Every authorized contact read writes an audit log.

## Workflow

Request workflow uses existing BB-1 statuses:

- submitted
- under_review
- approved
- matching
- partially_fulfilled
- fulfilled
- rejected
- cancelled
- expired
- archived

Match workflow:

- suggested
- shortlisted
- approved_for_contact
- contacted
- interested
- declined
- unavailable
- confirmed
- completed
- cancelled

Donation workflow:

- reported
- under_review
- verified
- rejected
- cancelled

## Notification Preparation

BB-2 records audit/event names for future notification wiring:

- `BLOOD_REQUEST_CREATED`
- `DONOR_CONTACT_REQUIRED`
- existing match, request, donor, and donation audit actions

No external notification provider is implemented in BB-2.

## Verification Checklist

Recommended role checks:

- Super Admin can manage all Blood workflows.
- President can view Blood reports/operations but does not receive contact exposure by default.
- General Secretary can view Blood oversight.
- Head of Blood can manage Blood requests, donors, matching, assignments, and donation verification.
- Head of Marketing cannot access Blood management.
- Blood Executive can view assigned request work only.
- Normal Member is denied internal Blood access.
