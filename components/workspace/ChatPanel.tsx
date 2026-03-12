'use client'

import { useRef, useEffect, useState } from 'react'
import { Message } from '@/types/message'
import { SessionStatus } from '@/types/session'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface ChatPanelProps {
  messages: Message[]
  status: SessionStatus
  isStreaming: boolean
  onReply: (answer: string) => void
  onFinalize: () => void
  onReset: () => void
}

// Detect if message contains structured sections from the LLM
function hasStructuredContent(content: string): boolean {
  return (
    content.includes('当前理解') ||
    content.includes('已明确') ||
    content.includes('还缺') ||
    content.includes('下一步') ||
    content.includes('我来追问') ||
    content.includes('已更新')
  )
}

function AssistantMessage({ content, showUpdateIndicator }: { content: string; showUpdateIndicator: boolean }) {
  // Split on blank lines to create visual paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  const isStructured = hasStructuredContent(content)

  if (isStructured && paragraphs.length > 1) {
    return (
      <div className="space-y-2">
        {paragraphs.map((para, i) => {
          const isQuestion = para.includes('？') && para.length < 120
          const isHeader =
            para.startsWith('当前理解') ||
            para.startsWith('已明确') ||
            para.startsWith('还缺') ||
            para.startsWith('下一步')

          return (
            <div
              key={i}
              className={
                isHeader
                  ? 'text-xs font-semibold text-muted-foreground uppercase tracking-wide'
                  : isQuestion
                  ? 'text-sm font-medium text-foreground'
                  : 'text-sm leading-relaxed text-foreground'
              }
            >
              <pre className="whitespace-pre-wrap font-sans">{para.trim()}</pre>
            </div>
          )
        })}
        {showUpdateIndicator && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-muted-foreground">已更新右侧草案</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre>
      {showUpdateIndicator && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-xs text-muted-foreground">已更新右侧草案</span>
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ messages, status, isStreaming, onReply, onFinalize, onReset }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, isTranscribing, isSupported, start, stop } = useVoiceInput({
    onResult: (text) => setInput(prev => prev ? prev + ' ' + text : text),
    onError: (err) => console.warn('Voice error:', err),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return
    onReply(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canReply = (status === 'clarifying' || status === 'ready_to_finalize') && !isStreaming
  const canFinalize = status === 'ready_to_finalize' && !isStreaming
  const isFinalized = status === 'finalized'

  // Track which assistant messages should show the update indicator
  // Show it for every assistant message after round 1 (i.e., every reply)
  const assistantMessageIndexes = messages
    .map((m, i) => (m.role === 'assistant' ? i : -1))
    .filter(i => i !== -1)

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground">
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            )
          }

          // Assistant message
          const assistantIdx = assistantMessageIndexes.indexOf(idx)
          // Show update indicator for all assistant messages except the very first one (round 0 parse)
          // Actually show it on round >= 1 if there's a draft update happening
          const showUpdate = assistantIdx > 0

          return (
            <div key={idx} className="flex justify-start">
              <div className="max-w-[90%] rounded-lg px-4 py-3 text-sm bg-muted text-foreground">
                <AssistantMessage
                  content={msg.content}
                  showUpdateIndicator={showUpdate}
                />
              </div>
            </div>
          )
        })}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="animate-pulse">正在思考...</span>
                <span className="text-xs text-muted-foreground/60">草案将实时更新</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!isFinalized && (
        <div className="border-t p-4 space-y-3">
          {canFinalize && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-sm text-green-700 dark:text-green-300 flex-1">
                需求已足够清晰，可以生成最终结果
              </span>
              <Button size="sm" onClick={onFinalize} disabled={isStreaming}>
                生成需求摘要
              </Button>
            </div>
          )}

          {canReply && (
            <>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="回答上面的问题，或补充更多信息..."
                className="min-h-[80px] resize-none"
                disabled={isStreaming}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter 发送</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onReset}>重新开始</Button>
                  {isSupported !== false && (
                    <button
                      type="button"
                      onClick={isListening ? stop : start}
                      disabled={isTranscribing || isStreaming}
                      className={`p-2 rounded-lg border transition-colors shrink-0 ${
                        isListening
                          ? 'bg-red-500 text-white border-red-500 animate-pulse'
                          : isTranscribing
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : 'hover:bg-muted text-muted-foreground border-input'
                      }`}
                      title={isListening ? '点击停止录音' : isTranscribing ? '识别中...' : '语音输入'}
                    >
                      {isListening ? '🔴' : isTranscribing ? '⏳' : '🎤'}
                    </button>
                  )}
                  <Button size="sm" onClick={handleSubmit} disabled={!input.trim() || isStreaming}>
                    发送
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isFinalized && (
        <div className="border-t p-4">
          <Button variant="outline" className="w-full" onClick={onReset}>
            开始新的梳理
          </Button>
        </div>
      )}
    </div>
  )
}
