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
  // In local development: defaults to RENDER_TASKS_URL or https://api.render.com/v1
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

  // True if explicitly in local dev mode or if no cloud key has been configured yet
  get isLocalDev() {
    return process.env.RENDER_LOCAL_DEV === 'true' || !this.isCloudConfigured;
  },

  // Checks whether a real cloud Render API key is present
  get isCloudConfigured() {
    const key = (process.env.RENDER_API_KEY || '').trim();
    return Boolean(
      key &&
      key.length > 8 &&
      !key.includes('your_render_api_key') &&
      !key.includes('placeholder')
    );
  },
};

/**
 * Checks whether Render Workflows is available to run.
 * Always true because FLOWMIND AI includes both Cloud Render API and the Local Render SDK Task Engine.
 */
export function isRenderConfigured() {
  return renderConfig.isCloudConfigured;
}

/**
 * Returns available engine capabilities
 */
export function getEngineCapabilities() {
  return {
    cloudConfigured: renderConfig.isCloudConfigured,
    localEngineAvailable: true,
    supportedWorkflows: [
      { id: 'customer_complaint_workflow', name: 'Customer Complaint & SLA Escalation' },
      { id: 'invoice_approval_workflow', name: 'Invoice Anomaly & CFO Payment Authorization' },
      { id: 'employee_onboarding_workflow', name: 'Employee Onboarding & Security Provisioning' },
      { id: 'dynamic_workflow_orchestrator', name: 'Dynamic FlowMind Graph Orchestrator' },
    ],
  };
}
