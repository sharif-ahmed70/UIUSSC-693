# Legacy to New Field Map

This map is conceptual. Legacy code is not copied.

## `users`

| Legacy field/concept | New destination |
| --- | --- |
| `users.id` | Supabase `auth.users.id` for real staff accounts; optional `blood_donor_profiles.volunteer_profile_id` when a Potential Donor is also a volunteer |
| `name` | `volunteer_profiles.full_name` or `blood_donor_profiles.display_name` |
| `email` | `volunteer_profiles.email`, `blood_donor_contacts.normalized_email` |
| `phone` | `volunteer_profiles.phone`, `blood_donor_contacts.normalized_phone` |
| `password_hash` | Supabase Auth only; never in profile/donor tables |
| `role` | `volunteer_platform_roles.role` or `volunteer_department_memberships.department_role` |
| `status` | `volunteer_profiles.account_status` |

## `donors`

| Legacy field/concept | New destination |
| --- | --- |
| `donors.id` | `blood_donor_profiles.id` |
| `user_id` | optional `blood_donor_profiles.volunteer_profile_id`; external Potential Donor records do not require Auth accounts |
| `uiu_id` | future optional volunteer/profile linkage, not a required donor login |
| `department` | future profile metadata where operationally needed |
| `batch` | deferred unless UIUSSC policy requires it |
| `blood_group` | `blood_donor_profiles.blood_group` |
| `location` | `blood_donor_profiles.area` / `blood_donor_profiles.district` |
| `last_donation_date` | `blood_donor_profiles.self_reported_last_donation_date` until verified donation history exists |
| `is_available` | `blood_donor_profiles.availability_status` |
| `verification_status` | `blood_donor_profiles.verification_status` |
| `admin_remarks` | controlled audit/history notes; do not store sensitive notes in public metadata |

## `blood_requests`

| Legacy field/concept | New destination |
| --- | --- |
| `requester_user_id` | optional profile/auth reference where known; public form can be unauthenticated |
| `patient_name` | avoid unless operationally necessary; use minimized `blood_requests.patient_reference` |
| `patient_problem` | avoid detailed medical history |
| `patient_contact` | `blood_request_contacts.normalized_phone` when operationally necessary |
| `requester_name` | `blood_request_contacts.requester_name` |
| `requester_phone` | `blood_request_contacts.normalized_phone` |
| `requester_student_id` | deferred/minimized |
| `reference_type` | `blood_requests.requester_relationship` or future intake metadata |
| `blood_group` | `blood_requests.blood_group` |
| `units_needed` | `blood_requests.units_requested` |
| missing fulfilled count | `blood_requests.units_fulfilled` |
| `hospital_name` | `blood_requests.hospital_name` |
| `hospital_location` | `blood_requests.hospital_area` |
| `required_datetime` | `blood_requests.needed_at` |
| `emergency_level` | `blood_requests.urgency` |
| `proof_file_url` | deferred private Storage path in later phase |
| `status` | `blood_requests.request_status` plus append-only history |

## `donor_assignments`

| Legacy field/concept | New destination |
| --- | --- |
| `id` | `blood_matches.id` |
| `request_id` | `blood_matches.blood_request_id` |
| `donor_id` | `blood_matches.donor_profile_id` |
| `assigned_by` | `blood_matches.suggested_by` / `reviewed_by` |
| `contact_status` | `blood_matches.match_status`; contact details are exposed only after authorization |
| `donation_status` | `blood_donations.donation_status` |
| `assigned_at` | `blood_matches.created_at` |

## `donation_history`

| Legacy field/concept | New destination |
| --- | --- |
| `donor_id` | `blood_donations.donor_profile_id` |
| `request_id` | `blood_donations.blood_request_id` |
| `donation_date` | `blood_donations.donation_date` |
| `hospital_name` | `blood_donations.hospital_reference` |
| `note` | audit/history reason fields without sensitive contact data |
| missing units | `blood_donations.reported_units` and `blood_donations.verified_units` |
| missing verifier | `blood_donations.verified_by` |
