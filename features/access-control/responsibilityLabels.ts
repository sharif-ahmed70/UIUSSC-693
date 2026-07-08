import type { PermissionPolicySummary } from './types'

type Responsibility = {
  label: string
  detail: string
}

const responsibilityLabels: Record<string, Responsibility> = {
  'event.view': { label: 'View event work', detail: 'Can see event planning information within their assigned area.' },
  'event.create': { label: 'Create events', detail: 'Can start new club event planning records.' },
  'event.update': { label: 'Update events', detail: 'Can update event planning details within their role boundary.' },
  'event.assign_lead': { label: 'Assign event leads', detail: 'Can nominate or assign event leadership when allowed.' },
  'event.assign_department': { label: 'Assign departments to events', detail: 'Can involve departments in event work.' },
  'event.delete': { label: 'Close or remove event records', detail: 'Can perform high-impact event record actions.' },
  'task.view': { label: 'View assigned tasks', detail: 'Can see task work connected to their role.' },
  'task.create': { label: 'Create tasks', detail: 'Can create operational tasks for event or department work.' },
  'task.assign': { label: 'Assign tasks', detail: 'Can assign task work to responsible members.' },
  'task.update': { label: 'Update task progress', detail: 'Can update task details or progress in their area.' },
  'task.review': { label: 'Review submitted work', detail: 'Can review task submissions from volunteers.' },
  'task.complete': { label: 'Complete tasks', detail: 'Can mark task work as completed.' },
  'user.view': { label: 'View member records', detail: 'Can see approved volunteer and staff records.' },
  'user.approve': { label: 'Approve member onboarding', detail: 'Can review and approve volunteer onboarding.' },
  'user.suspend': { label: 'Suspend member access', detail: 'Can temporarily restrict access through the controlled workflow.' },
  'user.manage_roles': { label: 'Manage staff responsibilities', detail: 'Can change staff responsibilities and official access.' },
  'department.view': { label: 'View department work', detail: 'Can see department records and member lists.' },
  'department.manage_members': { label: 'Manage department members', detail: 'Can approve or update department membership.' },
  'department.manage_tasks': { label: 'Manage department tasks', detail: 'Can coordinate department task work.' },
  'content.create': { label: 'Create website content', detail: 'Can prepare website content drafts.' },
  'content.update': { label: 'Update website content', detail: 'Can update website content.' },
  'content.publish': { label: 'Publish website content', detail: 'Can publish public website content.' },
  'committee.view': { label: 'View committee records', detail: 'Can see committee structure and position history.' },
  'committee.create': { label: 'Create committee cycles', detail: 'Can start a new committee cycle.' },
  'committee.manage_positions': { label: 'Manage committee positions', detail: 'Can assign, transfer, end, or restore official positions.' },
  'blood.view': { label: 'View Blood Support work', detail: 'Can see Blood Support records within their role boundary.' },
  'blood.manage_requests': { label: 'Manage blood requests', detail: 'Can review and update Blood Support requests.' },
  'blood.manage_donors': { label: 'Manage donor records', detail: 'Can review and update donor availability records.' },
  'blood.manage_matches': { label: 'Coordinate donor matches', detail: 'Can manage donor matching for Blood Support requests.' },
  'blood.assign_executives': { label: 'Assign Blood follow-up', detail: 'Can assign Blood executives to request follow-up work.' },
  'blood.verify_donation': { label: 'Verify donations', detail: 'Can verify completed donation records.' },
  'finance.budget_manage': { label: 'Prepare budget records', detail: 'Can manage budget planning information.' },
  'finance.expense_view': { label: 'View expense records', detail: 'Can view finance and expense information.' },
  'finance.request_approve': { label: 'Review finance requests', detail: 'Can review financial requests when required.' },
  'approval_requests.review': { label: 'Review special requests', detail: 'Can review temporary or exceptional access requests.' },
  'access_grants.view': { label: 'View special access changes', detail: 'Can review temporary access changes.' },
}

const responsibilityGroups: Responsibility[] = [
  { label: 'Manage staff responsibilities', detail: 'Assign or change official website responsibilities.' },
  { label: 'Approve member onboarding', detail: 'Review and approve volunteer onboarding.' },
  { label: 'Manage committee positions', detail: 'Assign, transfer, end, or restore official club positions.' },
  { label: 'Manage events', detail: 'Create, update, and coordinate event operations.' },
  { label: 'Manage department tasks', detail: 'Coordinate task work inside an assigned department.' },
  { label: 'Manage blood requests', detail: 'Review, assign, and update Blood Support requests.' },
  { label: 'Coordinate donor matches', detail: 'Match donors with approved Blood Support requests.' },
  { label: 'Publish website content', detail: 'Publish public website updates.' },
  { label: 'Review finance requests', detail: 'Review budget or finance requests.' },
]

export function getResponsibility(policy: PermissionPolicySummary): Responsibility {
  return responsibilityLabels[policy.permissionKey] ?? {
    label: policy.permissionName,
    detail: 'Can perform this responsibility when assigned by the club.',
  }
}

export function getCanDoList(sources: Array<{ permissions: PermissionPolicySummary[] }>): Responsibility[] {
  const byLabel = new Map<string, Responsibility>()

  sources.flatMap((source) => source.permissions).forEach((policy) => {
    const responsibility = getResponsibility(policy)
    byLabel.set(responsibility.label, responsibility)
  })

  return Array.from(byLabel.values()).sort((a, b) => a.label.localeCompare(b.label))
}

export function getCannotDoList(canDo: Responsibility[]): Responsibility[] {
  const allowedLabels = new Set(canDo.map((item) => item.label))
  return responsibilityGroups.filter((item) => !allowedLabels.has(item.label))
}

export function formatResponsibilitySource(source: string): string {
  if (source.startsWith('Platform role:')) {
    return `Website responsibility: ${toTitleCase(source.replace('Platform role:', '').trim().replaceAll('_', ' '))}`
  }

  if (source.startsWith('Club position:')) {
    return `Official position: ${source.replace('Club position:', '').trim()}`
  }

  return source.replace(': department_head', ': Department Head').replace(': deputy_head', ': Deputy Head').replace(': executive', ': Executive')
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
