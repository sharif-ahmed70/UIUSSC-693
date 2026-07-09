export type VolunteerDashboardModule = 'attendance' | 'tasks' | 'events' | 'committee' | 'blood' | 'notifications'

export type VolunteerDashboardEvent = {
  attendanceEventId: string | null
  departmentId: string
  departmentName: string
  eventId: string | null
  title: string
  eventDate: string
  eventKind: string
  location: string | null
  status: string
  source: string
}

export type VolunteerAttendanceMember = {
  attendanceRecordId: string | null
  volunteerProfileId: string
  serialNumber: number
  pictureUrl: string | null
  fullName: string
  studentId: string | null
  memberType: 'General' | 'Panel'
  attendanceStatus: 'unmarked' | 'present' | 'absent'
  remarks: string | null
  boothRecords: BoothAttendanceRecord[]
}

export type BoothAttendanceRecord = {
  id: string
  location: string
  timeslot: string
  startsAt: string | null
  endsAt: string | null
  status: 'present' | 'absent'
  remarks: string | null
  recordedAt: string
}

export type VolunteerMetrics = {
  totalMembers: number
  presentCount: number
  absentCount: number
  unmarkedCount: number
  mostActiveMember: string | null
  mostIrregularMember: string | null
}

export type VolunteerDashboardTask = {
  taskId: string
  taskName: string
  assignedTo: string
  status: string
  priority: string
  progressPercent: number
  deadline: string | null
}

export type CommitteeMemberOverview = {
  committeeId: string
  committeeName: string
  sessionLabel: string
  committeeStatus: string
  memberName: string
  positionName: string
  memberStatus: string
  startDate: string | null
  endDate: string | null
}

export type BloodAssignmentOverview = {
  assignmentId: string
  requestId: string
  actionLabel: string | null
  assignmentStatus: string
  assignedTo: string
  bloodGroup: string
  hospitalName: string
  neededAt: string
  dueAt: string | null
}

export type VolunteerDashboardNotification = {
  id: string
  title: string
  body: string
  category: string
  severity: string
  targetUrl: string | null
  createdAt: string
}

export type VolunteerDashboardData = {
  department: {
    id: string
    name: string
    slug: string
  }
  canManageAttendance: boolean
  events: VolunteerDashboardEvent[]
  selectedEvent: VolunteerDashboardEvent | null
  members: VolunteerAttendanceMember[]
  metrics: VolunteerMetrics
  tasks: VolunteerDashboardTask[]
  committeeMembers: CommitteeMemberOverview[]
  bloodAssignments: BloodAssignmentOverview[]
  notifications: VolunteerDashboardNotification[]
}
