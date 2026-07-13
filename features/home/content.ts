import type { ServiceArea } from './types'

export const introValues = [
  {
    title: 'Compassion',
    description: 'We approach people and communities with empathy, respect, and care.',
  },
  {
    title: 'Responsibility',
    description: 'We plan and serve with accountability to students, partners, and beneficiaries.',
  },
  {
    title: 'Collaboration',
    description: 'We work across departments, volunteers, alumni, and community partners.',
  },
  {
    title: 'Impact',
    description: 'We focus on programs that create practical, meaningful social value.',
  },
]

export const serviceAreas: ServiceArea[] = [
  {
    title: 'Blood Donation',
    category: 'Blood Donation',
    description: 'Campus donor mobilization, awareness, and hospital-supported blood drives.',
  },
  {
    title: 'Relief & Donation Drives',
    category: 'Donation Drive',
    description: 'Collection and distribution support for clothing, essentials, and relief materials.',
  },
  {
    title: 'Community Awareness',
    category: 'Campaign',
    description: 'Student-led campaigns on health, hygiene, safety, and civic responsibility.',
  },
  {
    title: 'Volunteer Development',
    category: 'Orientation',
    description: 'Training, orientation, and coordination opportunities for student volunteers.',
  },
  {
    title: 'Elderly Care',
    description: 'Programs developing around compassionate support for elderly communities.',
  },
  {
    title: 'Education Support',
    description: 'Programs developing around learning support and educational outreach.',
  },
]

export const volunteerBenefits = [
  {
    title: 'Build Leadership',
    description: 'Lead teams, coordinate tasks, and learn to make decisions with responsibility.',
  },
  {
    title: 'Serve Communities',
    description: 'Take part in meaningful initiatives that support real community needs.',
  },
  {
    title: 'Develop Practical Skills',
    description: 'Grow communication, planning, documentation, and event-management experience.',
  },
  {
    title: 'Join a Purpose-Driven Network',
    description: 'Work with students who care about humanity, service, and civic responsibility.',
  },
]

export const getInvolvedOptions = [
  {
    title: 'Join as a Member',
    description: 'Become part of UIUSSC and contribute to long-term student-led social impact.',
    cta: 'Apply for Membership',
    href: '/membership',
  },
  {
    title: 'Volunteer at an Event',
    description: 'Support blood donation, awareness, donation drives, and volunteer programs.',
    cta: 'Explore Events',
    href: '/events',
  },
  {
    title: 'Collaborate as a Partner',
    description: 'Work with UIUSSC on responsible campaigns and community-service initiatives.',
    cta: 'Start a Collaboration',
    href: '/contact',
  },
]
