import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}

export default function middleware(req) {
  const auth = req.headers.get('authorization')
  const expectedUser = process.env.OPDASH_USER || 'salman'
  const expectedPass = process.env.OPDASH_PASS || 'change-me'

  if (!auth || !auth.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Operation Dashboard"' },
    })
  }

  const base64 = auth.split(' ')[1]
  const [user, pass] = atob(base64).split(':')

  if (user !== expectedUser || pass !== expectedPass) {
    return new NextResponse('Access denied', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Operation Dashboard"' },
    })
  }

  return NextResponse.next()
}
