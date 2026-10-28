import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, Panel, Handle, Position, MarkerType,
  ReactFlowProvider, useNodesState, useEdgesState, addEdge, useReactFlow,
  type Node, type Edge, type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Field, PageHeader, Select, StatCard } from '../../components/ui';
import { api, IngestResult, WarehouseTable } from '../../api/client';
import { useApp } from '../../app-context';

const SOURCE_TABLES = [
  { table: 'ods_his.patient', label: 'HIS 患者基本信息', system: 'HIS', rows: '3,428,519' },
  { table: 'source_lis.lab_report', label: 'LIS 检验报告', system: 'LIS', rows: '5 条演示' },
  { table: 'source_emr.visit', label: 'EMR 就诊记录', system: 'EMR', rows: '5 条演示' },
];

const palette = [
  { key: 'patient', kind: 'source', label: 'HIS 患者库', desc: 'ods_his.patient', icon: 'database', tone: 'blue', table: 'ods_his.patient', system: 'HIS', alias: 'patient' },
  { key: 'lab', kind: 'source', label: 'LIS 检验库', desc: 'source_lis.lab_report', icon: 'activity', tone: 'cyan', table: 'source_lis.lab_report', system: 'LIS', alias: 'lab' },
  { key: 'visit', kind: 'source', label: 'EMR 就诊库', desc: 'source_emr.visit', icon: 'file', tone: 'violet', table: 'source_emr.visit', system: 'EMR', alias: 'visit' },
  { key: 'dm', kind: 'source', label: '达梦数据源', desc: '拖入后配置连接', icon: 'server', tone: 'amber', table: '', system: '达梦', alias: 'dm_source' },
  { key: 'api', kind: 'source', label: 'API / 文件', desc: '接口或文件接入', icon: 'network', tone: 'green', table: '', system: 'API', alias: 'api_source' },
  { key: 'transform', kind: 'transform', label: '字段标准化', desc: '映射 / 清洗 / 脱敏', icon: 'workflow', tone: 'violet' },
  { key: 'sink', kind: 'sink', label: 'ODS 入仓', desc: '写入 warehouse', icon: 'layers', tone: 'green' },
];

type FlowData = Record<string, any>;
const nodeTypes = {
  source: function SourceNode({ data, selected }: any) {
    return (
      <div className={`rf-node rf-source ${selected ? 'is-selected' : ''} ${data.table ? 'is-ready' : 'is-empty'}`}>
        <Handle type="source" position={Position.Right} className="rf-handle" />
        <div className="rf-node-head"><span className={`rf-node-icon tone-${data.tone || 'blue'}`}><Icon name={data.icon || 'database'} size={15} /></span><div><strong>{data.label}</strong><small>{data.system} · 数据源</small></div><em className={data.table ? 'ok' : 'warn'}>{data.table ? '已连接' : '待配置'}</em></div>
        <div className="rf-node-body"><code>{data.table || '选择物理表'}</code><span>{data.mode || '存量 + 增量'}</span></div>
        <div className="rf-node-foot"><span><Icon name="table" size={10} /> {data.rows || '—'} 行</span><span>只读账号</span></div>
      </div>
    );
  },
  transform: function TransformNode({ data, selected }: any) {
    return (
      <div className={`rf-node rf-transform ${selected ? 'is-selected' : ''}`}>
        <Handle type="target" position={Position.Left} className="rf-handle" />
        <Handle type="source" position={Position.Right} className="rf-handle" />
        <div className="rf-node-head"><span className="rf-node-icon tone-violet"><Icon name="workflow" size={15} /></span><div><strong>{data.label}</strong><small>标准化 · 映射 · 脱敏</small></div><em className="ok">就绪</em></div>
        <div className="rf-node-body"><code>字段映射 94.2%</code><span>3 类规则</span></div>
        <div className="rf-node-foot"><span>保留原始值</span><span>异常分流</span></div>
      </div>
    );
  },
  sink: function SinkNode({ data, selected }: any) {
    return (
      <div className={`rf-node rf-sink ${selected ? 'is-selected' : ''}`}>
        <Handle type="target" position={Position.Left} className="rf-handle" />
        <div className="rf-node-head"><span className="rf-node-icon tone-green"><Icon name="layers" size={15} /></span><div><strong>{data.label}</strong><small>{data.layer || 'ODS'} · 入仓</small></div><em className="ok">待运行</em></div>
        <div className="rf-node-body"><code>warehouse.{data.target || 'ods_health'}_*</code><span>{data.writeMode || '覆盖写'}</span></div>
        <div className="rf-node-foot"><span>自动建表</span><span>可预览</span></div>
      </div>
    );
  },
};

const initialNodes: Node[] = [
  { id: 'src-patient', type: 'source', position: { x: 20, y: 25 }, data: { label: 'HIS 患者库', system: 'HIS', icon: 'database', tone: 'blue', table: 'ods_his.patient', alias: 'patient', rows: '3,428,519', mode: '存量 + 增量' } },
  { id: 'src-lab', type: 'source', position: { x: 20, y: 175 }, data: { label: 'LIS 检验库', system: 'LIS', icon: 'activity', tone: 'cyan', table: 'source_lis.lab_report', alias: 'lab', rows: '5', mode: '全量' } },
  { id: 'src-visit', type: 'source', position: { x: 20, y: 325 }, data: { label: 'EMR 就诊库', system: 'EMR', icon: 'file', tone: 'violet', table: 'source_emr.visit', alias: 'visit', rows: '5', mode: '全量' } },
  { id: 'transform', type: 'transform', position: { x: 260, y: 175 }, data: { label: '字段标准化', fields: 8 } },
  { id: 'sink', type: 'sink', position: { x: 500, y: 175 }, data: { label: 'ODS 健康库', target: 'ods_health', layer: 'ODS', writeMode: '覆盖写' } },
];
const initialEdges: Edge[] = [
  { id: 'e-patient', source: 'src-patient', target: 'transform', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-lab', source: 'src-lab', target: 'transform', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-visit', source: 'src-visit', target: 'transform', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-sink', source: 'transform', target: 'sink', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
];

function FlowInner() {
  const { notify } = useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState('src-patient');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [tables, setTables] = useState<WarehouseTable[]>([]);
  const [preview, setPreview] = useState<{ table: string; columns: string[]; rows: Record<string, any>[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [tab, setTab] = useState<'result' | 'preview'>('result');
  const wrapper = useRef<HTMLDivElement>(null);
  const autoRun = useRef(false);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selected = nodes.find((n) => n.id === selectedId);
  const sourceNodes = nodes.filter((n) => n.type === 'source');
  const readySources = sourceNodes.filter((n) => n.data.table);
  const sink = nodes.find((n) => n.type === 'sink');

  const update = (patch: FlowData) => setNodes((ns) => ns.map((n) => n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n));
  const loadTables = async () => {
    try { const r = await api.warehouseTables(); setTables(r.items); if (r.items[0] && !preview) await loadPreview(r.items[0].name); }
    catch { /* API optional */ }
  };
  useEffect(() => { loadTables(); }, []);

  const loadPreview = async (table: string) => {
    setPreviewing(true); setTab('preview');
    try { setPreview(await api.warehousePreview(table)); } catch (e: any) { notify(e.message, 'error'); }
    setPreviewing(false);
  };

  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, es)), [setEdges]);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/x-flow-node');
    if (!raw) return;
    const item = JSON.parse(raw);
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const id = `${item.kind}-${Date.now().toString(36)}`;
    const data: FlowData = item.kind === 'source'
      ? { label: item.label, system: item.system, icon: item.icon, tone: item.tone, table: item.table, alias: item.alias, mode: '存量 + 增量', rows: item.table ? '—' : '' }
      : item.kind === 'transform' ? { label: '字段标准化' } : { label: 'ODS 健康库', target: 'ods_health', layer: 'ODS', writeMode: '覆盖写' };
    setNodes((ns) => [...ns, { id, type: item.kind, position, data }]);
    setSelectedId(id);
  };

  const run = async () => {
    if (!readySources.length) { notify('请至少拖入一个已配置物理表的数据源', 'error'); return; }
    if (!sink) { notify('请拖入 ODS 入仓节点', 'error'); return; }
    setRunning(true); setResult(null);
    try {
      const res = await api.ingest({ name: '采集方案 · 拖拽编排', sources: readySources.map((n) => ({ alias: String(n.data.alias || n.id), table: String(n.data.table) })), targetPrefix: String(sink.data.target || 'ods_health') });
      setResult(res); setTab('result'); notify(`入仓成功：${res.totalRows} 行，${res.results.length} 张表`);
      await loadTables();
      await loadPreview(res.results[0].target.replace('warehouse.', ''));
    } catch (e: any) { notify(e.message, 'error'); }
    setRunning(false);
  };

  const save = () => {
    localStorage.setItem('lj_collection_flow', JSON.stringify({ nodes, edges }));
    notify('采集方案已保存到本地草稿');
  };
  const reset = () => { setNodes(initialNodes); setEdges(initialEdges); setSelectedId('src-patient'); setResult(null); setPreview(null); notify('已恢复默认流程'); };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('run') !== '1' || autoRun.current) return;
    autoRun.current = true;
    const timer = window.setTimeout(() => { run(); }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const columns = useMemo(() => (preview?.columns || []).map((c) => ({ key: c, title: c, render: (r: any) => { const v = r[c]; if (v == null) return '—'; if (typeof v === 'object') return JSON.stringify(v); if (typeof v === 'boolean') return v ? '是' : '否'; return String(v); } })), [preview]);

  return (
    <>
      <PageHeader eyebrow="VISUAL INGESTION PIPELINE" title="采集方案配置" desc="拖拽数据源、标准化与 ODS 入仓节点，连线即形成采集链路；运行后真实写入 PGlite warehouse，并可立即预览入仓数据。" actions={<><Btn icon="refresh" onClick={reset}>恢复默认</Btn><Btn icon="save" onClick={save}>保存方案</Btn><Btn variant="primary" icon="play" loading={running} onClick={run}>运行入仓</Btn></>} />
      <div className="flow-guide"><span><b>1</b> 拖入数据源</span><i>→</i><span><b>2</b> 连线到标准化</span><i>→</i><span><b>3</b> 配置字段/目标</span><i>→</i><span><b>4</b> 运行入仓</span><i>→</i><span><b>5</b> 预览真实数据</span><em><Icon name="gitbranch" size={12} /> React Flow 画布</em></div>
      <div className="stat-grid mt-12">
        <StatCard label="数据源节点" value={readySources.length.toString()} unit={`/ ${sourceNodes.length}`} delta="已配置 / 全部" icon="database" tone="blue" />
        <StatCard label="当前方案" value="1" unit="条链路" delta={`${edges.length} 条连线`} icon="workflow" tone="violet" />
        <StatCard label="入仓表" value={tables.length.toString()} unit="张" delta="warehouse schema" icon="layers" tone="cyan" />
        <StatCard label="最近入仓" value={result ? result.totalRows.toLocaleString() : '—'} unit="行" delta={result ? result.jobId : '尚未运行'} icon="checkcircle" tone="green" />
      </div>

      <div className="flow-layout mt-14">
        <aside className="flow-palette">
          <div className="fp-head"><span>节点库</span><em>拖入画布</em></div>
          <div className="fp-group">数据源</div>
          {palette.filter((p) => p.kind === 'source').map((p) => (
            <div key={p.key} className="fp-item" draggable onDragStart={(e) => { e.dataTransfer.setData('application/x-flow-node', JSON.stringify(p)); e.dataTransfer.effectAllowed = 'move'; }}>
              <span className={`fp-icon tone-${p.tone}`}><Icon name={p.icon} size={14} /></span><div><strong>{p.label}</strong><small>{p.desc}</small></div><Icon name="plus" size={11} />
            </div>
          ))}
          <div className="fp-group">处理与目标</div>
          {palette.filter((p) => p.kind !== 'source').map((p) => (
            <div key={p.key} className="fp-item" draggable onDragStart={(e) => { e.dataTransfer.setData('application/x-flow-node', JSON.stringify(p)); e.dataTransfer.effectAllowed = 'move'; }}>
              <span className={`fp-icon tone-${p.tone}`}><Icon name={p.icon} size={14} /></span><div><strong>{p.label}</strong><small>{p.desc}</small></div><Icon name="plus" size={11} />
            </div>
          ))}
          <div className="fp-tip"><Icon name="hand" size={13} /><span>按住节点拖到右侧画布，松开即可添加。</span></div>
        </aside>

        <div className="flow-canvas-wrap" ref={wrapper} onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}>
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)} onPaneClick={() => setSelectedId('')}
            fitView fitViewOptions={{ padding: 0.04 }} minZoom={0.72} maxZoom={1.35}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} color="#dfe8f6" />
            <Controls showInteractive={false} />
            <Panel position="top-right"><div className="flow-canvas-actions"><span><i /> 自动保存草稿</span><button onClick={() => fitView({ padding: 0.04 })}><Icon name="maximize" size={12} /> 适应画布</button></div></Panel>
          </ReactFlow>
        </div>

        <aside className="flow-config">
          <Card title="节点配置" subtitle={selected ? (selected.type === 'source' ? '数据源' : selected.type === 'sink' ? '入仓目标' : '标准化') : '未选择节点'}>
            {selected ? (
              <>
                <div className="fc-node-name"><span className={`rf-node-icon tone-${String(selected.data.tone || 'blue')}`}><Icon name={String(selected.data.icon || 'workflow')} size={15} /></span><div><strong>{String(selected.data.label || '')}</strong><small>{selected.id}</small></div><Badge tone="green" dot>{selected.type === 'source' ? (selected.data.table ? '已连接' : '待配置') : '就绪'}</Badge></div>
                {selected.type === 'source' && <>
                  <Field label="节点名称"><input className="input" value={String(selected.data.label || '')} onChange={(e) => update({ label: e.target.value })} /></Field>
                  <Field label="物理表"><Select value={String(selected.data.table || '')} onChange={(v) => { const t = SOURCE_TABLES.find((x) => x.table === v); update({ table: v, rows: t?.rows, system: t?.system }); }} options={['', ...SOURCE_TABLES.map((t) => t.table)]} /></Field>
                  <Field label="目标别名"><input className="input mono" value={String(selected.data.alias || '')} onChange={(e) => update({ alias: e.target.value })} /></Field>
                  <Field label="抽取策略"><Select value={String(selected.data.mode || '存量 + 增量')} onChange={(v) => update({ mode: v })} options={['存量 + 增量', '全量覆盖', '增量追加']} /></Field>
                </>}
                {selected.type === 'sink' && <>
                  <Field label="目标表前缀"><input className="input mono" value={String(selected.data.target || 'ods_health')} onChange={(e) => update({ target: e.target.value })} /></Field>
                  <Field label="目标层级"><Select value={String(selected.data.layer || 'ODS')} onChange={(v) => update({ layer: v })} options={['ODS', 'DWD', 'DWS']} /></Field>
                  <Field label="写入方式"><Select value={String(selected.data.writeMode || '覆盖写')} onChange={(v) => update({ writeMode: v })} options={['覆盖写', '追加写']} /></Field>
                </>}
                {selected.type === 'transform' && <>
                  <Field label="字段映射"><div className="fc-map"><span>patient_id → patient_id</span><span>patient_name → patient_name</span><span>gender_code → gender</span><span>id_card_no → id_card_no</span><span>phone_no → phone_no</span></div></Field>
                  <Field label="脱敏策略"><Select value="自动套用 L3" onChange={() => {}} options={['自动套用 L3', '保留后 4 位', '不脱敏']} /></Field>
                </>}
                <div className="fc-tip"><Icon name="circlealert" size={12} /><span>运行时会按当前连线真实写入 warehouse，可重复运行覆盖。</span></div>
              </>
            ) : <div className="empty small"><p>点击画布节点查看配置</p></div>}
          </Card>
          <Card className="mt-14" title="运行结果" subtitle={result ? result.jobId : '尚未执行'}>
            {result ? <div className="ingest-result">{result.results.map((r) => <div key={r.alias}><span className="status-dot tone-green" /><div><strong>{r.target}</strong><small>{r.source} · {r.rows} 行 · {r.durationMs}ms</small></div><Badge tone="green">成功</Badge></div>)}</div> : <div className="empty small"><p>点击“运行入仓”后展示每张表的行数与耗时。</p></div>}
          </Card>
        </aside>
      </div>

      <Card className="mt-14" title="数据进仓与预览" subtitle="warehouse schema · 真实 PGlite 表" noPad actions={<div className="row-actions"><Badge tone="blue">{tables.length} 张入仓表</Badge><Btn size="sm" icon="refresh" onClick={loadTables}>刷新</Btn></div>}>
        <div className="ingest-tabs">
          <button className={tab === 'result' ? 'is-active' : ''} onClick={() => setTab('result')}>入仓结果</button>
          <button className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>数据预览</button>
          <div className="ingest-tables">{tables.map((t) => <button key={t.name} className={preview?.table === t.name ? 'is-active' : ''} onClick={() => loadPreview(t.name)}>{t.name}<em>{t.rows}</em></button>)}</div>
        </div>
        {tab === 'result' && <div className="pad-h">{result ? <div className="ingest-summary"><div><span>总行数</span><strong>{result.totalRows.toLocaleString()}</strong></div><div><span>入仓表</span><strong>{result.results.length}</strong></div><div><span>任务号</span><strong className="mono-cell">{result.jobId}</strong></div>{result.results.map((r) => <div key={r.alias}><span>{r.alias}</span><strong>{r.rows} 行</strong><em>{r.durationMs}ms</em></div>)}</div> : <div className="empty"><div className="empty-icon"><Icon name="layers" size={22} /></div><h4>尚未运行入仓</h4><p>拖入数据源并连线，点击右上角“运行入仓”。</p></div>}</div>}
        {tab === 'preview' && <div className="pad-h">{previewing ? <div className="empty"><p>正在读取 warehouse…</p></div> : preview ? <><div className="preview-note"><Icon name="database" size={13} /><span>来源：warehouse.{preview.table} · 实时查询 PGlite</span><span className="preview-count">预览 {preview.rows.length} 行</span></div><DataTable rows={preview.rows} columns={columns as any} pageSize={8} paginate={false} /></> : <div className="empty"><p>运行入仓后选择一张表预览。</p></div>}</div>}
      </Card>
    </>
  );
}

export function CollectionWizard() {
  return <ReactFlowProvider><FlowInner /></ReactFlowProvider>;
}
