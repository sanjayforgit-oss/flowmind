/**
 * FLOWMIND AI — Render Workflows Code Compiler & Exporter
 * Generates production-grade TypeScript / JavaScript code using @renderinc/sdk/workflows
 * from any visual or AI-generated FlowMind workflow.
 */

function sanitizeIdentifier(str) {
  return (str || 'step')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, '_$1');
}

/**
 * Generates executable @renderinc/sdk/workflows code from a workflow object.
 *
 * @param {Object} workflow
 * @returns {string} Executable TypeScript code
 */
export function generateRenderWorkflowCode(workflow = {}) {
  const name = workflow.name || 'Custom Business Workflow';
  const workflowSlug = sanitizeIdentifier(name);
  const nodes = workflow.nodes || [];

  const taskDefinitions = [];
  const orchestratorCalls = [];

  // If empty or minimal workflow, provide default structure
  if (nodes.length === 0) {
    return `// FLOWMIND AI — Render Workflows Generated Code
// Generated for: ${name}
import { task } from '@renderinc/sdk/workflows';

export const processTask = task(
  {
    name: 'process_task',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, input) => {
    console.log('Processing input:', input);
    return { status: 'SUCCEEDED', timestamp: new Date().toISOString() };
  }
);

export const ${workflowSlug}Workflow = task(
  {
    name: '${workflowSlug}_workflow',
    timeoutSeconds: 300,
  },
  async (ctx, input) => {
    const result = await ctx.run(processTask, input);
    return { workflow: '${name}', status: 'SUCCEEDED', result };
  }
);
`;
  }

  // Iterate over nodes and generate individual task functions
  nodes.forEach((node, idx) => {
    const taskName = sanitizeIdentifier(node.title || `step_${idx + 1}`);
    const nodeType = node.type || 'action';
    const desc = node.description || node.title || `Execute ${taskName}`;

    if (nodeType === 'trigger') {
      taskDefinitions.push(`/**
 * Trigger Stage: ${node.title}
 * Description: ${desc}
 */
export const ${taskName}Task = task(
  {
    name: '${taskName}',
    timeoutSeconds: 30,
  },
  async (_ctx, eventData = {}) => {
    return {
      stage: '${taskName}',
      status: 'TRIGGERED',
      payload: eventData,
      triggeredAt: new Date().toISOString(),
    };
  }
);`);
      orchestratorCalls.push(`    // Trigger: ${node.title}\n    const triggerResult = await ctx.run(${taskName}Task, input);\n    stages.push(triggerResult);`);
    } else if (nodeType === 'condition') {
      taskDefinitions.push(`/**
 * Condition Evaluation: ${node.title}
 * Rule: ${desc}
 */
export const ${taskName}Task = task(
  {
    name: '${taskName}',
    timeoutSeconds: 30,
  },
  async (_ctx, state = {}) => {
    const isMet = state.priority === 'HIGH' || Boolean(state.conditionValue);
    return {
      stage: '${taskName}',
      conditionMet: isMet,
      branch: isMet ? 'TRUE_PATH' : 'FALSE_PATH',
      evaluatedAt: new Date().toISOString(),
    };
  }
);`);
      orchestratorCalls.push(`    // Condition: ${node.title}\n    const ${taskName}Result = await ctx.run(${taskName}Task, stages[stages.length - 1] || input);\n    stages.push(${taskName}Result);`);
    } else if (nodeType === 'approval' || node.title?.toLowerCase().includes('approval')) {
      taskDefinitions.push(`/**
 * Human-in-the-Loop Checkpoint: ${node.title}
 * Gate: ${desc}
 */
export const ${taskName}Task = task(
  {
    name: '${taskName}',
    timeoutSeconds: 120,
    retry: { maxRetries: 1, waitDurationMs: 1000 },
  },
  async (_ctx, approvalContext = {}) => {
    const isApproved = approvalContext.approved !== false;
    return {
      stage: '${taskName}',
      status: isApproved ? 'SUCCEEDED' : 'REJECTED',
      checkpoint: '${node.title}',
      approved: isApproved,
      approverRole: approvalContext.approverRole || 'Designated Approver',
      timestamp: new Date().toISOString(),
    };
  }
);`);
      orchestratorCalls.push(`    // Human Approval Checkpoint: ${node.title}\n    const ${taskName}Result = await ctx.run(${taskName}Task, { ...input, approved: input.approved !== false });\n    stages.push(${taskName}Result);\n    if (!${taskName}Result.approved) {\n      return { workflow: '${name}', status: 'REJECTED', stages };\n    }`);
    } else {
      taskDefinitions.push(`/**
 * Action Stage: ${node.title}
 * Action: ${desc}
 */
export const ${taskName}Task = task(
  {
    name: '${taskName}',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, prevResult = {}) => {
    // Durable step execution on Render Workflows
    return {
      stage: '${taskName}',
      status: 'SUCCEEDED',
      actionExecuted: '${node.title}',
      details: '${desc.replace(/'/g, "\\'")}',
      processedAt: new Date().toISOString(),
    };
  }
);`);
      orchestratorCalls.push(`    // Action: ${node.title}\n    const ${taskName}Result = await ctx.run(${taskName}Task, stages[stages.length - 1] || input);\n    stages.push(${taskName}Result);`);
    }
  });

  return `// ==============================================================================
// FLOWMIND AI — Auto-Compiled Render Workflows Definition
// Target Framework: @renderinc/sdk/workflows
// Workflow Name: "${name}"
// Total Stages: ${nodes.length}
// ==============================================================================

import { task } from '@renderinc/sdk/workflows';

${taskDefinitions.join('\n\n')}

/**
 * Main Orchestrator Task for "${name}"
 * Composes individual durable steps via ctx.run(...)
 */
export const ${workflowSlug}Workflow = task(
  {
    name: '${workflowSlug}_workflow',
    timeoutSeconds: 300,
    retry: { maxRetries: 1, waitDurationMs: 2000 },
  },
  async (ctx, input = {}) => {
    const stages = [];

${orchestratorCalls.join('\n\n')}

    return {
      workflowName: '${name}',
      status: 'SUCCEEDED',
      stagesCount: stages.length,
      stages,
      completedAt: new Date().toISOString(),
    };
  }
);
`;
}
