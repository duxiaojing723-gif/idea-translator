import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompts/system'

// 使用项目专用环境变量名（LLM_*），避免被 ~/.zshrc 里的全局 OPENAI_API_KEY 覆盖
// 兼容：优先读 LLM_* ，降级读 OPENAI_*

// 主力客户端（通义千问）
let _primary: OpenAI | null = null
function getPrimary(): OpenAI {
  if (_primary) return _primary
  _primary = new OpenAI({
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || 'placeholder',
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || undefined,
  })
  return _primary
}

// 备选客户端（DeepSeek）
let _fallback: OpenAI | null = null
function getFallback(): OpenAI | null {
  const key = process.env.FALLBACK_API_KEY
  if (!key) return null
  if (_fallback) return _fallback
  _fallback = new OpenAI({
    apiKey: key,
    baseURL: process.env.FALLBACK_BASE_URL || undefined,
  })
  return _fallback
}

const PRIMARY_MODEL = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'qwen-plus'
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || 'deepseek-chat'

export interface LLMCallResult {
  content: string
  usage?: { prompt_tokens: number; completion_tokens: number }
}

// Non-streaming call - primary with fallback
export async function callLLM(userPrompt: string): Promise<LLMCallResult> {
  try {
    return await callWithClient(getPrimary(), PRIMARY_MODEL, userPrompt)
  } catch (e) {
    const fallback = getFallback()
    if (!fallback) throw e
    console.warn(`[LLM] 主力失败，切换备选: ${e instanceof Error ? e.message : e}`)
    return await callWithClient(fallback, FALLBACK_MODEL, userPrompt)
  }
}

async function callWithClient(client: OpenAI, model: string, userPrompt: string): Promise<LLMCallResult> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content || '{}'
  return {
    content,
    usage: response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
    } : undefined,
  }
}

// Streaming call - primary with fallback
export async function callLLMStream(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  try {
    return await streamWithClient(getPrimary(), PRIMARY_MODEL, userPrompt)
  } catch (e) {
    const fallback = getFallback()
    if (!fallback) throw e
    console.warn(`[LLM] 主力流式失败，切换备选: ${e instanceof Error ? e.message : e}`)
    return await streamWithClient(fallback, FALLBACK_MODEL, userPrompt)
  }
}

async function streamWithClient(client: OpenAI, model: string, userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    stream: true,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      let fullContent = ''

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        if (delta) {
          fullContent += delta
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta, done: false })}\n\n`))
        }
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, full: fullContent })}\n\n`))
      controller.close()
    },
  })
}
