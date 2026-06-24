export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
export type OnboardingStatus = 'profile_incomplete' | 'submitted' | 'under_review' | 'approved' | 'rejected'
export type MembershipStatus = 'requested' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'removed'
export type DepartmentRole = 'volunteer' | 'coordinator' | 'department_head'
export type PlatformRole = 'super_admin' | 'club_admin' | 'membership_admin' | 'content_admin' | 'department_admin'

export type StaffDepartment = {
  id: string
  name: string
  slug: string
  shortDescription: string | null
}

export type StaffMembership = {
  id: string
  status: MembershipStatus
  role: DepartmentRole
  isPrimary: boolean
  requestedAt: string
  approvedAt: string | null
  department: StaffDepartment
}

export type StaffClubPosition = {
  id: string
  status: string
  isPrimary: boolean
  termStart: string
  termEnd: string | null
  position: {
    id: string
    name: string
    slug: string
    isCorePanel: boolean
  }
}

export type StaffProfile = {
  id: string
  fullName: string
  studentId: string | null
  email: string
  phone: string | null
  academicDepartment: string | null
  trimester: string | null
  bloodGroup: string | null
  accountStatus: AccountStatus
  onboardingStatus: OnboardingStatus
  primaryDepartmentId: string | null
}

export type StaffAccessContext = {
  userId: string | null
  email: string | null
  profile: StaffProfile | null
  approvedMemberships: StaffMembership[]
  pendingMemberships: StaffMembership[]
  clubPositions: StaffClubPosition[]
  primaryClubPosition: StaffClubPosition | null
  platformRoles: PlatformRole[]
  primaryMembership: StaffMembership | null
  recommendedDestination: string
}
