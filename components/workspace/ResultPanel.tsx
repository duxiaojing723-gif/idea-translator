'use client'

import { useState } from 'react'
import { RequirementDraft } from '@/types/draft'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ResultPanelProps {
  markdown: string
  json: RequirementDraft
  clarityScore: number
  confidence: number
}

export function ResultPanel({ markdown, json, clarityScore, confidence }: ResultPanelProps) {
  const [tab, setTab] = useState<'review' | 'markdown' | 'json'>('review')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [mustHave, setMustHave] = useState<string[]>(json.mvp_scope.must_have)
  const [openQuestions, setOpenQuestions] = useState<string[]>(json.open_questions)

  const handleCopy = async () => {
    const content = tab === 'json' ? JSON.stringify(json, null, 2) : markdown
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const draftToSave: RequirementDraft = {
        ...json,
        mvp_scope: { ...json.mvp_scope, must_have: mustHave },
        open_questions: openQuestions,
      }
      const res = await fetch('/api/requirements/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftToSave, markdown }),
      })
      if (!res.ok) throw new Error('保存失败')
      setSaved(true)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">最终需求摘要</span>
          <span className="text-xs text-muted-foreground">
            清晰度 {clarityScore}/10 · 置信度 {confidence}/10
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md overflow-hidden text-xs">
            {(['review', 'markdown', 'json'] as const).map(t => (
              <button
                key={t}
                className={`px-3 py-1 ${tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                onClick={() => setTab(t)}
              >
                {t === 'review' ? '确认' : t === 'markdown' ? 'Markdown' : 'JSON'}
              </button>
            ))}
          </div>
          {tab !== 'review' && (
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? '已复制 ✓' : '复制'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'review' && (
          <div className="space-y-5">
            <Section label="一句话定义" value={json.idea_summary.value} />
            <Section label="目标用户" value={json.target_user.primary.value} />
            <Section label="使用场景" value={json.scenario.value} />
            <Section label="核心问题" value={json.core_problem.value} />
            <Section label="目标结果" value={json.desired_outcome.value} />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">MVP 必做（可删除）</p>
              {mustHave.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">—</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mustHave.map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {item}
                      <button
                        onClick={() => setMustHave(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-1 hover:text-destructive"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {openQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">待确认项（可删除）</p>
                <div className="space-y-1">
                  {openQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-600 mt-0.5">?</span>
                      <span className="flex-1">{q}</span>
                      <button
                        onClick={() => setOpenQuestions(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              {saved ? (
                <p className="text-center text-sm text-green-600 font-medium py-1">✓ 已保存到数据库</p>
              ) : null}
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : saved ? '再次保存' : '提交并保存'}
              </Button>
              {saveError && <p className="text-xs text-destructive text-center">{saveError}</p>}
              <Button variant="outline" className="w-full" onClick={() => window.open('/history', '_blank')}>
                查看已保存的需求
              </Button>
            </div>
          </div>
        )}

        {tab === 'markdown' && (
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted rounded-lg p-4 leading-relaxed">
            {markdown}
          </pre>
        )}

        {tab === 'json' && (
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted rounded-lg p-4 leading-relaxed">
            {JSON.stringify(json, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}
