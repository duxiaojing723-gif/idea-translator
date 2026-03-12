'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SavedRequirement } from '@/lib/supabase/client'

export default function HistoryPage() {
  const [items, setItems] = useState<SavedRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/requirements/list')
    const data = await res.json()
    setItems(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/requirements/delete/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">已保存的需求</h1>
            <p className="text-sm text-muted-foreground mt-1">共 {items.length} 条</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            ← 新建需求
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-20">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">还没有保存任何需求</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.idea_summary || '未命名需求'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('zh-CN')} · 清晰度 {item.clarity_score}/10
                    </p>
                    {item.target_user && (
                      <p className="text-xs text-muted-foreground">目标用户：{item.target_user}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-xs text-muted-foreground">{expanded === item.id ? '收起' : '展开'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deleting === item.id}
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                    >
                      {deleting === item.id ? '删除中...' : '删除'}
                    </Button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === item.id && (
                  <div className="border-t p-4 space-y-3 bg-muted/20">
                    <Field label="核心问题" value={item.core_problem} />
                    <Field label="使用场景" value={item.scenario} />
                    <Field label="目标结果" value={item.desired_outcome} />

                    {item.mvp_must_have?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">MVP 必做</p>
                        <ul className="space-y-1">
                          {item.mvp_must_have.map((m, i) => (
                            <li key={i} className="text-sm flex gap-1">
                              <span className="text-green-500">✓</span> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(item.markdown)}
                      >
                        复制 Markdown
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  )
}
