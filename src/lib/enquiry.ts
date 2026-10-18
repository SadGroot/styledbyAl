import { z } from 'zod'
import { services } from './constants'

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(254),
  service: z.enum(services.map(s => s.value), { error: 'Please choose a service.' }),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(5000),
  phone: z.string().trim().max(40).optional().default(''),
  eventDate: z.string().max(10).refine(v => {
    if (!v) return true
    const date = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v
  }, 'Please choose a valid date.').optional().default(''),
  location: z.string().trim().max(160).optional().default(''),
  budget: z.string().trim().max(100).optional().default(''),
  consent: z.literal(true, { error: 'Please allow us to contact you about this enquiry.' }),
  submissionKey: z.string().max(100).optional(),
})

// ponytail: one app process; use a shared limiter if deploying multiple instances.
const windows = new Map<string, { count: number; until: number }>()
export function allowRequest(key: string, now = Date.now(), max = 5, duration = 3600000) {
  const window = windows.get(key)
  if (!window || window.until < now) {
    if (windows.size >= 2000) windows.delete(windows.keys().next().value!)
    windows.set(key, { count: 1, until: now + duration })
    return true
  }
  if (window.count >= max) return false
  window.count++
  return true
}

export function trustedOrigin(origin: string | null, requestURL: string) {
  const expected = process.env.SITE_URL || new URL(requestURL).origin
  return !origin || origin === new URL(expected).origin
}
