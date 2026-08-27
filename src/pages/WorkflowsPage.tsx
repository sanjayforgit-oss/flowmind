import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Sparkles,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { WorkflowHeader } from '../components/builder/WorkflowHeader';
import { InteractiveWorkflowCanvas } from '../components/builder/InteractiveWorkflowCanvas';
import { NodeDetailsPanel } from '../components/builder/NodeDetailsPanel';
import { mockWorkflows } from '../data/mockData';
import { useWorkflow } from '../context/WorkflowContext';
import type { SavedWorkflowMeta } from '../context/WorkflowContext';
import { useToast } from '../context/ToastContext';
import type { Workflow } from '../types';

export const WorkflowsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialOpenBuilder = (location.state as { openBuilder?: boolean })?.openBuilder ?? true;
  const [viewMode, setViewMode] = useState<'builder' | 'library' | 'empty_preview'>(
    initialOpenBuilder ? 'builder' : 'library'
  );

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Workflow['category']>('Customer Support');
  const [newDesc, setNewDesc] = useState('');

  const {
    activeWorkflow,
    savedWorkflows,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeDetails,
    deleteNodeById,
    addNodeByType,
    loadWorkflowById,
    deleteWorkflowById,
    saveCurrentWorkflow,
  } = useWorkflow();

  const { showToast } = useToast();

  useEffect(() => {
    if ((location.state as { openBuilder?: boolean })?.openBuilder) {
      setViewMode('builder');
    }
  }, [location.state]);

  const categories = ['All', 'Customer Support', 'Finance', 'Sales', 'HR'];

  // Combine user's saved Supabase workflows with template workflows
  const combinedWorkflows: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    updatedAtText: string;
    isSavedUserWorkflow: boolean;
    rawWorkflow?: any;
    tags?: string[];
  }> = [
    ...savedWorkflows.map((sw: SavedWorkflowMeta) => ({
      id: sw.id,
      name: sw.name,
      description: sw.description,
      category: sw.category,
      status: sw.status,
      updatedAtText: new Date(sw.updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isSavedUserWorkflow: true,
      rawWorkflow: sw.rawWorkflow,
      tags: ['Custom', 'Persisted'],
    })),
    ...mockWorkflows
      .filter((mw) => !savedWorkflows.some((sw) => sw.id === mw.id))
      .map((mw) => ({
        id: mw.id,
        name: mw.name,
        description: mw.description,
        category: mw.category,
        status: mw.status,
        updatedAtText: mw.lastRun,
        isSavedUserWorkflow: false,
        tags: mw.tags,
      })),
  ];

  const filteredWorkflows = combinedWorkflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || wf.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedNode = activeWorkflow?.nodes.find((n) => n.id === selectedNodeId) || null;

  const handleOpenWorkflow = async (wfItem: (typeof combinedWorkflows)[0]) => {
    if (wfItem.isSavedUserWorkflow && wfItem.rawWorkflow) {
      await loadWorkflowById(wfItem.id);
      setViewMode('builder');
      showToast(`Loaded "${wfItem.name}" into Visual Builder`, 'success');
    } else {
      setViewMode('builder');
      showToast(`Opened "${wfItem.name}" template in Visual Builder`, 'info');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteWorkflowId) return;

    const res = await deleteWorkflowById(deleteWorkflowId);
    if (res.success) {
      showToast('Workflow deleted.', 'info');
    } else {
      showToast(res.error || 'Failed to delete workflow.', 'error');
    }
    setDeleteWorkflowId(null);
  };

  const handleCreateNewWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Workflow title is required', 'warning');
      return;
    }

    const newGeneratedWf = {
      id: `wf-custom-${Date.now()}`,
      name: newTitle,
      description: newDesc || 'Custom automation flow.',
      intent: `Automate ${newTitle}`,
      category: newCategory,
      trigger: {
        type: 'webhook',
        label: 'Webhook Trigger Detected',
        description: 'Ingests external trigger event',
      },
      conditions: [],
      actions: [
        {
          id: `act-${Date.now()}`,
          type: 'action',
          label: 'Process Action',
          description: 'Executes automated pipeline logic',
        },
      ],
      nodes: [
        {
          id: `n1-${Date.now()}`,
          type: 'trigger' as const,
          title: 'Webhook Trigger Detected',
          description: 'Ingests external trigger payload',
          status: 'ready' as const,
        },
        {
          id: `n2-${Date.now()}`,
          type: 'action' as const,
          title: 'Process Action',
          description: 'Executes automated pipeline logic',
          status: 'ready' as const,
        },
        {
          id: `n3-${Date.now()}`,
          type: 'end' as const,
          title: 'Complete',
          description: 'Pipeline completed successfully',
          status: 'ready' as const,
        },
      ],
      status: 'draft' as const,
      confidence: 90,
      createdAt: new Date().toISOString(),
      estimatedExecution: '1.2 sec',
    };

    await saveCurrentWorkflow(newGeneratedWf);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setViewMode('builder');
    showToast(`Workflow "${newTitle}" created and saved!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={viewMode === 'builder' ? 'Visual Workflow Builder' : 'Workflow Library'}
        description={
          viewMode === 'builder'
            ? 'Interactive visual graph of triggers, conditional branches, and automated actions.'
            : 'Build, manage, and monitor automated business logic pathways stored in Supabase.'
        }
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            {viewMode === 'builder' ? 'Visual Builder' : `${combinedWorkflows.length} Workflows`}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg bg-white/[0.04] p-1 border border-white/10">
              <button
                onClick={() => setViewMode('builder')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'builder'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visual Builder
              </button>
              <button
                onClick={() => setViewMode('library')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'library'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Workflow Library ({savedWorkflows.length})
              </button>
              <button
                onClick={() => setViewMode('empty_preview')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'empty_preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Empty State
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Workflow
            </Button>
          </div>
        }
      />

      {/* VIEW 1: Visual Workflow Builder */}
      {viewMode === 'builder' && (
        activeWorkflow ? (
          <div className="space-y-6">
            {/* 1. Workflow Header */}
            <WorkflowHeader workflow={activeWorkflow} />

            {/* 2. Visual Canvas (8 cols) + Node Details Panel (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <InteractiveWorkflowCanvas
                  workflow={activeWorkflow}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onAddNode={addNodeByType}
                />
              </div>

              <div className="lg:col-span-4 h-[660px]">
                <NodeDetailsPanel
                  selectedNode={selectedNode}
                  onUpdateNode={updateNodeDetails}
                  onDeleteNode={deleteNodeById}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No workflow selected
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Generate a workflow with AI Copilot to start building your automated pipeline.
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
        )
      )}

      {/* VIEW 2: Workflow Library List with Supabase Workflows */}
      {viewMode === 'library' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card rounded-xl p-3 border border-white/[0.08]">
            <div className="flex-1 max-w-sm">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Search workflows by keyword or integration..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => handleOpenWorkflow(wf)}
                  className="glass-card glass-card-hover rounded-xl p-5 relative flex flex-col justify-between cursor-pointer group border border-white/[0.08]"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {wf.category}
                        </span>
                        {wf.isSavedUserWorkflow && (
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                            Supabase Saved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-amber-300 capitalize bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {wf.status}
                        </span>

                        {wf.isSavedUserWorkflow && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteWorkflowId(wf.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete workflow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5 line-clamp-1">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {wf.description}
                    </p>

                    {/* Tags */}
                    {wf.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {wf.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated: {wf.updatedAtText}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkflow(wf);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Open Builder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                title="No workflows found"
                description="Create your first automation with FlowMind AI or adjust your search filter."
                actionText="Create Workflow"
                onAction={() => setIsCreateModalOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Empty State View */}
      {viewMode === 'empty_preview' && (
        <div className="py-12 animate-in fade-in duration-200">
          <EmptyState
            title="Create your first intelligent workflow"
            description="Turn natural language intent into connected automated pipelines. Connect Webhooks, CRMs, Support Desks, and Communication tools in minutes."
            actionText="Create Workflow"
            onAction={() => setIsCreateModalOpen(true)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteWorkflowId && (
        <Modal
          isOpen={Boolean(deleteWorkflowId)}
          onClose={() => setDeleteWorkflowId(null)}
          title="Delete Workflow?"
          subtitle="This action cannot be undone and will permanently remove this workflow from your account."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                All associated DAG nodes, triggers, condition branches, and configuration states will be deleted.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteWorkflowId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Workflow
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Workflow Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workflow"
        subtitle="Define triggers, targets, and business automation scope"
      >
        <form onSubmit={handleCreateNewWorkflow} className="space-y-4">
          <Input
            label="Workflow Name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Real-time Churn Alert & Retention Task"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Workflow['category'])}
              className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 p-2.5 focus:outline-none focus:border-indigo-500/60"
            >
              <option value="Customer Support">Customer Support</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Description / Business Intent
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe trigger condition and expected automation actions..."
              className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 placeholder-slate-400 p-3 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Workflow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
