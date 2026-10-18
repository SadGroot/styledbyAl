import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Payload } from 'payload'
import { notifyEnquiry } from '../src/lib/notifications'

test('email failure records a retryable status without deleting the saved enquiry', async () => {
  const before = { host: process.env.SMTP_HOST, from: process.env.SMTP_FROM }
  process.env.SMTP_HOST = 'smtp.test'
  process.env.SMTP_FROM = 'studio@example.com'
  let updated: any
  const payload = {
    findGlobal: async () => ({ notificationEmail: 'owner@example.com' }),
    sendEmail: async () => { throw new Error('Simulated delivery failure') },
    update: async (input: any) => { updated = input; return { id: input.id, ...input.data } },
  } as unknown as Payload
  try {
    const result = await notifyEnquiry(payload, { id: 12, name: 'Client', email: 'client@example.com', service: 'bridal', message: 'A saved enquiry' })
    assert.equal(result.notificationStatus, 'failed')
    assert.equal(updated.id, 12)
    assert.equal(updated.data.notificationStatus, 'failed')
    assert.match(updated.data.notificationError, /safely stored/)
    assert.equal(updated.data.resendNotification, false)
  } finally {
    if (before.host === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = before.host
    if (before.from === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = before.from
  }
})
