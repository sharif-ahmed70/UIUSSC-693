# BB-1 Blood Support Database Foundation

## Scope

BB-1 adds the secure database foundation for UIUSSC Blood Support. It does not add public Blood Request UI, public Donor Interest UI, CAPTCHA, rate limiting, Storage buckets, messaging integrations, automatic matching, or legacy data import.

The legacy Blood Bank project remains reference material only. Unsafe legacy patterns such as JWT in localStorage, unrestricted CORS, public database-test routes, raw database errors, prefilled admin credentials, fake donor accounts, random donor passwords, hard deletes, automatic assignment, automatic medical eligibility claims, and premature donor-contact exposure are rejected.

## Medical-Safety Language

The system uses the term **Potential Donor**. Blood group, location, consent, and availability are screening information only. The database does not declare anyone medically eligible, guaranteed compatible, clinically approved, or safe to donate. Final medical eligibility and transfusion suitability remain the responsibility of qualified healthcare professionals and the receiving medical facility.

## Schema

Created tables:

- `blood_support_settings`
- `blood_donor_profiles`
- `blood_donor_contacts`
- `blood_requests`
- `blood_request_contacts`
- `blood_matches`
- `blood_donations`
- `blood_donor_status_history`
- `blood_request_status_history`
- `blood_match_status_history`
- `blood_donation_status_history`
- `blood_donor_duplicate_reviews`

No real donor, requester, patient, or donation data is seeded.

## Contact Separation

Donor screening/profile data is stored in `blood_donor_profiles`; donor contact data is stored separately in `blood_donor_contacts`.

Request workflow data is stored in `blood_requests`; requester contact data is stored separately in `blood_request_contacts`.

Direct contact-table access remains denied to anonymous users, ordinary authenticated users, and broad Blood browsing flows. Contact exposure uses `get_authorized_blood_match_contacts` and requires an authorized match status.

## Fulfilment Logic

Only verified donation units contribute to `blood_requests.units_fulfilled`.

- `0` verified units does not fulfil the request.
- `0 < verified units < units_requested` becomes `partially_fulfilled`.
- `verified units >= units_requested` becomes `fulfilled`.

A match, contact authorization, contact attempt, donor confirmation, or reported but unverified donation does not fulfil a request.

## Permissions

Blood access is derived from trusted database state:

- `super_admin`: full Blood Support administration.
- `club_admin`: Blood operational oversight through controlled workflows.
- Blood Department `deputy_head`: donor/request/match operations and contact authorization.
- Blood Department `department_head`: Deputy Head operations, donation verification, and Blood settings.
- Blood Department `executive`: no broad sensitive read access in BB-1.

Core Panel position alone does not grant Blood permissions.

## RLS And RPCs

RLS is enabled on every Blood table. Anonymous users receive no Blood table grants. Authenticated users receive limited SELECT grants only where RLS policies allow Blood operators to read operational records. Contact tables receive no direct client SELECT grants.

Controlled RPCs include donor review, request review, match creation, contact authorization, authorized contact access, donation reporting, donation verification, fulfilment recalculation, and archive operations.

Each RPC reloads trusted permissions through server-side database helpers, validates transitions, writes history/audit records where appropriate, and avoids trusting browser-supplied actor identity.

## Verification

Verification drafts:

- `supabase/drafts/202606240008_bb1_verify.sql`
- `supabase/drafts/202606240008_bb1_security_tests.sql`

Rolled-back workflow tests confirmed:

- reported but unverified donations contribute zero units
- first verified unit partially fulfils a 3-unit request
- second verified unit remains partial
- third verified unit fulfils
- verified units cannot exceed reported units
- suggested matches expose no contact details
- authorized matches expose exactly the related donor/request contact pair

## Deferred BB-2 Work

BB-2 will implement public Blood Request and Donor Interest intake with Server Actions, Zod validation, honeypot, rate limiting/CAPTCHA decision, consent copy, phone normalization, privacy review, and controlled anonymous RPCs.
