"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DiscussionForm from "@/components/DiscussionForm";
import { startDiscussion } from "@/lib/api";
import type { StartDiscussionRequest } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(req: StartDiscussionRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await startDiscussion(req);
      // 将 topic 存入 sessionStorage，供讨论页显示
      sessionStorage.setItem("discussion_topic", req.topic);
      router.push(`/discussion/${res.session_id}`);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 标题区 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">AI 讨论室</h1>
          </div>
          <p className="text-muted-foreground">
            配置多个 AI 角色，围绕你的话题展开多轮辩论
          </p>
        </div>

        {/* 配置表单卡片 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">新建讨论</CardTitle>
            <CardDescription>
              设置讨论主题、参与角色和辩论轮次，点击开始后实时观看 AI 辩论
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <DiscussionForm onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          后端服务需运行在{" "}
          <code className="font-mono bg-muted px-1 py-0.5 rounded">
            localhost:8000
          </code>
        </p>
      </div>
    </main>
  );
}
