export const runtime = 'nodejs'

export async function POST(req: Request) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) {
    return Response.json({ error: 'No audio' }, { status: 400 })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })
  }

  // Groq Whisper API (OpenAI-compatible)
  const body = new FormData()
  body.append('file', audio, 'audio.webm')
  body.append('model', 'whisper-large-v3-turbo')
  body.append('language', 'es')
  body.append('response_format', 'json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Groq transcribe error:', err)
    return Response.json({ error: 'Transcription failed' }, { status: 502 })
  }

  const data = await res.json()
  return Response.json({ text: data.text ?? '' })
}
