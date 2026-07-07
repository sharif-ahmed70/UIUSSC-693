'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AdminActionState } from '@/features/admin/types'
import { idSchema } from '@/features/admin/actions/schemas'
import { requireAdminAction, safeActionError } from '@/features/admin/actions/actionUtils'
import { getStaffSetupTemplate } from './templates'

const staffSetupSchema = z.object({
  profileId: idSchema,
  templateKey: z.string().trim().min(1),
  departmentId: z.string().trim().optional(),
})

export async function setupStaffAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = staffSetupSchema.safeParse({
    profileId: formData.get('profileId'),
    templateKey: formData.get('templateKey'),
    departmentId: formData.get('departmentId') || undefined,
  })

  if (!parsed.success) {
    return { status: 'error', message: 'Please review the staff setup selections.', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const template = getStaffSetupTemplate(parsed.data.templateKey)
  if (!template) return { status: 'error', message: 'Choose a supported staff responsibility.' }
  if (template.departmentRequired && !parsed.data.departmentId) {
    return { status: 'error', message: 'Choose a department for this responsibility.', fieldErrors: { departmentId: ['Department is required.'] } }
  }

  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('setup_staff_access' as never, {
    p_profile_id: parsed.data.profileId,
    p_template_key: parsed.data.templateKey,
    p_department_id: parsed.data.departmentId || null,
    p_reason: 'Staff setup completed through guided administration',
  } as never)

  if (error) {
    console.warn('Guided staff setup failed', { code: error.code, message: error.message })
    if (error.code === '42501') return { status: 'error', message: 'You do not have permission to complete this staff setup.' }
    if (error.code === '22023') return { status: 'error', message: 'This setup cannot be completed with the selected profile, responsibility, or department.' }
    if (error.code === '23505') return { status: 'error', message: 'This responsibility is already actively held. End or transfer the existing assignment before assigning it again.' }
    return safeActionError()
  }

  revalidatePath('/admin/volunteers')
  revalidatePath(`/admin/volunteers/${parsed.data.profileId}`)
  revalidatePath(`/admin/volunteers/${parsed.data.profileId}/setup`)
  revalidatePath('/admin/platform-roles')
  revalidatePath('/admin/club-positions')

  return { status: 'success', message: 'Staff setup completed successfully.' }
}
