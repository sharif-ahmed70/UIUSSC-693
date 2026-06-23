# Event Registration Submission Flow

Phase 2D connects event registration on the event detail page to the Supabase development database through a Next.js Server Action.

## Flow

1. `app/events/[slug]/page.tsx` renders event information from existing static event data.
2. Open static events render `components/forms/EventRegistrationForm.tsx`.
3. The form submits the event slug and participant fields to `features/event-registration/actions/submitEventRegistration.ts`.
4. The Server Action validates and normalizes the submitted values.
5. The Server Action resolves the real event record by slug from Supabase and inserts into `event_registrations`.

## Event Slug Resolution

The browser never sends `event_id`. It sends only the event slug from the trusted page prop. The Server Action resolves the database event and uses the database UUID internally.

This prevents a user from changing a hidden event UUID to register against a different event.

## Validation And Normalization

Validation lives in `features/event-registration/schema.ts`.

Normalization lives in `features/event-registration/normalize.ts`.

- Event slugs are trimmed, lowercased, and limited to safe slug characters.
- Names are trimmed and repeated whitespace is collapsed.
- Optional student IDs are uppercased and empty values become `null`.
- Emails are lowercased.
- Bangladesh phone numbers are normalized to `+8801XXXXXXXXX`.
- Optional blood group and motivation values become `null` when empty.
- Motivation is stored as plain text only.

## Open And Closed Event Checks

The event page uses existing static event data to decide whether to render the form or a closed-registration panel.

The Server Action still verifies the database event independently:

- The event must be visible under public RLS.
- The event must have `status = 'published'`.
- The event must have `registration_open = true`.

If static status and database status disagree, the database status wins during submission. This dual-source behavior is temporary until public event content is fully read from Supabase.

## Insert Contract

The action inserts only:

- `event_id`
- `full_name`
- `student_id`
- `email`
- `phone`
- `blood_group`
- `motivation`

It never inserts `id`, `status`, `registered_at`, or `updated_at`.

## Database Protection

The database protects registrations with:

- Row Level Security on `event_registrations`
- Column-level `INSERT` grants for public API roles
- No public `SELECT`, `UPDATE`, or `DELETE` grant
- Database defaults for `status`, `registered_at`, and `updated_at`
- Unique indexes for one email per event and one nonblank student ID per event

## Duplicate Handling

PostgreSQL unique violation code `23505` is mapped to a friendly duplicate message. The application does not expose which index was triggered.

## Closed Event Handling

Closed events are rejected by the Server Action before insert when `registration_open = false`. If the event closes between lookup and insert, RLS blocks the insert and the action maps verified closed-event state to the same friendly closed message.

## Capacity Limitation

The `events.capacity` column exists, but there is no current atomic database-level capacity enforcement trigger or function. This phase does not implement unreliable client-side capacity checks and does not count private registrations through the public client.

For now, `registration_open` remains the authoritative public registration switch. Atomic capacity enforcement should be added later as a database-level enhancement.

## Privacy

The UI does not store participant data in local storage, session storage, or URL parameters. Unexpected failures are logged with safe operation context only, without participant personal data.

## Honeypot

The form includes a hidden `website` field. If it is populated, the action rejects the submission generically. This is a lightweight spam signal only.

## Future Work

Future phases may add CAPTCHA, rate limiting, public event data loading from Supabase, admin attendee management, email notifications, and atomic capacity enforcement.
