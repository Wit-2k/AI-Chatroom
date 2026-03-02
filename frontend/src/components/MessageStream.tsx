"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { DiscussionState } from "@/lib/types";

// 每个角色对应的颜色方案（背景 + 文字 + 边框）
const SPEAKER_COLORS = [
    {
        bubble: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        dot: "bg-blue-400",
    },
    {
        bubble: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
        badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        dot: "bg-green-400",
    },
    {
        bubble: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        dot: "bg-orange-400",
    },
    {
        bubble: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        dot: "bg-purple-400",
    },
    {
        bubble: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
        badge: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
        dot: "bg-pink-400",
    },
    {
        bubble: "bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800",
        badge: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
        dot: "bg-teal-400",
    },
];

// 根据 speaker 名称稳定分配颜色索引
function getSpeakerColorIndex(
    speaker: string,
    speakerOrder: Map<string, number>
): number {
    if (!speakerOrder.has(speaker)) {
        speakerOrder.set(speaker, speakerOrder.size);
    }
    return speakerOrder.get(speaker)! % SPEAKER_COLORS.length;
}

interface MessageStreamProps {
    state: DiscussionState;
    topic: string;
}

export default function MessageStream({ state, topic }: MessageStreamProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    // 稳定的 speaker → 颜色索引映射（在组件生命周期内保持不变）
    const speakerOrderRef = useRef<Map<string, number>>(new Map());

    // 自动滚动到底部
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [state.rounds, state.summary]);

    const statusLabel: Record<DiscussionState["status"], string> = {
        idle: "等待中",
        connecting: "连接中...",
        streaming: "讨论进行中",
        summarizing: "生成总结中...",
        done: "讨论完成",
        error: "发生错误",
    };

    const statusColor: Record<DiscussionState["status"], string> = {
        idle: "secondary",
        connecting: "secondary",
        streaming: "default",
        summarizing: "default",
        done: "default",
        error: "destructive",
    };

    return (
        <div className="flex flex-col h-full">
            {/* 顶部状态栏 */}
            <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-medium text-muted-foreground truncate max-w-[70%]">
                    {topic}
                </h2>
                <Badge variant={statusColor[state.status] as "default" | "secondary" | "destructive"}>
                    {statusLabel[state.status]}
                </Badge>
            </div>

            <ScrollArea className="flex-1 pr-2">
                <div className="space-y-6 pb-4">
                    {state.rounds.map((round) => (
                        <div key={round.round} className="space-y-3">
                            {/* 轮次标题 */}
                            <div className="flex items-center gap-2">
                                <Separator className="flex-1" />
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-2">
                                    第 {round.round} / {round.total_rounds} 轮
                                </span>
                                <Separator className="flex-1" />
                            </div>

                            {/* 该轮的发言气泡 */}
                            {round.messages.map((msg, msgIdx) => {
                                const colorIdx = getSpeakerColorIndex(
                                    msg.speaker,
                                    speakerOrderRef.current
                                );
                                const colors = SPEAKER_COLORS[colorIdx];

                                return (
                                    <div key={msgIdx} className="space-y-1">
                                        {/* Speaker badge */}
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`inline-block w-2 h-2 rounded-full ${colors.dot}`}
                                            />
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
                                            >
                                                {msg.speaker}
                                            </span>
                                            {!msg.isDone && (
                                                <span className="text-xs text-muted-foreground animate-pulse">
                                                    正在发言...
                                                </span>
                                            )}
                                        </div>

                                        {/* 消息气泡 */}
                                        <div
                                            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${colors.bubble}`}
                                        >
                                            {msg.content || (
                                                <span className="text-muted-foreground italic">
                                                    思考中...
                                                </span>
                                            )}
                                            {/* 打字光标 */}
                                            {!msg.isDone && msg.content && (
                                                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* 总结卡片 */}
                    {state.summary && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Separator className="flex-1" />
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-2">
                                    讨论总结
                                </span>
                                <Separator className="flex-1" />
                            </div>

                            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-amber-800 dark:text-amber-200">
                                        📝 AI 总结报告
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900 dark:text-amber-100">
                                        {/* 尝试解析 JSON 总结，提取 summary 字段；否则显示原始内容 */}
                                        {(() => {
                                            try {
                                                const match = state.summary!.match(/\{[\s\S]*\}/);
                                                if (match) {
                                                    const data = JSON.parse(match[0]);
                                                    return data.summary || state.summary;
                                                }
                                            } catch {
                                                // ignore
                                            }
                                            return state.summary;
                                        })()}
                                    </div>
                                    {state.savedPath && (
                                        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                            完整报告已保存至：{state.savedPath}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* 错误提示 */}
                    {state.errorMessage && (
                        <Card className="border-destructive bg-destructive/5">
                            <CardContent className="pt-4">
                                <p className="text-sm text-destructive">{state.errorMessage}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* 完成提示 */}
                    {state.status === "done" && (
                        <p className="text-center text-xs text-muted-foreground py-2">
                            — 讨论已结束 —
                        </p>
                    )}
                </div>

                {/* 自动滚动锚点 */}
                <div ref={bottomRef} />
            </ScrollArea>
        </div>
    );
}
