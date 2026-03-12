import { RequirementDraft } from '@/types/draft'
import { shouldFinalize } from './scoring'

export function determineNextStatus(
  draft: RequirementDraft,
  shouldStop: boolean
): 'clarifying' | 'ready_to_finalize' {
  if (shouldStop || shouldFinalize(draft)) {
    return 'ready_to_finalize'
  }
  return 'clarifying'
}

export function filterValidQuestions(questions: unknown[]): string[] {
  const banned = ['展开说说', '想补充', '你的想法', '更详细', '能详细']

  return questions
    .filter((q): q is string => typeof q === 'string' && q.length > 0)
    .filter(q => !banned.some(pattern => q.includes(pattern)))
    .slice(0, 3)
}
