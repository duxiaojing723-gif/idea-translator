'use client'

import { useState, useRef, useCallback } from 'react'

interface UseVoiceInputOptions {
  onResult: (text: string) => void
  onError?: (error: string) => void
}

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error'

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceState>('idle')
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const isListening = state === 'recording'
  const isTranscribing = state === 'transcribing'

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false)
      onError?.('当前浏览器不支持录音')
      return
    }
    setIsSupported(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      // Pick supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        setState('transcribing')

        try {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || 'audio/webm',
          })

          // Determine file extension from MIME type
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
          const file = new File([blob], `recording.${ext}`, { type: blob.type })

          const form = new FormData()
          form.append('audio', file)

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: form,
          })

          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || '识别失败')
          }

          const data = await res.json()
          if (data.text) {
            onResult(data.text)
          }
          setState('idle')
        } catch (err) {
          const msg = err instanceof Error ? err.message : '识别失败'
          onError?.(msg)
          setState('error')
          setTimeout(() => setState('idle'), 2000)
        }
      }

      recorder.start()
      setState('recording')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '无法访问麦克风'
      onError?.(msg)
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }, [onResult, onError])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [state])

  return { isListening, isTranscribing, isSupported, state, start, stop }
}
