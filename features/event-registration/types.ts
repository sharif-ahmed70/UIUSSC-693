export type EventRegistrationField =
  | 'eventSlug'
  | 'fullName'
  | 'studentId'
  | 'email'
  | 'phone'
  | 'bloodGroup'
  | 'motivation'
  | 'website'

export type EventRegistrationActionStatus =
  | 'idle'
  | 'success'
  | 'validation_error'
  | 'duplicate'
  | 'closed'
  | 'not_found'
  | 'error'

export type EventRegistrationFieldErrors = Partial<Record<EventRegistrationField, string[]>>

export type EventRegistrationActionState = {
  status: EventRegistrationActionStatus
  message: string
  fieldErrors?: EventRegistrationFieldErrors
}

export const initialEventRegistrationActionState: EventRegistrationActionState = {
  status: 'idle',
  message: '',
}

export type EventRegistrationCandidate = {
  eventSlug: string
  fullName: string
  studentId: string
  email: string
  phone: string
  bloodGroup: string
  motivation: string
  website: string
}

export type NormalizedEventRegistration = {
  eventSlug: string
  fullName: string
  studentId: string | null
  email: string
  phone: string
  bloodGroup: string | null
  motivation: string | null
  website: string
}
