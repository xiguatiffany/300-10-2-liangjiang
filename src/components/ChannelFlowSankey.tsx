'use client';

import React, { useId, useMemo, useState } from 'react';
import { Icon } from './Icon';

type StageKey = 'realtime' | 'offline' | 'doris' | 'sources' | 'query';

type FlowNode = {
  id: string;
  label: string;
  meta: string;
  icon: string;
  tone: 'blue' | 'cyan' | 'violet' | 'green' | 'amber' | 'slate';
  channelId?: string;
  stage?: StageKey;
  traffic: number;
  status?: 'ok' | 'warn' | 'off';
};

type Col = { key: string; title: string; hint: string; nodes: FlowNode[] };

const COLUMNS: Col[] = [
  {
    key: 'src',
    title: '业务源端',
    hint: '库表变更从这里开始',
    nodes: [
      { id: 'his', label: 'HIS 生产库', meta: 'MySQL · 42%', icon: 'database', tone: 'blue', channelId: 'CDC-001', stage: 'realtime', traffic: 42, status: 'ok' },
      { id: 'emr', label: 'EMR 临床库', meta: 'SQL Server · 28%', icon: 'database', tone: 'blue', channelId: 'CDC-002', stage: 'realtime', traffic: 28, status: 'ok' },
      { id: 'lis', label: 'LIS 检验库', meta: 'Oracle · 22%', icon: 'database', tone: 'cyan', channelId: 'CDC-003', stage: 'realtime', traffic: 22, status: 'ok' },
      { id: 'pacs', label: 'PACS 影像库', meta: '延迟 3 分钟', icon: 'harddrive', tone: 'amber', channelId: 'CDC-004', stage: 'realtime', traffic: 12, status: 'warn' },
    ],
  },
  {
    key: 'cap',
    title: '通道捕获',
    hint: '实时 CDC / 离线批',
    nodes: [
      { id: 'cdc', label: 'CDC · Kafka', meta: 'QPS 1.2k · Lag 8s', icon: 'zap', tone: 'violet', stage: 'realtime', traffic: 70, status: 'ok' },
      { id: 'batch', label: '离线调度', meta: '日批 / 增量', icon: 'clock', tone: 'slate', stage: 'offline', traffic: 30, status: 'ok' },
    ],
  },
  {
    key: 'lake',
    title: '入湖落表',
    hint: '贴源可查',
    nodes: [
      { id: 'lake', label: '湖仓 ODS', meta: 'Iceberg / Hudi', icon: 'layers', tone: 'green', stage: 'realtime', traffic: 100, status: 'ok' },
    ],
  },
  {
    key: 'out',
    title: '查询消费',
    hint: '核对与分析出口',
    nodes: [
      { id: 'query', label: '数据查询', meta: '验收核对', icon: 'search', tone: 'green', stage: 'query', traffic: 52, status: 'ok' },
      { id: 'doris', label: 'Doris 分析仓', meta: '导出同步', icon: 'uploadcloud', tone: 'cyan', stage: 'doris', traffic: 48, status: 'ok' },
    ],
  },
];

const EDGES: { from: string; to: string; weight: number; channelId?: string; warn?: boolean }[] = [
  { from: 'his', to: 'cdc', weight: 42, channelId: 'CDC-001' },
  { from: 'emr', to: 'cdc', weight: 28, channelId: 'CDC-002' },
  { from: 'lis', to: 'cdc', weight: 22, channelId: 'CDC-003' },
  { from: 'pacs', to: 'cdc', weight: 12, channelId: 'CDC-004', warn: true },
  { from: 'his', to: 'batch', weight: 14 },
  { from: 'emr', to: 'batch', weight: 10 },
  { from: 'cdc', to: 'lake', weight: 70 },
  { from: 'batch', to: 'lake', weight: 30 },
  { from: 'lake', to: 'query', weight: 52 },
  { from: 'lake', to: 'doris', weight: 48 },
];

/** 节点锚点（相对画布百分比），用于贝塞尔连线 */
const ANCHORS: Record<string, { x: number; y: number }> = {
  his: { x: 18, y: 18 },
  emr: { x: 18, y: 40 },
  lis: { x: 18, y: 62 },
  pacs: { x: 18, y: 84 },
  cdc: { x: 42, y: 32 },
  batch: { x: 42, y: 72 },
  lake: { x: 66, y: 50 },
  query: { x: 90, y: 32 },
  doris: { x: 90, y: 72 },
};

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

export function ChannelFlowSankey({
  activeChannelId,
  pulsing,
  onSelectChannel,
  onSelectStage,
}: {
  activeChannelId?: string;
  pulsing?: boolean;
  onSelectChannel?: (channelId: string) => void;
  onSelectStage?: (stage: StageKey) => void;
}) {
  const gid = useId().replace(/:/g, '');
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const activeNodes = useMemo(() => {
    const set = new Set<string>();
    if (!activeChannelId) return set;
    const seed = EDGES.filter((e) => e.channelId === activeChannelId);
    seed.forEach((e) => { set.add(e.from); set.add(e.to); });
    if (seed.length) {
      set.add('cdc'); set.add('lake'); set.add('query');
    }
    return set;
  }, [activeChannelId]);

  const activeEdges = useMemo(() => {
    const set = new Set<string>();
    if (!activeChannelId) return set;
    EDGES.forEach((e) => {
      const key = `${e.from}-${e.to}`;
      if (e.channelId === activeChannelId) set.add(key);
      if (activeNodes.has(e.from) && activeNodes.has(e.to) && (e.from === 'cdc' || e.from === 'lake' || e.to === 'lake' || e.to === 'query')) {
        if (e.channelId === activeChannelId || !e.channelId) set.add(key);
      }
    });
    // ensure path extension
    set.add('cdc-lake');
    set.add('lake-query');
    return set;
  }, [activeChannelId, activeNodes]);

  const tip = useMemo(() => {
    if (!hoverEdge) return null;
    const e = EDGES.find((x) => `${x.from}-${x.to}` === hoverEdge);
    if (!e) return null;
    const from = COLUMNS.flatMap((c) => c.nodes).find((n) => n.id === e.from);
    const to = COLUMNS.flatMap((c) => c.nodes).find((n) => n.id === e.to);
    return { from: from?.label, to: to?.label, weight: e.weight, channelId: e.channelId, warn: e.warn };
  }, [hoverEdge]);

  const onNodeClick = (n: FlowNode) => {
    if (n.channelId) onSelectChannel?.(n.channelId);
    if (n.stage) onSelectStage?.(n.stage);
  };

  return (
    <div className={`flow-canvas${pulsing ? ' is-pulsing' : ''}`}>
      <div className="flow-canvas-bg" aria-hidden />

      <svg className="flow-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`fg-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7B6CF0" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2BB8A8" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`fw-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E0A04A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`glow-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {EDGES.map((e) => {
          const key = `${e.from}-${e.to}`;
          const a = ANCHORS[e.from];
          const b = ANCHORS[e.to];
          if (!a || !b) return null;
          const hi = activeEdges.has(key) || hoverEdge === key;
          const dim = !!activeChannelId && !activeEdges.has(key);
          const sw = 0.35 + (e.weight / 100) * 1.1;
          return (
            <path
              key={key}
              d={curve(a, b)}
              fill="none"
              stroke={e.warn ? `url(#fw-${gid})` : `url(#fg-${gid})`}
              strokeWidth={hi ? sw + 0.35 : sw}
              strokeLinecap="round"
              className={`flow-wire${hi ? ' is-hi' : ''}${dim ? ' is-dim' : ''}${e.warn ? ' is-warn' : ''}`}
              filter={hi ? `url(#glow-${gid})` : undefined}
              vectorEffect="non-scaling-stroke"
              onMouseEnter={() => setHoverEdge(key)}
              onMouseLeave={() => setHoverEdge(null)}
              onClick={() => e.channelId && onSelectChannel?.(e.channelId)}
            />
          );
        })}
        {pulsing && (
          <circle r="0.9" fill="#5B4FE0" opacity="0.9">
            <animateMotion dur="1.8s" repeatCount="indefinite" path={curve(ANCHORS.his, ANCHORS.cdc)} />
          </circle>
        )}
      </svg>

      <div className="flow-cols">
        {COLUMNS.map((col, ci) => (
          <div key={col.key} className="flow-col">
            <div className="flow-col-head">
              <span className="flow-col-idx">{String(ci + 1).padStart(2, '0')}</span>
              <div>
                <strong>{col.title}</strong>
                <small>{col.hint}</small>
              </div>
            </div>
            <div className={`flow-col-body n-${col.nodes.length}`}>
              {col.nodes.map((n) => {
                const hi = activeNodes.has(n.id) || hoverNode === n.id || activeChannelId === n.channelId;
                const dim = !!activeChannelId && !activeNodes.has(n.id) && activeChannelId !== n.channelId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`flow-node tone-${n.tone}${hi ? ' is-hi' : ''}${dim ? ' is-dim' : ''}${n.status === 'warn' ? ' is-warn' : ''}`}
                    onMouseEnter={() => setHoverNode(n.id)}
                    onMouseLeave={() => setHoverNode(null)}
                    onClick={() => onNodeClick(n)}
                  >
                    <span className="flow-node-ico"><Icon name={n.icon} size={14} /></span>
                    <span className="flow-node-text">
                      <strong>{n.label}</strong>
                      <small>{n.meta}</small>
                    </span>
                    <span className="flow-node-bar" aria-hidden>
                      <i style={{ width: `${Math.min(100, n.traffic)}%` }} />
                    </span>
                    {n.status === 'warn' && <em className="flow-node-flag">延迟</em>}
                    {n.status === 'ok' && col.key === 'lake' && <em className="flow-node-flag ok">可查</em>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flow-foot">
        <div className="flow-foot-left">
          <span><i className="dot ok" />正常流动</span>
          <span><i className="dot warn" />延迟 / 积压</span>
          <span><i className="line" />线宽 ≈ 流量占比</span>
        </div>
        <div className="flow-foot-right muted">点击节点或连线切换通道</div>
      </div>

      {tip && (
        <div className="flow-tip">
          <strong>{tip.from} → {tip.to}</strong>
          <span>流量占比 {tip.weight}%</span>
          {tip.channelId && <em>{tip.channelId}</em>}
        </div>
      )}
    </div>
  );
}
