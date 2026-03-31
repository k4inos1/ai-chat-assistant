"""
AI Chat Assistant - Python FastAPI Backend
Intelligent chatbot with OpenAI integration and conversation memory
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import AsyncGenerator, Iterable

import fastapi
import fastapi.middleware.cors
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

# Check if we're in demo mode (no API key)
DEMO_MODE = not os.getenv("OPENAI_API_KEY")

DEFAULT_AGENT_ID = "nexus"
AGENTS: dict[str, dict[str, str]] = {
    "nexus": {
        "name": "NexusAI",
        "description": "Asistente generalista para resolver dudas y tareas diarias.",
        "system_prompt": """Eres un asistente de IA inteligente y amigable llamado "NexusAI".
Tus características principales son:
- Responder preguntas de manera clara y concisa
- Ayudar con tareas de programación, escritura y análisis
- Mantener un tono profesional pero cercano
- Recordar el contexto de la conversación
- Proporcionar respuestas en el idioma que el usuario prefiera

Siempre busca ser útil, preciso y educativo en tus respuestas.""",
        "demo_focus": "Puedo explicar conceptos, resumir textos y ayudarte a planificar.",
    },
    "dev": {
        "name": "CodePilot",
        "description": "Mentor técnico para arquitectura, código y depuración.",
        "system_prompt": """Eres "CodePilot", un mentor senior de ingeniería.
Responde con pasos claros, ejemplos de código concisos y mejores prácticas.
Prioriza seguridad, rendimiento y mantenibilidad. Pregunta por requisitos faltantes.""",
        "demo_focus": "Puedo proponer estructuras de código, explicar errores y diseñar APIs.",
    },
    "writer": {
        "name": "TextoPro",
        "description": "Especialista en redacción, tono y contenido profesional.",
        "system_prompt": """Eres "TextoPro", un asistente experto en redacción.
Ofrece versiones alternativas, mejora claridad y adapta el tono al público objetivo.
Sé breve y preciso, evita relleno.""",
        "demo_focus": "Puedo pulir el tono, crear borradores y sugerir títulos.",
    },
    "analyst": {
        "name": "Insight",
        "description": "Analista para síntesis, planificación y descomposición de problemas.",
        "system_prompt": """Eres "Insight", un analista estratégico.
Descompón problemas complejos en pasos accionables y valida supuestos.
Entrega resúmenes y siguientes pasos.""",
        "demo_focus": "Puedo organizar ideas, resumir información y definir planes.",
    },
}

app = fastapi.FastAPI(title="AI Chat Assistant API")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client (lazy initialization)
_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    """Get or create the OpenAI client with lazy initialization."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY environment variable is not set",
            )
        _client = AsyncOpenAI(api_key=api_key)
    return _client


def get_agent(agent_id: str) -> dict[str, str]:
    """Resolve a configured agent."""
    agent = AGENTS.get(agent_id)
    if not agent:
        raise HTTPException(status_code=400, detail="Unknown agent")
    return agent


def resolve_agent(
    conversation_id: str | None,
    agent_id: str | None,
) -> tuple[str, dict[str, str]]:
    """Resolve agent selection, keeping it stable for existing conversations."""
    if conversation_id and conversation_id in conversation_agents:
        existing_agent_id = conversation_agents[conversation_id]
        return existing_agent_id, get_agent(existing_agent_id)

    selected_agent_id = agent_id or DEFAULT_AGENT_ID
    return selected_agent_id, get_agent(selected_agent_id)


def chunk_text(text: str, chunk_size: int = 48) -> Iterable[str]:
    """Split text into streaming-friendly chunks."""
    current = ""
    for word in text.split():
        if len(current) + len(word) + 1 > chunk_size and current:
            yield current.strip()
            current = ""
        current += f"{word} "
    if current.strip():
        yield current.strip()


def build_demo_response(agent_id: str, message: str) -> str:
    """Create a deterministic demo response without external APIs."""
    agent = get_agent(agent_id)
    normalized = message.lower()
    if any(token in normalized for token in ["código", "codigo", "code", "bug", "error"]):
        suggestion = "Comparte el lenguaje o el error exacto y te propongo un ejemplo concreto."
    elif any(token in normalized for token in ["correo", "email", "mensaje", "redacta"]):
        suggestion = "Indica el destinatario y objetivo para ajustar el tono."
    elif any(token in normalized for token in ["resume", "resumen", "síntesis", "analiza"]):
        suggestion = "Pega el texto completo y resumo los puntos clave."
    else:
        suggestion = "Cuéntame más detalles o el resultado que esperas lograr."

    return (
        "🧪 Modo demo gratuito (sin API key).\n\n"
        f"Agente seleccionado: {agent['name']}.\n"
        f"{agent['demo_focus']}\n\n"
        f"Tu mensaje: \"{message.strip()}\".\n\n"
        f"Sugerencia inicial: {suggestion}\n\n"
        "Para respuestas completas, configura OPENAI_API_KEY."
    )


# In-memory conversation storage (for demo - use database in production)
conversations: dict[str, list[dict[str, str]]] = {}
conversation_agents: dict[str, str] = {}


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    agent_id: str | None = None


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_index: int
    rating: int  # 1-5
    comment: str | None = None


@app.get("/health")
async def health() -> dict[str, str | bool]:
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "AI Chat Assistant",
        "demo_mode": DEMO_MODE,
    }


@app.get("/agents")
async def list_agents():
    """List available chat agents."""
    return {
        "default_agent_id": DEFAULT_AGENT_ID,
        "demo_mode": DEMO_MODE,
        "agents": [
            {
                "id": agent_id,
                "name": config["name"],
                "description": config["description"],
            }
            for agent_id, config in AGENTS.items()
        ],
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint with streaming responses
    """
    conversation_id = request.conversation_id or f"conv_{datetime.now().timestamp()}"

    agent_id, agent = resolve_agent(conversation_id, request.agent_id)

    # Get or create conversation history
    if conversation_id not in conversations:
        conversations[conversation_id] = []
        conversation_agents[conversation_id] = agent_id
    else:
        conversation_agents.setdefault(conversation_id, agent_id)

    # Add user message to history
    conversations[conversation_id].append({
        "role": "user",
        "content": request.message,
    })

    # Prepare messages for OpenAI
    messages = [
        {"role": "system", "content": agent["system_prompt"]},
        *conversations[conversation_id][-10:],  # Keep last 10 messages for context
    ]

    async def generate() -> AsyncGenerator[str, None]:
        """Stream the response from OpenAI"""
        if DEMO_MODE:
            demo_response = build_demo_response(agent_id, request.message)
            for chunk in chunk_text(demo_response):
                payload = {"type": "text-delta", "delta": f"{chunk} "}
                yield f"data: {json.dumps(payload)}\n\n"
            conversations[conversation_id].append({
                "role": "assistant",
                "content": demo_response,
            })
            done_payload = {
                "type": "done",
                "conversation_id": conversation_id,
                "agent_id": agent_id,
            }
            yield f"data: {json.dumps(done_payload)}\n\n"
            return

        try:
            full_response = ""

            client = get_openai_client()
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
                    payload = {"type": "text-delta", "delta": content}
                    yield f"data: {json.dumps(payload)}\n\n"

            # Save assistant response to conversation history
            conversations[conversation_id].append({
                "role": "assistant",
                "content": full_response,
            })

            # Send completion message
            done_payload = {
                "type": "done",
                "conversation_id": conversation_id,
                "agent_id": agent_id,
            }
            yield f"data: {json.dumps(done_payload)}\n\n"

        except Exception as e:
            error_payload = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_payload)}\n\n"

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
        "agent_id": conversation_agents.get(conversation_id, DEFAULT_AGENT_ID),
        "messages": conversations[conversation_id],
    }


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if conversation_id in conversations:
        del conversations[conversation_id]
    if conversation_id in conversation_agents:
        del conversation_agents[conversation_id]
    return {"status": "deleted"}


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit feedback for a message (for fine-tuning purposes)
    In production, this would store to a database for later fine-tuning
    """
    return {
        "status": "received",
        "message": "Feedback recorded for future model improvements",
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
            "Traduce este párrafo al inglés",
        ],
    }
