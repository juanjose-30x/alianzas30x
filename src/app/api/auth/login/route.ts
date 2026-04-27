import { NextResponse } from 'next/server'
import { signSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/session'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const validEmail = process.env.SUPERADMIN_EMAIL
  const validPassword = process.env.SUPERADMIN_PASSWORD

  if (!email || !password || email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const token = await signSession(email, 'superadmin')
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
