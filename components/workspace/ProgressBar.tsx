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
  const isDone = status === 'ready_to_finalize' || status === 'finalized'

  return (
    <div className="border-b border-[#e5e5e5] px-4 md:px-6 py-3 bg-white/60 shrink-0">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-[#737373] whitespace-nowrap">
          {progress.completed}/{progress.total}
        </span>
        <div className="flex-1 h-1.5 bg-[#f4f4f4] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDone ? 'bg-[#15803d]' : 'bg-[#0ea5e9]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-[#171717]">{pct}%</span>
      </div>

      {/* Current focus + missing slots */}
      <div className="flex items-center gap-2 flex-wrap">
        {isActive && (
          <span className="text-xs bg-[#e0f2fe] text-[#0284c7] px-2.5 py-0.5 rounded-full font-medium">
            {isStreaming ? '正在分析...' : progress.current_focus ? `正在确认：${progress.current_focus}` : '分析中...'}
          </span>
        )}
        {status === 'ready_to_finalize' && !isStreaming && (
          <span className="text-xs bg-[#dcfce7] text-[#15803d] px-2.5 py-0.5 rounded-full font-medium">
            需求已足够清晰，可生成结果
          </span>
        )}
        {progress.missing_slots.slice(0, 4).map(slot => (
          <span
            key={slot}
            className="text-xs bg-[#f4f4f4] text-[#737373] px-2.5 py-0.5 rounded-full border border-[#e5e5e5]"
          >
            待补：{slot}
          </span>
        ))}
        {progress.missing_slots.length > 4 && (
          <span className="text-xs text-[#a3a3a3]">
            +{progress.missing_slots.length - 4} 项
          </span>
        )}
      </div>
    </div>
  )
}
