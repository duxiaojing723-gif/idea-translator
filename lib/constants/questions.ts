// Question priority order - matches the spec
export const QUESTION_PRIORITY = [
  'target_user',
  'scenario',
  'core_problem',
  'desired_outcome',
  'mvp_scope',
  'constraints',
] as const

// Banned question patterns (too vague)
export const BANNED_PATTERNS = [
  '你再展开说说',
  '还有什么想补充',
  '你的想法是什么',
  '你可以更详细',
  '能详细描述',
]

// Recommended question templates by missing slot
export const QUESTION_TEMPLATES: Record<string, string[]> = {
  target_user: [
    '你最希望帮助的是哪类人？',
    '这个产品主要给谁用？他们的主要特征是什么？',
  ],
  scenario: [
    '他们会在什么具体情境下需要这个工具？',
    '能描述一个具体的使用场景吗？',
  ],
  core_problem: [
    '他们现在面临的最大痛点是什么？',
    '没有这个工具时，他们是怎么处理这个问题的？为什么这种方式不够好？',
  ],
  desired_outcome: [
    '你希望用户使用后得到什么明确结果？',
    '如果这个产品成功了，用户会有什么不同？',
  ],
  mvp_scope: [
    '如果第一版只能解决一件事，你最希望先解决哪件事？',
    '第一版最核心的功能是什么？哪些可以放到后续版本？',
  ],
  constraints: [
    '有什么关键限制吗？比如时间、预算、技术、使用方式等。',
  ],
}

export const STOP_CONDITIONS = {
  MIN_CLARITY_SCORE: 7,
  REQUIRED_CONFIRMED_FIELDS: ['target_user', 'scenario', 'core_problem', 'desired_outcome'],
}
