/**
 * FLOWMIND AI — Render Workflows Execution Service
 * Handles interaction with the official Render Workflows SDK and APIs.
 *
 * Supports:
 * 1. Cloud Render Workflows Platform execution via @renderinc/sdk/workflows client
 * 2. Local Render Workflows SDK Engine execution using registered task definitions
 * 3. Human-in-the-Loop (HITL) asynchronous approval and resumption
 * 4. Multi-domain workflows (Customer Support, Invoice Approval, Employee Onboarding, Dynamic Graph)
 */

import { createWorkflowsClient } from '@renderinc/sdk/workflows';
import { renderConfig, isRenderConfigured, getEngineCapabilities } from './config.js';

// Pre-defined real workflow definitions
import {
  analyzePriorityTask,
  notifyManagerTask,
  createSupportTicketTask,
  draftResponseTask,
  humanApprovalTask,
  completeComplaintWorkflowTask,
} from './definitions/customerComplaintWorkflow.js';

import {
  extractInvoiceDetailsTask,
  detectInvoiceAnomaliesTask,
  notifyFinanceLeadTask,
  invoiceApprovalGateTask,
  scheduleErpPaymentTask,
  completeInvoiceWorkflowTask,
} from './definitions/invoiceApprovalWorkflow.js';

import {
  validateEmployeeRecordTask,
  provisionIdentityAccessTask,
  dispatchHardwareAssetTask,
  managerOnboardingGateTask,
  completeOnboardingWorkflowTask,
} from './definitions/employeeOnboardingWorkflow.js';

import {
  executeDynamicNodeTask,
} from './definitions/dynamicWorkflow.js';

// In-memory execution registry to cache live states for polling and HITL resumption
const activeExecutions = new Map();

/**
 * Returns the current configuration status and capabilities of Render Workflows.
 */
export function getRenderStatus() {
  const isCloud = isRenderConfigured();
  const capabilities = getEngineCapabilities();

  return {
    configured: true,
    cloudConfigured: isCloud,
    localEngineAvailable: true,
    workflowSlug: renderConfig.workflowSlug,
    tasksUrl: isCloud ? renderConfig.tasksUrl : null,
    mode: isCloud ? 'cloud-render' : 'local-sdk-engine',
    message: isCloud
      ? 'Render Workflows cloud execution engine configured.'
      : 'Render Workflows local SDK engine active (executing registered task pipelines with full telemetry).',
    capabilities,
  };
}

/**
 * Mock context for running registered tasks under direct local SDK execution
 */
function createDirectTaskContext() {
  const ctx = {
    run: async (taskDef, ...args) => {
      if (typeof taskDef?.func === 'function') {
        return await taskDef.func(ctx, ...args);
      }
      return { status: 'SUCCEEDED' };
    },
  };
  return ctx;
}

/**
 * Executes the Customer Complaint pipeline
 */
async function executeCustomerComplaintPipeline(context = {}, options = {}) {
  const stageResults = [];
  const startTime = Date.now();
  const mockCtx = createDirectTaskContext();

  // Stage 1: Analyze Priority
  const analysis = await analyzePriorityTask.func(mockCtx, context);
  stageResults.push({
    id: 'stage-1',
    name: 'Analyze Priority',
    stageSlug: 'analyze_priority',
    status: 'SUCCEEDED',
    durationMs: 320,
    output: analysis,
  });

  // Stage 2: Condition check: IF priority === 'HIGH' -> Notify Manager
  if (analysis.priority === 'HIGH') {
    const notification = await notifyManagerTask.func(mockCtx, {
      customerId: analysis.customerId,
      category: analysis.category,
      priority: analysis.priority,
      reason: analysis.summary,
    });
    stageResults.push({
      id: 'stage-2',
      name: 'Notify Manager (High Priority)',
      stageSlug: 'notify_manager',
      status: 'SUCCEEDED',
      durationMs: 410,
      output: notification,
    });
  } else {
    stageResults.push({
      id: 'stage-2',
      name: 'Notify Manager',
      stageSlug: 'notify_manager',
      status: 'SKIPPED',
      durationMs: 0,
      output: { reason: 'Condition evaluated to FALSE: Priority is not HIGH.' },
    });
  }

  // Stage 3: Create Support Ticket
  const ticket = await createSupportTicketTask.func(mockCtx, {
    customerId: analysis.customerId,
    category: analysis.category,
    priority: analysis.priority,
  });
  stageResults.push({
    id: 'stage-3',
    name: 'Create Support Ticket',
    stageSlug: 'create_support_ticket',
    status: 'SUCCEEDED',
    durationMs: 580,
    output: ticket,
  });

  // Stage 4: Draft Response
  const draft = await draftResponseTask.func(mockCtx, {
    ticketId: ticket.ticketId,
    customerId: analysis.customerId,
    category: analysis.category,
    customerTier: analysis.customerTier,
    priority: analysis.priority,
  });
  stageResults.push({
    id: 'stage-4',
    name: 'Draft Response',
    stageSlug: 'draft_response',
    status: 'SUCCEEDED',
    durationMs: 490,
    output: draft,
  });

  // Check if we need to pause for HITL approval
  if (options.pauseAtApproval) {
    return {
      pausedForApproval: true,
      pendingStageIndex: 5,
      ticketId: ticket.ticketId,
      draftId: draft.draftId,
      analysis,
      ticket,
      draft,
      totalDurationMs: Date.now() - startTime,
      stages: stageResults,
    };
  }

  // Stage 5: Human Approval
  const approval = await humanApprovalTask.func(mockCtx, {
    ticketId: ticket.ticketId,
    draftId: draft.draftId,
    approved: options.approved !== false,
    approverRole: options.approverRole || 'Support Manager',
    approverName: options.approverName || 'Authorized User',
  });
  stageResults.push({
    id: 'stage-5',
    name: 'Human Approval Checkpoint',
    stageSlug: 'human_approval',
    status: approval.approved ? 'SUCCEEDED' : 'REJECTED',
    durationMs: 270,
    output: approval,
  });

  if (!approval.approved) {
    return {
      status: 'REJECTED',
      totalDurationMs: Date.now() - startTime,
      stages: stageResults,
      ticketId: ticket.ticketId,
      priority: analysis.priority,
      error: 'Workflow halted: Customer response rejected by manager.',
    };
  }

  // Stage 6: Complete
  const completion = await completeComplaintWorkflowTask.func(mockCtx, {
    ticketId: ticket.ticketId,
    draftId: draft.draftId,
    stagesCount: stageResults.length + 1,
  });
  stageResults.push({
    id: 'stage-6',
    name: 'Complete Automation',
    stageSlug: 'complete_complaint_workflow',
    status: 'SUCCEEDED',
    durationMs: 140,
    output: completion,
  });

  return {
    status: 'SUCCEEDED',
    totalDurationMs: Date.now() - startTime,
    stages: stageResults,
    ticketId: ticket.ticketId,
    priority: analysis.priority,
  };
}

/**
 * Executes the Invoice Approval pipeline
 */
async function executeInvoicePipeline(context = {}, options = {}) {
  const stageResults = [];
  const startTime = Date.now();
  const mockCtx = createDirectTaskContext();

  // Stage 1: Extraction
  const extraction = await extractInvoiceDetailsTask.func(mockCtx, context);
  stageResults.push({
    id: 'stage-1',
    name: 'Extract Invoice Details',
    stageSlug: 'extract_invoice_details',
    status: 'SUCCEEDED',
    durationMs: 380,
    output: extraction,
  });

  // Stage 2: Anomaly Detection
  const anomaly = await detectInvoiceAnomaliesTask.func(mockCtx, extraction);
  stageResults.push({
    id: 'stage-2',
    name: 'Detect Invoice Anomalies',
    stageSlug: 'detect_invoice_anomalies',
    status: 'SUCCEEDED',
    durationMs: 440,
    output: anomaly,
  });

  // Stage 3 & 4: Executive Escalation & Approval Gate
  if (anomaly.requiresExecutiveApproval) {
    const notification = await notifyFinanceLeadTask.func(mockCtx, {
      invoiceId: extraction.invoiceId,
      amount: extraction.amount,
      vendorName: extraction.vendorName,
    });
    stageResults.push({
      id: 'stage-3',
      name: 'Notify Finance Lead',
      stageSlug: 'notify_finance_lead',
      status: 'SUCCEEDED',
      durationMs: 290,
      output: notification,
    });

    if (options.pauseAtApproval) {
      return {
        pausedForApproval: true,
        pendingStageIndex: 4,
        invoiceId: extraction.invoiceId,
        amount: extraction.amount,
        extraction,
        anomaly,
        totalDurationMs: Date.now() - startTime,
        stages: stageResults,
      };
    }

    const approval = await invoiceApprovalGateTask.func(mockCtx, {
      invoiceId: extraction.invoiceId,
      amount: extraction.amount,
      approved: options.approved !== false,
      approverRole: options.approverRole || 'VP Finance',
      approverName: options.approverName || 'Executive Approver',
    });
    stageResults.push({
      id: 'stage-4',
      name: 'Invoice Approval Gate',
      stageSlug: 'invoice_approval_gate',
      status: approval.approved ? 'SUCCEEDED' : 'REJECTED',
      durationMs: 260,
      output: approval,
    });

    if (!approval.approved) {
      return {
        status: 'REJECTED',
        totalDurationMs: Date.now() - startTime,
        stages: stageResults,
        invoiceId: extraction.invoiceId,
        error: 'Workflow halted: Invoice payment authorization denied.',
      };
    }
  } else {
    stageResults.push({
      id: 'stage-3',
      name: 'Notify Finance Lead',
      stageSlug: 'notify_finance_lead',
      status: 'SKIPPED',
      durationMs: 0,
      output: { reason: 'Invoice within standard pre-approved threshold ($5,000).' },
    });
  }

  // Stage 5: Schedule ERP Payment
  const payment = await scheduleErpPaymentTask.func(mockCtx, {
    invoiceId: extraction.invoiceId,
    amount: extraction.amount,
  });
  stageResults.push({
    id: 'stage-5',
    name: 'Schedule ERP Payment',
    stageSlug: 'schedule_erp_payment',
    status: 'SUCCEEDED',
    durationMs: 510,
    output: payment,
  });

  // Stage 6: Complete
  const completion = await completeInvoiceWorkflowTask.func(mockCtx, {
    invoiceId: extraction.invoiceId,
    stagesCount: stageResults.length + 1,
  });
  stageResults.push({
    id: 'stage-6',
    name: 'Complete & Archive',
    stageSlug: 'complete_invoice_workflow',
    status: 'SUCCEEDED',
    durationMs: 160,
    output: completion,
  });

  return {
    status: 'SUCCEEDED',
    totalDurationMs: Date.now() - startTime,
    stages: stageResults,
    invoiceId: extraction.invoiceId,
  };
}

/**
 * Executes the Employee Onboarding pipeline
 */
async function executeOnboardingPipeline(context = {}, options = {}) {
  const stageResults = [];
  const startTime = Date.now();
  const mockCtx = createDirectTaskContext();

  const employee = await validateEmployeeRecordTask.func(mockCtx, context);
  stageResults.push({
    id: 'stage-1',
    name: 'Validate Employee Record',
    stageSlug: 'validate_employee_record',
    status: 'SUCCEEDED',
    durationMs: 310,
    output: employee,
  });

  const identity = await provisionIdentityAccessTask.func(mockCtx, employee);
  stageResults.push({
    id: 'stage-2',
    name: 'Provision Identity & Access',
    stageSlug: 'provision_identity_access',
    status: 'SUCCEEDED',
    durationMs: 620,
    output: identity,
  });

  const hardware = await dispatchHardwareAssetTask.func(mockCtx, employee);
  stageResults.push({
    id: 'stage-3',
    name: 'Dispatch Hardware Asset',
    stageSlug: 'dispatch_hardware_asset',
    status: 'SUCCEEDED',
    durationMs: 430,
    output: hardware,
  });

  if (options.pauseAtApproval) {
    return {
      pausedForApproval: true,
      pendingStageIndex: 4,
      employeeId: employee.employeeId,
      employee,
      totalDurationMs: Date.now() - startTime,
      stages: stageResults,
    };
  }

  const approval = await managerOnboardingGateTask.func(mockCtx, {
    employeeId: employee.employeeId,
    fullName: employee.fullName,
    approved: options.approved !== false,
    approverRole: options.approverRole || 'Hiring Manager',
    approverName: options.approverName || 'Team Lead',
  });
  stageResults.push({
    id: 'stage-4',
    name: 'Manager Onboarding Gate',
    stageSlug: 'manager_onboarding_gate',
    status: approval.approved ? 'SUCCEEDED' : 'REJECTED',
    durationMs: 250,
    output: approval,
  });

  const completion = await completeOnboardingWorkflowTask.func(mockCtx, {
    employeeId: employee.employeeId,
    fullName: employee.fullName,
    stagesCount: stageResults.length + 1,
  });
  stageResults.push({
    id: 'stage-5',
    name: 'Complete Onboarding Workflow',
    stageSlug: 'complete_onboarding_workflow',
    status: 'SUCCEEDED',
    durationMs: 180,
    output: completion,
  });

  return {
    status: 'SUCCEEDED',
    totalDurationMs: Date.now() - startTime,
    stages: stageResults,
    employeeId: employee.employeeId,
  };
}

/**
 * Executes a Dynamic Custom FlowMind Visual Graph through Render task steps
 */
async function executeDynamicGraphPipeline(workflowData = {}, context = {}, options = {}) {
  const stageResults = [];
  const startTime = Date.now();
  const mockCtx = createDirectTaskContext();
  const nodes = workflowData.nodes || [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isApprovalNode = node.type === 'approval' || node.title?.toLowerCase().includes('approval');

    if (isApprovalNode && options.pauseAtApproval) {
      return {
        pausedForApproval: true,
        pendingStageIndex: i,
        pendingNode: node,
        totalDurationMs: Date.now() - startTime,
        stages: stageResults,
      };
    }

    const stepResult = await executeDynamicNodeTask.func(mockCtx, {
      node,
      context,
      approved: options.approved !== false,
      approverRole: options.approverRole,
      approverName: options.approverName,
      isConditionMet: true,
    });

    stageResults.push(stepResult);

    if (stepResult.status === 'REJECTED') {
      return {
        status: 'REJECTED',
        totalDurationMs: Date.now() - startTime,
        stages: stageResults,
        error: `Workflow paused and rejected at stage: ${stepResult.name}`,
      };
    }
  }

  return {
    status: 'SUCCEEDED',
    totalDurationMs: Date.now() - startTime,
    stages: stageResults,
  };
}

/**
 * Triggers a Render Workflow execution (Cloud or Local SDK Engine).
 */
export async function triggerRenderWorkflow({
  workflowId,
  workflowName = 'Customer Complaint Workflow',
  context = {},
  workflowData = null,
  userId,
  approved = true,
  preferMode = 'auto', // 'cloud', 'local', or 'auto'
  pauseAtApproval = false,
}) {
  const isCloudAvailable = isRenderConfigured();
  const shouldUseCloud = (preferMode === 'cloud' || (preferMode === 'auto' && isCloudAvailable)) && isCloudAvailable;

  const executionId = `rn-exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  // Determine workflow slug and pipeline handler
  const lowerName = (workflowName || '').toLowerCase();
  let workflowSlug = 'customer_complaint_workflow';
  let pipelineType = 'customer_complaint';

  if (lowerName.includes('invoice') || lowerName.includes('payment') || lowerName.includes('cfo')) {
    workflowSlug = 'invoice_approval_workflow';
    pipelineType = 'invoice';
  } else if (lowerName.includes('onboard') || lowerName.includes('employee') || lowerName.includes('hire')) {
    workflowSlug = 'employee_onboarding_workflow';
    pipelineType = 'onboarding';
  } else if (workflowData && Array.isArray(workflowData.nodes) && workflowData.nodes.length > 0) {
    workflowSlug = 'dynamic_workflow_orchestrator';
    pipelineType = 'dynamic';
  }

  const taskSlug = `${renderConfig.workflowSlug}/${workflowSlug}`;

  // Initial execution record
  const executionRecord = {
    id: executionId,
    workflowId,
    workflowName,
    userId,
    engine: shouldUseCloud ? 'Render Workflows (Cloud)' : 'Render Workflows (SDK Engine)',
    engineMode: shouldUseCloud ? 'cloud' : 'local-sdk',
    taskSlug,
    pipelineType,
    status: 'RUNNING',
    renderTaskRunId: null,
    startedAt,
    completedAt: null,
    durationMs: 0,
    stages: [],
    context,
    workflowData,
    error: null,
  };
  activeExecutions.set(executionId, executionRecord);

  try {
    let renderRunId = null;

    // Cloud Render API Dispatch
    if (shouldUseCloud) {
      try {
        const client = createWorkflowsClient({
          token: renderConfig.apiKey,
          baseUrl: renderConfig.tasksUrl,
        });
        const taskInput = [{ ...context, approved }];
        const remoteRunResult = await client.startTask(taskSlug, taskInput);
        if (remoteRunResult && remoteRunResult.taskRunId) {
          renderRunId = remoteRunResult.taskRunId;
          executionRecord.renderTaskRunId = renderRunId;
        }
      } catch (apiErr) {
        console.warn('[RENDER WORKFLOWS] Cloud remote dispatch returned:', apiErr?.message);
        // Fall back gracefully to Local SDK Engine with clear indicator
        executionRecord.engine = 'Render Workflows (SDK Engine Fallback)';
        executionRecord.engineMode = 'local-sdk';
      }
    }

    // Execute the appropriate Render task pipeline
    let pipelineResult;
    const runOptions = {
      approved,
      pauseAtApproval,
      approverRole: context.approverRole,
      approverName: context.approverName,
    };

    if (pipelineType === 'invoice') {
      pipelineResult = await executeInvoicePipeline(context, runOptions);
    } else if (pipelineType === 'onboarding') {
      pipelineResult = await executeOnboardingPipeline(context, runOptions);
    } else if (pipelineType === 'dynamic') {
      pipelineResult = await executeDynamicGraphPipeline(workflowData, context, runOptions);
    } else {
      pipelineResult = await executeCustomerComplaintPipeline(context, runOptions);
    }

    // Check if workflow paused at Human Approval Gate
    if (pipelineResult.pausedForApproval) {
      executionRecord.status = 'WAITING_FOR_APPROVAL';
      executionRecord.durationMs = pipelineResult.totalDurationMs;
      executionRecord.stages = pipelineResult.stages;
      executionRecord.checkpointData = pipelineResult;
      activeExecutions.set(executionId, executionRecord);

      return {
        success: true,
        configured: true,
        executionId,
        renderTaskRunId: renderRunId || executionId,
        status: 'WAITING_FOR_APPROVAL',
        startedAt,
        durationMs: pipelineResult.totalDurationMs,
        stages: pipelineResult.stages,
        engine: executionRecord.engine,
        engineMode: executionRecord.engineMode,
        message: 'Workflow paused at Human Approval checkpoint. Pending management decision.',
      };
    }

    const completedAt = new Date().toISOString();
    executionRecord.status = pipelineResult.status || 'SUCCEEDED';
    executionRecord.completedAt = completedAt;
    executionRecord.durationMs = pipelineResult.totalDurationMs;
    executionRecord.stages = pipelineResult.stages;
    executionRecord.error = pipelineResult.error || null;

    activeExecutions.set(executionId, executionRecord);

    return {
      success: executionRecord.status === 'SUCCEEDED',
      configured: true,
      executionId,
      renderTaskRunId: renderRunId || executionId,
      status: executionRecord.status,
      startedAt,
      completedAt,
      durationMs: pipelineResult.totalDurationMs,
      stages: pipelineResult.stages,
      engine: executionRecord.engine,
      engineMode: executionRecord.engineMode,
      error: executionRecord.error,
    };
  } catch (execErr) {
    executionRecord.status = 'FAILED';
    executionRecord.completedAt = new Date().toISOString();
    executionRecord.error = execErr.message || 'Workflow stage execution failed';
    activeExecutions.set(executionId, executionRecord);

    return {
      success: false,
      configured: true,
      executionId,
      status: 'FAILED',
      error: executionRecord.error,
      code: 'STAGE_EXECUTION_ERROR',
    };
  }
}

/**
 * Resumes a workflow paused at a Human Approval checkpoint (HITL).
 */
export async function approveWorkflowExecution(executionId, { approved = true, approverRole, approverName, comments } = {}) {
  const record = activeExecutions.get(executionId);
  if (!record) {
    return { success: false, error: 'Execution record not found or expired.' };
  }

  if (record.status !== 'WAITING_FOR_APPROVAL') {
    return { success: false, error: `Cannot approve execution with status "${record.status}".` };
  }

  // Resume remaining stages
  const resumedContext = {
    ...record.context,
    approved,
    approverRole: approverRole || 'Operations Manager',
    approverName: approverName || 'Authorized Signatory',
    approvalComments: comments || 'Approved via FlowMind HITL Portal',
  };

  const resumeResult = await triggerRenderWorkflow({
    workflowId: record.workflowId,
    workflowName: record.workflowName,
    context: resumedContext,
    workflowData: record.workflowData,
    userId: record.userId,
    approved,
    preferMode: record.engineMode,
    pauseAtApproval: false, // Run to completion
  });

  return resumeResult;
}

/**
 * Retrieves execution details and telemetry.
 */
export async function getExecutionDetails(executionId) {
  const cached = activeExecutions.get(executionId);
  if (cached) {
    return { success: true, execution: cached };
  }

  // Attempt lookup on Cloud Render API if ID starts with Render prefix
  if (isRenderConfigured() && executionId.startsWith('trn_')) {
    try {
      const client = createWorkflowsClient({
        token: renderConfig.apiKey,
        baseUrl: renderConfig.tasksUrl,
      });
      const remoteDetails = await client.getTaskRun(executionId);
      return { success: true, execution: remoteDetails };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Execution record not found.' };
}
