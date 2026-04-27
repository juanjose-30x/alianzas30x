import { NextResponse } from 'next/server'
import { fetchContactProperties, verifyToken } from '@/lib/hubspot'

export async function GET() {
  try {
    const { valid, portalId, error } = await verifyToken()
    if (!valid) return NextResponse.json({ error: error ?? 'Token inválido' }, { status: 401 })

    const properties = await fetchContactProperties()
    return NextResponse.json({ portalId, properties })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
