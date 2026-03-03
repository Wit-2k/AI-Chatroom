"use client";

import { useEffect, useState } from "react";

const HEALTH_URL = "http://localhost:8000/health";
const POLL_INTERVAL = 500;   // ms
const TIMEOUT = 30_000;      // 30s

type BootState = "checking" | "ready" | "error";

export default function TauriBootstrap({ children }: { children: React.ReactNode }) {
    // 初始状态统一为 "ready"，与 SSR 输出一致，避免 hydration mismatch
    const [state, setState] = useState<BootState>("ready");

    useEffect(() => {
        // 客户端挂载后检测 Tauri 环境，如果是 Tauri 则切换为 "checking"
        if ("__TAURI__" in window) {
            setState("checking");
        }
    }, []);

    useEffect(() => {
        if (state !== "checking") return;

        let cancelled = false;
        const start = Date.now();

        const poll = async () => {
            while (!cancelled) {
                try {
                    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) });
                    if (res.ok) {
                        setState("ready");
                        return;
                    }
                } catch {
                    // 后端未就绪，继续轮询
                }

                if (Date.now() - start > TIMEOUT) {
                    setState("error");
                    return;
                }

                await new Promise((r) => setTimeout(r, POLL_INTERVAL));
            }
        };

        poll();
        return () => { cancelled = true; };
    }, [state]);

    if (state === "ready") return <>{children}</>;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="text-center space-y-4">
                {state === "checking" && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                            正在启动后端服务...
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            首次启动可能需要几秒钟
                        </p>
                    </>
                )}
                {state === "error" && (
                    <>
                        <p className="text-lg font-medium text-red-600 dark:text-red-400">
                            ❌ 后端服务启动失败
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            请检查 Python 环境和 .env 配置是否正确
                        </p>
                        <button
                            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                            onClick={() => setState("checking")}
                        >
                            重试
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
