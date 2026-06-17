-- UIUSSC Phase 2A seed data
-- Public sample data only. No private intake records are seeded.

insert into public.events (
  title,
  slug,
  summary,
  description,
  category,
  event_date,
  location,
  volunteer_requirements,
  registration_open,
  status,
  published_at
) values
  (
    'Blood Donation Campaign',
    'blood-donation-campaign',
    'A campus-wide blood donation drive in partnership with local hospitals.',
    'A campus-wide blood donation drive in partnership with local hospitals.',
    'Blood Donation',
    date '2026-08-12',
    'UIU Campus Auditorium',
    'Donors should be 18+ and healthy.',
    true,
    'published',
    now()
  ),
  (
    'Winter Cloth Donation Drive',
    'winter-cloth-drive',
    'Collecting warm clothes for underprivileged communities.',
    'Collecting warm clothes for underprivileged communities.',
    'Donation Drive',
    date '2026-11-01',
    'UIU Grounds',
    null,
    true,
    'published',
    now()
  ),
  (
    'Volunteer Orientation',
    'volunteer-orientation',
    'Orientation for new volunteers with schedules and expectations.',
    'Orientation for new volunteers with schedules and expectations.',
    'Orientation',
    date '2026-07-05',
    'Room 204',
    null,
    false,
    'published',
    now()
  ),
  (
    'Social Awareness Campaign',
    'social-awareness-campaign',
    'Awareness campaign on public health and hygiene.',
    'Awareness campaign on public health and hygiene.',
    'Campaign',
    date '2026-09-20',
    'City Center',
    null,
    true,
    'published',
    now()
  )
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  category = excluded.category,
  event_date = excluded.event_date,
  location = excluded.location,
  volunteer_requirements = excluded.volunteer_requirements,
  registration_open = excluded.registration_open,
  status = excluded.status,
  published_at = coalesce(public.events.published_at, excluded.published_at);

insert into public.notices (
  title,
  slug,
  excerpt,
  content,
  category,
  priority,
  is_pinned,
  status,
  published_at
) values
  (
    'Volunteer Meeting',
    'volunteer-meeting',
    'All volunteers must attend a briefing in Auditorium A.',
    'All volunteers must attend a briefing in Auditorium A.',
    'Meeting',
    'urgent',
    true,
    'published',
    now()
  ),
  (
    'Equipment Collection',
    'equipment-collection',
    'Drop off donation materials at the club office.',
    'Drop off donation materials at the club office.',
    'Logistics',
    'normal',
    false,
    'published',
    now()
  ),
  (
    'Registration Deadline',
    'registration-deadline',
    'Register for the Blood Donation Campaign before the deadline.',
    'Register for the Blood Donation Campaign before the deadline.',
    'Deadline',
    'important',
    true,
    'published',
    now()
  )
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  category = excluded.category,
  priority = excluded.priority,
  is_pinned = excluded.is_pinned,
  status = excluded.status,
  published_at = coalesce(public.notices.published_at, excluded.published_at);

insert into public.gallery_items (
  title,
  caption,
  image_url,
  category,
  event_id,
  display_order,
  status,
  published_at
)
select
  seed.title,
  seed.caption,
  seed.image_url,
  seed.category,
  events.id,
  seed.display_order,
  'published',
  now()
from (
  values
    ('Blood drive at UIU', 'Blood drive at UIU', '/gallery/placeholders/blood-drive.jpg', 'Blood Donation', 'blood-donation-campaign', 0),
    ('Cloth donation collection', 'Cloth donation collection', '/gallery/placeholders/cloth-donation.jpg', 'Donation Drive', 'winter-cloth-drive', 1),
    ('Volunteer orientation session', 'Volunteer orientation session', '/gallery/placeholders/orientation.jpg', 'Orientation', 'volunteer-orientation', 2),
    ('Awareness campaign on hygiene', 'Awareness campaign on hygiene', '/gallery/placeholders/awareness-campaign.jpg', 'Campaign', 'social-awareness-campaign', 3)
) as seed(title, caption, image_url, category, event_slug, display_order)
left join public.events on events.slug = seed.event_slug
where not exists (
  select 1
  from public.gallery_items
  where gallery_items.image_url = seed.image_url
);
