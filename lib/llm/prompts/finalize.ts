import { RequirementDraft } from '@/types/draft'

export function buildFinalizePrompt(params: {
  finalDraft: RequirementDraft
  initialInput: string
}): string {
  const { finalDraft, initialInput } = params

  return `请根据以下结构化需求草案，生成最终的需求摘要文档。

用户原始输入（用于还原语境）：
"""
${initialInput}
"""

最终需求草案：
${JSON.stringify(finalDraft, null, 2)}

请输出合法 JSON：
{
  "markdown": "# 需求摘要\\n\\n完整的 Markdown 格式需求文档",
  "final_draft": { ...最终确认后的 draft，可做微调 }
}

Markdown 文档必须包含以下章节：
1. ## 一句话需求定义
2. ## 目标用户
3. ## 非目标用户
4. ## 使用场景
5. ## 核心问题
6. ## 当前替代方案
7. ## 目标结果
8. ## MVP 必做
9. ## 当前不做
10. ## 风险与待确认项

写作要求：
- 语言简洁、直接，适合交给开发者/Claude 继续实现
- 区分已确认信息（直接陈述）和推断信息（标注"[推断]"）
- 待确认项单独列出，不要混入已确认内容`
}
