# UIUSSC Staff Invitations And Accounts

CM-4 creates an invitation-intent model. It does not send emails directly.

## Tables

- `staff_invitations`
- `staff_invitation_department_scopes`

Invitation statuses include:

- `draft`
- `ready`
- `sent`
- `accepted`
- `expired`
- `cancelled`
- `failed`
- `operator_assisted`

## Operator-Assisted Delivery

Secure invitation delivery is not configured yet. The admin UI truthfully shows operator-assisted mode and instructs administrators to use a secure Supabase Dashboard invite flow.

The database does not store:

- passwords
- invite tokens
- access tokens
- refresh tokens
- cookies
- service-role secrets

## Intent Is Not Access

Invitation intent can record:

- intended platform role
- intended club position
- intended department role scopes

These are not automatically granted. After the invited person accepts Auth and completes onboarding, profile approval, platform-role assignment, club-position assignment, and department membership approval remain separate controlled workflows.

## Password Ownership

The invited user owns their password through Supabase Auth. Super Admins never know or store staff passwords.
