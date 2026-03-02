import asyncio
import json
import uuid
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from api_models import (
    StartDiscussionRequest,
    StartDiscussionResponse,
    StopDiscussionRequest,
    StopDiscussionResponse,
)
from config import LLMConfig, PersonaConfig
from engine import DiscussionEngine

app = FastAPI(
    title="AI Chatroom API",
    description="多智能体 AI 辩论系统 REST API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 会话存储：session_id -> {"engine": DiscussionEngine, "stop_event": asyncio.Event}
_sessions: Dict[str, dict] = {}


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "active_sessions": len(_sessions)}


@app.post("/discussion/start", response_model=StartDiscussionResponse)
async def start_discussion(request: StartDiscussionRequest):
    """
    启动一次新的 AI 讨论，返回 session_id。
    后续通过 GET /discussion/stream/{session_id} 获取 SSE 流。
    """
    session_id = str(uuid.uuid4())

    personas = [
        PersonaConfig(
            name=p.name,
            role_description=p.role_description,
            persona_prompt=p.persona_prompt,
            interaction_examples=p.interaction_examples,
            model_name=p.model_name,
        )
        for p in request.personas
    ]

    llm_config = LLMConfig.from_env()
    engine = DiscussionEngine(
        topic=request.topic,
        personas=personas,
        max_rounds=request.max_rounds,
        llm_config=llm_config,
        api_mode=True,  # 禁用 rich Console 输出
    )

    stop_event = asyncio.Event()
    _sessions[session_id] = {
        "engine": engine,
        "stop_event": stop_event,
    }

    return StartDiscussionResponse(
        session_id=session_id,
        message=f"讨论已创建，主题：{request.topic}，共 {request.max_rounds} 轮",
    )


@app.get("/discussion/stream/{session_id}")
async def stream_discussion(session_id: str):
    """
    以 SSE（Server-Sent Events）格式流式输出讨论内容。

    事件类型：
    - `chunk`：角色发言的流式片段，含 speaker 和 content
    - `message_done`：某角色本轮发言完毕
    - `summary`：讨论总结完成，含完整 content
    - `done`：全部讨论结束
    - `error`：发生错误，含 message
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' 不存在或已过期")

    session = _sessions[session_id]
    engine: DiscussionEngine = session["engine"]
    stop_event: asyncio.Event = session["stop_event"]

    async def event_generator():
        try:
            async for event in engine.run_discussion_api(stop_event):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except asyncio.CancelledError:
            yield f"data: {json.dumps({'type': 'error', 'message': '连接已断开'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            # 流结束后清理会话
            _sessions.pop(session_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/discussion/stop", response_model=StopDiscussionResponse)
async def stop_discussion(request: StopDiscussionRequest):
    """
    停止指定会话的讨论（设置 stop_event，engine 将在下一轮检测后退出）。
    """
    session_id = request.session_id
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' 不存在或已过期")

    _sessions[session_id]["stop_event"].set()
    return StopDiscussionResponse(message=f"已发送停止信号至会话 '{session_id}'")
