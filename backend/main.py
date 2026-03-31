"""
AI Chat Assistant - Python FastAPI Backend
Intelligent chatbot with OpenAI integration and conversation memory
"""

import os
import json
from datetime import datetime
from typing import AsyncGenerator

import fastapi
import fastapi.middleware.cors
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

app = fastapi.FastAPI(title="AI Chat Assistant API")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory conversation storage (for demo - use database in production)
conversations: dict[str, list] = {}

# System prompt for the AI assistant
SYSTEM_PROMPT = """Eres un asistente de IA inteligente y amigable llamado "NexusAI". 
Tus características principales son:
- Responder preguntas de manera clara y concisa
- Ayudar con tareas de programación, escritura y análisis
- Mantener un tono profesional pero cercano
- Recordar el contexto de la conversación
- Proporcionar respuestas en el idioma que el usuario prefiera

Siempre busca ser útil, preciso y educativo en tus respuestas."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_index: int
    rating: int  # 1-5
    comment: str | None = None


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok", "service": "AI Chat Assistant"}


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint with streaming responses
    """
    conversation_id = request.conversation_id or f"conv_{datetime.now().timestamp()}"
    
    # Get or create conversation history
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    # Add user message to history
    conversations[conversation_id].append({
        "role": "user",
        "content": request.message
    })
    
    # Prepare messages for OpenAI
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *conversations[conversation_id][-10:]  # Keep last 10 messages for context
    ]
    
    async def generate() -> AsyncGenerator[str, None]:
        """Stream the response from OpenAI"""
        try:
            full_response = ""
            
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=2000
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'type': 'text-delta', 'delta': content})}\n\n"
            
            # Save assistant response to conversation history
            conversations[conversation_id].append({
                "role": "assistant",
                "content": full_response
            })
            
            # Send completion message
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id]
    }


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if conversation_id in conversations:
        del conversations[conversation_id]
    return {"status": "deleted"}


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit feedback for a message (for fine-tuning purposes)
    In production, this would store to a database for later fine-tuning
    """
    return {
        "status": "received",
        "message": "Feedback recorded for future model improvements"
    }


@app.get("/suggestions")
async def get_suggestions():
    """Get conversation starter suggestions"""
    return {
        "suggestions": [
            "Explícame cómo funciona la inteligencia artificial",
            "Ayúdame a escribir un correo profesional",
            "Escribe código Python para ordenar una lista",
            "Dame ideas para un proyecto de programación",
            "Resume este texto que te voy a compartir",
            "Traduce este párrafo al inglés"
        ]
    }
