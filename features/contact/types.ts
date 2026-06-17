export type ContactField = 'name' | 'email' | 'subject' | 'message'

export type ContactActionStatus = 'idle' | 'success' | 'validation_error' | 'error'

export type ContactFieldErrors = Partial<Record<ContactField, string[]>>

export type ContactActionState = {
  status: ContactActionStatus
  message: string
  fieldErrors?: ContactFieldErrors
}

export const initialContactActionState: ContactActionState = {
  status: 'idle',
  message: '',
}

export type ContactCandidate = {
  name: string
  email: string
  subject: string
  message: string
  website: string
}

export type NormalizedContactMessage = ContactCandidate
