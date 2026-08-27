import React, { useState } from 'react';
import {
  Zap,
  Filter,
  Cpu,
  UserCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import type { FlowNode, FlowNodeType } from '../../types';

interface WorkflowNodeItemProps {
  node: FlowNode;
  onUpdateTitle?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export const WorkflowNodeItem: React.FC<WorkflowNodeItemProps> = ({
  node,
  onUpdateTitle,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(node.title);

  const getNodeColor = (type: FlowNodeType) => {
    switch (type) {
      case 'trigger':
        return {
          border: 'border-cyan-500/40 hover:border-cyan-500/70',
          bg: 'bg-gradient-to-r from-cyan-950/30 to-[#0e1624]',
          iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          Icon: Zap,
        };
      case 'condition':
        return {
          border: 'border-amber-500/40 hover:border-amber-500/70',
          bg: 'bg-gradient-to-r from-amber-950/30 to-[#141822]',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          Icon: Filter,
        };
      case 'approval':
        return {
          border: 'border-violet-500/40 hover:border-violet-500/70',
          bg: 'bg-gradient-to-r from-violet-950/30 to-[#121422]',
          iconBg: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
          badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
          Icon: UserCheck,
        };
      case 'end':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-500/70',
          bg: 'bg-gradient-to-r from-emerald-950/30 to-[#0e171b]',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          Icon: CheckCircle2,
        };
      case 'action':
      default:
        return {
          border: 'border-indigo-500/40 hover:border-indigo-500/70',
          bg: 'bg-gradient-to-r from-indigo-950/30 to-[#0f1524]',
          iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
          badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          Icon: Cpu,
        };
    }
  };

  const { border, bg, iconBg, badge, Icon } = getNodeColor(node.type);

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`relative w-full max-w-lg rounded-xl border p-4 shadow-lg transition-all duration-200 group ${bg} ${border}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${badge}`}
            >
              {node.type}
            </span>
            <span className="text-[10px] font-mono text-slate-500 capitalize">
              Status: {node.status}
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 bg-black/50 border border-indigo-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedTitle(node.title);
                  setIsEditing(false);
                }}
                className="p-1 rounded bg-white/10 text-slate-300 hover:bg-white/20 cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <h4 className="text-sm font-semibold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
              {node.title}
            </h4>
          )}

          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Action icons (Edit & Delete) */}
        {!isEditing && node.type !== 'trigger' && node.type !== 'end' && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onUpdateTitle && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Edit node title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (node.type === 'action' || node.type === 'approval') && (
              <button
                onClick={() => onDelete(node.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete action node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
