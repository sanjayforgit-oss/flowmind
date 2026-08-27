import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

interface SimulationHeaderProps {
  workflowName: string;
  isRunning: boolean;
  isCompleted: boolean;
  isWaitingApproval: boolean;
  onRunSimulation: () => void;
  onReset: () => void;
}

export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
  workflowName,
  isRunning,
  isCompleted,
  isWaitingApproval,
  onRunSimulation,
  onReset,
}) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
      {/* Title & Safety Badge */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <button
            onClick={() => navigate('/workflows', { state: { openBuilder: true } })}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer mr-2"
            title="Back to Visual Workflow Builder"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Builder
          </button>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Simulation Only
          </span>
        </div>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          {workflowName} — Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Test your automation safely before deployment. <strong className="text-slate-300">No real business actions will be performed.</strong>
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isRunning}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onRunSimulation}
          disabled={isRunning || isCompleted}
          loading={isRunning}
          icon={<Play className="w-4 h-4 fill-current" />}
          className="font-semibold"
        >
          {isRunning
            ? 'Executing Steps...'
            : isWaitingApproval
            ? 'Waiting Approval'
            : isCompleted
            ? 'Simulation Complete'
            : '▶ Run Simulation'}
        </Button>
      </div>
    </div>
  );
};
