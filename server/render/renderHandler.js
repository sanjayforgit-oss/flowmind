/**
 * FLOWMIND AI — Render API Request Handlers & Route Bindings
 * Serves HTTP endpoints mounted in server.js, server/index.js, and vite.config.ts
 */

import {
  getRenderStatus,
  triggerRenderWorkflow,
  getExecutionDetails,
  approveWorkflowExecution,
} from './executionService.js';
import { generateRenderWorkflowCode } from './codeGenerator.js';
import { getEngineCapabilities } from './config.js';

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
      message: status.message,
      data: status,
    };
  }

  // 2. GET /api/render/tasks (Registered workflows & tasks catalog)
  if (cleanPath === '/api/render/tasks' && httpMethod === 'GET') {
    const capabilities = getEngineCapabilities();
    return {
      success: true,
      tasks: capabilities.supportedWorkflows,
      cloudConfigured: capabilities.cloudConfigured,
      localEngineAvailable: capabilities.localEngineAvailable,
    };
  }

  // 3. POST /api/render/code (Generate @renderinc/sdk/workflows TypeScript code)
  if (cleanPath === '/api/render/code' && httpMethod === 'POST') {
    const workflow = body.workflow || body;
    const code = generateRenderWorkflowCode(workflow);
    return {
      success: true,
      workflowName: workflow.name || 'Workflow',
      code,
      framework: '@renderinc/sdk/workflows',
    };
  }

  // 4. POST /api/render/execute
  if (
    (cleanPath === '/api/render/execute' || cleanPath === '/execute') &&
    httpMethod === 'POST'
  ) {
    const {
      workflowId,
      workflowName,
      context,
      workflowData,
      userId,
      approved,
      preferMode,
      pauseAtApproval,
    } = body;

    const result = await triggerRenderWorkflow({
      workflowId,
      workflowName,
      context,
      workflowData,
      userId,
      approved,
      preferMode,
      pauseAtApproval,
    });
    return result;
  }

  // 5. POST /api/render/approve (Human-in-the-Loop Resumption)
  if (cleanPath === '/api/render/approve' && httpMethod === 'POST') {
    const { executionId, approved, approverRole, approverName, comments } = body;
    if (!executionId) {
      return { success: false, error: 'Execution ID required.', code: 'INVALID_ID' };
    }
    const result = await approveWorkflowExecution(executionId, {
      approved,
      approverRole,
      approverName,
      comments,
    });
    return result;
  }

  // 6. GET /api/render/executions/:id
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
 */
export function renderExpressMiddleware(req, res, next) {
  const url = req.originalUrl || req.url || '';
  const pathname = url.split('?')[0];

  if (pathname.startsWith('/api/render') || req.baseUrl === '/api/render') {
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
 * Mounts the Render Workflow endpoints onto an Express app.
 */
export function mountRenderRoutes(routerOrApp) {
  routerOrApp.get('/api/render/status', async (_req, res) => {
    const status = getRenderStatus();
    res.json({ success: true, ...status });
  });

  routerOrApp.get('/api/render/tasks', async (_req, res) => {
    const capabilities = getEngineCapabilities();
    res.json({ success: true, tasks: capabilities.supportedWorkflows });
  });

  routerOrApp.post('/api/render/code', async (req, res) => {
    const workflow = req.body.workflow || req.body;
    const code = generateRenderWorkflowCode(workflow);
    res.json({ success: true, code, framework: '@renderinc/sdk/workflows' });
  });

  routerOrApp.post('/api/render/execute', async (req, res) => {
    try {
      const result = await triggerRenderWorkflow(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || 'Render execution failed' });
    }
  });

  routerOrApp.post('/api/render/approve', async (req, res) => {
    try {
      const { executionId, approved, approverRole, approverName, comments } = req.body || {};
      const result = await approveWorkflowExecution(executionId, { approved, approverRole, approverName, comments });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || 'Approval failed' });
    }
  });

  routerOrApp.get('/api/render/executions/:id', async (req, res) => {
    const executionId = req.params.id;
    const result = await getExecutionDetails(executionId);
    res.json(result);
  });
}
