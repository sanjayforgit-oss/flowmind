import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  fetchApprovalRequests,
  updateApprovalStatus,
  type SimulationApprovalRequest,
} from '../../services/approvalService';

export const SimulationApprovalRequestsCard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const role = profile?.role || 'user';
  const department = profile?.department;
  const approverName = profile?.fullName || user?.email?.split('@')[0] || 'User';

  const [requests, setRequests] = useState<SimulationApprovalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const data = await fetchApprovalRequests(role, department, user?.id);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load approval requests:', err);
    } finally {
      setLoading(false);
    }
  }, [role, department, user?.id, authLoading]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      loadRequests();
    }
  }, [authLoading, loadRequests]);

  // Real-time listener for live synchronization across User, Manager, and Admin
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('realtime_approval_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'simulation_approval_requests' },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const handleAction = async (
    requestId: string,
    newStatus: 'accepted' | 'rejected',
    wfName: string,
    reqUserId?: string
  ) => {
    if (role === 'user') return;
    setProcessingId(requestId);

    try {
      const res = await updateApprovalStatus({
        requestId,
        newStatus,
        workflowName: wfName,
        approverId: user?.id || 'admin',
        approverName,
        approverRole: role,
        approverDepartment: department,
        requesterId: reqUserId,
      });

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: newStatus,
                  approved_by: newStatus === 'accepted' ? approverName : undefined,
                  approved_by_role: newStatus === 'accepted' ? role : undefined,
                  rejected_by: newStatus === 'rejected' ? approverName : undefined,
                  rejected_by_role: newStatus === 'rejected' ? role : undefined,
                }
              : r
          )
        );
        showToast(
          `Request ${newStatus === 'accepted' ? 'Approved 🟢' : 'Rejected 🔴'} successfully.`,
          newStatus === 'accepted' ? 'success' : 'warning'
        );
      } else {
        showToast(res.error || 'Could not process request.', 'warning');
      }
    } catch {
      showToast('Could not process approval action.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: SimulationApprovalRequest['status']) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            🟢 Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            🔴 Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            🟡 Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#0c101d] space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              {role === 'admin'
                ? 'Global Simulation Approval Queue (All Departments)'
                : role === 'manager'
                ? `${department || 'HR'} Department Simulation Approval Queue`
                : 'My Simulation Requests'}
            </span>

            <span
              className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                role === 'admin'
                  ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                  : role === 'manager'
                  ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                  : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30'
              }`}
            >
              {role === 'manager' ? `${department || 'HR'} Manager` : role}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {role === 'admin'
              ? 'Administrator governance queue: Review and authorize human checkpoints across the platform.'
              : role === 'manager'
              ? `Manager authorization queue: Review and authorize ${department || 'department'} workflow checkpoints.`
              : 'Track real-time approval status and decisions for your submitted automation workflow simulations.'}
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer self-start sm:self-auto font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Requests List */}
      {loading || authLoading ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading approval requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-mono">
          No pending simulation approval requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isAuthorized =
              role === 'admin' ||
              (role === 'manager' &&
                (!department || req.department.toLowerCase() === department.toLowerCase()));

            const isPending = req.status === 'pending';

            return (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {req.workflow_name}
                    </h4>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {req.department}
                    </span>

                    {getStatusBadge(req.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>
                      Employee: <strong className="text-slate-200">{req.employee_name}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {req.approved_by && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-300">
                          Approved by: <strong>{req.approved_by} ({req.approved_by_role || 'Manager'})</strong>
                        </span>
                      </>
                    )}
                    {req.rejected_by && (
                      <>
                        <span>•</span>
                        <span className="text-rose-300">
                          Rejected by: <strong>{req.rejected_by} ({req.rejected_by_role || 'Manager'})</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {req.details && Object.keys(req.details).length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                      {Object.entries(req.details).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-[#0e1320] border border-white/5">
                          <span className="text-slate-500 uppercase">{k}:</span>{' '}
                          <span className="text-indigo-300">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  {role !== 'user' && isAuthorized && isPending ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(req.id, 'accepted', req.workflow_name, req.requester_id)}
                        disabled={processingId === req.id}
                        className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40 text-xs px-3 font-semibold"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Accept
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction(req.id, 'rejected', req.workflow_name, req.requester_id)}
                        disabled={processingId === req.id}
                        className="text-xs px-3"
                        icon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      {isPending ? (
                        <span className="text-amber-400">Waiting for Manager/Admin Review</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Final Decision Recorded</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
