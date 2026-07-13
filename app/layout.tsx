import "./globals.css"
import type { ReactNode } from 'react'
import AppHeader from '@/components/AppHeader'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'UIUSSC | United International University Social Services Club',
  description: 'United International University Social Services Club connects students through volunteerism, social welfare, awareness campaigns, humanitarian activities, and community service.',
  openGraph: {
    title: 'UIUSSC | United International University Social Services Club',
    description: 'United International University Social Services Club connects students through volunteerism, social welfare, awareness campaigns, humanitarian activities, and community service.',
    type: 'website'
  }
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: ReactNode }){
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
