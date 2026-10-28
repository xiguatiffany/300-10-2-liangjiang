'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'catalog' | 'supply' | 'assess';
type CatStatus = '草稿' | '待审核' | '已发布' | '已下线';
type DemandStatus = '登记' | '审核中' | '已备案' | '实施中' | '效果确认' | '已关闭';

type CatalogItem = {
  id: string;
  name: string;
  kind: '库表' | 'API' | '文件';
  domain: string;
  code: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  status: CatStatus;
  owner: string;
  updated: string;
};

type SysItem = {
  id: string;
  name: string;
  org: string;
  vendor: string;
  type: string;
  status: '在用' | '建设中' | '停用';
};

type Demand = {
  id: string;
  title: string;
  requester: string;
  org: string;
  status: DemandStatus;
  priority: '高' | '中' | '低';
  created: string;
  sla: string;
};

type AssetScore = {
  id: string;
  name: string;
  heat: number;
  breadth: number;
  freshness: number;
  quality: number;
  overall: number;
};

const catalogSeed: CatalogItem[] = [
  { id: 'CAT-001', name: 'dwd.fact_visit', kind: '库表', domain: '诊疗', code: 'TJ.DWD.VISIT.01', level: 'L2', status: '已发布', owner: '张敏', updated: '08-06' },
  { id: 'CAT-002', name: '患者主索引 API', kind: 'API', domain: '主数据', code: 'TJ.API.MPI.01', level: 'L3', status: '已发布', owner: '李倩', updated: '08-05' },
  { id: 'CAT-003', name: 'ods_his.patient', kind: '库表', domain: '诊疗', code: 'TJ.ODS.PAT.01', level: 'L3', status: '待审核', owner: '王磊', updated: '08-06' },
  { id: 'CAT-004', name: '公卫随访宽表', kind: '库表', domain: '公卫', code: 'TJ.DWS.FU.02', level: 'L2', status: '草稿', owner: '赵倩', updated: '08-04' },
  { id: 'CAT-005', name: '检验结果批量文件', kind: '文件', domain: '检验', code: 'TJ.FILE.LAB.01', level: 'L2', status: '已发布', owner: '周宁', updated: '08-03' },
  { id: 'CAT-006', name: '指标订阅网关', kind: 'API', domain: '指标', code: 'TJ.API.IND.03', level: 'L2', status: '待审核', owner: '张敏', updated: '08-06' },
  { id: 'CAT-007', name: '影像索引湖表', kind: '库表', domain: '影像', code: 'TJ.ODS.PACS.01', level: 'L4', status: '已下线', owner: '周宁', updated: '07-28' },
];

const systemsSeed: SysItem[] = [
  { id: 'SYS-01', name: '医院 HIS', org: '两江新区人民医院', vendor: '东华', type: '业务系统', status: '在用' },
  { id: 'SYS-02', name: 'LIS 检验', org: '两江新区人民医院', vendor: '智业', type: '业务系统', status: '在用' },
  { id: 'SYS-03', name: '区域公卫平台', org: '卫健局', vendor: '东软', type: '区域平台', status: '在用' },
  { id: 'SYS-04', name: '基层卫生系统', org: '人和社卫', vendor: '创业慧康', type: '业务系统', status: '建设中' },
  { id: 'SYS-05', name: '妇幼保健系统', org: '妇幼保健院', vendor: '万达', type: '业务系统', status: '在用' },
  { id: 'SYS-06', name: '旧版 PACS', org: '两江新区中医院', vendor: '本地', type: '业务系统', status: '停用' },
];

const demandsSeed: Demand[] = [
  { id: 'REQ-108', title: '开放门诊人次指标 API', requester: '医政科', org: '卫健局', status: '实施中', priority: '高', created: '08-01', sla: '10 天' },
  { id: 'REQ-107', title: '基层高血压患者清单交换', requester: '公卫科', org: '人和社卫', status: '效果确认', priority: '高', created: '07-22', sla: '15 天' },
  { id: 'REQ-106', title: '检验危急值主题表授权', requester: '检验科', org: '人民医院', status: '已备案', priority: '中', created: '07-18', sla: '7 天' },
  { id: 'REQ-105', title: '影像索引只读库表开通', requester: '信息科', org: '中医院', status: '审核中', priority: '中', created: '08-04', sla: '5 天' },
  { id: 'REQ-104', title: '妇幼专病库样例下载', requester: '妇幼办', org: '妇幼保健院', status: '登记', priority: '低', created: '08-06', sla: '12 天' },
  { id: 'REQ-103', title: '停用旧版主索引接口', requester: '治理办', org: '信息中心', status: '已关闭', priority: '中', created: '07-10', sla: '—' },
];

const assetScores: AssetScore[] = [
  { id: 'AST-01', name: '就诊明细宽表', heat: 96, breadth: 88, freshness: 94, quality: 97, overall: 94 },
  { id: 'AST-02', name: '患者主索引 API', heat: 92, breadth: 95, freshness: 90, quality: 96, overall: 93 },
  { id: 'AST-03', name: '公卫随访主题', heat: 78, breadth: 72, freshness: 85, quality: 94, overall: 82 },
  { id: 'AST-04', name: '检验结果湖表', heat: 88, breadth: 80, freshness: 91, quality: 95, overall: 89 },
  { id: 'AST-05', name: '影像索引', heat: 64, breadth: 55, freshness: 70, quality: 88, overall: 69 },
];

const demandFlow: DemandStatus[] = ['登记', '审核中', '已备案', '实施中', '效果确认', '已关闭'];

const toneOf = (s: string) => {
  if (['已发布', '在用', '已关闭', '效果确认', '已备案'].includes(s)) return 'green';
  if (['待审核', '审核中', '实施中', '建设中', '中'].includes(s)) return 'amber';
  if (['草稿', '登记', '已下线', '停用', '高'].includes(s)) return 'red';
  return 'slate';
};

/** A7 数据资源管理：编目闭环 · 供需对接 · 资产评估 */
export function ResourceManageHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('catalog');
  const [catalog, setCatalog] = useState(catalogSeed);
  const [demands, setDemands] = useState(demandsSeed);
  const [catKind, setCatKind] = useState('');
  const [catStatus, setCatStatus] = useState('');
  const [cq, setCq] = useState('');
  const [dq, setDq] = useState('');
  const [dStatus, setDStatus] = useState('');
  const [activeCat, setActiveCat] = useState<CatalogItem | null>(null);
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);
  const [activeAsset, setActiveAsset] = useState<AssetScore | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const filteredCat = useMemo(() => catalog.filter((c) =>
    (!catKind || c.kind === catKind)
    && (!catStatus || c.status === catStatus)
    && (c.id + c.name + c.code + c.domain).toLowerCase().includes(cq.toLowerCase())
  ), [catalog, catKind, catStatus, cq]);

  const filteredDemands = useMemo(() => demands.filter((d) =>
    (!dStatus || d.status === dStatus)
    && (d.id + d.title + d.org + d.requester).toLowerCase().includes(dq.toLowerCase())
  ), [demands, dStatus, dq]);

  const published = catalog.filter((c) => c.status === '已发布').length;
  const pendingCat = catalog.filter((c) => c.status === '待审核').length;
  const openDemands = demands.filter((d) => d.status !== '已关闭').length;
  const avgScore = (assetScores.reduce((s, a) => s + a.overall, 0) / assetScores.length).toFixed(0);

  const submitCatalog = (id: string) => {
    setCatalog((arr) => arr.map((c) => (c.id === id && c.status === '草稿' ? { ...c, status: '待审核', updated: '08-06' } : c)));
    notify(`${id} 已提交审核`);
  };

  const approveCatalog = (id: string, ok: boolean) => {
    setCatalog((arr) => arr.map((c) => {
      if (c.id !== id) return c;
      return { ...c, status: ok ? '已发布' : '草稿', updated: '08-06' };
    }));
    notify(ok ? `${id} 审核通过并发布上线` : `${id} 已退回草稿`);
  };

  const advanceDemand = (id: string) => {
    setDemands((arr) => arr.map((d) => {
      if (d.id !== id) return d;
      const i = demandFlow.indexOf(d.status);
      const next = demandFlow[Math.min(i + 1, demandFlow.length - 1)];
      return { ...d, status: next };
    }));
    notify(`${id} 已推进至下一状态`);
  };

  const exportReport = async () => {
    setReportBusy(true);
    setTab('assess');
    await new Promise((r) => setTimeout(r, 800));
    setReportBusy(false);
    notify('资产评估报告已生成（PDF）· 含热度/广度/时效/质量四维');
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA RESOURCE MANAGEMENT · A7"
        title="数据资源管理"
        desc="A7-01 编目—审核—发布 · A7-02 系统清单与供需全生命周期 · A7-03 热度/广度/时效/质量评估与报告。"
        actions={
          <>
            <Btn icon="layers" onClick={() => go('/bid/asset-management')}>资产管理</Btn>
            <Btn icon="building" onClick={() => go('/collection/governance-service')}>治理服务</Btn>
            <Btn icon="plus" onClick={() => { setTab('catalog'); setCatalogOpen(true); }}>新建编目</Btn>
            <Btn variant="primary" icon="download" loading={reportBusy} onClick={exportReport}>导出评估报告</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '资源编目', d: '编目→审核→发布' },
          { n: '02', t: '供需对接', d: '需求全生命周期' },
          { n: '03', t: '资产评估', d: '四维评分·报告' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'catalog' : i === 1 ? 'supply' : 'assess') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 已发布 {published} · 待审 {pendingCat}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="编目资源" value={String(catalog.length)} unit="项" delta={`已发布 ${published}`} icon="layers" tone="blue" onClick={() => setTab('catalog')} />
        <StatCard label="待审核" value={String(pendingCat)} unit="项" delta="编目闭环" icon="clock" tone="amber" onClick={() => { setTab('catalog'); setCatStatus('待审核'); }} />
        <StatCard label="供需需求" value={String(openDemands)} unit="单" delta={`系统 ${systemsSeed.length} 套`} icon="git" tone="violet" onClick={() => setTab('supply')} />
        <StatCard label="资产均分" value={avgScore} unit="分" delta="四维综合" icon="chart" tone="green" onClick={() => setTab('assess')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'catalog', label: '资源编目', count: catalog.length },
          { key: 'supply', label: '系统清单与供需', count: openDemands },
          { key: 'assess', label: '资产评估', count: assetScores.length },
        ]}
      />

      {tab === 'catalog' && (
        <>
          <Card className="mt-14" title="编目闭环" subtitle="库表 / API / 文件 · 分类编码 · 上线">
            <div className="rm-flow">
              {['编目登记', '分类编码', '审核', '发布上线', '下线回收'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className="rm-flow-node"><em>0{i + 1}</em><strong>{s}</strong></div>
                  {i < 4 && <Icon name="arrowright" size={12} />}
                </React.Fragment>
              ))}
            </div>
          </Card>
          <Card
            className="mt-14"
            title="资源目录"
            subtitle="验收：编目—审核—发布闭环"
            noPad
            actions={
              <div className="filter-bar">
                <SearchInput value={cq} onChange={setCq} placeholder="搜索名称/编码" width={180} />
                <Select value={catKind} onChange={setCatKind} options={['', '库表', 'API', '文件']} placeholder="全部类型" width={100} />
                <Select value={catStatus} onChange={setCatStatus} options={['', '草稿', '待审核', '已发布', '已下线']} placeholder="全部状态" width={110} />
                <Btn size="sm" icon="plus" onClick={() => setCatalogOpen(true)}>新建</Btn>
              </div>
            }
          >
            <div className="pad-h">
              <DataTable
                rows={filteredCat}
                pageSize={7}
                onRowClick={(r) => setActiveCat(r)}
                columns={[
                  { key: 'id', title: '编号', width: 86, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '资源', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.code} · {r.domain}</small></div> },
                  { key: 'kind', title: '类型', width: 64, render: (r) => <Badge tone="slate">{r.kind}</Badge> },
                  { key: 'level', title: '分级', width: 56, render: (r) => <Badge tone={r.level === 'L4' || r.level === 'L3' ? 'red' : 'blue'}>{r.level}</Badge> },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  { key: 'owner', title: '负责人', width: 70 },
                  {
                    key: 'ops', title: '操作', width: 130,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        {r.status === '草稿' && <button type="button" className="link-btn" onClick={() => submitCatalog(r.id)}>提交</button>}
                        {r.status === '待审核' && (
                          <>
                            <button type="button" className="link-btn" onClick={() => approveCatalog(r.id, true)}>通过</button>
                            <button type="button" className="link-muted" onClick={() => approveCatalog(r.id, false)}>退回</button>
                          </>
                        )}
                        {r.status === '已发布' && <button type="button" className="link-muted" onClick={() => go('/bid/asset-management')}>资产</button>}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'supply' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="信息系统清单" subtitle="登记在册 · 支撑供需对接" noPad>
              <div className="pad-h">
                <DataTable
                  rows={systemsSeed}
                  pageSize={6}
                  paginate={false}
                  columns={[
                    { key: 'id', title: '编号', width: 72, render: (r) => <span className="mono-cell">{r.id}</span> },
                    { key: 'name', title: '系统', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.org}</small></div> },
                    { key: 'vendor', title: '厂商', width: 80 },
                    { key: 'type', title: '类型', width: 80, render: (r) => <Badge tone="slate">{r.type}</Badge> },
                    { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  ]}
                />
              </div>
            </Card>
            <Card title="需求生命周期" subtitle="登记→审核→备案→实施→效果确认">
              <div className="rm-life">
                {demandFlow.map((s, i) => (
                  <div key={s} className={dStatus === s ? 'is-on' : ''}>
                    <em>{i + 1}</em>
                    <strong>{s}</strong>
                    <small>{demands.filter((d) => d.status === s).length} 单</small>
                  </div>
                ))}
              </div>
              <Btn className="mt-14 w-full" variant="secondary" icon="plus" onClick={() => setDemandOpen(true)}>登记需求</Btn>
            </Card>
          </div>

          <Card
            className="mt-14"
            title="供需对接工单"
            subtitle="验收：需求单全生命周期可追溯"
            noPad
            actions={
              <div className="filter-bar">
                <SearchInput value={dq} onChange={setDq} placeholder="搜索需求" width={180} />
                <Select value={dStatus} onChange={setDStatus} options={['', ...demandFlow]} placeholder="全部状态" width={120} />
              </div>
            }
          >
            <div className="pad-h">
              <DataTable
                rows={filteredDemands}
                pageSize={6}
                onRowClick={(r) => setActiveDemand(r)}
                columns={[
                  { key: 'id', title: '单号', width: 86, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'title', title: '需求', render: (r) => <div className="cell-main"><strong>{r.title}</strong><small>{r.org} · {r.requester}</small></div> },
                  { key: 'priority', title: '优先级', width: 70, render: (r) => <Badge tone={toneOf(r.priority)}>{r.priority}</Badge> },
                  { key: 'status', title: '状态', width: 90, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  { key: 'sla', title: 'SLA', width: 70 },
                  { key: 'created', title: '登记', width: 70 },
                  {
                    key: 'ops', title: '操作', width: 100,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="link-btn" onClick={() => setActiveDemand(r)}>追溯</button>
                        <button type="button" className="link-muted" onClick={() => advanceDemand(r.id)} disabled={r.status === '已关闭'}>推进</button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'assess' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="资产评估概览" subtitle="热度 / 广度 / 时效 / 质量" actions={<Badge tone="green">可出报告</Badge>}>
              <div className="rm-assess-kpis">
                {[
                  { l: '热度', v: 84, c: '#6755F5' },
                  { l: '广度', v: 78, c: '#9587FF' },
                  { l: '时效', v: 86, c: '#0891B2' },
                  { l: '质量', v: 94, c: '#059669' },
                ].map((x) => (
                  <div key={x.l}>
                    <span>{x.l}</span>
                    <strong style={{ color: x.c }}>{x.v}</strong>
                    <Progress value={x.v} tone="violet" height={5} />
                  </div>
                ))}
              </div>
              <div className="mt-14">
                <AreaChart
                  data={[
                    { label: '03', value: 76 }, { label: '04', value: 79 }, { label: '05', value: 81 },
                    { label: '06', value: 84 }, { label: '07', value: 86 }, { label: '08', value: 88 },
                  ]}
                  height={150}
                  color="#6755F5"
                  suffix=" 分"
                  valueName="综合资产分"
                  domainMin={70}
                  domainMax={100}
                />
              </div>
            </Card>
            <Card title="成果分析" subtitle="接入 / 治理 / 库表">
              <BarList
                items={[
                  { label: '已接入系统', value: systemsSeed.filter((s) => s.status === '在用').length },
                  { label: '已发布编目', value: published },
                  { label: '主题/宽表资产', value: 48 },
                  { label: '开放 API', value: 26 },
                ]}
                color="#6755F5"
              />
              <div className="row-actions mt-14">
                <Btn variant="primary" icon="download" loading={reportBusy} onClick={exportReport}>导出评估报告</Btn>
                <Btn icon="store" onClick={() => go('/bid/asset-publish')}>资产发布</Btn>
              </div>
            </Card>
          </div>

          <Card className="mt-14" title="资产评分明细" subtitle="点击查看四维构成" noPad>
            <div className="pad-h">
              <DataTable
                rows={assetScores}
                pageSize={5}
                onRowClick={(r) => setActiveAsset(r)}
                columns={[
                  { key: 'id', title: '资产ID', width: 86, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '资产名称', render: (r) => <strong>{r.name}</strong> },
                  { key: 'heat', title: '热度', width: 70, align: 'right' },
                  { key: 'breadth', title: '广度', width: 70, align: 'right' },
                  { key: 'freshness', title: '时效', width: 70, align: 'right' },
                  { key: 'quality', title: '质量', width: 70, align: 'right' },
                  { key: 'overall', title: '综合', width: 80, align: 'right', render: (r) => <span className="strong text-green">{r.overall}</span> },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      <Drawer
        open={!!activeCat}
        onClose={() => setActiveCat(null)}
        width={520}
        title={activeCat?.name || ''}
        desc={activeCat ? `${activeCat.id} · ${activeCat.code}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveCat(null)}>关闭</Btn>
            {activeCat?.status === '草稿' && <Btn variant="primary" onClick={() => activeCat && submitCatalog(activeCat.id)}>提交审核</Btn>}
            {activeCat?.status === '待审核' && <Btn variant="primary" onClick={() => activeCat && approveCatalog(activeCat.id, true)}>审核发布</Btn>}
          </>
        }
      >
        {activeCat && (
          <KeyValue
            cols={2}
            items={[
              { label: '类型', value: activeCat.kind },
              { label: '主题域', value: activeCat.domain },
              { label: '分级', value: activeCat.level },
              { label: '状态', value: activeCat.status },
              { label: '负责人', value: activeCat.owner },
              { label: '更新', value: `2026-${activeCat.updated}` },
              { label: '分类编码', value: activeCat.code, wide: true },
              { label: '闭环说明', value: '草稿提交 → 审核通过后发布上线；可下线回收。', wide: true },
            ]}
          />
        )}
      </Drawer>

      <Drawer
        open={!!activeDemand}
        onClose={() => setActiveDemand(null)}
        width={540}
        title={activeDemand?.title || ''}
        desc={activeDemand?.id || ''}
        footer={
          <>
            <Btn onClick={() => setActiveDemand(null)}>关闭</Btn>
            <Btn variant="primary" onClick={() => activeDemand && advanceDemand(activeDemand.id)} disabled={activeDemand?.status === '已关闭'}>推进状态</Btn>
          </>
        }
      >
        {activeDemand && (
          <>
            <div className="drawer-summary">
              <div><span>优先级</span><strong>{activeDemand.priority}</strong></div>
              <div><span>状态</span><strong className="sm">{activeDemand.status}</strong></div>
              <div><span>SLA</span><strong>{activeDemand.sla}</strong></div>
              <div><span>登记</span><strong className="sm">{activeDemand.created}</strong></div>
            </div>
            <div className="section-title-sm mt-14">生命周期轨迹</div>
            <div className="rm-trace mt-10">
              {demandFlow.map((s) => {
                const idx = demandFlow.indexOf(activeDemand.status);
                const cur = demandFlow.indexOf(s);
                const done = cur <= idx;
                return (
                  <div key={s} className={done ? 'is-done' : ''}>
                    <i />
                    <strong>{s}</strong>
                    <small>{done ? (cur === idx ? '当前' : '已完成') : '待到达'}</small>
                  </div>
                );
              })}
            </div>
            <KeyValue
              className="mt-14"
              cols={2}
              items={[
                { label: '申请方', value: activeDemand.requester },
                { label: '机构', value: activeDemand.org },
                { label: '追溯说明', value: '需求单状态变更均留痕，支持审核备案与效果确认回执。', wide: true },
              ]}
            />
          </>
        )}
      </Drawer>

      <Drawer
        open={!!activeAsset}
        onClose={() => setActiveAsset(null)}
        width={480}
        title={activeAsset?.name || ''}
        desc={activeAsset?.id || ''}
        footer={<><Btn onClick={() => setActiveAsset(null)}>关闭</Btn><Btn variant="primary" icon="download" onClick={exportReport}>导出含此资产的报告</Btn></>}
      >
        {activeAsset && (
          <div className="rm-asset-dims">
            {[
              ['热度', activeAsset.heat],
              ['广度', activeAsset.breadth],
              ['时效', activeAsset.freshness],
              ['质量', activeAsset.quality],
              ['综合', activeAsset.overall],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div className="resource-head"><span>{l}</span><strong>{v}</strong></div>
                <Progress value={v as number} tone="violet" height={6} />
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Modal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title="新建资源编目"
        desc="登记库表 / API / 文件并生成分类编码"
        width={520}
        footer={
          <>
            <Btn onClick={() => setCatalogOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `CAT-${String(catalog.length + 1).padStart(3, '0')}`;
              setCatalog((arr) => [{
                id, name: '新编目资源（演示）', kind: '库表', domain: '诊疗', code: `TJ.NEW.${id}`,
                level: 'L2', status: '草稿', owner: '演示账号', updated: '08-06',
              }, ...arr]);
              setCatalogOpen(false);
              notify(`${id} 草稿已创建`);
            }}>保存草稿</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="资源名称" required className="span-2"><input className="input" placeholder="例如：dwd.fact_lab_result" /></Field>
          <Field label="类型"><Select value="库表" onChange={() => {}} options={['库表', 'API', '文件']} /></Field>
          <Field label="主题域"><Select value="诊疗" onChange={() => {}} options={['诊疗', '公卫', '检验', '影像', '主数据', '指标']} /></Field>
          <Field label="安全分级"><Select value="L2" onChange={() => {}} options={['L1', 'L2', 'L3', 'L4']} /></Field>
          <Field label="负责人"><input className="input" defaultValue="演示账号" /></Field>
        </div>
      </Modal>

      <Modal
        open={demandOpen}
        onClose={() => setDemandOpen(false)}
        title="登记供需需求"
        desc="进入全生命周期跟踪"
        width={520}
        footer={
          <>
            <Btn onClick={() => setDemandOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `REQ-${100 + demands.length + 1}`;
              setDemands((arr) => [{
                id, title: '新数据需求（演示）', requester: '业务科室', org: '演示机构',
                status: '登记', priority: '中', created: '08-06', sla: '10 天',
              }, ...arr]);
              setDemandOpen(false);
              setTab('supply');
              notify(`${id} 已登记`);
            }}>登记</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="需求标题" required className="span-2"><input className="input" placeholder="例如：开放某某主题表" /></Field>
          <Field label="申请方"><input className="input" defaultValue="业务科室" /></Field>
          <Field label="机构"><Select value="两江新区人民医院" onChange={() => {}} options={systemsSeed.map((s) => s.org).filter((v, i, a) => a.indexOf(v) === i)} /></Field>
          <Field label="优先级" className="span-2"><Select value="中" onChange={() => {}} options={['高', '中', '低']} /></Field>
        </div>
      </Modal>
    </>
  );
}
