import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Play, Save, Clock, Workflow as WorkflowIcon, CheckCircle2, Server } from 'lucide-react';
import type { GeneratedWorkflow } from '../../types';
import { Button } from '../common/Button';
import { useWorkflow } from '../../context/WorkflowContext';
import { useToast } from '../../context/ToastContext';
import { RenderExecutionModal } from '../simulation/RenderExecutionModal';

interface WorkflowHeaderProps {
  workflow: GeneratedWorkflow;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ workflow }) => {
  const navigate = useNavigate();
  const { saveCurrentWorkflow, isSaving, recordWorkflowAudit, setActiveWorkflow } = useWorkflow();
  const { showToast } = useToast();
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);

  const handleValidate = () => {
    showToast('Redirecting to Static Verification & Conflict Detection...', 'info');
    navigate('/conflicts');
  };

  const handleSimulate = () => {
    showToast(`Loading simulation testbed for "${workflow.name}"...`, 'info');
    navigate('/simulation');
  };

  const handleSave = async () => {
    const res = await saveCurrentWorkflow(workflow);
    if (res.success) {
      showToast('Workflow saved successfully.', 'success');
    } else {
      showToast(res.error || 'Unable to save workflow. Please try again.', 'error');
    }
  };

  const handlePublish = async () => {
    const publishedWf: GeneratedWorkflow = {
      ...workflow,
      status: 'ready',
    };
    setActiveWorkflow(publishedWf, 'user');
    await saveCurrentWorkflow(publishedWf);
    await recordWorkflowAudit(
      'workflow_published',
      `Published "${workflow.name}" to Ready state for production execution.`,
      { nodesCount: workflow.nodes.length, status: 'ready' }
    );
    showToast(`Workflow "${workflow.name}" published to production!`, 'success');
  };

  return (
    <>
      <div className="glass-card rounded-xl p-5 border border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <WorkflowIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Workflow Builder
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                workflow.status === 'ready'
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
              }`}
            >
              {workflow.status}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {workflow.name}
          </h2>

          {/* Compact Metadata Strip */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-slate-400">
            <span>
              Steps: <strong className="text-slate-200">{workflow.nodes.length}</strong>
            </span>
            <span>•</span>
            <span>
              Conditions: <strong className="text-amber-300">{workflow.conditions.length}</strong>
            </span>
            <span>•</span>
            <span>
              Actions: <strong className="text-indigo-300">{workflow.actions.length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-cyan-400" />
              Est. execution: <strong className="text-cyan-300">{workflow.estimatedExecution || '2.1 sec'}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons: Save, Publish, Validate, Simulate, Run on Render */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePublish}
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Publish
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleValidate}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Validate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulate}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Simulate
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRenderModalOpen(true)}
            icon={<Server className="w-3.5 h-3.5 text-indigo-200" />}
            className="bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-md shadow-indigo-600/20"
          >
            Run on Render
          </Button>
        </div>
      </div>

      {/* Render Workflows Execution & Code Modal */}
      <RenderExecutionModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        workflowId={workflow.id}
        workflowName={workflow.name}
        workflowData={workflow}
        simulationContext={{
          workflowName: workflow.name,
          category: workflow.category || 'Customer Support',
          priority: 'HIGH',
          customerId: 'CUS-1042',
          customerTier: 'Enterprise',
        }}
      />
    </>
  );
};
