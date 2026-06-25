-- UIUSSC Phase CM-3.2 follow-up: mark Executive Member as Core Panel
-- Version: 202606240007

update public.club_positions
set
  is_core_panel = true,
  description = 'Official UIUSSC Executive Member position.',
  status = 'active',
  archived_at = null
where slug = 'executive-member';
