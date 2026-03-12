import { RequirementDraft } from '@/types/draft'

export function buildClarifyPrompt(params: {
  currentDraft: RequirementDraft
  lastUserAnswer: string
  askedQuestions: string[]
  round: number
}): string {
  const { currentDraft, lastUserAnswer, askedQuestions, round } = params

  const missingFields = getMissingFields(currentDraft)

  return `这是第 ${round} 轮追问。用户刚刚回答了你的问题，请：
1. 根据用户的新回答，更新 draft 中相关字段的值和状态
2. 判断是否还需要继续追问
3. 如果需要继续，提出下一轮最关键的 1–3 个问题（不要重复已问过的问题）
4. 如果信息已足够，设置 should_stop 为 true

用户本轮回答：
"""
${lastUserAnswer}
"""

当前 draft 状态：
${JSON.stringify(currentDraft, null, 2)}

当前缺失/不清晰的关键字段：
${missingFields.join(', ') || '（主要字段已基本清晰）'}

已经问过的问题（不要重复）：
${askedQuestions.length > 0 ? askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : '（第一轮）'}

停止追问的条件（满足大部分即可停止）：
- clarity_score ≥ 7
- 目标用户已明确
- 使用场景已明确
- 核心问题已明确
- 目标结果已明确
- MVP 范围已有基本轮廓

请输出合法 JSON：
{
  "draft": { ...更新后的完整 draft },
  "assistant_message": "面向用户的回应，先确认收到了什么信息，再提下一轮问题（如果还需要问）",
  "next_questions": ["问题1"],
  "should_stop": false,
  "progress": {
    "completed": 3,
    "total": 7,
    "current_focus": "核心问题",
    "missing_slots": ["核心功能", "输出形式", "成功标准", "约束"]
  }
}

progress 字段说明：
- completed：7个关键槽位（idea_summary, target_user, scenario, core_problem, desired_outcome, mvp_scope, constraints）中已明确的数量
- current_focus：本轮最想确认的字段（中文名称，如"使用场景"、"目标用户"等）
- missing_slots：尚未明确的槽位列表（中文名称）`
}

function getMissingFields(draft: RequirementDraft): string[] {
  const missing: string[] = []
  if (draft.target_user.primary.status === 'missing') missing.push('目标用户')
  if (draft.scenario.status === 'missing') missing.push('使用场景')
  if (draft.core_problem.status === 'missing') missing.push('核心问题')
  if (draft.desired_outcome.status === 'missing') missing.push('目标结果')
  if (draft.mvp_scope.must_have.length === 0) missing.push('MVP范围')
  if (draft.current_solution.status === 'missing') missing.push('当前替代方案')
  return missing
}
