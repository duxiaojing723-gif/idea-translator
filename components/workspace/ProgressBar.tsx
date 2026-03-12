'use client'

import { Progress, SessionStatus } from '@/types/session'

interface Props {
  progress: Progress
  status: SessionStatus
  isStreaming: boolean
}

export function ProgressBar({ progress, status, isStreaming }: Props) {
  const pct = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  const isActive = status === 'parsing_initial_input' || status === 'clarifying' || isStreaming

  return (
    <div className="border-b px-4 md:px-6 py-3 bg-muted/30 shrink-0">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          已完成 {progress.completed}/{progress.total}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'ready_to_finalize' || status === 'finalized'
                ? 'bg-green-500'
                : 'bg-primary'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums">{pct}%</span>
      </div>

      {/* Current focus + missing slots */}
      <div className="flex items-center gap-2 flex-wrap">
        {isActive && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {isStreaming ? '正在分析...' : progress.current_focus ? `正在确认：${progress.current_focus}` : '分析中...'}
          </span>
        )}
        {status === 'ready_to_finalize' && !isStreaming && (
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
            需求已足够清晰，可生成结果
          </span>
        )}
        {progress.missing_slots.slice(0, 4).map(slot => (
          <span
            key={slot}
            className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
          >
            待补：{slot}
          </span>
        ))}
        {progress.missing_slots.length > 4 && (
          <span className="text-xs text-muted-foreground">
            +{progress.missing_slots.length - 4} 项
          </span>
        )}
      </div>
    </div>
  )
}
