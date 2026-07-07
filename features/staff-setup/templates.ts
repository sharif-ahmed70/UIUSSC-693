export type StaffSetupTemplateKey =
  | 'president'
  | 'vice-president'
  | 'general-secretary'
  | 'joint-secretary'
  | 'treasurer'
  | 'department-head'
  | 'deputy-head'
  | 'department-executive'
  | 'membership-manager'
  | 'content-manager'

export type StaffSetupTemplate = {
  key: StaffSetupTemplateKey
  title: string
  description: string
  officialPosition: string | null
  websiteAccess: string
  departmentRequired: boolean
  canDo: string[]
  cannotDo: string[]
}

const commonCannot = [
  'assign or remove Super Admin',
  'bypass approval-gated actions',
  'access restricted security controls',
]

export const staffSetupTemplates: StaffSetupTemplate[] = [
  {
    key: 'president',
    title: 'President',
    description: 'Club-wide leadership access for managing approved operational activities.',
    officialPosition: 'President',
    websiteAccess: 'Club-wide administration',
    departmentRequired: false,
    canDo: ['manage permitted club-wide event operations', 'view approved operational reports', 'review permitted approval requests'],
    cannotDo: commonCannot,
  },
  {
    key: 'vice-president',
    title: 'Vice President',
    description: 'Broad operational access for supporting club-wide management.',
    officialPosition: 'Vice President',
    websiteAccess: 'Club-wide administration',
    departmentRequired: false,
    canDo: ['manage permitted event operations', 'support member and content workflows', 'create approval-gated requests'],
    cannotDo: commonCannot,
  },
  {
    key: 'general-secretary',
    title: 'General Secretary',
    description: 'Broad operational access for club records, events, and coordination.',
    officialPosition: 'General Secretary',
    websiteAccess: 'Club-wide administration',
    departmentRequired: false,
    canDo: ['manage permitted event operations', 'support member and content workflows', 'create approval-gated requests'],
    cannotDo: commonCannot,
  },
  {
    key: 'joint-secretary',
    title: 'Joint Secretary',
    description: 'Official club designation with policy-based operational access.',
    officialPosition: 'Joint Secretary',
    websiteAccess: 'Position-based access',
    departmentRequired: false,
    canDo: ['view permitted operational work', 'create permitted approval requests', 'support event coordination'],
    cannotDo: commonCannot,
  },
  {
    key: 'treasurer',
    title: 'Treasurer',
    description: 'Official club designation without unnecessary global system access.',
    officialPosition: 'Treasurer',
    websiteAccess: 'Position-based access',
    departmentRequired: false,
    canDo: ['hold the official Treasurer designation', 'use access granted by current policies'],
    cannotDo: commonCannot,
  },
  {
    key: 'department-head',
    title: 'Department Head',
    description: 'Manages members, tasks and submissions inside one selected department.',
    officialPosition: null,
    websiteAccess: 'Department responsibility',
    departmentRequired: true,
    canDo: ['manage own department tasks', 'review own department submissions', 'view own department operational reports'],
    cannotDo: ['access unrelated departments', ...commonCannot],
  },
  {
    key: 'deputy-head',
    title: 'Deputy Head',
    description: 'Delegated department access for helping manage department operations.',
    officialPosition: null,
    websiteAccess: 'Department responsibility',
    departmentRequired: true,
    canDo: ['support own department task operations', 'review delegated submissions', 'view own department progress'],
    cannotDo: ['access unrelated departments', ...commonCannot],
  },
  {
    key: 'department-executive',
    title: 'Department Executive',
    description: 'Works on assigned departmental and event tasks without administrative control.',
    officialPosition: 'Executive Member',
    websiteAccess: 'Task-focused department access',
    departmentRequired: true,
    canDo: ['view own department work', 'update assigned task progress', 'submit assigned work'],
    cannotDo: ['assign members', 'review submissions', 'access unrelated tasks', ...commonCannot],
  },
  {
    key: 'membership-manager',
    title: 'Membership Manager',
    description: 'Manages membership review workflows without Super Admin controls.',
    officialPosition: null,
    websiteAccess: 'Membership administration',
    departmentRequired: false,
    canDo: ['review membership applications', 'manage volunteer profile workflows', 'support department membership records'],
    cannotDo: commonCannot,
  },
  {
    key: 'content-manager',
    title: 'Content Manager',
    description: 'Manages public content and permitted event content workflows.',
    officialPosition: null,
    websiteAccess: 'Content administration',
    departmentRequired: false,
    canDo: ['manage permitted content', 'support event content workflows', 'view relevant operational records'],
    cannotDo: commonCannot,
  },
]

export function getStaffSetupTemplate(key: string | null | undefined){
  return staffSetupTemplates.find((template) => template.key === key) ?? null
}
