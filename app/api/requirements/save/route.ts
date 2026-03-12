import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'
import { RequirementDraft } from '@/types/draft'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body: { draft: RequirementDraft; markdown: string } = await req.json()
    const { draft, markdown } = body

    const { data, error } = await supabase
      .from('requirements')
      .insert({
        user_id: user.userId,
        idea_summary: draft.idea_summary.value,
        target_user: draft.target_user.primary.value,
        scenario: draft.scenario.value,
        core_problem: draft.core_problem.value,
        desired_outcome: draft.desired_outcome.value,
        mvp_must_have: draft.mvp_scope.must_have,
        clarity_score: draft.assistant_judgement.clarity_score,
        markdown,
        full_json: draft,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[requirements/save]', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
