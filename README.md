# 🤖 AI 讨论室

多个 AI 角色围绕你指定的主题展开多轮辩论，最终生成结构化的 Markdown 总结报告。

支持 **CLI 终端** 和 **Web 界面** 两种使用方式。

![Python](https://img.shields.io/badge/Python-3.13+-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![License](https://img.shields.io/badge/License-MIT-green)

## 快速开始

### 环境配置

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API Key（必填） | — |
| `OPENAI_BASE_URL` | API 地址，支持 DeepSeek 等兼容接口 | `https://api.openai.com/v1` |
| `MODEL_NAME` | 使用的模型 | `gpt-4o-mini` |

### 方式一：CLI 终端模式

```bash
# 安装依赖（需要 Python 3.13+）
uv sync

# 运行
python main.py
```

程序启动后可输入 `config` 打开**配置向导**，支持手动编辑或让 AI 自动生成角色。

讨论结束后，总结报告自动保存至 `Summary/` 目录。

### 方式二：Web 界面模式

需要同时启动后端 API 和前端服务：

**启动后端**

```bash
uv run uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**启动前端**

```bash
cd frontend
npm install   # 首次运行
npm run dev
```

前端需要在 `frontend/.env.local` 中配置后端地址：

```
BACKEND_URL=http://localhost:8000
```

打开 <http://localhost:3000> 即可使用 Web 界面。

Web 模式下，讨论结束后可在浏览器中直接下载总结报告（`.md` 文件）。

## 自定义角色

编辑 `config.json` 配置参与讨论的角色、主题和轮数：

```json
{
  "personas": [
    {
      "name": "角色名",
      "role_description": "角色简介",
      "persona_prompt": "角色的核心人设和立场",
      "interaction_examples": "「你说的X，我认为……」等典型回应句式"
    }
  ],
  "topic": "讨论主题（可留空，运行时输入）",
  "max_rounds": 3
}
```

Web 界面也支持在页面上直接配置角色和主题。

## 讨论总结

每次讨论结束后生成结构化总结报告，包含：

- 各方核心立场
- 关键交锋时刻
- 主要分歧点
- 达成的共识
- 综合结论

CLI 模式下自动保存至 `Summary/` 目录；Web 模式下通过浏览器下载。

## 项目结构

```
├── main.py            # CLI 入口
├── server.py          # FastAPI 后端（Web 模式入口）
├── engine.py          # 讨论引擎（核心逻辑）
├── config.py          # 配置数据类和默认角色
├── config_loader.py   # 配置文件读写
├── llm_client.py      # LLM 流式调用封装
├── models.py          # 数据模型
├── api_models.py      # API 请求/响应模型（Pydantic）
├── wizard.py          # 交互式配置向导（CLI）
├── config.json        # 运行时角色配置
├── Summary/           # CLI 模式总结输出目录
└── frontend/          # Next.js Web 前端
    └── src/
        ├── app/           # 页面路由
        ├── components/    # UI 组件
        └── lib/           # API 调用、类型定义
```

## 技术栈

**后端：** Python 3.13+ · FastAPI · AsyncOpenAI · Rich（CLI 渲染）

**前端：** Next.js 16 · React 19 · Tailwind CSS · shadcn/ui · SSE 流式通信
