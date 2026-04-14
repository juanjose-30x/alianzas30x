'use client'
import { useState, useRef } from 'react'
import { Mic, Square } from 'lucide-react'

interface VoiceButtonProps {
  onResult: (text: string) => void
  className?: string
}

export default function VoiceButton({ onResult, className = '' }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(null), 3500)
  }

  const toggle = () => {
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }

    const Win = window as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition
    if (!SR) { showError('Usa Chrome o Edge'); return }

    const rec = new SR()
    rec.lang = 'es-CO'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      onResult(e.results[0][0].transcript)
      setListening(false)
    }
    rec.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      setListening(false)
      if (e.error === 'not-allowed')  showError('Permite el micrófono en Chrome')
      else if (e.error === 'no-speech') showError('No se detectó voz')
      else if (e.error === 'network')   showError('Sin acceso al API de voz de Google')
      else showError(`Error: ${e.error}`)
    }
    rec.onend = () => setListening(false)

    recRef.current = rec
    rec.start()
    setListening(true)
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggle}
        title={listening ? 'Detener' : 'Dictado de voz'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
        style={
          error
            ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
            : listening
            ? { background: 'rgba(34,197,94,0.18)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {listening
          ? <Square size={12} fill="currentColor" className="animate-pulse" />
          : <Mic size={12} />
        }
        <span>{error ? 'Error' : listening ? 'Grabando' : 'Dictado'}</span>
      </button>

      {error && (
        <div
          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 text-xs px-2.5 py-1 rounded-lg whitespace-nowrap z-50"
          style={{ background: '#1c1c1c', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
