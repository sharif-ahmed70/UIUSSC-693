'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { BloodFormState } from './formState'
import { publicBloodDonorSchema, publicBloodRequestSchema } from './schemas'

function value(formData: FormData, key: string){
  const item = formData.get(key)
  return typeof item === 'string' ? item : ''
}

function safeError(error: unknown){
  if (error && typeof error === 'object') {
    const maybe = error as { message?: unknown; code?: unknown }
    return {
      code: typeof maybe.code === 'string' ? maybe.code : 'unknown',
      message: typeof maybe.message === 'string' ? maybe.message : 'Unexpected error',
    }
  }

  return { code: 'unknown', message: 'Unexpected error' }
}

function validationState(error: z.ZodError): BloodFormState{
  const flattened = error.flatten().fieldErrors as Record<string, string[]>
  const { website: _website, ...fieldErrors } = flattened
  return {
    status: 'validation_error',
    message: 'Please review the highlighted fields.',
    fieldErrors,
  }
}

export async function submitPublicBloodRequest(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const parsed = publicBloodRequestSchema.safeParse({
    requesterName: value(formData, 'requesterName'),
    phone: value(formData, 'phone'),
    email: value(formData, 'email'),
    bloodGroup: value(formData, 'bloodGroup'),
    unitsRequested: value(formData, 'unitsRequested'),
    neededAt: value(formData, 'neededAt'),
    hospitalName: value(formData, 'hospitalName'),
    hospitalArea: value(formData, 'hospitalArea'),
    district: value(formData, 'district'),
    urgency: value(formData, 'urgency'),
    patientReference: value(formData, 'patientReference'),
    requesterRelationship: value(formData, 'requesterRelationship'),
    website: value(formData, 'website'),
  })

  if (!parsed.success) {
    if (parsed.error.flatten().fieldErrors.website) {
      return { status: 'error', message: 'We could not submit the request right now.' }
    }

    return validationState(parsed.error)
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: Array<{ public_reference_code: string }> | null; error: unknown }>)('submit_public_blood_request', {
    p_requester_name: parsed.data.requesterName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_blood_group: parsed.data.bloodGroup,
    p_units_requested: parsed.data.unitsRequested,
    p_needed_at: new Date(parsed.data.neededAt).toISOString(),
    p_hospital_name: parsed.data.hospitalName,
    p_hospital_area: parsed.data.hospitalArea,
    p_district: parsed.data.district,
    p_urgency: parsed.data.urgency,
    p_patient_reference: parsed.data.patientReference,
    p_requester_relationship: parsed.data.requesterRelationship,
  })

  if (error) {
    console.error('submit_public_blood_request', safeError(error))
    return { status: 'error', message: 'Blood request intake is unavailable right now. Please contact UIUSSC directly for emergencies.' }
  }

  return {
    status: 'success',
    message: `Your blood request has been submitted for review. Reference: ${data?.[0]?.public_reference_code ?? 'pending'}.`,
  }
}

export async function submitPublicBloodDonor(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const parsed = publicBloodDonorSchema.safeParse({
    displayName: value(formData, 'displayName'),
    phone: value(formData, 'phone'),
    email: value(formData, 'email'),
    bloodGroup: value(formData, 'bloodGroup'),
    district: value(formData, 'district'),
    area: value(formData, 'area'),
    availabilityStatus: value(formData, 'availabilityStatus'),
    preferredContactMethod: value(formData, 'preferredContactMethod'),
    lastDonationDate: value(formData, 'lastDonationDate'),
    website: value(formData, 'website'),
  })

  if (!parsed.success) {
    if (parsed.error.flatten().fieldErrors.website) {
      return { status: 'error', message: 'We could not submit donor registration right now.' }
    }

    return validationState(parsed.error)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)('submit_public_blood_donor_interest', {
    p_display_name: parsed.data.displayName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_blood_group: parsed.data.bloodGroup,
    p_district: parsed.data.district,
    p_area: parsed.data.area,
    p_availability_status: parsed.data.availabilityStatus,
    p_preferred_contact_method: parsed.data.preferredContactMethod,
    p_self_reported_last_donation_date: parsed.data.lastDonationDate || null,
  })

  if (error) {
    console.error('submit_public_blood_donor_interest', safeError(error))
    return { status: 'error', message: 'Donor registration is unavailable right now. Please try again later.' }
  }

  return { status: 'success', message: 'Your donor registration has been submitted for human review. UIUSSC will contact you before any use.' }
}

async function callBloodRpc(name: string, args: Record<string, unknown>, paths: string[] = []): Promise<BloodFormState>{
  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase.rpc as unknown as (rpcName: string, rpcArgs: Record<string, unknown>) => Promise<{ error: unknown }>)(
    name,
    args,
  )

  if (error) {
    console.error(name, safeError(error))
    return { status: 'error', message: safeError(error).message }
  }

  paths.forEach((path) => revalidatePath(path))
  return { status: 'success', message: 'Update saved.' }
}

export async function updateBloodRequestStatus(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  const status = value(formData, 'status')
  const reason = value(formData, 'reason')
  const rpc = ['under_review', 'approved', 'rejected'].includes(status) ? 'review_blood_request' : 'change_blood_request_status'
  return callBloodRpc(rpc, { p_request_id: requestId, p_new_status: status, p_reason: reason }, ['/staff/blood', '/staff/blood/requests', `/staff/blood/requests/${requestId}`])
}

export async function updateBloodRequestPriority(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('change_blood_request_priority', {
    p_request_id: requestId,
    p_new_priority: value(formData, 'priority'),
    p_reason: value(formData, 'reason'),
  }, ['/staff/blood', '/staff/blood/requests', `/staff/blood/requests/${requestId}`])
}

export async function createBloodMatchAction(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('create_blood_match', {
    p_request_id: requestId,
    p_donor_id: value(formData, 'donorId'),
    p_notes: value(formData, 'notes'),
  }, ['/staff/blood', '/staff/blood/requests', `/staff/blood/requests/${requestId}`, `/staff/blood/requests/${requestId}/match`])
}

export async function updateBloodMatchStatus(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('change_blood_match_status', {
    p_match_id: value(formData, 'matchId'),
    p_new_status: value(formData, 'status'),
    p_reason: value(formData, 'reason'),
  }, ['/staff/blood', `/staff/blood/requests/${requestId}`])
}

export async function assignBloodExecutiveAction(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('assign_blood_request_executive', {
    p_request_id: requestId,
    p_profile_id: value(formData, 'profileId'),
    p_reason: value(formData, 'reason'),
    p_action_label: value(formData, 'actionLabel') || 'Follow up blood request',
    p_due_at: value(formData, 'dueAt') ? new Date(value(formData, 'dueAt')).toISOString() : null,
  }, ['/staff/blood', `/staff/blood/requests/${requestId}`])
}

export async function completeBloodAssignmentAction(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('complete_blood_request_assignment', {
    p_assignment_id: value(formData, 'assignmentId'),
    p_completion_note: value(formData, 'completionNote'),
  }, ['/staff/blood', `/staff/blood/requests/${requestId}`])
}

export async function updateBloodDonorAvailability(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  return callBloodRpc('change_blood_donor_availability', {
    p_donor_id: value(formData, 'donorId'),
    p_new_status: value(formData, 'availabilityStatus'),
    p_reason: value(formData, 'reason'),
  }, ['/staff/blood/donors'])
}

export async function recordBloodDonationAction(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('record_blood_donation', {
    p_request_id: requestId,
    p_donor_id: value(formData, 'donorId'),
    p_match_id: value(formData, 'matchId') || null,
    p_reported_units: Number(value(formData, 'reportedUnits')),
    p_donation_date: value(formData, 'donationDate') || null,
    p_hospital_reference: value(formData, 'hospitalReference'),
  }, ['/staff/blood', `/staff/blood/requests/${requestId}`])
}

export async function verifyBloodDonationAction(_state: BloodFormState, formData: FormData): Promise<BloodFormState>{
  const requestId = value(formData, 'requestId')
  return callBloodRpc('verify_blood_donation', {
    p_donation_id: value(formData, 'donationId'),
    p_verified_units: Number(value(formData, 'verifiedUnits')),
    p_new_status: value(formData, 'status'),
    p_reason: value(formData, 'reason'),
  }, ['/staff/blood', `/staff/blood/requests/${requestId}`])
}
