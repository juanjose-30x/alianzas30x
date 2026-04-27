import { NextResponse } from 'next/server'
import { getAllOutreachTargets } from '@/lib/outreach-supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const targets = await getAllOutreachTargets()
    return NextResponse.json(targets)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
