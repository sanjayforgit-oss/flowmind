import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Play, Edit3, Check, Layers } from 'lucide-react';
import type { GeneratedWorkflow } from '../../types';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface WorkflowDetailsPanelProps {
  workflow: GeneratedWorkflow;
  onUpdateName?: (newName: string) => void;
}

export const WorkflowDetailsPanel: React.FC<WorkflowDetailsPanelProps> = ({
  workflow,
  onUpdateName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(workflow.name);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim() && onUpdateName) {
      onUpdateName(nameInput.trim());
      showToast('Workflow name updated', 'success');
    }
    setIsEditingName(false);
  };

  const handleValidate = () => {
    showToast('Redirecting to Conflict & Static Verification engine...', 'info');
    navigate('/conflicts');
  };

  const handleSimulate = () => {
    showToast(`Loading simulation runtime for "${workflow.name}"...`, 'info');
    navigate('/simulation');
  };

  return (
    <div className="glass-card rounded-xl border border-white/[0.08] p-5 bg-[#0b0e17] flex flex-col justify-between h-full shadow-xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Workflow Details
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 capitalize">
            {workflow.status}
          </span>
        </div>

        {/* Workflow Name */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Workflow Name</span>
            {!isEditingName && onUpdateName && (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-mono"
              >
                <Edit3 className="w-3 h-3" /> Rename
              </button>
            )}
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 bg-black/60 border border-indigo-500/50 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <h3 className="text-sm font-bold text-white tracking-tight">{workflow.name}</h3>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Description</span>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#0e131d] p-2.5 rounded-lg border border-white/5">
            {workflow.description}
          </p>
        </div>

        {/* Trigger Summary */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Trigger Event</span>
          <div className="text-xs font-semibold text-cyan-300 bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded-lg">
            {workflow.trigger.label}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">Conditions</span>
            <span className="text-amber-300 font-bold text-base">{workflow.conditions.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">Actions</span>
            <span className="text-indigo-300 font-bold text-base">{workflow.actions.length}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Validate & Simulate */}
      <div className="pt-5 mt-5 border-t border-white/[0.06] space-y-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleSimulate}
          icon={<Play className="w-4 h-4 fill-current" />}
          className="w-full"
        >
          Simulate Workflow
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleValidate}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          className="w-full text-xs"
        >
          Validate Workflow
        </Button>
      </div>
    </div>
  );
};
