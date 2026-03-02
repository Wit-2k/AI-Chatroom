# 🤖 AI 讨论室

多个 AI 角色围绕你指定的主题展开多轮辩论，最终生成结构化的 Markdown 总结报告。

![Python](https://img.shields.io/badge/Python-3.13+-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 效果预览

```
━━━ 第 1 轮 ━━━

💬 远见者：科技是解放人类的钥匙，拟态社交让我们突破地理限制……
💬 守衡者：我理解远见者的乐观，但现实数据显示孤独感正在上升……
💬 人本家：守衡者说的很有道理，但我更担心的是被算法遗忘的人……
💬 逻辑师：人本家的情感论证无法解决核心问题，数据显示……
```

## 快速开始

**1. 安装依赖**（需要 Python 3.13+）

```bash
# 推荐使用 uv
uv sync

# 或使用 pip
pip install openai python-dotenv rich
```

**2. 配置 API Key**

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

**3. 运行**

```bash
python main.py
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API Key（必填） | — |
| `OPENAI_BASE_URL` | API 地址，支持 DeepSeek 等兼容接口 | `https://api.openai.com/v1` |
| `MODEL_NAME` | 使用的模型 | `gpt-4o-mini` |

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

也可以在程序内输入 `config` 打开**配置向导**，支持手动编辑或让 AI 自动生成角色。

## 讨论总结

每次讨论结束后，结构化总结报告自动保存至 `Summary/` 目录，包含：

- 各方核心立场
- 关键交锋时刻
- 主要分歧点
- 达成的共识
- 综合结论

## 项目结构

```
├── main.py          # 程序入口
├── engine.py        # 讨论引擎（核心逻辑）
├── config.py        # 配置数据类和默认角色
├── config_loader.py # 配置文件读写
├── llm_client.py    # LLM 流式调用封装
├── models.py        # 数据模型
├── wizard.py        # 交互式配置向导
├── config.json      # 运行时角色配置
└── Summary/         # 讨论总结输出目录
```
