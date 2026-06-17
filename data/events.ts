import type { Event } from '@/types'

export const events: Event[] = [
  {
    slug: 'blood-donation-campaign',
    title: 'Blood Donation Campaign',
    category: 'Blood Donation',
    date: '2026-08-12',
    location: 'UIU Campus Auditorium',
    description: 'A campus-wide blood donation drive in partnership with local hospitals.',
    status: 'Open',
    requirements: 'Donors should be 18+ and healthy.'
  },
  {
    slug: 'winter-cloth-drive',
    title: 'Winter Cloth Donation Drive',
    category: 'Donation Drive',
    date: '2026-11-01',
    location: 'UIU Grounds',
    description: 'Collecting warm clothes for underprivileged communities.',
    status: 'Open'
  },
  {
    slug: 'volunteer-orientation',
    title: 'Volunteer Orientation',
    category: 'Orientation',
    date: '2026-07-05',
    location: 'Room 204',
    description: 'Orientation for new volunteers with schedules and expectations.',
    status: 'Closed'
  },
  {
    slug: 'social-awareness-campaign',
    title: 'Social Awareness Campaign',
    category: 'Campaign',
    date: '2026-09-20',
    location: 'City Center',
    description: 'Awareness campaign on public health and hygiene.',
    status: 'Open'
  }
]
