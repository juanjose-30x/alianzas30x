// Edge-compatible session utilities (Web Crypto API — no Node dependencies)

export const COOKIE_NAME = '30x-session'
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

type SessionPayload = { email: string; role: string; exp: number }

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod'
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signSession(email: string, role: string): Promise<string> {
  const payload: SessionPayload = { email, role, exp: Date.now() + COOKIE_MAX_AGE * 1000 }
  const data = JSON.stringify(payload)
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${btoa(data)}.${sigB64}`
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const [dataB64, sigB64] = token.split('.')
    if (!dataB64 || !sigB64) return null
    const data = atob(dataB64)
    const key = await getKey()
    const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data))
    if (!valid) return null
    const payload = JSON.parse(data) as SessionPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function isSuperAdmin(email: string): boolean {
  return email === process.env.SUPERADMIN_EMAIL
}
