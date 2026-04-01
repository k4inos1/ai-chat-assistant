# AI Chat Assistant

Asistente de chat con múltiples agentes, streaming en tiempo real y una arquitectura full‑stack moderna. El frontend está construido con Next.js + React + TypeScript y el backend con FastAPI.

## Características

- **Chat en tiempo real (SSE)** con respuestas en streaming.
- **Múltiples agentes** con personalidades configurables.
- **Soporte Markdown** y UI moderna.
- **Modo demo gratuito** cuando no existe `OPENAI_API_KEY`.
- **Separación clara** entre frontend y backend.

## Arquitectura

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS.
- **Backend**: FastAPI (Python 3.12+), OpenAI SDK, Pydantic.
- **Infra**: `vercel.json` listo para despliegue en Vercel.

## Requisitos

- **Node.js** 20+
- **Python** 3.12+

## Configuración local

### 1) Backend (FastAPI)

```bash
cd backend
pip install -e .
fastapi run main.py
```

Endpoints principales:

- `GET /health`
- `GET /agents`
- `POST /chat` (streaming)

### 2) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción | Requerida |
| --- | --- | --- |
| `OPENAI_API_KEY` | API key para OpenAI (backend). | No (activa modo demo si falta) |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL del backend para el frontend. | No (default: `http://localhost:8000`) |

Ejemplo:

```bash
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
export OPENAI_API_KEY="sk-..."
```

## Scripts útiles

### Frontend

```bash
npm run dev
npm run build
npm start
```

### Backend

```bash
pytest backend/
flake8 backend --count --select=E9,F63,F7,F82 --show-source --statistics
flake8 backend --count --exit-zero --max-complexity=10 --max-line-length=127
```

## Estructura del repositorio

```
.
├── backend/    # API FastAPI
├── frontend/   # App Next.js
├── public/     # Assets estáticos
├── styles/     # CSS global
└── vercel.json # Configuración de despliegue
```

## Contribución

Si deseas proponer mejoras, abre un issue o un pull request con una descripción clara del cambio y pasos de verificación.

## Créditos

Proyecto iniciado con [v0](https://v0.app) y evolucionado en este repositorio.
