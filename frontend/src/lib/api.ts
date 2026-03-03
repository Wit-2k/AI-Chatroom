import type {
    StartDiscussionRequest,
    StartDiscussionResponse,
    SSEEvent,
} from "./types";

// 普通 REST 请求走 Next.js 代理（/api/* → localhost:8000）
const API_BASE = "/api";

// SSE 流式请求直接连后端，绕过 Next.js rewrites 缓冲
const STREAM_BASE =
    typeof window !== "undefined"
        ? "http://localhost:8000"
        : "http://localhost:8000";

/**
 * 启动一次新的 AI 讨论，返回 session_id
 */
export async function startDiscussion(
    req: StartDiscussionRequest
): Promise<StartDiscussionResponse> {
    const url = `${API_BASE}/discussion/start`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
    }

    return res.json();
}

/**
 * 以 SSE 流式消费讨论内容。
 * 每收到一个事件调用 onEvent 回调；流结束或出错时调用 onDone。
 *
 * 返回一个 abort 函数，调用后立即断开连接。
 */
export function streamDiscussion(
    sessionId: string,
    onEvent: (event: SSEEvent) => void,
    onDone: (error?: string) => void
): () => void {
    const controller = new AbortController();

    (async () => {
        try {
            const streamUrl = `${STREAM_BASE}/discussion/stream/${sessionId}`;
            const res = await fetch(
                streamUrl,
                {
                    signal: controller.signal,
                    // cache: "no-store" 确保不缓存，直接流式读取
                    cache: "no-store",
                    headers: { Accept: "text/event-stream" },
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                onDone(err.detail ?? `HTTP ${res.status}`);
                return;
            }

            const reader = res.body?.getReader();
            if (!reader) {
                onDone("无法读取响应流");
                return;
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE 格式：每个事件以 \n\n 结尾
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6);
                    try {
                        const event: SSEEvent = JSON.parse(raw);
                        onEvent(event);
                        if (event.type === "done" || event.type === "error") {
                            onDone(event.type === "error" ? event.message : undefined);
                            return;
                        }
                        // chunk 事件后让出主线程，使 React 有机会渲染
                        if (event.type === "chunk") {
                            await new Promise<void>((r) => setTimeout(r, 0));
                        }
                    } catch {
                        // 忽略非 JSON 行
                    }
                }
            }

            onDone();
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            onDone((err as Error).message);
        }
    })();

    return () => controller.abort();
}

/**
 * 停止指定会话的讨论
 */
export async function stopDiscussion(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/discussion/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
    });
}
