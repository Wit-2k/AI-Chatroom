# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 项目概述

多智能体 AI 辩论系统（AI 讨论室）。多个 AI 角色围绕主题展开多轮辩论，最终生成结构化 Markdown 总结报告。

支持两种运行模式：

- **CLI 模式** — 终端交互，使用 Rich 渲染，总结保存至本地 `Summary/` 目录
- **Web 模式** — FastAPI 后端 + Next.js 前端，SSE 流式通信，总结通过浏览器下载

## 运行命令

```bash
# 安装依赖（需 Python >= 3.13，使用 uv）
uv sync

# CLI 模式
python main.py

# Web 模式 — 后端
uv run uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Web 模式 — 前端（需先 cd frontend && npm install）
cd frontend && npm run dev
```

无测试框架，无 lint 配置。

## 环境配置

复制 `.env.example` 为 `.env`，填入：

- `OPENAI_API_KEY` — 必填
- `OPENAI_BASE_URL` — 默认 `https://api.openai.com/v1`，支持 DeepSeek 等 OpenAI 兼容 API
- `MODEL_NAME` — 默认 `gpt-4o-mini`

前端需在 `frontend/.env.local` 中配置：

- `BACKEND_URL` — 后端地址，本地开发为 `http://localhost:8000`

## 架构关键点

- **`config.json`** — 运行时配置文件（见下方角色格式）
- **`Summary/`** — CLI 模式讨论总结自动保存目录（运行时自动创建）
- `DiscussionEngine` 是核心引擎：
  - CLI 模式通过 `run_discussion()` 驱动，`run()` 是入口
  - Web 模式通过 `run_discussion_api()` 驱动，yield 结构化字典供 SSE 使用
- **`server.py`** — FastAPI 应用，提供 REST API + SSE 流式端点
- **`frontend/`** — Next.js 16 前端，通过 `next.config.ts` 的 rewrites 代理 API 请求到后端

## Web API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/discussion/start` | 启动讨论，返回 `session_id` |
| `GET` | `/discussion/stream/{session_id}` | SSE 流式输出讨论内容 |
| `POST` | `/discussion/stop` | 停止指定会话 |

### SSE 事件类型

- `round_start` — 新一轮开始 `{round, total_rounds}`
- `chunk` — 角色发言流式片段 `{speaker, content}`
- `message_done` — 某角色本轮发言完毕 `{speaker, full_content}`
- `summary_start` — 开始生成总结
- `summary` — 总结完成 `{content}`
- `done` — 全部讨论结束
- `error` — 发生错误 `{message}`

## config.json 角色格式

`config.json` 中角色使用以下格式，由 [`AppConfig.from_dict()`](config_loader.py:41) 读取：

```json
{
  "name": "角色名",
  "role_description": "角色描述",
  "persona_prompt": "角色核心人设提示词",
  "interaction_examples": "「你说的X，我认为……」等互动句式示例"
}
```

`persona_prompt` + `interaction_examples` 在运行时通过 [`PersonaConfig.system_prompt`](config.py:31) property 动态拼接为完整 `system_prompt`，互动规范模板在 [`_INTERACTION_RULES_TEMPLATE`](config_loader.py:12) 中定义。

## LLM 调用约定

- 所有 LLM 调用通过 [`LLMClient.stream_chat()`](llm_client.py:16) 进行流式输出
- 每次角色发言：`system` 消息 = 角色 `system_prompt`，`user` 消息 = 由 [`_build_context_prompt()`](engine.py:120) 构建的上下文
- 总结生成时 `max_tokens=2000`，角色发言默认 `max_tokens=500`
- `temperature` 固定为 `0.7`

## 总结 JSON 解析（三级容错）

[`_parse_summary_response()`](engine.py:51) 有三级解析策略：

1. 直接 `json.loads`
2. 修复字符串内裸换行后再解析
3. 正则逐字段提取（兜底）

LLM 返回的总结 JSON 中 `content` 字段必须是单行字符串，换行用 `\n` 表示。

Web 模式下，前端从 `content` 字段提取 Markdown 正文生成下载文件，`title` 字段作为文件名。

## 代码风格

- 后端数据模型使用 `@dataclass`，API 模型使用 Pydantic
- 异步：`asyncio` + `AsyncOpenAI`，CLI 入口 `asyncio.run(main())`
- CLI 渲染：`rich`（`Panel`、`Console`、`Live`、`Prompt`）
- 前端：Next.js App Router + React 19 + Tailwind CSS + shadcn/ui
- 类型注解：函数签名均有类型注解，返回 `Optional[X]` 表示可能失败
- 错误处理：LLM 错误直接 `yield` 错误字符串到流中，不抛异常
