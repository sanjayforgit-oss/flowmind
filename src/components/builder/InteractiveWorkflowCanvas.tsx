import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Zap,
  Sparkles,
  Filter,
  Cpu,
  UserCheck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { GeneratedWorkflow, FlowNodeType } from '../../types';
import { CustomFlowNode } from './CustomFlowNode';
import type { CustomNodeData } from './CustomFlowNode';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface InteractiveWorkflowCanvasProps {
  workflow: GeneratedWorkflow;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (type: FlowNodeType) => void;
}

const nodeTypes = {
  customNode: CustomFlowNode,
};

const ADD_NODE_OPTIONS: Array<{ type: FlowNodeType; label: string; icon: any }> = [
  { type: 'trigger', label: 'Trigger', icon: Zap },
  { type: 'aiAction', label: 'AI Action', icon: Sparkles },
  { type: 'condition', label: 'Condition', icon: Filter },
  { type: 'action', label: 'Action', icon: Cpu },
  { type: 'approval', label: 'Approval', icon: UserCheck },
  { type: 'end', label: 'End', icon: CheckCircle2 },
];

/**
 * Calculates a clean hierarchical layout for the DAG nodes
 */
function computeInitialGraph(workflow: GeneratedWorkflow) {
  const nodes: Node<CustomNodeData>[] = [];
  const edges: Edge[] = [];

  const yesBranchNode = workflow.nodes.find((n) => n.branch === 'yes');
  let currentY = 30;

  const nodePositions: Record<string, { x: number; y: number }> = {};

  workflow.nodes.forEach((node) => {
    if (node.branch === 'yes') {
      nodePositions[node.id] = { x: 40, y: 440 };
    } else if (node.type === 'trigger') {
      nodePositions[node.id] = { x: 220, y: 30 };
    } else if (node.type === 'aiAction') {
      nodePositions[node.id] = { x: 220, y: 160 };
    } else if (node.type === 'condition') {
      nodePositions[node.id] = { x: 220, y: 290 };
    } else if (node.type === 'end') {
      nodePositions[node.id] = { x: 220, y: currentY + 120 };
    } else {
      currentY = Math.max(currentY + 130, 560);
      nodePositions[node.id] = { x: 220, y: currentY };
    }

    nodes.push({
      id: node.id,
      type: 'customNode',
      position: nodePositions[node.id],
      data: {
        id: node.id,
        type: node.type,
        title: node.title,
        description: node.description,
        status: node.status,
        branch: node.branch,
        actionType: node.actionType,
      },
    });
  });

  // Construct standard edges connecting nodes in top-down sequence
  const nonBranchNodes = workflow.nodes.filter((n) => !n.branch);

  for (let i = 0; i < nonBranchNodes.length - 1; i++) {
    const fromNode = nonBranchNodes[i];
    const toNode = nonBranchNodes[i + 1];

    if (fromNode.type === 'condition') {
      // Connect Condition -> YES Branch
      if (yesBranchNode) {
        edges.push({
          id: `e-${fromNode.id}-${yesBranchNode.id}`,
          source: fromNode.id,
          target: yesBranchNode.id,
          sourceHandle: 'yes',
          label: 'YES',
          labelStyle: { fill: '#34d399', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#064e3b', fillOpacity: 0.8, rx: 4, ry: 4 },
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });

        // Connect YES Branch -> Next Action
        edges.push({
          id: `e-${yesBranchNode.id}-${toNode.id}`,
          source: yesBranchNode.id,
          target: toNode.id,
          style: { stroke: '#6366f1', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        });
      }

      // Connect Condition -> NO Branch (Continues to next action)
      edges.push({
        id: `e-${fromNode.id}-${toNode.id}-no`,
        source: fromNode.id,
        target: toNode.id,
        sourceHandle: 'no',
        label: 'NO',
        labelStyle: { fill: '#94a3b8', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8, rx: 4, ry: 4 },
        style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      });
    } else {
      edges.push({
        id: `e-${fromNode.id}-${toNode.id}`,
        source: fromNode.id,
        target: toNode.id,
        style: { stroke: '#6366f1', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      });
    }
  }

  return { nodes, edges };
}

const FlowCanvasInner: React.FC<InteractiveWorkflowCanvasProps> = ({
  workflow,
  selectedNodeId,
  onSelectNode,
  onAddNode,
}) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => computeInitialGraph(workflow),
    [workflow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const { showToast } = useToast();

  // Keep node contents synchronized with activeWorkflow state updates
  useEffect(() => {
    const { nodes: updatedNodes, edges: updatedEdges } = computeInitialGraph(workflow);
    setNodes((prevNodes) =>
      updatedNodes.map((n) => {
        const existing = prevNodes.find((p) => p.id === n.id);
        return {
          ...n,
          position: existing ? existing.position : n.position,
          selected: n.id === selectedNodeId,
        };
      })
    );
    setEdges(updatedEdges);
  }, [workflow, selectedNodeId, setNodes, setEdges]);

  // Initial fit view
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: '#6366f1', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          },
          eds
        )
      );
      showToast('Nodes connected successfully.', 'success');
    },
    [setEdges, showToast]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleResetView = () => {
    setCenter(360, 500, { zoom: 0.85, duration: 300 });
  };

  const handleAddNodeSelect = (type: FlowNodeType) => {
    onAddNode(type);
    setIsAddMenuOpen(false);
    showToast(`Added ${type} node to canvas.`, 'success');
  };

  return (
    <div className="relative w-full h-[660px] rounded-xl border border-white/[0.08] bg-[#07090f] overflow-hidden shadow-2xl">
      {/* Top Floating Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: Canvas controls */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0e1320]/90 backdrop-blur-md border border-white/10 shadow-xl pointer-events-auto">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: + Add Node Button */}
        <div className="relative pointer-events-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Node
            <ChevronDown className="w-3 h-3 ml-1 text-slate-300" />
          </Button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-white/5">
                Insert Flow Node
              </div>
              <div className="space-y-0.5 pt-1">
                {ADD_NODE_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAddNodeSelect(item.type)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent transition-colors text-left cursor-pointer font-medium"
                    >
                      <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main React Flow Surface */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#6366f1', strokeWidth: 1.5 },
        }}
        minZoom={0.2}
        maxZoom={1.5}
        fitView
      >
        {/* Subtle Dark Background Pattern */}
        <Background color="#1e293b" gap={24} size={1.5} />

        {/* Minimalist Controls */}
        <Controls
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="bg-[#0e1320] border-white/10 text-slate-400 shadow-xl rounded-lg overflow-hidden"
        />

        {/* Dark Theme MiniMap */}
        <MiniMap
          nodeStrokeColor="#6366f1"
          nodeColor="#1e2638"
          maskColor="rgba(8, 11, 18, 0.75)"
          className="bg-[#0b0e17] border border-white/10 rounded-lg shadow-xl"
          style={{ width: 140, height: 90, bottom: 12, right: 12 }}
        />
      </ReactFlow>
    </div>
  );
};

export const InteractiveWorkflowCanvas: React.FC<InteractiveWorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
