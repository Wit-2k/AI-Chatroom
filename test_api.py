"""
FastAPI 服务器端到端测试脚本
运行前确保服务器已启动：uv run uvicorn server:app --port 8000
"""
import asyncio
import json
import sys
import httpx

# 强制 UTF-8 输出，避免 Windows GBK 编码错误
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


BASE_URL = "http://localhost:8000"


async def test_health():
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/health")
        print(f"[health] status={r.status_code} body={r.json()}")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
    print("[OK] /health pass\n")


async def test_start_and_stream():
    payload = {
        "topic": "运动 vs 饮食，哪个对减肥更重要？",
        "personas": [
            {
                "name": "健身教练",
                "role_description": "主张运动减肥",
                "persona_prompt": "你是一位专业健身教练，坚信运动是减肥核心。请用1句话表达观点。",
                "interaction_examples": "",
                "model_name": "",
            },
            {
                "name": "营养师",
                "role_description": "主张饮食控制减肥",
                "persona_prompt": "你是一位专业营养师，坚信饮食控制是减肥核心。请用1句话表达观点。",
                "interaction_examples": "",
                "model_name": "",
            },
        ],
        "max_rounds": 1,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        # 1. 启动讨论
        r = await client.post(f"{BASE_URL}/discussion/start", json=payload)
        print(f"[start] status={r.status_code}")
        assert r.status_code == 200
        data = r.json()
        session_id = data["session_id"]
        print(f"[start] session_id={session_id}")
        print(f"[start] message={data['message']}")
        print("[OK] /discussion/start pass\n")

        # 2. 消费 SSE 流
        print("[stream] 开始接收 SSE 事件...")
        event_types = []
        async with client.stream("GET", f"{BASE_URL}/discussion/stream/{session_id}") as resp:
            assert resp.status_code == 200
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    raw = line[6:]
                    event = json.loads(raw)
                    etype = event.get("type")
                    event_types.append(etype)

                    if etype == "round_start":
                        print(f"  [round_start] round {event['round']}/{event['total_rounds']}")
                    elif etype == "chunk":
                        print(f"  [chunk] [{event['speaker']}]: {event['content']}", end="", flush=True)
                    elif etype == "message_done":
                        print(f"\n  [message_done] [{event['speaker']}]")
                    elif etype == "summary":
                        saved = event.get("saved_path") or "(not saved)"
                        print(f"  [summary] saved_path={saved}")
                    elif etype == "done":
                        print("  [done]")
                        break
                    elif etype == "error":
                        print(f"  [error] {event['message']}")
                        break

        print(f"\n[stream] 收到事件类型: {event_types}")
        assert "round_start" in event_types
        assert "chunk" in event_types
        assert "message_done" in event_types
        assert "done" in event_types
        print("[OK] /discussion/stream SSE pass\n")


async def test_stop_nonexistent():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BASE_URL}/discussion/stop",
            json={"session_id": "nonexistent-id"},
        )
        print(f"[stop-404] status={r.status_code} body={r.json()}")
        assert r.status_code == 404
    print("[OK] /discussion/stop 404 pass\n")


async def main():
    print("=" * 50)
    print("FastAPI AI Chatroom E2E Test")
    print("=" * 50 + "\n")

    await test_health()
    await test_stop_nonexistent()
    await test_start_and_stream()

    print("=" * 50)
    print("All tests passed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
