import { createHash } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { enquirySchema, allowRequest, trustedOrigin } from '@/lib/enquiry'
import { notifyEnquiry } from '@/lib/notifications'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!trustedOrigin(request.headers.get('origin'), request.url)) return Response.json({ message: 'This request could not be verified.' }, { status: 403 })
  try {
    const reader = request.body?.getReader()
    if (!reader) return Response.json({ message: 'Please complete the enquiry form.' }, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 16384) { await reader.cancel(); return Response.json({ message: 'Your message is too long.' }, { status: 413 }) }
      chunks.push(value)
    }
    const text = Buffer.concat(chunks).toString('utf8')
    const isJSON = request.headers.get('content-type')?.includes('application/json')
    const input = isJSON ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text))
    if (!input || typeof input !== 'object' || Array.isArray(input)) return Response.json({ message: 'Please submit a valid enquiry.' }, { status: 400 })
    if (!isJSON) input.consent = input.consent === 'on'
    if (input.website) return Response.json({ received: true })
    if (input.startedAt && Date.now() - Number(input.startedAt) < 800) return Response.json({ message: 'Take a moment to tell us your story, then send again.' }, { status: 400 })
    const parsed = enquirySchema.safeParse(input)
    if (!parsed.success) return Response.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    const payload = await getPayload({ config })
    const data = parsed.data
    const submissionKey = data.submissionKey || createHash('sha256').update(`${data.email.toLowerCase()}:${data.message}:${Math.floor(Date.now() / 3600000)}`).digest('hex')
    const existing = await payload.find({ collection: 'enquiries', where: { submissionKey: { equals: submissionKey } }, limit: 1, depth: 0, overrideAccess: true })
    if (existing.totalDocs) return isJSON ? Response.json({ received: true }) : Response.redirect(new URL('/enquire?received=1', request.url), 303)
    const ip = request.headers.get('cf-connecting-ip') || 'local'
    if (!allowRequest(ip)) return Response.json({ message: 'A few messages have already arrived from this connection. Please try again in an hour.' }, { status: 429, headers: { 'Retry-After': '3600' } })
    const doc = await payload.create({ collection: 'enquiries', data: { ...data, submissionKey, status: 'new' }, overrideAccess: true })
    await notifyEnquiry(payload, doc)
    return isJSON ? Response.json({ received: true }, { status: 201 }) : Response.redirect(new URL('/enquire?received=1', request.url), 303)
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ message: 'Please submit a valid enquiry.' }, { status: 400 })
    console.error('Enquiry submission failed:', error instanceof Error ? error.name : 'Unknown error')
    return Response.json({ message: 'The studio could not save your enquiry. Please try again.' }, { status: 503 })
  }
}
