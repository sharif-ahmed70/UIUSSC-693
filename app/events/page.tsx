import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import EventList from '@/components/events/EventList'
import { events } from '@/data/events'

export default function Events(){
  return (
    <Container>
      <PageHeader
        title="Events"
        subtitle="Explore upcoming and past UIUSSC programs, from blood donation campaigns to volunteer orientations and community drives."
      />

      <EventList events={events} />
    </Container>
  )
}
