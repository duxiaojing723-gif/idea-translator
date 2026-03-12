import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm/client'
import { buildParsePrompt } from '@/lib/llm/prompts/parse'
import { validateAndRepairDraft, extractJson } from '@/lib/llm/validator'
import { determineNextStatus, filterValidQuestions } from '@/lib/session/state'
import { StartRequest, StartResponse, Progress } from '@/types/session'
import { v4 as uuidv4 } from 'uuid'

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
    const body: StartRequest = await req.json()

    if (!body.initial_input?.trim()) {
      return NextResponse.json({ error: '输入不能为空' }, { status: 400 })
    }

    if (body.initial_input.trim().length < 10) {
      return NextResponse.json({
        error: '输入太简短，请先告诉我：你想帮谁？他们遇到什么问题？'
      }, { status: 400 })
    }

    const prompt = buildParsePrompt(body.initial_input)
    const result = await callLLM(prompt)

    const parsed = extractJson(result.content)
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: '解析失败，请重试' }, { status: 500 })
    }

    const raw = parsed as Record<string, unknown>
    const draft = validateAndRepairDraft(raw.draft)
    const shouldStop = raw.should_stop === true
    const nextQuestions = filterValidQuestions(Array.isArray(raw.next_questions) ? raw.next_questions : [])
    const assistantMessage = typeof raw.assistant_message === 'string'
      ? raw.assistant_message
      : '好的，我来帮你梳理这个想法。'
    const progress = extractProgress(raw)

    const response: StartResponse = {
      session_id: uuidv4(),
      status: determineNextStatus(draft, shouldStop),
      assistant_message: assistantMessage,
      draft,
      next_questions: nextQuestions,
      asked_questions: nextQuestions,
      progress,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[session/start]', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: '服务器错误，请重试', detail: msg }, { status: 500 })
  }
}
