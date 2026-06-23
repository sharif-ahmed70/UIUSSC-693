import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import ImpactSnapshot from '@/components/home/ImpactSnapshot'
import IntroductionSection from '@/components/home/IntroductionSection'
import FeaturedInitiatives from '@/components/home/FeaturedInitiatives'
import ServiceAreas from '@/components/home/ServiceAreas'
import EventSpotlight from '@/components/home/EventSpotlight'
import ImpactGallery from '@/components/home/ImpactGallery'
import VolunteerBenefits from '@/components/home/VolunteerBenefits'
import GetInvolvedSection from '@/components/home/GetInvolvedSection'
import CollaborationCTA from '@/components/home/CollaborationCTA'
import MembershipCTA from '@/components/home/MembershipCTA'
import { getHomePageData } from '@/features/home/queries/getHomePageData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'UIUSSC | United International University Social Services Club',
  description: 'United International University Social Services Club connects students through volunteerism, social welfare, awareness campaigns, humanitarian activities, and community service.',
  openGraph: {
    title: 'UIUSSC | United International University Social Services Club',
    description: 'United International University Social Services Club connects students through volunteerism, social welfare, awareness campaigns, humanitarian activities, and community service.',
    type: 'website',
  },
}

export default async function Home(){
  const data = await getHomePageData()

  return (
    <div className="landing-shell">
      <HeroSection data={data} />
      <ImpactSnapshot metrics={data.impactMetrics} />
      <IntroductionSection image={data.introImage} />
      <FeaturedInitiatives events={data.featuredEvents} />
      <ServiceAreas categoryCounts={data.categoryCounts} />
      <EventSpotlight event={data.nextEvent} />
      <ImpactGallery items={data.galleryItems} />
      <VolunteerBenefits image={data.volunteerImage} />
      <GetInvolvedSection />
      <CollaborationCTA image={data.heroImage} />
      <MembershipCTA />
    </div>
  )
}
