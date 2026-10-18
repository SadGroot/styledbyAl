import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export type Photograph = { id: number; src: string; thumb: string; detail: string; alt: string; credit?: string; width?: number; height?: number }
export type Work = { id: number; title: string; slug: string; category: string; subtitle: string; description: string; cover: Photograph; gallery: { image: Photograph; caption?: string }[]; credits: { role: string; name: string }[]; videoLinks: { label: string; url: string }[]; previewImagery: boolean; featured: boolean }

export const cms = cache(() => getPayload({ config }))
export function photograph(media: any): Photograph {
  if (!media || typeof media !== 'object') return { id: 0, src: '/images/editorial.jpg', thumb: '/images/editorial.jpg', detail: '/images/editorial.jpg', alt: 'Preview fashion photograph' }
  const local = (url: string) => url?.startsWith('http') ? new URL(url).pathname : url
  return { id: media.id, src: local(media.sizes?.gallery?.url || media.url), thumb: local(media.sizes?.thumbnail?.url || media.url), detail: local(media.sizes?.detail?.url || media.url), alt: media.alt || '', credit: media.credit, width: media.width, height: media.height }
}
function work(doc: any): Work {
  return { ...doc, cover: photograph(doc.cover), gallery: (doc.gallery || []).map((g: any) => ({ image: photograph(g.image), caption: g.caption })), credits: doc.credits || [], videoLinks: doc.videoLinks || [] }
}
export const getSettings = cache(async () => {
  const payload = await cms()
  return payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false })
})
export const getWorks = cache(async () => {
  const payload = await cms()
  const result = await payload.find({ collection: 'projects', depth: 1, limit: 200, sort: 'order', draft: false, overrideAccess: false })
  return result.docs.map(work)
})
export const getServices = cache(async () => {
  const payload = await cms()
  return (await payload.find({ collection: 'services', sort: 'order', limit: 20, overrideAccess: false })).docs
})
export async function getWork(slug: string, preview = false) {
  const payload = await cms()
  const { user } = preview ? await payload.auth({ headers: await headers() }) : { user: null }
  const result = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, depth: 1, limit: 1, draft: Boolean(user), overrideAccess: Boolean(user) })
  return result.docs[0] ? work(result.docs[0]) : null
}
