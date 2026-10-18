import { NextResponse, type NextRequest } from 'next/server'
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  if (process.env.SITE_INDEXABLE !== 'true' || request.nextUrl.pathname.startsWith('/studio') || request.nextUrl.pathname.startsWith('/api') || request.nextUrl.searchParams.has('preview')) response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|icon.svg|apple-touch-icon.png).*)'] }
