import { getPayload } from 'payload'
import config from '../src/payload.config'
import { services } from '../src/lib/constants'

const payload = await getPayload({ config })
const owner = await payload.count({ collection: 'users', overrideAccess: true })
if (!owner.totalDocs) {
  if (!process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) throw new Error('Set OWNER_EMAIL and OWNER_PASSWORD before seeding.')
  await payload.create({ collection: 'users', data: { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD, name: 'Al' }, overrideAccess: true, context: { bootstrap: true } })
}
for (const [i, service] of services.entries()) {
  const existing = await payload.find({ collection: 'services', where: { key: { equals: service.value } }, limit: 1 })
  if (!existing.totalDocs) await payload.create({ collection: 'services', data: { title: service.label, key: service.value, tagline: service.description, description: service.detail, process: service.process, order: i } })
}
if (!(await payload.count({ collection: 'projects' })).totalDocs) {
  const images: Record<string, number> = {}
  const files = [
    ['couture', 'A monochrome editorial portrait in a sculptural white dress', 'Vladislav Nahorny / Unsplash · preview imagery'],
    ['bridal', 'A bride in a red and gold lehenga with traditional jewellery', 'Unsplash · preview imagery'],
    ['editorial', 'A fashion portrait in a blue coat in a city square', 'Unsplash · preview imagery'],
    ['silhouette', 'A flowing red occasion dress', 'Unsplash · preview imagery'],
    ['muse', 'A bold yellow contemporary outfit', 'Unsplash · preview imagery'],
    ['portrait', 'An illustrative portrait for the preview edition', 'Unsplash · illustrative portrait, not Al'],
  ]
  for (const [file, alt, credit] of files) {
    const doc = await payload.create({ collection: 'media', data: { alt, credit }, filePath: `public/images/${file}.jpg` })
    images[file] = doc.id
  }
  const projects = [
    { title: 'The art of presence', slug: 'the-art-of-presence', category: 'editorial' as const, cover: 'couture', gallery: ['couture', 'editorial'], subtitle: 'Form, feeling, and a considered point of view.' },
    { title: 'A moment, forever', slug: 'a-moment-forever', category: 'bridal' as const, cover: 'bridal', gallery: ['bridal', 'couture'], subtitle: 'A bridal study in tradition and individuality.' },
    { title: 'An evening in colour', slug: 'an-evening-in-colour', category: 'event' as const, cover: 'silhouette', gallery: ['silhouette', 'couture'], subtitle: 'A silhouette made for the occasion.' },
    { title: 'Your everyday muse', slug: 'your-everyday-muse', category: 'personal' as const, cover: 'editorial', gallery: ['editorial', 'muse'], subtitle: 'Personal style, seen through a different lens.' },
  ]
  for (const [i, project] of projects.entries()) await payload.create({ collection: 'projects', draft: false, data: {
    title: project.title, slug: project.slug, category: project.category, subtitle: project.subtitle,
    description: 'An illustrative visual study exploring silhouette, texture, and self-expression. This preview presents the direction of the portfolio. Genuine styling projects, their stories, and creative credits will take their place.',
    cover: images[project.cover], gallery: project.gallery.map(image => ({ image: images[image], caption: 'Visual study · preview photography' })),
    featured: true, order: i, previewImagery: true, _status: 'published', credits: [{ role: 'Photography', name: 'Preview imagery via Unsplash' }],
  } })
  await payload.updateGlobal({ slug: 'site-settings', data: { heroImage: images.couture, portrait: images.portrait } })
}
console.log('Owner and preview content are ready. Credentials remain in the local environment file.')
await payload.destroy()
