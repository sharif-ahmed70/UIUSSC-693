# Committee Management

The Committee Management system creates yearly UIUSSC committees while reusing the existing official position and position-history architecture.

## Lifecycle

1. Create a draft committee, such as `UIUSSC Executive Committee 2026-27`.
2. Assign leadership members to official club positions.
3. Activate the committee.
4. Operate with the active leadership.
5. Complete the committee when the term ends.
6. Archive the committee when it should be kept only as history.

Only one committee can be active at a time. Activating a new committee archives the previously active committee record so the public site shows only the current leadership.

## History Model

Committee membership is stored in `committee_memberships`.

Each leadership assignment also creates a normal `volunteer_club_positions` row. This keeps the existing position history page authoritative for assignment, ending, transfer, and revocation history.

Historical leadership data is never deleted.

## Leadership Rules

- Core Panel positions are official club positions such as President, Vice President, Assistant Vice President, General Secretary, and Treasurer.
- Department leadership positions use official titles such as Head of Blood, Head of Volunteer, Head of Marketing, and similar department heads.
- Executive Member positions can be assigned to multiple people where the position definition supports it.
- Existing position lifecycle checks prevent duplicate active primary holders.

## Access Model

- Super Admin can fully manage committees.
- President and authorized leadership can view or manage operational committee data through the existing CM-4 permission resolver.
- Department Heads can view committee information according to their existing department and committee access.
- Public visitors can only read the active committee summary through `get_active_committee_public()`.

The UI should describe committee work in human terms: Committee, Members, Positions, and Leadership. It should not expose database ids, permission keys, scopes, policies, or RPC names.

## Public Team Page

The public route `/about/team` shows only the active committee. It uses a limited public summary function instead of exposing volunteer profile tables directly.

## Admin Routes

- `/admin/committees`
- `/admin/committees/[id]`

Admins can create a committee, assign leadership, activate, complete, archive, and end committee member assignments from these pages.
