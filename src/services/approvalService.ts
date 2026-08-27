import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { recordAuditEvent } from './auditTrailService';
import { createNotification } from './notificationService';
import type { Department, UserRole } from '../context/AuthContext';

export type ApprovalStatus = 'pending' | 'accepted' | 'rejected' | 'approved';

export interface SimulationApprovalRequest {
  id: string;
  workflow_name: string;
  employee_name: string;
  department: Department;
  status: ApprovalStatus;
  requester_id?: string;
  approver_id?: string;
  approver_role?: string;
  approved_by?: string;
  approved_by_role?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_by_role?: string;
  rejected_at?: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_APPROVALS = 'flowmind_simulation_approval_requests';

const DEFAULT_SAMPLE_REQUESTS: SimulationApprovalRequest[] = [
  {
    id: 'req-hr-01',
    workflow_name: 'Employee Leave Request',
    employee_name: 'Mohanraj',
    department: 'HR',
    status: 'pending',
    details: { leave_days: 4, type: 'Annual Leave', reason: 'Family vacation' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'req-sales-01',
    workflow_name: 'VIP Customer Discount Exception',
    employee_name: 'Alex Johnson',
    department: 'Sales',
    status: 'pending',
    details: { client: 'Acme Corp', discount_pct: 25, deal_value: '$120,000' },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'req-sup-01',
    workflow_name: 'Emergency Priority SLA Escalation',
    employee_name: 'Sarah Connor',
    department: 'Support',
    status: 'pending',
    details: { ticket_id: 'ZD-9982', priority: 'URGENT', sla_hours: 1 },
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

/**
 * Fetch simulation approval requests based on authenticated user role and department
 */
export async function fetchApprovalRequests(
  role: UserRole,
  userDepartment?: Department,
  userId?: string
): Promise<SimulationApprovalRequest[]> {
  if (!isSupabaseConfigured()) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_APPROVALS);
      const all: SimulationApprovalRequest[] = stored ? JSON.parse(stored) : DEFAULT_SAMPLE_REQUESTS;

      if (role === 'admin') return all;
      if (role === 'manager') {
        return all.filter(
          (r) => !userDepartment || r.department.toLowerCase() === userDepartment.toLowerCase()
        );
      }
      return all;
    } catch {
      return DEFAULT_SAMPLE_REQUESTS;
    }
  }

  try {
    let query = supabase
      .from('simulation_approval_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter based on authenticated role
    if (role === 'manager') {
      if (userDepartment) {
        query = query.or(
          `department.ilike.${userDepartment},requester_id.eq.${userId || '00000000-0000-0000-0000-000000000000'}`
        );
      }
    } else if (role === 'user') {
      if (userId) {
        query = query.or(`requester_id.eq.${userId},employee_name.ilike.Mohanraj`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error querying simulation_approval_requests from Supabase, using local fallback:', error);
      const stored = localStorage.getItem(LOCAL_STORAGE_APPROVALS);
      const all: SimulationApprovalRequest[] = stored ? JSON.parse(stored) : DEFAULT_SAMPLE_REQUESTS;
      if (role === 'admin') return all;
      if (role === 'manager') {
        return all.filter(
          (r) => !userDepartment || r.department.toLowerCase() === userDepartment.toLowerCase()
        );
      }
      return all;
    }

    if (data && data.length > 0) {
      return data as SimulationApprovalRequest[];
    }

    // Return empty list if manager/user genuinely has 0 requests
    return [];
  } catch (err) {
    console.error('Exception fetching simulation approvals:', err);
    return [];
  }
}

/**
 * Create a single persistent simulation approval request
 */
export async function createApprovalRequest(params: {
  workflowName: string;
  employeeName: string;
  department: Department;
  userId?: string;
  details?: Record<string, any>;
}): Promise<SimulationApprovalRequest> {
  const { workflowName, employeeName, department, userId, details } = params;
  const nowIso = new Date().toISOString();
  const id = `req-${Date.now()}`;

  const newReq: SimulationApprovalRequest = {
    id,
    workflow_name: workflowName,
    employee_name: employeeName,
    department,
    status: 'pending',
    requester_id: userId,
    details: details || {},
    created_at: nowIso,
    updated_at: nowIso,
  };

  // Local storage save for offline resiliency
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_APPROVALS);
    const list: SimulationApprovalRequest[] = stored ? JSON.parse(stored) : DEFAULT_SAMPLE_REQUESTS;
    localStorage.setItem(LOCAL_STORAGE_APPROVALS, JSON.stringify([newReq, ...list]));
  } catch {
    // ignore
  }

  // Real Supabase insert
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('simulation_approval_requests')
        .insert({
          workflow_name: workflowName,
          employee_name: employeeName,
          department,
          status: 'pending',
          requester_id: userId,
          details: details || {},
        })
        .select()
        .single();

      if (!error && data) {
        newReq.id = data.id;
      }
    } catch (err) {
      console.warn('Could not insert approval request in Supabase:', err);
    }
  }

  // Record audit log for creation
  if (userId) {
    await recordAuditEvent({
      workflowName,
      userId,
      actorType: 'user',
      actorName: employeeName,
      action: 'workflow_executed',
      description: `USER (${employeeName}) submitted simulation approval request for "${workflowName}" (${department}).`,
      metadata: { requestId: newReq.id, department, status: 'pending', details },
    });
  }

  return newReq;
}

/**
 * Update request status (Accept / Reject) with Supabase persistence, user notification, and audit trail
 */
export async function updateApprovalStatus(params: {
  requestId: string;
  newStatus: 'accepted' | 'rejected' | 'approved';
  workflowName: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  approverDepartment?: Department;
  requesterId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const {
    requestId,
    newStatus,
    workflowName,
    approverId,
    approverName,
    approverRole,
    approverDepartment,
    requesterId,
  } = params;

  const nowIso = new Date().toISOString();
  const standardizedStatus: ApprovalStatus = newStatus === 'accepted' || newStatus === 'approved' ? 'accepted' : 'rejected';

  // 1. Local storage update
  let targetRequesterId = requesterId;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_APPROVALS);
    const list: SimulationApprovalRequest[] = stored ? JSON.parse(stored) : DEFAULT_SAMPLE_REQUESTS;
    const target = list.find((r) => r.id === requestId);
    if (target) {
      if (target.status !== 'pending') {
        return { success: false, error: 'This request has already been processed.' };
      }
      targetRequesterId = target.requester_id || targetRequesterId;
    }

    const updated = list.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: standardizedStatus,
            approver_id: approverId,
            approver_role: approverRole,
            approved_by: standardizedStatus === 'accepted' ? approverName : undefined,
            approved_by_role: standardizedStatus === 'accepted' ? approverRole : undefined,
            approved_at: standardizedStatus === 'accepted' ? nowIso : undefined,
            rejected_by: standardizedStatus === 'rejected' ? approverName : undefined,
            rejected_by_role: standardizedStatus === 'rejected' ? approverRole : undefined,
            rejected_at: standardizedStatus === 'rejected' ? nowIso : undefined,
            updated_at: nowIso,
          }
        : r
    );
    localStorage.setItem(LOCAL_STORAGE_APPROVALS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // 2. Real Supabase update with concurrency protection (AND status = 'pending')
  if (isSupabaseConfigured()) {
    try {
      const updatePayload: Record<string, any> = {
        status: standardizedStatus,
        approver_id: approverId,
        approver_role: approverRole,
        updated_at: nowIso,
      };

      if (standardizedStatus === 'accepted') {
        updatePayload.approved_by = approverName;
        updatePayload.approved_by_role = approverRole;
        updatePayload.approved_at = nowIso;
      } else {
        updatePayload.rejected_by = approverName;
        updatePayload.rejected_by_role = approverRole;
        updatePayload.rejected_at = nowIso;
      }

      const { data, error } = await supabase
        .from('simulation_approval_requests')
        .update(updatePayload)
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Could not update simulation_approval_requests in Supabase:', error);
      } else if (data) {
        targetRequesterId = data.requester_id || targetRequesterId;
      }
    } catch (err) {
      console.error('Failed to update approval status in Supabase:', err);
    }
  }

  // 3. Trigger persistent in-app notification for the User
  const roleLabel =
    approverRole === 'admin'
      ? 'Administrator'
      : `${approverDepartment || 'HR'} Manager`;

  const isApproved = standardizedStatus === 'accepted';
  const notificationTitle = isApproved
    ? 'Simulation Request Approved'
    : 'Simulation Request Rejected';

  const notificationMsg = isApproved
    ? `Your "${workflowName}" simulation request was approved by ${approverName} (${roleLabel}).`
    : `Your "${workflowName}" simulation request was rejected by ${approverName} (${roleLabel}).`;

  if (targetRequesterId) {
    await createNotification({
      userId: targetRequesterId,
      requestId,
      type: isApproved ? 'approval' : 'rejection',
      title: notificationTitle,
      message: notificationMsg,
    });
  }

  // 4. Record official audit log event
  const actionText = isApproved ? 'Simulation Request Approved' : 'Simulation Request Rejected';

  await recordAuditEvent({
    workflowName,
    userId: approverId,
    actorType: 'user',
    actorName: approverName,
    action: 'workflow_updated',
    description: `${roleLabel} (${approverName}) ${actionText} for "${workflowName}".`,
    metadata: {
      requestId,
      status: standardizedStatus,
      role: approverRole,
      department: approverDepartment,
      requesterId: targetRequesterId,
    },
  });

  return { success: true };
}
