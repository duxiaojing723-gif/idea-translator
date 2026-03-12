import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm/client'
import { buildFinalizePrompt } from '@/lib/llm/prompts/finalize'
import { validateAndRepairDraft, extractJson } from '@/lib/llm/validator'
import { FinalizeRequest, FinalizeResponse } from '@/types/session'

export async function POST(req: NextRequest) {
  try {
    const body: FinalizeRequest = await req.json()

    const prompt = buildFinalizePrompt({
      finalDraft: body.final_draft,
      initialInput: body.initial_input,
    })

    const result = await callLLM(prompt)

    const parsed = extractJson(result.content)
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 })
    }

    const raw = parsed as Record<string, unknown>
    const finalDraft = validateAndRepairDraft(raw.final_draft ?? body.final_draft)
    const markdown = typeof raw.markdown === 'string' ? raw.markdown : '# 需求摘要\n\n生成失败，请重试。'

    const response: FinalizeResponse = {
      status: 'finalized',
      markdown,
      json: finalDraft,
      clarity_score: finalDraft.assistant_judgement.clarity_score,
      confidence: finalDraft.assistant_judgement.confidence,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[session/finalize]', error)
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 })
  }
}
