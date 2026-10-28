'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TaskStatus = '运行中' | '成功' | '失败' | '延迟' | '已暂停';
type SyncTask = {
  id: string;
  name: string;
  org: string;
  source: string;
  status: TaskStatus;
  rawRows: number;
  rawBytes: string;
  lakeRows: number;
  successRate: number;
  schemaChanges: number;
  duration: string;
  started: string;
  delaySec: number;
};

type SchemaChange = {
  id: string;
  time: string;
  type: '新增字段' | '删除字段' | '类型变更' | '重命名';
  table: string;
  field: string;
  org: string;
  task: string;
  impact: string;
};

const tasks: SyncTask[] = [
  { id: 'CDC-2401', name: 'his_patient_cdc', org: '两江医院', source: 'his_dm_prod_source', status: '运行中', rawRows: 128642, rawBytes: '86 MB', lakeRows: 128420, successRate: 99.8, schemaChanges: 2, duration: '00:18:22', started: '2026-08-06 14:02', delaySec: 8 },
  { id: 'CDC-2402', name: 'emr_visit_flinkcdc', org: '渝北人民医院', source: 'emr_kingbase_source', status: '成功', rawRows: 86420, rawBytes: '52 MB', lakeRows: 86420, successRate: 100, schemaChanges: 0, duration: '00:12:08', started: '2026-08-06 13:40', delaySec: 5 },
  { id: 'CDC-2403', name: 'lis_report_cdc', org: '两江医院', source: 'lis_opengauss_source', status: '已暂停', rawRows: 0, rawBytes: '0', lakeRows: 0, successRate: 0, schemaChanges: 1, duration: '—', started: '2026-08-06 09:15', delaySec: 0 },
  { id: 'CDC-2404', name: 'ods_cis_sync', org: '重医附二院', source: 'cis_CISDB_source', status: '延迟', rawRows: 256880, rawBytes: '168 MB', lakeRows: 248620, successRate: 96.8, schemaChanges: 6, duration: '00:42:10', started: '2026-08-06 13:20', delaySec: 186 },
  { id: 'CDC-2405', name: 'pacs_study_cdc', org: '重医附二院', source: 'pacs_archive_source', status: '失败', rawRows: 12480, rawBytes: '920 MB', lakeRows: 0, successRate: 0, schemaChanges: 3, duration: '00:06:40', started: '2026-08-06 13:58', delaySec: 0 },
  { id: 'CDC-2406', name: 'ph_htn_cdc', org: '两江疾控', source: 'ph_kingbase_source', status: '失败', rawRows: 0, rawBytes: '0', lakeRows: 0, successRate: 0, schemaChanges: 0, duration: '—', started: '2026-08-06 14:02', delaySec: 0 },
  { id: 'CDC-2407', name: 'his_order_cdc', org: '重医附二院', source: 'his_cisdb_source', status: '运行中', rawRows: 98640, rawBytes: '64 MB', lakeRows: 98420, successRate: 99.8, schemaChanges: 1, duration: '00:21:05', started: '2026-08-06 13:55', delaySec: 12 },
  { id: 'CDC-2408', name: 'emr_admission_cdc', org: '渝北人民医院', source: 'emr_clinical_source', status: '成功', rawRows: 42180, rawBytes: '28 MB', lakeRows: 42180, successRate: 100, schemaChanges: 0, duration: '00:09:36', started: '2026-08-06 12:30', delaySec: 4 },
];

const schemaHistory: SchemaChange[] = [
  { id: 'SC-01', time: '2026-08-06 11:20', type: '新增字段', table: 'HISDB.dbo.PATIENT', field: 'dept_name', org: '重医附二院', task: 'ods_cis_sync', impact: '已自动加列，待复核映射' },
  { id: 'SC-02', time: '2026-08-06 09:40', type: '类型变更', table: 'LIS_PROD.dbo.REPORT_MAIN', field: 'result_value', org: '两江医院', task: 'lis_report_cdc', impact: 'varchar→text，需重建下游视图' },
  { id: 'SC-03', time: '2026-08-05 16:12', type: '重命名', table: 'EMRDB.dbo.VISIT', field: 'visit_no→encounter_no', org: '渝北人民医院', task: 'emr_visit_flinkcdc', impact: '已发布兼容映射' },
  { id: 'SC-04', time: '2026-08-05 14:05', type: '新增字段', table: 'HISDB.dbo.ORDERS', field: 'priority_code', org: '重医附二院', task: 'his_order_cdc', impact: '低风险' },
  { id: 'SC-05', time: '2026-08-04 18:22', type: '删除字段', table: 'RISDB.dbo.STUDY', field: 'legacy_flag', org: '两江医院', task: 'pacs_study_cdc', impact: '下游依赖已下线' },
  { id: 'SC-06', time: '2026-08-04 10:08', type: '类型变更', table: 'HISDB.dbo.PATIENT', field: 'phone_no', org: '重医附二院', task: 'his_patient_cdc', impact: '长度扩展，无需停写' },
];

const statusTone = (s: TaskStatus) => {
  if (s === '运行中') return 'blue';
  if (s === '成功') return 'green';
  if (s === '延迟') return 'amber';
  if (s === '已暂停') return 'slate';
  return 'red';
};

const healthColor = (s: TaskStatus) => {
  if (s === '运行中' || s === '成功') return 'green';
  if (s === '延迟' || s === '已暂停') return 'amber';
  return 'red';
};

export function CdcSyncMonitorPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('tasks');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [org, setOrg] = useState('');
  const [source, setSource] = useState('');
  const [range, setRange] = useState('7d');
  const [active, setActive] = useState<SyncTask | null>(null);
  const [change, setChange] = useState<SchemaChange | null>(null);

  const filtered = useMemo(() => tasks.filter((t) =>
    (!status || t.status === status)
    && (!org || t.org === org)
    && (!source || t.source === source)
    && (t.id + t.name + t.source + t.org).toLowerCase().includes(q.toLowerCase())
  ), [q, status, org, source]);

  const totals = useMemo(() => {
    const raw = filtered.reduce((a, t) => a + t.rawRows, 0);
    const lake = filtered.reduce((a, t) => a + t.lakeRows, 0);
    const schema = filtered.reduce((a, t) => a + t.schemaChanges, 0);
    const rate = raw ? Math.round((lake / raw) * 1000) / 10 : 0;
    return { raw, lake, schema, rate };
  }, [filtered]);

  const trendSuccess = [
    { label: '08-01', value: 98.2 }, { label: '08-02', value: 97.6 }, { label: '08-03', value: 98.8 },
    { label: '08-04', value: 96.4 }, { label: '08-05', value: 97.9 }, { label: '08-06', value: 98.6 },
  ];
  const trendDelay = [
    { label: '08-01', value: 12 }, { label: '08-02', value: 18 }, { label: '08-03', value: 9 },
    { label: '08-04', value: 26 }, { label: '08-05', value: 15 }, { label: '08-06', value: 22 },
  ];
  const trendThroughput = [
    { label: '重医附二院', value: 42 }, { label: '两江医院', value: 28 }, { label: '渝北人民医院', value: 18 },
    { label: '两江疾控', value: 6 }, { label: '两江妇幼', value: 9 },
  ];

  return (
    <>
      <PageHeader
        eyebrow="CDC SYNC MONITOR"
        title="CDC 同步监控"
        desc="多条件检索同步任务，全过程监控采集量、入湖量、成功率与结构变更；支持统计分析与报表导出。"
        actions={
          <>
            <Btn icon="cable" onClick={() => go('/collection/channels')}>同步管理</Btn>
            <Btn icon="download" onClick={() => notify('CDC 监控统计报表已导出（含机构/数据源维度）')}>导出报表</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => notify('监控指标已刷新 · 14:22:18')}>刷新</Btn>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="原始采集量" value={totals.raw.toLocaleString()} unit="行" delta={`${filtered.length} 个任务`} icon="database" tone="blue" />
        <StatCard label="成功入湖量" value={totals.lake.toLocaleString()} unit="行" delta={`成功率 ${totals.rate}%`} icon="layers" tone="green" />
        <StatCard label="结构变更" value={String(totals.schema)} unit="次" delta="可追溯影响" icon="listfilter" tone="amber" onClick={() => setTab('schema')} />
        <StatCard label="健康任务" value={String(filtered.filter((t) => t.status === '运行中' || t.status === '成功').length)} unit="个" delta={`异常 ${filtered.filter((t) => t.status === '失败').length}`} icon="activity" tone="violet" />
      </div>

      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs
            variant="line"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'tasks', label: '任务监控', count: filtered.length },
              { key: 'schema', label: '模式变更历史', count: schemaHistory.length },
              { key: 'stats', label: '多维统计分析' },
            ]}
          />
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="任务名 / 数据源" width={180} />
            <Select value={status} onChange={setStatus} options={['', '运行中', '成功', '失败', '延迟', '已暂停']} placeholder="运行状态" width={110} />
            <Select value={org} onChange={setOrg} options={['', '重医附二院', '两江医院', '渝北人民医院', '两江疾控']} placeholder="归属机构" width={120} />
            <Select value={source} onChange={setSource} options={['', ...Array.from(new Set(tasks.map((t) => t.source)))]} placeholder="数据源" width={160} />
            <Select value={range} onChange={setRange} options={['24h', '7d', '30d']} placeholder="时间范围" width={90} />
          </div>
        </div>

        {tab === 'tasks' && (
          <div className="pad-h">
            <div className="info-note" style={{ marginBottom: 12 }}>
              <Icon name="shield" size={13} />
              <span>健康度颜色：绿=正常/成功，琥珀=延迟/暂停，红=失败。点击任务可查看全过程指标。</span>
            </div>
            <DataTable
              rows={filtered}
              pageSize={8}
              onRowClick={(r) => setActive(r)}
              columns={[
                {
                  key: 'health', title: '', width: 28,
                  render: (r) => <span className={`status-dot tone-${healthColor(r.status)}`} title={r.status} />,
                },
                { key: 'id', title: '任务号', width: 96, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.source}</small></div> },
                { key: 'org', title: '机构', width: 100, render: (r) => r.org },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
                { key: 'rawRows', title: '原始采集', width: 100, align: 'right', render: (r) => <div className="cell-main" style={{ textAlign: 'right' }}><strong>{r.rawRows.toLocaleString()}</strong><small>{r.rawBytes}</small></div> },
                { key: 'lakeRows', title: '入湖有效', width: 90, align: 'right', render: (r) => r.lakeRows.toLocaleString() },
                { key: 'successRate', title: '成功率', width: 80, render: (r) => <span className={r.successRate >= 99 ? 'text-green' : r.successRate >= 95 ? 'text-amber' : 'text-red'}>{r.successRate}%</span> },
                { key: 'schemaChanges', title: '结构变更', width: 80, align: 'right', render: (r) => (r.schemaChanges ? <Badge tone="amber">{r.schemaChanges}</Badge> : <span className="muted">0</span>) },
                { key: 'delaySec', title: '延迟', width: 70, render: (r) => (r.status === '已暂停' || r.status === '失败' ? '—' : `${r.delaySec}s`) },
                {
                  key: 'ops', title: '操作', width: 110,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => setActive(r)}>详情</button>
                      <button className="link-muted" onClick={() => go('/collection/channels')}>启停</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {tab === 'schema' && (
          <div className="pad-h">
            <DataTable
              rows={schemaHistory.filter((s) => (!org || s.org === org) && (s.table + s.field + s.task).toLowerCase().includes(q.toLowerCase()))}
              pageSize={8}
              onRowClick={(r) => setChange(r)}
              columns={[
                { key: 'time', title: '变更时间', width: 130, render: (r) => <span className="mono-cell">{r.time.slice(5)}</span> },
                { key: 'type', title: '变更类型', width: 90, render: (r) => <Badge tone={r.type === '删除字段' ? 'red' : r.type === '类型变更' ? 'amber' : 'blue'}>{r.type}</Badge> },
                { key: 'table', title: '涉及表', render: (r) => <span className="mono">{r.table}</span> },
                { key: 'field', title: '字段', width: 150, render: (r) => <span className="mono-cell">{r.field}</span> },
                { key: 'org', title: '机构', width: 100, render: (r) => r.org },
                { key: 'task', title: '关联任务', width: 120, render: (r) => r.task },
                { key: 'impact', title: '影响评估', render: (r) => r.impact },
              ]}
            />
          </div>
        )}

        {tab === 'stats' && (
          <div className="pad-h">
            <div className="grid grid-2">
              <Card title="任务成功率趋势" subtitle={`时间范围 ${range === '24h' ? '近24小时' : range === '7d' ? '近7天' : '近30天'}`}>
                <AreaChart data={trendSuccess} color="#059669" height={170} suffix="%" valueName="成功率" />
              </Card>
              <Card title="平均采集耗时 / 入湖延迟" subtitle="秒">
                <AreaChart data={trendDelay} color="#D97706" height={170} suffix="s" valueName="延迟" />
              </Card>
            </div>
            <div className="grid grid-2 mt-14">
              <Card title="按机构 · 任务数 / 失败率 / 吞吐" subtitle="单位：百万行/日">
                <BarList
                  items={trendThroughput.map((x) => ({
                    label: x.label,
                    value: x.value,
                    display: `${x.value}M · 失败率 ${(x.label === '重医附二院' ? 1.2 : x.label === '两江医院' ? 2.4 : 0.8)}%`,
                  }))}
                  color="#6755F5"
                />
              </Card>
              <Card title="按数据源 · 任务分布" subtitle="运行健康占比">
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <Donut
                    size={140}
                    thickness={13}
                    centerValue={`${filtered.filter((t) => t.status === '运行中' || t.status === '成功').length}`}
                    label="健康"
                    segments={[
                      { label: '健康', value: filtered.filter((t) => t.status === '运行中' || t.status === '成功').length || 1, color: '#059669' },
                      { label: '延迟', value: filtered.filter((t) => t.status === '延迟' || t.status === '已暂停').length || 1, color: '#F59E0B' },
                      { label: '失败', value: filtered.filter((t) => t.status === '失败').length || 1, color: '#DC2626' },
                    ]}
                  />
                  <div className="coverage-list" style={{ flex: 1 }}>
                    {Array.from(new Set(filtered.map((t) => t.source))).slice(0, 5).map((src) => {
                      const n = filtered.filter((t) => t.source === src).length;
                      return (
                        <div key={src}><span className="mono" style={{ fontSize: 12 }}>{src}</span><strong>{n} 任务</strong><div className="coverage-track"><i style={{ width: `${Math.min(100, n * 25)}%`, background: '#6755F5' }} /></div></div>
                      );
                    })}
                  </div>
                </div>
                <div className="row-actions mt-14">
                  <Btn size="sm" icon="download" onClick={() => notify('已导出：按时间/机构/数据源统计表')}>导出统计表</Btn>
                  <Btn size="sm" onClick={() => go('/collection/access-panorama')}>打开接入全景</Btn>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={640}
        title={active ? `${active.id} · ${active.name}` : ''}
        desc={active ? `${active.org} · ${active.source}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn onClick={() => go('/collection/channels')}>去启停</Btn>
            <Btn variant="primary" icon="scroll" onClick={() => notify(`${active?.id} 执行日志已开始下载`)}>下载日志</Btn>
          </>
        }
      >
        {active && (
          <>
            <KeyValue
              cols={2}
              items={[
                { label: '运行状态', value: <Badge tone={statusTone(active.status)} dot>{active.status}</Badge> },
                { label: '健康度', value: <span className={`status-dot tone-${healthColor(active.status)}`} /> },
                { label: '开始时间', value: active.started },
                { label: '耗时', value: active.duration },
                { label: '原始采集', value: `${active.rawRows.toLocaleString()} 行 · ${active.rawBytes}` },
                { label: '成功入湖', value: `${active.lakeRows.toLocaleString()} 行` },
                { label: '同步成功率', value: `${active.successRate}%` },
                { label: '结构变更次数', value: String(active.schemaChanges) },
              ]}
            />
            <div className="divider-h" />
            <div className="section-title-sm">全过程指标</div>
            <div className="mt-10">
              {[
                ['采集完成度', Math.min(100, Math.round((active.lakeRows / Math.max(active.rawRows, 1)) * 100)), 'blue'],
                ['入湖有效率', active.successRate, active.successRate >= 99 ? 'green' : 'amber'],
                ['延迟健康', active.delaySec > 60 ? 40 : active.delaySec > 20 ? 70 : 95, active.delaySec > 60 ? 'red' : 'green'],
              ].map(([l, v, t]) => (
                <div key={l as string} className="mb-10">
                  <div className="resource-head"><span>{l}</span><strong>{v}%</strong></div>
                  <Progress value={v as number} tone={t as string} height={7} />
                </div>
              ))}
            </div>
            <div className="info-note mt-10">
              <Icon name="circlealert" size={13} />
              <span>{active.status === '失败' ? '失败任务请结合模式变更历史评估是否需重定位位点。' : '可按时间范围、状态、机构、数据源组合检索用于巡检。'}</span>
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        open={!!change}
        onClose={() => setChange(null)}
        width={520}
        title={change ? `${change.type} · ${change.field}` : ''}
        desc={change?.table}
        footer={<><Btn onClick={() => setChange(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('已创建结构变更影响评估工单')}>生成评估单</Btn></>}
      >
        {change && (
          <KeyValue
            cols={1}
            items={[
              { label: '变更时间', value: change.time },
              { label: '变更类型', value: change.type },
              { label: '涉及表', value: <span className="mono">{change.table}</span> },
              { label: '涉及字段', value: <span className="mono">{change.field}</span> },
              { label: '归属机构', value: change.org },
              { label: '关联任务', value: change.task },
              { label: '影响评估', value: change.impact },
            ]}
          />
        )}
      </Drawer>
    </>
  );
}
