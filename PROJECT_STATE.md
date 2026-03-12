# 项目状态

> 本文件由 auditor 在每次 task 结束时更新。人工也可以在重大变更后手动更新。

---

## 基本信息

- **项目名**：idea-translator（需求翻译器）
- **阶段**：Alpha
- **最后更新**：2026-03-12

---

## 架构概览

- **框架**：Next.js App Router
- **API Routes**：`/app/api/`（requirements、session、transcribe）
- **共享 LLM 客户端**：`/lib/llm/client.ts`
- **数据库**：Supabase PostgreSQL
- **部署**：Docker → 腾讯云 Lighthouse（面向国内用户）
- **LLM**：Qwen（主模型）+ DeepSeek（备用），通过 OpenAI SDK 兼容接口
- **语音识别**：阿里云 ASR（规划中）

---

## 已知模块

| 模块 | 路径 | 说明 |
|------|------|------|
| Pages & API Routes | `app/` | Next.js 页面和 API 接口 |
| React Components | `components/` | UI 组件（ui/workspace/landing） |
| Shared Utilities | `lib/` | LLM 客户端、Supabase、会话管理、工具函数 |
| Type Definitions | `types/` | TypeScript 类型定义 |
| React Hooks | `hooks/` | 自定义 React Hooks |

---

## 依赖清单

| 包名 | 用途 |
|------|------|
| next | Web 框架（App Router） |
| react / react-dom | UI 渲染 |
| openai | LLM API 调用（兼容 Qwen/DeepSeek） |
| @supabase/supabase-js | 数据库客户端 |
| zod | 数据验证 |
| tailwindcss | CSS 框架 |
| shadcn (base-ui) | UI 组件库 |
| lucide-react | 图标库 |
| uuid | ID 生成 |

---

## ADR 索引

| ADR | 标题 | 状态 |
|-----|------|------|
| （暂无） | | |

---

## 已知地雷

- 测试框架尚未配置，所有变更暂时只依赖 lint 检查
- 阿里云 ASR 尚未集成，transcribe 接口可能为占位状态

---

## 最近变更

| 日期 | Task ID | 变更摘要 |
|------|---------|---------|
| 2026-03-12 | init-governance | 初始化 VOBECODING 治理框架 |
