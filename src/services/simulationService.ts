import type { GeneratedWorkflow, FlowNodeType } from '../types';

export type SimulationStepStatus = 'pending' | 'running' | 'success' | 'warning' | 'error' | 'skipped';
export type SimulationOverallStatus = 'ready' | 'running' | 'waiting_approval' | 'completed' | 'rejected' | 'error';

export interface SimulationContext {
  event: string;
  customerId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  amount?: number;
  customerTier: 'Enterprise' | 'Growth' | 'Starter';
}

export const DEFAULT_SIMULATION_CONTEXT: SimulationContext = {
  event: 'customer_complaint',
  customerId: 'CUS-1042',
  priority: 'HIGH',
  category: 'Billing & Account Escalation',
  amount: 45000,
  customerTier: 'Enterprise',
};

export interface SimulatedStep {
  id: string;
  stepNumber: string;
  nodeId: string;
  nodeType: FlowNodeType;
  title: string;
  sublabel: string;
  status: SimulationStepStatus;
  durationMs: number;
  timestamp?: string;
  branchChoice?: 'YES' | 'NO';
  payload: Record<string, unknown>;
  outputSummary: string;
  error?: string;
}

export interface SimulationAnalytics {
  fastestStep: { title: string; duration: string };
  longestStep: { title: string; duration: string };
  potentialBottleneck: string;
  totalDurationSeconds: string;
}

/**
 * Creates a deterministic, data-driven simulation execution plan from any GeneratedWorkflow.
 */
export function buildSimulationPlan(
  workflow: GeneratedWorkflow,
  context: SimulationContext = DEFAULT_SIMULATION_CONTEXT
): SimulatedStep[] {
  const steps: SimulatedStep[] = [];
  const baseTime = Date.now();

  const isUrgent = context.priority === 'HIGH' || context.customerTier === 'Enterprise';

  workflow.nodes.forEach((node, idx) => {
    const stepNum = String(idx + 1).padStart(2, '0');
    const stepTime = new Date(baseTime + idx * 450).toISOString().split('T')[1].slice(0, 12);

    if (node.type === 'trigger') {
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'trigger',
        title: node.title,
        sublabel: `Event detected: ${context.event} from ${context.customerId}`,
        status: 'pending',
        durationMs: 380,
        timestamp: stepTime,
        outputSummary: `Trigger payload verified (${context.category})`,
        payload: {
          event: context.event,
          customer_id: context.customerId,
          tier: context.customerTier,
          priority_hint: context.priority,
          category: context.category,
          timestamp: new Date().toISOString(),
          simulated_environment: 'Local Sandbox',
        },
      });
    } else if (node.type === 'aiAction') {
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'aiAction',
        title: node.title,
        sublabel: `NLP Intent analyzed: Priority classified as ${context.priority}`,
        status: 'pending',
        durationMs: 420,
        timestamp: stepTime,
        outputSummary: `Classified priority: ${context.priority} (Confidence 96%)`,
        payload: {
          step: 'ai_intent_analysis',
          nlp_model: 'flowmind-sentiment-v2',
          classified_priority: context.priority,
          sentiment_score: context.priority === 'HIGH' ? -0.85 : -0.2,
          suggested_routing: context.priority === 'HIGH' ? 'urgent_escalation' : 'standard_queue',
        },
      });
    } else if (node.type === 'condition') {
      const conditionMatches = isUrgent;
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'condition',
        title: node.title,
        sublabel: `Evaluated: Priority == "${context.priority}" -> ${conditionMatches ? 'TRUE (YES Branch)' : 'FALSE (NO Branch)'}`,
        status: 'pending',
        durationMs: 290,
        timestamp: stepTime,
        branchChoice: conditionMatches ? 'YES' : 'NO',
        outputSummary: `Condition evaluated -> ${conditionMatches ? 'YES (Urgent Route)' : 'NO (Standard Route)'}`,
        payload: {
          rule: 'Priority == HIGH || Tier == Enterprise',
          actual_value: context.priority,
          evaluated_result: conditionMatches,
          selected_branch: conditionMatches ? 'YES' : 'NO',
          action: conditionMatches ? 'escalate_to_manager' : 'continue_standard',
        },
      });
    } else if (node.branch === 'yes') {
      // Step executed only if YES branch chosen
      const shouldRun = isUrgent;
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'action',
        title: node.title,
        sublabel: shouldRun
          ? 'Slack alert prepared for on-call support manager'
          : 'Skipped: Condition evaluated to FALSE',
        status: shouldRun ? 'pending' : 'skipped',
        durationMs: shouldRun ? 410 : 0,
        timestamp: stepTime,
        outputSummary: shouldRun
          ? 'Alert dispatched to #support-escalations on-call lead'
          : 'Bypassed (Standard SLA route)',
        payload: shouldRun
          ? {
              target: 'Slack',
              channel: '#support-escalations',
              priority: 'URGENT',
              message: `Urgent escalation for ${context.customerId} (${context.category})`,
              delivery: 'simulated_success',
            }
          : { status: 'SKIPPED', reason: 'Priority condition not met' },
      });
    } else if (node.type === 'action') {
      const isTicket = node.title.toLowerCase().includes('ticket');
      const isEmail = node.title.toLowerCase().includes('email') || node.title.toLowerCase().includes('draft');

      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'action',
        title: node.title,
        sublabel: isTicket
          ? `Zendesk ticket payload prepared with 1h SLA`
          : isEmail
          ? `Personalized draft response synthesized`
          : `Simulated task execution completed`,
        status: 'pending',
        durationMs: isTicket ? 680 : 490,
        timestamp: stepTime,
        outputSummary: isTicket
          ? 'Ticket #ZD-9982 staged in support queue'
          : isEmail
          ? 'Contextual draft message generated'
          : 'Action payload staged',
        payload: isTicket
          ? {
              service: 'Zendesk Support',
              ticket_id: 'ZD-9982',
              sla_hours: 1,
              status: 'STAGED',
              requester: context.customerId,
            }
          : isEmail
          ? {
              service: 'AI Draft Assistant',
              draft_body: `Dear customer, we received your inquiry regarding ${context.category}. Our team is addressing ticket ZD-9982 immediately.`,
              tokens: 42,
            }
          : {
              service: node.actionType || 'General Integration',
              status: 'PREPARED',
              payload_size_bytes: 512,
            },
      });
    } else if (node.type === 'approval') {
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'approval',
        title: node.title,
        sublabel: 'Awaiting human sign-off before downstream dispatch',
        status: 'pending',
        durationMs: 300,
        timestamp: stepTime,
        outputSummary: 'Simulation stopped at human approval checkpoint',
        payload: {
          checkpoint_type: 'Human-in-the-loop',
          approver_role: 'Support Manager',
          item_for_review: 'Draft message & Zendesk Ticket #ZD-9982',
          state: 'WAITING_FOR_DECISION',
        },
      });
    } else if (node.type === 'end') {
      steps.push({
        id: `sim-${node.id}`,
        stepNumber: stepNum,
        nodeId: node.id,
        nodeType: 'end',
        title: node.title,
        sublabel: 'Workflow pipeline simulation successfully finalized',
        status: 'pending',
        durationMs: 150,
        timestamp: stepTime,
        outputSummary: 'Safe simulation concluded (0 real records modified)',
        payload: {
          status: 'SIMULATION_COMPLETED',
          total_steps: workflow.nodes.length,
          errors: 0,
          safe_mode: true,
          real_actions_performed: 0,
        },
      });
    }
  });

  return steps;
}

/**
 * Computes performance and bottleneck insights from simulated steps.
 */
export function computeSimulationAnalytics(steps: SimulatedStep[]): SimulationAnalytics {
  const activeSteps = steps.filter((s) => s.status !== 'skipped' && s.durationMs > 0);
  if (activeSteps.length === 0) {
    return {
      fastestStep: { title: 'Analyze Priority', duration: '0.29s' },
      longestStep: { title: 'Create Support Ticket', duration: '0.68s' },
      potentialBottleneck: 'Human Approval Checkpoint',
      totalDurationSeconds: '2.4s',
    };
  }

  let fastest = activeSteps[0];
  let longest = activeSteps[0];
  let totalMs = 0;

  activeSteps.forEach((s) => {
    totalMs += s.durationMs;
    if (s.durationMs < fastest.durationMs) fastest = s;
    if (s.durationMs > longest.durationMs) longest = s;
  });

  return {
    fastestStep: {
      title: fastest.title,
      duration: `${(fastest.durationMs / 1000).toFixed(2)}s`,
    },
    longestStep: {
      title: longest.title,
      duration: `${(longest.durationMs / 1000).toFixed(2)}s`,
    },
    potentialBottleneck: 'Human Approval Checkpoint',
    totalDurationSeconds: `${(totalMs / 1000).toFixed(2)}s`,
  };
}
