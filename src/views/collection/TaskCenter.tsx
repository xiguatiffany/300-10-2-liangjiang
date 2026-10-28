'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { runTasks } from '../../data';

type CycleTask = {
  id: string;
  name: string;
  kind: '离线批' | '采集同步' | '标化SQL' | '对账';
  cron: string;
  owner: string;
  status: '启用' | '暂停' | '草稿';
  last: string;
  next: string;
  deps: string;
  success: number;
};

type RtTask = {
  id: string;
  name: string;
  engine: 'Flink' | 'Spark Streaming' | 'CDC';
  status: '运行中' | '已停止' | '重启中' | '失败';
  lag: string;
  qps: string;
  owner: string;
  started: string;
};

type DepEdge = { from: string; to: string; type: '成功后' | '完成即' | '失败阻断' };

const cycles: CycleTask[] = [
  { id: 'CT-01', name: '患者主索引日批', kind: '标化SQL', cron: '0 2 * * *', owner: '张敏', status: '启用', last: '08-06 02:14', next: '08-07 02:00', deps: '无', success: 98.6 },
  { id: 'CT-02', name: '门诊就诊宽表', kind: '离线批', cron: '30 2 * * *', owner: '李建华', status: '启用', last: '08-06 02:40', next: '08-07 02:30', deps: 'CT-01', success: 99.2 },
  { id: 'CT-03', name: 'EMR CPOE 增量同步', kind: '采集同步', cron: '*/10 * * * *', owner: 'system', status: '启用', last: '08-06 14:20', next: '08-06 14:30', deps: '无', success: 99.8 },
  { id: 'CT-04', name: '检验对账日任务', kind: '对账', cron: '0 5 * * *', owner: '赵倩', status: '启用', last: '08-06 05:02', next: '08-07 05:00', deps: 'CT-03', success: 97.1 },
  { id: 'CT-05', name: '运营指标汇总', kind: '离线批', cron: '0 5 * * *', owner: '刘一鸣', status: '暂停', last: '08-01 05:00', next: '—', deps: 'CT-02', success: 96.4 },
  { id: 'CT-06', name: '公卫慢病周批', kind: '标化SQL', cron: '0 3 * * 1', owner: '陈晓', status: '草稿', last: '—', next: '未上线', deps: '无', success: 0 },
];

const realtime: RtTask[] = [
  { id: 'RT-01', name: '检验结果实时入仓', engine: 'Flink', status: '运行中', lag: '3.8s', qps: '1.2k/s', owner: '赵倩', started: '07-28 10:00' },
  { id: 'RT-02', name: 'HIS 就诊 CDC', engine: 'CDC', status: '运行中', lag: '1.2s', qps: '860/s', owner: '平台', started: '07-20 09:00' },
  { id: 'RT-03', name: '影像索引增量', engine: 'Spark Streaming', status: '失败', lag: '—', qps: '0', owner: '周宁', started: '08-06 13:00' },
  { id: 'RT-04', name: '医嘱变更流', engine: 'Flink', status: '已停止', lag: '—', qps: '0', owner: '李建华', started: '08-02 11:20' },
];

const deps: DepEdge[] = [
  { from: 'CT-01 患者主索引', to: 'CT-02 门诊宽表', type: '成功后' },
  { from: 'CT-03 EMR 增量', to: 'CT-04 检验对账', type: '完成即' },
  { from: 'CT-02 门诊宽表', to: 'CT-05 运营汇总', type: '成功后' },
  { from: 'RT-01 检验实时', to: 'CT-04 检验对账', type: '失败阻断' },
];

const toneOf = (s: string) => {
  if (['启用', '成功', '已完成'].includes(s)) return 'green';
  if (['运行中', '重启中'].includes(s)) return 'blue';
  if (['暂停', '草稿', '已停止'].includes(s)) return 'slate';
  if (s === '失败') return 'red';
  return 'amber';
};

/** 任务中心：总览 / 周期 / 实例 / 依赖 / 实时 */
export function TasksPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('overview');
  const [q, setQ] = useState('');
  const [instStatus, setInstStatus] = useState('all');
  const [activeInst, setActiveInst] = useState<typeof runTasks[0] | null>(null);
  const [activeCycle, setActiveCycle] = useState<CycleTask | null>(null);
  const [activeRt, setActiveRt] = useState<RtTask | null>(null);
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [opsDone, setOpsDone] = useState<Record<string, boolean>>({ backfill: false, rerun: false, pause: false, stop: false });

  const instances = useMemo(() => runTasks.filter((r) =>
    (instStatus === 'all' || r.status === instStatus)
    && (r.config + r.id + r.type).toLowerCase().includes(q.toLowerCase())
  ), [q, instStatus]);

  const cycleRows = useMemo(() => cycles.filter((c) =>
    (c.name + c.id + c.owner).toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const rtRows = useMemo(() => realtime.filter((c) =>
    (c.name + c.id + c.owner).toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const demoAccept = async () => {
    setDemoing(true);
    setTab('instance');
    setOpsDone({ backfill: true, rerun: false, pause: false, stop: false });
    setBackfillOpen(true);
    notify('① 补跑：已打开补跑面板');
    await new Promise((r) => setTimeout(r, 500));
    setBackfillOpen(false);
    setOpsDone((o) => ({ ...o, rerun: true }));
    const fail = runTasks.find((r) => r.status === '失败') || runTasks[0];
    setActiveInst(fail);
    notify('② 重跑：失败实例可重跑');
    await new Promise((r) => setTimeout(r, 400));
    setTab('realtime');
    setActiveRt(realtime[0] || null);
    setOpsDone((o) => ({ ...o, pause: true, stop: true }));
    notify('③④ 暂停 / 终止可用 · 验收完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="TASK OPERATIONS CENTER · A4-05"
        title="任务中心"
        desc="验收：补跑、重跑、暂停、终止可用；覆盖周期/实时任务与实例全生命周期。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="activity" onClick={() => go('/bid/monitor')}>★ 监控总览</Btn>
            <Btn variant="primary" icon="play" onClick={() => { setOpsDone((o) => ({ ...o, backfill: true })); setBackfillOpen(true); }}>补跑 / 手动执行</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '补跑', d: '手动补数', k: 'backfill' },
          { n: '02', t: '重跑', d: '失败可重试', k: 'rerun' },
          { n: '03', t: '暂停', d: '实时可挂起', k: 'pause' },
          { n: '04', t: '终止', d: '异常可中止', k: 'stop' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${opsDone[s.k] ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {Object.values(opsDone).every(Boolean) ? '运维动作齐全' : '待演示运维动作'}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="周期任务" value={String(cycles.length)} unit="个" delta={`启用 ${cycles.filter((c) => c.status === '启用').length}`} icon="clock" tone="blue" onClick={() => setTab('cycle')} />
        <StatCard label="今日实例" value="1,286" unit="次" delta="成功率 99.2%" icon="clipboard" tone="green" onClick={() => setTab('instance')} />
        <StatCard label="实时任务" value={String(realtime.length)} unit="条" delta={`运行中 ${realtime.filter((r) => r.status === '运行中').length}`} icon="zap" tone="amber" onClick={() => setTab('realtime')} />
        <StatCard label="失败待处理" value="9" unit="次" delta="可重跑/终止" icon="circlex" tone="red" onClick={() => { setTab('instance'); setInstStatus('失败'); }} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: '总览' },
          { key: 'cycle', label: '周期任务', count: cycles.length },
          { key: 'instance', label: '执行实例' },
          { key: 'deps', label: '依赖' },
          { key: 'realtime', label: '实时任务', count: realtime.length },
        ]}
      />

      {tab === 'overview' && (
        <>
          <div className="grid grid-2 mt-14">
            <Card title="运维动作" subtitle="验收：补跑、重跑、暂停、终止可用">
              <div className="schema-map" style={{ flexWrap: 'wrap', gap: 8 }}>
                {[
                  ['补跑', () => setBackfillOpen(true)],
                  ['重跑失败实例', () => { setTab('instance'); setInstStatus('失败'); notify('已筛选失败实例'); }],
                  ['暂停周期任务', () => { setTab('cycle'); notify('请在周期任务中选择暂停'); }],
                  ['终止运行中', () => { setTab('instance'); setInstStatus('运行中'); notify('请选择运行中实例终止'); }],
                  ['查看实时 Lag', () => setTab('realtime')],
                  ['打开 DAG 试跑', () => go('/collection/lake-flows')],
                ].map(([label, fn]) => (
                  <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>{label as string}</button>
                ))}
              </div>
            </Card>
            <Card title="依赖热点" subtitle="上游失败会阻断下游" noPad actions={<Btn size="sm" onClick={() => setTab('deps')}>全部依赖</Btn>}>
              <div className="pad-h">
                <ul className="feed-list">
                  {deps.slice(0, 4).map((d) => (
                    <li key={d.from + d.to}>
                      <span className="feed-ico violet"><Icon name="git" size={13} /></span>
                      <div><strong>{d.from}</strong><small>→ {d.to} · {d.type}</small></div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
          <Card className="mt-14" title="最近实例" subtitle="采集 / 批处理混合" noPad actions={<Btn size="sm" onClick={() => setTab('instance')}>全部实例</Btn>}>
            <div className="pad-h">
              <DataTable
                rows={runTasks.slice(0, 5)}
                pageSize={5}
                paginate={false}
                onRowClick={(r) => setActiveInst(r as typeof runTasks[0])}
                columns={[
                  { key: 'id', title: '实例', width: 160, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'config', title: '任务', render: (r) => <div className="cell-main"><strong>{r.config}</strong><small>{r.type}</small></div> },
                  { key: 'progress', title: '进度', width: 120, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.status === '失败' ? 'red' : r.status === '运行中' ? 'blue' : 'green'} /><span>{r.progress}%</span></div> },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'cycle' && (
        <Card className="mt-14" title="周期任务" subtitle="Cron 调度 · 启停 / 补跑" noPad
          actions={<div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="任务名 / 负责人" width={200} /></div>}
        >
          <div className="pad-h">
            <DataTable
              rows={cycleRows}
              pageSize={8}
              onRowClick={(r) => setActiveCycle(r as CycleTask)}
              columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '任务名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.kind} · {r.owner}</small></div> },
                { key: 'cron', title: 'Cron', width: 110, render: (r) => <span className="mono-cell">{r.cron}</span> },
                { key: 'deps', title: '依赖', width: 70, render: (r) => r.deps },
                { key: 'last', title: '最近', width: 100, render: (r) => r.last },
                { key: 'next', title: '下次', width: 100, render: (r) => r.next },
                { key: 'success', title: '成功率', width: 80, render: (r) => `${r.success}%` },
                { key: 'status', title: '状态', width: 70, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 160,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => notify(`${r.name} 已触发补跑`)}>补跑</button>
                      <button className="link-btn" onClick={() => notify(r.status === '启用' ? `${r.name} 已暂停` : `${r.name} 已启用`)}>{r.status === '启用' ? '暂停' : '启用'}</button>
                      <button className="link-muted" onClick={() => go('/collection/lake-flows')}>DAG</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'instance' && (
        <Card className="mt-14" title="执行实例" subtitle="全生命周期：运行 / 成功 / 失败" noPad
          actions={
            <div className="filter-bar">
              <Select value={instStatus} onChange={setInstStatus} options={[{ value: 'all', label: '全部' }, '运行中', '成功', '失败']} width={100} />
              <SearchInput value={q} onChange={setQ} placeholder="实例 / 配置" width={200} />
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={instances}
              pageSize={10}
              onRowClick={(r) => setActiveInst(r as typeof runTasks[0])}
              columns={[
                { key: 'id', title: '实例 ID', width: 168, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'config', title: '任务 / 配置', render: (r) => <div className="cell-main"><strong>{r.config}</strong><small>{r.type}</small></div> },
                { key: 'started', title: '开始', width: 130, render: (r) => r.started },
                { key: 'progress', title: '进度', width: 120, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.status === '失败' ? 'red' : r.status === '运行中' ? 'blue' : 'green'} /><span>{r.progress}%</span></div> },
                { key: 'rows', title: '行数', width: 90, align: 'right', render: (r) => <span className="mono-cell">{r.rows}</span> },
                { key: 'duration', title: '耗时', width: 70, render: (r) => r.duration },
                { key: 'status', title: '状态', width: 72, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 150,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => setActiveInst(r)}>日志</button>
                      <button className="link-btn" onClick={() => notify(`实例 ${r.id} 已重跑`)}>重跑</button>
                      {r.status === '运行中' && <button className="link-muted" onClick={() => notify(`实例 ${r.id} 已终止`)}>终止</button>}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'deps' && (
        <div className="grid grid-2-1 mt-14">
          <Card title="任务依赖" subtitle="成功后 / 完成即 / 失败阻断">
            <ul className="feed-list">
              {deps.map((d) => (
                <li key={d.from + d.to}>
                  <span className={`feed-ico ${d.type === '失败阻断' ? 'amber' : 'blue'}`}><Icon name="git" size={13} /></span>
                  <div>
                    <strong>{d.from} → {d.to}</strong>
                    <small>触发条件：{d.type}</small>
                  </div>
                  <Badge tone={d.type === '失败阻断' ? 'amber' : 'slate'}>{d.type}</Badge>
                </li>
              ))}
            </ul>
            <div className="info-note mt-14"><Icon name="workflow" size={13} /><span>依赖与离线 DAG 节点对齐；上游失败时下游自动跳过或阻断。</span></div>
          </Card>
          <Card title="快捷入口" subtitle="开发与监控">
            <ul className="feed-list">
              <li><span className="feed-ico violet"><Icon name="workflow" size={13} /></span><div><strong>离线实时流程</strong><small>画布试跑与节点状态</small></div><button className="link-btn" onClick={() => go('/collection/lake-flows')}>打开</button></li>
              <li><span className="feed-ico blue"><Icon name="code" size={13} /></span><div><strong>标化 SQL</strong><small>审核通过后挂调度</small></div><button className="link-btn" onClick={() => go('/collection/std-sql')}>打开</button></li>
              <li><span className="feed-ico green"><Icon name="activity" size={13} /></span><div><strong>★ 监控总览</strong><small>穿透到 DAG / 日志</small></div><button className="link-btn" onClick={() => go('/bid/monitor')}>打开</button></li>
            </ul>
          </Card>
        </div>
      )}

      {tab === 'realtime' && (
        <Card className="mt-14" title="实时任务 / 实例" subtitle="Flink · Spark Streaming · CDC" noPad
          actions={<SearchInput value={q} onChange={setQ} placeholder="实时任务" width={180} />}
        >
          <div className="pad-h">
            <DataTable
              rows={rtRows}
              pageSize={8}
              onRowClick={(r) => setActiveRt(r as RtTask)}
              columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.engine} · {r.owner}</small></div> },
                { key: 'lag', title: '延迟', width: 70, render: (r) => r.lag },
                { key: 'qps', title: '吞吐', width: 70, render: (r) => r.qps },
                { key: 'started', title: '启动', width: 110, render: (r) => r.started },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 150,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      {r.status === '运行中' ? (
                        <button className="link-btn" onClick={() => notify(`${r.name} 已停止`)}>停止</button>
                      ) : (
                        <button className="link-btn" onClick={() => notify(`${r.name} 已启动`)}>启动</button>
                      )}
                      <button className="link-btn" onClick={() => notify(`${r.name} 正在重启`)}>重启</button>
                      <button className="link-muted" onClick={() => go('/bid/realtime-channel')}>通道</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer
        open={!!activeInst}
        onClose={() => setActiveInst(null)}
        width={720}
        title={activeInst ? `运行日志 · ${activeInst.config}` : ''}
        desc={activeInst ? `${activeInst.id} · ${activeInst.started}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveInst(null)}>关闭</Btn>
            <Btn icon="circlealert" onClick={() => activeInst && notify(`实例 ${activeInst.id} 已终止`)}>终止</Btn>
            <Btn icon="refresh" onClick={() => activeInst && notify(`实例 ${activeInst.id} 已重跑`)}>重跑</Btn>
            <Btn variant="primary" icon="download" onClick={() => notify('日志已下载')}>下载日志</Btn>
          </>
        }
      >
        {activeInst && (
          <>
            <div className="drawer-summary">
              <div><span>状态</span><strong>{activeInst.status}</strong></div>
              <div><span>同步行数</span><strong>{activeInst.rows}</strong></div>
              <div><span>耗时</span><strong>{activeInst.duration}</strong></div>
              <div><span>操作人</span><strong>{activeInst.operator}</strong></div>
            </div>
            <div className="log-console">
              <div><span className="lt">14:20:12</span><span className="li">INFO</span><span>实例启动 · {activeInst.config}</span></div>
              <div><span className="lt">14:20:13</span><span className="li">INFO</span><span>校验依赖与资源配额…</span></div>
              <div><span className="lt">14:20:14</span><span className="li">INFO</span><span>开始读写，类型 {activeInst.type}</span></div>
              {activeInst.status === '失败' ? (
                <div><span className="lt">14:21:08</span><span className="li warn">ERROR</span><span>执行失败，可重跑或补跑指定分区</span></div>
              ) : (
                <div><span className="lt">14:22:30</span><span className="li ok">SUCCESS</span><span>写入完成 {activeInst.rows} 行</span></div>
              )}
            </div>
          </>
        )}
      </Drawer>

      <Drawer open={!!activeCycle} onClose={() => setActiveCycle(null)} title={activeCycle?.name || ''} desc={activeCycle ? `${activeCycle.id} · ${activeCycle.cron}` : ''} width={480}
        footer={<><Btn onClick={() => setActiveCycle(null)}>关闭</Btn><Btn variant="primary" onClick={() => { notify(`${activeCycle?.name} 补跑已提交`); setActiveCycle(null); }}>补跑</Btn></>}
      >
        {activeCycle && (
          <KeyValue cols={2} items={[
            { label: '类型', value: activeCycle.kind },
            { label: '状态', value: <Badge tone={toneOf(activeCycle.status)} dot>{activeCycle.status}</Badge> },
            { label: '负责人', value: activeCycle.owner },
            { label: '依赖', value: activeCycle.deps },
            { label: '最近执行', value: activeCycle.last },
            { label: '下次执行', value: activeCycle.next },
            { label: '成功率', value: `${activeCycle.success}%` },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeRt} onClose={() => setActiveRt(null)} title={activeRt?.name || ''} desc={activeRt ? `${activeRt.engine} · ${activeRt.id}` : ''} width={480}
        footer={<><Btn onClick={() => setActiveRt(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('实时任务配置已保存')}>保存</Btn></>}
      >
        {activeRt && (
          <KeyValue cols={2} items={[
            { label: '引擎', value: activeRt.engine },
            { label: '状态', value: <Badge tone={toneOf(activeRt.status)} dot>{activeRt.status}</Badge> },
            { label: '延迟', value: activeRt.lag },
            { label: '吞吐', value: activeRt.qps },
            { label: '负责人', value: activeRt.owner },
            { label: '启动时间', value: activeRt.started },
          ]} />
        )}
      </Drawer>

      <Modal open={backfillOpen} onClose={() => setBackfillOpen(false)} title="补跑 / 手动执行" desc="指定任务与业务日期，生成补跑实例" width={560}
        footer={<><Btn onClick={() => setBackfillOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setBackfillOpen(false); notify('补跑实例已创建并进入队列'); setTab('instance'); }}>提交补跑</Btn></>}
      >
        <div className="form-grid">
          <Field label="任务" required className="span-2"><Select value="患者主索引日批" onChange={() => {}} options={cycles.map((c) => c.name)} /></Field>
          <Field label="业务日期" required><input className="input" type="date" defaultValue="2026-08-05" /></Field>
          <Field label="模式"><Select value="仅失败重跑" onChange={() => {}} options={['仅失败重跑', '全量补跑', '指定分区']} /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={2} placeholder="补跑原因" /></Field>
        </div>
      </Modal>
    </>
  );
}
