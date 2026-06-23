'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeContactCandidate } from '../normalize'
import { contactMessageSchema } from '../schema'
import type { ContactActionState, ContactCandidate, ContactFieldErrors } from '../types'

function getFormValue(formData: FormData, key: keyof ContactCandidate){
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function flattenFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }){
  const { website: _website, ...fieldErrors } = error.flatten().fieldErrors
  return fieldErrors as ContactFieldErrors
}

function safeDatabaseError(error: unknown){
  if(error && typeof error === 'object'){
    const maybeError = error as { code?: unknown; message?: unknown }
    return {
      code: typeof maybeError.code === 'string' ? maybeError.code : 'unknown',
      message: typeof maybeError.message === 'string' ? maybeError.message : 'Unexpected database error',
    }
  }

  return { code: 'unknown', message: 'Unexpected database error' }
}

export async function submitContactMessage(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const candidate: ContactCandidate = {
    name: getFormValue(formData, 'name'),
    email: getFormValue(formData, 'email'),
    subject: getFormValue(formData, 'subject'),
    message: getFormValue(formData, 'message'),
    website: getFormValue(formData, 'website'),
  }

  const normalized = normalizeContactCandidate(candidate)
  const parsed = contactMessageSchema.safeParse(normalized)

  if(!parsed.success){
    const fieldErrors = parsed.error.flatten().fieldErrors

    if(fieldErrors.website){
      return {
        status: 'error',
        message: 'We could not send your message right now. Please try again shortly.',
      }
    }

    return {
      status: 'validation_error',
      message: 'Please correct the highlighted fields and send your message again.',
      fieldErrors: flattenFieldErrors(parsed.error),
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      })

    if(error){
      console.error('contact_message_insert', safeDatabaseError(error))

      return {
        status: 'error',
        message: 'We could not send your message right now. Please try again shortly.',
      }
    }

    return {
      status: 'success',
      message: 'Thank you for contacting UIUSSC. Your message has been received, and our team will get back to you soon.',
    }
  } catch (error) {
    console.error('contact_message_insert', safeDatabaseError(error))

    return {
      status: 'error',
      message: 'We could not send your message right now. Please try again shortly.',
    }
  }
}
