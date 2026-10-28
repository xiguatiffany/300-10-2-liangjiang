'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart } from '../../components/charts';
import { ChannelFlowSankey } from '../../components/ChannelFlowSankey';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { cdcEvents as seedEvents, delaySeries, realtimeChannels } from '../../dataBid';

type TabKey = 'realtime' | 'offline' | 'doris' | 'sources';
type CdcRow = [string, string, string, string, string, string];
type LakeRow = { pk: string; name: string; phone: string; op: string; ts: string; synced: boolean };
type AcceptPhase = 'mutate' | 'capture' | 'lake' | 'verify';

const offlineJobs = [
  { id: 'OL-01', name: 'HIS 全量入湖', source: 'HIS 生产库', target: 'ods_his.*', schedule: '每日 02:00', status: '成功', rows: '12.8M', last: '08-06 02:40' },
  { id: 'OL-02', name: 'EMR 增量入湖', source: 'EMR 临床库', target: 'ods_emr.*', schedule: '每 10 分钟', status: '运行中', rows: '428K', last: '14:20' },
  { id: 'OL-03', name: '公卫周批入湖', source: '公卫库', target: 'ods_ph.*', schedule: '每周一 03:00', status: '成功', rows: '1.2M', last: '08-05 03:12' },
  { id: 'OL-04', name: 'HRP 成本入湖', source: 'HRP 运营库', target: 'ods_hrp.*', schedule: '每日 01:30', status: '失败', rows: '—', last: '08-06 01:48' },
];

const dorisExports = [
  { id: 'DX-01', name: '门诊宽表导出 Doris', lake: 'dwd_visit.outpatient_fact', doris: 'dw.outpatient_fact', mode: '增量', status: '运行中', lag: '12s', qps: '860/s' },
  { id: 'DX-02', name: '检验结果导出', lake: 'ods_lis.lab_result', doris: 'dw.lab_result', mode: '实时', status: '运行中', lag: '4s', qps: '1.1k/s' },
  { id: 'DX-03', name: '运营指标导出', lake: 'dm_ops.daily_kpi', doris: 'ads.daily_kpi', mode: '日批', status: '成功', lag: '—', qps: '—' },
  { id: 'DX-04', name: '影像索引导出', lake: 'ods_pacs.study_index', doris: 'dw.study_index', mode: '增量', status: '暂停', lag: '—', qps: '0' },
];

const dataSources = [
  { id: 'DS-01', name: 'HIS 生产库', kind: '数据库', engine: 'MySQL 8.0', endpoint: '10.20.31.18:3306', status: '正常', channels: 2 },
  { id: 'DS-02', name: 'EMR 临床库', kind: '数据库', engine: 'SQL Server', endpoint: '10.20.31.22:1433', status: '正常', channels: 1 },
  { id: 'DS-03', name: 'CDC 总线', kind: 'Kafka', engine: 'Kafka 3.6', endpoint: 'kafka.ljhealth:9092', status: '正常', channels: 5 },
  { id: 'DS-04', name: '湖仓 ODS', kind: '湖仓', engine: 'Iceberg / Hudi', endpoint: 's3a://lake/ods', status: '正常', channels: 12 },
  { id: 'DS-05', name: '分析仓 Doris', kind: '湖仓', engine: 'Apache Doris', endpoint: 'doris.ljhealth:9030', status: '正常', channels: 4 },
  { id: 'DS-06', name: 'LIS 生产库', kind: '数据库', engine: 'Oracle 19c', endpoint: '10.20.31.40:1521', status: '延迟', channels: 1 },
];

const seedLake: LakeRow[] = [
  { pk: '100248518', name: '王志远', phone: '138****6210', op: 'UPDATE', ts: '14:20:11', synced: true },
  { pk: '100248611', name: '李敏', phone: '139****8821', op: 'INSERT', ts: '14:20:12', synced: true },
  { pk: '100248402', name: '陈晓华', phone: '136****3309', op: 'INSERT', ts: '14:19:58', synced: true },
  { pk: '100248310', name: '赵倩', phone: '137****1142', op: 'UPDATE', ts: '14:19:40', synced: true },
];

const toneOf = (s: string) => {
  if (['运行中', '成功', '正常'].includes(s)) return s === '运行中' ? 'blue' : 'green';
  if (['延迟', '暂停', '已暂停'].includes(s)) return 'amber';
  if (s === '失败') return 'red';
  return 'slate';
};

/** A4-07 数据通道：桑基流动 + 实时入湖 / 离线 / Doris / 数据源 */
export function RealtimeChannel() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('realtime');
  const [channels, setChannels] = useState(realtimeChannels);
  const [activeId, setActiveId] = useState('CDC-001');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [events, setEvents] = useState<CdcRow[]>(seedEvents as CdcRow[]);
  const [lakeRows, setLakeRows] = useState<LakeRow[]>(seedLake);
  const [live, setLive] = useState({ qps: 126, delay: 8, rows: 1286420 });
  const [logOpen, setLogOpen] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CdcRow | null>(null);
  const [detailTab, setDetailTab] = useState<'lake' | 'events' | 'delay'>('lake');
  const [phase, setPhase] = useState<AcceptPhase>('mutate');
  const [captured, setCaptured] = useState(false);
  const [laked, setLaked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lastPk, setLastPk] = useState('');

  const active = channels.find((c) => c.id === activeId) || channels[0];

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) => ({
        qps: Math.max(40, l.qps + Math.round((Math.random() - 0.5) * 10)),
        delay: Math.max(3, l.delay + (Math.random() > 0.7 ? 1 : -1)),
        rows: l.rows + Math.round(Math.random() * 80),
      }));
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const filteredChannels = useMemo(() => channels.filter((c) =>
    (c.name + c.source + c.target).toLowerCase().includes(q.toLowerCase())
  ), [channels, q]);

  const toggle = (id: string) => {
    const cur = channels.find((c) => c.id === id);
    setChannels((arr) => arr.map((c) => (c.id === id
      ? { ...c, status: c.status === '运行中' ? '已暂停' : '运行中', delay: c.status === '运行中' ? '—' : '8 秒' }
      : c)));
    notify(cur?.status === '运行中' ? '通道已暂停' : '通道已启动');
  };

  const verifyLake = () => {
    setTab('realtime'); setDetailTab('lake'); setPhase('verify'); setVerified(true);
    const hit = lakeRows.find((r) => r.pk === lastPk) || lakeRows[0];
    notify(hit ? `核对通过：湖表可见 ${hit.op} · pk=${hit.pk}` : '湖表已同步，可继续查询');
  };

  const simulateCdc = async () => {
    if (simBusy || active.status === '已暂停') {
      if (active.status === '已暂停') notify('请先启动通道', 'error');
      return;
    }
    setSimBusy(true);
    setPulsing(true);
    setTab('realtime');
    setDetailTab('events');
    setPhase('mutate');
    setCaptured(false); setLaked(false); setVerified(false);
    const now = new Date();
    const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const pk = `10024${8000 + Math.floor(Math.random() * 900)}`;
    setLastPk(pk);
    const ops: Array<{ op: string; content: string; name: string; phone: string }> = [
      { op: 'INSERT', content: '新增患者主索引', name: '演示患者甲', phone: '138****9901' },
      { op: 'UPDATE', content: '更新联系电话', name: '王志远', phone: '139****0008' },
      { op: 'DELETE', content: '注销就诊卡关联', name: '—', phone: '—' },
    ];
    for (const step of ops) {
      await new Promise((r) => setTimeout(r, 480));
      setPhase('capture'); setCaptured(true);
      const row: CdcRow = [stamp, step.op, 'patient', step.op === 'UPDATE' ? '100248518' : pk, step.content, '成功'];
      setEvents((e) => [row, ...e].slice(0, 20));
      if (step.op !== 'DELETE') {
        setLakeRows((rows) => {
          const id = step.op === 'UPDATE' ? '100248518' : pk;
          const next: LakeRow = { pk: id, name: step.name, phone: step.phone, op: step.op, ts: stamp.slice(0, 8), synced: true };
          return [next, ...rows.filter((x) => x.pk !== id)].slice(0, 8);
        });
      } else {
        setLakeRows((rows) => rows.map((x) => (x.pk === '100248310' ? { ...x, op: 'DELETE', synced: true, ts: stamp.slice(0, 8) } : x)));
      }
      setPhase('lake'); setLaked(true); setDetailTab('lake');
      setLive((l) => ({ ...l, rows: l.rows + 1, qps: l.qps + 3 }));
    }
    setSimBusy(false);
    window.setTimeout(() => setPulsing(false), 1600);
    notify('①增删改已捕获 → ②湖表可查，点击「核对湖表」完成验收');
    verifyLake();
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA CHANNEL · A4-07 ★"
        title="数据通道"
        desc="验收：源端增删改 → CDC 捕获 → 湖表可查核对；覆盖离线入湖、Doris 导出与多类数据源。"
        actions={
          <>
            <Btn icon="play" loading={simBusy} onClick={simulateCdc}>演示：源端增删改入湖</Btn>
            <Btn icon="checkcircle" onClick={verifyLake} disabled={!laked}>核对湖表</Btn>
            <Btn icon="search" onClick={() => go('/bid/data-query')}>去查询</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建通道</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '源端增删改', d: 'INSERT/UPDATE/DELETE', k: 'mutate' as const, on: true },
          { n: '02', t: 'CDC 捕获', d: 'Kafka / Flink', k: 'capture' as const, on: captured },
          { n: '03', t: '湖表可查', d: 'ODS 实时可见', k: 'lake' as const, on: laked },
          { n: '04', t: '核对查询', d: 'pk 对齐验证', k: 'verify' as const, on: verified },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${phase === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {verified ? `已核对 ${lastPk || '湖表'}` : pulsing || simBusy ? '同步演示中' : '链路待命'} · 延迟 {live.delay}s</span>
      </div>

      <Card
        className="mt-14 channel-flow-card"
        title="数据怎么流动"
        subtitle="源端 → 捕获 → 湖表 → 查询 / Doris · 点击节点切换通道"
        actions={
          <>
            <Badge tone={pulsing || simBusy ? 'blue' : verified ? 'green' : 'green'} dot>{pulsing || simBusy ? '同步演示中' : verified ? '验收通过' : '链路正常'}</Badge>
            <span className="muted xs mono-cell">{active.source} → {active.target}</span>
          </>
        }
      >
        <ChannelFlowSankey
          activeChannelId={activeId}
          pulsing={pulsing || simBusy}
          onSelectChannel={(id) => { setActiveId(id); setTab('realtime'); }}
          onSelectStage={(stage) => {
            if (stage === 'query') go('/bid/data-query');
            else setTab(stage);
          }}
        />
      </Card>

      <div className="stat-grid mt-14">
        <StatCard label="实时通道" value={String(channels.length)} unit="条" delta={`运行中 ${channels.filter((c) => c.status === '运行中').length}`} icon="zap" tone="blue" onClick={() => setTab('realtime')} />
        <StatCard label="当前延迟" value={active.status === '已暂停' ? '—' : String(live.delay)} unit="秒" delta={active.name} icon="clock" tone="cyan" onClick={() => { setTab('realtime'); setDetailTab('delay'); }} />
        <StatCard label="写入 QPS" value={String(active.status === '已暂停' ? 0 : live.qps)} unit="条/秒" delta="实时入湖" icon="activity" tone="green" onClick={() => setTab('realtime')} />
        <StatCard label="今日入湖" value={(live.rows / 10000).toFixed(1)} unit="万条" delta={active.target} icon="harddrive" tone="violet" onClick={() => { setTab('realtime'); setDetailTab('lake'); }} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'realtime', label: '★ 实时入湖', count: channels.length },
          { key: 'offline', label: '离线入湖', count: offlineJobs.length },
          { key: 'doris', label: 'Doris 导出', count: dorisExports.length },
          { key: 'sources', label: '数据源', count: dataSources.length },
        ]}
      />

      {tab === 'realtime' && (
        <div className="realtime-layout channel-detail mt-14">
          <aside className="realtime-list">
            <div className="rl-head"><span>选择通道</span><Badge tone="green" dot>{channels.filter((c) => c.status === '运行中').length} 运行</Badge></div>
            <div className="rl-search"><Icon name="search" size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索" /></div>
            {filteredChannels.map((c) => (
              <button key={c.id} className={`channel-item ${activeId === c.id ? 'is-active' : ''}`} onClick={() => setActiveId(c.id)}>
                <span className={`channel-dot ${c.status === '运行中' ? 'ok' : c.status === '延迟' ? 'warn' : 'off'}`} />
                <div><strong>{c.name}</strong><small>{c.source}</small></div>
                <em>{c.delay}</em>
              </button>
            ))}
          </aside>

          <div className="realtime-main">
            <div className="realtime-head">
              <div>
                <h2>
                  {active.name}
                  <Badge tone={toneOf(active.status)} dot>{active.status}</Badge>
                </h2>
                <p className="channel-path-line">
                  <span>{active.source}</span>
                  <Icon name="arrowright" size={12} />
                  <span>CDC</span>
                  <Icon name="arrowright" size={12} />
                  <strong className="mono-cell">{active.target}</strong>
                  <Icon name="arrowright" size={12} />
                  <span>可查</span>
                </p>
              </div>
              <div className="row-actions">
                <Btn icon={active.status === '运行中' ? 'pause' : 'play'} onClick={() => toggle(active.id)}>{active.status === '运行中' ? '暂停' : '启动'}</Btn>
                <Btn icon="scroll" onClick={() => setLogOpen(true)}>日志</Btn>
                <Btn variant="primary" icon="play" loading={simBusy} onClick={simulateCdc}>模拟入湖</Btn>
              </div>
            </div>

            <div className="realtime-metrics compact">
              <div><span>延迟</span><strong className={live.delay > 10 ? 'text-amber' : 'text-green'}>{active.status === '已暂停' ? '—' : `${live.delay}s`}</strong></div>
              <div><span>QPS</span><strong>{active.status === '已暂停' ? 0 : live.qps}</strong></div>
              <div><span>今日</span><strong>{live.rows.toLocaleString()}</strong></div>
              <div><span>积压</span><strong>{active.status === '运行中' ? '0' : '2,186'}</strong></div>
            </div>

            <Tabs
              className="mt-14"
              variant="line"
              value={detailTab}
              onChange={(k) => setDetailTab(k as typeof detailTab)}
              items={[
                { key: 'lake', label: '湖表结果（可查）' },
                { key: 'events', label: '变更事件', count: events.length },
                { key: 'delay', label: '延迟趋势' },
              ]}
            />

            {detailTab === 'lake' && (
              <Card className="mt-14" title={`湖表 ${active.target}`} subtitle="源端增删改同步后在此可见" noPad
                actions={<Btn size="sm" icon="search" onClick={() => go('/collection/query')}>打开查询</Btn>}
              >
                <div className="pad-h">
                  <DataTable
                    rows={lakeRows}
                    pageSize={6}
                    paginate={false}
                    columns={[
                      { key: 'pk', title: '主键', width: 100, render: (r) => <span className="mono-cell">{r.pk}</span> },
                      { key: 'name', title: '姓名', width: 90, render: (r) => r.name },
                      { key: 'phone', title: '电话', width: 110, render: (r) => r.phone },
                      { key: 'op', title: '操作', width: 80, render: (r) => <Badge tone={r.op === 'INSERT' ? 'green' : r.op === 'UPDATE' ? 'blue' : 'red'}>{r.op}</Badge> },
                      { key: 'ts', title: '入湖时间', width: 80, render: (r) => <span className="mono-cell">{r.ts}</span> },
                      { key: 'synced', title: '状态', width: 70, render: () => <span className="text-green">已同步</span> },
                    ]}
                  />
                </div>
              </Card>
            )}

            {detailTab === 'events' && (
              <Card className="mt-14" title="变更事件" subtitle="CDC 捕获流水" noPad actions={<Badge tone="green" dot>实时</Badge>}>
                <div className="pad-h">
                  <DataTable
                    rows={events}
                    pageSize={8}
                    paginate={false}
                    onRowClick={(r) => setActiveEvent(r as CdcRow)}
                    columns={[
                      { key: '0', title: '时间', width: 120, render: (r) => <span className="mono-cell">{r[0]}</span> },
                      { key: '1', title: '类型', width: 76, render: (r) => <Badge tone={r[1] === 'INSERT' ? 'green' : r[1] === 'UPDATE' ? 'blue' : 'red'}>{r[1]}</Badge> },
                      { key: '2', title: '表', width: 100, render: (r) => <span className="mono-cell">{r[2]}</span> },
                      { key: '3', title: '主键', width: 120, render: (r) => <span className="mono-cell">{r[3]}</span> },
                      { key: '4', title: '内容' },
                      { key: '5', title: '状态', width: 70, render: (r) => <span className="text-green">{r[5]}</span> },
                    ]}
                  />
                </div>
              </Card>
            )}

            {detailTab === 'delay' && (
              <Card className="mt-14" title="延迟趋势" subtitle="近 45 分钟" actions={<span className="live-badge"><i /> 实时</span>}>
                <AreaChart data={delaySeries} height={200} color="#6755F5" suffix="s" valueName="延迟" />
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'offline' && (
        <Card className="mt-14" title="离线入湖" subtitle="对应桑基图「离线调度」支路" noPad
          actions={<Btn size="sm" icon="play" onClick={() => notify('已触发补跑')}>补跑</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={offlineJobs}
              pageSize={8}
              columns={[
                { key: 'name', title: '作业', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.source} → {r.target}</small></div> },
                { key: 'schedule', title: '调度', width: 110, render: (r) => r.schedule },
                { key: 'rows', title: '行数', width: 80, render: (r) => r.rows },
                { key: 'last', title: '最近', width: 100, render: (r) => r.last },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 100,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => go('/collection/tasks')}>任务</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'doris' && (
        <Card className="mt-14" title="Doris 导出" subtitle="对应桑基图右侧「Doris 分析仓」" noPad>
          <div className="pad-h">
            <DataTable
              rows={dorisExports}
              pageSize={8}
              columns={[
                { key: 'name', title: '导出任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.mode}</small></div> },
                { key: 'lake', title: '湖表', width: 180, render: (r) => <span className="mono-cell">{r.lake}</span> },
                { key: 'doris', title: 'Doris', width: 150, render: (r) => <span className="mono-cell">{r.doris}</span> },
                { key: 'lag', title: '延迟', width: 60, render: (r) => r.lag },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'sources' && (
        <Card className="mt-14" title="数据源" subtitle="对应桑基图左侧业务源端" noPad
          actions={<SearchInput value={q} onChange={setQ} placeholder="数据源" width={200} />}
        >
          <div className="pad-h">
            <DataTable
              rows={dataSources.filter((d) => (d.name + d.kind).toLowerCase().includes(q.toLowerCase()))}
              pageSize={8}
              columns={[
                { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.endpoint}</small></div> },
                { key: 'kind', title: '类型', width: 80, render: (r) => <Badge tone={r.kind === 'Kafka' ? 'amber' : r.kind === '湖仓' ? 'violet' : 'blue'}>{r.kind}</Badge> },
                { key: 'engine', title: '引擎', width: 130, render: (r) => r.engine },
                { key: 'channels', title: '通道', width: 60, align: 'right', render: (r) => r.channels },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer open={logOpen} onClose={() => setLogOpen(false)} title={`变更日志 · ${active.name}`} desc={`${active.source} → ${active.target}`} width={720}
        footer={<><Btn onClick={() => setLogOpen(false)}>关闭</Btn><Btn variant="primary" icon="download" onClick={() => notify('变更日志已下载')}>下载</Btn></>}
      >
        <div className="drawer-summary">
          <div><span>延迟</span><strong>{active.delay}</strong></div>
          <div><span>QPS</span><strong>{active.qps}</strong></div>
          <div><span>今日</span><strong>{active.today}</strong></div>
          <div><span>积压</span><strong>{active.lag}</strong></div>
        </div>
        <div className="log-console">
          <div><span className="lt">14:20:12</span><span className="li">INFO</span><span>CDC 捕获 → Kafka → Flink</span></div>
          <div><span className="lt">14:20:12</span><span className="li ok">SUCCESS</span><span>写入湖表 {active.target}</span></div>
          <div><span className="lt">14:20:11</span><span className="li">INFO</span><span>UPDATE phone 字段已同步</span></div>
        </div>
      </Drawer>

      <Drawer open={!!activeEvent} onClose={() => setActiveEvent(null)} title={activeEvent ? `${activeEvent[1]} · ${activeEvent[2]}` : ''} desc={activeEvent ? `主键 ${activeEvent[3]}` : ''} width={480}
        footer={<><Btn onClick={() => setActiveEvent(null)}>关闭</Btn><Btn variant="primary" icon="search" onClick={() => go('/collection/query')}>在湖表查询</Btn></>}
      >
        {activeEvent && (
          <KeyValue cols={1} items={[
            { label: '时间', value: <span className="mono-cell">{activeEvent[0]}</span> },
            { label: '操作', value: <Badge tone={activeEvent[1] === 'INSERT' ? 'green' : activeEvent[1] === 'UPDATE' ? 'blue' : 'red'}>{activeEvent[1]}</Badge> },
            { label: '内容', value: activeEvent[4] },
            { label: '目标湖表', value: active.target },
          ]} />
        )}
      </Drawer>

      <Modal open={open} onClose={() => setOpen(false)} title="新建数据通道" desc="选择入湖类型后配置源端与目标" width={640}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn onClick={() => notify('源端连接测试通过')}>测试连接</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('通道已创建'); setTab('realtime'); }}>创建</Btn></>}
      >
        <div className="form-grid">
          <Field label="通道类型" required className="span-2">
            <Select value="★ 实时入湖（CDC）" onChange={() => {}} options={['★ 实时入湖（CDC）', '离线入湖', 'Doris 导出']} />
          </Field>
          <Field label="通道名称" required><input className="input" placeholder="例如：his_patient_cdc" /></Field>
          <Field label="同步引擎"><Select value="MySQL CDC" onChange={() => {}} options={['MySQL CDC', 'Oracle CDC', 'SQL Server CDC', '达梦 CDC', 'PostgreSQL CDC', 'Kafka Connect']} /></Field>
          <Field label="源端数据源" required><Select value="HIS 生产库" onChange={() => {}} options={dataSources.map((d) => d.name)} /></Field>
          <Field label="目标湖表" required><input className="input" placeholder="ods_his.patient" /></Field>
          <Field label="捕获表" className="span-2"><input className="input" placeholder="patient, outpatient_visit" /></Field>
        </div>
      </Modal>
    </>
  );
}
