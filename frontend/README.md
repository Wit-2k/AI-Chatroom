# AI 讨论室 - Web 前端

基于 Next.js 16 + React 19 的 Web 界面，通过 SSE 流式展示 AI 多角色辩论过程。

## 开发

```bash
npm install
npm run dev
```

需要在 `.env.local` 中配置后端地址：

```
BACKEND_URL=http://localhost:8000
```

## 构建

```bash
npm run build
npm start
```

## 技术栈

- **Next.js 16** — App Router
- **React 19** — 状态管理
- **Tailwind CSS 4** — 样式
- **shadcn/ui** — UI 组件库
- **SSE** — 流式通信（打字机效果）
