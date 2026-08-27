export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'error' | 'validated' | 'ready';
export type ExecutionStatus = 'success' | 'running' | 'failed' | 'queued';
export type ConflictSeverity = 'high' | 'medium' | 'low';
export type NodeStatus = 'idle' | 'ready' | 'running' | 'success' | 'warning' | 'error' | 'pending';

export interface Trigger {
  type: string;
  label: string;
  description: string;
}

export interface Condition {
  id?: string;
  field: string;
  operator: string;
  value: string;
  label: string;
}

export interface Action {
  id: string;
  type: string;
  label: string;
  description: string;
}

export type FlowNodeType = 'trigger' | 'aiAction' | 'condition' | 'action' | 'approval' | 'end';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  title: string;
  description: string;
  status: NodeStatus;
  branch?: 'yes' | 'no' | 'main';
  actionType?: string;
}

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description: string;
  intent: string;
  category: 'Customer Support' | 'Finance' | 'Sales' | 'HR' | 'Operations' | 'Marketing';
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
  nodes: FlowNode[];
  status: 'draft' | 'validated' | 'ready';
  confidence: number;
  createdAt: string;
  estimatedExecution?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'Customer Support' | 'Finance' | 'Sales' | 'HR' | 'Operations' | 'Marketing';
  status: 'active' | 'paused' | 'draft' | 'error' | 'validated' | 'ready';
  trigger: string;
  actionsCount: number;
  lastRun: string;
  successRate: number;
  totalExecutions: number;
  tags: string[];
}

export interface ExecutionStep {
  id: string;
  name: string;
  type: 'trigger' | 'condition' | 'action' | 'notification' | 'integration';
  status: ExecutionStatus;
  durationMs: number;
  outputSummary?: string;
  error?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  duration: string;
  startedAt: string;
  triggerEvent: string;
  stepsTotal: number;
  stepsCompleted: number;
  steps: ExecutionStep[];
}

export interface WorkflowConflict {
  id: string;
  title: string;
  status: 'Potential Overlap' | 'Race Condition' | 'Redundant Action';
  severity: ConflictSeverity;
  description: string;
  workflowA: {
    id: string;
    name: string;
    trigger: string;
    action: string;
  };
  workflowB: {
    id: string;
    name: string;
    trigger: string;
    action: string;
  };
  suggestedFix: string;
}

export interface AIInsight {
  id: string;
  workflowName: string;
  type: 'optimization' | 'conflict_prevention' | 'cost_saving';
  title: string;
  recommendation: string;
  impact: string;
}

export interface StatMetric {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  iconName: string;
}

export interface CopilotRequirement {
  trigger: {
    event: string;
    source: string;
  };
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    name: string;
    target: string;
    params: string;
  }>;
  confidenceScore: number;
  summary: string;
}
