import type {
  Workflow,
  Execution,
  WorkflowConflict,
  AIInsight,
  StatMetric,
  CopilotRequirement
} from '../types';

export const statMetrics: StatMetric[] = [
  {
    title: 'Active Workflows',
    value: '12',
    change: '+3 this month',
    isPositive: true,
    timeframe: 'vs last month',
    iconName: 'Workflow',
  },
  {
    title: 'Total Executions',
    value: '48,290',
    change: '+14.2%',
    isPositive: true,
    timeframe: 'last 30 days',
    iconName: 'Zap',
  },
  {
    title: 'Success Rate',
    value: '99.4%',
    change: '+0.6%',
    isPositive: true,
    timeframe: 'high reliability',
    iconName: 'CheckCircle2',
  },
  {
    title: 'Estimated Time Saved',
    value: '184 hrs',
    change: '+32 hrs',
    isPositive: true,
    timeframe: 'this month',
    iconName: 'Clock',
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: 'wf-01',
    name: 'Customer Complaint Automation',
    description: 'Triage customer complaints, evaluate severity with NLP, assign Zendesk tickets and notify key account managers.',
    category: 'Customer Support',
    status: 'active',
    trigger: 'Webhook: Incoming Support Ticket',
    actionsCount: 4,
    lastRun: '2 mins ago',
    successRate: 99.1,
    totalExecutions: 14200,
    tags: ['Zendesk', 'Slack', 'Email', 'AI Classifier'],
  },
  {
    id: 'wf-02',
    name: 'Invoice Follow-up & Collections',
    description: 'Track unpaid Stripe invoices past 7 days, generate personalized reminder emails, and escalate to finance on Slack.',
    category: 'Finance',
    status: 'active',
    trigger: 'Stripe: Invoice Overdue (>7d)',
    actionsCount: 3,
    lastRun: '18 mins ago',
    successRate: 100.0,
    totalExecutions: 8350,
    tags: ['Stripe', 'Gmail', 'Slack'],
  },
  {
    id: 'wf-03',
    name: 'Lead Qualification & CRM Sync',
    description: 'Score incoming inbound leads via web forms, verify domain enrichment via Clearbit, and route qualified leads to HubSpot.',
    category: 'Sales',
    status: 'active',
    trigger: 'Form Submission: Demo Request',
    actionsCount: 5,
    lastRun: '44 mins ago',
    successRate: 98.8,
    totalExecutions: 19840,
    tags: ['HubSpot', 'Clearbit', 'Typeform'],
  },
  {
    id: 'wf-04',
    name: 'Employee Onboarding Sequence',
    description: 'Provision Google Workspace account, send welcome pack, invite to Slack channels, and schedule 1:1 manager sync.',
    category: 'HR',
    status: 'paused',
    trigger: 'BambooHR: New Hire Added',
    actionsCount: 6,
    lastRun: '3 days ago',
    successRate: 97.4,
    totalExecutions: 5900,
    tags: ['BambooHR', 'Google Workspace', 'Slack'],
  },
];

export const mockExecutions: Execution[] = [
  {
    id: 'exec-8891',
    workflowId: 'wf-01',
    workflowName: 'Customer Complaint Automation',
    status: 'success',
    duration: '1.24s',
    startedAt: '2 mins ago (19:38:12)',
    triggerEvent: 'Ticket #4912 from enterprise client',
    stepsTotal: 4,
    stepsCompleted: 4,
    steps: [
      { id: 's1', name: 'Trigger: Complaint payload received', type: 'trigger', status: 'success', durationMs: 120, outputSummary: 'Customer: Acme Corp, Sentiment: Negative' },
      { id: 's2', name: 'Condition: Priority = High & Plan = Enterprise', type: 'condition', status: 'success', durationMs: 85, outputSummary: 'Evaluated TRUE (Priority: Urgent, MRR: $5,000)' },
      { id: 's3', name: 'Action: Create Zendesk Urgent Ticket', type: 'action', status: 'success', durationMs: 430, outputSummary: 'Ticket ID: #ZD-9982 created' },
      { id: 's4', name: 'Notification: Alert Manager on Slack #support-escalations', type: 'notification', status: 'success', durationMs: 605, outputSummary: 'Dispatched to #support-escalations on-call team' },
    ],
  },
  {
    id: 'exec-8890',
    workflowId: 'wf-02',
    workflowName: 'Invoice Follow-up & Collections',
    status: 'success',
    duration: '0.86s',
    startedAt: '18 mins ago (19:22:45)',
    triggerEvent: 'Invoice #INV-2026-904 overdue by 8 days',
    stepsTotal: 3,
    stepsCompleted: 3,
    steps: [
      { id: 's1', name: 'Trigger: Stripe webhook detected', type: 'trigger', status: 'success', durationMs: 95, outputSummary: 'Invoice amount: $1,250.00 USD' },
      { id: 's2', name: 'Action: Send polite reminder email', type: 'action', status: 'success', durationMs: 380, outputSummary: 'Sent via SendGrid to billing@partner.io' },
      { id: 's3', name: 'Action: Log follow-up in Notion finance table', type: 'action', status: 'success', durationMs: 385, outputSummary: 'Row created with next ping date' },
    ],
  },
  {
    id: 'exec-8889',
    workflowId: 'wf-03',
    workflowName: 'Lead Qualification & CRM Sync',
    status: 'running',
    duration: '0.45s',
    startedAt: 'Just now (19:40:02)',
    triggerEvent: 'New demo form submission: sarah@fintech.co',
    stepsTotal: 5,
    stepsCompleted: 3,
    steps: [
      { id: 's1', name: 'Trigger: Webhook from Typeform', type: 'trigger', status: 'success', durationMs: 110, outputSummary: 'Email: sarah@fintech.co, Company size: 250+' },
      { id: 's2', name: 'Integration: Clearbit domain enrichment', type: 'integration', status: 'success', durationMs: 240, outputSummary: 'Enriched: Series B, Fintech, SF' },
      { id: 's3', name: 'Condition: ICP Score > 80', type: 'condition', status: 'success', durationMs: 100, outputSummary: 'ICP score calculated: 94/100' },
      { id: 's4', name: 'Action: Sync Contact to HubSpot CRM', type: 'action', status: 'running', durationMs: 0 },
      { id: 's5', name: 'Notification: Ping SDR team on Slack', type: 'notification', status: 'queued', durationMs: 0 },
    ],
  },
  {
    id: 'exec-8888',
    workflowId: 'wf-01',
    workflowName: 'Customer Complaint Automation',
    status: 'failed',
    duration: '2.10s',
    startedAt: '1 hour ago (18:40:11)',
    triggerEvent: 'Ticket #4909 without valid sender email',
    stepsTotal: 4,
    stepsCompleted: 1,
    steps: [
      { id: 's1', name: 'Trigger: Complaint payload received', type: 'trigger', status: 'success', durationMs: 115 },
      { id: 's2', name: 'Condition: Validate payload schema', type: 'condition', status: 'failed', durationMs: 1985, error: 'Validation Error: Required field "reply_to_email" missing in webhook payload.' },
      { id: 's3', name: 'Action: Create Zendesk Urgent Ticket', type: 'action', status: 'queued', durationMs: 0 },
      { id: 's4', name: 'Notification: Alert Manager', type: 'notification', status: 'queued', durationMs: 0 },
    ],
  },
];

export const mockConflicts: WorkflowConflict[] = [
  {
    id: 'conf-01',
    title: 'Potential Communication Collision on New Customer Event',
    status: 'Potential Overlap',
    severity: 'medium',
    description: 'Two separate workflows trigger immediately when a new customer registers, which may send double marketing/onboarding emails within seconds.',
    workflowA: {
      id: 'wf-welcome',
      name: 'Customer Onboarding Flow',
      trigger: 'Event: New Customer Signup',
      action: 'Send "Welcome & Account Setup" Email',
    },
    workflowB: {
      id: 'wf-promo',
      name: 'Product Promotion Campaign',
      trigger: 'Event: New Customer Signup',
      action: 'Send "Special 20% Discount" Email',
    },
    suggestedFix: 'Add a 24-hour delay condition or merge into a unified onboarding drip sequence.',
  },
  {
    id: 'conf-02',
    title: 'Redundant CRM Lead Assignment',
    status: 'Redundant Action',
    severity: 'low',
    description: 'Lead Qualification workflow and Website Chatbot workflow both attempt to assign lead ownership independently.',
    workflowA: {
      id: 'wf-leads',
      name: 'Lead Qualification & CRM Sync',
      trigger: 'Form: Demo Request',
      action: 'Assign Owner: Round-Robin SDR',
    },
    workflowB: {
      id: 'wf-chat',
      name: 'Intercom Chatbot Router',
      trigger: 'Chat: Qualified Chat Lead',
      action: 'Assign Owner: Territory SDR',
    },
    suggestedFix: 'Use single source of truth routing rule in HubSpot rather than parallel triggers.',
  },
];

export const mockInsights: AIInsight[] = [
  {
    id: 'ins-01',
    workflowName: 'Customer Complaint Automation',
    type: 'optimization',
    title: 'Filter low-priority complaints to reduce manager noise',
    recommendation: 'Your Customer Complaint workflow can reduce unnecessary manager notifications by adding a priority condition (Severity >= High).',
    impact: 'Estimated to reduce notification volume by 42%',
  },
  {
    id: 'ins-02',
    workflowName: 'Invoice Follow-up & Collections',
    type: 'cost_saving',
    title: 'Batch Stripe API webhook inquiries',
    recommendation: 'Combine individual invoice overdue triggers into an automated daily 09:00 AM summary report to optimize API quota usage.',
    impact: 'Reduces monthly webhook calls by ~65%',
  },
];

export const mockDemoCopilotData: CopilotRequirement = {
  trigger: {
    event: 'Customer Complaint Received',
    source: 'Webhook / Email Support Inbox',
  },
  conditions: [
    { field: 'Severity', operator: '==', value: 'High / Critical' },
    { field: 'Account Tier', operator: 'IN', value: '["Enterprise", "Growth"]' },
  ],
  actions: [
    { name: 'Create Urgent Ticket', target: 'Zendesk API', params: 'tag: "priority-escalation", sla: "1h"' },
    { name: 'Notify Escalation Lead', target: 'Slack Webhook', params: 'channel: "#support-escalations", mention: "@oncall-lead"' },
    { name: 'Draft AI Context Response', target: 'FlowMind Copilot', params: 'template: "apology_investigating_v2"' },
  ],
  confidenceScore: 98.4,
  summary: 'Automatically captures incoming customer complaints, filters for high priority and paid accounts, creates a prioritized Zendesk ticket, alerts the team on Slack, and prepares a response draft.',
};

export const promptExamples = [
  'When a customer complaint is received, evaluate priority, create a Zendesk ticket, and alert the manager on Slack.',
  'If an invoice is overdue by 7 days in Stripe, send a polite follow-up email and ping the billing team.',
  'When a new lead fills out the demo request form, enrich data with Clearbit and assign to HubSpot.',
  'When an employee is added in BambooHR, create Google Workspace account and send onboarding checklist.',
];
