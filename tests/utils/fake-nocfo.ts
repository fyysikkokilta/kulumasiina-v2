import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

type LoggedRequest = {
  method: string
  path: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}

type StoredDocument = { id: number; description: string }

const ACCOUNTS: Record<string, number> = { '4205': 11, '4300': 12, '1910': 99 }
const PREFIX = '/v1/business/'

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

function parseBody(contentType: string | undefined, raw: Buffer): unknown {
  if (raw.length === 0) return null
  if (contentType?.includes('application/json')) return JSON.parse(raw.toString('utf8'))
  return '<multipart>'
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const list = <T>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

export async function startFakeNocfo(port: number): Promise<{ close(): Promise<void> }> {
  let documents: StoredDocument[] = []
  let requestLog: LoggedRequest[] = []
  let nextId = 1000
  let failNextDocument = false

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`)
      const method = req.method ?? 'GET'
      const path = url.pathname

      if (path.startsWith('/__')) {
        if (method === 'POST' && path === '/__reset') {
          documents = []
          requestLog = []
          failNextDocument = false
        } else if (method === 'POST' && path === '/__clear-requests') {
          requestLog = []
        } else if (method === 'POST' && path === '/__fail-next-document') {
          failNextDocument = true
        } else if (method === 'GET' && path === '/__requests') {
          return send(res, 200, requestLog)
        } else {
          return send(res, 404, { detail: 'Not found' })
        }
        return send(res, 200, { ok: true })
      }

      const raw = await readBody(req)
      requestLog.push({
        method,
        path,
        headers: req.headers,
        body: parseBody(req.headers['content-type'], raw)
      })

      if (!path.startsWith(PREFIX)) return send(res, 404, { detail: 'Not found' })
      const resource = path.split('/').slice(4).join('/')

      if (method === 'GET' && resource === 'account/') {
        const id = ACCOUNTS[url.searchParams.get('number') ?? '']
        return send(res, 200, list(id === undefined ? [] : [{ id }]))
      }
      if (method === 'GET' && resource === 'document/') {
        const term = url.searchParams.get('search') ?? ''
        return send(res, 200, list(documents.filter((d) => d.description.includes(term))))
      }
      if (method === 'POST' && resource === 'file_upload/') {
        return send(res, 201, { id: nextId++ })
      }
      if (method === 'POST' && resource === 'document/') {
        if (failNextDocument) {
          failNextDocument = false
          return send(res, 500, { detail: 'Injected failure' })
        }
        const body = JSON.parse(raw.toString('utf8')) as { description?: string }
        const doc = { id: nextId++, description: body.description ?? '' }
        documents = [...documents, doc]
        return send(res, 201, doc)
      }
      return send(res, 404, { detail: 'Not found' })
    } catch (error) {
      send(res, 500, { detail: String(error) })
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, resolve)
  })

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
        server.closeAllConnections()
      })
  }
}
