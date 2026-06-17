'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeMembershipCandidate } from '../normalize'
import { membershipApplicationSchema } from '../schema'
import type { MembershipCandidate, MembershipFieldErrors, MembershipFormState } from '../types'

function getFormValue(formData: FormData, key: keyof MembershipCandidate){
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function flattenFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }){
  return error.flatten().fieldErrors as MembershipFieldErrors
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

export async function submitMembershipApplication(
  _previousState: MembershipFormState,
  formData: FormData,
): Promise<MembershipFormState> {
  const candidate: MembershipCandidate = {
    fullName: getFormValue(formData, 'fullName'),
    studentId: getFormValue(formData, 'studentId'),
    department: getFormValue(formData, 'department'),
    trimester: getFormValue(formData, 'trimester'),
    email: getFormValue(formData, 'email'),
    phone: getFormValue(formData, 'phone'),
    bloodGroup: getFormValue(formData, 'bloodGroup'),
    interestedDepartment: getFormValue(formData, 'interestedDepartment'),
    skills: getFormValue(formData, 'skills'),
    motivation: getFormValue(formData, 'motivation'),
    website: getFormValue(formData, 'website'),
  }

  const normalized = normalizeMembershipCandidate(candidate)
  const parsed = membershipApplicationSchema.safeParse(normalized)

  if(!parsed.success){
    const fieldErrors = flattenFieldErrors(parsed.error)

    if(fieldErrors.website){
      return {
        status: 'error',
        message: 'We could not submit your application right now. Please try again shortly.',
      }
    }

    return {
      status: 'validation_error',
      message: 'Please correct the highlighted fields and submit again.',
      fieldErrors,
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('membership_applications')
      .insert({
        full_name: parsed.data.fullName,
        student_id: parsed.data.studentId,
        department: parsed.data.department,
        trimester: parsed.data.trimester,
        email: parsed.data.email,
        phone: parsed.data.phone,
        blood_group: parsed.data.bloodGroup,
        interested_department: parsed.data.interestedDepartment,
        skills: parsed.data.skills,
        motivation: parsed.data.motivation,
      })

    if(error){
      if(error.code === '23505'){
        return {
          status: 'duplicate',
          message: 'A pending membership application already exists for this student ID.',
        }
      }

      const diagnostic = safeDatabaseError(error)
      console.error('membership_application_insert', diagnostic)

      return {
        status: 'error',
        message: 'We could not submit your application right now. Please try again shortly.',
      }
    }

    return {
      status: 'success',
      message: 'Your membership application has been submitted successfully. The UIUSSC team will contact you after review.',
    }
  } catch (error) {
    console.error('membership_application_insert', safeDatabaseError(error))

    return {
      status: 'error',
      message: 'We could not submit your application right now. Please try again shortly.',
    }
  }
}
