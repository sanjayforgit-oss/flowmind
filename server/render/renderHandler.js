/**
 * FLOWMIND AI — Render API Request Handlers & Express Route Bindings
 * Serves HTTP endpoints mounted in server.js, server/index.js, and vite.config.ts
 */

import {
  getRenderStatus,
  triggerRenderWorkflow,
  getExecutionDetails,
} from './executionService.js';

/**
 * Universal request handler for Render Workflows endpoints.
 * Compatible with Node http, Express, and Vite middleware.
 *
 * @param {string} rawPathname - The requested path (e.g. '/api/render/execute')
 * @param {string} method - HTTP method ('GET', 'POST', etc.)
 * @param {Object} [body={}] - Parsed JSON request body
 */
export async function handleRenderApiRequest(rawPathname, method, body = {}) {
  // Normalize path by stripping query parameters and trailing slashes
  const cleanPath = (rawPathname || '').split('?')[0].replace(/\/+$/, '') || '/';
  const httpMethod = (method || 'GET').toUpperCase();

  // 1. GET /api/render/status or /api/render
  if (
    (cleanPath === '/api/render/status' || cleanPath === '/api/render') &&
    (httpMethod === 'GET' || httpMethod === 'POST')
  ) {
    const status = getRenderStatus();
    return {
      success: true,
      configured: status.configured,
      message: status.configured
        ? 'Render Workflows execution engine configured.'
        : 'Render execution is not configured.',
      data: status,
    };
  }

  // 2. POST /api/render/execute (or /execute if mounted on an Express sub-router)
  if (
    (cleanPath === '/api/render/execute' || cleanPath === '/execute') &&
    httpMethod === 'POST'
  ) {
    const { workflowId, workflowName, context, userId, approved } = body;
    const result = await triggerRenderWorkflow({
      workflowId,
      workflowName,
      context,
      userId,
      approved,
    });
    return result;
  }

  // 3. GET /api/render/executions/:id
  if (
    cleanPath.startsWith('/api/render/executions/') ||
    cleanPath.startsWith('/executions/')
  ) {
    const prefix = cleanPath.startsWith('/api/render/executions/')
      ? '/api/render/executions/'
      : '/executions/';
    const executionId = cleanPath.replace(prefix, '').trim();

    if (!executionId) {
      return { success: false, error: 'Execution ID required.', code: 'INVALID_ID' };
    }
    const result = await getExecutionDetails(executionId);
    return result;
  }

  return { success: false, error: `Endpoint not found: ${rawPathname}`, code: 'ENDPOINT_NOT_FOUND' };
}

/**
 * Express-compatible middleware for Render Workflows routes.
 * Can be mounted directly:
 *   app.use(renderExpressMiddleware);
 * or on a path prefix:
 *   app.use('/api/render', renderExpressMiddleware);
 */
export function renderExpressMiddleware(req, res, next) {
  const url = req.originalUrl || req.url || '';
  const pathname = url.split('?')[0];

  // Intercept if path belongs to Render API
  if (pathname.startsWith('/api/render') || req.baseUrl === '/api/render') {
    // Collect body if not already parsed by express.json()
    if (req.body && typeof req.body === 'object') {
      processRequest(req.body);
    } else if (typeof req.on === 'function') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = bodyData ? JSON.parse(bodyData) : {};
          processRequest(parsed);
        } catch {
          processRequest({});
        }
      });
    } else {
      processRequest({});
    }

    function processRequest(body) {
      handleRenderApiRequest(pathname, req.method, body)
        .then((result) => {
          if (!res.headersSent) {
            res.statusCode = 200;
            if (typeof res.json === 'function') {
              res.json(result);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            }
          }
        })
        .catch((err) => {
          if (!res.headersSent) {
            res.statusCode = 500;
            if (typeof res.json === 'function') {
              res.json({ success: false, error: err?.message || 'Render server error' });
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Render server error' }));
            }
          }
        });
    }
    return;
  }

  if (typeof next === 'function') {
    next();
  }
}

/**
 * Mounts the Render Workflow endpoints onto an existing Express application or Router.
 * Usage:
 *   import express from 'express';
 *   import { mountRenderRoutes } from './server/render/renderHandler.js';
 *   mountRenderRoutes(app);
 *
 * @param {Object} routerOrApp - Express Application or Router instance
 */
export function mountRenderRoutes(routerOrApp) {
  // Status check endpoint
  routerOrApp.get('/api/render/status', async (req, res) => {
    const status = getRenderStatus();
    res.json({
      success: true,
      configured: status.configured,
      message: status.configured
        ? 'Render Workflows execution engine configured.'
        : 'Render execution is not configured.',
      data: status,
    });
  });

  // Workflow trigger execution endpoint
  routerOrApp.post('/api/render/execute', async (req, res) => {
    try {
      const result = await triggerRenderWorkflow(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || 'Render execution failed' });
    }
  });

  // Execution details / polling endpoint
  routerOrApp.get('/api/render/executions/:id', async (req, res) => {
    const executionId = req.params.id;
    const result = await getExecutionDetails(executionId);
    res.json(result);
  });
}
