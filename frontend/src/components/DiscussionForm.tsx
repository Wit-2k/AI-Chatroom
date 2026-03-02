"use client";

import { useState } from "react";
import { Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PersonaCard from "@/components/PersonaCard";
import type { PersonaRequest, StartDiscussionRequest } from "@/lib/types";

const DEFAULT_PERSONAS: PersonaRequest[] = [
    {
        name: "健身教练",
        role_description: "专业健身教练，主张通过运动减肥",
        persona_prompt:
            '你是一位专业的健身教练，名叫"健身教练"。你的观点是：减肥的核心在于运动和热量消耗。你相信通过规律的运动、力量训练和有氧运动可以健康有效地减肥。引用运动科学和健身知识支持你的观点，保持专业但友好的态度。',
        interaction_examples:
            "「你说的饮食控制有道理，但运动才是关键……」、「我不同意X的观点，数据显示……」",
        model_name: "",
    },
    {
        name: "营养师",
        role_description: "专业营养师，主张通过饮食控制减肥",
        persona_prompt:
            '你是一位专业的营养师，名叫"营养师"。你的观点是：减肥的核心在于饮食控制和热量摄入管理。你相信通过合理的营养搭配、控制热量摄入可以健康有效地减肥。引用营养学知识支持你的观点，保持专业但友好的态度。',
        interaction_examples:
            "「X提到运动消耗，但饮食摄入才是根本……」、「我理解X的立场，但营养学研究表明……」",
        model_name: "",
    },
];

interface DiscussionFormProps {
    onSubmit: (req: StartDiscussionRequest) => void;
    isLoading: boolean;
}

export default function DiscussionForm({
    onSubmit,
    isLoading,
}: DiscussionFormProps) {
    const [topic, setTopic] = useState("运动 vs 饮食，哪个对减肥更重要？");
    const [maxRounds, setMaxRounds] = useState(3);
    const [personas, setPersonas] = useState<PersonaRequest[]>(DEFAULT_PERSONAS);

    function handlePersonaChange(index: number, updated: PersonaRequest) {
        setPersonas((prev) => prev.map((p, i) => (i === index ? updated : p)));
    }

    function handlePersonaRemove(index: number) {
        setPersonas((prev) => prev.filter((_, i) => i !== index));
    }

    function handleAddPersona() {
        setPersonas((prev) => [
            ...prev,
            {
                name: "",
                role_description: "",
                persona_prompt: "",
                interaction_examples: "",
                model_name: "",
            },
        ]);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!topic.trim()) return;
        const validPersonas = personas.filter(
            (p) => p.name.trim() && p.persona_prompt.trim()
        );
        if (validPersonas.length < 2) return;
        onSubmit({ topic: topic.trim(), personas: validPersonas, max_rounds: maxRounds });
    }

    const isValid =
        topic.trim().length > 0 &&
        personas.filter((p) => p.name.trim() && p.persona_prompt.trim()).length >= 2;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 讨论主题 */}
            <div className="space-y-2">
                <Label htmlFor="topic" className="text-base font-semibold">
                    讨论主题
                </Label>
                <Input
                    id="topic"
                    placeholder="输入你想让 AI 辩论的话题..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-base h-11"
                    disabled={isLoading}
                />
            </div>

            {/* 轮次设置 */}
            <div className="space-y-2">
                <Label htmlFor="rounds" className="text-base font-semibold">
                    辩论轮次
                    <span className="text-muted-foreground font-normal ml-2 text-sm">
                        (1–10 轮)
                    </span>
                </Label>
                <div className="flex items-center gap-3">
                    <Input
                        id="rounds"
                        type="number"
                        min={1}
                        max={10}
                        value={maxRounds}
                        onChange={(e) =>
                            setMaxRounds(Math.min(10, Math.max(1, Number(e.target.value))))
                        }
                        className="w-24 h-9 text-center"
                        disabled={isLoading}
                    />
                    <span className="text-sm text-muted-foreground">
                        每轮每位角色发言一次
                    </span>
                </div>
            </div>

            <Separator />

            {/* 角色列表 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                        参与角色
                        <span className="text-muted-foreground font-normal ml-2 text-sm">
                            (至少 2 个)
                        </span>
                    </Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPersona}
                        disabled={isLoading || personas.length >= 6}
                        className="gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        添加角色
                    </Button>
                </div>

                <div className="space-y-3">
                    {personas.map((persona, index) => (
                        <PersonaCard
                            key={index}
                            index={index}
                            persona={persona}
                            onChange={handlePersonaChange}
                            onRemove={handlePersonaRemove}
                            canRemove={personas.length > 2}
                        />
                    ))}
                </div>
            </div>

            <Separator />

            {/* 提交按钮 */}
            <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={!isValid || isLoading}
            >
                <Play className="h-4 w-4" />
                {isLoading ? "正在启动讨论..." : "开始 AI 辩论"}
            </Button>
        </form>
    );
}
