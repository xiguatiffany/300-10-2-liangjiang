import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut, BarList, TopoLinks } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, PageHeader, Progress, SearchInput, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { collectionStats, syncDelays, runTasks, alerts, monitorStats, dataGrowth, hosts } from '../../data';

type BoardTab = 'overview' | 'tasks' | 'tables';

type TableBoardRow = {
  id: string;
  table: string;
  layer: string;
  rows: string;
  volume: string;
  reconcile: '一致' | '差异';
  qc: number;
  flow: string;
  last: string;
};

const tableBoard: TableBoardRow[] = [
  { id: 'TB-01', table: 'ods_emr.EMR_CPOE_BA_SSK', layer: 'ODS', rows: '12.8M', volume: '86 GB', reconcile: '一致', qc: 98.6, flow: '门诊就诊入仓', last: '14:20' },
  { id: 'TB-02', table: 'dwd_visit.outpatient_fact', layer: 'DWD', rows: '4.2M', volume: '22 GB', reconcile: '一致', qc: 99.1, flow: '门诊宽表', last: '02:40' },
  { id: 'TB-03', table: 'ods_lis.lab_result', layer: 'ODS', rows: '86.4M', volume: '210 GB', reconcile: '差异', qc: 94.2, flow: '检验实时入仓', last: '14:18' },
  { id: 'TB-04', table: 'ods_icu.vital_sign', layer: 'ODS', rows: '1.1M', volume: '8 GB', reconcile: '差异', qc: 91.0, flow: 'ICU CDC', last: '13:40' },
  { id: 'TB-05', table: 'dm_ops.daily_kpi', layer: 'DM', rows: '186K', volume: '1.2 GB', reconcile: '一致', qc: 97.8, flow: '运营指标汇总', last: '05:02' },
  { id: 'TB-06', table: 'ods_pacs.study_index', layer: 'ODS', rows: '2.6M', volume: '14 GB', reconcile: '一致', qc: 96.4, flow: '影像索引增量', last: '14:00' },
];

const taskBoard = [
  { id: 'TK-01', name: '患者主索引日批', mode: '离线', metric: '成功率 98.6%', status: '成功', flow: '主索引DAG', lag: '—' },
  { id: 'TK-02', name: 'EMR CPOE 增量同步', mode: '离线', metric: '耗时 2m18s', status: '运行中', flow: '门诊就诊入仓', lag: '—' },
  { id: 'TK-03', name: '检验结果实时入仓', mode: '实时', metric: 'QPS 1.2k/s', status: '运行中', flow: '检验实时入仓', lag: '3.8s' },
  { id: 'TK-04', name: 'HIS 就诊 CDC', mode: '实时', metric: 'QPS 860/s', status: '运行中', flow: 'HIS CDC', lag: '1.2s' },
  { id: 'TK-05', name: '影像索引增量', mode: '实时', metric: 'Lag —', status: '失败', flow: '影像索引增量', lag: '—' },
  { id: 'TK-06', name: '检验对账日任务', mode: '离线', metric: '一致率 97.1%', status: '成功', flow: '检验对账', lag: '—' },
];

export function CollectionOverview() {
  const { go, notify } = useApp();
  const [range, setRange] = useState('today');
  return (
    <>
      <PageHeader eyebrow="DATA COLLECTION MONITOR" title="首页概览" desc="全院数据采集与同步运行态势，实时监测通道健康度、数据延迟与对账差异。" actions={<><Btn icon="refresh" onClick={() => notify('监控数据已刷新 · 14:21:32')}>刷新</Btn><Btn variant="primary" icon="play" onClick={() => notify('已触发全量通道健康检查')}>健康检查</Btn></>} />
      <div className="stat-grid cols-5">
        {collectionStats.map((s) => <StatCard key={s.label} {...s} onClick={() => {
          if (s.label === '接入数据源') go('/collection/services');
          else if (s.label === '采集通道') go('/collection/channels');
          else if (s.label === '今日同步任务') go('/collection/tasks');
          else if (s.label === '延迟告警') go('/collection/alerts');
          else go('/collection/runtime');
        }} />)}
      </div>

      <div className="monitor-grid mt-14">
        <div className="monitor-left">
          <Card title="实时监控概览" subtitle="数据同步 · 对账 · 指标状态" actions={<span className="live-badge"><i /> 实时刷新</span>} noPad>
            <div className="realtime-strip">
              <div className="rt-panel">
                <div className="rt-head"><span>数据库同步状态</span><Badge tone="green">健康</Badge></div>
                <div className="rt-body">
                  <Donut size={128} thickness={12} centerValue="100" label="同步正常" segments={[
                    { label: '同步正常', value: 100, color: '#6755F5' }, { label: '延迟', value: 34, color: '#F59E0B' }, { label: '异常', value: 0, color: '#DC2626' },
                  ].filter((s) => s.value > 0)} />
                </div>
                <div className="rt-foot"><span>通道 134</span><strong className="text-green">正常 100</strong><strong className="text-amber">延迟 34</strong></div>
              </div>
              <div className="rt-panel">
                <div className="rt-head"><span>数据表对账状态</span><Badge tone="amber">需关注</Badge></div>
                <div className="rt-body">
                  <Donut size={128} thickness={12} centerValue="95%" label="对账一致" segments={[
                    { label: '一致', value: 3510, color: '#059669' }, { label: '差异', value: 186, color: '#DC2626' },
                  ]} />
                </div>
                <div className="rt-foot"><span>数据表 3,696</span><strong className="text-green">一致 3,510</strong><strong className="text-red">差异 186</strong></div>
              </div>
              <div className="rt-panel">
                <div className="rt-head"><span>数据指标状态</span><Badge tone="green">正常</Badge></div>
                <div className="rt-body">
                  <Donut size={128} thickness={12} centerValue="96.7%" label="指标正常" segments={[
                    { label: '正常', value: 2486, color: '#9587FF' }, { label: '异常', value: 86, color: '#DC2626' },
                  ]} />
                </div>
                <div className="rt-foot"><span>指标 2,572</span><strong className="text-green">正常 2,486</strong><strong className="text-red">异常 86</strong></div>
              </div>
            </div>
          </Card>
          <Card title="数据同步趋势" subtitle="近 14 日同步任务量与成功率" className="mt-14" actions={<Tabs variant="pill" value={range} onChange={setRange} items={[{ key: 'today', label: '任务量' }, { key: 'rate', label: '成功率' }]} />}>
            <AreaChart data={dataGrowth.map((d, i) => ({ ...d, value: 860 + i * 38 + (i % 3) * 42 }))} color="#6755F5" height={186} suffix=" 次" valueName="同步任务" />
          </Card>
        </div>
        <div className="monitor-right">
          <Card title="数据同步延迟监控" subtitle="最近统计时间 2026-08-06 14:10:02" actions={<><button className="link-btn" onClick={() => notify('阈值设置已打开', 'info')}>阈值设置</button><span className="live-badge"><i /> LIVE</span></>}>
            <div className="delay-summary"><div><span className="dot green" />正常 <strong>32</strong></div><div><span className="dot amber" />延迟 <strong>5</strong></div><div><span className="dot red" />异常 <strong>1</strong></div><button className="link-btn" onClick={() => go('/collection/channels')}>全部通道 <Icon name="arrowright" size={11} /></button></div>
            <TopoLinks items={syncDelays.slice(0, 8)} />
            <div className="delay-note"><Icon name="circlealert" size={13} /><span>ICU_SmartCare 延迟 34 分钟，已触发告警规则「延迟 &gt; 30min」。</span></div>
          </Card>
          <Card className="mt-14" title="实时告警" subtitle="未处理告警" actions={<button className="link-btn" onClick={() => go('/collection/alerts')}>全部 <Icon name="arrowright" size={11} /></button>}>
            <div className="mini-alert-list">
              {alerts.slice(0, 4).map((a) => (
                <button key={a.id} onClick={() => go('/collection/alerts')}>
                  <span className={a.level === '严重' ? 'ma red' : 'ma amber'}><Icon name={a.level === '严重' ? 'circlealert' : 'alert'} size={13} /></span>
                  <div><strong>{a.title}</strong><small>{a.time} · {a.type}</small></div>
                  <Badge tone={a.level === '严重' ? 'red' : 'amber'}>{a.level}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="最近同步任务" subtitle="采集任务执行明细" noPad actions={<Btn size="sm" variant="ghost" icon="arrowright" onClick={() => go('/collection/tasks')}>任务列表</Btn>}>
          <div className="pad-h">
            <DataTable rows={runTasks.slice(0, 5)} pageSize={5} paginate={false} dense columns={[
              { key: 'config', title: '任务', render: (r) => <div className="cell-main"><strong>{r.config}</strong><small>{r.id}</small></div> },
              { key: 'started', title: '开始时间', width: 130, render: (r) => <span className="muted">{r.started.slice(5)}</span> },
              { key: 'rows', title: '行数', width: 92, align: 'right', render: (r) => <span className="mono-cell">{r.rows}</span> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
            ]} />
          </div>
        </Card>
        <Card title="主机负载" subtitle="采集执行节点资源使用">
          <BarList items={hosts.slice(0, 5).map((h) => ({ label: h.hostname, value: h.cpu, display: `${h.cpu}%` }))} color="#9587FF" />
          <div className="divider-h" />
          <div className="host-summary"><span><i className="ok" />在线 7</span><span><i className="warn" />维护 1</span><button className="link-btn" onClick={() => go('/collection/hosts')}>主机信息 <Icon name="arrowright" size={11} /></button></div>
        </Card>
      </div>
    </>
  );
}

export function RuntimeMonitor({ title = '运行监控', eyebrow = 'RUNTIME MONITORING' }: { title?: string; eyebrow?: string; param?: string } = {}) {
  const { go, notify } = useApp();
  const [range, setRange] = useState('1h');
  const [board, setBoard] = useState<BoardTab>('overview');
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState<'sync' | 'reconcile' | 'indicator' | null>(null);
  const [activeTask, setActiveTask] = useState<typeof taskBoard[0] | null>(null);
  const [activeTable, setActiveTable] = useState<TableBoardRow | null>(null);
  const [activeNode, setActiveNode] = useState<{ name: string; flow: string; status: string; rows?: string } | null>(null);
  const [layer, setLayer] = useState<'overview' | 'dag' | 'node' | 'log'>('overview');

  const filteredTasks = useMemo(() => taskBoard.filter((t) =>
    (t.name + t.mode + t.flow).toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const filteredTables = useMemo(() => tableBoard.filter((t) => {
    if (focus === 'reconcile' && t.reconcile !== '差异') return false;
    return (t.table + t.layer + t.flow).toLowerCase().includes(q.toLowerCase());
  }), [q, focus]);

  const openDrill = (flow: string, nodeName: string, status: string, rows?: string) => {
    setActiveNode({ name: nodeName, flow, status, rows });
    setLayer('node');
  };

  const toneOf = (s: string) => {
    if (['成功', '一致'].includes(s)) return 'green';
    if (s === '运行中') return 'blue';
    if (s === '失败' || s === '差异') return 'red';
    return 'slate';
  };

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        desc="同步 / 对账 / 指标三张看板；任务看板与表看板可穿透流程图、数据量、异常日志与质控（总览→DAG→节点→日志）。"
        actions={
          <>
            <span className="last-refresh"><i /> 最后刷新 14:21:32</span>
            <Btn icon="workflow" onClick={() => go('/collection/lake-flows')}>打开 DAG</Btn>
            <Btn icon="clipboard" onClick={() => go('/collection/tasks')}>任务中心</Btn>
            <Btn icon="refresh" onClick={() => notify('运行监控数据已刷新')}>刷新</Btn>
            <Btn variant="primary" icon="settings" onClick={() => notify('监控阈值设置已打开', 'info')}>阈值设置</Btn>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="离线成功率" value="99.2" unit="%" delta="今日 1,286 实例" icon="checkcircle" tone="green" onClick={() => setBoard('tasks')} />
        <StatCard label="实时平均 Lag" value="2.4" unit="s" delta="QPS 峰值 1.8k/s" icon="zap" tone="amber" onClick={() => setBoard('tasks')} />
        <StatCard label="对账差异表" value="186" unit="张" delta="一致率 95.0%" icon="list" tone="red" onClick={() => { setBoard('tables'); setFocus('reconcile'); }} />
        <StatCard label="质控均值" value="96.8" unit="%" delta="异常待处理 12" icon="gauge" tone="blue" onClick={() => setBoard('tables')} />
      </div>

      <div className="rt-cards mt-14">
        <button type="button" className={`rt-card${focus === 'sync' ? ' is-active' : ''}`} onClick={() => { setFocus('sync'); setBoard('overview'); }}>
          <div className="rt-card-head"><span>数据库同步状态统计</span><Badge tone="green" dot>正常</Badge></div>
          <div className="rt-card-body">
            <Donut size={150} thickness={13} centerValue={String(monitorStats.sync.normal)} label="同步正常" segments={[{ label: '同步正常', value: monitorStats.sync.normal, color: '#6755F5' }, { label: '延迟', value: monitorStats.sync.delayed, color: '#F59E0B' }]} />
          </div>
          <div className="rt-card-foot"><span>同步通道 {monitorStats.sync.total}</span><span className="text-green">正常 {monitorStats.sync.normal}</span><span className="text-amber">延迟 {monitorStats.sync.delayed}</span><span className="text-red">异常 {monitorStats.sync.bad}</span></div>
        </button>
        <button type="button" className={`rt-card${focus === 'reconcile' ? ' is-active' : ''}`} onClick={() => { setFocus('reconcile'); setBoard('tables'); }}>
          <div className="rt-card-head"><span>数据表对账状态统计</span><Badge tone="amber" dot>需关注</Badge></div>
          <div className="rt-card-body">
            <Donut size={150} thickness={13} centerValue={`${monitorStats.reconcile.rate}%`} label="对账一致率" segments={[{ label: '一致', value: monitorStats.reconcile.normal, color: '#059669' }, { label: '差异', value: monitorStats.reconcile.abnormal, color: '#DC2626' }]} />
          </div>
          <div className="rt-card-foot"><span>数据表 {monitorStats.reconcile.total.toLocaleString()}</span><span className="text-green">一致 {monitorStats.reconcile.normal.toLocaleString()}</span><span className="text-red">差异 {monitorStats.reconcile.abnormal}</span></div>
        </button>
        <button type="button" className={`rt-card${focus === 'indicator' ? ' is-active' : ''}`} onClick={() => { setFocus('indicator'); setBoard('tasks'); }}>
          <div className="rt-card-head"><span>数据指标状态统计</span><Badge tone="green" dot>正常</Badge></div>
          <div className="rt-card-body">
            <Donut size={150} thickness={13} centerValue={`${monitorStats.indicator.rate}%`} label="指标正常率" segments={[{ label: '正常', value: monitorStats.indicator.normal, color: '#9587FF' }, { label: '异常', value: monitorStats.indicator.abnormal, color: '#DC2626' }]} />
          </div>
          <div className="rt-card-foot"><span>指标 {monitorStats.indicator.total.toLocaleString()}</span><span className="text-green">正常 {monitorStats.indicator.normal.toLocaleString()}</span><span className="text-red">异常 {monitorStats.indicator.abnormal}</span></div>
        </button>
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={board}
        onChange={(k) => setBoard(k as BoardTab)}
        items={[
          { key: 'overview', label: '总览' },
          { key: 'tasks', label: '任务看板', count: taskBoard.length },
          { key: 'tables', label: '表看板', count: tableBoard.length },
        ]}
      />

      {board === 'overview' && (
        <>
          <Card className="mt-14" title="四层穿透演示路径" subtitle="总览 → DAG → 节点 → 日志" actions={<Btn size="sm" variant="primary" icon="play" onClick={() => openDrill('门诊就诊入仓', '写入 ODS', '运行中', '128,642')}>一键演示穿透</Btn>}>
            <div className="schema-map" style={{ flexWrap: 'wrap', gap: 8 }}>
              {[
                ['① 总览指标', () => notify('当前层：总览 · 同步/对账/指标')],
                ['② 打开流程图', () => go('/collection/lake-flows')],
                ['③ 查看节点', () => openDrill('检验实时入仓', 'Flink Sink', '运行中', '1.2k/s')],
                ['④ 运行日志', () => { openDrill('门诊就诊入仓', '增量抽取', '成功', '42,186'); setLayer('log'); }],
              ].map(([label, fn]) => (
                <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>{label as string}</button>
              ))}
            </div>
          </Card>

          <div className="rt-delay-card mt-14">
            <div className="rtd-head">
              <div><h3>数据同步延迟监控</h3><p>最后统计时间：2026-08-06 14:10:02 · 窗口 {range}</p></div>
              <div className="rtd-actions">
                <Tabs variant="pill" value={range} onChange={setRange} items={[{ key: '1h', label: '近 1 小时' }, { key: '6h', label: '近 6 小时' }, { key: '24h', label: '近 24 小时' }]} />
                <button className="link-muted" onClick={() => notify('已进入全屏监控', 'info')}><Icon name="expand" size={13} /> 全屏</button>
              </div>
            </div>
            <div className="delay-topology">
              <div className="dt-hub"><span><Icon name="database" size={20} /></span><strong>数据采集控制机</strong><small>192.168.242.45</small><em><i /> 运行正常</em></div>
              <div className="dt-lines" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <span key={i} style={{ left: `${12 + i * 25}%` }} />)}
              </div>
              <div className="dt-nodes">
                {syncDelays.slice(0, 8).map((s) => (
                  <button type="button" className={`dt-node is-${s.level}`} key={s.source} onClick={() => openDrill(s.source, s.target, s.level === 'bad' ? '失败' : '运行中')}>
                    <div className="dtn-head"><span className="dtn-icon"><Icon name="cable" size={12} /></span><strong>{s.source}</strong></div>
                    <small>{s.target}</small>
                    <div className="dtn-foot"><span className={`delay-chip is-${s.level}`}>{s.delay}</span><span className="muted xs">延迟</span></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rtd-foot"><span><i className="ok" />延迟 &lt; 10 分钟 5</span><span><i className="warn" />10—30 分钟 2</span><span><i className="bad" />&gt; 30 分钟 1</span><button className="link-btn" onClick={() => go('/collection/channels')}>查看全部通道 <Icon name="arrowright" size={11} /></button></div>
          </div>

          <div className="grid grid-2-1 mt-14">
            <Card title="同步任务运行状态" subtitle="点击行查看节点与日志" noPad actions={<button className="link-btn" onClick={() => go('/collection/tasks')}>任务中心 <Icon name="arrowright" size={11} /></button>}>
              <div className="pad-h">
                <DataTable
                  rows={runTasks.slice(0, 5)}
                  pageSize={5}
                  paginate={false}
                  onRowClick={(r) => openDrill(r.config, '同步执行节点', r.status, r.rows)}
                  columns={[
                    { key: 'config', title: '任务', render: (r) => <div className="cell-main"><strong>{r.config}</strong><small>{r.type} · {r.operator}</small></div> },
                    { key: 'progress', title: '进度', width: 150, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.status === '失败' ? 'red' : r.status === '运行中' ? 'blue' : 'green'} /><span>{r.progress}%</span></div> },
                    { key: 'duration', title: '耗时', width: 80, render: (r) => <span className="muted">{r.duration}</span> },
                    { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  ]}
                />
              </div>
            </Card>
            <Card title="运行健康度" subtitle="近 24 小时">
              <div className="health-list">
                {[['同步成功率', 99.2, 'green'], ['对账一致率', 95.0, 'amber'], ['指标计算成功率', 96.7, 'blue'], ['主机可用率', 100, 'green']].map(([l, v, t]) => (
                  <div key={l as string}><div className="resource-head"><span>{l}</span><strong>{v}%</strong></div><Progress value={v as number} tone={t as string} height={7} /></div>
                ))}
              </div>
              <div className="divider-h" />
              <div className="live-log">
                <span className="mono-cell">14:20:12</span><span>ods_emr_cpoe_sync 开始执行</span>
                <span className="mono-cell">14:12:08</span><span>调度节点心跳正常</span>
                <span className="mono-cell">14:10:02</span><span>延迟监控采样完成</span>
              </div>
            </Card>
          </div>
        </>
      )}

      {board === 'tasks' && (
        <Card className="mt-14" title="任务看板" subtitle="离线批 · 实时流 · 穿透到流程图与日志" noPad
          actions={<div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="任务 / 流程" width={200} /><Btn size="sm" onClick={() => go('/collection/tasks')}>任务中心</Btn></div>}
        >
          <div className="pad-h">
            <DataTable
              rows={filteredTasks}
              pageSize={8}
              onRowClick={(r) => setActiveTask(r as typeof taskBoard[0])}
              columns={[
                { key: 'name', title: '任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.flow}</small></div> },
                { key: 'mode', title: '模式', width: 70, render: (r) => <Badge tone={r.mode === '实时' ? 'amber' : 'blue'}>{r.mode}</Badge> },
                { key: 'metric', title: '运行指标', width: 130, render: (r) => r.metric },
                { key: 'lag', title: 'Lag', width: 70, render: (r) => r.lag },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '穿透', width: 160,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => go('/collection/lake-flows')}>DAG</button>
                      <button className="link-btn" onClick={() => openDrill(r.flow, r.name, r.status)}>节点</button>
                      <button className="link-muted" onClick={() => { openDrill(r.flow, r.name, r.status); setLayer('log'); }}>日志</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {board === 'tables' && (
        <Card className="mt-14" title="表看板" subtitle="数据量 · 对账 · 质控 · 关联流程" noPad
          actions={
            <div className="filter-bar">
              <SearchInput value={q} onChange={setQ} placeholder="表名 / 层级" width={200} />
              {focus === 'reconcile' && <Badge tone="amber">仅差异</Badge>}
              <Btn size="sm" onClick={() => go('/collection/reconcile')}>对账配置</Btn>
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={filteredTables}
              pageSize={8}
              onRowClick={(r) => setActiveTable(r as TableBoardRow)}
              columns={[
                { key: 'table', title: '表', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.table}</strong><small>{r.layer} · {r.flow}</small></div> },
                { key: 'rows', title: '行数', width: 80, render: (r) => r.rows },
                { key: 'volume', title: '容量', width: 70, render: (r) => r.volume },
                { key: 'reconcile', title: '对账', width: 70, render: (r) => <Badge tone={toneOf(r.reconcile)}>{r.reconcile}</Badge> },
                { key: 'qc', title: '质控', width: 90, render: (r) => <div className="quality-cell"><Progress value={r.qc} tone={r.qc < 95 ? 'amber' : 'green'} /><span>{r.qc}%</span></div> },
                { key: 'last', title: '更新', width: 60, render: (r) => r.last },
                {
                  key: 'ops', title: '穿透', width: 140,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => go('/collection/lake-flows')}>流程</button>
                      <button className="link-btn" onClick={() => openDrill(r.flow, r.table, r.reconcile === '差异' ? '失败' : '成功', r.rows)}>节点</button>
                      <button className="link-muted" onClick={() => go('/collection/quality')}>质控</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer
        open={!!activeNode}
        onClose={() => { setActiveNode(null); setLayer('overview'); }}
        width={720}
        title={activeNode ? `${layer === 'log' ? '运行日志' : '节点详情'} · ${activeNode.name}` : ''}
        desc={activeNode ? `流程 ${activeNode.flow} · 层 ${layer === 'log' ? '④ 日志' : '③ 节点'}` : ''}
        footer={
          <>
            <Btn onClick={() => { setActiveNode(null); setLayer('overview'); }}>关闭</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/lake-flows')}>② 打开 DAG</Btn>
            {layer !== 'log' && <Btn icon="rows" onClick={() => setLayer('log')}>④ 查看日志</Btn>}
            <Btn variant="primary" icon="clipboard" onClick={() => go('/collection/tasks')}>任务中心</Btn>
          </>
        }
      >
        {activeNode && (
          <>
            <div className="drawer-summary">
              <div><span>穿透层</span><strong>{layer === 'log' ? '④ 日志' : '③ 节点'}</strong></div>
              <div><span>状态</span><strong>{activeNode.status}</strong></div>
              <div><span>数据量</span><strong>{activeNode.rows || '—'}</strong></div>
              <div><span>流程</span><strong>{activeNode.flow}</strong></div>
            </div>
            {layer === 'log' ? (
              <div className="log-console">
                <div><span className="lt">14:20:12</span><span className="li">INFO</span><span>节点 {activeNode.name} 启动 · 流程 {activeNode.flow}</span></div>
                <div><span className="lt">14:20:13</span><span className="li">INFO</span><span>读取上游依赖与资源配额…</span></div>
                <div><span className="lt">14:20:18</span><span className="li">INFO</span><span>写入进度更新 · 当前 {activeNode.rows || '处理中'}</span></div>
                {activeNode.status === '失败' ? (
                  <div><span className="lt">14:21:08</span><span className="li warn">ERROR</span><span>节点失败，可跳转任务中心重跑或打开 DAG 定位</span></div>
                ) : (
                  <div><span className="lt">14:22:30</span><span className="li ok">SUCCESS</span><span>节点执行完成，质控抽样通过</span></div>
                )}
              </div>
            ) : (
              <div className="info-note mt-14">
                <Icon name="workflow" size={13} />
                <span>从总览进入节点后，可继续打开完整 React Flow 画布，或下钻到运行日志。</span>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Drawer open={!!activeTask} onClose={() => setActiveTask(null)} title={activeTask?.name || ''} desc={activeTask ? `${activeTask.mode} · ${activeTask.flow}` : ''} width={480}
        footer={
          <>
            <Btn onClick={() => setActiveTask(null)}>关闭</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/lake-flows')}>打开 DAG</Btn>
            <Btn variant="primary" onClick={() => { if (activeTask) openDrill(activeTask.flow, activeTask.name, activeTask.status); setActiveTask(null); }}>查看节点</Btn>
          </>
        }
      >
        {activeTask && (
          <ul className="feed-list">
            <li><span className="feed-ico blue"><Icon name="activity" size={13} /></span><div><strong>{activeTask.metric}</strong><small>运行指标</small></div></li>
            <li><span className="feed-ico amber"><Icon name="zap" size={13} /></span><div><strong>Lag {activeTask.lag}</strong><small>实时延迟</small></div></li>
            <li><span className="feed-ico violet"><Icon name="workflow" size={13} /></span><div><strong>{activeTask.flow}</strong><small>关联流程图</small></div></li>
          </ul>
        )}
      </Drawer>

      <Drawer open={!!activeTable} onClose={() => setActiveTable(null)} title={activeTable?.table || ''} desc={activeTable ? `${activeTable.layer} · ${activeTable.flow}` : ''} width={520}
        footer={
          <>
            <Btn onClick={() => setActiveTable(null)}>关闭</Btn>
            <Btn onClick={() => go('/collection/quality')}>质控详情</Btn>
            <Btn variant="primary" icon="workflow" onClick={() => go('/collection/lake-flows')}>打开流程</Btn>
          </>
        }
      >
        {activeTable && (
          <>
            <div className="drawer-summary">
              <div><span>行数</span><strong>{activeTable.rows}</strong></div>
              <div><span>容量</span><strong>{activeTable.volume}</strong></div>
              <div><span>对账</span><strong>{activeTable.reconcile}</strong></div>
              <div><span>质控</span><strong>{activeTable.qc}%</strong></div>
            </div>
            <div className="info-note mt-14"><Icon name="circlealert" size={13} /><span>{activeTable.reconcile === '差异' ? '存在对账差异，建议结合任务中心补跑并复核质控规则。' : '对账一致，可继续查看关联流程与历史实例。'}</span></div>
          </>
        )}
      </Drawer>
    </>
  );
}
