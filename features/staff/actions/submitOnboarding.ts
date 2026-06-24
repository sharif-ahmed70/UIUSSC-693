'use server'

import { redirect } from 'next/navigation'
import type { ActionState } from '@/features/auth/types'
import { normalizeBangladeshPhone, normalizeStudentId } from '@/features/staff/onboarding/normalize'
import { onboardingSchema } from '@/features/staff/onboarding/schema'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function submitOnboardingAction(_previousState: ActionState, formData: FormData): Promise<ActionState>{
  const parsed = onboardingSchema.safeParse({
    fullName: formData.get('fullName'),
    studentId: formData.get('studentId'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    academicDepartment: formData.get('academicDepartment'),
    trimester: formData.get('trimester'),
    bloodGroup: formData.get('bloodGroup') || undefined,
    preferredDepartmentId: formData.get('preferredDepartmentId'),
    consent: formData.get('consent'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please review the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const preferredDepartmentId = parsed.data.preferredDepartmentId || null
  const onboardingArgs = {
    p_full_name: parsed.data.fullName,
    p_student_id: normalizeStudentId(parsed.data.studentId),
    p_email: parsed.data.email,
    p_phone: normalizeBangladeshPhone(parsed.data.phone),
    p_academic_department: parsed.data.academicDepartment,
    p_trimester: parsed.data.trimester,
    p_blood_group: parsed.data.bloodGroup || '',
    p_preferred_department_id: preferredDepartmentId,
  } as unknown as Database['public']['Functions']['submit_volunteer_onboarding']['Args']

  const { error } = await supabase.rpc('submit_volunteer_onboarding', onboardingArgs)

  if (error) {
    console.warn('Volunteer onboarding failed', { code: error.code, message: error.message })
    return {
      status: 'error',
      message: 'We could not submit your onboarding request right now. Please review the information and try again.',
    }
  }

  redirect('/staff/pending')
}
