"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageStream from "@/components/MessageStream";
import { streamDiscussion, stopDiscussion } from "@/lib/api";
import type {
    DiscussionState,
    SSEEvent,
    RoundGroup,
    SpeakerMessage,
} from "@/lib/types";

const INITIAL_STATE: DiscussionState = {
    status: "connecting",
    rounds: [],
    summary: null,
    savedPath: null,
    errorMessage: null,
};

export default function DiscussionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [state, setState] = useState<DiscussionState>(INITIAL_STATE);
    // 从 sessionStorage 读取 topic（由主页写入）
    const [topic, setTopic] = useState("");
    const abortRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const savedTopic = sessionStorage.getItem("discussion_topic") ?? "";
        setTopic(savedTopic);
    }, []);

    const handleEvent = useCallback((event: SSEEvent) => {
        setState((prev) => {
            switch (event.type) {
                case "round_start": {
                    const newRound: RoundGroup = {
                        round: event.round,
                        total_rounds: event.total_rounds,
                        messages: [],
                    };
                    return {
                        ...prev,
                        status: "streaming",
                        rounds: [...prev.rounds, newRound],
                    };
                }

                case "chunk": {
                    const rounds = [...prev.rounds];
                    if (rounds.length === 0) return prev;
                    const lastRound = { ...rounds[rounds.length - 1] };
                    const messages = [...lastRound.messages];

                    // 找到当前 speaker 的最后一条未完成消息
                    const lastMsgIdx = messages.findLastIndex(
                        (m) => m.speaker === event.speaker && !m.isDone
                    );

                    if (lastMsgIdx >= 0) {
                        messages[lastMsgIdx] = {
                            ...messages[lastMsgIdx],
                            content: messages[lastMsgIdx].content + event.content,
                        };
                    } else {
                        // 新 speaker 开始发言
                        const newMsg: SpeakerMessage = {
                            speaker: event.speaker,
                            content: event.content,
                            isDone: false,
                        };
                        messages.push(newMsg);
                    }

                    lastRound.messages = messages;
                    rounds[rounds.length - 1] = lastRound;
                    return { ...prev, rounds };
                }

                case "message_done": {
                    const rounds = [...prev.rounds];
                    if (rounds.length === 0) return prev;
                    const lastRound = { ...rounds[rounds.length - 1] };
                    const messages = [...lastRound.messages];

                    const lastMsgIdx = messages.findLastIndex(
                        (m) => m.speaker === event.speaker && !m.isDone
                    );
                    if (lastMsgIdx >= 0) {
                        messages[lastMsgIdx] = { ...messages[lastMsgIdx], isDone: true };
                    }

                    lastRound.messages = messages;
                    rounds[rounds.length - 1] = lastRound;
                    return { ...prev, rounds };
                }

                case "summary":
                    return {
                        ...prev,
                        status: "summarizing",
                        summary: event.content,
                        savedPath: event.saved_path,
                    };

                case "done":
                    return { ...prev, status: "done" };

                case "error":
                    return { ...prev, status: "error", errorMessage: event.message };

                default:
                    return prev;
            }
        });
    }, []);

    const handleDone = useCallback((error?: string) => {
        if (error) {
            setState((prev) => ({
                ...prev,
                status: "error",
                errorMessage: error,
            }));
        } else {
            setState((prev) =>
                prev.status !== "done" ? { ...prev, status: "done" } : prev
            );
        }
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        const abort = streamDiscussion(sessionId, handleEvent, handleDone);
        abortRef.current = abort;

        return () => {
            abort();
        };
    }, [sessionId, handleEvent, handleDone]);

    async function handleStop() {
        abortRef.current?.();
        await stopDiscussion(sessionId).catch(() => { });
        setState((prev) => ({ ...prev, status: "done" }));
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-3xl mx-auto h-screen flex flex-col px-4 py-6">
                {/* 顶部导航栏 */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        返回配置
                    </Button>

                    {(state.status === "streaming" || state.status === "connecting") && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={handleStop}
                        >
                            <Square className="h-3 w-3 fill-current" />
                            停止讨论
                        </Button>
                    )}
                </div>

                {/* 消息流区域（占满剩余高度） */}
                <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-4">
                    <MessageStream state={state} topic={topic} />
                </div>
            </div>
        </main>
    );
}
