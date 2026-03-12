'use client'

import { SessionStatus } from '@/types/session'
import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<SessionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  idle: { label: '未开始', variant: 'secondary' },
  parsing_initial_input: { label: '解析中...', variant: 'default' },
  clarifying: { label: '追问中', variant: 'default' },
  ready_to_finalize: { label: '可生成结果', variant: 'outline' },
  finalized: { label: '已完成', variant: 'secondary' },
}

interface StatusBadgeProps {
  status: SessionStatus
  clarityScore?: number
}

export function StatusBadge({ status, clarityScore }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant}>{config.label}</Badge>
      {clarityScore !== undefined && clarityScore > 0 && (
        <span className="text-xs text-muted-foreground">
          清晰度 {clarityScore}/10
        </span>
      )}
    </div>
  )
}
