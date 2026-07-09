import VolunteerDashboard from '@/components/volunteer-dashboard/VolunteerDashboard'
import { getVolunteerDashboardData } from '@/features/volunteer-dashboard/queries'
import type { VolunteerDashboardModule } from '@/features/volunteer-dashboard/types'

const validModules: VolunteerDashboardModule[] = ['attendance', 'tasks', 'events', 'committee', 'blood', 'notifications']

type VolunteerDashboardPageProps = {
  searchParams: Promise<{
    module?: string
    eventId?: string
    attendanceType?: string
  }>
}

function normalizeModule(module?: string): VolunteerDashboardModule {
  return validModules.includes(module as VolunteerDashboardModule) ? module as VolunteerDashboardModule : 'attendance'
}

export default async function VolunteerDepartmentDashboardPage({ searchParams }: VolunteerDashboardPageProps){
  const params = await searchParams
  const activeModule = normalizeModule(params.module)
  const attendanceType = params.attendanceType === 'booth' ? 'booth' : 'meeting'
  const data = await getVolunteerDashboardData({ eventId: params.eventId, attendanceType })

  return <VolunteerDashboard data={data} activeModule={activeModule} attendanceType={attendanceType} />
}
