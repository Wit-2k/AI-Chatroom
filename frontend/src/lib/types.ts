// ─── API 请求/响应类型 ───────────────────────────────────────────────────────

export interface PersonaRequest {
    name: string;
    role_description: string;
    persona_prompt: string;
    interaction_examples: string;
    model_name: string;
}

export interface StartDiscussionRequest {
    topic: string;
    personas: PersonaRequest[];
    max_rounds: number;
}

export interface StartDiscussionResponse {
    session_id: string;
    message: string;
}

// ─── SSE 事件类型 ────────────────────────────────────────────────────────────

export interface RoundStartEvent {
    type: "round_start";
    round: number;
    total_rounds: number;
}

export interface ChunkEvent {
    type: "chunk";
    speaker: string;
    content: string;
}

export interface MessageDoneEvent {
    type: "message_done";
    speaker: string;
    full_content: string;
}

export interface SummaryStartEvent {
    type: "summary_start";
}

export interface SummaryEvent {
    type: "summary";
    content: string;
}

export interface DoneEvent {
    type: "done";
}

export interface ErrorEvent {
    type: "error";
    message: string;
}

export type SSEEvent =
    | RoundStartEvent
    | ChunkEvent
    | MessageDoneEvent
    | SummaryStartEvent
    | SummaryEvent
    | DoneEvent
    | ErrorEvent;

// ─── 前端状态类型 ─────────────────────────────────────────────────────────────

export interface SpeakerMessage {
    speaker: string;
    content: string;       // 累积内容（逐 chunk 追加）
    isDone: boolean;
}

export interface RoundGroup {
    round: number;
    total_rounds: number;
    messages: SpeakerMessage[];
}

export type DiscussionStatus =
    | "idle"
    | "connecting"
    | "streaming"
    | "summarizing"
    | "done"
    | "error";

export interface DiscussionState {
    status: DiscussionStatus;
    rounds: RoundGroup[];
    summary: string | null;
    errorMessage: string | null;
}
