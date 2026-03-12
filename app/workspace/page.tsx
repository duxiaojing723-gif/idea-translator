'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { ChatPanel } from '@/components/workspace/ChatPanel'
import { DraftPanel } from '@/components/workspace/DraftPanel'
import { ResultPanel } from '@/components/workspace/ResultPanel'
import { StatusBadge } from '@/components/workspace/StatusBadge'
import { ProgressBar } from '@/components/workspace/ProgressBar'
import { Button } from '@/components/ui/button'

export default function WorkspacePage() {
  const router = useRouter()
  const { session, error, start, reply, finalize, reset } = useSession()
  const [mobileTab, setMobileTab] = useState<'chat' | 'draft'>('chat')

  useEffect(() => {
    const initialInput = sessionStorage.getItem('initial_input')
    if (!initialInput) {
      router.push('/')
      return
    }
    sessionStorage.removeItem('initial_input')
    start(initialInput)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    reset()
    router.push('/')
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="font-semibold text-sm hover:text-muted-foreground transition-colors"
          >
            需求翻译器
          </button>
          <StatusBadge
            status={session.status}
            clarityScore={session.draft.assistant_judgement.clarity_score}
          />
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            重新开始
          </Button>
        </div>
      </header>

      {/* Progress bar — visible during active session and finalized */}
      {session.status !== 'idle' && (
        <ProgressBar
          progress={session.progress}
          status={session.status}
          isStreaming={session.isStreaming}
        />
      )}

      {/* Mobile: tab switcher */}
      <div className="flex md:hidden border-b shrink-0">
        <button
          className={`flex-1 py-2 text-sm font-medium ${mobileTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setMobileTab('chat')}
        >
          对话
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${mobileTab === 'draft' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setMobileTab('draft')}
        >
          草案 {session.draft.assistant_judgement.clarity_score > 0 ? `· ${session.draft.assistant_judgement.clarity_score}/10` : ''}
        </button>
      </div>

      {/* Desktop: side by side | Mobile: tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Chat panel */}
        <div className={`flex-col min-w-0 border-r md:flex ${mobileTab === 'chat' ? 'flex flex-1' : 'hidden md:flex md:flex-1'}`}>
          <ChatPanel
            messages={session.messages}
            status={session.status}
            isStreaming={session.isStreaming}
            onReply={reply}
            onFinalize={finalize}
            onReset={handleReset}
          />
        </div>

        {/* Right/Draft panel */}
        <div className={`flex-col md:w-[380px] md:shrink-0 ${mobileTab === 'draft' ? 'flex flex-1' : 'hidden md:flex'}`}>
          {session.status === 'finalized' && session.finalMarkdown ? (
            <ResultPanel
              markdown={session.finalMarkdown}
              json={session.finalJson!}
              clarityScore={session.draft.assistant_judgement.clarity_score}
              confidence={session.draft.assistant_judgement.confidence}
            />
          ) : (
            <>
              <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground hidden md:flex items-center justify-between">
                <span>实时需求草案</span>
                {session.draft.assistant_judgement.clarity_score > 0 && (
                  <span className="text-primary font-semibold">
                    清晰度 {session.draft.assistant_judgement.clarity_score}/10
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <DraftPanel draft={session.draft} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
