# Membership Submission Flow

Phase 2B connects the UIUSSC membership form to the Supabase development database through a Next.js Server Action.

## Flow

1. `components/forms/MembershipForm.tsx` renders the existing form UI and submits with `useActionState`.
2. `features/membership/actions/submitMembershipApplication.ts` receives `FormData` on the server.
3. The action normalizes input, validates it with Zod, and inserts only approved membership fields.
4. Supabase stores the row in `membership_applications` with database defaults for status and timestamps.

## Validation

Server-side validation lives in `features/membership/schema.ts`. Client-side required attributes support usability, but the server schema is the source of truth.

The action accepts only:

- `fullName`
- `studentId`
- `department`
- `trimester`
- `email`
- `phone`
- `bloodGroup`
- `interestedDepartment`
- `skills`
- `motivation`
- `website` honeypot

It never inserts `id`, `status`, `admin_notes`, `submitted_at`, `reviewed_at`, or `updated_at`.

## Normalization

Normalization lives in `features/membership/normalize.ts`.

- Text values are trimmed and repeated spaces are collapsed.
- Student IDs are stored uppercase.
- Emails are stored lowercase.
- Bangladesh mobile numbers are stored as `+8801XXXXXXXXX`.
- Empty skills are stored as `null`.

## Supabase Security

The Server Action uses `createServerSupabaseClient()` with the public Supabase URL and publishable key. It does not use a service-role key or secret key.

The database protects submissions with:

- Row Level Security on `membership_applications`
- Column-level `INSERT` grants for public API roles
- No public `SELECT`, `UPDATE`, or `DELETE` grant
- Database defaults for review-only fields

## Duplicate Handling

The database has a normalized unique index for pending applications by student ID. If a duplicate pending application is submitted, the action maps PostgreSQL code `23505` to a friendly duplicate message without exposing constraint names.

## Form States

The client form supports:

- Pending state
- Success message
- Validation summary
- Field-level errors
- Duplicate message
- Generic error message

## Privacy

Submitted information is used only for club membership and volunteer coordination. The UI does not store submitted personal data in local storage or session storage.

## Honeypot

The form includes a hidden `website` field. If it is populated, the action rejects the submission with a generic error. This is a lightweight spam signal only; it is not a substitute for CAPTCHA or rate limiting.

## Future Work

No admin review UI exists yet. Future phases may add CAPTCHA, rate limiting, authenticated review workflows, notification emails, and audit-safe moderation tooling.
