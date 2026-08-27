import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GeneratedWorkflow, Action, FlowNode, FlowNodeType } from '../types';
import { generateWorkflowFromIntent } from '../services/aiService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  setActiveWorkflow: (wf: GeneratedWorkflow | null) => void;
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
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'flowmind_saved_workflows';

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [activeWorkflow, setActiveWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflowMeta[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  const configured = isSupabaseConfigured();

  // Load initial main demo workflow into memory so the builder is immediately populated
  useEffect(() => {
    if (!activeWorkflow) {
      generateWorkflowFromIntent('customer complaint').then((wf) => {
        setActiveWorkflow(wf);
      });
    }
  }, []);

  // Fetch workflows belonging to current user
  const fetchUserWorkflows = useCallback(async () => {
    if (!user) {
      setSavedWorkflows([]);
      return;
    }

    setIsLoadingWorkflows(true);

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
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching workflows from Supabase:', error);
        // Fallback to local storage
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
  }, [user, configured]);

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
      return { success: true };
    } catch (err: any) {
      setIsSaving(false);
      return { success: false, error: err.message || 'Unable to save workflow to database.' };
    }
  };

  const loadWorkflowById = async (id: string): Promise<boolean> => {
    const found = savedWorkflows.find((w) => w.id === id);
    if (found) {
      setActiveWorkflow(found.rawWorkflow);
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
          setActiveWorkflow(data.workflow_data);
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

    const updated = savedWorkflows.filter((w) => w.id !== id);
    setSavedWorkflows(updated);

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
    setActiveWorkflow({
      ...activeWorkflow,
      name,
    });
  };

  const updateNodeTitle = (nodeId: string, title: string) => {
    if (!activeWorkflow) return;
    setActiveWorkflow({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.map((n) => (n.id === nodeId ? { ...n, title } : n)),
    });
  };

  const updateNodeDetails = (nodeId: string, updates: Partial<FlowNode>) => {
    if (!activeWorkflow) return;
    setActiveWorkflow({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
    });
  };

  const deleteNodeById = (nodeId: string) => {
    if (!activeWorkflow) return;
    const nodeToDelete = activeWorkflow.nodes.find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    setActiveWorkflow({
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.filter((n) => n.id !== nodeId),
      actions: activeWorkflow.actions.filter((a) => a.label !== nodeToDelete.title),
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
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
        title: 'AI Intent Analyzer',
        description: 'LLM NLP reasoning on payload attributes',
      },
      condition: {
        title: 'Policy Condition Branch',
        description: 'Evaluate business logic criteria',
      },
      action: {
        title: 'Execute Action',
        description: 'Dispatches task to connected service API',
        actionType: 'Create Ticket',
      },
      approval: {
        title: 'Human Approval Step',
        description: 'Requires manager verification to continue',
      },
      end: {
        title: 'Workflow Complete',
        description: 'Execution pipeline concluded successfully',
      },
    };

    const config = typeDefaults[type] || typeDefaults.action;
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      title: config.title,
      description: config.description,
      status: 'ready',
      actionType: config.actionType,
    };

    const endNodeIndex = activeWorkflow.nodes.findIndex((n) => n.type === 'end');
    const updatedNodes = [...activeWorkflow.nodes];
    if (endNodeIndex !== -1 && type !== 'end') {
      updatedNodes.splice(endNodeIndex, 0, newNode);
    } else {
      updatedNodes.push(newNode);
    }

    const updatedActions =
      type === 'action' || type === 'approval'
        ? [
            ...activeWorkflow.actions,
            {
              id: `act-${Date.now()}`,
              type: type === 'approval' ? 'approval' : 'action',
              label: newNode.title,
              description: newNode.description,
            },
          ]
        : activeWorkflow.actions;

    setActiveWorkflow({
      ...activeWorkflow,
      nodes: updatedNodes,
      actions: updatedActions,
    });

    setSelectedNodeId(newNode.id);
  };

  const deleteActionFromActiveWorkflow = (actionId: string) => {
    if (!activeWorkflow) return;
    const actionToDelete = activeWorkflow.actions.find((a) => a.id === actionId);
    const actionLabel = actionToDelete?.label;

    setActiveWorkflow({
      ...activeWorkflow,
      actions: activeWorkflow.actions.filter((a) => a.id !== actionId),
      nodes: activeWorkflow.nodes.filter((n) => !(n.type === 'action' && n.title === actionLabel)),
    });
  };

  const addActionToActiveWorkflow = (newAction: Action) => {
    if (!activeWorkflow) return;

    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: (newAction.type === 'approval' ? 'approval' : 'action'),
      title: newAction.label,
      description: newAction.description,
      status: 'ready',
      actionType: newAction.label,
    };

    const endNodeIndex = activeWorkflow.nodes.findIndex((n) => n.type === 'end');
    const updatedNodes = [...activeWorkflow.nodes];
    if (endNodeIndex !== -1) {
      updatedNodes.splice(endNodeIndex, 0, newNode);
    } else {
      updatedNodes.push(newNode);
    }

    setActiveWorkflow({
      ...activeWorkflow,
      actions: [...activeWorkflow.actions, newAction],
      nodes: updatedNodes,
    });

    setSelectedNodeId(newNode.id);
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
