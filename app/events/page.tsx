import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import EventList from '@/components/events/EventList'
import ContentUnavailable from '@/components/states/ContentUnavailable'
import EmptyState from '@/components/states/EmptyState'
import { getPublishedEvents } from '@/features/events/queries/getPublishedEvents'

export const dynamic = 'force-dynamic'

export default async function Events(){
  const result = await getPublishedEvents()

  return (
    <Container>
      <PageHeader
        title="Events"
        subtitle="Explore upcoming and past UIUSSC programs, from blood donation campaigns to volunteer orientations and community drives."
      />

      {result.error && <ContentUnavailable title="Events are temporarily unavailable" description="Please refresh the page or check back soon for UIUSSC event updates." />}
      {result.data && result.data.length === 0 && <EmptyState title="No published events yet" description="Upcoming UIUSSC programs will appear here once they are published." />}
      {result.data && result.data.length > 0 && <EventList events={result.data} />}
    </Container>
  )
}
