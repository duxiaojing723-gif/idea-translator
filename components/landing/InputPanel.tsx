'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useVoiceInput } from '@/hooks/useVoiceInput'

const EXAMPLES = [
  '我想做一个 AI 工具，帮那些总是说不清楚自己需求的人，把他们的想法整理成产品文档。',
  '我觉得英语学习 App 太无聊了，我想做一个更有意思的，用真实场景来练习口语。',
  '我想帮中小企业主做数字化，他们现在还在用 Excel 管客户，很低效。',
]

interface InputPanelProps {
  onStart: (input: string) => void
  isLoading?: boolean
}

export function InputPanel({ onStart, isLoading }: InputPanelProps) {
  const [value, setValue] = useState('')

  const { isListening, isTranscribing, isSupported, start, stop } = useVoiceInput({
    onResult: (text) => setValue(prev => prev ? prev + ' ' + text : text),
    onError: (err) => console.warn('Voice error:', err),
  })

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return
    onStart(value.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">把你的想法翻译成产品需求</h1>
        <p className="text-muted-foreground text-lg">
          你只需要自然表达，系统会通过几轮追问帮你整理成可开发的需求结构
        </p>
      </div>

      <div className="space-y-3">
        <Textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="直接说出你的想法，不需要结构化..."
          className="min-h-[160px] text-base resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter 开始</span>
          <div className="flex items-center gap-2">
            {isSupported !== false && (
              <button
                type="button"
                onClick={isListening ? stop : start}
                disabled={isTranscribing || isLoading}
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
            <Button
              onClick={handleSubmit}
              disabled={!value.trim() || isLoading}
              size="lg"
            >
              {isLoading ? '解析中...' : '开始梳理'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">示例输入</p>
        <div className="space-y-2">
          {EXAMPLES.map((example, i) => (
            <button
              key={i}
              onClick={() => setValue(example)}
              className="w-full text-left text-sm p-3 rounded-lg border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
