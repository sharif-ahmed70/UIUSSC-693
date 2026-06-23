'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEventRegistrationCandidate } from '../normalize'
import { eventRegistrationSchema } from '../schema'
import type {
  EventRegistrationActionState,
  EventRegistrationCandidate,
  EventRegistrationFieldErrors,
} from '../types'

function getFormValue(formData: FormData, key: keyof EventRegistrationCandidate){
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function flattenFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }){
  return error.flatten().fieldErrors as EventRegistrationFieldErrors
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

export async function submitEventRegistration(
  _previousState: EventRegistrationActionState,
  formData: FormData,
): Promise<EventRegistrationActionState> {
  const candidate: EventRegistrationCandidate = {
    eventSlug: getFormValue(formData, 'eventSlug'),
    fullName: getFormValue(formData, 'fullName'),
    studentId: getFormValue(formData, 'studentId'),
    email: getFormValue(formData, 'email'),
    phone: getFormValue(formData, 'phone'),
    bloodGroup: getFormValue(formData, 'bloodGroup'),
    motivation: getFormValue(formData, 'motivation'),
    website: getFormValue(formData, 'website'),
  }

  const normalized = normalizeEventRegistrationCandidate(candidate)
  const parsed = eventRegistrationSchema.safeParse(normalized)

  if(!parsed.success){
    const fieldErrors = flattenFieldErrors(parsed.error)

    if(fieldErrors.website){
      return {
        status: 'error',
        message: 'We could not complete your registration right now. Please try again shortly.',
      }
    }

    return {
      status: 'validation_error',
      message: 'Please correct the highlighted fields and submit your registration again.',
      fieldErrors,
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id,title,slug,status,registration_open,event_date,capacity')
      .eq('slug', parsed.data.eventSlug)
      .maybeSingle()

    if(eventError){
      console.error('event_registration_insert', {
        ...safeDatabaseError(eventError),
        eventSlug: parsed.data.eventSlug,
      })

      return {
        status: 'error',
        message: 'We could not complete your registration right now. Please try again shortly.',
      }
    }

    if(!event || event.status !== 'published'){
      return {
        status: 'not_found',
        message: 'This event could not be found or is not available for registration.',
      }
    }

    if(!event.registration_open){
      return {
        status: 'closed',
        message: 'Registration for this event is currently closed.',
      }
    }

    const { error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        full_name: parsed.data.fullName,
        student_id: parsed.data.studentId,
        email: parsed.data.email,
        phone: parsed.data.phone,
        blood_group: parsed.data.bloodGroup,
        motivation: parsed.data.motivation,
      })

    if(error){
      if(error.code === '23505'){
        return {
          status: 'duplicate',
          message: 'You are already registered for this event using this email or student ID.',
        }
      }

      if(error.code === '42501'){
        const { data: latestEvent } = await supabase
          .from('events')
          .select('registration_open')
          .eq('slug', parsed.data.eventSlug)
          .maybeSingle()

        if(latestEvent && !latestEvent.registration_open){
          return {
            status: 'closed',
            message: 'Registration for this event is currently closed.',
          }
        }
      }

      console.error('event_registration_insert', {
        ...safeDatabaseError(error),
        eventSlug: parsed.data.eventSlug,
      })

      return {
        status: 'error',
        message: 'We could not complete your registration right now. Please try again shortly.',
      }
    }

    return {
      status: 'success',
      message: 'Your event registration has been submitted successfully. The UIUSSC team will contact you if further confirmation is required.',
    }
  } catch (error) {
    console.error('event_registration_insert', safeDatabaseError(error))

    return {
      status: 'error',
      message: 'We could not complete your registration right now. Please try again shortly.',
    }
  }
}
