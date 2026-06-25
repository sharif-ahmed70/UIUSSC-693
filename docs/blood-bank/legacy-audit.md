# UIUSSC Legacy Blood Bank Audit

Source reviewed: `.reference/extracted-blood-bank/UIUSSC Blood Bank/`

The legacy project is useful as a workflow reference only. It is a Vite/React frontend plus Express/MySQL backend. It should not be patched into the current UIUSSC Next.js/Supabase platform.

## Legacy Architecture

- Backend entry point: `backend/server.js`
- Database connection: `backend/config/db.js`
- Auth controller: `backend/controllers/authController.js`
- Donor controller: `backend/controllers/donorController.js`
- Blood request controller: `backend/controllers/requestController.js`
- Assignment controller: `backend/controllers/assignmentController.js`
- Dashboard controller: `backend/controllers/dashboardController.js`
- Middleware: `backend/middleware/authMiddleware.js`, `backend/middleware/roleMiddleware.js`
- Frontend routes: `frontend/src/App.jsx`
- API client: `frontend/src/api/axios.js`
- Protected-route component: `frontend/src/components/ProtectedRoute.jsx`

The backend exposes `/api/auth`, `/api/donors`, `/api/requests`, `/api/assignments`, `/api/dashboard`, and a public `/db-test` endpoint. The frontend stores JWT and user JSON in localStorage and routes by client-side role checks.

## Features Found

- User registration/login with donor/requester roles.
- Donor profile creation.
- Admin/volunteer donor creation and donor editing.
- Bulk CSV/XLS/XLSX donor import.
- Blood request submission for authenticated requesters.
- Requester dashboard with request and assigned donor details.
- Admin request list and status updates.
- Matching by exact blood group, availability, verification status, fixed donation interval, and basic location text matching.
- Donor assignment.
- Assignment status update.
- Donation history insertion when an assignment is marked donated.
- Basic dashboard statistics.

## Critical Security Findings

- `.env` exists inside the legacy ZIP at `backend/.env`; values were not extracted or printed.
- `.git/` exists inside the ZIP, which can expose history and remote metadata.
- `node_modules/` exists inside the ZIP, making the archive large and non-reproducible.
- `backend/server.js` uses unrestricted `cors()`.
- `backend/server.js` exposes public `/db-test`, including database success/failure details.
- Many controllers return `error.message` to clients, leaking raw backend/database errors.
- `backend/controllers/authController.js` signs custom JWTs with user role embedded in the token.
- `backend/middleware/authMiddleware.js` trusts JWT content without checking current account state from the database on every request.
- `backend/middleware/roleMiddleware.js` authorizes from `req.user.role`; there is no trusted department membership model.
- No rate limiting was found for login, registration, request submission, donor import, or status updates.
- No centralized Zod/schema validation was found.
- No password reset flow was found.
- No email verification flow was found.
- Logout only removes localStorage; there is no token revocation strategy.
- `frontend/src/pages/Login.jsx` contains prefilled admin credentials.
- `frontend/src/api/axios.js` stores/uses JWT from localStorage.
- `frontend/src/components/ProtectedRoute.jsx` trusts localStorage user role for client routing.
- `frontend/src/api/axios.js` hard-codes `http://localhost:5000/api`.

## Data-Integrity Findings

- No complete schema or migration set was found in the extracted backend; `backend/sql/` exists as a folder but no SQL files were extracted.
- Multi-step donor creation creates a user row and donor row without a transaction.
- Donor update changes `users` and `donors` without a transaction.
- Donor delete removes donation history, assignments, donors, and users with hard deletes and no transaction.
- Assignment creates an assignment, updates request status, and updates donor availability without a transaction.
- Donation completion inserts history, updates donor availability/date, and marks the entire request completed without a transaction.
- Pagination is missing on donor, request, assignment, and dashboard queries.
- `units_needed` exists, but there is no `units_fulfilled` handling.
- One donated assignment marks the entire request completed, even for multi-unit requests.
- Status transition validation is shallow; arbitrary allowed statuses can be set without enforcing workflow order.
- Soft delete/archive strategy is missing.
- Audit logging is missing.
- Notification queue/outbox is missing.

## Workflow Bugs

- Assignment creation immediately sets `contact_status` to `contacted`, even before a contact attempt is recorded.
- Donor is made unavailable immediately after assignment, before donor consent.
- Requester dashboard joins donor details and can expose donor phone/email too early.
- Partial fulfilment is missing.
- Same donor concurrency is not protected beyond a basic duplicate check for the same request.
- Matching ignores recent donor contact attempts, decline/unreachable history, and active assignment load.
- Matching uses basic free-text location matching.
- The UI and backend use “eligible” based on a hard-coded donation interval. The safer term is “potential donor”; final eligibility must be determined by medical professionals.
- Expired requests are not automatically handled.
- Emergency request abuse prevention is missing.
- Proof upload is incomplete: request form sends a `proof_file_url`, but no secure private upload flow was found.

## Bulk Import Risks

- `parseVerificationStatus` defaults invalid values to `approved`.
- Imported donors are inserted row-by-row without transaction/batch safety.
- Duplicate checks cover email and UIU ID but not normalized phone.
- Duplicate checks do not normalize email/UIU ID robustly.
- Malformed dates become `null` silently.
- Missing donor email creates fake `@uiussc.local` email.
- Fake random passwords are generated.
- Imported donors may become approved automatically.
- File validation trusts MIME type or extension; no content signature validation.
- No dry-run preview or confirmation step.
- No importer audit log.

## Privacy Risks

- Donor contact details are shown in donor lists, matching, assignments, and requester dashboard.
- There is no public/private route/data separation strong enough for donor records.
- Public donor directory is not present, but staff routes are too broad.
- Proof files are not stored in private Supabase Storage with signed URLs.
- Patient medical/problem fields are collected without retention or minimization policy.
- No consent/opt-out model for donor contact beyond basic availability.
- No audit when donor records/contact details are viewed.

## Frontend Issues

- Vite/React app is disconnected from current Next.js app.
- localStorage token/user storage increases XSS blast radius.
- Client-side role gate is advisory only.
- Admin and volunteer are treated almost identically in routing.
- Login form ships with prefilled admin values.
- Request and donor routes require login, while the desired UIUSSC flow needs safe public request/donor-interest forms.
- Form validation is duplicated in components and not shared with the server.
- Dashboard and table pages lack pagination.

## Backend Issues

- Custom password/JWT system should be replaced by Supabase Auth.
- MySQL connection logic should not be reused.
- No RLS, column-level grants, or database-backed authorization.
- Role middleware does not understand departments.
- Raw SQL queries are parameterized for many values, but the application lacks normalized constraints and transaction boundaries.
- `volunteer` role can perform admin-like donor CRUD/import/assignment operations.
- Static `/uploads` folder is public.

## Git and Project Hygiene

- ZIP contains `.git/`, `.env`, `node_modules/`, package locks, and donor-like CSV sample data.
- Extracted reference is kept under ignored `.reference/`.
- The extracted donor CSV was removed from the working extraction.
- No legacy secret values were printed, copied, or reused.
- Direct code reuse is rejected because the architecture conflicts with the current Next.js/Supabase/RLS design and has unresolved security, privacy, and data-integrity problems.

## Additional Issues Found

- Dashboard stats are global and not scoped by department.
- No admin action reason fields.
- No reviewer/approver history.
- Hard deletes make incident review difficult.
- `admin_remarks` can contain sensitive notes with no structured retention/access model.
- No Bangladesh phone normalization.
- No captcha/rate-limiting strategy for public forms.
