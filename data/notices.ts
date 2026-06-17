import type { Notice } from '@/types'

export const notices: Notice[] = [
  { id: 'n1', title: 'Volunteer Meeting', date: '2026-06-20', category: 'Meeting', priority: 'High', summary: 'All volunteers must attend a briefing in Auditorium A.' },
  { id: 'n2', title: 'Equipment Collection', date: '2026-07-01', category: 'Logistics', priority: 'Medium', summary: 'Drop off donation materials at the club office.' },
  { id: 'n3', title: 'Registration Deadline', date: '2026-06-25', category: 'Deadline', priority: 'High', summary: 'Register for the Blood Donation Campaign before the deadline.' }
]
