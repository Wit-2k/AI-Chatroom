"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonaRequest } from "@/lib/types";

interface PersonaCardProps {
    index: number;
    persona: PersonaRequest;
    onChange: (index: number, updated: PersonaRequest) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

const PERSONA_COLORS = [
    "border-blue-400",
    "border-green-400",
    "border-orange-400",
    "border-purple-400",
    "border-pink-400",
    "border-teal-400",
];

export default function PersonaCard({
    index,
    persona,
    onChange,
    onRemove,
    canRemove,
}: PersonaCardProps) {
    const colorClass = PERSONA_COLORS[index % PERSONA_COLORS.length];

    function update(field: keyof PersonaRequest, value: string) {
        onChange(index, { ...persona, [field]: value });
    }

    return (
        <Card className={`border-l-4 ${colorClass}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                    角色 {index + 1}
                </CardTitle>
                {canRemove && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(index)}
                        type="button"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor={`name-${index}`} className="text-xs">
                            角色名称 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id={`name-${index}`}
                            placeholder="例：健身教练"
                            value={persona.name}
                            onChange={(e) => update("name", e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`role-${index}`} className="text-xs">
                            角色描述
                        </Label>
                        <Input
                            id={`role-${index}`}
                            placeholder="例：主张运动减肥"
                            value={persona.role_description}
                            onChange={(e) => update("role_description", e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`prompt-${index}`} className="text-xs">
                        人设提示词 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id={`prompt-${index}`}
                        placeholder="描述该角色的身份、立场和说话风格..."
                        value={persona.persona_prompt}
                        onChange={(e) => update("persona_prompt", e.target.value)}
                        className="text-sm min-h-[72px] resize-none"
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`examples-${index}`} className="text-xs">
                        互动句式示例
                        <span className="text-muted-foreground ml-1">(可选)</span>
                    </Label>
                    <Input
                        id={`examples-${index}`}
                        placeholder='例：「你说的X有道理，但我认为……」'
                        value={persona.interaction_examples}
                        onChange={(e) => update("interaction_examples", e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`model-${index}`} className="text-xs">
                        指定模型
                        <span className="text-muted-foreground ml-1">(留空使用全局配置)</span>
                    </Label>
                    <Input
                        id={`model-${index}`}
                        placeholder="例：gpt-4o / deepseek-chat"
                        value={persona.model_name}
                        onChange={(e) => update("model_name", e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
