# Public Content From Supabase

Phase 2E makes Supabase the source of truth for public UIUSSC events, notices, and gallery content.

## Source Of Truth

The static files for public events, notices, and gallery items were removed after all imports were migrated. Public content now comes from the deployed Supabase development database.

Unrelated static content remains local, including about content, impact statistics, contact cards, membership options, and event filter labels.

## Generated Types

`types/supabase.ts` is generated from the linked Supabase development project with the official Supabase CLI. Application code imports the generated `Database` type for typed clients and table rows.

## Public Supabase Client

`lib/supabase/public.ts` creates a server-only, stateless Supabase client using the public URL and publishable key.

It disables session persistence and token refresh because public content queries do not depend on user sessions. It does not use service-role or secret keys.

## Query Architecture

Each public entity has a focused feature folder:

- `features/events`
- `features/notices`
- `features/gallery`

Each feature separates:

- application-facing camelCase types
- pure database-row mappers
- Supabase query functions

Page files do not contain raw Supabase query chains.

## Events

Events are queried from published `events` rows only. Event cards and details use camelCase `PublicEvent` models.

Event details resolve by slug and call `notFound()` when no published event exists. Metadata is generated from the same public lookup where possible.

Registration forms render only when the database `registration_open` value is true. The registration Server Action still rechecks the event independently.

## Notices

Notices are queried from published `notices` rows only, ordered by pinned status and publish date. Pinned notices remain visually distinct.

## Gallery

Gallery items are queried from published `gallery_items` rows only, ordered by display order and publish date.

Image URLs are treated conservatively. Local paths and HTTPS URLs are allowed. Missing or unsafe image URLs render a professional gradient fallback. No wildcard remote image host is configured.

## Homepage

The homepage fetches upcoming published events and a small gallery preview independently. If either query fails, the other content can still render.

## Rendering Strategy

Public Supabase pages are rendered dynamically with a stateless public client. This avoids stale admin content during development and prevents build-time availability from depending on remote public queries.

Private submission flows are not cached.

## RLS Protection

Public RLS permits `SELECT` only for published events, notices, and gallery items. Private intake tables remain unreadable to public clients.

The application also filters for `status = 'published'`, but RLS remains the final security layer.

## Empty And Error States

Reusable `ContentUnavailable` and `EmptyState` components provide friendly messages without database terminology or raw errors.

## Future Work

Future phases should add an authenticated admin publishing workflow, cache invalidation or conservative revalidation, richer media management, and production-ready content moderation.
