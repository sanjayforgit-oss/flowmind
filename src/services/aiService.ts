import type { GeneratedWorkflow, FlowNode, Action, Condition } from '../types';

export interface ProcessingStep {
  id: number;
  label: string;
  durationMs: number;
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 1, label: 'Understanding business intent...', durationMs: 200 },
  { id: 2, label: 'Identifying trigger...', durationMs: 200 },
  { id: 3, label: 'Analyzing conditions...', durationMs: 200 },
  { id: 4, label: 'Mapping actions...', durationMs: 200 },
  { id: 5, label: 'Validating workflow...', durationMs: 150 },
  { id: 6, label: 'Generating workflow...', durationMs: 150 },
];

export interface WorkflowProposal {
  name: string;
  trigger: string;
  approval?: string;
  conditions?: string[];
  actions: string[];
  summary: string;
  draftWorkflow: GeneratedWorkflow;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  proposal?: WorkflowProposal;
  isWorkflowGenerated?: boolean;
  generatedWorkflow?: GeneratedWorkflow;
  suggestedReplies?: string[];
}

/**
 * Creates an Employee Leave Approval Workflow
 */
export function buildLeaveApprovalWorkflow(params?: {
  approver?: string;
  hasCondition?: boolean;
  conditionDays?: number;
  conditionApprover?: string;
  notifyOnReject?: boolean;
}): GeneratedWorkflow {
  const approver = params?.approver || 'Manager';
  const hasCond = params?.hasCondition ?? false;
  const condDays = params?.conditionDays || 3;
  const condApprover = params?.conditionApprover || 'HR';

  const nodes: FlowNode[] = [
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Employee Leave Request Submitted',
      description: 'Webhook: Ingest employee leave application payload',
      status: 'ready',
    },
  ];

  const conditions: Condition[] = [];
  const actions: Action[] = [];

  if (hasCond) {
    conditions.push({
      id: 'c1',
      field: 'Leave Duration (Days)',
      operator: '>',
      value: String(condDays),
      label: `Duration > ${condDays} Days`,
    });

    nodes.push({
      id: 'node-2',
      type: 'condition',
      title: `Duration > ${condDays} Days?`,
      description: `Evaluate leave length policy threshold`,
      status: 'ready',
    });

    nodes.push({
      id: 'node-3',
      type: 'approval',
      title: `${condApprover} Approval`,
      description: `Requires ${condApprover} review for extended leave (> ${condDays}d)`,
      status: 'pending',
      branch: 'yes',
      actionType: 'Request Approval',
    });

    nodes.push({
      id: 'node-4',
      type: 'approval',
      title: `${approver} Approval`,
      description: `Standard leave approved by direct ${approver}`,
      status: 'pending',
      branch: 'no',
      actionType: 'Request Approval',
    });

    actions.push({
      id: 'a1',
      type: 'approval',
      label: `${condApprover} Approval`,
      description: `${condApprover} review required`,
    });
    actions.push({
      id: 'a2',
      type: 'approval',
      label: `${approver} Approval`,
      description: `${approver} review required`,
    });
  } else {
    nodes.push({
      id: 'node-2',
      type: 'approval',
      title: `${approver} Approval`,
      description: `Requires ${approver} sign-off before decision dispatch`,
      status: 'pending',
      actionType: 'Request Approval',
    });

    actions.push({
      id: 'a1',
      type: 'approval',
      label: `${approver} Approval`,
      description: `${approver} review required`,
    });
  }

  // Decision Notification
  nodes.push({
    id: `node-${nodes.length + 1}`,
    type: 'action',
    title: 'Notify Employee of Decision',
    description: 'Email / Slack: Send approval or rejection status to employee',
    status: 'ready',
    actionType: 'Send Email',
  });

  actions.push({
    id: `a-${actions.length + 1}`,
    type: 'email',
    label: 'Notify Employee of Decision',
    description: 'Delivers status email to requester',
  });

  // End Node
  nodes.push({
    id: `node-${nodes.length + 1}`,
    type: 'end',
    title: 'Leave Request Finalized',
    description: 'HRIS record updated and pipeline complete',
    status: 'ready',
  });

  return {
    id: `wf-leave-${Date.now()}`,
    name: 'Employee Leave Approval Workflow',
    description: `Automates employee leave requests with ${hasCond ? `conditional routing (> ${condDays}d to ${condApprover}, standard to ${approver})` : `${approver} approval`} and employee notification.`,
    intent: 'Automate employee leave request approval and notification',
    category: 'HR',
    trigger: {
      type: 'webhook',
      label: 'Employee Leave Request Submitted',
      description: 'Triggered when an employee submits a leave request form.',
    },
    conditions,
    actions,
    nodes,
    status: 'draft',
    confidence: 96,
    createdAt: new Date().toISOString(),
    estimatedExecution: '1.5 sec',
  };
}

/**
 * Creates Customer Complaint Workflow
 */
export function buildComplaintWorkflow(): GeneratedWorkflow {
  return {
    id: `wf-comp-${Date.now()}`,
    name: 'Customer Complaint Automation',
    description: 'Automates customer complaint triage, evaluates priority with NLP, creates Zendesk ticket, alerts manager for urgent issues, and prepares AI draft response.',
    intent: 'Automate customer complaint handling and escalation',
    category: 'Customer Support',
    trigger: {
      type: 'webhook',
      label: 'Customer Complaint Received',
      description: 'Triggered when a customer submits a complaint via email or ticket portal.',
    },
    conditions: [
      {
        id: 'c1',
        field: 'Priority',
        operator: '==',
        value: 'HIGH',
        label: 'Priority = HIGH',
      },
    ],
    actions: [
      {
        id: 'a1',
        type: 'ticket',
        label: 'Create Support Ticket',
        description: 'Generates urgent Zendesk ticket with 1-hour SLA tracking.',
      },
      {
        id: 'a2',
        type: 'notification',
        label: 'Notify Manager',
        description: 'Sends instant alert to Slack #support-escalations on-call lead.',
      },
      {
        id: 'a3',
        type: 'draft',
        label: 'Draft Response',
        description: 'Uses context to prepare a personalized draft response for review.',
      },
      {
        id: 'a4',
        type: 'approval',
        label: 'Human Approval',
        description: 'Requires support manager sign-off before sending final response.',
      },
    ],
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        title: 'Customer Complaint Received',
        description: 'Event detected from webhook / support inbox',
        status: 'ready',
      },
      {
        id: 'node-2',
        type: 'aiAction',
        title: 'Analyze Priority',
        description: 'Determine complaint priority with NLP',
        status: 'ready',
      },
      {
        id: 'node-3',
        type: 'condition',
        title: 'Priority = HIGH?',
        description: 'Evaluate business rule for urgent escalation',
        status: 'ready',
      },
      {
        id: 'node-4',
        type: 'action',
        title: 'Notify Manager',
        description: 'Send instant alert to Slack #support-escalations',
        status: 'ready',
        branch: 'yes',
        actionType: 'Notify Manager',
      },
      {
        id: 'node-5',
        type: 'action',
        title: 'Create Support Ticket',
        description: 'Create ticket in support system with 1h SLA',
        status: 'ready',
        actionType: 'Create Ticket',
      },
      {
        id: 'node-6',
        type: 'action',
        title: 'Draft Response',
        description: 'Generate contextual draft response',
        status: 'ready',
        actionType: 'Send Email',
      },
      {
        id: 'node-7',
        type: 'approval',
        title: 'Human Approval',
        description: 'Manager review required before dispatch',
        status: 'pending',
        actionType: 'Request Approval',
      },
      {
        id: 'node-8',
        type: 'end',
        title: 'Complete',
        description: 'Execution finalized with zero manual latency',
        status: 'ready',
      },
    ],
    status: 'draft',
    confidence: 94,
    createdAt: new Date().toISOString(),
    estimatedExecution: '2.1 sec',
  };
}

/**
 * Creates New Customer Welcome Workflow
 */
export function buildCustomerWelcomeWorkflow(): GeneratedWorkflow {
  return {
    id: `wf-cust-${Date.now()}`,
    name: 'New Customer Welcome & CRM Sync',
    description: 'Automatically sends onboarding welcome sequence and logs new customer profile to HubSpot CRM.',
    intent: 'Automate new customer onboarding and CRM sync',
    category: 'Sales',
    trigger: {
      type: 'event',
      label: 'New Customer Signup',
      description: 'Triggered upon successful account registration.',
    },
    conditions: [],
    actions: [
      {
        id: 'a1',
        type: 'email',
        label: 'Send Welcome Email',
        description: 'Delivers personalized onboarding guide via SendGrid.',
      },
      {
        id: 'a2',
        type: 'crm',
        label: 'Add Customer to CRM',
        description: 'Syncs lead details and owner assignment to HubSpot.',
      },
    ],
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        title: 'New Customer Signup',
        description: 'Auth Event: User registered',
        status: 'ready',
      },
      {
        id: 'node-2',
        type: 'action',
        title: 'Send Welcome Email',
        description: 'SendGrid: Account setup & welcome guide',
        status: 'ready',
        actionType: 'Send Email',
      },
      {
        id: 'node-3',
        type: 'action',
        title: 'Add Customer to CRM',
        description: 'HubSpot: Create contact & assign territory SDR',
        status: 'ready',
        actionType: 'Update CRM',
      },
      {
        id: 'node-4',
        type: 'end',
        title: 'Complete',
        description: 'Customer onboarded successfully',
        status: 'ready',
      },
    ],
    status: 'draft',
    confidence: 96,
    createdAt: new Date().toISOString(),
    estimatedExecution: '1.4 sec',
  };
}

/**
 * Creates Overdue Invoice Workflow
 */
export function buildInvoiceWorkflow(): GeneratedWorkflow {
  return {
    id: `wf-inv-${Date.now()}`,
    name: 'Invoice Overdue Notification & Follow-up',
    description: 'Monitors Stripe billing events, notifies the finance team, and dispatches automated reminder emails to overdue accounts.',
    intent: 'Automate overdue invoice collection and alerts',
    category: 'Finance',
    trigger: {
      type: 'billing',
      label: 'Invoice Overdue',
      description: 'Stripe: Invoice payment past due date (>7d).',
    },
    conditions: [
      {
        id: 'c1',
        field: 'Days Past Due',
        operator: '>=',
        value: '7',
        label: 'Overdue Days >= 7',
      },
    ],
    actions: [
      {
        id: 'a1',
        type: 'notification',
        label: 'Notify Finance Team',
        description: 'Posts billing summary in Slack #finance-alerts.',
      },
      {
        id: 'a2',
        type: 'email',
        label: 'Send Customer Reminder',
        description: 'Sends polite payment reminder email with secure Stripe portal link.',
      },
    ],
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        title: 'Invoice Overdue',
        description: 'Stripe Webhook: Invoice unpaid > 7 days',
        status: 'ready',
      },
      {
        id: 'node-2',
        type: 'condition',
        title: 'Overdue >= 7 Days?',
        description: 'Verification: Check grace period threshold',
        status: 'ready',
      },
      {
        id: 'node-3',
        type: 'action',
        title: 'Notify Finance Team',
        description: 'Slack: Alert #finance-alerts with invoice details',
        status: 'ready',
        actionType: 'Notify Manager',
      },
      {
        id: 'node-4',
        type: 'action',
        title: 'Send Customer Reminder',
        description: 'Email: Deliver payment link to billing contact',
        status: 'ready',
        actionType: 'Send Email',
      },
      {
        id: 'node-5',
        type: 'end',
        title: 'Complete',
        description: 'Collection follow-up logged',
        status: 'ready',
      },
    ],
    status: 'draft',
    confidence: 95,
    createdAt: new Date().toISOString(),
    estimatedExecution: '1.8 sec',
  };
}

/**
 * Generic Fallback Generator
 */
export function buildGenericWorkflow(input: string): GeneratedWorkflow {
  const titleWords = input
    .trim()
    .replace(/^when\s+/i, '')
    .replace(/^if\s+/i, '')
    .replace(/^automate\s+/i, '')
    .replace(/^create\s+/i, '')
    .slice(0, 40);

  const formattedTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);

  return {
    id: `wf-gen-${Date.now()}`,
    name: `${formattedTitle} Workflow`,
    description: `Automates business process: "${input.slice(0, 100)}..."`,
    intent: `Automate ${formattedTitle.toLowerCase()}`,
    category: 'Operations',
    trigger: {
      type: 'webhook',
      label: 'Business Event Triggered',
      description: 'Triggered when matching operational event payload is detected.',
    },
    conditions: [
      {
        id: 'c1',
        field: 'Status',
        operator: '==',
        value: 'Active',
        label: 'Status == Active',
      },
    ],
    actions: [
      {
        id: 'a1',
        type: 'notification',
        label: 'Process & Notify Team',
        description: 'Dispatches payload notification to target communication channel.',
      },
      {
        id: 'a2',
        type: 'action',
        label: 'Execute Automated Action',
        description: 'Performs downstream business update and logs telemetry.',
      },
    ],
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        title: 'Business Event Triggered',
        description: 'Event Ingestion: Webhook Listener',
        status: 'ready',
      },
      {
        id: 'node-2',
        type: 'condition',
        title: 'Evaluate Policy Rules',
        description: 'Validates conditions against incoming event schema',
        status: 'ready',
      },
      {
        id: 'node-3',
        type: 'action',
        title: 'Process & Notify Team',
        description: 'Dispatches alert and initiates operational flow',
        status: 'ready',
        actionType: 'Notify Manager',
      },
      {
        id: 'node-4',
        type: 'action',
        title: 'Execute Automated Action',
        description: 'Updates downstream records and triggers connected APIs',
        status: 'ready',
        actionType: 'Create Ticket',
      },
      {
        id: 'node-5',
        type: 'end',
        title: 'Complete',
        description: 'Workflow execution successfully concluded',
        status: 'ready',
      },
    ],
    status: 'draft',
    confidence: 91,
    createdAt: new Date().toISOString(),
    estimatedExecution: '2.0 sec',
  };
}

/**
 * Legacy interface for single-prompt generation
 */
export async function generateWorkflowFromIntent(input: string): Promise<GeneratedWorkflow> {
  const normalized = input.trim().toLowerCase();

  if (normalized.includes('leave') || normalized.includes('vacation') || normalized.includes('time off')) {
    const hasCond = normalized.includes('day') || normalized.includes('3') || normalized.includes('hr');
    return buildLeaveApprovalWorkflow({ hasCondition: hasCond });
  }

  if (
    normalized.includes('complaint') ||
    normalized.includes('urgent') ||
    normalized.includes('support ticket') ||
    normalized.includes('customer support')
  ) {
    return buildComplaintWorkflow();
  }

  if (
    normalized.includes('new customer') ||
    normalized.includes('welcome email') ||
    normalized.includes('signup') ||
    normalized.includes('crm')
  ) {
    return buildCustomerWelcomeWorkflow();
  }

  if (
    normalized.includes('invoice') ||
    normalized.includes('overdue') ||
    normalized.includes('finance') ||
    normalized.includes('payment')
  ) {
    return buildInvoiceWorkflow();
  }

  return buildGenericWorkflow(input);
}

/**
 * CONVERSATIONAL COPILOT ENGINE (Gemini LLM Powered with Rule-Based Fallback)
 */
export async function processCopilotConversation(
  messages: ChatMessage[],
  activeWorkflow: GeneratedWorkflow | null
): Promise<{
  reply: string;
  proposal?: WorkflowProposal;
  generatedWorkflow?: GeneratedWorkflow;
  updatedWorkflow?: GeneratedWorkflow;
  suggestedReplies?: string[];
  isGeminiPowered?: boolean;
}> {
  // 1. Attempt Real Gemini LLM Call via Secure Server Endpoint
  try {
    const res = await fetch('/api/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        activeWorkflow,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return {
          reply: data.data.reply,
          proposal: data.data.proposal,
          generatedWorkflow: data.data.generatedWorkflow,
          updatedWorkflow: data.data.updatedWorkflow,
          suggestedReplies: data.data.suggestedReplies,
          isGeminiPowered: true,
        };
      }
    }
  } catch (err) {
    console.info('[COPILOT AI] Using local workflow intelligence fallback.');
  }

  // 2. Graceful Fallback to Rule-Based Engine
  return processRuleBasedConversationFallback(messages, activeWorkflow);
}

/**
 * RULE-BASED FALLBACK ENGINE (Preserved for offline/error resiliency)
 */
export async function processRuleBasedConversationFallback(
  messages: ChatMessage[],
  activeWorkflow: GeneratedWorkflow | null
): Promise<{
  reply: string;
  proposal?: WorkflowProposal;
  generatedWorkflow?: GeneratedWorkflow;
  updatedWorkflow?: GeneratedWorkflow;
  suggestedReplies?: string[];
}> {
  // Simulate natural AI thought latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMsg?.content.trim() || '';
  const normalized = userText.toLowerCase();

  // Entire conversation text for multi-turn context
  const fullConversation = messages.map((m) => `${m.role}: ${m.content}`).join('\n').toLowerCase();

  // 1. GREETINGS & INTRODUCTIONS
  if (
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy)\b/i.test(userText) &&
    messages.filter((m) => m.role === 'user').length <= 2
  ) {
    return {
      reply: "Hey! I'm FLOWMIND AI. I can help you design, validate, and simulate intelligent automated workflows in natural language. What business process would you like to automate today?",
      suggestedReplies: [
        'Automate employee leave requests',
        'Customer complaint escalation',
        'Overdue invoice reminder flow',
        'What can you do?',
      ],
    };
  }

  // 2. CAPABILITIES & HELP
  if (
    normalized.includes('what can you do') ||
    normalized.includes('who are you') ||
    normalized.includes('help') ||
    normalized.includes('features')
  ) {
    return {
      reply: `I can help you build complete enterprise automation pipelines from plain English description:\n\n• **Trigger & Action Identification**: I extract triggers (webhooks, events, schedules) and connected service actions.\n• **Condition Branching**: I parse complex business logic and policy thresholds into branching pathways.\n• **DAG Graph Synthesis**: I convert intent into an interactive visual workflow ready for the visual builder.\n• **Validation & Safety**: I verify that logic has no unreachable nodes, orphan states, or collisions with existing workflows.\n• **Safe Sandbox Simulation**: Test dry-runs step-by-step before deploying.\n\nTry telling me: *"When an employee asks for leave, send it to their manager for approval."*`,
      suggestedReplies: [
        'Automate employee leave requests',
        'Customer complaint workflow',
        'Sync new customer to CRM',
      ],
    };
  }

  // 3. WORKFLOW EXPLANATION ("What does this workflow do?")
  if (
    (normalized.includes('what does this workflow do') ||
      normalized.includes('explain this workflow') ||
      normalized.includes('explain workflow') ||
      normalized.includes('how does this work')) &&
    activeWorkflow
  ) {
    const triggerDesc = activeWorkflow.trigger?.label || 'External Trigger';
    const conditionDesc =
      activeWorkflow.conditions.length > 0
        ? `evaluates condition (${activeWorkflow.conditions.map((c) => c.label).join(', ')})`
        : 'proceeds directly';
    const actionsDesc = activeWorkflow.actions.map((a) => a.label).join(', ');

    return {
      reply: `**${activeWorkflow.name}** Overview:\n\n1. **Trigger**: Starts when **${triggerDesc}** occurs.\n2. **Logic & Evaluation**: The pipeline ${conditionDesc}.\n3. **Actions Executed**: ${actionsDesc}.\n4. **Status**: Marked as **${activeWorkflow.status.toUpperCase()}** with ${activeWorkflow.nodes.length} nodes in the active DAG.\n\nYou can click **Simulate** to dry-run this workflow safely, or ask me to modify any node!`,
      suggestedReplies: ['Modify this workflow', 'Simulate this workflow', 'Validate workflow'],
    };
  }

  // 4. CHAT WORKFLOW MODIFICATION (e.g. "Change manager approval to HR", "Add email notification when rejected")
  if (
    (normalized.includes('change') ||
      normalized.includes('replace') ||
      normalized.includes('add') ||
      normalized.includes('remove') ||
      normalized.includes('delete') ||
      normalized.includes('update')) &&
    activeWorkflow
  ) {
    if (normalized.includes('hr') && (normalized.includes('approval') || normalized.includes('manager'))) {
      const updatedWorkflow: GeneratedWorkflow = {
        ...activeWorkflow,
        nodes: activeWorkflow.nodes.map((n) =>
          n.type === 'approval' || n.title.toLowerCase().includes('manager')
            ? { ...n, title: 'HR Approval', description: 'Requires HR manager sign-off' }
            : n
        ),
        actions: activeWorkflow.actions.map((a) =>
          a.type === 'approval' || a.label.toLowerCase().includes('manager')
            ? { ...a, label: 'HR Approval', description: 'HR review required' }
            : a
        ),
      };

      return {
        reply: `Done! I've updated the workflow to replace the **Manager Approval** step with **HR Approval**. The Visual Workflow Builder and state have been updated.`,
        updatedWorkflow,
        suggestedReplies: ['Open in Visual Builder', 'Simulate Workflow', 'Validate Workflow'],
      };
    }

    if (normalized.includes('notification') || normalized.includes('email') || normalized.includes('reject')) {
      const newAction: Action = {
        id: `act-${Date.now()}`,
        type: 'email',
        label: 'Send Rejection Notification',
        description: 'Delivers rejection reason and policy details to applicant',
      };
      const newNode: FlowNode = {
        id: `node-${Date.now()}`,
        type: 'action',
        title: 'Send Rejection Notification',
        description: 'Email: Notify requester of rejection status',
        status: 'ready',
        actionType: 'Send Email',
      };

      const updatedNodes = [...activeWorkflow.nodes];
      const endIdx = updatedNodes.findIndex((n) => n.type === 'end');
      if (endIdx !== -1) {
        updatedNodes.splice(endIdx, 0, newNode);
      } else {
        updatedNodes.push(newNode);
      }

      const updatedWorkflow: GeneratedWorkflow = {
        ...activeWorkflow,
        actions: [...activeWorkflow.actions, newAction],
        nodes: updatedNodes,
      };

      return {
        reply: `Done! I've added a dedicated **Rejection Notification** action step to the pipeline. You can inspect it in the Visual Builder.`,
        updatedWorkflow,
        suggestedReplies: ['Open in Visual Builder', 'Simulate Workflow', 'Validate Workflow'],
      };
    }
  }

  // 5. USER CONFIRMATION TO GENERATE WORKFLOW ("Yes", "Sure", "Generate it", "Confirm")
  if (
    /^(yes|sure|generate|generate it|go ahead|create it|confirm|done|ok|please do|let's do it)\b/i.test(normalized) ||
    normalized === 'yes'
  ) {
    // Check what topic was being discussed in conversation history
    if (fullConversation.includes('leave') || fullConversation.includes('vacation')) {
      const hasCond = fullConversation.includes('3') || fullConversation.includes('day') || fullConversation.includes('hr');
      const approver = fullConversation.includes('hr') && !hasCond ? 'HR' : 'Manager';
      const wf = buildLeaveApprovalWorkflow({ approver, hasCondition: hasCond });

      return {
        reply: `Done! I've generated the **Employee Leave Approval Workflow** for you.\n\nIt starts when an employee submits a leave request, routes it for ${hasCond ? 'conditional review' : `${approver} approval`}, and notifies the employee of the decision.\n\nYou can click **Open Visual Builder** below to interact with the visual canvas or test it in the safe simulator!`,
        generatedWorkflow: wf,
        suggestedReplies: ['Open Visual Builder', 'Simulate Workflow', 'Run Validation'],
      };
    }

    if (fullConversation.includes('complaint') || fullConversation.includes('support')) {
      const wf = buildComplaintWorkflow();
      return {
        reply: `Done! I've synthesized the **Customer Complaint Automation Workflow** for you. It evaluates complaint urgency with NLP, alerts managers on urgent issues, and drafts a contextual reply.`,
        generatedWorkflow: wf,
        suggestedReplies: ['Open Visual Builder', 'Simulate Workflow', 'Run Validation'],
      };
    }

    if (fullConversation.includes('invoice') || fullConversation.includes('overdue')) {
      const wf = buildInvoiceWorkflow();
      return {
        reply: `Done! I've synthesized the **Invoice Overdue Follow-up Workflow** for you with Stripe webhook triggers and Slack notifications.`,
        generatedWorkflow: wf,
        suggestedReplies: ['Open Visual Builder', 'Simulate Workflow', 'Run Validation'],
      };
    }

    // Default generic generator
    const wf = buildGenericWorkflow(userText || 'Business Automation');
    return {
      reply: `Done! I've created the workflow for you. You can review and customize each node in the Visual Builder.`,
      generatedWorkflow: wf,
      suggestedReplies: ['Open Visual Builder', 'Simulate Workflow'],
    };
  }

  // 6. SCENARIO A: EMPLOYEE LEAVE REQUEST CONVERSATION (Multi-turn Demo)
  if (
    normalized.includes('leave') ||
    normalized.includes('vacation') ||
    normalized.includes('time off') ||
    fullConversation.includes('leave')
  ) {
    // Condition check: e.g. "If leave is more than 3 days, HR should approve it. Otherwise the manager should approve it."
    if (
      normalized.includes('more than') ||
      normalized.includes('3 days') ||
      normalized.includes('> 3') ||
      (normalized.includes('hr') && normalized.includes('manager'))
    ) {
      const draftWorkflow = buildLeaveApprovalWorkflow({
        hasCondition: true,
        conditionDays: 3,
        conditionApprover: 'HR',
        approver: 'Manager',
      });

      return {
        reply: `I understand your condition logic:\n\n• **Trigger**: Employee submits leave request\n• **Condition**: Leave duration > 3 days\n• **Branch YES (> 3 days)**: Route to **HR Approval**\n• **Branch NO (≤ 3 days)**: Route to **Manager Approval**\n• **Action**: Notify employee of decision\n\nWould you like me to generate this workflow?`,
        proposal: {
          name: 'Employee Leave Approval (Conditional HR/Manager)',
          trigger: 'Employee Submits Leave Request',
          approval: 'HR Approval (if > 3d) / Manager Approval (standard)',
          conditions: ['Duration > 3 Days'],
          actions: ['HR / Manager Sign-off', 'Notify Employee of Decision'],
          summary: 'Routes leave requests dynamically to HR if > 3 days, otherwise manager, followed by employee notification.',
          draftWorkflow,
        },
        suggestedReplies: ['Yes, generate workflow', 'Change condition threshold', 'Add rejection email'],
      };
    }

    // If user previously told us about leave and now mentions "The manager" or "Manager"
    if (
      normalized === 'the manager' ||
      normalized === 'manager' ||
      normalized === 'manager.' ||
      normalized.includes('manager')
    ) {
      return {
        reply: `Got it. I'll route each employee leave request to their manager for approval. What should happen when the manager approves or rejects the request?`,
        suggestedReplies: [
          'Notify the employee',
          'Send email and update HR calendar',
          'Notify employee after approval or rejection',
        ],
      };
    }

    // If user mentions notification / decision ("Notify the employee")
    if (
      normalized.includes('notify') ||
      normalized.includes('email') ||
      normalized.includes('decision') ||
      normalized.includes('approve or reject')
    ) {
      const draftWorkflow = buildLeaveApprovalWorkflow({ approver: 'Manager' });

      return {
        reply: `Perfect. So the workflow will be:\n\n1. **Trigger**: Employee submits leave request\n2. **Approval**: Send request to employee's manager\n3. **Condition**: Manager approves or rejects\n4. **Action (Approved)**: Notify employee that leave was approved\n5. **Action (Rejected)**: Notify employee that leave was rejected\n\nWould you like me to generate this workflow?`,
        proposal: {
          name: 'Employee Leave Approval Workflow',
          trigger: 'Employee submits leave request',
          approval: "Employee's Manager",
          conditions: ['Manager Approves / Rejects'],
          actions: ['Notify employee of decision', 'Update HRIS records'],
          summary: 'Employee leave request → Manager approval → Notify employee of decision.',
          draftWorkflow,
        },
        suggestedReplies: ['Yes', 'Modify approval step', 'Add HR as backup'],
      };
    }

    // Initial leave prompt: "I want to automate employee leave requests."
    return {
      reply: `Sure. I can help with that. Who should approve the leave request — the employee's manager, HR, or someone else?`,
      suggestedReplies: ['The manager', 'HR Department', 'Both Manager & HR'],
    };
  }

  // 7. SCENARIO B: CUSTOMER COMPLAINTS / SUPPORT TICKETS
  if (
    normalized.includes('complaint') ||
    normalized.includes('support ticket') ||
    normalized.includes('customer support') ||
    fullConversation.includes('complaint')
  ) {
    const draftWorkflow = buildComplaintWorkflow();

    return {
      reply: `I understand your support escalation requirements:\n\n1. **Trigger**: Customer Complaint Received (via email / ticket portal)\n2. **AI Action**: Analyze sentiment and priority with NLP\n3. **Condition**: If Priority = HIGH → Notify on-call Manager on Slack\n4. **Action**: Create Zendesk Support Ticket with 1h SLA\n5. **AI Action**: Draft contextual response\n6. **Human-in-the-Loop**: Support manager review before dispatch\n\nWould you like me to generate this workflow?`,
      proposal: {
        name: 'Customer Complaint Automation',
        trigger: 'Customer Complaint Received via Webhook',
        approval: 'Manager Sign-off on AI Draft Response',
        conditions: ['Priority == HIGH'],
        actions: ['Analyze Priority (NLP)', 'Notify Manager (Slack)', 'Create Zendesk Ticket', 'Draft AI Response'],
        summary: 'Automates customer complaint triage, evaluates priority, alerts manager on urgent issues, and drafts AI response.',
        draftWorkflow,
      },
      suggestedReplies: ['Yes, generate workflow', 'Change SLA target', 'Modify channels'],
    };
  }

  // 8. SCENARIO C: OVERDUE INVOICE AUTOMATION
  if (
    normalized.includes('invoice') ||
    normalized.includes('overdue') ||
    normalized.includes('finance') ||
    fullConversation.includes('invoice')
  ) {
    const draftWorkflow = buildInvoiceWorkflow();

    return {
      reply: `Here is the proposed collection workflow:\n\n1. **Trigger**: Stripe Webhook detects unpaid invoice past due date\n2. **Condition**: Check if days past due ≥ 7 days\n3. **Action**: Post alert in Slack #finance-alerts\n4. **Action**: Dispatch polite reminder email with secure Stripe portal link\n\nWould you like me to generate this workflow?`,
      proposal: {
        name: 'Invoice Overdue Notification & Follow-up',
        trigger: 'Stripe: Invoice Overdue Event',
        conditions: ['Days Past Due >= 7'],
        actions: ['Notify Finance Team (Slack)', 'Send Customer Reminder (Email)'],
        summary: 'Monitors Stripe billing events, notifies the finance team, and dispatches automated reminder emails.',
        draftWorkflow,
      },
      suggestedReplies: ['Yes, generate workflow', 'Change overdue threshold to 14 days'],
    };
  }

  // 9. SCENARIO D: NEW CUSTOMER ONBOARDING
  if (
    normalized.includes('customer') ||
    normalized.includes('welcome') ||
    normalized.includes('crm') ||
    normalized.includes('lead')
  ) {
    const draftWorkflow = buildCustomerWelcomeWorkflow();

    return {
      reply: `Here's what I'll automate for new customer onboarding:\n\n1. **Trigger**: New Customer Signup event\n2. **Action**: Deliver personalized welcome email via SendGrid\n3. **Action**: Create contact record and assign territory SDR in HubSpot CRM\n\nWould you like me to generate this workflow?`,
      proposal: {
        name: 'New Customer Welcome & CRM Sync',
        trigger: 'Auth Event: User registered',
        actions: ['Send Welcome Email (SendGrid)', 'Add Customer to CRM (HubSpot)'],
        summary: 'Automatically sends onboarding welcome sequence and logs new customer profile to HubSpot CRM.',
        draftWorkflow,
      },
      suggestedReplies: ['Yes, generate workflow', 'Add Slack notification for sales'],
    };
  }

  // 10. GENERAL / OPEN REQUIREMENT SUMMARY
  const genericWf = buildGenericWorkflow(userText);
  return {
    reply: `I can automate that process for you. Here is the structured summary based on your description:\n\n• **Trigger Event**: Ingest incoming business payload\n• **Policy Evaluation**: Validate rules and payload schema\n• **Automated Actions**: Dispatch notifications and trigger connected service APIs\n\nWould you like me to generate this workflow?`,
    proposal: {
      name: genericWf.name,
      trigger: genericWf.trigger.label,
      actions: genericWf.actions.map((a) => a.label),
      summary: genericWf.description,
      draftWorkflow: genericWf,
    },
    suggestedReplies: ['Yes, generate workflow', 'Refine trigger event', 'Add approval step'],
  };
}
