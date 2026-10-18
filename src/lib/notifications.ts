import type { Payload, PayloadRequest } from 'payload'

export async function notifyEnquiry(payload: Payload, enquiry: Record<string, any>, req?: PayloadRequest) {
  let state = 'disabled'
  let error = ''
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req })
    const recipient = settings.notificationEmail || process.env.OWNER_EMAIL
    if (process.env.SMTP_HOST && process.env.SMTP_FROM && recipient) {
      await payload.sendEmail({
        to: recipient,
        subject: 'New styling enquiry — Styled by Al',
        text: ['New enquiry', `Name: ${enquiry.name}`, `Email: ${enquiry.email}`, `Phone: ${enquiry.phone || 'Not supplied'}`, `Service: ${enquiry.service}`, `Date: ${enquiry.eventDate || 'To be discussed'}`, `Location: ${enquiry.location || 'To be discussed'}`, `Budget: ${enquiry.budget || 'To be discussed'}`, '', enquiry.message].join('\n'),
      })
      state = 'sent'
    }
  } catch {
    state = 'failed'
    error = 'Email delivery failed. The enquiry is safely stored. Check SMTP settings and retry.'
  }
  return payload.update({ collection: 'enquiries', id: enquiry.id, overrideAccess: true, req, context: { skipNotification: true }, data: { notificationStatus: state as 'disabled' | 'sent' | 'failed', notificationError: error, resendNotification: false } })
}
