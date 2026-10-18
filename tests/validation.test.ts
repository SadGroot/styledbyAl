import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enquirySchema, allowRequest, trustedOrigin } from '../src/lib/enquiry'
import { hasUploadSpace, reserveBytes, mediaBudget } from '../src/lib/storage'

const valid = { name: 'Sample Client', email: 'client@example.com', service: 'bridal', message: 'I would love to discuss bridal styling.', consent: true }
test('enquiries require valid contact information, service, message, and consent', () => {
  assert.equal(enquirySchema.safeParse(valid).success, true)
  for (const invalid of [{ email: 'broken' }, { service: 'unknown' }, { consent: false }, { message: 'Hi' }, { name: '' }]) assert.equal(enquirySchema.safeParse({ ...valid, ...invalid }).success, false)
})
test('rate limit expires and isolates visitors', () => {
  assert.equal(allowRequest('test-one', 100, 2, 1000), true)
  assert.equal(allowRequest('test-one', 200, 2, 1000), true)
  assert.equal(allowRequest('test-one', 300, 2, 1000), false)
  assert.equal(allowRequest('test-two', 300, 2, 1000), true)
  assert.equal(allowRequest('test-one', 1200, 2, 1000), true)
})
test('same-origin submissions are accepted and foreign origins rejected', () => {
  assert.equal(trustedOrigin('http://localhost:3000', 'http://localhost:3000/api/enquiry'), true)
  assert.equal(trustedOrigin('https://other.example', 'http://localhost:3000/api/enquiry'), false)
})
test('uploads preserve the disk reserve including generated image variants', () => {
  assert.equal(hasUploadSpace(reserveBytes + 1024, 1024), false)
  assert.equal(hasUploadSpace(reserveBytes + 10000, 1024), true)
  assert.equal(hasUploadSpace(reserveBytes * 8, 1024, mediaBudget - 10), false)
})
