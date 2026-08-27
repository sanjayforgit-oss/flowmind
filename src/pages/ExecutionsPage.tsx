import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { mockExecutions } from '../data/mockData';
import type { Execution, ExecutionStatus } from '../types';
import { useToast } from '../context/ToastContext';

export const ExecutionsPage: React.FC = () => {
  const [executions] = useState<Execution[]>(mockExecutions);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const { showToast } = useToast();

  const filteredExecutions = executions.filter((exec) => {
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    const matchesSearch =
      exec.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exec.triggerEvent.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRefresh = () => {
    showToast('Refreshed execution streams', 'info');
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
        description="Real-time audit log of all automated workflow executions, latencies, payloads, and step failures."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            Live Stream
          </span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card rounded-xl p-3 border border-white/[0.08]">
        <div className="flex-1 max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by ID, workflow name, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'success', 'running', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize whitespace-nowrap cursor-pointer ${
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

      {/* Executions Table */}
      <div className="glass-card rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Workflow & ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Trigger Event</th>
                <th className="py-3.5 px-4">Steps Completed</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Started</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredExecutions.map((exec) => (
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

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exec.status)}
                      <StatusBadge status={exec.status} />
                    </div>
                  </td>

                  {/* Trigger Event */}
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <Modal
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          title={`Execution Details: ${selectedExecution.id}`}
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
                <span className="text-slate-400 block text-[10px]">Total Latency</span>
                <span className="text-slate-200 font-semibold">{selectedExecution.duration}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Trigger</span>
                <span className="text-indigo-300 truncate block">{selectedExecution.triggerEvent}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Steps</span>
                <span className="text-slate-200 font-semibold">{selectedExecution.stepsCompleted}/{selectedExecution.stepsTotal} Completed</span>
              </div>
            </div>

            {/* Steps Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Step-by-Step Trace
              </span>

              <div className="space-y-2">
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
                      <p className="text-[11px] text-slate-400 font-mono pl-7">
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
