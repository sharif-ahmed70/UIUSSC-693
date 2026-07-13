# ADR 003: Donor Records Independent Of Auth Accounts

## Decision

`blood_donors.auth_user_id` is optional.

## Rationale

A donor record should not require a login account, fake email, or generated password. Many donors may be contacted operationally without needing staff-dashboard access.

## Consequences

Donor identity is managed through normalized phone, optional email, optional student ID, consent, verification, and archive status. Duplicate handling needs manual review for edge cases.
