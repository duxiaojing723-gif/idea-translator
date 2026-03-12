'use client'

import { RequirementDraft, FieldStatus } from '@/types/draft'

interface DraftPanelProps {
  draft: RequirementDraft
}

const STATUS_DOT: Record<FieldStatus, string> = {
  confirmed: 'bg-[#15803d]',
  inferred: 'bg-[#0ea5e9]',
  missing: 'bg-[#d4d4d4]',
  conflicting: 'bg-red-500',
}

const STATUS_LABELS: Record<FieldStatus, string> = {
  confirmed: '已确认',
  inferred: '推断',
  missing: '待补充',
  conflicting: '待确认',
}

function CoreCard({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: FieldStatus
}) {
  const isMissing = status === 'missing' || !value

  return (
    <div className="bg-white rounded-lg p-4 border border-[#e5e5e5] border-l-[3px] border-l-[#bae6fd] shadow-sm hover:border-l-[#0ea5e9] hover:shadow transition-all">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        <span className="text-xs font-semibold text-[#737373]">{label}</span>
        <span className="text-[0.625rem] text-[#a3a3a3] ml-auto">{STATUS_LABELS[status]}</span>
      </div>
      <p className={`text-sm leading-relaxed ${isMissing ? 'text-[#a3a3a3] italic' : 'text-[#171717]'}`}>
        {isMissing ? '待补充' : value}
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#737373]">
      <span className="w-5 h-[3px] rounded-sm bg-[#0ea5e9]" />
      {children}
    </div>
  )
}

export function DraftPanel({ draft }: DraftPanelProps) {
  const score = draft.assistant_judgement.clarity_score
  const scoreColor =
    score >= 7 ? 'text-[#15803d]' : score >= 4 ? 'text-yellow-600' : 'text-[#737373]'

  const hasSummary = draft.idea_summary.value && draft.idea_summary.status !== 'missing'

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#0a0a0a]">实时需求草案</span>
        {score > 0 ? (
          <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
            清晰度 {score}/10
          </span>
        ) : (
          <span className="text-xs text-[#a3a3a3]">等待分析...</span>
        )}
      </div>

      {/* 当前理解 — Cal.ai realtime card style */}
      {hasSummary ? (
        <div className="bg-[#e0f2fe] border border-[rgba(14,165,233,0.25)] rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3.5 rounded-sm bg-[#0ea5e9]" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#0284c7]">当前理解</span>
          </div>
          <p className="text-sm leading-relaxed text-[#262626] font-mono">{draft.idea_summary.value}</p>
        </div>
      ) : (
        <div className="border border-dashed border-[#e5e5e5] rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3.5 rounded-sm bg-[#d4d4d4]" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#737373]">当前理解</span>
          </div>
          <p className="text-sm text-[#a3a3a3] italic">分析中，稍候片刻...</p>
        </div>
      )}

      {/* Core fields — grid layout */}
      <SectionLabel>核心要素</SectionLabel>
      <div className="grid grid-cols-1 gap-3">
        <CoreCard label="目标用户" value={draft.target_user.primary.value} status={draft.target_user.primary.status} />
        <CoreCard label="使用场景" value={draft.scenario.value} status={draft.scenario.status} />
        <CoreCard label="核心问题" value={draft.core_problem.value} status={draft.core_problem.status} />
        <CoreCard label="目标结果" value={draft.desired_outcome.value} status={draft.desired_outcome.status} />
        <CoreCard label="当前替代方案" value={draft.current_solution.value} status={draft.current_solution.status} />
      </div>

      {/* MVP scope */}
      <SectionLabel>MVP 范围</SectionLabel>
      <div className="bg-white rounded-xl border border-[#e5e5e5] px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {draft.mvp_scope.must_have.length > 0 ? (
            <>
              {draft.mvp_scope.must_have.map((item, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 bg-[#dcfce7] text-[#15803d] border border-[rgba(21,128,61,0.25)] rounded-lg text-[0.8125rem] font-medium"
                >
                  {item}
                </span>
              ))}
            </>
          ) : (
            <span className="text-sm text-[#a3a3a3]">待补充</span>
          )}
        </div>
        {draft.mvp_scope.out_of_scope.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f4f4f4]">
            <span className="text-xs text-[#737373] font-medium mb-2 block">当前不做</span>
            <div className="flex flex-wrap gap-2">
              {draft.mvp_scope.out_of_scope.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[#f4f4f4] text-[#737373] rounded-lg text-[0.8125rem] line-through"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Constraints */}
      {draft.constraints && draft.constraints.length > 0 && (
        <>
          <SectionLabel>约束条件</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {draft.constraints.map((c, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-[0.8125rem]"
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
          <SectionLabel>待确认项</SectionLabel>
          <ul className="space-y-2">
            {draft.open_questions.map((q, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-yellow-400">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Main gap */}
      {draft.assistant_judgement.main_gap && (
        <>
          <SectionLabel>当前最大缺口</SectionLabel>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
            <p className="text-sm text-orange-700 leading-relaxed">
              {draft.assistant_judgement.main_gap}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
