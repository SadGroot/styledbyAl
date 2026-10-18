import type { MetadataRoute } from 'next'
import { getWorks } from '@/lib/content'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { if (process.env.SITE_INDEXABLE !== 'true') return []; const base = process.env.SITE_URL || 'http://localhost:3000'; const works = await getWorks(); return ['', '/work', '/services', '/about', '/enquire', '/privacy', ...works.map(w => `/work/${w.slug}`)].map(path => ({ url: base + path })) }
