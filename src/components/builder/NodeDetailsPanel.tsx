import React, { useState, useEffect } from 'react';
import {
  Layers,
  Trash2,
  Check,
  Zap,
  Sparkles,
  Filter,
  Cpu,
  UserCheck,
  CheckCircle2,
  MousePointerClick,
} from 'lucide-react';
import type { FlowNode, NodeStatus } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../context/ToastContext';

interface NodeDetailsPanelProps {
  selectedNode: FlowNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  onDeleteNode: (nodeId: string) => void;
}

const ACTION_OPTIONS = [
  'Send Email',
  'Create Ticket',
  'Notify Manager',
  'Update CRM',
  'Send Slack Message',
  'Request Approval',
];

const STATUS_OPTIONS: Array<{ value: NodeStatus; label: string }> = [
  { value: 'ready', label: '● Ready' },
  { value: 'idle', label: '○ Idle' },
  { value: 'running', label: '● Running' },
  { value: 'success', label: '✓ Success' },
  { value: 'warning', label: '⚠ Warning' },
  { value: 'error', label: '✕ Error' },
  { value: 'pending', label: '◌ Pending' },
];

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<NodeStatus>('ready');
  const [actionType, setActionType] = useState('Create Ticket');
  const { showToast } = useToast();

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title);
      setDescription(selectedNode.description);
      setStatus(selectedNode.status);
      setActionType(selectedNode.actionType || 'Create Ticket');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="glass-card rounded-xl border border-white/[0.08] p-6 bg-[#0b0e17] flex flex-col items-center justify-center h-full text-center shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
          <MousePointerClick className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono mb-1">
          Node Details
        </h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Select a node on the canvas to inspect or edit its configuration, parameters, and routing rules.
        </p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNode(selectedNode.id, {
      title,
      description,
      status,
      actionType,
    });
    showToast(`Updated "${title}" configuration.`, 'success');
  };

  const handleDelete = () => {
    onDeleteNode(selectedNode.id);
    showToast(`Deleted node "${selectedNode.title}".`, 'info');
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'aiAction':
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case 'condition':
        return <Filter className="w-3.5 h-3.5 text-amber-400" />;
      case 'approval':
        return <UserCheck className="w-3.5 h-3.5 text-violet-400" />;
      case 'end':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="glass-card rounded-xl border border-white/[0.08] p-5 bg-[#0b0e17] flex flex-col justify-between h-full shadow-xl">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Node Details
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] font-mono text-slate-300">
            {getNodeIcon(selectedNode.type)}
            <span className="uppercase">{selectedNode.type}</span>
          </div>
        </div>

        {/* Node Type Display */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Node Type</span>
          <div className="text-xs font-semibold text-indigo-300 bg-indigo-950/20 border border-indigo-500/20 p-2.5 rounded-lg capitalize">
            {selectedNode.type === 'aiAction' ? 'AI Intent Action' : selectedNode.type}
          </div>
        </div>

        {/* Node Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase block">Node Name</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node title..."
            className="text-xs py-1.5"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase block">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this step accomplishes..."
            className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 p-2.5 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed"
          />
        </div>

        {/* Action Type Selection for Action / Approval nodes */}
        {(selectedNode.type === 'action' || selectedNode.type === 'approval') && (
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 uppercase block">
              Action Integration
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-indigo-500/60 font-mono"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase block">Node Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NodeStatus)}
            className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-indigo-500/60 font-mono"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={<Check className="w-3.5 h-3.5" />}
          className="w-full mt-2"
        >
          Apply Changes
        </Button>
      </form>

      {/* Delete node button */}
      {selectedNode.type !== 'trigger' && selectedNode.type !== 'end' && (
        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            className="w-full text-xs"
          >
            Delete Node
          </Button>
        </div>
      )}
    </div>
  );
};
