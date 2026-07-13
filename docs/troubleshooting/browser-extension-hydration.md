# Browser Extension Hydration Warning

## Affected Route

`/membership`

## Observed Attributes

The reported warning referenced attributes that are not present in the React source or server-rendered HTML:

- `data-temp-mail-org`
- injected inline `background-image` using a data URL

These are consistent with browser extension DOM mutation, especially email/privacy/temp-mail extensions that decorate form fields.

## Verification Result

Server-rendered `/membership` HTML was checked and did not contain `data-temp-mail-org` or injected data-URL background styles.

An extension-free clean Chromium run produced:

- hydration warning count: `0`
- injected attribute match count: `0`
- page error count: `0`

Temporary output was stored under `.tmp/ui-qa/cm3-live/` and is intentionally ignored by Git.

## How To Recheck

Use an extension-free browser context:

- Chrome Incognito with extensions disabled, or
- a temporary Chrome profile, or
- Playwright/clean Chromium.

Then open:

`http://localhost:3000/membership`

If the warning appears only in the normal browser profile, disable the extension for `localhost`.

## Why Broad Suppression Is Rejected

The mismatch is not an application-data mismatch. Adding `suppressHydrationWarning` to `<html>`, `<body>`, the page, or the whole form would hide real future hydration bugs. No suppression was added because the clean browser result is stable.
