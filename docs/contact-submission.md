# Contact Submission Flow

Phase 2C connects the UIUSSC contact form to the Supabase development database through a Next.js Server Action.

## Flow

1. `components/forms/ContactForm.tsx` renders the contact form and submits with `useActionState`.
2. `features/contact/actions/submitContactMessage.ts` receives the `FormData` on the server.
3. The action normalizes input, validates it with Zod, and inserts only allowed contact fields.
4. Supabase stores the row in `contact_messages` with database defaults for status and timestamps.

## Validation

Server-side validation lives in `features/contact/schema.ts`. Browser required fields are only a usability aid.

The action accepts:

- `name`
- `email`
- `subject`
- `message`
- `website` honeypot

It inserts only:

- `name`
- `email`
- `subject`
- `message`

It never inserts `id`, `status`, `created_at`, or `updated_at`.

## Normalization

Normalization lives in `features/contact/normalize.ts`.

- Name and subject are trimmed and repeated whitespace is collapsed.
- Email is trimmed and lowercased.
- Message text is trimmed while preserving meaningful line breaks.
- The message is stored as plain text. It is not interpreted as HTML or Markdown.

## Supabase Security

The Server Action uses the existing publishable-key-backed server Supabase client. It does not use a service-role key or secret key.

The database protects contact messages with:

- Row Level Security on `contact_messages`
- Column-level `INSERT` grants for public API roles
- No public `SELECT`, `UPDATE`, or `DELETE` grant
- Database defaults for `status`, `created_at`, and `updated_at`

## Form States

The client form supports:

- Pending state
- Success message
- Field-level validation errors
- Generic error message

Unexpected database or network failures are logged server-side with only a safe operation label and safe error code/message.

## Privacy

The UI does not store contact submissions in local storage, session storage, or query parameters. Submitted content is intended only for UIUSSC communication follow-up.

## Honeypot

The form includes a hidden `website` field. If it is populated, the action rejects the submission with a generic error. This is a lightweight spam signal only.

## Future Work

No admin inbox UI exists in this phase. Future phases may add CAPTCHA, rate limiting, authenticated admin review, and email notifications.
