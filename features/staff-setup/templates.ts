export type StaffSetupTemplateKey =
  | 'president'
  | 'vice-president'
  | 'assistant-vice-president'
  | 'general-secretary'
  | 'treasurer'
  | 'head-blood'
  | 'head-volunteer'
  | 'deputy-volunteer'
  | 'head-marketing'
  | 'deputy-marketing'
  | 'head-logistics'
  | 'deputy-logistics'
  | 'head-event-management'
  | 'deputy-event-management'
  | 'head-graphics'
  | 'head-public-relations'
  | 'deputy-public-relations'
  | 'executive-member-blood'
  | 'executive-member-volunteer-management'
  | 'executive-member-marketing'
  | 'executive-member-logistics'
  | 'executive-member-event-management'
  | 'executive-member-graphics-creative'
  | 'executive-member-public-relations'
  | 'executive-member-general-support'

export type StaffSetupTemplateGroup = 'Core Executive Leadership' | 'Department Leadership' | 'Executive Members'

export type StaffSetupTemplate = {
  key: StaffSetupTemplateKey
  group: StaffSetupTemplateGroup
  title: string
  description: string
  officialPosition: string
  websiteAccess: string
  departmentRequired: boolean
  departmentSlug?: string
  departmentRole?: 'department_head' | 'deputy_head' | 'executive'
}

export const staffSetupTemplates: StaffSetupTemplate[] = [
  {
    key: 'president',
    group: 'Core Executive Leadership',
    title: 'President',
    description: 'Club-wide leadership for the official UIUSSC Executive Committee.',
    officialPosition: 'President',
    websiteAccess: 'Club-wide leadership',
    departmentRequired: false,
  },
  {
    key: 'vice-president',
    group: 'Core Executive Leadership',
    title: 'Vice-President',
    description: 'Club-wide leadership support for executive committee operations.',
    officialPosition: 'Vice-President',
    websiteAccess: 'Club-wide leadership',
    departmentRequired: false,
  },
  {
    key: 'assistant-vice-president',
    group: 'Core Executive Leadership',
    title: 'Assistant Vice-President',
    description: 'Club-wide leadership support under the executive committee.',
    officialPosition: 'Assistant Vice-President',
    websiteAccess: 'Club-wide leadership',
    departmentRequired: false,
  },
  {
    key: 'general-secretary',
    group: 'Core Executive Leadership',
    title: 'General Secretary',
    description: 'Club-wide coordination lead for records, event operations, and execution.',
    officialPosition: 'General Secretary',
    websiteAccess: 'Club-wide leadership',
    departmentRequired: false,
  },
  {
    key: 'treasurer',
    group: 'Core Executive Leadership',
    title: 'Treasurer',
    description: 'Club-wide executive committee responsibility for finance-related coordination.',
    officialPosition: 'Treasurer',
    websiteAccess: 'Club-wide leadership',
    departmentRequired: false,
  },
  {
    key: 'head-blood',
    group: 'Department Leadership',
    title: 'Head of Blood',
    description: 'Leads Blood Department operations and blood support coordination.',
    officialPosition: 'Head of Blood',
    websiteAccess: 'Blood Department leadership',
    departmentRequired: true,
    departmentSlug: 'blood',
    departmentRole: 'department_head',
  },
  {
    key: 'head-volunteer',
    group: 'Department Leadership',
    title: 'Head of Volunteer',
    description: 'Leads Volunteer Management Department coordination and deployment.',
    officialPosition: 'Head of Volunteer',
    websiteAccess: 'Volunteer Management leadership',
    departmentRequired: true,
    departmentSlug: 'volunteer-management',
    departmentRole: 'department_head',
  },
  {
    key: 'deputy-volunteer',
    group: 'Department Leadership',
    title: 'Deputy of Volunteer',
    description: 'Supports Volunteer Management Department leadership.',
    officialPosition: 'Deputy of Volunteer',
    websiteAccess: 'Volunteer Management deputy leadership',
    departmentRequired: true,
    departmentSlug: 'volunteer-management',
    departmentRole: 'deputy_head',
  },
  {
    key: 'head-marketing',
    group: 'Department Leadership',
    title: 'Head of Marketing',
    description: 'Leads Marketing Department campaign and outreach work.',
    officialPosition: 'Head of Marketing',
    websiteAccess: 'Marketing Department leadership',
    departmentRequired: true,
    departmentSlug: 'marketing',
    departmentRole: 'department_head',
  },
  {
    key: 'deputy-marketing',
    group: 'Department Leadership',
    title: 'Deputy of Marketing',
    description: 'Supports Marketing Department campaign and outreach work.',
    officialPosition: 'Deputy of Marketing',
    websiteAccess: 'Marketing deputy leadership',
    departmentRequired: true,
    departmentSlug: 'marketing',
    departmentRole: 'deputy_head',
  },
  {
    key: 'head-logistics',
    group: 'Department Leadership',
    title: 'Head of Logistics',
    description: 'Leads transport, materials, venue, and logistics preparation.',
    officialPosition: 'Head of Logistics',
    websiteAccess: 'Logistics Department leadership',
    departmentRequired: true,
    departmentSlug: 'logistics',
    departmentRole: 'department_head',
  },
  {
    key: 'deputy-logistics',
    group: 'Department Leadership',
    title: 'Deputy of Logistics',
    description: 'Supports logistics planning and execution.',
    officialPosition: 'Deputy of Logistics',
    websiteAccess: 'Logistics deputy leadership',
    departmentRequired: true,
    departmentSlug: 'logistics',
    departmentRole: 'deputy_head',
  },
  {
    key: 'head-event-management',
    group: 'Department Leadership',
    title: 'Head of Event Management',
    description: 'Leads event planning, scheduling, and operational execution.',
    officialPosition: 'Head of Event Management',
    websiteAccess: 'Event Management Department leadership',
    departmentRequired: true,
    departmentSlug: 'event-management',
    departmentRole: 'department_head',
  },
  {
    key: 'deputy-event-management',
    group: 'Department Leadership',
    title: 'Deputy of Event Management',
    description: 'Supports Event Management Department execution.',
    officialPosition: 'Deputy of Event Management',
    websiteAccess: 'Event Management deputy leadership',
    departmentRequired: true,
    departmentSlug: 'event-management',
    departmentRole: 'deputy_head',
  },
  {
    key: 'head-graphics',
    group: 'Department Leadership',
    title: 'Head of Graphics',
    description: 'Leads Graphics & Creative Department visual production.',
    officialPosition: 'Head of Graphics',
    websiteAccess: 'Graphics & Creative Department leadership',
    departmentRequired: true,
    departmentSlug: 'graphics-creative',
    departmentRole: 'department_head',
  },
  {
    key: 'head-public-relations',
    group: 'Department Leadership',
    title: 'Head of Public Relations',
    description: 'Leads PR communication, promotion, and collaboration work.',
    officialPosition: 'Head of Public Relations',
    websiteAccess: 'Public Relations Department leadership',
    departmentRequired: true,
    departmentSlug: 'public-relations',
    departmentRole: 'department_head',
  },
  {
    key: 'deputy-public-relations',
    group: 'Department Leadership',
    title: 'Deputy of Public Relations',
    description: 'Supports PR communication, promotion, and collaboration work.',
    officialPosition: 'Deputy of Public Relations',
    websiteAccess: 'Public Relations deputy leadership',
    departmentRequired: true,
    departmentSlug: 'public-relations',
    departmentRole: 'deputy_head',
  },
  {
    key: 'executive-member-blood',
    group: 'Executive Members',
    title: 'Executive Member - Blood',
    description: 'Executive member attached to Blood Department operations.',
    officialPosition: 'Executive Member - Department of Blood',
    websiteAccess: 'Blood Department executive',
    departmentRequired: true,
    departmentSlug: 'blood',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-volunteer-management',
    group: 'Executive Members',
    title: 'Executive Member - Volunteer Management',
    description: 'Executive member attached to Volunteer Management operations.',
    officialPosition: 'Executive Member - Department of Volunteer Management',
    websiteAccess: 'Volunteer Management executive',
    departmentRequired: true,
    departmentSlug: 'volunteer-management',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-marketing',
    group: 'Executive Members',
    title: 'Executive Member - Marketing',
    description: 'Executive member attached to Marketing Department operations.',
    officialPosition: 'Executive Member - Department of Marketing',
    websiteAccess: 'Marketing Department executive',
    departmentRequired: true,
    departmentSlug: 'marketing',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-logistics',
    group: 'Executive Members',
    title: 'Executive Member - Logistics',
    description: 'Executive member attached to Logistics Department operations.',
    officialPosition: 'Executive Member - Department of Logistics',
    websiteAccess: 'Logistics Department executive',
    departmentRequired: true,
    departmentSlug: 'logistics',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-event-management',
    group: 'Executive Members',
    title: 'Executive Member - Event Management',
    description: 'Executive member attached to Event Management operations.',
    officialPosition: 'Executive Member - Department of Event Management',
    websiteAccess: 'Event Management executive',
    departmentRequired: true,
    departmentSlug: 'event-management',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-graphics-creative',
    group: 'Executive Members',
    title: 'Executive Member - Graphics & Creative',
    description: 'Executive member attached to Graphics & Creative production.',
    officialPosition: 'Executive Member - Department of Graphics & Creative',
    websiteAccess: 'Graphics & Creative executive',
    departmentRequired: true,
    departmentSlug: 'graphics-creative',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-public-relations',
    group: 'Executive Members',
    title: 'Executive Member - Public Relations',
    description: 'Executive member attached to Public Relations operations.',
    officialPosition: 'Executive Member - Department of Public Relations',
    websiteAccess: 'Public Relations executive',
    departmentRequired: true,
    departmentSlug: 'public-relations',
    departmentRole: 'executive',
  },
  {
    key: 'executive-member-general-support',
    group: 'Executive Members',
    title: 'Executive Member - General Support',
    description: 'Executive member for general support and coordination across club activities.',
    officialPosition: 'Executive Member - General Support & Coordination',
    websiteAccess: 'General support executive',
    departmentRequired: false,
  },
]

export const staffSetupTemplateGroups: StaffSetupTemplateGroup[] = [
  'Core Executive Leadership',
  'Department Leadership',
  'Executive Members',
]

export function getStaffSetupTemplate(key: string | null | undefined){
  return staffSetupTemplates.find((template) => template.key === key) ?? null
}
