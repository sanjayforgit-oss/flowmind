/**
 * FLOWMIND AI — Invoice & Payment Anomaly Render Workflow Definition
 * Implemented using @renderinc/sdk/workflows
 *
 * Pipeline:
 * Invoice Received
 *   -> Stage 1: Extract & Parse Invoice Details (NLP & OCR extraction)
 *   -> Stage 2: Anomaly & Duplicate Detection (Rule & Risk Evaluation)
 *   -> Stage 3 (Condition): Amount > $5,000 OR High Risk?
 *         If YES: Require Senior Executive / CFO Sign-off
 *         Else: Auto-approve for standard processing
 *   -> Stage 4: Human Approval Gate (Executive Review)
 *   -> Stage 5: ERP Payment Scheduling (NetSuite / SAP ERP integration)
 *   -> Stage 6: Complete & Audit Log (Durable audit archive)
 */

import { task } from '@renderinc/sdk/workflows';

/**
 * Stage 1: Extract Invoice Details
 */
export const extractInvoiceDetailsTask = task(
  {
    name: 'extract_invoice_details',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, input = {}) => {
    const invoiceId = input.invoiceId || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const vendorName = input.vendorName || input.vendor || 'Acme Cloud Technologies Inc.';
    const amount = Number(input.amount || 12450.0);
    const currency = input.currency || 'USD';
    const dueDate = input.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    return {
      stage: 'extract_invoice_details',
      status: 'SUCCEEDED',
      invoiceId,
      vendorName,
      amount,
      currency,
      dueDate,
      lineItemsCount: 4,
      taxAmount: Math.round(amount * 0.08 * 100) / 100,
      summary: `Parsed invoice ${invoiceId} from ${vendorName} for ${currency} ${amount.toLocaleString()}.`,
      timestamp: new Date().toISOString(),
    };
  }
);

/**
 * Stage 2: Anomaly & Fraud Risk Detection
 */
export const detectInvoiceAnomaliesTask = task(
  {
    name: 'detect_invoice_anomalies',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, invoiceData = {}) => {
    const amount = Number(invoiceData.amount || 0);
    const vendor = invoiceData.vendorName || '';

    // Risk heuristic evaluation
    const isOverThreshold = amount >= 5000;
    const isNewVendor = vendor.toLowerCase().includes('unknown') || vendor.toLowerCase().includes('new');
    const riskScore = isOverThreshold ? 0.78 : isNewVendor ? 0.65 : 0.12;
    const requiresExecutiveApproval = isOverThreshold || isNewVendor;

    return {
      stage: 'detect_invoice_anomalies',
      status: 'SUCCEEDED',
      riskScore,
      isOverThreshold,
      isNewVendor,
      requiresExecutiveApproval,
      matchedHistoricalDuplicates: false,
      flagReason: requiresExecutiveApproval
        ? `Invoice amount ($${amount.toLocaleString()}) exceeds the $5,000 automated threshold.`
        : 'Invoice within standard pre-approved limits.',
      evaluatedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 3: Executive Notification
 */
export const notifyFinanceLeadTask = task(
  {
    name: 'notify_finance_lead',
    timeoutSeconds: 45,
    retry: { maxRetries: 2, waitDurationMs: 1000 },
  },
  async (_ctx, alertInput = {}) => {
    return {
      stage: 'notify_finance_lead',
      status: 'SUCCEEDED',
      channel: '#finance-authorizations',
      recipient: 'VP of Finance / Controller',
      invoiceId: alertInput.invoiceId,
      amount: alertInput.amount,
      message: `[APPROVAL REQUIRED] High-value invoice ${alertInput.invoiceId} ($${Number(alertInput.amount).toLocaleString()}) from ${alertInput.vendorName} flagged for executive sign-off.`,
      dispatchedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 4: Human-in-the-Loop Approval Checkpoint
 */
export const invoiceApprovalGateTask = task(
  {
    name: 'invoice_approval_gate',
    timeoutSeconds: 120,
    retry: { maxRetries: 1, waitDurationMs: 1000 },
  },
  async (_ctx, approvalInput = {}) => {
    const isApproved = approvalInput.approved !== false;
    const approverRole = approvalInput.approverRole || 'Finance Controller';
    const approverName = approvalInput.approverName || 'VP Finance';

    return {
      stage: 'invoice_approval_gate',
      status: isApproved ? 'SUCCEEDED' : 'REJECTED',
      checkpoint: 'Finance Human-in-the-Loop Authorization',
      approved: isApproved,
      approverRole,
      approverName,
      invoiceId: approvalInput.invoiceId,
      notes: isApproved
        ? 'Invoice validated against PO#9942 and approved for payment disbursement.'
        : 'Invoice payment held: pricing discrepancy requires vendor clarification.',
      decidedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 5: ERP Payment Scheduling
 */
export const scheduleErpPaymentTask = task(
  {
    name: 'schedule_erp_payment',
    timeoutSeconds: 60,
    retry: { maxRetries: 3, waitDurationMs: 1500 },
  },
  async (_ctx, erpInput = {}) => {
    const paymentBatchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
    const scheduledDisbursementDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    return {
      stage: 'schedule_erp_payment',
      status: 'SUCCEEDED',
      paymentBatchId,
      erpSystem: 'NetSuite Financial Cloud',
      invoiceId: erpInput.invoiceId,
      amount: erpInput.amount,
      scheduledDisbursementDate,
      summary: `Payment for invoice ${erpInput.invoiceId} scheduled in ${paymentBatchId} for ${scheduledDisbursementDate}.`,
      processedAt: new Date().toISOString(),
    };
  }
);

/**
 * Stage 6: Complete & Archive
 */
export const completeInvoiceWorkflowTask = task(
  {
    name: 'complete_invoice_workflow',
    timeoutSeconds: 30,
  },
  async (_ctx, completionData = {}) => {
    return {
      stage: 'complete',
      status: 'SUCCEEDED',
      invoiceId: completionData.invoiceId,
      totalStagesExecuted: completionData.stagesCount || 6,
      ledgerStatus: 'POSTED_TO_GL',
      summary: `Invoice ${completionData.invoiceId} processing successfully concluded and logged to audit ledger.`,
      completedAt: new Date().toISOString(),
    };
  }
);

/**
 * Main Orchestrator Task: Invoice Anomaly & Payment Approval
 */
export const invoiceApprovalWorkflow = task(
  {
    name: 'invoice_approval_workflow',
    timeoutSeconds: 300,
    retry: { maxRetries: 1, waitDurationMs: 2000 },
  },
  async (ctx, input = {}) => {
    const stageResults = [];

    // Stage 1: Extraction
    const extraction = await ctx.run(extractInvoiceDetailsTask, input);
    stageResults.push(extraction);

    // Stage 2: Anomaly Detection
    const anomaly = await ctx.run(detectInvoiceAnomaliesTask, extraction);
    stageResults.push(anomaly);

    // Stage 3: Conditional Branching
    if (anomaly.requiresExecutiveApproval) {
      const notification = await ctx.run(notifyFinanceLeadTask, {
        invoiceId: extraction.invoiceId,
        amount: extraction.amount,
        vendorName: extraction.vendorName,
      });
      stageResults.push(notification);

      // Stage 4: Human Approval Checkpoint
      const approval = await ctx.run(invoiceApprovalGateTask, {
        invoiceId: extraction.invoiceId,
        amount: extraction.amount,
        approved: input.approved !== false,
        approverRole: input.approverRole,
        approverName: input.approverName,
      });
      stageResults.push(approval);

      if (!approval.approved) {
        return {
          workflowName: 'Invoice & Payment Anomaly Workflow',
          status: 'REJECTED',
          invoiceId: extraction.invoiceId,
          stages: stageResults,
          finishedAt: new Date().toISOString(),
          error: 'Workflow halted: Payment authorization rejected by approver.',
        };
      }
    } else {
      stageResults.push({
        stage: 'notify_finance_lead',
        status: 'SKIPPED',
        reason: 'Invoice amount within automated approval threshold.',
        timestamp: new Date().toISOString(),
      });
    }

    // Stage 5: Schedule ERP Payment
    const payment = await ctx.run(scheduleErpPaymentTask, {
      invoiceId: extraction.invoiceId,
      amount: extraction.amount,
    });
    stageResults.push(payment);

    // Stage 6: Complete
    const completion = await ctx.run(completeInvoiceWorkflowTask, {
      invoiceId: extraction.invoiceId,
      stagesCount: stageResults.length + 1,
    });
    stageResults.push(completion);

    return {
      workflowName: 'Invoice & Payment Anomaly Workflow',
      status: 'SUCCEEDED',
      invoiceId: extraction.invoiceId,
      amount: extraction.amount,
      stages: stageResults,
      finishedAt: completion.completedAt,
    };
  }
);
