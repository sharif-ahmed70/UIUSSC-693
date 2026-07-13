# NC-1 Notification System

NC-1 adds a reusable in-app notification foundation for UIUSSC platform workflows.

## Product Language

Notifications must be short, clear, and useful:

- "You have been assigned a new task."
- "A request needs your review."
- "Your committee role changed."

They must not expose permission keys, database terms, internal event names, or RPC names.

## Data Model

`notifications` stores user-owned in-app notifications:

- recipient profile
- title
- message
- category
- priority
- related module and record
- action URL
- read/unread state

`notification_preferences` stores per-member preferences for:

- Event updates
- Task updates
- Blood alerts
- Committee updates
- Approval updates
- System updates

Email, push, and SMS flags are included for future expansion but are not implemented in NC-1.

## Categories

- EVENT
- TASK
- BLOOD
- COMMITTEE
- APPROVAL
- SYSTEM

## Trigger Points

NC-1 integrates with existing workflows:

- Task assignment creates a task notification for the assigned member.
- Approval request creation notifies Super Admins and the active President.
- Approval review notifies the requester.
- Committee assignment notifies the selected leader.
- Blood request executive assignment notifies the assigned Blood executive.
- Donor match creation notifies Blood leadership.
- Critical public Blood requests notify Blood leadership.

The notification system does not replace audit logs. Audit logs remain the durable administrative record.

## Security

- Users can read only their own notifications.
- Users can update only their own notification preferences.
- Clients cannot directly insert notifications.
- Workflow RPCs create notifications through `send_notification`.
- Anonymous users cannot read internal notification rows.

## UI

The notification center is available at:

```text
/notifications
```

The navbar shows a notification bell with unread count. The notification center supports:

- notification list
- read/unread status
- mark one as read
- mark all as read
- preference updates

## Future Expansion

The schema is ready for email, push, and SMS preferences. Those channels should be implemented through a background delivery service later, not directly from frontend code.
