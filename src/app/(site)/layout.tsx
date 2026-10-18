import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/manrope'
import './style.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getSettings } from '@/lib/content'

export const dynamic = 'force-dynamic'
export const viewport: Viewport = { themeColor: '#141311', width: 'device-width', initialScale: 1 }
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: 'Styled by Al — A feeling. An expression. Entirely you.', template: '%s — Styled by Al' },
  description: 'Considered celebrity, bridal, event, and personal styling. A Kerala-based styling practice with an individual point of view.',
  robots: process.env.SITE_INDEXABLE === 'true' ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'Styled by Al', title: 'Styled by Al', description: 'Considered styling. An individual point of view.', images: [{ url: '/images/editorial.jpg', alt: 'Styled by Al — preview editorial imagery' }] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header brand={settings.brandName} /><main id="main">{children}</main><Footer settings={settings} /></body></html>
}
