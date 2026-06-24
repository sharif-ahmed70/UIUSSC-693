import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const positionColumns = 'id, name, slug, description, is_core_panel, status, display_order'

export type ClubPosition = {
  id: string
  name: string
  slug: string
  description: string | null
  is_core_panel: boolean
  status: string
  display_order: number
}

export type ClubPositionStatusFilter = 'active' | 'inactive' | 'archived' | 'all'

export type ClubPositionListParams = {
  page?: number
  pageSize?: number
  status?: ClubPositionStatusFilter
}

export function parseClubPositionSearchParams(searchParams: Record<string, string | string[] | undefined>): Required<ClubPositionListParams>{
  const page = Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page)
  const rawStatus = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status
  const status: ClubPositionStatusFilter = rawStatus === 'inactive' || rawStatus === 'archived' || rawStatus === 'all' ? rawStatus : 'active'

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: 20,
    status,
  }
}

export async function getClubPositions(params: Required<ClubPositionListParams>){
  const supabase = await createServerSupabaseClient()
  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1
  let positionQuery = supabase
    .from('club_positions')
    .select(positionColumns, { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  if (params.status !== 'all') {
    positionQuery = positionQuery.eq('status', params.status)
  }

  const [{ data: positions, error: positionsError, count }, { data: assignments, error: assignmentsError }] = await Promise.all([
    positionQuery,
    supabase
      .from('volunteer_club_positions')
      .select('id, status, is_primary, term_start, term_end, volunteer_profile_id, club_position_id, volunteer_profiles!volunteer_club_positions_volunteer_profile_id_fkey(full_name), club_positions(name, slug, is_core_panel)')
      .order('term_start', { ascending: false })
      .limit(100),
  ])

  return {
    positions: positions ?? [],
    assignments: assignments ?? [],
    totalPositions: count ?? 0,
    error: positionsError || assignmentsError ? 'club_positions_unavailable' : null,
  }
}
