import { RequirementDraft } from '@/types/draft'

export function computeClarityScore(draft: RequirementDraft): number {
  let score = 0

  // Key fields scoring (max 6 points)
  const keyFields = [
    draft.target_user.primary.status,
    draft.scenario.status,
    draft.core_problem.status,
    draft.desired_outcome.status,
  ]

  for (const status of keyFields) {
    if (status === 'confirmed') score += 1.5
    else if (status === 'inferred') score += 0.8
  }

  // Bonus points (max 4)
  if (draft.idea_summary.status !== 'missing') score += 0.5
  if (draft.mvp_scope.must_have.length > 0) score += 1
  if (draft.mvp_scope.out_of_scope.length > 0) score += 0.5
  if (draft.current_solution.status !== 'missing') score += 0.5
  if (draft.open_questions.length < 3 && draft.assistant_judgement.clarity_score > 4) score += 1

  return Math.min(10, Math.round(score * 10) / 10)
}

export function shouldFinalize(draft: RequirementDraft): boolean {
  const score = draft.assistant_judgement.clarity_score
  const hasUser = draft.target_user.primary.status !== 'missing'
  const hasScenario = draft.scenario.status !== 'missing'
  const hasProblem = draft.core_problem.status !== 'missing'
  const hasOutcome = draft.desired_outcome.status !== 'missing'
  const hasMvp = draft.mvp_scope.must_have.length > 0

  return score >= 7 && hasUser && hasScenario && hasProblem && hasOutcome && hasMvp
}
