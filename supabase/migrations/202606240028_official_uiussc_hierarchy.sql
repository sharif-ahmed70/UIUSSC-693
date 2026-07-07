-- Align Club Management with the official UIUSSC organizational hierarchy.
-- Departments remain departments. Official titles remain club positions.
-- Existing volunteer assignment history is preserved.

do $$
declare
  v_graphics_design_id uuid;
begin
  select id
  into v_graphics_design_id
  from public.club_departments
  where slug = 'graphics-design';

  if v_graphics_design_id is not null
    and not exists (select 1 from public.club_departments where slug = 'graphics-creative') then
    update public.club_departments
    set name = 'Graphics & Creative Department',
        slug = 'graphics-creative',
        short_description = 'Design, creative assets, posters, banners, and event visual materials.',
        status = 'active',
        archived_at = null,
        display_order = 60
    where id = v_graphics_design_id;
  end if;
end;
$$;

insert into public.club_departments (name, slug, short_description, status, display_order)
values
  ('Blood Department', 'blood', 'Blood donation, donor coordination, and emergency blood support.', 'active', 10),
  ('Volunteer Management Department', 'volunteer-management', 'Volunteer onboarding, coordination, and deployment.', 'active', 20),
  ('Marketing Department', 'marketing', 'Campaign planning, promotion strategy, and outreach support.', 'active', 30),
  ('Logistics Department', 'logistics', 'Transport, materials, venue support, and event logistics.', 'active', 40),
  ('Event Management Department', 'event-management', 'Event planning, execution, scheduling, and operations.', 'active', 50),
  ('Graphics & Creative Department', 'graphics-creative', 'Design, creative assets, posters, banners, and event visual materials.', 'active', 60),
  ('Public Relations Department', 'public-relations', 'Public communication, collaborations, promotion, and relations.', 'active', 70)
on conflict (slug) do update
set name = excluded.name,
    short_description = excluded.short_description,
    status = 'active',
    archived_at = null,
    display_order = excluded.display_order;

update public.club_departments
set status = 'archived',
    archived_at = coalesce(archived_at, now())
where slug in ('human-resources', 'graphics-design')
  and slug <> 'graphics-creative'
  and status <> 'archived';

insert into public.club_positions (name, slug, description, is_core_panel, display_order, status)
values
  ('President', 'president', 'Core Executive Leadership: UIUSSC President.', true, 10, 'active'),
  ('Vice-President', 'vice-president', 'Core Executive Leadership: UIUSSC Vice-President.', true, 20, 'active'),
  ('Assistant Vice-President', 'assistant-vice-president', 'Core Executive Leadership: UIUSSC Assistant Vice-President.', true, 30, 'active'),
  ('General Secretary', 'general-secretary', 'Core Executive Leadership: UIUSSC General Secretary.', true, 40, 'active'),
  ('Treasurer', 'treasurer', 'Core Executive Leadership: UIUSSC Treasurer.', true, 50, 'active'),
  ('Head of Blood', 'head-blood', 'Department leadership: Blood Department Head.', false, 110, 'active'),
  ('Head of Volunteer', 'head-volunteer', 'Department leadership: Volunteer Management Department Head.', false, 120, 'active'),
  ('Deputy of Volunteer', 'deputy-volunteer', 'Department leadership: Volunteer Management Department Deputy Head.', false, 130, 'active'),
  ('Head of Marketing', 'head-marketing', 'Department leadership: Marketing Department Head.', false, 140, 'active'),
  ('Deputy of Marketing', 'deputy-marketing', 'Department leadership: Marketing Department Deputy Head.', false, 150, 'active'),
  ('Head of Logistics', 'head-logistics', 'Department leadership: Logistics Department Head.', false, 160, 'active'),
  ('Deputy of Logistics', 'deputy-logistics', 'Department leadership: Logistics Department Deputy Head.', false, 170, 'active'),
  ('Head of Event Management', 'head-event-management', 'Department leadership: Event Management Department Head.', false, 180, 'active'),
  ('Deputy of Event Management', 'deputy-event-management', 'Department leadership: Event Management Department Deputy Head.', false, 190, 'active'),
  ('Head of Graphics', 'head-graphics', 'Department leadership: Graphics & Creative Department Head.', false, 200, 'active'),
  ('Head of Public Relations', 'head-public-relations', 'Department leadership: Public Relations Department Head.', false, 210, 'active'),
  ('Deputy of Public Relations', 'deputy-public-relations', 'Department leadership: Public Relations Department Deputy Head.', false, 220, 'active'),
  ('Executive Members', 'executive-members', 'General UIUSSC Executive Members.', false, 300, 'active'),
  ('Executive Member - Department of Blood', 'executive-member-blood', 'Executive Member linked to the Blood Department.', false, 310, 'active'),
  ('Executive Member - Department of Volunteer Management', 'executive-member-volunteer-management', 'Executive Member linked to the Volunteer Management Department.', false, 320, 'active'),
  ('Executive Member - Department of Marketing', 'executive-member-marketing', 'Executive Member linked to the Marketing Department.', false, 330, 'active'),
  ('Executive Member - Department of Logistics', 'executive-member-logistics', 'Executive Member linked to the Logistics Department.', false, 340, 'active'),
  ('Executive Member - Department of Event Management', 'executive-member-event-management', 'Executive Member linked to the Event Management Department.', false, 350, 'active'),
  ('Executive Member - Department of Graphics & Creative', 'executive-member-graphics-creative', 'Executive Member linked to the Graphics & Creative Department.', false, 360, 'active'),
  ('Executive Member - Department of Public Relations', 'executive-member-public-relations', 'Executive Member linked to the Public Relations Department.', false, 370, 'active'),
  ('Executive Member - General Support & Coordination', 'executive-member-general-support', 'Executive Member for general support and coordination.', false, 380, 'active')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    is_core_panel = excluded.is_core_panel,
    display_order = excluded.display_order,
    status = 'active',
    archived_at = null;

update public.club_positions
set name = 'Vice-President',
    description = 'Core Executive Leadership: UIUSSC Vice-President.',
    is_core_panel = true,
    display_order = 20,
    status = 'active',
    archived_at = null
where slug = 'vice-president';

update public.club_positions
set status = 'archived',
    archived_at = coalesce(archived_at, now())
where slug in ('joint-secretary', 'organizing-secretary', 'executive-member')
  and status <> 'archived';

select public.write_club_audit_log(
  'club_structure.official_hierarchy_aligned',
  'club_position',
  null,
  null,
  jsonb_build_object(
    'official_core_positions', jsonb_build_array('president', 'vice-president', 'assistant-vice-president', 'general-secretary', 'treasurer'),
    'official_departments', jsonb_build_array('blood', 'volunteer-management', 'marketing', 'logistics', 'event-management', 'graphics-creative', 'public-relations'),
    'archived_obsolete_positions', jsonb_build_array('joint-secretary', 'organizing-secretary', 'executive-member')
  )
);
