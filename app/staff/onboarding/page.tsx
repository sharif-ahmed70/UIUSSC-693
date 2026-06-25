import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/staff/OnboardingForm'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function StaffOnboardingPage(){
  const access = await getStaffAccessContext()

  if (access.profile && access.profile.onboardingStatus !== 'profile_incomplete') {
    redirect(resolveStaffDestination(access, '/staff/onboarding'))
  }

  const supabase = await createServerSupabaseClient()
  const { data: departments } = await supabase
    .from('club_departments')
    .select('id, name')
    .order('display_order', { ascending: true })

  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Volunteer onboarding</p>
        <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">Complete your staff profile</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Submit your profile and preferred department request for UIUSSC administration review.
        </p>
        <div className="mt-8">
          <OnboardingForm
            profile={access.profile}
            email={access.email}
            departments={(departments ?? []).map((department) => ({ value: department.id, label: department.name }))}
          />
        </div>
      </div>
    </div>
  )
}
