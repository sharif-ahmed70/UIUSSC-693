# Legacy to New Field Map

This map is conceptual. Legacy code is not copied.

## `users`

| Legacy field/concept | New destination |
| --- | --- |
| `users.id` | Supabase `auth.users.id` for real staff accounts; optional `blood_donors.auth_user_id` only when donor has an account |
| `name` | `volunteer_profiles.full_name` or `blood_donors.full_name` |
| `email` | `volunteer_profiles.email`, `blood_donors.normalized_email` |
| `phone` | `volunteer_profiles.phone`, `blood_donors.normalized_phone` |
| `password_hash` | Supabase Auth only; never in profile/donor tables |
| `role` | `volunteer_platform_roles.role` or `volunteer_department_memberships.department_role` |
| `status` | `volunteer_profiles.account_status` |

## `donors`

| Legacy field/concept | New destination |
| --- | --- |
| `donors.id` | `blood_donors.id` |
| `user_id` | optional `blood_donors.auth_user_id`; donor record no longer requires account |
| `uiu_id` | `blood_donors.student_id` |
| `department` | `blood_donors.academic_department` |
| `batch` | `blood_donors.batch` |
| `blood_group` | `blood_donors.blood_group` |
| `location` | `blood_donors.current_area` |
| `last_donation_date` | `blood_donors.last_verified_donation_date` |
| `is_available` | `blood_donors.availability_status` |
| `verification_status` | `blood_donors.verification_status` |
| `admin_remarks` | `blood_donors.private_staff_notes` |

## `blood_requests`

| Legacy field/concept | New destination |
| --- | --- |
| `requester_user_id` | optional profile/auth reference where known; public form can be unauthenticated |
| `patient_name` | `blood_requests.patient_name`, only if operationally necessary |
| `patient_problem` | minimize into `requester_note`; avoid detailed medical history |
| `patient_contact` | `blood_requests.requester_phone` or private operational note if different |
| `requester_name` | `blood_requests.requester_name` |
| `requester_phone` | `blood_requests.requester_phone` |
| `requester_student_id` | `blood_requests.requester_student_id` |
| `reference_type` | `blood_requests.requester_affiliation` |
| `blood_group` | `blood_requests.blood_group` |
| `units_needed` | `blood_requests.units_required` |
| missing fulfilled count | `blood_requests.units_fulfilled` |
| `hospital_name` | `blood_requests.hospital_name` |
| `hospital_location` | `blood_requests.hospital_area` |
| `required_datetime` | `blood_requests.required_at` |
| `emergency_level` | `blood_requests.urgency` |
| `proof_file_url` | `blood_requests.proof_storage_path` |
| `status` | `verification_status` + `workflow_status` |

## `donor_assignments`

| Legacy field/concept | New destination |
| --- | --- |
| `id` | `blood_donor_assignments.id` |
| `request_id` | `blood_donor_assignments.request_id` |
| `donor_id` | `blood_donor_assignments.donor_id` |
| `assigned_by` | `blood_donor_assignments.assigned_by` |
| `contact_status` | `blood_donor_assignments.assignment_status` plus `blood_contact_attempts.result` |
| `donation_status` | `blood_donor_assignments.assignment_status` |
| `assigned_at` | `blood_donor_assignments.assigned_at` |

## `donation_history`

| Legacy field/concept | New destination |
| --- | --- |
| `donor_id` | `blood_donation_history.donor_id` |
| `request_id` | `blood_donation_history.request_id` |
| `donation_date` | `blood_donation_history.verified_donation_date` |
| `hospital_name` | `blood_donation_history.hospital` |
| `note` | `blood_donation_history.note` |
| missing units | `blood_donation_history.units` |
| missing verifier | `blood_donation_history.verified_by` |
