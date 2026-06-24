# Phase CM-2: Auth and Volunteer Onboarding

Phase CM-2 adds the secure staff authentication and onboarding foundation for the UIUSSC club-management area.

## Authentication Model

UIUSSC uses Supabase Auth with email and password. Staff sessions are stored through Supabase SSR cookies, refreshed in `proxy.ts`, and validated server-side before protected staff pages render.

There is no public staff signup. Public visitors can apply through `/membership`; staff accounts are expected to be invited or activated later by authorized administration.

## Login Flow

`/login` accepts email and password only. The sign-in Server Action validates input with Zod, normalizes email, uses `signInWithPassword`, and returns a generic invalid-credentials message. It never displays Supabase internals, account existence hints, passwords, tokens, or raw API errors.

After sign-in, the server loads the trusted staff access context and sends the user to the correct staff destination.

## Password Recovery

`/forgot-password` sends a Supabase password-recovery email with a safe callback URL. The page always returns a generic success message.

`/reset-password` updates the password only when a valid recovery session exists. Password values are never logged or placed in URLs.

## Callback Flow

`/auth/callback` exchanges a Supabase auth code for a cookie-backed session. It supports invite, verification, and recovery links, validates the internal `next` destination, and rejects open redirects.

## Cookie And Proxy Responsibilities

`proxy.ts` calls `lib/supabase/proxy.ts` for session refresh and claim validation. It also forwards the current pathname to server layouts through a request header. Proxy does not perform expensive database role queries.

Protected pages and Server Actions remain responsible for authorization.

## Authorization Responsibilities

`features/staff/queries/getStaffAccessContext.ts` loads the authenticated user, own volunteer profile, own department memberships, own active platform roles, and a recommended destination. It returns only minimal user-facing profile and access fields.

`lib/auth/authorization.ts` contains server-only helpers for profile, approved-volunteer, department membership, department role, platform role, and department access checks.

## Routing Matrix

- No authenticated user: `/login`
- Authenticated user with no profile: `/staff/onboarding`
- Incomplete profile: `/staff/onboarding`
- Submitted or under-review profile: `/staff/pending`
- Rejected, suspended, or archived profile: `/staff/access-status`
- Approved profile with no approved active department: `/staff/no-access`
- One approved department: that department workspace from `/staff`
- Multiple approved departments: `/staff`
- Club admin or super admin: `/staff`

Routing is based on trusted profile, membership, department, and platform-role rows, not client-submitted role data.

## Onboarding Workflow

`/staff/onboarding` loads active departments from the database and collects only safe profile fields:

- full name
- student ID
- email
- phone
- academic department
- trimester
- optional blood group
- preferred UIUSSC department
- accuracy/coordination consent

Submission uses the controlled `submit_volunteer_onboarding` RPC. The RPC requires `auth.uid()`, matches the submitted email to the authenticated email claim, updates or creates only the caller's own profile, creates or updates a primary department request as `volunteer/requested`, and prevents self-approval or role escalation.

## Department Switcher And Workspaces

The staff shell shows a keyboard-accessible department switcher for approved memberships only. It changes navigation only; it never changes database roles, membership status, or trusted permissions.

Protected placeholders exist for:

- Blood Department
- Event Management
- Volunteer Management
- Logistics
- Graphics Design
- Public Relations
- Human Resources

Operational tools for those departments are deferred.

## Deferred Work

- final admin approval dashboard
- invitation sender
- staff account creation workflow
- final Blood Support database
- donor/request management
- department operational modules

## Deployment Redirect URL Requirements

Supabase Auth redirect URLs should allow:

- local development origin with `/auth/callback`
- deployed site origin with `/auth/callback`
- recovery redirect through `/auth/callback?next=/reset-password`

## Testing Limitations

No disposable authenticated development user was created in this phase. Live authenticated onboarding/login flows should be tested later with a pre-approved disposable development account. Structural build checks, migration verification, public-route checks, and unauthenticated staff redirects are covered.
