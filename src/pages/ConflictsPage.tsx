import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { HealthScoreCard } from '../components/validation/HealthScoreCard';
import { ValidationIssueCard } from '../components/validation/ValidationIssueCard';
import { CrossWorkflowConflictCard } from '../components/conflicts/CrossWorkflowConflictCard';
import { validateWorkflow } from '../services/validationService';
import { detectConflicts, EXISTING_DEMO_WORKFLOWS } from '../services/conflictService';
import type { DetectedConflict } from '../services/conflictService';
import { useWorkflow } from '../context/WorkflowContext';
import { useToast } from '../context/ToastContext';

export const ConflictsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'validation' | 'conflicts'>('validation');
  const [isScanning, setIsScanning] = useState(false);
  const [ignoredConflictIds, setIgnoredConflictIds] = useState<string[]>([]);

  const { activeWorkflow, savedWorkflows, setSelectedNodeId } = useWorkflow();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Run validation engine on active workflow
  const validationResult = useMemo(() => {
    if (!activeWorkflow) return null;
    return validateWorkflow(activeWorkflow);
  }, [activeWorkflow]);

  // Combine user's saved workflows with demo catalog for conflict checking
  const existingForConflict = useMemo(() => {
    const userOtherWorkflows = savedWorkflows
      .filter((sw) => sw.id !== activeWorkflow?.id)
      .map((sw) => ({
        id: sw.id,
        name: sw.name,
        category: sw.category,
        trigger: sw.rawWorkflow?.trigger?.label || 'Custom Trigger',
        actions: sw.rawWorkflow?.actions?.map((a: any) => a.label) || ['Process Action'],
        status: 'active' as const,
      }));

    return userOtherWorkflows.length > 0 ? userOtherWorkflows : EXISTING_DEMO_WORKFLOWS;
  }, [savedWorkflows, activeWorkflow]);

  // Run conflict detection engine on active workflow
  const conflictResult = useMemo(() => {
    if (!activeWorkflow) return null;
    return detectConflicts(activeWorkflow, existingForConflict);
  }, [activeWorkflow, existingForConflict]);

  const activeConflicts = useMemo(() => {
    if (!conflictResult) return [];
    return conflictResult.conflicts.filter((c) => !ignoredConflictIds.includes(c.id));
  }, [conflictResult, ignoredConflictIds]);

  const handleFixNode = (nodeId?: string) => {
    if (nodeId) {
      setSelectedNodeId(nodeId);
      showToast('Opening Workflow Builder to inspect selected node...', 'info');
    } else {
      showToast('Opening Workflow Builder to review pipeline structure...', 'info');
    }
    navigate('/workflows', { state: { openBuilder: true } });
  };

  const handleDismissConflict = (id: string) => {
    setIgnoredConflictIds((prev) => [...prev, id]);
  };

  const handleReScan = () => {
    setIsScanning(true);
    showToast('Re-evaluating static validation and trigger conflict graph...', 'info');
    setTimeout(() => {
      setIsScanning(false);
      setIgnoredConflictIds([]);
      showToast('Verification and conflict analysis complete.', 'success');
    }, 600);
  };

  if (!activeWorkflow) {
    return (
      <div className="py-16 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          No active workflow to validate
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          Generate an intelligent workflow with AI Copilot first to run static validation and collision detection.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/copilot')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Open AI Copilot
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={activeTab === 'validation' ? 'Workflow Validation' : 'Conflict Detection'}
        description={
          activeTab === 'validation'
            ? 'Inspect automation logic, gate configurations, and structural completeness before simulation or deployment.'
            : 'Identify overlapping triggers, race conditions, and duplicate email/ticket dispatches across workflows.'
        }
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            {activeTab === 'validation'
              ? `Score: ${validationResult?.score || 0}/100`
              : `${activeConflicts.length} Overlaps Detected`}
          </span>
        }
        action={
          <div className="flex items-center gap-2.5">
            {/* Tab Switcher */}
            <div className="flex items-center rounded-lg bg-white/[0.04] p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('validation')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'validation'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Workflow Validation
              </button>

              <button
                onClick={() => setActiveTab('conflicts')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'conflicts'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Conflict Detection
                {activeConflicts.length > 0 && (
                  <span className="w-4 h-4 rounded-full text-[10px] font-mono bg-black/40 text-amber-200 flex items-center justify-center font-bold">
                    {activeConflicts.length}
                  </span>
                )}
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              loading={isScanning}
              onClick={handleReScan}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Re-Scan
            </Button>
          </div>
        }
      />

      {/* TAB 1: WORKFLOW VALIDATION */}
      {activeTab === 'validation' && validationResult && (
        <div className="space-y-6">
          {/* Top Health Score Card */}
          <HealthScoreCard validationResult={validationResult} />

          {/* Critical Issues & Warnings Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Validation Inspection Results
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({validationResult.issues.length} Items Found)
                </span>
              </div>
            </div>

            {validationResult.issues.length > 0 ? (
              <div className="space-y-3">
                {validationResult.issues.map((issue) => (
                  <ValidationIssueCard
                    key={issue.id}
                    issue={issue}
                    onFixNode={handleFixNode}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-10 text-center border border-emerald-500/20 bg-emerald-950/10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Workflow Logic is Complete & Valid
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  No structural issues, orphan nodes, or unconfigured action parameters detected.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/simulation')}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Proceed to Simulation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-WORKFLOW CONFLICTS */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#131929] to-[#0c111e] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Cross-Workflow Static Collision Inspector
                </h4>
                <p className="text-xs text-slate-300">
                  Detects concurrent trigger overlap and redundant actions before publishing to production.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div className="text-slate-400">
                Active Automations: <span className="text-slate-200 font-bold">{EXISTING_DEMO_WORKFLOWS.length}</span>
              </div>
              <div className="text-amber-400 font-bold">
                ⚠ {activeConflicts.length} Potential Overlaps Found
              </div>
            </div>
          </div>

          {/* Conflict Cards List */}
          {activeConflicts.length > 0 ? (
            <div className="space-y-4">
              {activeConflicts.map((conflict: DetectedConflict) => (
                <CrossWorkflowConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  onDismiss={handleDismissConflict}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center border border-emerald-500/20 bg-emerald-950/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Zero Trigger Overlaps Detected
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Current workflow does not collide with existing customer support, sales, or finance pipelines.
              </p>
              <Button variant="outline" size="sm" onClick={handleReScan}>
                Re-Run Collision Analysis
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
