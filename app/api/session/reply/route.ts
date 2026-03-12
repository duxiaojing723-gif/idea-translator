import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm/client'
import { buildClarifyPrompt } from '@/lib/llm/prompts/clarify'
import { validateAndRepairDraft, extractJson } from '@/lib/llm/validator'
import { determineNextStatus, filterValidQuestions } from '@/lib/session/state'
import { ReplyRequest, ReplyResponse, Progress } from '@/types/session'

function extractProgress(raw: Record<string, unknown>): Progress {
  const p = raw.progress as Record<string, unknown> | undefined
  if (p && typeof p === 'object') {
    return {
      completed: typeof p.completed === 'number' ? p.completed : 0,
      total: typeof p.total === 'number' ? p.total : 7,
      current_focus: typeof p.current_focus === 'string' ? p.current_focus : '',
      missing_slots: Array.isArray(p.missing_slots) ? p.missing_slots.filter((s): s is string => typeof s === 'string') : [],
    }
  }
  return { completed: 0, total: 7, current_focus: '', missing_slots: [] }
}

export async function POST(req: NextRequest) {
  try {
    const body: ReplyRequest = await req.json()

    if (!body.answer?.trim()) {
      return NextResponse.json({ error: '回答不能为空' }, { status: 400 })
    }

    const prompt = buildClarifyPrompt({
      currentDraft: body.current_draft,
      lastUserAnswer: body.answer,
      askedQuestions: body.asked_questions || [],
      round: body.round || 1,
    })

    const result = await callLLM(prompt)

    const parsed = extractJson(result.content)
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: '处理失败，请重试' }, { status: 500 })
    }

    const raw = parsed as Record<string, unknown>
    const draft = validateAndRepairDraft(raw.draft)
    const shouldStop = raw.should_stop === true
    const nextQuestions = filterValidQuestions(Array.isArray(raw.next_questions) ? raw.next_questions : [])
    const assistantMessage = typeof raw.assistant_message === 'string'
      ? raw.assistant_message
      : '好的，我已经更新了需求草案。'
    const progress = extractProgress(raw)

    const newAskedQuestions = [
      ...(body.asked_questions || []),
      ...nextQuestions,
    ]

    const response: ReplyResponse = {
      status: determineNextStatus(draft, shouldStop),
      assistant_message: assistantMessage,
      draft,
      next_questions: nextQuestions,
      asked_questions: newAskedQuestions,
      progress,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[session/reply]', error)
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 })
  }
}
