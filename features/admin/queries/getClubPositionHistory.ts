import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

type PositionRow = {
  id: string
  volunteer_profile_id: string
  club_position_id: string
  status: string
  is_primary: boolean
  term_start: string
  term_end: string | null
  assigned_by: string | null
  assigned_at: string
  ended_by: string | null
  ended_at: string | null
  revoked_by: string | null
  revoked_at: string | null
  reason: string | null
  club_positions: {
    name: string | null
    slug: string | null
    is_core_panel: boolean | null
  } | null
}

export type ClubPositionHistoryItem = PositionRow & {
  assignedByName: string | null
  endedByName: string | null
  revokedByName: string | null
}

export async function getClubPositionHistory(profileId: string){
  const supabase = await createServerSupabaseClient()
  const [{ data: profile }, { data: rows, error }] = await Promise.all([
    supabase.from('volunteer_profiles').select('id, full_name, email, student_id').eq('id', profileId).maybeSingle(),
    supabase
      .from('volunteer_club_positions')
      .select('id, volunteer_profile_id, club_position_id, status, is_primary, term_start, term_end, assigned_by, assigned_at, ended_by, ended_at, revoked_by, revoked_at, reason, club_positions(name, slug, is_core_panel)')
      .eq('volunteer_profile_id', profileId)
      .order('term_start', { ascending: false })
      .order('assigned_at', { ascending: false }),
  ])

  const historyRows = (rows ?? []) as PositionRow[]
  const actorIds = Array.from(new Set(historyRows.flatMap((row) => [row.assigned_by, row.ended_by, row.revoked_by]).filter(Boolean))) as string[]
  const actorNames = new Map<string, string>()

  if (actorIds.length > 0) {
    const { data: actors } = await supabase.from('volunteer_profiles').select('id, full_name').in('id', actorIds)
    actors?.forEach((actor) => actorNames.set(actor.id, actor.full_name))
  }

  const history = historyRows.map((row) => ({
    ...row,
    assignedByName: row.assigned_by ? actorNames.get(row.assigned_by) ?? null : null,
    endedByName: row.ended_by ? actorNames.get(row.ended_by) ?? null : null,
    revokedByName: row.revoked_by ? actorNames.get(row.revoked_by) ?? null : null,
  }))

  return {
    profile,
    currentPosition: history.find((item) => item.status === 'active') ?? null,
    history,
    error: error ? 'position_history_unavailable' : null,
  }
}
