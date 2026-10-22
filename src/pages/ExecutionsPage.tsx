import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Server,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { mockExecutions } from '../data/mockData';
import type { Execution, ExecutionStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { fetchLiveExecutionsFromSupabase } from '../services/renderWorkflowService';

export const ExecutionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [realExecutions, setRealExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [engineFilter, setEngineFilter] = useState<'all' | 'render' | 'simulation'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const loadExecutions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const isElevated = profile?.role === 'admin' || profile?.role === 'manager';
      const liveData = await fetchLiveExecutionsFromSupabase(user.id, isElevated);
      setRealExecutions(liveData);
    } catch (err) {
      console.error('[EXECUTIONS PAGE] Error loading executions from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  // Combine real database records with mock sample templates if real list is short
  const allExecutions: Execution[] = [
    ...realExecutions,
    ...mockExecutions.filter((m) => !realExecutions.some((r) => r.id === m.id)),
  ];

  const filteredExecutions = allExecutions.filter((exec) => {
    const isRender =
      exec.id.startsWith('rn-exec') ||
      exec.workflowName.toLowerCase().includes('render') ||
      (exec.triggerEvent || '').toLowerCase().includes('render');

    const matchesEngine =
      engineFilter === 'all'
        ? true
        : engineFilter === 'render'
        ? isRender
        : !isRender;

    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    const matchesSearch =
      exec.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exec.triggerEvent || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEngine && matchesStatus && matchesSearch;
  });

  const handleRefresh = async () => {
    await loadExecutions();
    showToast('Refreshed execution logs from Supabase & Render', 'info');
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execution Logs & Telemetry"
        description="Real-time telemetry of durable Render Workflows executions and safe sandbox dry-runs persisted in Supabase."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Telemetry Stream
          </span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 glass-card rounded-xl p-3 border border-white/[0.08]">
        <div className="flex-1 max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by ID, workflow name, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>

        {/* Engine & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Engine Filter */}
          <div className="flex items-center rounded-lg bg-white/[0.04] p-1 border border-white/10">
            <button
              onClick={() => setEngineFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                engineFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Engines
            </button>
            <button
              onClick={() => setEngineFilter('render')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                engineFilter === 'render'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3 h-3 text-cyan-300" />
              Render Workflows
            </button>
            <button
              onClick={() => setEngineFilter('simulation')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                engineFilter === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              Simulations
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'success', 'running', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all capitalize whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executions Table */}
      <div className="glass-card rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Workflow & Execution ID</th>
                <th className="py-3.5 px-4">Engine</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Trigger Event</th>
                <th className="py-3.5 px-4">Steps Completed</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Started</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredExecutions.length > 0 ? (
                filteredExecutions.map((exec) => {
                  const isRender =
                    exec.id.startsWith('rn-exec') ||
                    exec.workflowName.toLowerCase().includes('render') ||
                    (exec.triggerEvent || '').toLowerCase().includes('render');

                  return (
                    <tr
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Workflow & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                          {exec.workflowName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {exec.id}
                        </div>
                      </td>

                      {/* Engine */}
                      <td className="py-3.5 px-4">
                        {isRender ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                            <Server className="w-3 h-3 text-cyan-400" />
                            Render Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950/30 text-amber-300 border border-amber-500/20">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Simulation
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exec.status)}
                          <StatusBadge status={exec.status} />
                        </div>
                      </td>

                      {/* Trigger Event */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-300 font-mono text-[11px]">
                        {exec.triggerEvent}
                      </td>

                      {/* Steps Progress */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-slate-200 font-semibold">
                          {exec.stepsCompleted}
                        </span>
                        <span className="text-slate-400"> / {exec.stepsTotal} steps</span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {exec.duration}
                      </td>

                      {/* Started */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {exec.startedAt}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center text-xs text-slate-400 group-hover:text-indigo-400 transition-colors font-medium">
                          Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No executions found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <Modal
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          title={`Execution Trace: ${selectedExecution.id}`}
          subtitle={`Workflow: ${selectedExecution.workflowName}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Meta summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <span className="text-slate-200 font-semibold capitalize">{selectedExecution.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Latency</span>
                <span className="text-slate-200 font-semibold">{selectedExecution.duration}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Engine / Trigger</span>
                <span className="text-indigo-300 truncate block">{selectedExecution.triggerEvent}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Stages Completed</span>
                <span className="text-slate-200 font-semibold">
                  {selectedExecution.stepsCompleted}/{selectedExecution.stepsTotal} Completed
                </span>
              </div>
            </div>

            {/* Steps / Stages Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Execution Stage Trace
              </span>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {selectedExecution.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border text-xs ${
                      step.status === 'failed'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : 'bg-[#0d121d] border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center font-mono text-[10px] text-slate-400">
                          {idx + 1}
                        </span>
                        <span>{step.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {step.durationMs > 0 ? `${step.durationMs}ms` : '0ms'}
                      </span>
                    </div>

                    {step.outputSummary && (
                      <p className="text-[11px] text-slate-400 font-mono pl-7 truncate">
                        Result: {step.outputSummary}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-[11px] text-rose-400 font-mono pl-7 mt-1">
                        {step.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <Button variant="primary" size="sm" onClick={() => setSelectedExecution(null)}>
                Close Trace
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
