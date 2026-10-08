import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('.', import.meta.url))
const staticDirectory = resolve(projectDirectory, 'dist')
const port = Number.parseInt(process.env.FLOWER_WEB_PORT ?? '5174', 10)
const host = '0.0.0.0'
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

function serveStaticFile(requestPath, response) {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0])
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const safePath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '')
  let filePath = join(staticDirectory, safePath)

  if (!filePath.startsWith(staticDirectory)) {
    writeJson(response, 403, { error: 'Forbidden' })
    return
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(staticDirectory, 'index.html')
  }

  const extension = extname(filePath).toLowerCase()
  response.writeHead(200, {
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
  })
  createReadStream(filePath).pipe(response)
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    writeJson(response, 405, { error: 'Method not allowed' })
    return
  }

  serveStaticFile(requestUrl.pathname, response)
})

server.listen(port, host, () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === 'IPv4' && !address.internal)
    .map((address) => `http://${address.address}:${port}/`)

  console.log('Flower Journey is ready')
  console.log(`This computer: http://127.0.0.1:${port}/`)
  addresses.forEach((address) => console.log(`Phone / other device: ${address}`))
  console.log('TouchDesigner reads results from Supabase; see touchdesigner/README.md')
})
