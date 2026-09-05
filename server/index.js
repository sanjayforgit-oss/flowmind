/**
 * FLOWMIND AI — Server Entry Point & Route Exports
 * Provides unified exports for Node.js, Express, and Vite servers.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleGeminiCopilotRequest } from './geminiHandler.js';
import {
  handleRenderApiRequest,
  renderExpressMiddleware,
  mountRenderRoutes,
} from './render/renderHandler.js';
import {
  getRenderStatus,
  triggerRenderWorkflow,
  getExecutionDetails,
} from './render/executionService.js';
import { renderConfig, isRenderConfigured } from './render/config.js';

export {
  handleGeminiCopilotRequest,
  handleRenderApiRequest,
  renderExpressMiddleware,
  mountRenderRoutes,
  getRenderStatus,
  triggerRenderWorkflow,
  getExecutionDetails,
  renderConfig,
  isRenderConfigured,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Creates and starts the HTTP server with all API routes mounted.
 * @param {number} [port=process.env.PORT || 3000]
 */
export function createServer(port = process.env.PORT || 3000) {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 1. Render Workflows Endpoints (/api/render/*)
    if (pathname.startsWith('/api/render')) {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const body = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleRenderApiRequest(pathname, req.method, body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Render server error' }));
        }
      });
      return;
    }

    // 2. Gemini Copilot Endpoint (/api/copilot)
    if (pathname === '/api/copilot' && req.method === 'POST') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const body = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleGeminiCopilotRequest(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, fallbackRequired: true, error: 'Internal server error' }));
        }
      });
      return;
    }

    // 3. Static Asset Serving & SPA Fallback
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Error loading asset.');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      });
    });
  });

  server.listen(port, () => {
    console.log(`[FLOWMIND AI SERVER] Running on port ${port}`);
  });

  return server;
}

// If executed directly (e.g. `node server/index.js`), start server
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer();
}
