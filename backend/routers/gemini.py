from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os

router = APIRouter()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

class GeminiRequest(BaseModel):
    messages: list
    system_prompt: str = ""

@router.post("/chat")
async def gemini_chat(payload: GeminiRequest):
    if not GEMINI_KEY:
        raise HTTPException(500, "Gemini API key not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}",
            json={
                "contents": payload.messages,
                "systemInstruction": {"parts": [{"text": payload.system_prompt}]} if payload.system_prompt else None,
                "generationConfig": {"temperature": 0.8, "maxOutputTokens": 2048},
            }
        )
    if not res.is_success:
        raise HTTPException(500, f"Gemini error: {res.text}")
    data = res.json()
    text = data.get("candidates",[{}])[0].get("content",{}).get("parts",[{}])[0].get("text","")
    return {"text": text}