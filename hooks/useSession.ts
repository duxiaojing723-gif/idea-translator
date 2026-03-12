'use client'

import { useState, useCallback, useRef } from 'react'
import { SessionState, SessionStatus, Progress } from '@/types/session'
import { RequirementDraft, createEmptyDraft } from '@/types/draft'
import { Message } from '@/types/message'
import { v4 as uuidv4 } from 'uuid'

const initialProgress: Progress = { completed: 0, total: 7, current_focus: '', missing_slots: [] }

const initialState: SessionState = {
  id: '',
  status: 'idle',
  messages: [],
  draft: createEmptyDraft(),
  askedQuestions: [],
  round: 0,
  initialInput: '',
  isStreaming: false,
  streamingContent: '',
  progress: initialProgress,
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(initialState)
  const [error, setError] = useState<string | null>(null)
  // Keep a ref so async callbacks can read current session without stale closure
  const sessionRef = useRef<SessionState>(initialState)

  const updateSession = useCallback((updater: (prev: SessionState) => SessionState) => {
    setSession(prev => {
      const next = updater(prev)
      sessionRef.current = next
      return next
    })
  }, [])

  const start = useCallback(async (initialInput: string) => {
    setError(null)
    const userMsg: Message = { role: 'user', content: initialInput, round: 0, timestamp: new Date().toISOString() }
    updateSession(() => ({
      ...initialState,
      id: uuidv4(),
      status: 'parsing_initial_input',
      initialInput,
      messages: [userMsg],
      isStreaming: true,
      streamingContent: '',
    }))

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_input: initialInput }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '请求失败')
      }

      const data = await res.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.assistant_message,
        round: 1,
        timestamp: new Date().toISOString(),
      }

      updateSession(prev => ({
        ...prev,
        status: data.status as SessionStatus,
        draft: data.draft,
        askedQuestions: data.asked_questions || [],
        round: 1,
        isStreaming: false,
        streamingContent: '',
        messages: [...prev.messages, assistantMsg],
        progress: data.progress || initialProgress,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      updateSession(prev => ({ ...prev, status: 'idle', isStreaming: false }))
    }
  }, [updateSession])

  const reply = useCallback(async (answer: string) => {
    const current = sessionRef.current
    if (current.status !== 'clarifying' && current.status !== 'ready_to_finalize') return

    setError(null)
    const nextRound = current.round + 1
    const userMsg: Message = {
      role: 'user',
      content: answer,
      round: nextRound,
      timestamp: new Date().toISOString(),
    }

    updateSession(prev => ({
      ...prev,
      isStreaming: true,
      messages: [...prev.messages, userMsg],
    }))

    try {
      const res = await fetch('/api/session/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: current.id,
          answer,
          current_draft: current.draft,
          asked_questions: current.askedQuestions,
          round: nextRound,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '请求失败')
      }

      const data = await res.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.assistant_message,
        round: nextRound,
        timestamp: new Date().toISOString(),
      }

      updateSession(prev => ({
        ...prev,
        status: data.status as SessionStatus,
        draft: data.draft,
        askedQuestions: data.asked_questions || prev.askedQuestions,
        round: nextRound,
        isStreaming: false,
        streamingContent: '',
        messages: [...prev.messages, assistantMsg],
        progress: data.progress || prev.progress,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      updateSession(prev => ({ ...prev, isStreaming: false }))
    }
  }, [updateSession])

  const finalize = useCallback(async () => {
    const current = sessionRef.current
    setError(null)
    updateSession(prev => ({ ...prev, isStreaming: true }))

    try {
      const res = await fetch('/api/session/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: current.id,
          final_draft: current.draft,
          initial_input: current.initialInput,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '生成失败')
      }

      const data = await res.json()

      updateSession(prev => ({
        ...prev,
        status: 'finalized',
        finalMarkdown: data.markdown,
        finalJson: data.json,
        draft: data.json,
        isStreaming: false,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      updateSession(prev => ({ ...prev, isStreaming: false }))
    }
  }, [updateSession])

  const reset = useCallback(() => {
    sessionRef.current = initialState
    setSession(initialState)
    setError(null)
  }, [])

  return { session, error, start, reply, finalize, reset }
}
