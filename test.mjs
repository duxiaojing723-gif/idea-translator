/**
 * Integration test for idea-translator API
 * Run: node test.mjs
 * Tests against production URL
 */

// Set up proxy if needed (for environments behind a firewall)
import { ProxyAgent, setGlobalDispatcher } from 'undici'
const PROXY = process.env.https_proxy || process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'
try {
  setGlobalDispatcher(new ProxyAgent(PROXY))
} catch (e) {
  // Proxy not available, proceed without it
}

const BASE = 'https://idea-translator.vercel.app'
let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function fail(label, reason) {
  console.error(`  ✗ ${label}: ${reason}`)
  failed++
}

function section(title) {
  console.log(`\n── ${title}`)
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status, data: await res.json() }
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status, data: await res.json() }
}

// ── Test 1: Empty input rejected
section('POST /api/session/start — 边界校验')
{
  const { status, data } = await post('/api/session/start', { initial_input: '' })
  status === 400 ? ok('空输入返回 400') : fail('空输入应返回 400', `got ${status}`)

  const { status: s2 } = await post('/api/session/start', { initial_input: '太短' })
  s2 === 400 ? ok('过短输入返回 400') : fail('过短输入应返回 400', `got ${s2}`)
}

// ── Test 2: Valid start
section('POST /api/session/start — 正常流程')
let sessionId, draft, askedQuestions

{
  const input = `我想做一个工具帮那些表达很混乱的人把想法整理成产品需求。
  目标用户是独立开发者和一人公司。他们现在只能自己用 ChatGPT 反复沟通，效率很低。
  我希望用几轮追问帮他们输出结构化文档。`

  console.log('  → 调用 LLM，可能需要 5-15 秒...')
  const { status, data } = await post('/api/session/start', { initial_input: input })

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (data.session_id) {
    sessionId = data.session_id
    ok(`session_id 存在: ${sessionId.slice(0, 8)}...`)
  } else {
    fail('session_id 缺失', JSON.stringify(data))
  }

  if (data.status === 'clarifying' || data.status === 'ready_to_finalize') {
    ok(`status 合法: ${data.status}`)
  } else {
    fail('status 应为 clarifying 或 ready_to_finalize', data.status)
  }

  if (data.assistant_message && data.assistant_message.length > 10) {
    ok(`assistant_message 有内容 (${data.assistant_message.length} 字)`)
  } else {
    fail('assistant_message 为空或过短', data.assistant_message)
  }

  if (data.draft) {
    draft = data.draft
    ok('draft 存在')

    const aj = data.draft.assistant_judgement
    if (typeof aj?.clarity_score === 'number') {
      ok(`clarity_score: ${aj.clarity_score}`)
    } else {
      fail('clarity_score 类型错误', typeof aj?.clarity_score)
    }

    const fields = ['idea_summary', 'scenario', 'core_problem', 'desired_outcome']
    const statuses = ['confirmed', 'inferred', 'missing', 'conflicting']
    let fieldOk = true
    for (const f of fields) {
      const field = f === 'idea_summary' ? data.draft[f] : data.draft[f]
      if (!field || !statuses.includes(field.status)) {
        fail(`字段 ${f}.status 非法`, field?.status)
        fieldOk = false
      }
    }
    if (fieldOk) ok('所有关键字段 status 合法')

    const tuStatus = data.draft.target_user?.primary?.status
    statuses.includes(tuStatus) ? ok(`target_user.primary.status: ${tuStatus}`) : fail('target_user.primary.status 非法', tuStatus)
  } else {
    fail('draft 缺失', JSON.stringify(data))
  }

  askedQuestions = data.asked_questions || []
  ok(`asked_questions: ${askedQuestions.length} 条`)
}

// ── Test 3: Reply
section('POST /api/session/reply — 追问流程')
let updatedDraft

if (draft && sessionId) {
  const answer = `目标用户是那些有很多想法但说不清楚需求的独立开发者，他们在使用 AI 工具时经常发现自己说不清楚要做什么。使用场景是他们开始一个新项目之前，需要先把想法梳理清楚。`

  console.log('  → 调用 LLM，可能需要 5-15 秒...')
  const { status, data } = await post('/api/session/reply', {
    session_id: sessionId,
    answer,
    current_draft: draft,
    asked_questions: askedQuestions,
    round: 1,
  })

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (data.status === 'clarifying' || data.status === 'ready_to_finalize') {
    ok(`status 合法: ${data.status}`)
  } else {
    fail('status 非法', data.status)
  }

  if (data.draft) {
    updatedDraft = data.draft
    const prevScore = draft.assistant_judgement?.clarity_score || 0
    const newScore = data.draft.assistant_judgement?.clarity_score || 0
    ok(`clarity_score: ${prevScore} → ${newScore}`)
  } else {
    fail('reply draft 缺失', JSON.stringify(data))
    updatedDraft = draft
  }

  // Check asked_questions grows
  const newAsked = data.asked_questions || []
  newAsked.length >= askedQuestions.length
    ? ok(`asked_questions 累积: ${newAsked.length} 条`)
    : fail('asked_questions 应累积增长', `${askedQuestions.length} → ${newAsked.length}`)
} else {
  fail('跳过 reply 测试', 'start 阶段失败')
}

// ── Test 4: Finalize
section('POST /api/session/finalize — 生成结果')
let finalizedMarkdown, finalizedDraft

if (updatedDraft || draft) {
  const finalDraft = updatedDraft || draft
  const input = `我想做一个工具帮那些表达很混乱的人把想法整理成产品需求。`

  console.log('  → 调用 LLM，可能需要 5-15 秒...')
  const { status, data } = await post('/api/session/finalize', {
    session_id: sessionId || 'test',
    final_draft: finalDraft,
    initial_input: input,
  })

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (data.status === 'finalized') {
    ok('status: finalized')
  } else {
    fail('status 应为 finalized', data.status)
  }

  if (data.markdown && data.markdown.length > 100) {
    finalizedMarkdown = data.markdown
    ok(`markdown 生成成功 (${data.markdown.length} 字)`)
    // Check required sections
    const sections = ['目标用户', '核心问题', 'MVP']
    const missingSections = sections.filter(s => !data.markdown.includes(s))
    missingSections.length === 0
      ? ok('markdown 包含关键章节')
      : fail('markdown 缺少章节', missingSections.join(', '))
  } else {
    fail('markdown 为空或过短', data.markdown?.length)
  }

  if (data.json) {
    finalizedDraft = data.json
    ok('json 输出存在')
    typeof data.clarity_score === 'number'
      ? ok(`最终 clarity_score: ${data.clarity_score}`)
      : fail('clarity_score 类型错误', typeof data.clarity_score)
  } else {
    fail('json 输出缺失', JSON.stringify(data))
  }
} else {
  fail('跳过 finalize 测试', '前置阶段失败')
}

// ── Test 5: Supabase requirements routes
section('POST /api/requirements/save — 保存需求')
let savedId

if (finalizedDraft && finalizedMarkdown) {
  const { status, data } = await post('/api/requirements/save', {
    draft: finalizedDraft,
    markdown: finalizedMarkdown,
  })

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (data.success === true) {
    ok('success: true')
  } else {
    fail('success 应为 true', JSON.stringify(data))
  }

  if (data.data?.id) {
    savedId = data.data.id
    ok(`保存成功，id: ${savedId}`)
  } else {
    fail('保存结果缺少 id', JSON.stringify(data))
  }
} else {
  fail('跳过 save 测试', 'finalize 阶段失败，无可用 draft/markdown')
}

section('GET /api/requirements/list — 列出需求')
{
  const { status, data } = await get('/api/requirements/list')

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (Array.isArray(data.data)) {
    ok(`列表返回数组，共 ${data.data.length} 条`)
    if (savedId) {
      const found = data.data.find(r => r.id === savedId)
      found ? ok('刚保存的记录可被列出') : fail('刚保存的记录未出现在列表中', `id=${savedId}`)
    }
  } else {
    fail('data.data 应为数组', typeof data.data)
  }
}

section('DELETE /api/requirements/delete/:id — 删除需求')
if (savedId) {
  const { status, data } = await del(`/api/requirements/delete/${savedId}`)

  status === 200 ? ok('返回 200') : fail('应返回 200', `got ${status}: ${JSON.stringify(data)}`)

  if (data.success === true) {
    ok('success: true，删除成功')
  } else {
    fail('success 应为 true', JSON.stringify(data))
  }

  // Verify it's gone
  const { data: listData } = await get('/api/requirements/list')
  if (Array.isArray(listData.data)) {
    const stillExists = listData.data.find(r => r.id === savedId)
    stillExists ? fail('删除后记录仍存在', `id=${savedId}`) : ok('删除后记录已从列表消失')
  }
} else {
  fail('跳过 delete 测试', 'save 阶段失败，无可用 id')
}

// ── Summary
console.log(`\n${'─'.repeat(40)}`)
console.log(`结果：${passed} 通过，${failed} 失败`)
if (failed === 0) {
  console.log('✅ 全部通过，可以正常使用')
} else {
  console.log('❌ 有失败项，需要修复')
  process.exit(1)
}
