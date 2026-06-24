import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getClubPositions(){
  const supabase = await createServerSupabaseClient()
  const [{ data: positions }, { data: assignments }] = await Promise.all([
    supabase.from('club_positions').select('*').order('display_order', { ascending: true }),
    supabase
      .from('volunteer_club_positions')
      .select('id, status, is_primary, term_start, term_end, volunteer_profile_id, club_position_id, volunteer_profiles!volunteer_club_positions_volunteer_profile_id_fkey(full_name, email, student_id), club_positions(name, slug, is_core_panel)')
      .order('term_start', { ascending: false })
      .limit(100),
  ])

  return {
    positions: positions ?? [],
    assignments: assignments ?? [],
  }
}
