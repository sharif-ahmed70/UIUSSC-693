export type BloodFormState = {
  status: 'idle' | 'success' | 'error' | 'validation_error'
  message?: string
  fieldErrors?: Record<string, string[]>
}

export const initialBloodFormState: BloodFormState = { status: 'idle' }
