'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, Panel, Handle, Position, MarkerType,
  ReactFlowProvider, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Icon } from '../../components/Icon';

export type DagNodeData = {
  label: string;
  kind: 'source' | 'transform' | 'quality' | 'join' | 'sink' | 'stream' | 'monitor';
  icon: string;
  tone: string;
  state?: 'ok' | 'run' | 'warn' | 'fail' | 'idle';
  resource: string;
  engine: string;
  duration: string;
  inRows: string;
  outRows: string;
  owner: string;
  retries: number;
  started: string;
  parallel?: string;
  sqlHint?: string;
};

export type DagGraphNode = DagNodeData & {
  id: string;
  x: number;
  y: number;
};

export type EdgeRunState = 'idle' | 'active' | 'done' | 'fail';

const stateLabel = (s?: DagNodeData['state']) => {
  if (s === 'ok') return '成功';
  if (s === 'run') return '运行中';
  if (s === 'warn') return '告警';
  if (s === 'fail') return '失败';
  return '待执行';
};

function DagTaskNode({ data, selected }: { data: DagNodeData; selected?: boolean }) {
  const d = data;
  const emClass = d.state === 'fail' || d.state === 'warn' ? 'warn' : d.state === 'idle' ? 'warn' : 'ok';
  return (
    <div className={`rf-node dag-rf-node tone-${d.tone} state-${d.state || 'idle'} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="rf-handle" />
      <Handle type="source" position={Position.Right} className="rf-handle" />
      <div className="rf-node-head">
        <span className={`rf-node-icon tone-${d.tone}`}><Icon name={d.icon} size={15} /></span>
        <div>
          <strong>{d.label}</strong>
          <small>{d.engine}</small>
        </div>
        <em className={emClass}>{stateLabel(d.state)}</em>
      </div>
      <div className="rf-node-body">
        <code title={d.resource}>{d.resource}</code>
        <span>{d.duration}</span>
      </div>
      <div className="dag-rf-metrics">
        <span><b>入</b>{d.inRows}</span>
        <span><b>出</b>{d.outRows}</span>
        <span><b>重试</b>{d.retries}</span>
      </div>
      <div className="rf-node-foot">
        <span><Icon name="users" size={10} /> {d.owner}</span>
        <span>{d.started}</span>
      </div>
      {d.sqlHint && <div className="dag-rf-hint" title={d.sqlHint}>{d.sqlHint}</div>}
    </div>
  );
}

const nodeTypes = { dagTask: DagTaskNode as any };

const edgeStroke: Record<EdgeRunState, string> = {
  idle: '#c5d0e0',
  active: '#6755F5',
  done: '#059669',
  fail: '#d94b60',
};

function toRfNodes(graph: DagGraphNode[]): Node[] {
  return graph.map((n) => ({
    id: n.id,
    type: 'dagTask',
    position: { x: n.x, y: n.y },
    data: { ...n },
  }));
}

function edgeKey(s: string, t: string) {
  return `${s}->${t}`;
}

function toRfEdges(edges: [string, string][], edgeStates: Record<string, EdgeRunState>): Edge[] {
  return edges.map(([s, t], i) => {
    const st = edgeStates[edgeKey(s, t)] || 'idle';
    const color = edgeStroke[st];
    return {
      id: `e-${s}-${t}-${i}`,
      source: s,
      target: t,
      animated: st === 'active',
      className: `dag-edge-${st}`,
      style: { stroke: color, strokeWidth: st === 'active' ? 2.4 : 1.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    };
  });
}

function CanvasInner({
  graph,
  edges,
  edgeStates,
  selectedId,
  onSelect,
}: {
  graph: DagGraphNode[];
  edges: [string, string][];
  edgeStates: Record<string, EdgeRunState>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toRfNodes(graph));
  const [eds, setEds, onEdgesChange] = useEdgesState(toRfEdges(edges, edgeStates));
  const { fitView } = useReactFlow();
  const graphSig = graph.map((n) => `${n.id}:${n.state}`).join('|');
  const edgeSig = JSON.stringify(edgeStates);

  useEffect(() => {
    setNodes(toRfNodes(graph));
    setEds(toRfEdges(edges, edgeStates));
  }, [graphSig, edgeSig, graph, edges, edgeStates, setNodes, setEds]);

  useEffect(() => {
    const t = window.setTimeout(() => fitView({ padding: 0.12, duration: 220 }), 40);
    return () => window.clearTimeout(t);
  }, [graph.map((n) => n.id).join(','), fitView]);

  useEffect(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === selectedId })));
  }, [selectedId, setNodes]);

  const miniColors = useMemo(() => ({
    ok: '#059669',
    run: '#6755F5',
    warn: '#d97706',
    fail: '#d94b60',
    idle: '#94a3b8',
  }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={eds}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, n) => onSelect(n.id)}
      onPaneClick={() => onSelect('')}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.45}
      maxZoom={1.4}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: 'smoothstep' }}
    >
      <Background gap={18} size={1} color="#dfe8f6" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeStrokeWidth={2}
        nodeColor={(n) => miniColors[(n.data as DagNodeData).state || 'idle'] || '#94a3b8'}
        maskColor="rgba(240,245,252,.72)"
      />
      <Panel position="top-right">
        <div className="flow-canvas-actions">
          <span><i /> React Flow</span>
          <button type="button" onClick={() => fitView({ padding: 0.12, duration: 240 })}>
            <Icon name="expand" size={12} /> 适应画布
          </button>
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function LakeFlowCanvas(props: {
  graph: DagGraphNode[];
  edges: [string, string][];
  edgeStates?: Record<string, EdgeRunState>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="dag-rf-wrap">
      <ReactFlowProvider>
        <CanvasInner {...props} edgeStates={props.edgeStates || {}} />
      </ReactFlowProvider>
    </div>
  );
}

export function topoSort(ids: string[], edges: [string, string][]) {
  const indeg: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  const outs: Record<string, string[]> = Object.fromEntries(ids.map((id) => [id, []]));
  edges.forEach(([s, t]) => {
    if (indeg[t] !== undefined) indeg[t] += 1;
    outs[s]?.push(t);
  });
  const q = ids.filter((id) => indeg[id] === 0);
  const order: string[] = [];
  while (q.length) {
    const cur = q.shift()!;
    order.push(cur);
    for (const n of outs[cur] || []) {
      indeg[n] -= 1;
      if (indeg[n] === 0) q.push(n);
    }
  }
  return order.length === ids.length ? order : ids;
}

export { edgeKey };
