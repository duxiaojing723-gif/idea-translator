export type FieldStatus = 'confirmed' | 'inferred' | 'missing' | 'conflicting'

export type ExpressionType =
  | 'goal_blurry'
  | 'jumping_mixed'
  | 'constraint_missing'
  | 'feature_first'
  | 'user_unclear'
  | 'scenario_unclear'
  | 'none'

export interface DraftField {
  value: string
  status: FieldStatus
}

export interface RequirementDraft {
  idea_summary: DraftField
  target_user: {
    primary: DraftField
    non_target: string[]
  }
  scenario: DraftField
  core_problem: DraftField
  current_solution: DraftField
  desired_outcome: DraftField
  constraints: string[]
  mvp_scope: {
    must_have: string[]
    out_of_scope: string[]
  }
  open_questions: string[]
  assistant_judgement: {
    clarity_score: number
    confidence: number
    expression_type: ExpressionType
    main_gap: string
  }
}

export function createEmptyDraft(): RequirementDraft {
  const missing: DraftField = { value: '', status: 'missing' }
  return {
    idea_summary: { ...missing },
    target_user: {
      primary: { ...missing },
      non_target: [],
    },
    scenario: { ...missing },
    core_problem: { ...missing },
    current_solution: { ...missing },
    desired_outcome: { ...missing },
    constraints: [],
    mvp_scope: {
      must_have: [],
      out_of_scope: [],
    },
    open_questions: [],
    assistant_judgement: {
      clarity_score: 0,
      confidence: 0,
      expression_type: 'none',
      main_gap: '',
    },
  }
}
