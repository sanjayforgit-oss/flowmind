import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  ShieldCheck,
  Bot,
  User,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { AuditTrailTimeline } from '../components/audit/AuditTrailTimeline';
import { fetchWorkflowAuditLogs, type AuditEvent } from '../services/auditTrailService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuditTrailPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState<'all' | 'ai' | 'user'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadAuditLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const records = await fetchWorkflowAuditLogs(user.id, undefined, 100);
      setLogs(records);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleRefresh = async () => {
    await loadAuditLogs();
    showToast('Audit trail refreshed from Supabase', 'info');
  };

  const filteredLogs = logs.filter((log) => {
    if (actorFilter !== 'all' && log.actor_type !== actorFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  const totalEvents = logs.length;
  const aiEvents = logs.filter((l) => l.actor_type === 'ai').length;
  const userEvents = logs.filter((l) => l.actor_type === 'user').length;
  const uniqueWorkflows = new Set(logs.map((l) => l.workflow_name)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Workflow Audit Trail"
        description="Immutable governance log tracking AI generation, structural modifications, approvals, and dry-run executions."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Enterprise Governance
          </span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Logs
          </Button>
        }
      />

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-2xl font-bold text-white tracking-tight">{totalEvents}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
              AI Actions
            </span>
            <span className="text-2xl font-bold text-cyan-300 tracking-tight">{aiEvents}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
              Human Actions
            </span>
            <span className="text-2xl font-bold text-violet-300 tracking-tight">{userEvents}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
              Audited Workflows
            </span>
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {uniqueWorkflows}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Actor:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setActorFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                actorFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Actors
            </button>
            <button
              onClick={() => setActorFilter('ai')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                actorFilter === 'ai'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3 h-3" />
              FLOWMIND AI
            </button>
            <button
              onClick={() => setActorFilter('user')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                actorFilter === 'user'
                  ? 'bg-violet-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              Human Users
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All Actions</option>
            <option value="workflow_generated_by_ai">AI Workflow Generation</option>
            <option value="workflow_created">Workflow Created</option>
            <option value="workflow_updated">Workflow Updated</option>
            <option value="workflow_node_added">Step Added</option>
            <option value="workflow_node_updated">Step Configured</option>
            <option value="workflow_node_removed">Step Removed</option>
            <option value="workflow_executed">Workflow Executed</option>
            <option value="workflow_deleted">Workflow Deleted</option>
          </select>
        </div>
      </div>

      {/* Main Audit Trail Timeline */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#090d16]/90 shadow-2xl">
        <AuditTrailTimeline logs={filteredLogs} isLoading={isLoading} />
      </div>
    </div>
  );
};
