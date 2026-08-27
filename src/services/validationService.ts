import type { GeneratedWorkflow } from '../types';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  nodeId?: string;
  nodeTitle?: string;
  ruleId: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  issues: ValidationIssue[];
  evaluatedAt: string;
  workflowName: string;
}

/**
 * Deterministic Workflow Validation Engine for FlowMind AI.
 * Inspects structural and semantic integrity without requiring an external AI API.
 */
export function validateWorkflow(workflow: GeneratedWorkflow): ValidationResult {
  const issues: ValidationIssue[] = [];

  const triggerNodes = workflow.nodes.filter((n) => n.type === 'trigger');
  const actionNodes = workflow.nodes.filter((n) => n.type === 'action' || n.type === 'aiAction');
  const conditionNodes = workflow.nodes.filter((n) => n.type === 'condition');
  const approvalNodes = workflow.nodes.filter((n) => n.type === 'approval');
  const endNodes = workflow.nodes.filter((n) => n.type === 'end');

  // Rule 1: MISSING OR MULTIPLE TRIGGERS
  if (triggerNodes.length === 0) {
    issues.push({
      id: 'rule-trigger-missing',
      ruleId: 'MISSING_TRIGGER',
      severity: 'error',
      title: 'Missing Trigger Configuration',
      description: 'No trigger is configured. Every workflow must start with exactly one trigger event.',
    });
  } else if (triggerNodes.length > 1) {
    issues.push({
      id: 'rule-trigger-multiple',
      ruleId: 'MULTIPLE_TRIGGERS',
      severity: 'warning',
      title: 'Multiple Entry Triggers',
      description: 'Multiple trigger events detected. Ensure execution order is clearly gated.',
      nodeId: triggerNodes[1].id,
      nodeTitle: triggerNodes[1].title,
    });
  }

  // Rule 2: EMPTY WORKFLOW
  if (actionNodes.length === 0 && approvalNodes.length === 0) {
    issues.push({
      id: 'rule-empty-actions',
      ruleId: 'EMPTY_WORKFLOW',
      severity: 'error',
      title: 'Empty Workflow Actions',
      description: 'Workflow contains no executable actions. Add at least one action step.',
    });
  }

  // Rule 3: EMPTY OR UNCONFIGURED ACTION
  actionNodes.forEach((node) => {
    if (!node.title || node.title.trim() === 'Execute Action' || !node.description) {
      issues.push({
        id: `rule-empty-act-${node.id}`,
        ruleId: 'EMPTY_ACTION',
        severity: 'error',
        title: 'Unconfigured Action Step',
        description: `"${node.title}" has incomplete target parameters or missing integration type.`,
        nodeId: node.id,
        nodeTitle: node.title,
      });
    }
  });

  // Rule 4: CONDITION EXPRESSION & BRANCHES
  conditionNodes.forEach((node) => {
    if (!node.title || node.title === 'Policy Condition Branch') {
      issues.push({
        id: `rule-empty-cond-${node.id}`,
        ruleId: 'EMPTY_CONDITION',
        severity: 'warning',
        title: 'Ambiguous Condition Expression',
        description: `"${node.title}" requires a clearly defined evaluation field and comparison operator.`,
        nodeId: node.id,
        nodeTitle: node.title,
      });
    }

    // Check if branching exists
    const hasBranch = workflow.nodes.some((n) => n.branch === 'yes');
    if (!hasBranch && workflow.nodes.length > 3) {
      issues.push({
        id: `rule-branch-missing-${node.id}`,
        ruleId: 'CONDITION_BRANCHES',
        severity: 'warning',
        title: 'Missing Condition Branch Routing',
        description: `Condition "${node.title}" lacks explicit YES/NO divergent execution paths.`,
        nodeId: node.id,
        nodeTitle: node.title,
      });
    }
  });

  // Rule 5: APPROVAL PURPOSE
  approvalNodes.forEach((node) => {
    if (!node.description || node.description.length < 15) {
      issues.push({
        id: `rule-approval-${node.id}`,
        ruleId: 'APPROVAL_WITHOUT_PURPOSE',
        severity: 'warning',
        title: 'Approval Lacks Clear Purpose',
        description: `"${node.title}" requires defined approval criteria before pausing runtime execution.`,
        nodeId: node.id,
        nodeTitle: node.title,
      });
    }
  });

  // Rule 6: END NODE CHECK
  if (endNodes.length === 0) {
    issues.push({
      id: 'rule-missing-end',
      ruleId: 'MISSING_END_NODE',
      severity: 'warning',
      title: 'Missing Terminal End Node',
      description: 'Workflow has no terminal end step. Add an End node to ensure deterministic conclusion.',
    });
  }

  // Rule 7: SUGGESTIONS / BEST PRACTICES (INFO)
  if (workflow.category === 'Customer Support' && workflow.conditions.length > 0) {
    issues.push({
      id: 'sug-support-fallback',
      ruleId: 'SUPPORT_FALLBACK_SUGGESTION',
      severity: 'info',
      title: 'Consider Fallback Routing for Low-Priority Tickets',
      description: 'Standard SLA tickets should receive automated auto-response acknowledgment to prevent customer churn.',
      nodeId: workflow.nodes.find((n) => n.type === 'condition')?.id,
      nodeTitle: 'Priority = HIGH?',
    });
  }

  if (workflow.actions.length > 3) {
    issues.push({
      id: 'sug-rate-limit',
      ruleId: 'RATE_LIMIT_GUARD',
      severity: 'info',
      title: 'Add Rate-Limit Buffer for Multi-Action Dispatch',
      description: 'Parallel Slack and Zendesk API dispatches can benefit from a 500ms safety buffer.',
    });
  }

  // Calculate Deterministic Score (100 baseline)
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const suggestionCount = issues.filter((i) => i.severity === 'info').length;

  let rawScore = 100 - errorCount * 18 - warningCount * 7;
  if (errorCount === 0 && warningCount === 0) {
    rawScore = 100;
  } else {
    rawScore = Math.max(rawScore, 45);
  }

  return {
    isValid: errorCount === 0,
    score: rawScore,
    errorCount,
    warningCount,
    suggestionCount,
    issues,
    evaluatedAt: new Date().toISOString(),
    workflowName: workflow.name,
  };
}
