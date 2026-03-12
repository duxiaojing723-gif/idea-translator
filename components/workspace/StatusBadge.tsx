'use client'

import { SessionStatus } from '@/types/session'

const STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  idle: {
    label: '未开始',
    className: 'bg-white border-[#e5e5e5] text-[#737373]',
  },
  parsing_initial_input: {
    label: '解析中...',
    className: 'bg-[#e0f2fe] border-[rgba(14,165,233,0.25)] text-[#0284c7]',
  },
  clarifying: {
    label: '追问中',
    className: 'bg-[#e0f2fe] border-[rgba(14,165,233,0.25)] text-[#0284c7]',
  },
  ready_to_finalize: {
    label: '可生成结果',
    className: 'bg-[#dcfce7] border-[rgba(21,128,61,0.25)] text-[#15803d]',
  },
  finalized: {
    label: '已完成',
    className: 'bg-[#dcfce7] border-[rgba(21,128,61,0.25)] text-[#15803d]',
  },
}

const PULSE_STATUSES: SessionStatus[] = ['parsing_initial_input', 'clarifying']

interface StatusBadgeProps {
  status: SessionStatus
  clarityScore?: number
}

export function StatusBadge({ status, clarityScore }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const showPulse = PULSE_STATUSES.includes(status)

  const dotColor =
    status === 'ready_to_finalize' || status === 'finalized'
      ? 'bg-[#15803d]'
      : status === 'parsing_initial_input' || status === 'clarifying'
      ? 'bg-[#0ea5e9]'
      : 'bg-[#a3a3a3]'

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[0.8125rem] font-medium shadow-sm ${config.className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${showPulse ? 'animate-pulse' : ''}`}
        />
        {config.label}
      </div>
      {clarityScore !== undefined && clarityScore > 0 && (
        <span className="text-xs text-[#737373]">
          {clarityScore}/10
        </span>
      )}
    </div>
  )
}
