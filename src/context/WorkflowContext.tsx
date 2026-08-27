import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GeneratedWorkflow, Action, FlowNode, FlowNodeType } from '../types';
import { generateWorkflowFromIntent } from '../services/aiService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { recordAuditEvent, type AuditEvent } from '../services/auditTrailService';

export interface SavedWorkflowMeta {
  id: string;
  name: string;
  description: string;
  category: 'Customer Support' | 'Finance' | 'Sales' | 'HR' | 'Operations' | 'Marketing';
  status: 'draft' | 'validated' | 'ready' | 'active' | 'paused';
  updatedAt: string;
  rawWorkflow: GeneratedWorkflow;
}

interface WorkflowContextValue {
  activeWorkflow: GeneratedWorkflow | null;
  setActiveWorkflow: (wf: GeneratedWorkflow | null, source?: 'user' | 'ai') => void;
  savedWorkflows: SavedWorkflowMeta[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  isSaving: boolean;
  isLoadingWorkflows: boolean;
  fetchUserWorkflows: () => Promise<void>;
  saveCurrentWorkflow: (wfToSave?: GeneratedWorkflow) => Promise<{ success: boolean; error?: string }>;
  loadWorkflowById: (id: string) => Promise<boolean>;
  deleteWorkflowById: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateActiveWorkflowName: (name: string) => void;
  updateNodeTitle: (nodeId: string, title: string) => void;
  updateNodeDetails: (nodeId: string, updates: Partial<FlowNode>) => void;
  deleteNodeById: (nodeId: string) => void;
  addNodeByType: (type: FlowNodeType) => void;
  deleteActionFromActiveWorkflow: (actionId: string) => void;
  addActionToActiveWorkflow: (action: Action) => void;
  recordWorkflowAudit: (
    action: AuditEvent['action'],
    description: string,
    metadata?: Record<string, any>,
    actorType?: 'user' | 'ai'
  ) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'flowmind_saved_workflows';

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [activeWorkflow, setActiveWorkflowState] = useState<GeneratedWorkflow | null>(null);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflowMeta[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  const configured = isSupabaseConfigured();

  // Load initial main demo workflow into memory so the builder is immediately populated
  useEffect(() => {
    if (!activeWorkflow) {
      generateWorkflowFromIntent('customer complaint').then((wf) => {
        setActiveWorkflowState(wf);
      });
    }
  }, []);

  const setActiveWorkflow = (wf: GeneratedWorkflow | null, source: 'user' | 'ai' = 'user') => {
    setActiveWorkflowState(wf);
    if (wf && user && source === 'ai') {
      recordAuditEvent({
        workflowId: wf.id,
        workflowName: wf.name,
        userId: user.id,
        actorType: 'ai',
        actorName: 'FLOWMIND AI',
        action: 'workflow_generated_by_ai',
        description: `FLOWMIND AI synthesized new workflow structure: "${wf.name}" with ${wf.nodes.length} nodes.`,
        metadata: { category: wf.category, nodesCount: wf.nodes.length, confidence: wf.confidence },
      });
    }
  };

  const recordWorkflowAudit = async (
    action: AuditEvent['action'],
    description: string,
    metadata?: Record<string, any>,
    actorType: 'user' | 'ai' = 'user'
  ) => {
    if (!user || !activeWorkflow) return;
    const actorName = actorType === 'ai' ? 'FLOWMIND AI' : profile?.fullName || user.email?.split('@')[0] || 'User';

    await recordAuditEvent({
      workflowId: activeWorkflow.id,
      workflowName: activeWorkflow.name,
      userId: user.id,
      actorType,
      actorName,
      action,
      description,
      metadata,
    });
  };

  // Fetch workflows belonging to current user or all workflows for admin/manager
  const fetchUserWorkflows = useCallback(async () => {
    if (!user) {
      setSavedWorkflows([]);
      return;
    }

    setIsLoadingWorkflows(true);
    const isElevated = profile?.role === 'admin' || profile?.role === 'manager';

    if (!configured) {
      // Local storage fallback for offline demo evaluation
      try {
        const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${user.id}`);
        if (stored) {
          setSavedWorkflows(JSON.parse(stored));
        } else {
          setSavedWorkflows([]);
        }
      } catch {
        setSavedWorkflows([]);
      }
      setIsLoadingWorkflows(false);
      return;
    }

    try {
      let query = supabase
        .from('workflows')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!isElevated) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workflows from Supabase:', error);
        const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${user.id}`);
        if (stored) setSavedWorkflows(JSON.parse(stored));
      } else if (data) {
        const mapped: SavedWorkflowMeta[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          category: item.category || 'Customer Support',
          status: item.status || 'draft',
          updatedAt: item.updated_at,
          rawWorkflow: item.workflow_data,
        }));
        setSavedWorkflows(mapped);
      }
    } catch (err) {
      console.error('Failed to query Supabase workflows:', err);
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [user, profile?.role, configured]);

  useEffect(() => {
    if (user) {
      fetchUserWorkflows();
    }
  }, [user, fetchUserWorkflows]);

  const saveCurrentWorkflow = async (
    wfToSave?: GeneratedWorkflow
  ): Promise<{ success: boolean; error?: string }> => {
    const target = wfToSave || activeWorkflow;
    if (!target) {
      return { success: false, error: 'No active workflow to save.' };
    }

    if (!user) {
      return { success: false, error: 'Please sign in to save workflows.' };
    }

    setIsSaving(true);
    const nowIso = new Date().toISOString();
    const isExisting = savedWorkflows.some((w) => w.id === target.id);
    const actorName = profile?.fullName || user.email?.split('@')[0] || 'User';

    const metaRecord: SavedWorkflowMeta = {
      id: target.id,
      name: target.name,
      description: target.description,
      category: target.category,
      status: target.status,
      updatedAt: nowIso,
      rawWorkflow: target,
    };

    if (!configured) {
      // Local storage persistence
      try {
        const existing = savedWorkflows.filter((w) => w.id !== target.id);
        const updated = [metaRecord, ...existing];
        setSavedWorkflows(updated);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
        setIsSaving(false);

        // Record audit
        recordAuditEvent({
          workflowId: target.id,
          workflowName: target.name,
          userId: user.id,
          actorType: 'user',
          actorName,
          action: isExisting ? 'workflow_updated' : 'workflow_created',
          description: `${actorName} ${isExisting ? 'updated' : 'created'} workflow "${target.name}"`,
          metadata: { status: target.status, nodeCount: target.nodes.length },
        });

        return { success: true };
      } catch (err: any) {
        setIsSaving(false);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase.from('workflows').upsert({
        id: target.id,
        user_id: user.id,
        name: target.name,
        description: target.description,
        category: target.category,
        status: target.status,
        workflow_data: target,
        updated_at: nowIso,
      });

      if (error) {
        setIsSaving(false);
        return { success: false, error: error.message };
      }

      // Update local state list
      const existing = savedWorkflows.filter((w) => w.id !== target.id);
      setSavedWorkflows([metaRecord, ...existing]);
      setIsSaving(false);

      // Record audit
      recordAuditEvent({
        workflowId: target.id,
        workflowName: target.name,
        userId: user.id,
        actorType: 'user',
        actorName,
        action: isExisting ? 'workflow_updated' : 'workflow_created',
        description: `${actorName} ${isExisting ? 'updated' : 'created'} workflow "${target.name}"`,
        metadata: { status: target.status, nodeCount: target.nodes.length },
      });

      return { success: true };
    } catch (err: any) {
      setIsSaving(false);
      return { success: false, error: err.message || 'Unable to save workflow to database.' };
    }
  };

  const loadWorkflowById = async (id: string): Promise<boolean> => {
    const found = savedWorkflows.find((w) => w.id === id);
    if (found) {
      setActiveWorkflowState(found.rawWorkflow);
      setSelectedNodeId(null);
      return true;
    }

    if (configured && user) {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setActiveWorkflowState(data.workflow_data);
          setSelectedNodeId(null);
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  };

  const deleteWorkflowById = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    const target = savedWorkflows.find((w) => w.id === id);
    const targetName = target?.name || 'Workflow';
    const actorName = profile?.fullName || user.email?.split('@')[0] || 'User';

    const updated = savedWorkflows.filter((w) => w.id !== id);
    setSavedWorkflows(updated);

    recordAuditEvent({
      workflowId: id,
      workflowName: targetName,
      userId: user.id,
      actorType: 'user',
      actorName,
      action: 'workflow_deleted',
      description: `${actorName} deleted workflow "${targetName}"`,
    });

    if (!configured) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateActiveWorkflowName = (name: string) => {
    if (!activeWorkflow) return;
    setActiveWorkflowState({
      ...activeWorkflow,
      name,
    });
  };

  const updateNodeTitle = (nodeId: string, title: string) => {
    if (!activeWorkflow) return;
    setActiveWorkflowState({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.map((n) => (n.id === nodeId ? { ...n, title } : n)),
    });
  };

  const updateNodeDetails = (nodeId: string, updates: Partial<FlowNode>) => {
    if (!activeWorkflow) return;
    const targetNode = activeWorkflow.nodes.find((n) => n.id === nodeId);
    const nodeTitle = updates.title || targetNode?.title || 'Node';

    setActiveWorkflowState({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
    });

    if (user) {
      recordAuditEvent({
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        userId: user.id,
        actorType: 'user',
        actorName: profile?.fullName || user.email?.split('@')[0] || 'User',
        action: 'workflow_node_updated',
        description: `Updated configuration for "${nodeTitle}" in "${activeWorkflow.name}"`,
        metadata: { nodeId, updates },
      });
    }
  };

  const deleteNodeById = (nodeId: string) => {
    if (!activeWorkflow) return;
    const nodeToDelete = activeWorkflow.nodes.find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    setActiveWorkflowState({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.filter((n) => n.id !== nodeId),
      actions: activeWorkflow.actions.filter((a) => a.label !== nodeToDelete.title),
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }

    if (user) {
      recordAuditEvent({
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        userId: user.id,
        actorType: 'user',
        actorName: profile?.fullName || user.email?.split('@')[0] || 'User',
        action: 'workflow_node_removed',
        description: `Removed node "${nodeToDelete.title}" from "${activeWorkflow.name}"`,
        metadata: { nodeId, nodeTitle: nodeToDelete.title },
      });
    }
  };

  const addNodeByType = (type: FlowNodeType) => {
    if (!activeWorkflow) return;

    const typeDefaults: Record<FlowNodeType, { title: string; description: string; actionType?: string }> = {
      trigger: {
        title: 'New Event Trigger',
        description: 'Webhook: Ingest external event payload',
      },
      aiAction: {
        title: 'AI Classification',
        description: 'NLP evaluation and smart routing',
      },
      condition: {
        title: 'Policy Condition Rule',
        description: 'Evaluate business logic parameters',
      },
      action: {
        title: 'Automated Action Step',
        description: 'Execute connected service integration',
        actionType: 'Send Email',
      },
      approval: {
        title: 'Manager Approval Checkpoint',
        description: 'Human sign-off required',
        actionType: 'Request Approval',
      },
      end: {
        title: 'Process Completed',
        description: 'Workflow execution concluded',
      },
    };

    const config = typeDefaults[type] || { title: 'New Step', description: 'Action node' };
    const newNodeId = `node-${Date.now()}`;

    const newNode: FlowNode = {
      id: newNodeId,
      type,
      title: config.title,
      description: config.description,
      status: 'ready',
      actionType: config.actionType,
    };

    const newNodes = [...activeWorkflow.nodes];
    const endNodeIndex = newNodes.findIndex((n) => n.type === 'end');
    if (endNodeIndex !== -1 && type !== 'end') {
      newNodes.splice(endNodeIndex, 0, newNode);
    } else {
      newNodes.push(newNode);
    }

    setActiveWorkflowState({
      ...activeWorkflow,
      nodes: newNodes,
    });

    setSelectedNodeId(newNodeId);

    if (user) {
      recordAuditEvent({
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        userId: user.id,
        actorType: 'user',
        actorName: profile?.fullName || user.email?.split('@')[0] || 'User',
        action: 'workflow_node_added',
        description: `Added new ${type} step "${config.title}" to "${activeWorkflow.name}"`,
        metadata: { nodeId: newNodeId, nodeType: type },
      });
    }
  };

  const deleteActionFromActiveWorkflow = (actionId: string) => {
    if (!activeWorkflow) return;
    setActiveWorkflowState({
      ...activeWorkflow,
      actions: activeWorkflow.actions.filter((a) => a.id !== actionId),
    });
  };

  const addActionToActiveWorkflow = (action: Action) => {
    if (!activeWorkflow) return;
    setActiveWorkflowState({
      ...activeWorkflow,
      actions: [...activeWorkflow.actions, action],
    });
  };

  return (
    <WorkflowContext.Provider
      value={{
        activeWorkflow,
        setActiveWorkflow,
        savedWorkflows,
        selectedNodeId,
        setSelectedNodeId,
        isSaving,
        isLoadingWorkflows,
        fetchUserWorkflows,
        saveCurrentWorkflow,
        loadWorkflowById,
        deleteWorkflowById,
        updateActiveWorkflowName,
        updateNodeTitle,
        updateNodeDetails,
        deleteNodeById,
        addNodeByType,
        deleteActionFromActiveWorkflow,
        addActionToActiveWorkflow,
        recordWorkflowAudit,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
