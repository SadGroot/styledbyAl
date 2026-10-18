import { getPayload } from 'payload'
import config from '@payload-config'
export async function GET() {
  try { const payload = await getPayload({ config }); await payload.count({ collection: 'projects', overrideAccess: false }); return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }) }
  catch { return Response.json({ ok: false }, { status: 503 }) }
}
