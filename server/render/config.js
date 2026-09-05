/**
 * FLOWMIND AI — Render Workflows Configuration
 * Server-only configuration management.
 * NEVER expose these variables to client bundles or with VITE_ prefixes.
 */

export const renderConfig = {
  // Render Platform API Key (Bearer token from Render Account Settings -> API Keys)
  get apiKey() {
    return (process.env.RENDER_API_KEY || '').trim();
  },

  // Render Workflow / Service Slug identifier
  get workflowSlug() {
    return (process.env.RENDER_WORKFLOW_SLUG || 'flowmind-workflows').trim();
  },

  // Render Tasks API Base URL
  // In cloud production: defaults to https://api.render.com/v1
  // In local development with `render workflows dev`: defaults to RENDER_TASKS_URL or http://localhost:8120
  get tasksUrl() {
    return (
      process.env.RENDER_TASKS_URL ||
      'https://api.render.com/v1'
    ).trim();
  },

  // Optional workspace/owner ID for object storage or scoped tasks
  get workspaceId() {
    return (process.env.RENDER_WORKSPACE_ID || '').trim();
  },

  // Environment mode
  get isLocalDev() {
    return process.env.RENDER_LOCAL_DEV === 'true';
  },
};

/**
 * Checks whether Render Workflows credentials are real and configured.
 * Does not accept placeholders.
 */
export function isRenderConfigured() {
  const key = renderConfig.apiKey;
  return Boolean(
    key &&
    key.length > 8 &&
    !key.includes('your_render_api_key') &&
    !key.includes('placeholder')
  );
}
