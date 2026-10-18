import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import { buildConfig, APIError, type Access, type CollectionConfig, type GlobalConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'
import { services } from './lib/constants'
import { mediaDir, storageUsage, hasUploadSpace } from './lib/storage'
import { notifyEnquiry } from './lib/notifications'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))
mkdirSync(mediaDir, { recursive: true })
const databaseURL = process.env.DATABASE_URL || 'file:./data/styledbyal.db'
if (databaseURL.startsWith('file:')) mkdirSync(path.dirname(path.resolve(databaseURL.slice(5))), { recursive: true })
sharp.concurrency(1)
sharp.cache({ memory: 16, files: 0, items: 16 })
const owner: Access = ({ req }) => Boolean(req.user)
const published: Access = ({ req }) => req.user ? true : { _status: { equals: 'published' } }
const options = services.map(s => ({ label: s.label, value: s.value }))
const imageIDs = (doc: any): number[] => [doc?.cover, ...(doc?.gallery || []).map((g: any) => g.image)].filter(Boolean).map((id: any) => typeof id === 'object' ? id.id : id)

async function syncMedia(payload: any, ids: number[], req: any) {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, req })
  for (const id of new Set(ids)) {
    const projects = await payload.find({ collection: 'projects', depth: 0, limit: 1, req, where: { and: [{ _status: { equals: 'published' } }, { or: [{ cover: { equals: id } }, { 'gallery.image': { equals: id } }] }] } })
    const isPublic = projects.totalDocs > 0 || [settings.heroImage, settings.portrait].includes(id)
    await payload.update({ collection: 'media', id, data: { isPublic }, overrideAccess: true, req })
  }
}

const Users: CollectionConfig = {
  slug: 'users', auth: { maxLoginAttempts: 5, lockTime: 600000, cookies: { sameSite: 'Lax', secure: process.env.SITE_URL?.startsWith('https://') || false } },
  admin: { useAsTitle: 'email', description: 'The private owner account. Public registration is disabled.' },
  access: { create: () => false, read: owner, update: owner, delete: () => false },
  hooks: { beforeOperation: [async ({ operation, req }) => {
    if (operation === 'create') {
      if (!req.context.bootstrap) throw new APIError('Owner creation is available only through the setup script.', 403)
      const existing = await req.payload.count({ collection: 'users', overrideAccess: true })
      if (existing.totalDocs) throw new APIError('The owner has already been configured.', 403)
    }
  }] },
  fields: [{ name: 'name', type: 'text', defaultValue: 'Al' }],
}

const Media: CollectionConfig = {
  slug: 'media',
  admin: { description: 'JPEG, PNG, or WebP. Up to 10 MB and 24 megapixels. Images become public when used in published content.' },
  access: { create: owner, update: owner, delete: owner, read: ({ req }) => req.user ? true : { isPublic: { equals: true } } },
  upload: {
    staticDir: mediaDir, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    adminThumbnail: 'thumbnail',
    resizeOptions: { width: 2400, height: 3200, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 86 } },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 500, fit: 'cover', formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'gallery', width: 1000, height: 1400, fit: 'inside', withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'detail', width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 86 } } },
    ],
  },
  hooks: {
    beforeOperation: [async ({ operation, req }) => {
      if ((operation === 'create' || operation === 'update') && req.file) {
        if (req.file.size > 10 * 1024 ** 2) throw new APIError('Images must be smaller than 10 MB.', 400)
        const metadata = await sharp(req.file.data, { limitInputPixels: 24000000 }).metadata().catch(() => null)
        if (!metadata || !['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new APIError('Please use a JPEG, PNG, or WebP photograph under 24 megapixels.', 400)
        const disk = await storageUsage()
        if (!hasUploadSpace(disk.available, req.file.size, disk.used)) throw new APIError('Storage is nearly full or the 2 GB media budget has been reached. Download a backup and remove unused media before uploading.', 507)
      }
    }],
    beforeDelete: [async ({ id, req }) => {
      const projects = await req.payload.find({ collection: 'projects', limit: 1, depth: 0, where: { or: [{ cover: { equals: id } }, { 'gallery.image': { equals: id } }] } })
      const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })
      if (projects.totalDocs || [settings.heroImage, settings.portrait].includes(Number(id))) throw new APIError('This image is in use. Remove it from its project or site settings first.', 400)
    }],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, admin: { description: 'Describe the photograph for visitors using screen readers.' } },
    { name: 'credit', type: 'text' },
    { name: 'isPublic', type: 'checkbox', defaultValue: false, admin: { readOnly: true, position: 'sidebar' }, access: { update: () => false } },
  ],
}

const Projects: CollectionConfig = {
  slug: 'projects',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', '_status', 'featured'], preview: doc => `${process.env.SITE_URL || ''}/work/${doc.slug}?preview=true` },
  access: { read: published, create: owner, update: owner, delete: owner },
  versions: { drafts: true, maxPerDoc: 10 },
  hooks: {
    afterChange: [async ({ doc, previousDoc, req }) => { await syncMedia(req.payload, [...imageIDs(doc), ...imageIDs(previousDoc)], req) }],
    afterDelete: [async ({ doc, req }) => { await syncMedia(req.payload, imageIDs(doc), req) }],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, validate: (v: any) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v || '') || 'Use lowercase words separated by hyphens.' },
    { name: 'category', type: 'select', options, required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'description', type: 'textarea', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }, { name: 'caption', type: 'text' }] },
    { name: 'credits', type: 'array', fields: [{ name: 'role', type: 'text', required: true }, { name: 'name', type: 'text', required: true }] },
    { name: 'videoLinks', type: 'array', fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true, validate: (v: any) => { try { const u = new URL(v); return u.protocol === 'https:' && /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|instagram\.com)$/.test(u.hostname) || 'Use an HTTPS YouTube, Vimeo, or Instagram link.' } catch { return 'Enter a valid video URL.' } } }] },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'previewImagery', type: 'checkbox', defaultValue: false, admin: { description: 'Show an explicit preview-imagery label for demonstration projects.', position: 'sidebar' } },
  ],
}

const Services: CollectionConfig = {
  slug: 'services', admin: { useAsTitle: 'title' },
  access: { read: () => true, create: owner, update: owner, delete: owner },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'key', type: 'select', options, required: true, unique: true },
    { name: 'tagline', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'process', type: 'textarea', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'service', 'status', 'notificationStatus', 'createdAt'] },
  access: { create: () => false, read: owner, update: owner, delete: owner },
  hooks: { afterChange: [async ({ doc, req }) => {
    if (doc.resendNotification && !req.context.skipNotification) return notifyEnquiry(req.payload, doc, req)
  }] },
  fields: [
    { name: 'name', type: 'text', required: true }, { name: 'email', type: 'email', required: true },
    { name: 'service', type: 'select', options, required: true }, { name: 'message', type: 'textarea', required: true },
    { name: 'phone', type: 'text' }, { name: 'eventDate', type: 'text' }, { name: 'location', type: 'text' }, { name: 'budget', type: 'text' },
    { name: 'consent', type: 'checkbox', required: true },
    { name: 'status', type: 'select', defaultValue: 'new', options: ['new', 'contacted', 'closed'], required: true, admin: { position: 'sidebar' } },
    { name: 'submissionKey', type: 'text', unique: true, index: true, admin: { hidden: true } },
    { name: 'notificationStatus', type: 'select', options: ['disabled', 'sent', 'failed'], defaultValue: 'disabled', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'notificationError', type: 'textarea', admin: { readOnly: true } },
    { name: 'resendNotification', type: 'checkbox', label: 'Retry email notification on save', admin: { description: 'The enquiry is already stored. Configure SMTP before retrying a failed notification.' } },
  ],
}

const SiteSettings: GlobalConfig = {
  slug: 'site-settings', label: 'Site settings',
  access: { read: () => true, update: owner },
  hooks: { afterChange: [async ({ doc, previousDoc, req }) => {
    const ids = [doc.heroImage, doc.portrait, previousDoc?.heroImage, previousDoc?.portrait].filter(Boolean).map((v: any) => typeof v === 'object' ? v.id : v)
    await syncMedia(req.payload, ids, req)
  }] },
  fields: [
    { name: 'brandName', type: 'text', defaultValue: 'Styled by Al', required: true },
    { name: 'previewEdition', type: 'checkbox', defaultValue: true, label: 'Show preview edition labels', admin: { description: 'Turn off after replacing the illustrative portrait and hero with real assets.' } },
    { name: 'heroLine', type: 'text', defaultValue: 'A feeling.\nAn expression.\nEntirely you.', required: true },
    { name: 'heroIntro', type: 'textarea', defaultValue: 'Considered styling for the moments that become your story. Celebrity, bridal & personal styling, based in Kerala.' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'aboutHeading', type: 'text', defaultValue: 'The person\nbehind the look.' },
    { name: 'aboutText', type: 'textarea', defaultValue: 'Style begins with a conversation. About who you are, how you want to feel, and the moment you are stepping into. Styled by Al is a Kerala-based styling practice exploring the intersection of individuality and considered dressing.' },
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    { name: 'contactEmail', type: 'email' },
    { name: 'whatsapp', type: 'text', validate: (v: any) => !v || /^\+?[1-9]\d{7,14}$/.test(v) || 'Use a full international number, for example +919876543210.' },
    { name: 'instagram', type: 'text', validate: (v: any) => !v || /^https:\/\/(www\.)?instagram\.com\//.test(v) || 'Use an HTTPS Instagram profile URL.' },
    { name: 'location', type: 'text', defaultValue: 'Kerala, India' },
    { name: 'notificationEmail', type: 'email', label: 'Private email for enquiry notifications', access: { read: ({ req }) => Boolean(req.user) } },
  ],
}

if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is required. See .env.example.')

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.SITE_URL || 'http://localhost:3000',
  routes: { admin: '/studio' },
  admin: {
    user: 'users', importMap: { baseDir: dirname },
    meta: { titleSuffix: '— Styled by Al Studio', robots: { index: false, follow: false } },
    components: {
      graphics: { Logo: '/components/StudioBrand#StudioBrand', Icon: '/components/StudioBrand#StudioIcon' },
      beforeDashboard: ['/components/StudioIntro#StudioIntro'],
    },
  },
  csrf: [process.env.SITE_URL || 'http://localhost:3000'],
  cors: [process.env.SITE_URL || 'http://localhost:3000'],
  collections: [Users, Projects, Media, Services, Enquiries],
  globals: [SiteSettings],
  editor: lexicalEditor(), sharp,
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || 'file:./data/styledbyal.db' }, wal: true, busyTimeout: 5000, migrationDir: path.resolve(dirname, 'migrations'), prodMigrations: migrations, push: false }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  upload: { limits: { fileSize: 10 * 1024 ** 2 }, abortOnLimit: true },
  ...(process.env.SMTP_HOST ? { email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM || 'hello@localhost', defaultFromName: 'Styled by Al',
    transportOptions: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === '465', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000 },
  }) } : { email: () => ({ name: 'unconfigured', defaultFromAddress: 'studio@localhost', defaultFromName: 'Styled by Al', sendEmail: async () => { throw new Error('Email delivery has not been configured.') } }) }),
})
