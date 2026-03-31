# ai-chat-assistant

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_swN1cqOk6eIPbK0uYlSrAp1795L0)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Backend (FastAPI)

Start the API server from the `backend` folder:

```bash
cd backend
pip install -e .
fastapi run main.py
```

The API exposes `/chat` (streaming), `/agents` (lista de agentes) and `/health`.

### Modo demo gratuito

Si `OPENAI_API_KEY` no está configurada, el backend entra en modo demo y responde con un flujo local para poder conversar sin costo.

Para desarrollo local con frontend separado, puedes definir:

```bash
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/k4inos1/ai-chat-assistant" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
