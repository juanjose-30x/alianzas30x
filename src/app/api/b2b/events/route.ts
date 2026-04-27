import { NextResponse } from 'next/server'
import { getAllEvents, createEvent } from '@/lib/events-supabase'
import type { PipelineEventCreate } from '@/lib/events-supabase'

export async function GET() {
  try {
    const events = await getAllEvents()
    return NextResponse.json(events)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as PipelineEventCreate
    const event = await createEvent(body)
    return NextResponse.json(event)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
