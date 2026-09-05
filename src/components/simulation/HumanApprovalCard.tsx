import React from 'react';
import { UserCheck, Check, X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface HumanApprovalCardProps {
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
  canApprove?: boolean;
  userRole?: string;
  userDepartment?: string;
  requiredDepartment?: string;
}

export const HumanApprovalCard: React.FC<HumanApprovalCardProps> = ({
  onApprove,
  onReject,
  isProcessing,
  canApprove = true,
  userRole = 'user',
  userDepartment,
  requiredDepartment = 'Management / Support',
}) => {
  return (
    <div className="glass-card rounded-xl p-5 border border-violet-500/40 bg-gradient-to-r from-violet-950/40 via-[#130f24] to-[#0c0f1d] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 uppercase">
                Checkpoint Paused
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Human-in-the-Loop ({requiredDepartment})
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              Waiting for Human Approval
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canApprove ? (
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {userRole === 'admin'
                ? 'Admin Authorized'
                : `${userDepartment || 'Manager'} Authorized`}
            </span>
          ) : (
            <span className="text-xs font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              View-Only Mode
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        The simulation has safely reached a mandatory manager sign-off checkpoint. In production, this step requires authorization before dispatching downstream notifications and ticket changes.
      </p>

      {/* Action Controls vs View-Only Notice */}
      {canApprove ? (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onApprove}
            loading={isProcessing}
            icon={<Check className="w-4 h-4" />}
            className="w-full sm:flex-1 font-semibold bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40"
          >
            Approve in Simulation
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={onReject}
            disabled={isProcessing}
            icon={<X className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Reject in Simulation
          </Button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-semibold">
                Authorization Required to Approve
              </strong>
              <span className="text-[11px] text-amber-200/80 leading-relaxed block mt-0.5">
                Standard user accounts are restricted to view-only access. Sign in as an <strong>Administrator</strong> or <strong>{requiredDepartment} Manager</strong> in another session to approve.
              </span>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-emerald-300/90 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Listening in real time for manager decision (auto-sync active)...</span>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/60 border border-amber-500/40 text-amber-300 shrink-0 self-start sm:self-auto">
            Action Restricted
          </span>
        </div>
      )}
    </div>
  );
};
