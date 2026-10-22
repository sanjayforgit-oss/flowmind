/**
 * FLOWMIND AI — Employee Onboarding & IT Security Provisioning Render Workflow
 * Implemented using @renderinc/sdk/workflows
 *
 * Pipeline:
 * Candidate Offer Accepted
 *   -> Stage 1: Validate Employee Record & Department Setup
 *   -> Stage 2: Automated Identity & Access Provisioning (Okta / Google Workspace)
 *   -> Stage 3: Hardware Logistics & Asset Tracking
 *   -> Stage 4: Hiring Manager Approval & Mentor Assignment Checkpoint
 *   -> Stage 5: Send Welcome Pack & HRIS Sync (BambooHR / Workday)
 */

import { task } from '@renderinc/sdk/workflows';

/**
 * Stage 1: Validate Employee Record
 */
export const validateEmployeeRecordTask = task(
  {
    name: 'validate_employee_record',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, input = {}) => {
    const employeeId = input.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullName = input.fullName || input.candidateName || 'Alex Mercer';
    const email = input.email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@flowmind.internal`;
    const department = input.department || 'Engineering';
    const roleTitle = input.roleTitle || input.role || 'Staff Cloud Infrastructure Engineer';
    const startDate = input.startDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    return {
      stage: 'validate_employee_record',
      status: 'SUCCEEDED',
      employeeId,
      fullName,
      email,
      department,
      roleTitle,
      startDate,
      verified: true,
      summary: `Employee profile validated for ${fullName} (${roleTitle}) in ${department}.`,
      timestamp: new Date().toISOString(),
    };
  }
);

/**
 * Stage 2: Automated Identity & Access Provisioning
 */
export const provisionIdentityAccessTask = task(
  {
    name: 'provision_identity_access',
    timeoutSeconds: 90,
    retry: { maxRetries: 3, waitDurationMs: 1500 },
  },
  async (_ctx, empData = {}) => {
    const ssoGroups = ['all-employees', `dept-${empData.department?.toLowerCase() || 'general'}`];
    if (empData.department === 'Engineering') {
      ssoGroups.push('github-developers', 'aws-sandbox-access', 'k8s-staging');
    }

    return {
      stage: 'provision_identity_access',
      status: 'SUCCEEDED',
      identityProvider: 'Okta Enterprise SSO',
      ssoEmail: empData.email,
      assignedGroups: ssoGroups,
      mfaEnforced: true,
      googleWorkspaceStatus: 'ACTIVE',
      githubTeam: empData.department === 'Engineering' ? '@flowmind/platform-core' : 'N/A',
      summary: `SSO and group permissions provisioned across ${ssoGroups.length} security groups.`,
      provisionedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 3: Hardware Logistics & Asset Tagging
 */
export const dispatchHardwareAssetTask = task(
  {
    name: 'dispatch_hardware_asset',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, assetInput = {}) => {
    const assetTag = `AST-${Math.floor(20000 + Math.random() * 80000)}`;
    const trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}`;

    return {
      stage: 'dispatch_hardware_asset',
      status: 'SUCCEEDED',
      assetTag,
      hardwareModel: 'Apple MacBook Pro 16" (M3 Max, 36GB RAM)',
      trackingNumber,
      carrier: 'FedEx Express Expedited',
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      summary: `Asset ${assetTag} packaged and dispatched to ${assetInput.fullName || 'new hire'}.`,
      dispatchedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 4: Manager Approval & Onboarding Plan Checkpoint
 */
export const managerOnboardingGateTask = task(
  {
    name: 'manager_onboarding_gate',
    timeoutSeconds: 120,
    retry: { maxRetries: 1, waitDurationMs: 1000 },
  },
  async (_ctx, approvalInput = {}) => {
    const isApproved = approvalInput.approved !== false;
    const approverRole = approvalInput.approverRole || 'Engineering Manager';
    const approverName = approvalInput.approverName || 'Team Lead';

    return {
      stage: 'manager_onboarding_gate',
      status: isApproved ? 'SUCCEEDED' : 'REJECTED',
      checkpoint: 'Manager 30-60-90 Day Plan Sign-Off',
      approved: isApproved,
      approverRole,
      approverName,
      assignedMentor: 'Sarah Jenkins (Senior Staff Engineer)',
      notes: isApproved
        ? 'First week agenda, pairing sessions, and mentor assignment confirmed.'
        : 'Onboarding held for schedule adjustments.',
      decidedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 5: Welcome Kit & HRIS Completion
 */
export const completeOnboardingWorkflowTask = task(
  {
    name: 'complete_onboarding_workflow',
    timeoutSeconds: 30,
  },
  async (_ctx, completionData = {}) => {
    return {
      stage: 'complete',
      status: 'SUCCEEDED',
      employeeId: completionData.employeeId,
      totalStagesExecuted: completionData.stagesCount || 5,
      hrisStatus: 'ACTIVE_PRE_START',
      summary: `Onboarding pipeline complete for ${completionData.fullName || 'employee'}. Welcome pack sent.`,
      completedAt: new Date().toISOString(),
    };
  }
);

/**
 * Main Orchestrator Task: Employee Onboarding & Security Provisioning
 */
export const employeeOnboardingWorkflow = task(
  {
    name: 'employee_onboarding_workflow',
    timeoutSeconds: 300,
    retry: { maxRetries: 1, waitDurationMs: 2000 },
  },
  async (ctx, input = {}) => {
    const stageResults = [];

    // Stage 1: Validate Employee
    const employee = await ctx.run(validateEmployeeRecordTask, input);
    stageResults.push(employee);

    // Stage 2: Identity & Access Provisioning
    const identity = await ctx.run(provisionIdentityAccessTask, employee);
    stageResults.push(identity);

    // Stage 3: Hardware Logistics
    const hardware = await ctx.run(dispatchHardwareAssetTask, employee);
    stageResults.push(hardware);

    // Stage 4: Manager Approval Gate
    const approval = await ctx.run(managerOnboardingGateTask, {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      approved: input.approved !== false,
      approverRole: input.approverRole,
      approverName: input.approverName,
    });
    stageResults.push(approval);

    // Stage 5: Complete
    const completion = await ctx.run(completeOnboardingWorkflowTask, {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      stagesCount: stageResults.length + 1,
    });
    stageResults.push(completion);

    return {
      workflowName: 'Employee Onboarding & IT Security Provisioning',
      status: 'SUCCEEDED',
      employeeId: employee.employeeId,
      stages: stageResults,
      finishedAt: completion.completedAt,
    };
  }
);
