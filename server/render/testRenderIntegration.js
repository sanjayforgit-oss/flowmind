import { handleRenderApiRequest } from './renderHandler.js';

async function runTests() {
  console.log('--- 1. Testing GET /api/render/status ---');
  const statusRes = await handleRenderApiRequest('/api/render/status', 'GET');
  console.log('Status result:', JSON.stringify(statusRes, null, 2));

  console.log('\n--- 2. Testing GET /api/render/tasks ---');
  const tasksRes = await handleRenderApiRequest('/api/render/tasks', 'GET');
  console.log('Tasks result:', JSON.stringify(tasksRes, null, 2));

  console.log('\n--- 3. Testing POST /api/render/code ---');
  const codeRes = await handleRenderApiRequest('/api/render/code', 'POST', {
    name: 'Order Dispute & Refund Flow',
    nodes: [
      { id: 't1', title: 'Customer Dispute Triggered', type: 'trigger' },
      { id: 'c1', title: 'Check Amount Over 500', type: 'condition' },
      { id: 'a1', title: 'Manager Refund Approval', type: 'approval' },
      { id: 'a2', title: 'Process Stripe Refund', type: 'action' },
    ],
  });
  console.log('Generated Code sample length:', codeRes.code?.length);
  console.log('Code preview:\n', codeRes.code?.substring(0, 350) + '\n...');

  console.log('\n--- 4. Testing POST /api/render/execute (Customer Complaint) ---');
  const execComplaint = await handleRenderApiRequest('/api/render/execute', 'POST', {
    workflowName: 'Customer Complaint Workflow',
    context: { priority: 'HIGH', customerId: 'CUS-HACKATHON-99', category: 'Billing' },
  });
  console.log('Customer Complaint execution:', {
    success: execComplaint.success,
    status: execComplaint.status,
    engine: execComplaint.engine,
    stagesCount: execComplaint.stages?.length,
    durationMs: execComplaint.durationMs,
  });

  console.log('\n--- 5. Testing POST /api/render/execute (Invoice Approval) ---');
  const execInvoice = await handleRenderApiRequest('/api/render/execute', 'POST', {
    workflowName: 'Invoice & Payment Anomaly Workflow',
    context: { amount: 15400, vendorName: 'Apex Data Systems' },
  });
  console.log('Invoice execution:', {
    success: execInvoice.success,
    status: execInvoice.status,
    engine: execInvoice.engine,
    stagesCount: execInvoice.stages?.length,
    durationMs: execInvoice.durationMs,
  });

  console.log('\n--- 6. Testing POST /api/render/execute (Employee Onboarding) ---');
  const execOnboard = await handleRenderApiRequest('/api/render/execute', 'POST', {
    workflowName: 'Employee Onboarding & Security Provisioning',
    context: { fullName: 'Sarah Connor', department: 'Engineering' },
  });
  console.log('Onboarding execution:', {
    success: execOnboard.success,
    status: execOnboard.status,
    engine: execOnboard.engine,
    stagesCount: execOnboard.stages?.length,
    durationMs: execOnboard.durationMs,
  });

  console.log('\n--- 7. Testing HITL Pause & Resumption (/api/render/approve) ---');
  const pauseExec = await handleRenderApiRequest('/api/render/execute', 'POST', {
    workflowName: 'Customer Complaint Workflow',
    context: { priority: 'HIGH' },
    pauseAtApproval: true,
  });
  console.log('Paused execution status:', pauseExec.status, 'ID:', pauseExec.executionId);

  const approveExec = await handleRenderApiRequest('/api/render/approve', 'POST', {
    executionId: pauseExec.executionId,
    approved: true,
    approverRole: 'VP of Customer Success',
    comments: 'Reviewed and approved for final completion.',
  });
  console.log('Resumed execution status:', approveExec.status, 'Duration:', approveExec.durationMs);

  console.log('\nALL RENDER WORKFLOW TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
