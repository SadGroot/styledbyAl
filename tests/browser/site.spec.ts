import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

test('public pages render on mobile and desktop without overflow', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/work', '/services', '/about', '/enquire', '/privacy', '/work/the-art-of-presence']) {
      expect((await page.goto(path))?.status()).toBe(200)
      await expect(page.locator('main h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
  }
  expect(errors).toEqual([])
})

test('3D exhibition responds to scroll and standard gallery remains available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'View standard gallery' })
  await expect(toggle).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: 'Explore A moment, forever' }).click()
  await expect(page.locator('.spatial-caption')).toContainText('A moment, forever')
  await toggle.click()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.featured-grid .work-card')).toHaveCount(4)
  await page.reload()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('reduced motion and unavailable WebGL use the editorial gallery', async ({ browser }) => {
  for (const reduced of [true, false]) {
    const context = await browser.newContext({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    if (!reduced) await context.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: any[]) { if (type === 'webgl2') return null; return original.apply(this, [type, ...args] as any) } as any })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('.featured-grid .work-card')).toHaveCount(4)
    await expect(page.locator('canvas')).toHaveCount(0)
    await context.close()
  }
})

test('work filters and service-specific enquiry links work', async ({ page }) => {
  await page.goto('/work')
  await page.getByRole('button', { name: 'Bridal styling', exact: true }).click()
  await expect(page.locator('.work-grid .work-card')).toHaveCount(1)
  await page.goto('/services')
  await page.locator('#wardrobe').getByRole('link', { name: 'Enquire about this service' }).click()
  await expect(page.locator('#service')).toHaveValue('wardrobe')
})

test('visitor enquiry persists without email and duplicates are prevented', async ({ request }) => {
  const input = { name: 'QA Enquiry', email: 'qa@example.com', service: 'bridal', message: 'Automated verification of the enquiry inbox.', consent: true, submissionKey: randomUUID(), startedAt: Date.now() - 5000 }
  expect((await request.post('/api/enquiry', { data: { ...input, email: 'invalid' } })).status()).toBe(400)
  expect((await request.post('/api/enquiry', { data: input, headers: { Origin: 'https://untrusted.example' } })).status()).toBe(403)
  expect((await request.post('/api/enquiry', { data: { ...input, website: 'spam.example' } })).status()).toBe(200)
  expect((await request.post('/api/enquiry', { data: input })).status()).toBe(201)
  expect((await request.post('/api/enquiry', { data: input })).status()).toBe(200)
  const login = await request.post('/api/users/login', { data: { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD } })
  expect(login.status()).toBe(200)
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const found = await request.get(`/api/enquiries?where[submissionKey][equals]=${input.submissionKey}`, { headers })
  const result = await found.json()
  expect(result.totalDocs).toBe(1)
  expect(result.docs[0].notificationStatus).toBe('disabled')
  const retry = await request.patch(`/api/enquiries/${result.docs[0].id}`, { headers, data: { resendNotification: true } })
  expect(retry.status()).toBe(200)
  const retried = (await retry.json()).doc
  expect(retried.resendNotification).toBe(false)
  expect(retried.notificationStatus).toBe('disabled')
  await request.delete(`/api/enquiries/${result.docs[0].id}`, { headers })
})

test('owner can upload, preview, publish, reorder, and unpublish; private data stays private', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: process.env.TEST_URL || 'http://localhost:3000' })
  expect((await api.get('/api/enquiries')).status()).toBe(403)
  expect((await api.post('/api/projects', { data: { title: 'Forbidden' } })).status()).toBe(403)
  expect((await api.post('/api/users', { data: { email: 'intruder@example.com', password: 'irrelevant' } })).status()).toBe(403)
  const login = await api.post('/api/users/login', { data: { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD } })
  expect(login.status()).toBe(200)
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const upload = await api.post('/api/media', { headers, multipart: { _payload: JSON.stringify({ alt: 'QA uploaded fashion photograph' }), file: { name: `qa-${randomUUID()}.jpg`, mimeType: 'image/jpeg', buffer: await readFile('public/images/couture.jpg') } } })
  expect(upload.status()).toBe(201)
  const media = (await upload.json()).doc
  const slug = `qa-project-${Date.now()}`
  const create = await api.post('/api/projects', { headers, data: { title: 'QA draft', slug, category: 'bridal', description: 'A private quality assurance project.', cover: media.id, gallery: [{ image: media.id, caption: 'First' }, { image: media.id, caption: 'Second' }], _status: 'draft' } })
  expect(create.status()).toBe(201)
  const project = (await create.json()).doc
  const visitor = await playwright.request.newContext({ baseURL: process.env.TEST_URL || 'http://localhost:3000' })
  try {
    expect((await visitor.get(`/api/projects/${project.id}`)).status()).toBe(404)
    const privatePage = await (await visitor.get(`/work/${slug}`)).text()
    expect(privatePage).toContain('This page is unavailable')
    expect(privatePage).not.toContain('A private quality assurance project.')
    expect((await visitor.get(media.url)).status()).not.toBe(200)
    const privatePreview = await (await visitor.get(`/work/${slug}?preview=true`)).text()
    expect(privatePreview).toContain('This page is unavailable')
    expect(privatePreview).not.toContain('A private quality assurance project.')
    const preview = await api.get(`/work/${slug}?preview=true`, { headers })
    expect(preview.status()).toBe(200)
    expect((await api.patch(`/api/projects/${project.id}`, { headers, data: { _status: 'published', title: 'QA published', gallery: [{ image: media.id, caption: 'Second' }, { image: media.id, caption: 'First' }] } })).status()).toBe(200)
    expect((await visitor.get(`/work/${slug}`)).status()).toBe(200)
    expect((await visitor.get(media.url)).status()).toBe(200)
    const published = await (await visitor.get(`/api/projects/${project.id}`)).json()
    expect(published.gallery[0].caption).toBe('Second')
    expect((await api.patch(`/api/projects/${project.id}`, { headers, data: { _status: 'draft' } })).status()).toBe(200)
    expect(await (await visitor.get(`/work/${slug}`)).text()).toContain('This page is unavailable')
    expect((await visitor.get(media.url)).status()).not.toBe(200)
  } finally {
    await api.delete(`/api/projects/${project.id}`, { headers })
    await api.delete(`/api/media/${media.id}`, { headers })
    await visitor.dispose(); await api.dispose()
  }
})

test('enquiry form can be submitted from the browser', async ({ page, request }) => {
  await page.goto('/enquire?service=personal')
  await page.getByLabel('Your name').fill('QA Browser')
  await page.getByLabel('Email address').fill('browser-qa@example.com')
  await page.getByLabel('Tell me a little').fill('A browser verification of the personal styling enquiry.')
  await page.locator('#consent').check()
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: 'Send your enquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Consider it the beginning.' })).toBeVisible()
  const login = await request.post('/api/users/login', { data: { email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD } })
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const result = await (await request.get('/api/enquiries?where[email][equals]=browser-qa@example.com', { headers })).json()
  for (const doc of result.docs) await request.delete(`/api/enquiries/${doc.id}`, { headers })
})
