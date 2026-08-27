import React from 'react';
import { UserCheck, Check, X } from 'lucide-react';
import { Button } from '../common/Button';

interface HumanApprovalCardProps {
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export const HumanApprovalCard: React.FC<HumanApprovalCardProps> = ({
  onApprove,
  onReject,
  isProcessing,
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
                Human-in-the-Loop
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              Waiting for Human Approval
            </h3>
          </div>
        </div>

        <span className="text-xs font-mono text-violet-300 bg-violet-950/50 border border-violet-500/30 px-2.5 py-1 rounded-md">
          Simulation Paused Safely
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        The simulation has safely reached a mandatory manager sign-off checkpoint. In production, this step requires authorization before sending the drafted message to the customer.
      </p>

      {/* Action Buttons */}
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
    </div>
  );
};
