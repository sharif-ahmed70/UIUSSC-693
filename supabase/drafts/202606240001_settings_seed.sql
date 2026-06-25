-- UIUSSC draft settings seed for club management and Blood Support.
-- Do not apply before the draft migration is reviewed and applied.

insert into public.club_departments (name, slug, short_description, display_order)
values
  ('Blood Department', 'blood', 'Coordinates blood requests, donor records, matching, and donation history.', 10),
  ('Event Management', 'event-management', 'Plans and executes club events.', 20),
  ('Volunteer Management', 'volunteer-management', 'Coordinates volunteer pool, assignments, and attendance.', 30),
  ('Logistics', 'logistics', 'Manages resources, transport, and event logistics.', 40),
  ('Graphics Design', 'graphics-design', 'Handles design requests, assets, and creative approvals.', 50),
  ('Public Relations', 'public-relations', 'Handles campaigns, communication, and collaboration records.', 60),
  ('Human Resources', 'human-resources', 'Reviews membership, onboarding, department assignment, and volunteer status.', 70)
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.blood_module_settings (
  setting_key,
  setting_value,
  setting_type,
  validation_schema,
  description,
  requires_medical_review
)
values
  ('request_expiry_hours', '{"value": 72}', 'integer', '{"min": 1, "max": 240}', 'Default expiry window for blood requests.', false),
  ('donor_contact_cooldown_hours', '{"value": 72}', 'integer', '{"min": 1, "max": 720}', 'Minimum gap before contacting the same donor again for a new request.', false),
  ('maximum_donors_per_contact_batch', '{"value": 5}', 'integer', '{"min": 1, "max": 25}', 'Maximum potential donors to contact in one batch.', false),
  ('proof_max_file_size_mb', '{"value": 5}', 'integer', '{"min": 1, "max": 20}', 'Maximum blood request proof upload size.', false),
  ('matching_weights', '{"same_area": 30, "nearby_area": 15, "longer_since_donation": 20, "no_recent_contact": 20, "positive_response_history": 10, "low_assignment_load": 10, "emergency_opt_in": 5}', 'json', '{"required_keys": ["same_area", "nearby_area", "longer_since_donation", "no_recent_contact"]}', 'Explainable ranking weights for potential donor matching.', false),
  ('donation_interval_policy_reference', '{"label": "Operational guideline only", "note": "Final eligibility is determined by hospital or blood-bank medical professionals."}', 'json', '{"requires_review": true}', 'Policy reference, not a medical eligibility claim.', true),
  ('emergency_behavior', '{"prioritize_emergency_opt_in": true, "require_human_review": true}', 'json', '{"required_keys": ["prioritize_emergency_opt_in", "require_human_review"]}', 'Emergency requests still require human Blood Department review.', false)
on conflict (setting_key) do update
set
  setting_value = excluded.setting_value,
  setting_type = excluded.setting_type,
  validation_schema = excluded.validation_schema,
  description = excluded.description,
  requires_medical_review = excluded.requires_medical_review,
  updated_at = now();
