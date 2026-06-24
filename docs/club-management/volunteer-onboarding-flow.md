# UIUSSC Volunteer Onboarding Flow

## CM-3 Review Update

Onboarding submission remains volunteer-facing and pending by default. CM-3 adds administrator review routes and controlled database RPCs for profile approval, rejection, suspension, and restoration. Profile approval does not automatically approve department membership or assign platform roles; department requests are reviewed through separate department-membership actions.

## End-to-End Flow

1. User submits public UIUSSC membership application.
2. Human Resources or authorized admin reviews it.
3. Application is approved or rejected.
4. Approved applicant receives a secure account invitation.
5. User activates or creates a Supabase Auth account.
6. User completes volunteer profile.
7. User selects preferred department.
8. User may request additional departments.
9. Profile remains pending.
10. Department requests remain pending.
11. Authorized administration verifies the user.
12. Admin approves profile.
13. Admin approves department membership.
14. Admin assigns department role.
15. User gains access only to approved department interfaces.
16. Suspended users immediately lose protected access.

## Do Not Do

- Do not create an auth account for every pending membership application.
- Do not generate fake email addresses.
- Do not generate random passwords.
- Do not give staff access immediately after signup.
- Do not trust browser-submitted role/status values.

## Admin Verification Workflow

- Review membership application.
- Verify identity and student information.
- Approve/reject application with reason.
- Invite approved applicant.
- Review submitted profile.
- Approve/reject volunteer profile with reason.
- Assign primary department.
- Approve additional department requests where appropriate.
- Assign department role.
- Assign platform role only when explicitly authorized.
- Record all decisions in history and audit logs.

## Account Status Behavior

- `pending`: may view pending page and own profile only.
- `approved`: may access approved department interfaces.
- `rejected`: no protected access; show safe message.
- `suspended`: no protected access; immediate denial.
- `archived`: no active access; retained for history.

Suspension or archival must invalidate protected staff access at the next server authorization check, regardless of what the browser UI currently shows.

## Dashboard Access

- One approved department: redirect to that department dashboard.
- Multiple approved departments: show `/staff` and department switcher.
- No approved department: show `/staff/no-access`.
- Pending review: show `/staff/pending`.
- Club admin: show `/admin` shortcuts based on trusted roles.

All routing is backed by server-side authorization checks. Client redirects only improve user experience.
