export type MembershipField =
  | 'fullName'
  | 'studentId'
  | 'department'
  | 'trimester'
  | 'email'
  | 'phone'
  | 'bloodGroup'
  | 'interestedDepartment'
  | 'skills'
  | 'motivation'
  | 'website'

export type MembershipFormStatus = 'idle' | 'success' | 'validation_error' | 'duplicate' | 'error'

export type MembershipFieldErrors = Partial<Record<MembershipField, string[]>>

export type MembershipFormState = {
  status: MembershipFormStatus
  message: string
  fieldErrors?: MembershipFieldErrors
}

export const initialMembershipFormState: MembershipFormState = {
  status: 'idle',
  message: '',
}

export type MembershipCandidate = {
  fullName: string
  studentId: string
  department: string
  trimester: string
  email: string
  phone: string
  bloodGroup: string
  interestedDepartment: string
  skills: string
  motivation: string
  website: string
}

export type NormalizedMembershipApplication = {
  fullName: string
  studentId: string
  department: string
  trimester: string
  email: string
  phone: string
  bloodGroup: string
  interestedDepartment: string
  skills: string | null
  motivation: string
  website: string
}
