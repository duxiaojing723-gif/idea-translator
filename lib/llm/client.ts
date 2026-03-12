import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompts/system'

// Configure proxy via undici (built into Node.js 18+)
const proxyUrl =
  process.env.OPENAI_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy

if (proxyUrl) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, setGlobalDispatcher } = require('undici')
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
}

// 主力客户端（通义千问）
let _primary: OpenAI | null = null
function getPrimary(): OpenAI {
  if (_primary) return _primary
  _primary = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'placeholder',
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  })
  return _primary
}

// 备选客户端（DeepSeek）
let _fallback: OpenAI | null = null
function getFallback(): OpenAI | null {
  if (!process.env.FALLBACK_API_KEY) return null
  if (_fallback) return _fallback
  _fallback = new OpenAI({
    apiKey: process.env.FALLBACK_API_KEY,
    baseURL: process.env.FALLBACK_BASE_URL || undefined,
  })
  return _fallback
}

const PRIMARY_MODEL = process.env.OPENAI_MODEL || 'qwen-plus'
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
