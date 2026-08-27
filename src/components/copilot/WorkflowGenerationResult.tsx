import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, RotateCcw, ExternalLink } from 'lucide-react';
import type { GeneratedWorkflow } from '../../types';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface WorkflowGenerationResultProps {
  workflow: GeneratedWorkflow;
  onRegenerate: () => void;
}

export const WorkflowGenerationResult: React.FC<WorkflowGenerationResultProps> = ({
  workflow,
  onRegenerate,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleOpenWorkflow = () => {
    showToast('Workflow ready for review.', 'success');
    navigate('/workflows', { state: { workflowId: workflow.id, openBuilder: true } });
  };

  const handleValidate = () => {
    showToast('Validating workflow against static rules and trigger conflicts...', 'info');
    navigate('/conflicts');
  };

  return (
    <div className="glass-card rounded-xl border border-emerald-500/30 p-5 bg-[#0b141a]/90 shadow-xl space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Workflow generated successfully
          </h3>
          <p className="text-[11px] text-emerald-300/80 font-mono">
            Pipeline structure synthesized and ready for visual layout
          </p>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Workflow Name</span>
          <span className="text-slate-200 font-semibold truncate block" title={workflow.name}>
            {workflow.name}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Total Steps</span>
          <span className="text-indigo-300 font-bold">
            {workflow.nodes.length} Steps
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Status</span>
          <span className="text-amber-300 font-semibold capitalize">
            {workflow.status}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenWorkflow}
          icon={<ExternalLink className="w-4 h-4" />}
          className="w-full sm:flex-1 font-semibold"
        >
          Open Workflow
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleValidate}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          className="w-full sm:w-auto text-xs"
        >
          Validate Workflow
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={onRegenerate}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          className="w-full sm:w-auto text-xs"
          title="Re-run synthesis"
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
};
