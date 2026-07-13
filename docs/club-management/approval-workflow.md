# UIUSSC Approval Workflow

CM-4 introduces a maker-checker foundation for sensitive actions.

## Model

Tables:

- `approval_requests`
- `approval_request_actions`

RPCs:

- `create_approval_request`
- `cancel_approval_request`
- `review_approval_request`
- `execute_approved_request`
- `expire_approval_requests`

## Rules

- Requesters cannot approve their own requests.
- President or Super Admin may review qualifying requests.
- If no eligible President is active, Super Admin remains the fallback.
- Approved requests execute only through explicit allowlisted branches.
- No RPC accepts arbitrary SQL or arbitrary function names.
- Rejected or expired requests cannot execute.
- Every create, review, cancel, and execute step writes audit/history records.

## Initial Supported Actions

CM-4 supports approval foundations for:

- suspend/archive ordinary volunteer profile
- remove department membership
- assign/change Department Head
- assign/change Deputy Head
- complete/revoke official club position
- archive department
- revoke non-Super-Admin platform role
- grant/revoke elevated temporary access

Event cancellation is seeded as a future permission concept, but execution is deferred until CM-5.
## CM-5A Event Cancellation

`events.cancel` is an allowlisted approval action. VP/GS cancellation of approved, published, or active event operations is routed through the existing maker-checker flow. The requester cannot approve or execute their own request. President or Super Admin approval executes the cancellation branch, closes public registration, retains the public event row, and stores the cancellation reason on the operation.
