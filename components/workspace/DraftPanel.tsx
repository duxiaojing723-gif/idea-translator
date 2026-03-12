'use client'

import { RequirementDraft, FieldStatus } from '@/types/draft'
import { Separator } from '@/components/ui/separator'

interface DraftPanelProps {
  draft: RequirementDraft
}

const STATUS_STYLES: Record<FieldStatus, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  inferred: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  missing: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
  conflicting: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const STATUS_LABELS: Record<FieldStatus, string> = {
  confirmed: '已确认',
  inferred: '推断',
  missing: '待补充',
  conflicting: '待确认',
}

const STATUS_DOT: Record<FieldStatus, string> = {
  confirmed: 'bg-green-500',
  inferred: 'bg-blue-400',
  missing: 'bg-gray-300 dark:bg-gray-600',
  conflicting: 'bg-red-500',
}

function FieldRow({
  label,
  value,
  status,
  highlight,
}: {
  label: string
  value: string
  status: FieldStatus
  highlight?: boolean
}) {
  const isMissing = status === 'missing' || !value

  return (
    <div className={`space-y-1 rounded-md px-2 py-1.5 -mx-2 transition-colors ${highlight ? 'bg-orange-50 dark:bg-orange-950/30' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        <span className="text-xs font-medium text-muted-foreground flex-1">{label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <p className={`text-sm pl-3.5 leading-relaxed ${isMissing ? 'text-muted-foreground/50 italic' : 'text-foreground'}`}>
        {isMissing ? '待补充' : value}
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
      {children}
    </div>
  )
}

export function DraftPanel({ draft }: DraftPanelProps) {
  const score = draft.assistant_judgement.clarity_score
  const scoreColor =
    score >= 7 ? 'text-green-600' : score >= 4 ? 'text-yellow-600' : 'text-muted-foreground'

  const hasSummary = draft.idea_summary.value && draft.idea_summary.status !== 'missing'

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">实时需求草案</span>
        {score > 0 ? (
          <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
            清晰度 {score}/10
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">等待分析...</span>
        )}
      </div>

      {/* 当前摘要 — always shown, prominent when filled */}
      {hasSummary ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <div className="text-xs font-medium text-primary mb-1">当前理解</div>
          <p className="text-sm leading-relaxed text-foreground">{draft.idea_summary.value}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted px-3 py-2.5">
          <div className="text-xs font-medium text-muted-foreground mb-1">当前理解</div>
          <p className="text-sm text-muted-foreground/50 italic">分析中，稍候片刻...</p>
        </div>
      )}

      <Separator />

      {/* Core fields — ALL always visible */}
      <SectionLabel>核心要素</SectionLabel>
      <div className="space-y-3">
        <FieldRow
          label="目标用户"
          value={draft.target_user.primary.value}
          status={draft.target_user.primary.status}
        />
        <FieldRow
          label="使用场景"
          value={draft.scenario.value}
          status={draft.scenario.status}
        />
        <FieldRow
          label="核心问题"
          value={draft.core_problem.value}
          status={draft.core_problem.status}
        />
        <FieldRow
          label="目标结果"
          value={draft.desired_outcome.value}
          status={draft.desired_outcome.status}
        />
        <FieldRow
          label="当前替代方案"
          value={draft.current_solution.value}
          status={draft.current_solution.status}
        />
      </div>

      <Separator />

      {/* MVP scope */}
      <SectionLabel>MVP 范围</SectionLabel>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">必须做</div>
        {draft.mvp_scope.must_have.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {draft.mvp_scope.must_have.map((item, i) => (
              <span
                key={i}
                className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic pl-0.5">待补充</p>
        )}
      </div>

      {draft.mvp_scope.out_of_scope.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">当前不做</div>
          <div className="flex flex-wrap gap-1.5">
            {draft.mvp_scope.out_of_scope.map((item, i) => (
              <span
                key={i}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full line-through"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {(draft.constraints && draft.constraints.length > 0) && (
        <>
          <Separator />
          <SectionLabel>约束条件</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {draft.constraints.map((c, i) => (
              <span
                key={i}
                className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Open questions */}
      {draft.open_questions.length > 0 && (
        <>
          <Separator />
          <SectionLabel>待确认项</SectionLabel>
          <ul className="space-y-1.5">
            {draft.open_questions.map((q, i) => (
              <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Main gap — highlighted */}
      {draft.assistant_judgement.main_gap && (
        <>
          <Separator />
          <div className="space-y-1 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 px-3 py-2.5">
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">当前最大缺口</span>
            <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
              {draft.assistant_judgement.main_gap}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
