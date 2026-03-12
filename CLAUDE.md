# 工程宪法

> 本文件是本项目最高规则。所有 agent、skill、人类都必须遵守。
> 修改本文件须走 /amend-constitution 流程，不允许在实现任务中顺手修改。

---

## 核心原则

1. **Brief 先行**：没有 `/docs/briefs/[task-id].md` 不允许写任何代码
2. **ADR 先行**：新模块 / 新外部依赖 / 新公开接口，必须先在 `/docs/decisions/` 创建决策记录
3. **模块边界**：API Route → lib 层 → Supabase，不允许跳层（如在 API Route 里直接操作 DB）
4. **变更预算**：单次 task 最多修改 5 个文件，最多新增 1 个模块，不允许引入新外部依赖（需独立审批）
5. **测试门槛**：暂未配置测试框架，lint 必须通过。测试框架引入后，每个行为变更必须有对应测试

---

## 禁止事项（任何情况下不允许）

- 跨层调用（绕过 lib 层直接从 API Route 或 Component 访问 Supabase）
- 把业务逻辑写进 components 层
- 硬编码配置（统一走 env / config 文件）
- 在 lib 层塞 UI 相关逻辑
- 无关重构（修 bug 时不允许顺手改其他代码风格）
- 在实现任务过程中修改 CLAUDE.md 或 agent 定义

---

## 高风险动作（必须停下来等待人工确认）

- 删除或重命名 Supabase 表 / 字段
- 修改认证 / 授权逻辑
- 修改生产环境配置
- 新增公开 API endpoint（`/app/api/` 下新增路由）
- 引入新的外部依赖（npm install）
- 执行 git push 或任何部署命令
- 修改 .claude/ 目录下任何文件
- 修改 LLM 模型配置（Qwen / DeepSeek 切换逻辑）

---

## 技术栈锁定

> 修改此节须走 /amend-constitution 流程

- **语言**：TypeScript（严格模式）
- **运行时**：Node.js + Next.js (App Router)
- **前端**：React + Next.js + Tailwind CSS
- **数据库**：Supabase PostgreSQL
- **API 风格**：Next.js API Routes (`/app/api/`) + Zod 验证
- **LLM**：Qwen（主）+ DeepSeek（备用），通过 OpenAI SDK 兼容接口调用
- **语音识别**：阿里云 ASR（规划中）
- **Lint**：ESLint
- **测试**：暂未配置，后续补充
- **部署**：Docker → 腾讯云 Lighthouse（国内用户）

---

## 项目架构约定

```
app/                    # Next.js App Router
  api/                  # API Routes（后端接口）
    requirements/       # 需求相关接口
    session/           # 会话相关接口
    transcribe/        # 语音转写接口
  (pages)/             # 前端页面
components/            # React 组件
  ui/                  # 基础 UI 组件（shadcn）
  workspace/           # 工作区组件
  landing/             # 落地页组件
lib/                   # 共享逻辑层
  llm/                 # LLM 客户端（client.ts）
  supabase/            # Supabase 客户端
  session/             # 会话管理
  constants/           # 常量定义
  utils.ts             # 工具函数
types/                 # TypeScript 类型定义
hooks/                 # React Hooks
docs/                  # 项目文档
  briefs/              # Task Briefs
  decisions/           # ADR 决策记录
```

### 调用层级

```
Component / Page → lib/ → Supabase
API Route → lib/ → Supabase / LLM
```

---

## 交付格式

每次 task 结束，auditor 必须输出以下报告，Stop hook 检查报告存在后才允许结束：

```
## 变更摘要
- 修改文件列表（每行一个，标注改了什么）

## 测试结果
- lint: PASS / FAIL
- test: 暂未配置

## 剩余风险
- （列出已知但未解决的问题）

## 待你决策
- （需要人工判断的事项，没有则写"无"）

## PROJECT_STATE 已更新
- （确认 PROJECT_STATE.md 已更新）
```

---

## 宪法版本

- v1.0 — 初始版本（2026-03-12）
- 变更历史见 `/docs/decisions/constitution-changes.md`
