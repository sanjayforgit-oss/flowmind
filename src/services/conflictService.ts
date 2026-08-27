import type { GeneratedWorkflow } from '../types';

export interface ExistingDemoWorkflow {
  id: string;
  name: string;
  category: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused';
}

export const EXISTING_DEMO_WORKFLOWS: ExistingDemoWorkflow[] = [
  {
    id: 'wf-exist-1',
    name: 'Customer Support Escalation Alert',
    category: 'Customer Support',
    trigger: 'Customer Complaint Received',
    actions: ['Notify Manager', 'Send Slack Escalation'],
    status: 'active',
  },
  {
    id: 'wf-exist-2',
    name: 'New Customer Welcome Email',
    category: 'Sales',
    trigger: 'New Customer Signup',
    actions: ['Send Welcome Email', 'Add Customer to CRM'],
    status: 'active',
  },
  {
    id: 'wf-exist-3',
    name: 'New Customer Marketing Promotion',
    category: 'Marketing',
    trigger: 'New Customer Signup',
    actions: ['Send Promotional Email', 'Tag HubSpot Lead'],
    status: 'active',
  },
  {
    id: 'wf-exist-4',
    name: 'Invoice Overdue Automated Notice',
    category: 'Finance',
    trigger: 'Invoice Overdue',
    actions: ['Send Customer Reminder', 'Notify Finance Team'],
    status: 'active',
  },
];

export interface DetectedConflict {
  id: string;
  type: 'TRIGGER OVERLAP' | 'ACTION OVERLAP' | 'CONDITION OVERLAP' | 'POTENTIAL DUPLICATE';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  workflowA: {
    id: string;
    name: string;
    trigger: string;
    action: string;
    category: string;
  };
  workflowB: {
    id: string;
    name: string;
    trigger: string;
    action: string;
    category: string;
  };
  overlapPoint: string;
  aiRecommendation: string;
}

export interface ConflictAnalysisResult {
  totalScanned: number;
  conflictsFound: number;
  conflicts: DetectedConflict[];
  analyzedAt: string;
}

/**
 * Deterministic Cross-Workflow Conflict Detection Engine for FlowMind AI.
 * Compares incoming generated workflow triggers and actions against existing workspace automations.
 */
export function detectConflicts(
  currentWorkflow: GeneratedWorkflow,
  existingWorkflows: ExistingDemoWorkflow[] = EXISTING_DEMO_WORKFLOWS
): ConflictAnalysisResult {
  const conflicts: DetectedConflict[] = [];

  const currentTrigger = currentWorkflow.trigger.label.toLowerCase();
  const currentActionLabels = currentWorkflow.actions.map((a) => a.label.toLowerCase());

  existingWorkflows.forEach((existing) => {
    const existTrigger = existing.trigger.toLowerCase();
    const existActionLabels = existing.actions.map((a) => a.toLowerCase());

    const isTriggerOverlap =
      currentTrigger.includes(existTrigger) ||
      existTrigger.includes(currentTrigger) ||
      (currentTrigger.includes('complaint') && existTrigger.includes('complaint')) ||
      (currentTrigger.includes('signup') && existTrigger.includes('signup')) ||
      (currentTrigger.includes('invoice') && existTrigger.includes('invoice'));

    // Check for shared action targets
    const overlappingActions = currentActionLabels.filter((ca) =>
      existActionLabels.some((ea) => ca.includes(ea) || ea.includes(ca))
    );

    if (isTriggerOverlap && overlappingActions.length > 0) {
      // High severity: Both same trigger and same actions
      conflicts.push({
        id: `conf-high-${existing.id}`,
        type: 'POTENTIAL DUPLICATE',
        severity: 'high',
        title: `Duplicate Pipeline Execution on "${existing.trigger}"`,
        description: `Both "${currentWorkflow.name}" and existing "${existing.name}" fire simultaneously on "${existing.trigger}" and perform overlapping action "${overlappingActions[0]}".`,
        workflowA: {
          id: existing.id,
          name: existing.name,
          trigger: existing.trigger,
          action: existing.actions.join(', '),
          category: existing.category,
        },
        workflowB: {
          id: currentWorkflow.id,
          name: currentWorkflow.name,
          trigger: currentWorkflow.trigger.label,
          action: currentWorkflow.actions.map((a) => a.label).join(', '),
          category: currentWorkflow.category,
        },
        overlapPoint: `Shared Trigger: "${existing.trigger}" & Action: "${overlappingActions[0]}"`,
        aiRecommendation:
          'These workflows share the same trigger. Consider combining compatible actions into a single orchestrated pipeline or introducing condition filters to prevent duplicate messages.',
      });
    } else if (isTriggerOverlap) {
      // Medium severity: Same trigger, different actions
      conflicts.push({
        id: `conf-med-${existing.id}`,
        type: 'TRIGGER OVERLAP',
        severity: 'medium',
        title: `Concurrent Trigger Collision on "${existing.trigger}"`,
        description: `Both "${currentWorkflow.name}" and "${existing.name}" listen to event "${existing.trigger}". Without debounce or gating, simultaneous execution may cause race conditions.`,
        workflowA: {
          id: existing.id,
          name: existing.name,
          trigger: existing.trigger,
          action: existing.actions.join(', '),
          category: existing.category,
        },
        workflowB: {
          id: currentWorkflow.id,
          name: currentWorkflow.name,
          trigger: currentWorkflow.trigger.label,
          action: currentWorkflow.actions.map((a) => a.label).join(', '),
          category: currentWorkflow.category,
        },
        overlapPoint: `Identical Trigger Event: "${existing.trigger}"`,
        aiRecommendation:
          'Both workflows listen to this trigger. Add an evaluation condition (e.g. customer tier or urgency status) to distinguish execution boundaries.',
      });
    }
  });

  return {
    totalScanned: existingWorkflows.length + 1,
    conflictsFound: conflicts.length,
    conflicts,
    analyzedAt: new Date().toISOString(),
  };
}
