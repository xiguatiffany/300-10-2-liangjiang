import React, { useId, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { cx } from './ui';

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function AreaChart({ data, color = '#6755F5', secondaryColor = '#0891B2', height = 220, format = (v: number) => v.toLocaleString(), suffix, compareName, valueName = '数值', showGrid = true, domainMin, domainMax }: {
  data: { label: string; value: number; value2?: number }[];
  color?: string; secondaryColor?: string; height?: number; format?: (v: number) => string; suffix?: string;
  compareName?: string; valueName?: string; showGrid?: boolean; domainMin?: number; domainMax?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = height, padL = 48, padR = 16, padT = 18, padB = 30;
  const values = data.map((d) => d.value);
  const all = [...values, ...data.map((d) => d.value2 || 0)];
  const rawMax = Math.max(...all, 1);
  const rawMin = Math.min(...values, 0);
  const max = domainMax ?? rawMax * 1.12;
  const min = domainMin ?? Math.max(0, rawMin - (rawMax - rawMin) * 0.08);
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, data.length - 1);
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const line = smoothPath(points);
  const area = line ? `${line} L ${x(data.length - 1)} ${H - padB} L ${x(0)} ${H - padB} Z` : '';
  const ticks = 4;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  return (
    <div className="chart-box" style={{ height: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="area-chart" role="img" aria-label="趋势图">
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid && Array.from({ length: ticks + 1 }, (_, i) => {
          const v = min + ((max - min) / ticks) * i;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#E8EEF9" strokeDasharray={i === 0 ? '0' : '3 4'} />
              <text x={padL - 10} y={y(v) + 3.5} textAnchor="end" className="axis-text">{format(Math.round(v))}</text>
            </g>
          );
        })}
        {data.map((d, i) => i % labelEvery === 0 && <text key={d.label} x={x(i)} y={H - 8} textAnchor="middle" className="axis-text">{d.label}</text>)}
        <path d={area} fill={`url(#g-${uid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        {data[0]?.value2 !== undefined && (
          <path d={smoothPath(data.map((d, i) => ({ x: x(i), y: y(d.value2 || 0) })))} fill="none" stroke={secondaryColor} strokeWidth="1.8" strokeDasharray="4 4" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <rect x={x(i) - (W - padL - padR) / data.length / 2} y={padT} width={(W - padL - padR) / data.length} height={H - padT - padB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            {hover === i && <line x1={p.x} x2={p.x} y1={padT} y2={H - padB} stroke={color} strokeOpacity=".25" />}
            <circle cx={p.x} cy={p.y} r={hover === i ? 4.5 : 2.8} fill="#fff" stroke={color} strokeWidth="2" />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: 4 }}>
          <strong>{data[hover].label}</strong>
          <span><i style={{ background: color }} />{valueName} {format(data[hover].value)}{suffix}</span>
          {data[hover].value2 !== undefined && <span><i style={{ background: secondaryColor }} />{compareName || '对比'} {format(data[hover].value2 || 0)}{suffix}</span>}
        </div>
      )}
      {data[0]?.value2 !== undefined && (
        <div className="chart-legend">
          <span><i style={{ background: color }} />{valueName}</span>
          <span><i style={{ background: secondaryColor }} />{compareName || '对比'}</span>
        </div>
      )}
    </div>
  );
}

export function Donut({ segments, total, label, sub, size = 168, thickness = 14, centerValue }: {
  segments: { label: string; value: number; color: string }[];
  total?: number; label?: string; sub?: string; size?: number; thickness?: number; centerValue?: string;
}) {
  const sum = (total ?? segments.reduce((a, b) => a + b.value, 0)) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const [active, setActive] = useState<number | null>(null);
  let offset = 0;
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF3FB" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = (s.value / sum) * c;
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={active === i ? thickness + 3 : thickness}
                strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`} strokeDashoffset={-offset} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="donut-seg" />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="donut-center">
          <strong>{centerValue ?? (active !== null ? segments[active].value.toLocaleString() : sum.toLocaleString())}</strong>
          <span>{active !== null ? segments[active].label : label || '总计'}</span>
          {sub && <em>{sub}</em>}
        </div>
      </div>
      {segments.length > 1 && (
        <ul className="donut-legend">
          {segments.map((s, i) => (
            <li key={s.label} className={active === i ? 'active' : ''} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              <i style={{ background: s.color }} />
              <span>{s.label}</span>
              <strong>{s.value.toLocaleString()}</strong>
              <em>{((s.value / sum) * 100).toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RadialScore({ value, size = 150, thickness = 10, color = '#6755F5', label = '质量得分', suffix = '' }: { value: number; size?: number; thickness?: number; color?: string; label?: string; suffix?: string }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="radial" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF3FB" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="radial-center">
        <strong>{value}<small>{suffix || '%'}</small></strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function BarList({ items, unit, max, color = '#6755F5', showValue = true }: { items: { label: string; value: number; display?: string; color?: string; tone?: string }[]; unit?: string; max?: number; color?: string; showValue?: boolean }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bar-list">
      {items.map((it) => (
        <div className="bar-item" key={it.label}>
          <div className="bar-meta"><span>{it.label}</span>{showValue && <strong>{it.display ?? `${it.value.toLocaleString()}${unit || ''}`}</strong>}</div>
          <div className="bar-track">
            <span style={{ width: `${Math.max(2, (it.value / top) * 100)}%`, background: it.color || color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Gantt({ rows, months, height = 220 }: { rows: { system: string; tone: string; segments: { from: number; to: number; label: string }[] }[]; months?: string[]; height?: number }) {
  const labels = months || ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  return (
    <div className="gantt">
      <div className="gantt-axis" style={{ gridTemplateColumns: `88px repeat(${labels.length}, 1fr)` }}>
        <span />
        {labels.map((m) => <span key={m}>{m}</span>)}
      </div>
      {rows.map((r) => (
        <div className="gantt-row" key={r.system}>
          <span className="gantt-label">{r.system}</span>
          <div className="gantt-track">
            {labels.map((_, i) => <i key={i} className="gantt-grid-line" style={{ left: `${(i / (labels.length - 1)) * 100}%` }} />)}
            {r.segments.map((s, i) => (
              <div key={i} className="gantt-bar" style={{ left: `${s.from}%`, width: `${s.to - s.from}%`, background: `linear-gradient(90deg, ${r.tone}, ${r.tone}cc)` }} title={`${s.label}`}>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = '#6755F5', width = 120, height = 34 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * width, y: height - 3 - ((v - min) / (max - min || 1)) * (height - 6) }));
  const d = smoothPath(pts);
  return (
    <svg width={width} height={height} className="sparkline">
      <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={color} opacity=".08" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.4" fill={color} />
    </svg>
  );
}

export type GraphNode = { id: string; label: string; sub?: string; type: 'source' | 'ods' | 'model' | 'indicator' | 'app'; x: number; y: number; w?: number; h?: number };
export type GraphEdge = { from: string; to: string; label?: string };

const nodeTone: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  source: { bg: '#EFF5FF', border: '#BBD2FF', color: '#2456C7', icon: 'database' },
  ods: { bg: '#F2F0FF', border: '#D6CEFF', color: '#5A47D9', icon: 'table' },
  model: { bg: '#EAF9F7', border: '#B7EAE3', color: '#0C7C75', icon: 'boxes' },
  indicator: { bg: '#E8F1FF', border: '#AFCBFF', color: '#1B54D6', icon: 'gauge' },
  app: { bg: '#FFF4E8', border: '#FFD8AE', color: '#B56A0B', icon: 'chart' },
};

export function LineageGraph({ nodes, edges, onSelect, height = 480, compact = false }: { nodes: GraphNode[]; edges: GraphEdge[]; onSelect?: (n: GraphNode) => void; height?: number; compact?: boolean }) {
  const [scale, setScale] = useState(compact ? 0.78 : 1);
  const [active, setActive] = useState<string | null>(null);
  const W = 1000;
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const related = useMemo(() => {
    if (!active) return new Set<string>();
    const set = new Set<string>([active]);
    edges.forEach((e) => { if (e.from === active) set.add(e.to); if (e.to === active) set.add(e.from); });
    return set;
  }, [active, edges]);
  return (
    <div className="lineage">
      <div className="lineage-toolbar">
        <div className="lineage-legend">
          {[['source', '数据源'], ['ods', 'ODS 明细'], ['model', '主题模型'], ['indicator', '指标'], ['app', '应用']].map(([k, l]) => (
            <span key={k}><i style={{ background: nodeTone[k].color }} />{l}</span>
          ))}
        </div>
        <div className="lineage-zoom">
          <button onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))} aria-label="缩小">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(1.4, +(s + 0.1).toFixed(2)))} aria-label="放大">＋</button>
          <button onClick={() => setScale(1)} aria-label="重置">重置</button>
        </div>
      </div>
      <div className="lineage-scroll" style={{ height: height + 20 }}>
        <div className="lineage-canvas" style={{ width: W, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <svg className="lineage-edges" width={W} height={height}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#AFC1DC" />
              </marker>
              <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#E4EBF6" />
              </pattern>
            </defs>
            <rect width={W} height={height} fill="url(#grid)" />
            {edges.map((e, i) => {
              const a = byId[e.from], b = byId[e.to];
              if (!a || !b) return null;
              const aw = a.w || 168, ah = a.h || 52, bw = b.w || 168, bh = b.h || 52;
              const x1 = a.x + aw, y1 = a.y + ah / 2;
              const x2 = b.x, y2 = b.y + bh / 2;
              const mid = (x1 + x2) / 2;
              const dim = active && !(related.has(e.from) && related.has(e.to));
              return (
                <g key={i} className="edge" opacity={dim ? 0.18 : 1}>
                  <path d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} fill="none" stroke={active && related.has(e.from) && related.has(e.to) ? '#6755F5' : '#AFC1DC'} strokeWidth={active ? 2 : 1.4} markerEnd="url(#arrow)" />
                  {e.label && <text x={mid} y={(y1 + y2) / 2 - 6} textAnchor="middle" className="edge-label">{e.label}</text>}
                </g>
              );
            })}
          </svg>
          {nodes.map((n) => {
            const tone = nodeTone[n.type];
            const dim = active && !related.has(n.id);
            return (
              <button key={n.id} className={cx('graph-node', dim && 'is-dim', active === n.id && 'is-active')}
                style={{ left: n.x, top: n.y, width: n.w || 168, minHeight: n.h || 52, background: tone.bg, borderColor: active === n.id ? '#6755F5' : tone.border, color: tone.color }}
                onMouseEnter={() => setActive(n.id)} onMouseLeave={() => setActive(null)} onClick={() => onSelect?.(n)}>
                <span className="graph-node-icon"><Icon name={tone.icon} size={14} /></span>
                <span className="graph-node-text"><strong>{n.label}</strong>{n.sub && <small>{n.sub}</small>}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TopoLinks({ items }: { items: { source: string; target: string; delay: string; level: string }[] }) {
  return (
    <div className="topo-grid">
      {items.map((it) => (
        <div className="topo-card" key={it.source}>
          <div className="topo-end"><span className="dot" /><strong>{it.source}</strong></div>
          <div className="topo-link"><span className={cx('topo-delay', `is-${it.level}`)}>{it.delay}</span></div>
          <div className="topo-end"><span className="dot target" /><strong>{it.target}</strong></div>
        </div>
      ))}
    </div>
  );
}
