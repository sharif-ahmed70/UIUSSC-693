# ADR 005: Private Proof Storage

## Decision

Blood request proof files use a private Supabase Storage bucket with short-lived signed URLs for authorized staff.

## Rationale

Proof files may contain sensitive requester, patient, or hospital context. Public bucket URLs are not acceptable.

## Consequences

Upload must validate MIME type, extension, and size. Object paths must be randomized. Access should be logged where practical.
