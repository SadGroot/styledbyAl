import type { MetadataRoute } from 'next'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots { return { rules: process.env.SITE_INDEXABLE === 'true' ? { userAgent: '*', allow: '/', disallow: ['/studio', '/api', '/*?preview='] } : { userAgent: '*', disallow: '/' }, ...(process.env.SITE_INDEXABLE === 'true' ? { sitemap: `${process.env.SITE_URL}/sitemap.xml` } : {}) } }
