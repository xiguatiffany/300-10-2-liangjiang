'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { qcExceptions } from '../../dataBid';
import {
  LakeFlowCanvas, topoSort, edgeKey,
  type DagGraphNode, type EdgeRunState,
} from './LakeFlowCanvas';

type QcKind = 'source' | 'transform' | 'quality' | 'join' | 'sink';
type RunPhase = 'idle' | 'running' | 'done';
type AcceptPhase = 'compose' | 'run' | 'metrics' | 'drill';

type PaletteItem = {
  kind: QcKind;
  label: string;
  icon: string;
  tone: string;
  engine: string;
  resource: string;
  hint: string;
};

type ExceptionRow = typeof qcExceptions[number];

const palette: PaletteItem[] = [
  { kind: 'source', label: '数据接入', icon: 'database', tone: 'blue', engine: 'ODS CDC', resource: 'ods_*.*', hint: '接入湖仓 ODS 分区' },
  { kind: 'transform', label: '标准化', icon: 'workflow', tone: 'violet', engine: 'Spark SQL', resource: 'dict_map / dedup', hint: '字典映射 · 去重 · 类型转换' },
  { kind: 'quality', label: '规则校验', icon: 'shield', tone: 'amber', engine: '规则引擎', resource: '五维规则集', hint: '完整 / 一致 / 规范 / 及时 / 稳定' },
  { kind: 'join', label: '异常分流', icon: 'git', tone: 'red', engine: 'Router', resource: 'qc_exception', hint: '按等级分流 · 可回查' },
  { kind: 'sink', label: '质控入库', icon: 'boxes', tone: 'green', engine: 'Iceberg', resource: 'dwd_qc_*', hint: '合格数据写入 DWD' },
];

const seedGraph: DagGraphNode[] = [
  {
    id: 'src', label: '数据接入', kind: 'source', icon: 'database', tone: 'blue', state: 'idle',
    resource: 'ods_his.patient', engine: 'ODS CDC', duration: '—', inRows: '—', outRows: '—',
    owner: '张敏', retries: 0, started: '—', sqlHint: 'SELECT * FROM ods_his.patient WHERE dt=today',
    x: 40, y: 180,
  },
  {
    id: 'std', label: '标准化', kind: 'transform', icon: 'workflow', tone: 'violet', state: 'idle',
    resource: 'dict_map · dedup', engine: 'Spark SQL', duration: '—', inRows: '—', outRows: '—',
    owner: '张敏', retries: 0, started: '—', sqlHint: 'map_code(gender) · drop_dup(patient_id)',
    x: 300, y: 180,
  },
  {
    id: 'comp', label: '完整性校验', kind: 'quality', icon: 'shield', tone: 'amber', state: 'idle',
    resource: '完整性规则集', engine: '规则引擎', duration: '—', inRows: '—', outRows: '—',
    owner: '李倩', retries: 0, started: '—', sqlHint: 'patient_id IS NOT NULL · FK 关联',
    x: 560, y: 60,
  },
  {
    id: 'cons', label: '一致性校验', kind: 'quality', icon: 'shield', tone: 'amber', state: 'idle',
    resource: '一致性规则集', engine: '规则引擎', duration: '—', inRows: '—', outRows: '—',
    owner: '李倩', retries: 0, started: '—', sqlHint: '值域合法 · 编码标准 · 逻辑一致',
    x: 560, y: 300,
  },
  {
    id: 'branch', label: '异常分流', kind: 'join', icon: 'git', tone: 'red', state: 'idle',
    resource: 'qc_exception', engine: 'Router', duration: '—', inRows: '—', outRows: '—',
    owner: '王磊', retries: 0, started: '—', sqlHint: 'FAIL → exception · PASS → sink',
    x: 820, y: 180,
  },
  {
    id: 'sink', label: '质控入库', kind: 'sink', icon: 'boxes', tone: 'green', state: 'idle',
    resource: 'dwd.fact_visit_qc', engine: 'Iceberg', duration: '—', inRows: '—', outRows: '—',
    owner: '王磊', retries: 0, started: '—', sqlHint: 'INSERT OVERWRITE dwd.fact_visit_qc',
    x: 1080, y: 180,
  },
];

const seedEdges: [string, string][] = [
  ['src', 'std'], ['std', 'comp'], ['std', 'cons'], ['comp', 'branch'], ['cons', 'branch'], ['branch', 'sink'],
];

const runMetrics: Record<string, { inRows: string; outRows: string; fail: number; duration: string; state: 'ok' | 'warn' }> = {
  src: { inRows: '128,642', outRows: '128,642', fail: 0, duration: '2s', state: 'ok' },
  std: { inRows: '128,642', outRows: '128,514', fail: 0, duration: '24s', state: 'ok' },
  comp: { inRows: '128,514', outRows: '128,386', fail: 128, duration: '18s', state: 'warn' },
  cons: { inRows: '128,514', outRows: '128,428', fail: 86, duration: '16s', state: 'warn' },
  branch: { inRows: '128,642', outRows: '128,428', fail: 214, duration: '4s', state: 'warn' },
  sink: { inRows: '128,428', outRows: '128,428', fail: 0, duration: '6s', state: 'ok' },
};

const nodeExceptions: Record<string, ExceptionRow[]> = {
  comp: [qcExceptions[0], qcExceptions[4]],
  cons: [qcExceptions[1], qcExceptions[3]],
  branch: qcExceptions as ExceptionRow[],
  std: [qcExceptions[2]],
};

const ruleSets: Record<string, string[]> = {
  comp: ['主键非空', '必填字段完整', '关联完整性'],
  cons: ['值域合法', '编码标准', '逻辑一致'],
};

function fmt(n: number) {
  return n.toLocaleString('zh-CN');
}

/** A5-04 ★ 质控可视化流程：拖拽编排 → 执行 → 节点指标 → 异常下钻 */
export function QCDesignerHubPage() {
  const { go, notify } = useApp();
  const [graph, setGraph] = useState<DagGraphNode[]>(seedGraph);
  const [edges, setEdges] = useState<[string, string][]>(seedEdges);
  const [edgeStates, setEdgeStates] = useState<Record<string, EdgeRunState>>({});
  const [selectedId, setSelectedId] = useState('comp');
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [accept, setAccept] = useState<AcceptPhase>('compose');
  const [composed, setComposed] = useState(true);
  const [ran, setRan] = useState(false);
  const [drilled, setDrilled] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [tab, setTab] = useState<'exceptions' | 'nodes' | 'log'>('exceptions');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeEx, setActiveEx] = useState<ExceptionRow | null>(null);
  const [ruleSet, setRuleSet] = useState('完整性规则集');
  const [failAction, setFailAction] = useState('分流到异常表');
  const seq = useRef(1);

  const selected = graph.find((n) => n.id === selectedId) || graph[0];
  const totals = useMemo(() => {
    if (!ran) return { pass: 0, fail: 0, nodes: graph.length };
    return { pass: 128428, fail: 214, nodes: graph.length };
  }, [ran, graph.length]);

  const exceptionRows = useMemo(() => {
    if (!ran) return [] as ExceptionRow[];
    if (selectedId && nodeExceptions[selectedId]) return nodeExceptions[selectedId];
    return qcExceptions as ExceptionRow[];
  }, [ran, selectedId]);

  const pushLog = (line: string) => setLogs((arr) => [...arr, line]);

  const resetRun = () => {
    setPhase('idle');
    setAccept('compose');
    setRan(false);
    setDrilled(false);
    setEdgeStates({});
    setLogs([]);
    setGraph((arr) => arr.map((n) => ({
      ...n, state: 'idle', inRows: '—', outRows: '—', duration: '—', started: '—', retries: 0,
    })));
  };

  const openExceptionDrill = (row?: ExceptionRow) => {
    setAccept('drill');
    setDrilled(true);
    setTab('exceptions');
    setSelectedId('branch');
    const hit = row || (qcExceptions[0] as ExceptionRow);
    setActiveEx(hit);
    notify(`异常下钻：${hit[1] || hit[0]}`);
  };

  const runFlow = async () => {
    if (phase === 'running') return;
    setPhase('running');
    setAccept('run');
    setRan(false);
    setDrilled(false);
    setTab('log');
    setLogs([]);
    setEdgeStates({});
    setGraph((arr) => arr.map((n) => ({
      ...n, state: 'idle', inRows: '—', outRows: '—', duration: '—', started: '—',
    })));

    const order = topoSort(graph.map((n) => n.id), edges);
    const t0 = Date.now();
    pushLog(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })}  流程 v1.2 开始 · 节点 ${order.length}`);

    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const inbound = edges.filter(([, t]) => t === id);
      inbound.forEach(([s, t]) => {
        setEdgeStates((es) => ({ ...es, [edgeKey(s, t)]: 'active' }));
      });

      setGraph((arr) => arr.map((n) => (n.id === id
        ? { ...n, state: 'run', started: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
        : n)));
      setSelectedId(id);
      await new Promise((r) => setTimeout(r, 420));

      const m = runMetrics[id] || { inRows: '12,000', outRows: '11,980', fail: 20, duration: '3s', state: 'ok' as const };
      setGraph((arr) => arr.map((n) => (n.id === id
        ? {
          ...n,
          state: m.state,
          inRows: m.inRows,
          outRows: m.outRows,
          duration: m.duration,
          retries: m.fail ? 1 : 0,
          sqlHint: m.fail ? `${n.sqlHint || ''} · 异常 ${m.fail}` : n.sqlHint,
        }
        : n)));

      inbound.forEach(([s, t]) => {
        setEdgeStates((es) => ({ ...es, [edgeKey(s, t)]: m.state === 'warn' ? 'fail' : 'done' }));
      });

      const failHint = m.fail ? `，异常 ${m.fail} 行` : '';
      pushLog(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })}  ${graph.find((n) => n.id === id)?.label || id} 完成 · 出 ${m.outRows}${failHint}`);
    }

    const cost = ((Date.now() - t0) / 1000).toFixed(1);
    pushLog(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })}  完成 · 入库 ${fmt(128428)} · 异常 ${fmt(214)} · 耗时 ${cost}s`);
    setPhase('done');
    setRan(true);
    setAccept('metrics');
    setTab('nodes');
    setSelectedId('branch');
    notify('质控流程执行完成：通过 128,428 行，异常 214 行已分流');
  };

  const demoAccept = async () => {
    if (phase === 'running' || demoing) return;
    setDemoing(true);
    setAccept('compose');
    addNode(palette.find((p) => p.kind === 'quality') || palette[2]);
    setComposed(true);
    notify('① 已编排：新增规则校验节点');
    await new Promise((r) => setTimeout(r, 400));
    await runFlow();
    setAccept('metrics');
    notify('③ 节点指标就绪 → ④ 异常下钻');
    await new Promise((r) => setTimeout(r, 350));
    openExceptionDrill();
    setDemoing(false);
  };

  const addNode = (item: PaletteItem) => {
    const id = `${item.kind}-${seq.current++}`;
    const yBase = 40 + (graph.length % 4) * 110;
    const xBase = 80 + (graph.length % 5) * 160;
    const node: DagGraphNode = {
      id,
      label: item.label,
      kind: item.kind,
      icon: item.icon,
      tone: item.tone,
      state: 'idle',
      resource: item.resource,
      engine: item.engine,
      duration: '—',
      inRows: '—',
      outRows: '—',
      owner: '演示账号',
      retries: 0,
      started: '—',
      sqlHint: item.hint,
      x: xBase,
      y: yBase,
    };
    setGraph((arr) => [...arr, node]);

    // 智能挂线：新节点挂到同类上游或末尾 sink 前
    const preferFrom =
      item.kind === 'quality' ? graph.find((n) => n.id === 'std')?.id
        : item.kind === 'sink' ? graph.find((n) => n.kind === 'join')?.id
          : item.kind === 'join' ? graph.filter((n) => n.kind === 'quality').slice(-1)[0]?.id
            : graph[graph.length - 1]?.id;
    if (preferFrom) {
      setEdges((eds) => [...eds, [preferFrom, id]]);
    }
    setSelectedId(id);
    setRan(false);
    setComposed(true);
    setAccept('compose');
    notify(`已添加节点「${item.label}」，可拖拽调整位置`);
  };

  const saveDraft = () => notify(`流程草稿已保存（${graph.length} 节点 / ${edges.length} 连线）`);
  const publish = async () => {
    await runFlow();
    window.setTimeout(() => notify('流程已发布为 v1.2', 'info'), 200);
  };

  return (
    <>
      <PageHeader
        eyebrow="QC VISUAL PIPELINE · A5-04 ★"
        title="质控可视化流程"
        desc="验收：拖拽编排 → 执行流程 → 节点指标 → 异常下钻；可视化编排质控全链路。"
        actions={
          <>
            <Btn icon="save" onClick={saveDraft}>保存草稿</Btn>
            <Btn icon="refresh" onClick={resetRun} disabled={phase === 'running'}>重置</Btn>
            <Btn icon="zap" loading={demoing || phase === 'running'} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="play" loading={phase === 'running'} onClick={runFlow}>运行流程</Btn>
            <Btn variant="primary" icon="rocket" loading={phase === 'running'} onClick={publish}>发布流程</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '拖拽编排', d: '节点库 · 画布', k: 'compose' as const, on: composed },
          { n: '02', t: '执行流程', d: '拓扑逐步跑通', k: 'run' as const, on: phase === 'running' || ran },
          { n: '03', t: '节点指标', d: '入出量 · 成败', k: 'metrics' as const, on: ran },
          { n: '04', t: '异常下钻', d: '分流明细回查', k: 'drill' as const, on: drilled },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${accept === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {phase === 'running' ? '流程执行中' : drilled ? '异常已下钻' : ran ? '指标就绪' : '待执行'}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="流程节点" value={String(totals.nodes)} unit="个" delta={`${edges.length} 条连线`} icon="workflow" tone="blue" />
        <StatCard label="处理数据" value={ran ? '128.6' : '—'} unit={ran ? '万' : ''} delta="今日累计" icon="database" tone="violet" />
        <StatCard label="异常拦截" value={ran ? String(totals.fail) : '—'} unit="行" delta={ran ? '拦截率 0.17%' : '运行后展示'} icon="circlealert" tone="amber" onClick={() => ran && openExceptionDrill()} />
        <StatCard label="合格入库" value={ran ? '128,428' : '—'} unit="行" delta={phase === 'running' ? '执行中…' : ran ? 'DWD 已写入' : '待执行'} icon="checkcircle" tone="green" />
      </div>

      <div className="qc-hub-layout mt-14">
        <aside className="qc-palette">
          <Card title="节点库" subtitle="点击添加 · 画布可拖拽">
            <div className="qc-palette-list">
              {palette.map((p) => (
                <button key={p.label} type="button" className={`qc-palette-item tone-${p.tone}`} onClick={() => addNode(p)} disabled={phase === 'running'}>
                  <span><Icon name={p.icon} size={14} /></span>
                  <div>
                    <strong>{p.label}</strong>
                    <small>{p.hint}</small>
                  </div>
                  <Icon name="plus" size={12} />
                </button>
              ))}
            </div>
            <div className="info-note mt-10">
              <Icon name="sparkles" size={12} />
              <span>演示路径：点「运行流程」→ 观察节点亮起 → 点异常节点看明细。</span>
            </div>
          </Card>
        </aside>

        <Card
          className="qc-hub-canvas-card"
          noPad
          title="质控流程画布"
          subtitle="React Flow · 拖拽节点编排 · 点击配置"
          actions={
            <div className="row-actions">
              <Badge tone="slate">自动布局</Badge>
              <Badge tone={phase === 'running' ? 'violet' : ran ? 'green' : 'slate'} dot>
                {phase === 'running' ? '执行中' : ran ? '已完成' : '草稿'}
              </Badge>
            </div>
          }
        >
          <div className="qc-hub-canvas">
            <LakeFlowCanvas
              graph={graph}
              edges={edges}
              edgeStates={edgeStates}
              selectedId={selectedId}
              onSelect={(id) => id && setSelectedId(id)}
            />
          </div>
        </Card>

        <aside className="qc-hub-side">
          <Card title="节点配置" subtitle={selected?.label || '未选中'}>
            {selected && (
              <>
                <div className="qc-node-badge">
                  <span className={`qc-node-icon type-${selected.tone === 'amber' ? 'indicator' : selected.tone === 'red' ? 'app' : selected.tone === 'green' ? 'model' : selected.tone === 'violet' ? 'ods' : 'source'}`}>
                    <Icon name={selected.icon} size={17} />
                  </span>
                  <div>
                    <strong>{selected.label}</strong>
                    <small>{selected.engine} · {selected.resource}</small>
                  </div>
                  <Badge tone={selected.state === 'warn' ? 'amber' : selected.state === 'ok' ? 'green' : selected.state === 'run' ? 'violet' : 'slate'} dot>
                    {selected.state === 'warn' ? '有异常' : selected.state === 'run' ? '执行中' : selected.state === 'ok' ? '已完成' : '未执行'}
                  </Badge>
                </div>

                {selected.kind === 'quality' ? (
                  <div className="form-grid">
                    <Field label="规则集">
                      <Select
                        value={ruleSet}
                        onChange={setRuleSet}
                        options={['完整性规则集', '一致性规则集', '规范性规则集', '及时性规则集', '稳定性规则集']}
                      />
                    </Field>
                    <Field label="执行方式">
                      <Select value="批量 10 万" onChange={() => {}} options={['批量 10 万', '逐行流式', '抽样 5%']} />
                    </Field>
                    <Field label="异常阈值"><input className="input" defaultValue="0.5%" /></Field>
                    <Field label="失败动作">
                      <Select value={failAction} onChange={setFailAction} options={['分流到异常表', '阻断任务', '仅告警']} />
                    </Field>
                    <Field label="规则清单" className="span-2">
                      <div className="qc-rule-chips">
                        {(ruleSets[selected.id] || ['主键非空', '必填完整', '关联完整']).map((r) => (
                          <span key={r}><Icon name="check" size={11} />{r}</span>
                        ))}
                      </div>
                    </Field>
                  </div>
                ) : (
                  <KeyValue
                    cols={1}
                    items={[
                      { label: '节点类型', value: selected.kind },
                      { label: '输入', value: selected.inRows === '—' ? '—' : `${selected.inRows} 行` },
                      { label: '输出', value: selected.outRows === '—' ? '—' : `${selected.outRows} 行` },
                      { label: '耗时', value: selected.duration },
                      { label: '负责人', value: selected.owner },
                      { label: '脚本提示', value: selected.sqlHint || '—' },
                    ]}
                  />
                )}
                <div className="divider-h" />
                <div className="qc-config-actions">
                  <Btn size="sm" icon="settings" onClick={() => notify('高级配置已打开', 'info')}>高级</Btn>
                  <Btn size="sm" variant="primary" onClick={() => notify('节点配置已保存')}>保存节点</Btn>
                </div>
              </>
            )}
          </Card>

          <Card className="mt-14" title="执行日志" subtitle="最近一次运行">
            <div className="qc-mini-log">
              {logs.length === 0 ? (
                <div><span>—</span>尚未执行，点击「运行流程」</div>
              ) : logs.slice(-8).map((line) => (
                <div key={line} className={line.includes('异常') ? 'warn' : line.includes('完成') ? 'ok' : ''}>
                  <span />
                  {line}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Card
        className="mt-14"
        title="运行结果"
        subtitle={ran ? '本次运行产生 214 条异常，已分流至异常表 · 点击行下钻' : '运行流程后展示节点指标与异常明细'}
        noPad
        actions={ran ? <Btn size="sm" icon="download" onClick={() => notify('异常明细已导出')}>导出异常</Btn> : undefined}
      >
        <div className="qc-result-tabs">
          <Tabs
            variant="line"
            value={tab}
            onChange={(k) => setTab(k as typeof tab)}
            items={[
              { key: 'exceptions', label: '异常明细', count: ran ? exceptionRows.length : 0 },
              { key: 'nodes', label: '节点指标', count: graph.length },
              { key: 'log', label: '执行日志' },
            ]}
          />
          <span className="muted xs">{ran ? '最近执行完成 · 可按选中节点过滤异常' : '尚未执行'}</span>
        </div>
        <div className="pad-h">
          {tab === 'exceptions' && (
            ran ? (
              <DataTable
                rows={exceptionRows}
                pageSize={6}
                paginate={false}
                onRowClick={(r) => openExceptionDrill(r)}
                columns={[
                  { key: '0', title: '异常ID', width: 90, render: (r) => <span className="mono-cell">{r[0]}</span> },
                  { key: '1', title: '异常描述', render: (r) => <div className="cell-main"><strong>{r[1]}</strong><small>{r[2]}</small></div> },
                  { key: '3', title: '维度', width: 80, render: (r) => <Badge tone="slate">{r[3]}</Badge> },
                  { key: '4', title: '等级', width: 68, render: (r) => <Badge tone={r[4] === '高' ? 'red' : 'amber'}>{r[4]}</Badge> },
                  { key: '5', title: '影响行数', width: 90, align: 'right', render: (r) => <span className="text-red strong">{r[5]}</span> },
                  { key: '6', title: '状态', width: 80, render: (r) => <Badge dot>{r[6]}</Badge> },
                  {
                    key: '7', title: '操作', width: 72,
                    render: (r) => <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); openExceptionDrill(r); }}>下钻</button>,
                  },
                ]}
              />
            ) : (
              <div className="empty-hint">运行流程后，异常将按节点分流展示，支持下钻处理。</div>
            )
          )}
          {tab === 'nodes' && (
            <DataTable
              rows={graph}
              pageSize={8}
              paginate={false}
              onRowClick={(n) => setSelectedId(n.id)}
              columns={[
                { key: 'label', title: '节点', render: (n) => <div className="cell-main"><strong>{n.label}</strong><small>{n.resource}</small></div> },
                { key: 'inRows', title: '输入', width: 110, align: 'right' },
                { key: 'outRows', title: '输出', width: 110, align: 'right' },
                {
                  key: 'retries', title: '异常', width: 90, align: 'right',
                  render: (n) => {
                    const f = runMetrics[n.id]?.fail;
                    return ran && f ? <span className="text-red">{f}</span> : '0';
                  },
                },
                {
                  key: 'state', title: '状态', width: 90,
                  render: (n) => (
                    <Badge tone={n.state === 'warn' ? 'amber' : n.state === 'ok' ? 'green' : 'slate'} dot>
                      {n.state === 'warn' ? '有异常' : n.state === 'run' ? '执行中' : n.state === 'ok' ? '已完成' : '未执行'}
                    </Badge>
                  ),
                },
              ]}
            />
          )}
          {tab === 'log' && (
            <div className="log-console">
              {logs.length === 0 ? (
                <div><span className="lt">—</span><span className="li">INFO</span><span>等待运行…</span></div>
              ) : logs.map((line) => {
                const warn = line.includes('异常');
                const ok = line.includes('完成') && !warn;
                return (
                  <div key={line}>
                    <span className="lt">{line.slice(0, 8)}</span>
                    <span className={`li ${warn ? 'warn' : ok ? 'ok' : ''}`}>{warn ? 'WARN' : ok ? 'SUCCESS' : 'INFO'}</span>
                    <span>{line.slice(9)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Drawer
        open={!!activeEx}
        onClose={() => setActiveEx(null)}
        width={560}
        title={activeEx?.[1] || ''}
        desc={activeEx ? `${activeEx[0]} · ${activeEx[2]}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveEx(null)}>关闭</Btn>
            <Btn icon="git" onClick={() => { notify('已跳转血缘追溯', 'info'); go('/collection/lineage'); }}>血缘追溯</Btn>
            <Btn variant="primary" onClick={() => { setActiveEx(null); notify('异常已分派给责任人'); }}>分派处理</Btn>
          </>
        }
      >
        {activeEx && (
          <>
            <div className="drawer-summary">
              <div><span>影响行数</span><strong className="text-red">{activeEx[5]}</strong></div>
              <div><span>质量维度</span><strong>{activeEx[3]}</strong></div>
              <div><span>等级</span><strong>{activeEx[4]}</strong></div>
              <div><span>状态</span><strong>{activeEx[6]}</strong></div>
            </div>
            <KeyValue
              className="mt-14"
              cols={2}
              items={[
                { label: '数据表', value: activeEx[2] },
                { label: '发现时间', value: '2026-08-06 14:21' },
                { label: '所属节点', value: selected?.label || '异常分流' },
                { label: '失败动作', value: failAction },
                { label: '违反规则', value: '主键非空 / 值域校验 / 及时性阈值', wide: true },
                { label: '修正建议', value: '核查上游接口与源端数据，补充缺失字段并重跑质控任务。', wide: true },
              ]}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
