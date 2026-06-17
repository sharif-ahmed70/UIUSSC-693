# UIUSSC Database Schema

This document describes the Phase 2A Supabase foundation for the United International University Social Services Club website. It covers the first versioned schema, public/private access boundaries, and future integration notes.

## Scope

Phase 2A adds database structure, security policies, seed data, and Supabase clients only. It does not connect existing frontend forms, replace static frontend data, add authentication, or add an admin dashboard.

## Tables

### events

Stores club events such as blood donation campaigns, donation drives, orientations, campaigns, workshops, and other programs.

Key fields:
- `slug` is unique and preserves current frontend route compatibility.
- `status` controls public visibility.
- `registration_open` controls whether public event registration inserts are allowed.
- `capacity` is optional and must be greater than zero when provided.

### notices

Stores public club announcements, deadlines, logistics notices, and meeting updates.

Key fields:
- `slug` is unique.
- `priority` supports `normal`, `important`, and `urgent`.
- `is_pinned` marks notices that should be promoted in the UI.
- `status` controls public visibility.

### gallery_items

Stores public gallery records and image metadata.

Key fields:
- `event_id` optionally links a gallery item to an event.
- `display_order` controls presentation order and must be zero or greater.
- `status` controls public visibility.

### membership_applications

Private intake table for future membership applications.

Key fields:
- `student_id` is used for duplicate pending application protection.
- `status` tracks review progress.
- `admin_notes` is private and not publicly readable.
- A partial unique index prevents multiple pending applications for the same normalized student ID.

### contact_messages

Private intake table for future contact form submissions.

Key fields:
- `status` tracks message handling from unread to archived.
- No public read access is granted.

### event_registrations

Private intake table for future event interest and volunteer registrations.

Key fields:
- `event_id` links registrations to events.
- `status` tracks registration workflow.
- Unique indexes prevent duplicate registrations by normalized email per event and by normalized student ID per event when student ID is present.

## Relationship Summary

```text
events
-> gallery_items
-> event_registrations
```

`gallery_items.event_id` references `events.id` and is set to null if an event is deleted.

`event_registrations.event_id` references `events.id` and is deleted when the parent event is deleted.

Membership applications and contact messages are independent private intake tables.

## Public Versus Private Tables

Public content tables:
- `events`
- `notices`
- `gallery_items`

Private intake tables:
- `membership_applications`
- `contact_messages`
- `event_registrations`

Public content tables expose only rows where `status = 'published'`.

Private intake tables allow constrained public inserts only. They do not expose public select, update, or delete access.

RLS controls which rows a role may read or write. Column-level grants control which fields a role is allowed to supply. Both are required for private intake safety: public clients can create allowed rows, but cannot set internal workflow fields such as statuses, timestamps, review notes, or primary keys.

## Public Column-Level Insert Permissions

Public roles may insert only the following columns on private intake tables.

### membership_applications

Allowed public insert columns:
- `full_name`
- `student_id`
- `department`
- `trimester`
- `email`
- `phone`
- `blood_group`
- `interested_department`
- `skills`
- `motivation`

System-managed or private columns:
- `id`
- `status`
- `admin_notes`
- `submitted_at`
- `reviewed_at`
- `updated_at`

The database supplies `id`, `status = 'pending'`, `submitted_at`, and `updated_at`.

### contact_messages

Allowed public insert columns:
- `name`
- `email`
- `subject`
- `message`

System-managed columns:
- `id`
- `status`
- `created_at`
- `updated_at`

The database supplies `id`, `status = 'unread'`, `created_at`, and `updated_at`.

### event_registrations

Allowed public insert columns:
- `event_id`
- `full_name`
- `student_id`
- `email`
- `phone`
- `blood_group`
- `motivation`

System-managed columns:
- `id`
- `status`
- `registered_at`
- `updated_at`

The database supplies `id`, `status = 'registered'`, `registered_at`, and `updated_at`.

## RLS Access Matrix

| Table | Public SELECT | Public INSERT | Public UPDATE | Public DELETE | Column Restrictions |
| --- | --- | --- | --- | --- | --- |
| events | Published rows only | No | No | No | N/A |
| notices | Published rows only | No | No | No | N/A |
| gallery_items | Published rows only | No | No | No | N/A |
| membership_applications | No | Pending only | No | No | Public intake fields only |
| contact_messages | No | Unread only | No | No | Public message fields only |
| event_registrations | No | Registered only for published open events | No | No | Public registration fields only |

## Status Workflows

### events

`draft -> published -> completed -> archived`

Events may also move to `cancelled` when a planned event is withdrawn.

### notices

`draft -> published -> archived`

### gallery_items

`draft -> published -> archived`

### membership_applications

`pending -> approved`

Other possible terminal states:
- `rejected`
- `waitlisted`
- `withdrawn`

### contact_messages

`unread -> read -> replied -> archived`

### event_registrations

`registered -> selected -> attended`

Other possible states:
- `waitlisted`
- `cancelled`
- `rejected`

## Why Seed Data Is Separate

The migration defines durable schema, constraints, indexes, grants, triggers, and RLS policies.

`supabase/seed.sql` is separate so sample content can be loaded, updated, or skipped independently. This keeps production schema evolution separate from public placeholder content.

The seed file includes only public content:
- sample events
- sample notices
- gallery placeholder records

It does not seed membership applications, contact messages, or event registrations.

## Future Admin/Auth Integration Notes

Phase 2A intentionally does not create admin policies, authentication flows, middleware, or dashboard features.

Future phases can add:
- Supabase Auth integration
- role-based admin access
- admin-only RLS policies
- admin dashboard screens
- server actions or route handlers for validated form submission
- storage buckets for real event and gallery images

Admin policies should be added only after the auth and role model is finalized. Service-role keys must remain server-only and must never be exposed in browser code or committed to the repository.
