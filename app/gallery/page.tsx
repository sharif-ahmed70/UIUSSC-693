import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import ContentUnavailable from '@/components/states/ContentUnavailable'
import EmptyState from '@/components/states/EmptyState'
import { getPublishedGalleryItems } from '@/features/gallery/queries/getPublishedGalleryItems'

export const dynamic = 'force-dynamic'

export default async function Gallery(){
  const result = await getPublishedGalleryItems()

  return (
    <Container>
      <PageHeader
        title="Gallery"
        subtitle="A visual archive of UIUSSC events, campaigns, orientations, and volunteer activities."
      />

      {result.error && <ContentUnavailable title="Gallery is temporarily unavailable" description="Please refresh the page or check back soon for UIUSSC activity photos." />}
      {result.data && result.data.length === 0 && <EmptyState title="No gallery items published" description="Published UIUSSC activity highlights will appear here." />}
      {result.data && result.data.length > 0 && <GalleryGrid items={result.data} />}
    </Container>
  )
}
