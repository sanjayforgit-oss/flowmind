/**
 * FLOWMIND AI — Standalone Render Workflows Worker Process
 *
 * This entry point is executed by the Render Workflows compute runtime.
 * It imports all task definitions (which registers them with TaskRegistry)
 * and invokes startTaskServer() to listen for orchestrator execution calls.
 *
 * Deployable as a Render Background Worker / Workflow Service via render.yaml.
 */

import { startTaskServer } from '@renderinc/sdk/workflows';

// Import all workflow task definitions to register them synchronously
import './definitions/customerComplaintWorkflow.js';
import './definitions/invoiceApprovalWorkflow.js';
import './definitions/employeeOnboardingWorkflow.js';
import './definitions/dynamicWorkflow.js';

console.log('[RENDER WORKER] FlowMind AI Workflow Tasks registered:');
console.log(' - customer_complaint_workflow');
console.log(' - invoice_approval_workflow');
console.log(' - employee_onboarding_workflow');
console.log(' - dynamic_workflow_orchestrator');

async function main() {
  try {
    console.log('[RENDER WORKER] Starting Render Workflows Task Server...');
    await startTaskServer();
    console.log('[RENDER WORKER] Task Server started successfully.');
  } catch (err) {
    if (err.message?.includes('RENDER_SDK_SOCKET_PATH')) {
      console.log('[RENDER WORKER] Notice: RENDER_SDK_SOCKET_PATH is not set.');
      console.log('[RENDER WORKER] (This is expected during local development without Render CLI socket proxy).');
      console.log('[RENDER WORKER] In cloud production on Render, Render automatically provisions this socket.');
    } else {
      console.error('[RENDER WORKER] Worker failed to initialize:', err);
      process.exit(1);
    }
  }
}

main();
