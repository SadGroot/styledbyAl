import { storageUsage, reserveBytes } from '@/lib/storage'
import type { Payload } from 'payload'

export async function StudioIntro({ payload }: { payload: Payload }) {
  const disk = await storageUsage()
  const fresh = await payload.count({ collection: 'enquiries', where: { status: { equals: 'new' } }, overrideAccess: true })
  const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(2)
  return <section className="studio-intro">
    <h2>Your work. Your world.</h2>
    <p>Add photographs in Media, create a project, then choose Publish. Changes appear on the website immediately.</p>
    <p>Use Site settings for your introduction, portrait, and contact details. In Enquiries, update a conversation’s status or retry a failed email notification.</p>
    <div className="studio-stats"><span>{fresh.totalDocs} new enquiries</span><span>{gb(disk.used)} GB of media · 2 GB budget</span><span>{gb(disk.available)} GB free · {gb(reserveBytes)} GB reserved</span><span>Email: {process.env.SMTP_HOST ? 'configured' : 'awaiting SMTP setup'}</span><a href="/" target="_blank" rel="noreferrer">View website ↗</a></div>
  </section>
}
