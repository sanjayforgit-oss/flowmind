import React, { useState } from 'react';
import {
  Plus,
  ArrowDown,
  UserCheck,
  Mail,
  Ticket,
  Bell,
  Database,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import type { GeneratedWorkflow, Action } from '../../types';
import { WorkflowNodeItem } from './WorkflowNodeItem';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface VisualWorkflowCanvasProps {
  workflow: GeneratedWorkflow;
  onUpdateNodeTitle: (nodeId: string, title: string) => void;
  onDeleteActionNode: (nodeId: string) => void;
  onAddAction: (action: Action) => void;
}

const PREDEFINED_ACTIONS = [
  { label: 'Send Email', type: 'email', description: 'Delivers automated transactional email via SendGrid', icon: Mail },
  { label: 'Create Ticket', type: 'ticket', description: 'Creates support ticket in Zendesk with SLA timer', icon: Ticket },
  { label: 'Notify Manager', type: 'notification', description: 'Pings on-call lead in Slack #support-escalations', icon: Bell },
  { label: 'Update CRM', type: 'crm', description: 'Syncs customer record and pipeline stage in HubSpot', icon: Database },
  { label: 'Send Slack Message', type: 'notification', description: 'Posts message to designated team collaboration channel', icon: MessageSquare },
  { label: 'Request Approval', type: 'approval', description: 'Pauses pipeline execution pending human sign-off', icon: UserCheck },
];

export const VisualWorkflowCanvas: React.FC<VisualWorkflowCanvasProps> = ({
  workflow,
  onUpdateNodeTitle,
  onDeleteActionNode,
  onAddAction,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const { showToast } = useToast();

  const handleSelectAction = (item: typeof PREDEFINED_ACTIONS[0]) => {
    const newAction: Action = {
      id: `act-${Date.now()}`,
      type: item.type,
      label: item.label,
      description: item.description,
    };
    onAddAction(newAction);
    setIsAddMenuOpen(false);
    showToast(`Added action: "${item.label}"`, 'success');
  };

  const yesBranchNode = workflow.nodes.find((n) => n.branch === 'yes');

  return (
    <div className="glass-card rounded-xl border border-white/[0.08] p-6 bg-[#080b12] min-h-[640px] flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background canvas grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Top Toolbar */}
      <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Visual Execution DAG
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({workflow.nodes.length} Nodes)
          </span>
        </div>

        {/* Add Action Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Action Step
            <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
          </Button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1.5 border-b border-white/5">
                Predefined Actions
              </div>
              <div className="space-y-1 pt-1">
                {PREDEFINED_ACTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleSelectAction(item)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent transition-colors text-left cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Graph Canvas */}
      <div className="w-full flex flex-col items-center space-y-4 py-4 relative z-10 max-w-xl">
        {/* Render nodes with sleek connectors */}
        {workflow.nodes.map((node, index) => {
          // If this is the condition node and has branching
          if (node.type === 'condition' && yesBranchNode) {
            return (
              <React.Fragment key={node.id}>
                <WorkflowNodeItem
                  node={node}
                  onUpdateTitle={onUpdateNodeTitle}
                  onDelete={onDeleteActionNode}
                />

                {/* Branch Connector Visualizer: YES / NO */}
                <div className="w-full flex items-start justify-center gap-6 py-2">
                  {/* YES Branch */}
                  <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      YES (Priority High)
                    </div>
                    <WorkflowNodeItem
                      node={yesBranchNode}
                      onUpdateTitle={onUpdateNodeTitle}
                      onDelete={onDeleteActionNode}
                    />
                  </div>

                  {/* NO Branch */}
                  <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-slate-900/30 border border-white/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 mb-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      NO (Standard Priority)
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#0e131d] border border-white/5 text-xs text-slate-400 text-center font-mono w-full">
                      Continue standard pipeline
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-white/20 relative">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 absolute -bottom-2 -left-1.5" />
                </div>
              </React.Fragment>
            );
          }

          // Skip if this is the YES branch node rendered inside the branching wrapper above
          if (node.branch === 'yes') {
            return null;
          }

          const isLast = index === workflow.nodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              <WorkflowNodeItem
                node={node}
                onUpdateTitle={onUpdateNodeTitle}
                onDelete={onDeleteActionNode}
              />

              {!isLast && (
                <div className="w-0.5 h-6 bg-white/20 relative my-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 absolute -bottom-2 -left-1.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Canvas Footer Bar */}
      <div className="w-full pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono relative z-10">
        <span>Deterministic Flow Builder</span>
        <span className="text-emerald-400">Zero Execution Latency</span>
      </div>
    </div>
  );
};
