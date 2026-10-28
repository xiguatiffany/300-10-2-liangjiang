'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { standardDocs } from '../../dataBid';

type TabKey = 'plan' | 'dcmm' | 'impl';

type OrgRole = { role: string; unit: string; owner: string; duty: string };
type PathStep = { id: string; phase: string; name: string; months: string; status: '已完成' | '进行中' | '未开始'; deliverable: string };
type DcmmDim = { key: string; name: string; level: number; target: number; gap: string };
type ImplOrg = {
  id: string;
  name: string;
  type: string;
  stage: '资源梳理' | '接入' | '治理' | '验收' | '运营';
  progress: number;
  tables: number;
  quality: number;
  owner: string;
  updated: string;
};
type Workstream = { id: string; name: string; domain: string; status: '进行中' | '已完成' | '待启动'; orgs: number; kpi: string };

const orgRoles: OrgRole[] = [
  { role: '治理委员会', unit: '两江新区卫健局', owner: '主任委员', duty: '决策治理方针、审批制度与重大变更' },
  { role: '数据治理办', unit: '信息中心 / 治理办', owner: '张敏', duty: '组织实施、标准归口、质量考核' },
  { role: '业务条线负责人', unit: '医院 / 公卫 / 妇幼', owner: '各机构信息科', duty: '源端质量、对码确认、问题闭环' },
  { role: '平台运营', unit: '运维组', owner: '王磊', duty: '采集通道、监控告警、应急处置' },
];

const pathSteps: PathStep[] = [
  { id: 'P1', phase: '规划', name: '组织与制度设计', months: 'M1–M2', status: '已完成', deliverable: '治理章程、岗位职责、评审纪要' },
  { id: 'P2', phase: '评估', name: 'DCMM 现状评估', months: 'M2–M3', status: '已完成', deliverable: '评估报告、差距清单' },
  { id: 'P3', phase: '标准', name: '编目与规范编制', months: 'M3–M5', status: '进行中', deliverable: '12 类标准、病案首页质控规范' },
  { id: 'P4', phase: '实施', name: '采集治理工程落地', months: 'M4–M9', status: '进行中', deliverable: '机构接入、主题库、质量达标' },
  { id: 'P5', phase: '运营', name: '持续运营与考核', months: 'M9–', status: '未开始', deliverable: '月报、考核、改进闭环' },
];

const dcmmDims: DcmmDim[] = [
  { key: 'strategy', name: '数据战略', level: 3, target: 4, gap: '战略宣贯到基层机构不足' },
  { key: 'governance', name: '数据治理', level: 3, target: 4, gap: '委员会例会与考核联动待强化' },
  { key: 'architecture', name: '数据架构', level: 3, target: 4, gap: '主题域划分需与湖仓分层对齐' },
  { key: 'standard', name: '数据标准', level: 4, target: 4, gap: '已达目标，维持版本受控' },
  { key: 'quality', name: '数据质量', level: 3, target: 4, gap: '及时性与闭环时效需提升' },
  { key: 'security', name: '数据安全', level: 3, target: 4, gap: '分级分类与脱敏策略待细化' },
  { key: 'application', name: '数据应用', level: 2, target: 3, gap: '指标/标签运营覆盖面不足' },
  { key: 'lifecycle', name: '数据生存周期', level: 3, target: 3, gap: '已达目标' },
];

const implOrgsSeed: ImplOrg[] = [
  { id: 'ORG-01', name: '两江新区人民医院', type: '三级医院', stage: '运营', progress: 96, tables: 286, quality: 98.2, owner: '张敏', updated: '08-06' },
  { id: 'ORG-02', name: '两江新区中医院', type: '三级医院', stage: '验收', progress: 88, tables: 214, quality: 96.8, owner: '李倩', updated: '08-06' },
  { id: 'ORG-03', name: '人和社区卫生服务中心', type: '基层', stage: '治理', progress: 72, tables: 86, quality: 95.4, owner: '王磊', updated: '08-05' },
  { id: 'ORG-04', name: '鸳鸯社区卫生服务中心', type: '基层', stage: '接入', progress: 54, tables: 64, quality: 94.2, owner: '赵倩', updated: '08-05' },
  { id: 'ORG-05', name: '大竹林社区卫生服务中心', type: '基层', stage: '资源梳理', progress: 28, tables: 12, quality: 92.8, owner: '周宁', updated: '08-04' },
  { id: 'ORG-06', name: '两江新区妇幼保健院', type: '专科', stage: '治理', progress: 68, tables: 96, quality: 95.8, owner: '李倩', updated: '08-06' },
];

const workstreams: Workstream[] = [
  { id: 'WS-01', name: '资源梳理与目录', domain: '元数据', status: '已完成', orgs: 42, kpi: '目录覆盖 100%' },
  { id: 'WS-02', name: '内部系统接入', domain: '采集', status: '进行中', orgs: 36, kpi: '接入率 86%' },
  { id: 'WS-03', name: '外部数据接入', domain: '采集', status: '进行中', orgs: 8, kpi: '接口 12 条' },
  { id: 'WS-04', name: '标准与对码', domain: '标准', status: '进行中', orgs: 42, kpi: '对码完成 92%' },
  { id: 'WS-05', name: '质量与清洗', domain: '质量', status: '进行中', orgs: 30, kpi: '通过率 ≥96%' },
  { id: 'WS-06', name: '建模与归集', domain: '湖仓', status: '进行中', orgs: 24, kpi: '主题库 9 个' },
  { id: 'WS-07', name: '主题/专题库', domain: '湖仓', status: '待启动', orgs: 0, kpi: '专项 4 个' },
  { id: 'WS-08', name: '接入运营', domain: '运营', status: '进行中', orgs: 36, kpi: 'SLA 达标 97%' },
];

const normTypes = [
  { name: '治理规范', desc: '组织、职责、考核、变更', tone: 'violet' },
  { name: '应用规范', desc: '共享、订阅、指标口径', tone: 'blue' },
  { name: '安全规范', desc: '分级分类、脱敏、审计', tone: 'amber' },
  { name: '运营规范', desc: '值班、应急、月报', tone: 'green' },
];

const toneOf = (s: string) => {
  if (['已完成', '运营', '已发布'].includes(s)) return 'green';
  if (['进行中', '治理', '验收', '接入', '审核中'].includes(s)) return 'amber';
  if (['未开始', '待启动', '资源梳理'].includes(s)) return 'slate';
  return 'slate';
};

/** A6-01 / A6-02 治理服务：规划与制度 + 采集治理实施 */
export function GovernanceServiceHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('plan');
  const [orgs, setOrgs] = useState(implOrgsSeed);
  const [stage, setStage] = useState('');
  const [q, setQ] = useState('');
  const [activeOrg, setActiveOrg] = useState<ImplOrg | null>(null);
  const [activeDoc, setActiveDoc] = useState<typeof standardDocs[0] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dcmmRunning, setDcmmRunning] = useState(false);
  const [dcmmDone, setDcmmDone] = useState(true);
  const [demoing, setDemoing] = useState(false);
  const [planOk, setPlanOk] = useState(false);
  const [implOk, setImplOk] = useState(false);

  const filteredOrgs = useMemo(() => orgs.filter((o) =>
    (!stage || o.stage === stage)
    && (o.name + o.type + o.owner).toLowerCase().includes(q.toLowerCase())
  ), [orgs, stage, q]);

  const avgProgress = Math.round(orgs.reduce((s, o) => s + o.progress, 0) / orgs.length);
  const avgQuality = (orgs.reduce((s, o) => s + o.quality, 0) / orgs.length).toFixed(1);
  const dcmmAvg = (dcmmDims.reduce((s, d) => s + d.level, 0) / dcmmDims.length).toFixed(1);
  const pathDone = pathSteps.filter((p) => p.status === '已完成').length;

  const runDcmm = async () => {
    setDcmmRunning(true);
    setTab('dcmm');
    setDcmmDone(false);
    await new Promise((r) => setTimeout(r, 1000));
    setDcmmDone(true);
    setDcmmRunning(false);
    notify('DCMM 评估已刷新：综合成熟度 ' + dcmmAvg + ' 级，差距清单已更新');
  };

  const advanceOrg = (id: string) => {
    const order: ImplOrg['stage'][] = ['资源梳理', '接入', '治理', '验收', '运营'];
    setOrgs((arr) => arr.map((o) => {
      if (o.id !== id) return o;
      const i = order.indexOf(o.stage);
      const next = order[Math.min(i + 1, order.length - 1)];
      return {
        ...o,
        stage: next,
        progress: Math.min(100, o.progress + 12),
        updated: '08-06',
      };
    }));
    notify(`${id} 已推进至下一实施阶段`);
  };

  const submitReview = () => {
    setReviewOpen(false);
    setPlanOk(true);
    setTab('plan');
    notify('制度/规范评审已提交，待治理委员会确认');
  };

  const demoAccept = async () => {
    setDemoing(true);
    setTab('plan'); setPlanOk(true);
    notify('① 组织/制度/规范已就绪，可提交评审');
    await new Promise((r) => setTimeout(r, 400));
    await runDcmm();
    notify('② DCMM 评估与差距清单已输出');
    await new Promise((r) => setTimeout(r, 400));
    setTab('impl');
    const target = orgs.find((o) => o.stage !== '运营') || orgs[0];
    if (target) advanceOrg(target.id);
    setImplOk(true);
    notify('③ 机构实施已推进 · 指标可跟踪');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE SERVICE · A6"
        title="数据治理服务"
        desc="验收：规划制度评审落地 → DCMM 评估 → 按机构实施达标跟踪。"
        actions={
          <>
            <Btn icon="zap" loading={demoing || dcmmRunning} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="activity" loading={dcmmRunning} onClick={runDcmm}>刷新 DCMM</Btn>
            <Btn variant="primary" icon="checkcircle" onClick={() => setReviewOpen(true)}>提交评审</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '规划制度', d: '组织 · 路径 · 规范', on: planOk || tab === 'plan' },
          { n: '02', t: 'DCMM 评估', d: '成熟度 · 差距', on: dcmmDone || tab === 'dcmm' },
          { n: '03', t: '实施跟踪', d: '按机构达标', on: implOk || tab === 'impl' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {implOk ? '实施已跟踪' : dcmmDone && planOk ? '评估就绪' : `路径 ${pathDone}/${pathSteps.length} · 进度 ${avgProgress}%`}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="实施路径" value={`${pathDone}/${pathSteps.length}`} unit="阶段" delta="规划→运营" icon="workflow" tone="blue" onClick={() => setTab('plan')} />
        <StatCard label="DCMM 成熟度" value={dcmmAvg} unit="级" delta={dcmmDone ? '评估已就绪' : '评估中'} icon="chart" tone="violet" onClick={() => setTab('dcmm')} />
        <StatCard label="机构实施" value={String(orgs.length)} unit="家" delta={`均进度 ${avgProgress}%`} icon="building" tone="cyan" onClick={() => setTab('impl')} />
        <StatCard label="质量均值" value={avgQuality} unit="分" delta="接入治理达标" icon="shield" tone="green" onClick={() => go('/collection/qc-results')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'plan', label: '规划与制度', count: pathSteps.length },
          { key: 'dcmm', label: 'DCMM 评估', count: dcmmDims.length },
          { key: 'impl', label: '采集治理实施', count: orgs.length },
        ]}
      />

      {tab === 'plan' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="组织设计" subtitle="治理委员会 · 治理办 · 业务条线 · 运营">
              <div className="gs-org-list">
                {orgRoles.map((r) => (
                  <div key={r.role}>
                    <span className="gs-org-ico"><Icon name="users" size={14} /></span>
                    <div>
                      <strong>{r.role}</strong>
                      <small>{r.unit} · {r.owner}</small>
                      <p>{r.duty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="四类规范编制" subtitle="治理 / 应用 / 安全 / 运营">
              <div className="gs-norm-grid">
                {normTypes.map((n) => (
                  <button key={n.name} type="button" className={`gs-norm tone-${n.tone}`} onClick={() => { setTab('plan'); go('/bid/standard-docs'); }}>
                    <strong>{n.name}</strong>
                    <small>{n.desc}</small>
                  </button>
                ))}
              </div>
              <div className="info-note mt-14">
                <Icon name="file" size={12} />
                <span>含编目规范、病案首页质控规范；点击进入标准文档库查看版本与评审状态。</span>
              </div>
            </Card>
          </div>

          <Card className="mt-14" title="实施路径" subtitle="组织 → 评估 → 标准 → 工程 → 运营">
            <div className="gs-path">
              {pathSteps.map((p, i) => (
                <React.Fragment key={p.id}>
                  <div className={`gs-path-step status-${p.status === '已完成' ? 'done' : p.status === '进行中' ? 'run' : 'idle'}`}>
                    <em>{p.id}</em>
                    <strong>{p.name}</strong>
                    <small>{p.phase} · {p.months}</small>
                    <Badge tone={toneOf(p.status)} dot>{p.status}</Badge>
                    <span className="gs-path-del">{p.deliverable}</span>
                  </div>
                  {i < pathSteps.length - 1 && <Icon name="arrowright" size={14} />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          <Card className="mt-14" title="关联标准文档" subtitle="规划制度交付物" noPad actions={<Btn size="sm" icon="file" onClick={() => go('/bid/standard-docs')}>全部文档</Btn>}>
            <div className="pad-h">
              <DataTable
                rows={standardDocs.slice(0, 6)}
                pageSize={6}
                paginate={false}
                onRowClick={(r) => setActiveDoc(r)}
                columns={[
                  { key: 'id', title: '编号', width: 78, render: (d) => <span className="mono-cell">{d.id}</span> },
                  { key: 'name', title: '标准名称', render: (d) => <div className="cell-main"><strong>{d.name}</strong><small>{d.type} · {d.pages} 页</small></div> },
                  { key: 'version', title: '版本', width: 70, render: (d) => <Badge tone="slate">{d.version}</Badge> },
                  { key: 'status', title: '状态', width: 80, render: (d) => <Badge tone={toneOf(d.status)} dot>{d.status}</Badge> },
                  { key: 'owner', title: '归口', width: 90 },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'dcmm' && (
        <>
          <Card className="mt-14" title="DCMM 成熟度评估" subtitle="八域能力 · 现状 vs 目标" actions={
            <Btn size="sm" icon="refresh" loading={dcmmRunning} onClick={runDcmm}>重新评估</Btn>
          }>
            <div className="gs-dcmm-grid">
              {dcmmDims.map((d) => (
                <div key={d.key} className="gs-dcmm-card">
                  <div className="gs-dcmm-head">
                    <strong>{d.name}</strong>
                    <em>L{d.level}<span>/L{d.target}</span></em>
                  </div>
                  <Progress value={(d.level / 5) * 100} tone={d.level >= d.target ? 'green' : 'violet'} height={6} />
                  <small>{d.gap}</small>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="差距清单（优先）" subtitle="未达目标域">
              <div className="gs-gap-list">
                {dcmmDims.filter((d) => d.level < d.target).map((d, i) => (
                  <div key={d.key}>
                    <em>G{i + 1}</em>
                    <div>
                      <strong>{d.name} L{d.level}→L{d.target}</strong>
                      <small>{d.gap}</small>
                    </div>
                    <Badge tone="amber">改进中</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="评估结论" subtitle="可汇报纪要">
              <KeyValue
                cols={1}
                items={[
                  { label: '综合成熟度', value: `${dcmmAvg} 级（目标提升至 3.6+）` },
                  { label: '优势域', value: '数据标准已达 L4；生存周期达标' },
                  { label: '短板域', value: '数据应用 L2；质量/安全待升至 L4' },
                  { label: '下一步', value: '结合实施路径 P3/P4，以机构接入质量考核拉动成熟度' },
                ]}
              />
              <Btn className="mt-14 w-full" variant="secondary" icon="download" onClick={() => notify('DCMM 评估报告已导出（PDF）')}>导出评估报告</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'impl' && (
        <>
          <Card className="mt-14" title="实施工作流" subtitle="资源梳理 · 接入 · 元数据/标准/质量/清洗/建模/归集/主题库 · 运营">
            <div className="gs-ws-grid">
              {workstreams.map((w) => (
                <div key={w.id} className="gs-ws">
                  <div className="gs-ws-head">
                    <Badge tone={toneOf(w.status)} dot>{w.status}</Badge>
                    <span className="muted xs">{w.domain}</span>
                  </div>
                  <strong>{w.name}</strong>
                  <small>{w.orgs} 家机构 · {w.kpi}</small>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="mt-14"
            title="机构实施跟踪"
            subtitle="验收：按机构完成接入与治理，指标达标"
            noPad
            actions={
              <div className="filter-bar">
                <SearchInput value={q} onChange={setQ} placeholder="搜索机构" width={160} />
                <Select value={stage} onChange={setStage} options={['', '资源梳理', '接入', '治理', '验收', '运营']} placeholder="全部阶段" width={120} />
              </div>
            }
          >
            <div className="pad-h">
              <DataTable
                rows={filteredOrgs}
                pageSize={6}
                onRowClick={(r) => setActiveOrg(r)}
                columns={[
                  { key: 'name', title: '机构', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.type}</small></div> },
                  { key: 'stage', title: '阶段', width: 90, render: (r) => <Badge tone={toneOf(r.stage)}>{r.stage}</Badge> },
                  {
                    key: 'progress', title: '进度', width: 140,
                    render: (r) => (
                      <div className="quality-cell">
                        <Progress value={r.progress} tone={r.progress >= 90 ? 'green' : r.progress >= 60 ? 'blue' : 'amber'} />
                        <span>{r.progress}%</span>
                      </div>
                    ),
                  },
                  { key: 'tables', title: '接入表', width: 80, align: 'right' },
                  { key: 'quality', title: '质量分', width: 80, align: 'right', render: (r) => <span className="strong text-green">{r.quality}</span> },
                  { key: 'owner', title: '负责人', width: 70 },
                  {
                    key: 'ops', title: '操作', width: 100,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="link-btn" onClick={() => setActiveOrg(r)}>详情</button>
                        <button type="button" className="link-muted" onClick={() => advanceOrg(r.id)} disabled={r.stage === '运营'}>推进</button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      <Drawer
        open={!!activeOrg}
        onClose={() => setActiveOrg(null)}
        width={520}
        title={activeOrg?.name || ''}
        desc={activeOrg ? `${activeOrg.id} · ${activeOrg.type}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveOrg(null)}>关闭</Btn>
            <Btn icon="activity" onClick={() => go('/collection/data-channel')}>查看通道</Btn>
            <Btn variant="primary" onClick={() => activeOrg && advanceOrg(activeOrg.id)} disabled={activeOrg?.stage === '运营'}>推进阶段</Btn>
          </>
        }
      >
        {activeOrg && (
          <>
            <div className="drawer-summary">
              <div><span>进度</span><strong>{activeOrg.progress}%</strong></div>
              <div><span>质量分</span><strong className="text-green">{activeOrg.quality}</strong></div>
              <div><span>接入表</span><strong>{activeOrg.tables}</strong></div>
              <div><span>阶段</span><strong className="sm">{activeOrg.stage}</strong></div>
            </div>
            <KeyValue
              className="mt-14"
              cols={2}
              items={[
                { label: '负责人', value: activeOrg.owner },
                { label: '更新', value: `2026-${activeOrg.updated}` },
                { label: '实施要点', value: '资源梳理 → CDC/离线接入 → 标化对码 → 五维质控 → 主题归集 → 验收运营', wide: true },
                { label: '达标口径', value: '接入表完成、质量分 ≥95、对账差异 <0.5%、问题闭环率 ≥90%', wide: true },
              ]}
            />
          </>
        )}
      </Drawer>

      <Drawer
        open={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        width={480}
        title={activeDoc?.name || ''}
        desc={activeDoc ? `${activeDoc.id} · ${activeDoc.version}` : ''}
        footer={<><Btn onClick={() => setActiveDoc(null)}>关闭</Btn><Btn variant="primary" onClick={() => go('/bid/standard-docs')}>打开标准库</Btn></>}
      >
        {activeDoc && (
          <KeyValue
            cols={2}
            items={[
              { label: '类型', value: activeDoc.type },
              { label: '状态', value: activeDoc.status },
              { label: '归口', value: activeDoc.owner },
              { label: '更新', value: activeDoc.updated },
              { label: '页数', value: `${activeDoc.pages} 页` },
            ]}
          />
        )}
      </Drawer>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="提交治理制度评审"
        desc="组织、制度、规范通过评审并落地（A6-01 验收）"
        width={520}
        footer={<><Btn onClick={() => setReviewOpen(false)}>取消</Btn><Btn variant="primary" onClick={submitReview}>提交评审</Btn></>}
      >
        <div className="form-grid">
          <Field label="评审主题" required className="span-2">
            <input className="input" defaultValue="两江新区数据治理章程与四类规范（2026）" />
          </Field>
          <Field label="评审机构"><Select value="治理委员会" onChange={() => {}} options={['治理委员会', '卫健局办公会', '信息中心']} /></Field>
          <Field label="关联路径"><Select value="P3 编目与规范编制" onChange={() => {}} options={pathSteps.map((p) => `${p.id} ${p.name}`)} /></Field>
          <Field label="说明" className="span-2">
            <textarea className="textarea" rows={3} defaultValue="含组织设计、DCMM 差距改进计划、12 类标准与病案首页质控规范，请委员审议后发布。" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
