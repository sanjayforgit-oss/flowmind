import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { HeroPromptCard } from '../components/dashboard/HeroPromptCard';
import { StatCard } from '../components/common/StatCard';
import { WorkflowCard } from '../components/dashboard/WorkflowCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { statMetrics, mockWorkflows } from '../data/mockData';
import type { Workflow } from '../types';
import { useToast } from '../context/ToastContext';

import { SimulationApprovalRequestsCard } from '../components/dashboard/SimulationApprovalRequestsCard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) {
      showToast('Please enter a workflow name', 'warning');
      return;
    }
    showToast(`Workflow "${newWfName}" scaffold created in library.`, 'success');
    setIsCreateModalOpen(false);
    setNewWfName('');
    setNewWfDesc('');
    navigate('/workflows');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Hero Prompt Card */}
      <HeroPromptCard />

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statMetrics.map((metric, idx) => (
          <StatCard key={idx} metric={metric} />
        ))}
      </div>

      {/* 3. Simulation Approval Requests Section (Role-Based) */}
      <SimulationApprovalRequestsCard />

      {/* 4. Recent Workflows Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Recent Workflows</h2>
            <p className="text-xs text-slate-400">
              Active automated business processes configured for your team
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/workflows')}
            >
              View All
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Workflow
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {mockWorkflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onEdit={(w) => setSelectedWorkflow(w)}
            />
          ))}
        </div>
      </div>

      {/* 4. Two Column Split: Recent Activity & AI Insight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RecentActivity />
        </div>
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AIInsightCard />
        </div>
      </div>

      {/* Workflow Quick Details Modal */}
      {selectedWorkflow && (
        <Modal
          isOpen={!!selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          title={selectedWorkflow.name}
          subtitle={`Category: ${selectedWorkflow.category} • Status: ${selectedWorkflow.status}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              {selectedWorkflow.description}
            </p>

            <div className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono space-y-1.5">
              <div className="text-slate-400">Trigger: <span className="text-indigo-300">{selectedWorkflow.trigger}</span></div>
              <div className="text-slate-400">Total Steps: <span className="text-slate-200">{selectedWorkflow.actionsCount} Actions</span></div>
              <div className="text-slate-400">Total Executions: <span className="text-slate-200">{selectedWorkflow.totalExecutions.toLocaleString()}</span></div>
              <div className="text-slate-400">Success SLA: <span className="text-emerald-400">{selectedWorkflow.successRate}%</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedWorkflow(null);
                  navigate('/simulation', { state: { selectedWorkflowId: selectedWorkflow.id } });
                }}
              >
                Launch Simulator
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Workflow Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workflow"
        subtitle="Initialize a new automated business process schema"
      >
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <Input
            label="Workflow Name"
            value={newWfName}
            onChange={(e) => setNewWfName(e.target.value)}
            placeholder="e.g. Lead Qualification & Enrichment"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Description / Business Intent
            </label>
            <textarea
              rows={3}
              value={newWfDesc}
              onChange={(e) => setNewWfDesc(e.target.value)}
              placeholder="Describe the trigger event and intended actions..."
              className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-400 p-3 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
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
              Create Workflow Shell
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
