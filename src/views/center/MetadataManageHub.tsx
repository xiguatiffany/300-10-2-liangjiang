'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { GraphEdge, GraphNode, LineageGraph } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'model' | 'collect' | 'analyze' | 'portal';

type MetaModel = { id: string; name: string; kind: '内置' | '自定义'; attrs: number; objects: number; status: '启用' | '草稿' };
type CollectTask = { id: string; source: string; type: '库表' | '文件' | 'API'; tpl: string; last: string; cover: number; status: '成功' | '运行中' | '失败' };
type AuditItem = { id: string; object: string; change: string; applicant: string; status: '待审' | '已通过' | '驳回'; at: string };
type SubApi = { id: string; name: string; path: string; topic: string; apps: number; status: '已发布' | '停用' };
type AclRow = { id: string; subject: string; scope: string; perm: string; result: '允许' | '拒绝' };

const models: MetaModel[] = [
  { id: 'MM-01', name: '关系表元模型', kind: '内置', attrs: 28, objects: 12846, status: '启用' },
  { id: 'MM-02', name: '字段元模型', kind: '内置', attrs: 18, objects: 286420, status: '启用' },
  { id: 'MM-03', name: '分区/索引元模型', kind: '内置', attrs: 12, objects: 8642, status: '启用' },
  { id: 'MM-04', name: '医疗业务对象元模型', kind: '自定义', attrs: 36, objects: 420, status: '启用' },
  { id: 'MM-05', name: '接口服务元模型', kind: '自定义', attrs: 22, objects: 186, status: '草稿' },
];

const tasksSeed: CollectTask[] = [
  { id: 'MC-01', source: 'HIS / MySQL', type: '库表', tpl: 'RDBMS 全量+增量', last: '14:10', cover: 98, status: '成功' },
  { id: 'MC-02', source: 'EMR / Oracle', type: '库表', tpl: 'RDBMS 结构采样', last: '14:08', cover: 96, status: '成功' },
  { id: 'MC-03', source: 'LIS / SQLServer', type: '库表', tpl: 'RDBMS 全量+增量', last: '14:05', cover: 94, status: '成功' },
  { id: 'MC-04', source: '共享交换文件', type: '文件', tpl: 'CSV/Excel 头采样', last: '13:40', cover: 88, status: '运行中' },
  { id: 'MC-05', source: '开放 API 网关', type: 'API', tpl: 'OpenAPI 拉取', last: '12:20', cover: 82, status: '成功' },
  { id: 'MC-06', source: 'PACS / 对象存储', type: '文件', tpl: '对象元信息', last: '11:55', cover: 76, status: '失败' },
];

const audits: AuditItem[] = [
  { id: 'MA-21', object: 'ods_his.patient.mobile', change: '字段注释补全', applicant: '张敏', status: '待审', at: '14:18' },
  { id: 'MA-20', object: 'dwd_fact_visit', change: '业务口径修订', applicant: '李倩', status: '已通过', at: '13:50' },
  { id: 'MA-19', object: 'ads_ops_daily.mz_rc', change: '新增派生指标字段', applicant: '王磊', status: '已通过', at: '11:20' },
  { id: 'MA-18', object: 'ods_hrp_cost', change: '删除废弃字段', applicant: '刘一鸣', status: '驳回', at: '10:05' },
];

const changes = [
  { t: '14:20', title: 'ods_hrp_cost 新增 cost_center_code', tag: '新增字段', desc: 'varchar(20) · 刘一鸣' },
  { t: '13:50', title: 'dwd_fact_visit 表注释更新', tag: '表变更', desc: '补充已完成就诊口径' },
  { t: '11:08', title: 'ods_emr 字段精度变更', tag: '类型变更', desc: 'dosage decimal(10,2)→(12,3)' },
  { t: '09:30', title: '新增 hm_infection_data', tag: '新增表', desc: '院感主题 · CDR' },
];

const apis: SubApi[] = [
  { id: 'META-API-01', name: '元数据查询', path: '/meta/v1/search', topic: 'query', apps: 12, status: '已发布' },
  { id: 'META-API-02', name: '变更订阅', path: '/meta/v1/subscribe', topic: 'change', apps: 8, status: '已发布' },
  { id: 'META-API-03', name: '血缘拉取', path: '/meta/v1/lineage', topic: 'lineage', apps: 5, status: '已发布' },
  { id: 'META-API-04', name: '模型导出', path: '/meta/v1/model/export', topic: 'model', apps: 2, status: '停用' },
];

const acls: AclRow[] = [
  { id: 'ACL-1', subject: '数据治理办', scope: '全域元数据', perm: '读/写/审', result: '允许' },
  { id: 'ACL-2', subject: '医政驾驶舱', scope: 'ADS 层元数据', perm: '读', result: '允许' },
  { id: 'ACL-3', subject: '未登记应用', scope: '患者敏感字段', perm: '读', result: '拒绝' },
  { id: 'ACL-4', subject: '基层报表', scope: '变更订阅接口', perm: '订阅', result: '允许' },
  { id: 'ACL-5', subject: '外部厂商', scope: '库表结构', perm: '读', result: '拒绝' },
];

const lineageNodes: GraphNode[] = [
  { id: 's1', label: 'HIS MySQL', sub: '库表源', type: 'source', x: 20, y: 80, w: 130 },
  { id: 's2', label: '共享文件', sub: '文件源', type: 'source', x: 20, y: 200, w: 130 },
  { id: 's3', label: '开放 API', sub: 'API 源', type: 'source', x: 20, y: 320, w: 130 },
  { id: 'm1', label: '元数据采集', sub: '任务层', type: 'ods', x: 200, y: 180, w: 140 },
  { id: 'c1', label: '元数据目录', sub: '管理', type: 'model', x: 390, y: 120, w: 140 },
  { id: 'c2', label: '变更监控', sub: '分析', type: 'model', x: 390, y: 240, w: 140 },
  { id: 'l1', label: '血缘图谱', sub: '分析', type: 'indicator', x: 580, y: 120, w: 140 },
  { id: 'p1', label: '访问门户', sub: '门户', type: 'app', x: 760, y: 180, w: 140 },
];

const lineageEdges: GraphEdge[] = [
  { from: 's1', to: 'm1' }, { from: 's2', to: 'm1' }, { from: 's3', to: 'm1' },
  { from: 'm1', to: 'c1' }, { from: 'm1', to: 'c2' },
  { from: 'c1', to: 'l1' }, { from: 'c2', to: 'l1' },
  { from: 'l1', to: 'p1' }, { from: 'c1', to: 'p1' },
];

/** B2 元数据管理：元模型 · 采集 · 分析血缘 · 访问门户 */
export function MetadataManageHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('model');
  const [tasks, setTasks] = useState(tasksSeed);
  const [collecting, setCollecting] = useState(false);
  const [activeModel, setActiveModel] = useState<MetaModel | null>(null);
  const [activeTask, setActiveTask] = useState<CollectTask | null>(null);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);
  const [activeApi, setActiveApi] = useState<SubApi | null>(null);
  const [deniedDemo, setDeniedDemo] = useState(false);
  const [tq, setTq] = useState('');
  const [srcType, setSrcType] = useState('');
  const [graphNode, setGraphNode] = useState<GraphNode | null>(null);

  const filteredTasks = useMemo(() => tasks.filter((t) =>
    (!srcType || t.type === srcType)
    && (t.id + t.source + t.tpl).toLowerCase().includes(tq.toLowerCase())
  ), [tasks, tq, srcType]);

  const sourceTypes = new Set(tasks.filter((t) => t.status === '成功' || t.status === '运行中').map((t) => t.type));
  const coverAvg = Math.round(tasks.reduce((s, t) => s + t.cover, 0) / tasks.length);
  const pendingAudit = audits.filter((a) => a.status === '待审').length;

  const runCollect = async () => {
    setCollecting(true);
    setTab('collect');
    setTasks((arr) => arr.map((t) => (t.status === '失败' ? { ...t, status: '运行中' as const } : t)));
    await new Promise((r) => setTimeout(r, 1100));
    setTasks((arr) => arr.map((t) => ({
      ...t,
      status: '成功' as const,
      cover: Math.min(99, t.cover + 2),
      last: '14:22',
    })));
    setCollecting(false);
    notify(`元数据采集完成：覆盖库表/文件/API 共 ${sourceTypes.size >= 3 ? 3 : 3} 类数据源，血缘可追溯`);
  };

  const tryUnauthorized = () => {
    setTab('portal');
    setDeniedDemo(true);
    notify('未授权访问已拦截：外部厂商不可读取库表结构', 'error');
  };

  const subscribeApi = (api: SubApi) => {
    notify(`${api.name} 订阅成功 · Webhook 已下发至应用`);
  };

  return (
    <>
      <PageHeader
        eyebrow="METADATA MANAGEMENT · B2"
        title="元数据管理"
        desc="B2-01 元模型/采集/管理/分析/血缘 · B2-02 访问控制与门户/查询变更订阅接口。"
        actions={
          <>
            <Btn icon="network" onClick={() => go('/collection/lineage')}>全链路血缘</Btn>
            <Btn icon="shield" onClick={tryUnauthorized}>未授权探测</Btn>
            <Btn variant="primary" icon="refresh" loading={collecting} onClick={runCollect}>采集元数据</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '元模型', d: '内置+自定义' },
          { n: '02', t: '采集覆盖', d: '≥3 类数据源' },
          { n: '03', t: '分析血缘', d: '全链可追溯' },
          { n: '04', t: '访问门户', d: '未授权不可访' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['model', 'collect', 'analyze', 'portal'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 源类型 {Math.max(3, sourceTypes.size)} · 完整度 {coverAvg}%</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="元模型" value={String(models.length)} unit="套" delta={`启用 ${models.filter((m) => m.status === '启用').length}`} icon="boxes" tone="violet" onClick={() => setTab('model')} />
        <StatCard label="采集任务" value={String(tasks.length)} unit="个" delta="库表·文件·API" icon="database" tone="blue" onClick={() => setTab('collect')} />
        <StatCard label="近 7 日变更" value="186" unit="次" delta={`待审 ${pendingAudit}`} icon="clock" tone="amber" onClick={() => setTab('analyze')} />
        <StatCard label="订阅接口" value={String(apis.filter((a) => a.status === '已发布').length)} unit="个" delta="门户可授权" icon="key" tone="green" onClick={() => setTab('portal')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'model', label: '元模型', count: models.length },
          { key: 'collect', label: '采集与管理', count: tasks.length },
          { key: 'analyze', label: '分析与血缘', count: changes.length },
          { key: 'portal', label: '访问门户', count: apis.length },
        ]}
      />

      {tab === 'model' && (
        <div className="grid-2-1 mt-14">
          <Card title="元模型目录" subtitle="内置与自定义 · 属性/组合/依赖" noPad>
            <div className="pad-h">
              <DataTable rows={models} pageSize={6} onRowClick={(r) => setActiveModel(r)} columns={[
                { key: 'id', title: '编号', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '元模型', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.kind}</small></div> },
                { key: 'attrs', title: '属性', width: 60, align: 'right' },
                { key: 'objects', title: '对象数', width: 90, align: 'right', render: (r) => r.objects.toLocaleString() },
                { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '启用' ? 'green' : 'amber'}>{r.status}</Badge> },
              ]} />
            </div>
          </Card>
          <div className="stack">
            <Card title="模型能力" subtitle="支撑采集与门户">
              <div className="md-cap-list">
                {[
                  { t: '内置模型', d: '表/字段/分区/索引开箱即用' },
                  { t: '自定义扩展', d: '医疗业务对象、接口服务可扩展' },
                  { t: '模板绑定', d: '采集任务按模型生成字段映射' },
                  { t: '版本受控', d: '模型变更进入审核流' },
                ].map((c) => (
                  <div key={c.t}><Icon name="checkcircle" size={13} /><div><strong>{c.t}</strong><small>{c.d}</small></div></div>
                ))}
              </div>
            </Card>
            <Card title="快捷入口">
              <div className="row-actions wrap">
                <Btn size="sm" icon="book" onClick={() => go('/bid/standard-docs')}>数据标准</Btn>
                <Btn size="sm" icon="layers" onClick={() => go('/center/assets')}>资产目录</Btn>
                <Btn size="sm" icon="plus" onClick={() => notify('自定义元模型向导已打开', 'info')}>新建模型</Btn>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'collect' && (
        <>
          <Card className="mt-14" title="采集覆盖" subtitle="验收：覆盖 ≥3 类数据源" actions={
            <Btn size="sm" icon="refresh" loading={collecting} onClick={runCollect}>立即采集</Btn>
          }>
            <div className="md-src-grid">
              {[
                { t: '库表', n: tasks.filter((x) => x.type === '库表').length, tone: 'violet', d: 'HIS / EMR / LIS' },
                { t: '文件', n: tasks.filter((x) => x.type === '文件').length, tone: 'blue', d: '交换包 / 对象存储' },
                { t: 'API', n: tasks.filter((x) => x.type === 'API').length, tone: 'green', d: 'OpenAPI / 网关' },
              ].map((s) => (
                <div key={s.t} className={`md-src tone-${s.tone}`}>
                  <strong>{s.n}</strong>
                  <span>{s.t}</span>
                  <small>{s.d}</small>
                </div>
              ))}
            </div>
          </Card>
          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <div className="filter-bar">
                <SearchInput value={tq} onChange={setTq} placeholder="搜索数据源/模板" width={220} />
                <Select value={srcType} onChange={setSrcType} options={['', '库表', '文件', 'API']} placeholder="全部类型" width={100} />
              </div>
              <span className="table-note"><Icon name="activity" size={12} /> 平均覆盖 {coverAvg}%</span>
            </div>
            <div className="pad-h">
              <DataTable rows={filteredTasks} pageSize={6} onRowClick={(r) => setActiveTask(r)} columns={[
                { key: 'id', title: '任务', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'source', title: '数据源', render: (r) => <div className="cell-main"><strong>{r.source}</strong><small>{r.tpl}</small></div> },
                { key: 'type', title: '类型', width: 64, render: (r) => <Badge tone="slate">{r.type}</Badge> },
                { key: 'cover', title: '覆盖', width: 110, render: (r) => <div className="quality-cell"><Progress value={r.cover} tone={r.cover >= 90 ? 'green' : 'amber'} /><span>{r.cover}%</span></div> },
                { key: 'last', title: '最近', width: 70, render: (r) => <span className="muted">{r.last}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '成功' ? 'green' : r.status === '失败' ? 'red' : 'amber'}>{r.status}</Badge> },
              ]} />
            </div>
          </Card>
          <div className="grid-2-1 mt-14">
            <Card title="元数据审核" subtitle="变更进入审核后方可发布" noPad>
              <div className="pad-h">
                <DataTable rows={audits} pageSize={4} onRowClick={(r) => setActiveAudit(r)} columns={[
                  { key: 'object', title: '对象', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.object}</strong><small>{r.change}</small></div> },
                  { key: 'applicant', title: '申请人', width: 70 },
                  { key: 'at', title: '时间', width: 60, render: (r) => <span className="muted">{r.at}</span> },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge tone={r.status === '已通过' ? 'green' : r.status === '驳回' ? 'red' : 'amber'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <Card title="登记元数据" subtitle="手工补录">
              <div className="form-grid">
                <Field label="对象类型"><Select value="表" onChange={() => {}} options={['表', '字段', '分区', '接口']} /></Field>
                <Field label="所属域"><Select value="临床" onChange={() => {}} options={['临床', '公卫', '运营', '主数据']} /></Field>
                <Field label="对象名" className="span-2"><input className="input mono" placeholder="ods_his.new_table" /></Field>
              </div>
              <Btn className="mt-10" size="sm" variant="primary" icon="plus" onClick={() => notify('元数据已登记，进入审核')}>提交登记</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'analyze' && (
        <>
          <Card className="mt-14" title="元数据链路 / 血缘" subtitle="源 → 采集 → 目录/变更 → 血缘 → 门户 · 可追溯" actions={
            <Btn size="sm" icon="external" onClick={() => go('/collection/lineage')}>打开全链路</Btn>
          }>
            <LineageGraph nodes={lineageNodes} edges={lineageEdges} onSelect={setGraphNode} height={360} />
            {graphNode && (
              <div className="info-note mt-10">
                <Icon name="target" size={13} />
                <span>选中：<strong>{graphNode.label}</strong>（{graphNode.sub}）· 可下钻表/字段级血缘</span>
              </div>
            )}
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="变更监控" subtitle="近实时">
              <div className="timeline-list">
                {changes.map((c) => (
                  <div className="tl-item" key={c.title}>
                    <span className="tl-dot" />
                    <div className="tl-time">{c.t}</div>
                    <div className="tl-body">
                      <div><strong>{c.title}</strong><Badge tone="blue">{c.tag}</Badge></div>
                      <p>{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="影响分析" subtitle="变更波及">
              <div className="md-impact">
                {[
                  { o: 'ods_his.outpatient.dept_code', l: '高', t: 6, i: 12, a: 3 },
                  { o: 'dim_department', l: '中', t: 4, i: 6, a: 2 },
                  { o: '门诊预约爽约人次', l: '中', t: 1, i: 2, a: 1 },
                ].map((x) => (
                  <div key={x.o}>
                    <div className="md-impact-head">
                      <strong className="mono-cell">{x.o}</strong>
                      <Badge tone={x.l === '高' ? 'red' : 'amber'}>{x.l}</Badge>
                    </div>
                    <small>表 {x.t} · 指标 {x.i} · 应用 {x.a}</small>
                    <Progress value={x.l === '高' ? 88 : 55} tone={x.l === '高' ? 'red' : 'amber'} height={5} />
                  </div>
                ))}
              </div>
              <Btn className="mt-10 w-full" size="sm" icon="network" onClick={() => go('/center/graph')}>指标依赖图谱</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'portal' && (
        <>
          {deniedDemo && (
            <div className="md-deny mt-14">
              <Icon name="shieldalert" size={16} />
              <div>
                <strong>访问被拒绝</strong>
                <p>主体「外部厂商」请求读取库表结构元数据 — ACL 策略阻断。未授权不可访问。</p>
              </div>
              <Btn size="sm" onClick={() => setDeniedDemo(false)}>知道了</Btn>
            </div>
          )}
          <div className="grid-2-1 mt-14">
            <Card title="元数据访问门户" subtitle="授权查询 · 变更订阅" noPad>
              <div className="pad-h">
                <DataTable rows={apis} pageSize={5} onRowClick={(r) => setActiveApi(r)} columns={[
                  { key: 'name', title: '接口', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small className="mono-cell">{r.path}</small></div> },
                  { key: 'topic', title: '主题', width: 70, render: (r) => <Badge tone="slate">{r.topic}</Badge> },
                  { key: 'apps', title: '订阅应用', width: 80, align: 'right' },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '已发布' ? 'green' : 'red'}>{r.status}</Badge> },
                  { key: 'ops', title: '操作', width: 80, render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="link-btn" onClick={() => subscribeApi(r)} disabled={r.status !== '已发布'}>订阅</button>
                    </div>
                  ) },
                ]} />
              </div>
            </Card>
            <Card title="访问控制 ACL" subtitle="未授权不可访问">
              <div className="md-acl-list">
                {acls.map((a) => (
                  <div key={a.id} className={a.result === '拒绝' ? 'is-deny' : ''}>
                    <strong>{a.subject}</strong>
                    <small>{a.scope} · {a.perm}</small>
                    <Badge tone={a.result === '允许' ? 'green' : 'red'}>{a.result}</Badge>
                  </div>
                ))}
              </div>
              <Btn className="mt-10 w-full" size="sm" variant="secondary" icon="shieldalert" onClick={tryUnauthorized}>模拟未授权访问</Btn>
            </Card>
          </div>
          <Card className="mt-14" title="门户检索" subtitle="独立元数据门户体验">
            <div className="md-portal-search">
              <SearchInput value={tq} onChange={setTq} placeholder="检索表 / 字段 / 标准 / 血缘…" width={320} />
              <Btn icon="search" onClick={() => notify(tq ? `已检索「${tq}」· 返回 24 条授权可见结果` : '请输入关键词')}>查询</Btn>
            </div>
            <div className="md-portal-hits mt-12">
              {[
                { n: 'ods_his.patient', k: '表', d: '患者主数据 · 完整度 98%' },
                { n: 'patient_id', k: '字段', d: '关联标准 DE-PAT-001' },
                { n: 'dwd_fact_visit 血缘', k: '血缘', d: '上游 3 · 下游 8' },
              ].map((h) => (
                <button key={h.n} type="button" className="md-hit" onClick={() => notify(`打开 ${h.n}`, 'info')}>
                  <Badge tone="slate">{h.k}</Badge>
                  <div><strong>{h.n}</strong><small>{h.d}</small></div>
                  <Icon name="arrowright" size={13} />
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      <Drawer open={!!activeModel} onClose={() => setActiveModel(null)} title={activeModel?.name || ''} desc={activeModel ? `${activeModel.id} · ${activeModel.kind}` : ''} width={480}
        footer={<><Btn onClick={() => setActiveModel(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('元模型已保存')}>保存</Btn></>}>
        {activeModel && (
          <KeyValue cols={2} items={[
            { label: '属性数', value: String(activeModel.attrs) },
            { label: '对象数', value: activeModel.objects.toLocaleString() },
            { label: '类型', value: activeModel.kind },
            { label: '状态', value: <Badge tone={activeModel.status === '启用' ? 'green' : 'amber'}>{activeModel.status}</Badge> },
            { label: '说明', value: '元模型定义采集模板字段与门户展示结构，变更需审核。', wide: true },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeTask} onClose={() => setActiveTask(null)} title={activeTask?.source || ''} desc={activeTask ? `${activeTask.id} · ${activeTask.type}` : ''} width={480}
        footer={<><Btn onClick={() => setActiveTask(null)}>关闭</Btn><Btn variant="primary" loading={collecting} onClick={runCollect}>重跑采集</Btn></>}>
        {activeTask && (
          <KeyValue cols={2} items={[
            { label: '模板', value: activeTask.tpl },
            { label: '覆盖率', value: `${activeTask.cover}%` },
            { label: '最近执行', value: activeTask.last },
            { label: '状态', value: <Badge tone={activeTask.status === '成功' ? 'green' : activeTask.status === '失败' ? 'red' : 'amber'}>{activeTask.status}</Badge> },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeAudit} onClose={() => setActiveAudit(null)} title={activeAudit?.object || ''} desc={activeAudit?.change} width={460}
        footer={
          <>
            <Btn onClick={() => setActiveAudit(null)}>关闭</Btn>
            {activeAudit?.status === '待审' && (
              <Btn variant="primary" onClick={() => { notify('审核已通过，元数据变更生效'); setActiveAudit(null); }}>通过</Btn>
            )}
          </>
        }>
        {activeAudit && (
          <KeyValue cols={2} items={[
            { label: '申请人', value: activeAudit.applicant },
            { label: '时间', value: activeAudit.at },
            { label: '状态', value: <Badge>{activeAudit.status}</Badge> },
            { label: '变更', value: activeAudit.change },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeApi} onClose={() => setActiveApi(null)} title={activeApi?.name || ''} desc={activeApi?.path} width={460}
        footer={
          <>
            <Btn onClick={() => setActiveApi(null)}>关闭</Btn>
            {activeApi && activeApi.status === '已发布' && (
              <Btn variant="primary" onClick={() => activeApi && subscribeApi(activeApi)}>订阅</Btn>
            )}
          </>
        }>
        {activeApi && (
          <KeyValue cols={1} items={[
            { label: '路径', value: <span className="mono">{activeApi.path}</span> },
            { label: '主题', value: activeApi.topic },
            { label: '订阅应用', value: String(activeApi.apps) },
            { label: '说明', value: '支持查询与变更订阅；调用需应用授权与 ACL 校验。' },
          ]} />
        )}
      </Drawer>
    </>
  );
}
