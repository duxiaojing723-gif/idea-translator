import { RequirementDraft, createEmptyDraft, FieldStatus, ExpressionType } from '@/types/draft'

const VALID_STATUSES: FieldStatus[] = ['confirmed', 'inferred', 'missing', 'conflicting']
const VALID_EXPRESSION_TYPES: ExpressionType[] = [
  'goal_blurry', 'jumping_mixed', 'constraint_missing',
  'feature_first', 'user_unclear', 'scenario_unclear', 'none'
]

export function validateAndRepairDraft(raw: unknown): RequirementDraft {
  const base = createEmptyDraft()

  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, unknown>

  // idea_summary
  base.idea_summary = validateField(r.idea_summary) ?? base.idea_summary

  // target_user
  if (r.target_user && typeof r.target_user === 'object') {
    const tu = r.target_user as Record<string, unknown>
    base.target_user.primary = validateField(tu.primary) ?? base.target_user.primary
    base.target_user.non_target = validateStringArray(tu.non_target)
  }

  base.scenario = validateField(r.scenario) ?? base.scenario
  base.core_problem = validateField(r.core_problem) ?? base.core_problem
  base.current_solution = validateField(r.current_solution) ?? base.current_solution
  base.desired_outcome = validateField(r.desired_outcome) ?? base.desired_outcome
  base.constraints = validateStringArray(r.constraints)

  // mvp_scope
  if (r.mvp_scope && typeof r.mvp_scope === 'object') {
    const mvp = r.mvp_scope as Record<string, unknown>
    base.mvp_scope.must_have = validateStringArray(mvp.must_have)
    base.mvp_scope.out_of_scope = validateStringArray(mvp.out_of_scope)
  }

  base.open_questions = validateStringArray(r.open_questions)

  // assistant_judgement
  if (r.assistant_judgement && typeof r.assistant_judgement === 'object') {
    const aj = r.assistant_judgement as Record<string, unknown>
    base.assistant_judgement.clarity_score = clampScore(aj.clarity_score)
    base.assistant_judgement.confidence = clampScore(aj.confidence)
    base.assistant_judgement.expression_type = VALID_EXPRESSION_TYPES.includes(aj.expression_type as ExpressionType)
      ? (aj.expression_type as ExpressionType)
      : 'none'
    base.assistant_judgement.main_gap = typeof aj.main_gap === 'string' ? aj.main_gap : ''
  }

  return base
}

function validateField(raw: unknown): { value: string; status: FieldStatus } | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Record<string, unknown>
  return {
    value: typeof f.value === 'string' ? f.value : '',
    status: VALID_STATUSES.includes(f.status as FieldStatus) ? (f.status as FieldStatus) : 'missing',
  }
}

function validateStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

function clampScore(val: unknown): number {
  if (typeof val !== 'number') return 0
  return Math.min(10, Math.max(0, Math.round(val * 10) / 10))
}

export function extractJson(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {}

  // Try extracting JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch {}
  }

  // Try extracting bare JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {}
  }

  return null
}
