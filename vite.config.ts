import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore
import { handleGeminiCopilotRequest } from './server/geminiHandler.js'
// @ts-ignore
import { handleRenderApiRequest } from './server/render/renderHandler.js'

function backendApiPlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    const url = req.url ? req.url.split('?')[0] : ''

    // Handle Render Workflows API Endpoints
    if (url.startsWith('/api/render')) {
      let bodyData = ''
      req.on('data', (chunk: any) => {
        bodyData += chunk
      })
      req.on('end', async () => {
        try {
          const parsedBody = bodyData ? JSON.parse(bodyData) : {}
          const result = await handleRenderApiRequest(url, req.method || 'GET', parsedBody)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: err?.message || 'Render server error' }))
        }
      })
      return
    }

    if (url === '/api/copilot' && req.method === 'POST') {
      let bodyData = ''
      req.on('data', (chunk: any) => {
        bodyData += chunk
      })
      req.on('end', async () => {
        try {
          const parsedBody = bodyData ? JSON.parse(bodyData) : {}
          const result = await handleGeminiCopilotRequest(parsedBody)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, fallbackRequired: true, error: err?.message || 'Server error' }))
        }
      })
      return
    }
    next()
  }

  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    backendApiPlugin(),
  ],
})
