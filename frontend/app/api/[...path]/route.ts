const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'http://127.0.0.1:8000'

const isBodylessMethod = (method: string) => method === 'GET' || method === 'HEAD'

const buildBackendUrl = (request: Request) => {
  const incomingUrl = new URL(request.url)
  const backendUrl = new URL(BACKEND_URL)
  const normalizedPath =
    incomingUrl.pathname.replace(/^\/api(\/|$)/, '/') || '/'

  backendUrl.pathname = normalizedPath
  backendUrl.search = incomingUrl.search

  return backendUrl.toString()
}

const proxyRequest = async (request: Request) => {
  const targetUrl = buildBackendUrl(request)
  const headers = new Headers(request.headers)
  headers.delete('host')

  const body = isBodylessMethod(request.method)
    ? undefined
    : await request.arrayBuffer()

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: 'manual',
    })

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Backend unavailable'
    return Response.json({ error: message }, { status: 502 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}

export async function POST(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}

export async function PUT(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}

export async function PATCH(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}

export async function DELETE(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}

export async function OPTIONS(
  request: Request,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request)
}
