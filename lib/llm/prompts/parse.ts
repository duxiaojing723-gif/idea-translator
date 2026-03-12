import { RequirementDraft, createEmptyDraft } from '@/types/draft'

export function buildParsePrompt(initialInput: string): string {
  const emptyDraft = createEmptyDraft()

  return `用户刚刚提交了一段初始想法，请你：
1. 解析其中已有的信息，填入 draft 对应字段
2. 标记每个字段的状态（confirmed/inferred/missing/conflicting）
3. 计算初始清晰度分数
4. 提出第一轮最关键的 1–3 个追问问题

用户输入：
"""
${initialInput}
"""

请输出合法 JSON，格式如下：
{
  "draft": ${JSON.stringify(emptyDraft, null, 2)},
  "assistant_message": "面向用户的回应文本，先确认你理解了什么，再提出追问",
  "next_questions": ["问题1", "问题2"],
  "should_stop": false,
  "progress": {
    "completed": 2,
    "total": 7,
    "current_focus": "使用场景",
    "missing_slots": ["场景", "核心功能", "输出形式", "成功标准", "约束"]
  }
}

注意：
- assistant_message 是给用户看的，用中文，友好但直接
- next_questions 是你本轮要问的具体问题列表（已包含在 assistant_message 中，这里单独列出用于系统追踪）
- should_stop 为 true 表示信息已足够，可以直接生成结果
- 字段 status 含义：confirmed=用户明确说过，inferred=合理推断，missing=尚未提及，conflicting=前后矛盾
- expression_type 可选值：goal_blurry, jumping_mixed, constraint_missing, feature_first, user_unclear, scenario_unclear, none
- progress.completed 表示7个关键槽位中已明确的数量（idea_summary, target_user, scenario, core_problem, desired_outcome, mvp_scope, constraints）
- progress.current_focus 是本轮最想确认的字段名称（中文）
- progress.missing_slots 是尚未明确的槽位列表（中文名称）`
}
