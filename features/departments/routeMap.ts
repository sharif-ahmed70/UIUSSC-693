import type { KnownDepartmentSlug } from './types'

export const departmentRouteMap: Record<KnownDepartmentSlug, string> = {
  blood: '/staff/blood',
  'event-management': '/staff/events',
  'volunteer-management': '/staff/volunteers',
  logistics: '/staff/logistics',
  'graphics-design': '/staff/graphics',
  'public-relations': '/staff/public-relations',
  'human-resources': '/staff/human-resources',
}

export const departmentFutureCapabilities: Record<KnownDepartmentSlug, string[]> = {
  blood: ['Blood request queue', 'Potential donor matching', 'Contact attempts', 'Assignments', 'Donation history'],
  'event-management': ['Event planning', 'Task assignment', 'Timeline', 'Venue coordination'],
  'volunteer-management': ['Volunteer pool', 'Attendance', 'Event assignment', 'Coordination'],
  logistics: ['Inventory', 'Transport', 'Resource allocation', 'Logistics tasks'],
  'graphics-design': ['Design requests', 'Task queue', 'Asset submission', 'Approval workflow'],
  'public-relations': ['Campaign communication', 'Collaboration records', 'Publicity tasks'],
  'human-resources': ['Volunteer review', 'Department assignment', 'Status management', 'Attendance and performance workflows'],
}
