'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { knowledgeDocs, scoreDimensions } from '../../dataBid';

type TabKey = 'rules' | 'rootcause' | 'report';
type RuleStatus = '待确认' | '已确认' | '已驳回' | '已下发';

type AdaptiveRule = {
  id: string;
  text: string;
  dim: string;
  source: string;
  clause: string;
  confidence: number;
  status: RuleStatus;
  adaptive: string;
  impact: number;
};

type RootCause = {
  id: string;
  pattern: string;
  dim: string;
  count: number;
  summary: string;
  evidence: string[];
  priority: 'P1' | 'P2' | 'P3';
  owner: string;
};

type ReportTrace = {
  id: string;
  title: string;
  period: string;
  dims: string;
  pushed: string;
  channels: string;
  by: string;
  at: string;
};

const seedRules: AdaptiveRule[] = [
  {
    id: 'AR-01', text: '出院诊断须与病程主诊断一致，冲突时标记待人工',
    dim: '一致性', source: '电子病历质控规范（2026 版）', clause: '§4.2.1',
    confidence: 96, status: '待确认', adaptive: '近 7 日冲突率 1.8% → 建议收紧阈值', impact: 128,
  },
  {
    id: 'AR-02', text: '血钾 ≥6.5 mmol/L 时报告结论不得写「大致正常」',
    dim: '合规性', source: '检验结果逻辑校验规则集', clause: '§2.1',
    confidence: 94, status: '待确认', adaptive: '危急值模板命中上升，自适应提升权重 +5%', impact: 46,
  },
  {
    id: 'AR-03', text: '门诊记录须在开单后 15 分钟内入仓',
    dim: '及时性', source: '数据采集规范 V2.3', clause: '§6.3',
    confidence: 91, status: '已确认', adaptive: 'CDC lag P99 超 5s 时自动降为告警', impact: 86,
  },
  {
    id: 'AR-04', text: '身份证号校验位错误时分流至异常表并通知源端',
    dim: '规范性', source: '病案首页填写说明', clause: '§3.4',
    confidence: 88, status: '已下发', adaptive: '抽样误报率 <0.3%，维持当前规则', impact: 24,
  },
  {
    id: 'AR-05', text: '影像所见阳性结节时结论不得「未见异常」',
    dim: '逻辑性', source: '医学影像报告质控要点', clause: '§1.5',
    confidence: 89, status: '待确认', adaptive: 'LLM 极性冲突簇新增，建议入库', impact: 74,
  },
];

const seedRoots: RootCause[] = [
  {
    id: 'RC-01', pattern: '诊断编码与病程主诉不一致', dim: '一致性', count: 128,
    summary: '结构化录入滞后于病程书写，模板默认值覆盖主诊断。',
    evidence: ['LLM 抽取主诊断 ≠ 首页编码', '冲突集中在出院 24h 内补录', '3 家机构占比 68%'],
    priority: 'P1', owner: '病案室',
  },
  {
    id: 'RC-02', pattern: '危急值结论用语不当', dim: '合规性', count: 46,
    summary: '报告模板未强制危急值话术，检验科自由文本仍可覆盖。',
    evidence: ['规则库命中 K+≥6.5', '结论字段含「正常」', '通知记录存在但结论未改'],
    priority: 'P1', owner: '检验科',
  },
  {
    id: 'RC-03', pattern: '门诊入仓超时', dim: '及时性', count: 86,
    summary: 'CDC 调度间隔与源库高峰冲突，导致 P99 延迟升高。',
    evidence: ['通道 lag 峰值 12s', '高峰 10:00–11:30', '人和/鸳鸯社卫集中'],
    priority: 'P2', owner: '信息中心',
  },
  {
    id: 'RC-04', pattern: '科室编码未入对码表', dim: '一致性', count: 36,
    summary: '本地科室码新增未同步维度，导致 DWD 关联失败。',
    evidence: ['dept_code=99XX', 'dim_department 无匹配', '近 3 日新增 3 码'],
    priority: 'P2', owner: '数据治理办',
  },
];

const seedTraces: ReportTrace[] = [
  { id: 'RPT-20260806', title: '8 月 6 日智能质控日报', period: '2026-08-06', dims: '五维全量', pushed: '已推送', channels: '企微+站内信', by: '系统自动', at: '08-06 18:00' },
  { id: 'RPT-20260805', title: '8 月 5 日智能质控日报', period: '2026-08-05', dims: '五维全量', pushed: '已推送', channels: '企微', by: '系统自动', at: '08-05 18:00' },
  { id: 'RPT-20260801', title: '7 月质量月报（智能摘要）', period: '2026-07', dims: '机构×维度', pushed: '已推送', channels: '企微+邮件', by: '张敏', at: '08-01 09:12' },
];

const toneOf = (s: string) => {
  if (['已确认', '已下发', '已推送', 'P3'].includes(s)) return 'green';
  if (['待确认', 'P2', '处理中'].includes(s)) return 'amber';
  if (['已驳回', 'P1', '高'].includes(s)) return 'red';
  return 'slate';
};

/** A5-05 自适应规则 / 智能报告 */
export function AdaptiveRulesHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('rules');
  const [rules, setRules] = useState(seedRules);
  const [docName, setDocName] = useState(knowledgeDocs[0].name);
  const [parsing, setParsing] = useState(false);
  const [q, setQ] = useState('');
  const [dim, setDim] = useState('');
  const [activeRule, setActiveRule] = useState<AdaptiveRule | null>(null);
  const [activeRoot, setActiveRoot] = useState<RootCause | null>(seedRoots[0]);
  const [activeReport, setActiveReport] = useState<ReportTrace | null>(null);
  const [genReport, setGenReport] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [traces, setTraces] = useState(seedTraces);
  const [reportNote, setReportNote] = useState('聚焦 P1 根因与待确认规则，推送治理办与机构信息科。');

  const doc = knowledgeDocs.find((d) => d.name === docName) || knowledgeDocs[0];

  const filteredRules = useMemo(() => rules.filter((r) =>
    (!dim || r.dim === dim)
    && (r.id + r.text + r.source).toLowerCase().includes(q.toLowerCase())
  ), [rules, dim, q]);

  const pending = rules.filter((r) => r.status === '待确认').length;
  const confirmed = rules.filter((r) => r.status === '已确认' || r.status === '已下发').length;

  const parseGuide = async () => {
    setParsing(true);
    setTab('rules');
    await new Promise((r) => setTimeout(r, 1100));
    const id = `AR-${String(rules.length + 1).padStart(2, '0')}`;
    setRules((arr) => [
      {
        id,
        text: '随访记录须在出院后 7 日内回写，缺失则触发整改工单',
        dim: '完整性',
        source: doc.name,
        clause: '§自适应抽取',
        confidence: 92,
        status: '待确认',
        adaptive: '随访缺失簇周环比 +14%，建议新增规则',
        impact: 58,
      },
      ...arr,
    ]);
    setParsing(false);
    notify(`已从「${doc.name}」解析生成候选规则 ${id}，请人工确认`);
  };

  const confirmRule = (id: string, ok: boolean) => {
    setRules((arr) => arr.map((r) => (
      r.id === id ? { ...r, status: ok ? '已确认' : '已驳回' } : r
    )));
    notify(ok ? `${id} 已人工确认，可下发质控` : `${id} 已驳回`);
    if (activeRule?.id === id) {
      setActiveRule((a) => (a ? { ...a, status: ok ? '已确认' : '已驳回' } : a));
    }
  };

  const deployRule = (id: string) => {
    setRules((arr) => arr.map((r) => (r.id === id ? { ...r, status: '已下发' } : r)));
    notify(`${id} 已下发至质控流程编排`);
  };

  const generateReport = async () => {
    setGenReport(true);
    setTab('report');
    await new Promise((r) => setTimeout(r, 900));
    const id = `RPT-${Date.now().toString().slice(-8)}`;
    const row: ReportTrace = {
      id,
      title: '智能质控即时报告',
      period: '2026-08-06 即时',
      dims: dim || '五维全量',
      pushed: '未推送',
      channels: '—',
      by: '演示账号',
      at: new Date().toLocaleString('zh-CN', { hour12: false }).slice(5, 16).replace('/', '-'),
    };
    setTraces((arr) => [row, ...arr]);
    setActiveReport(row);
    setGenReport(false);
    notify(`${id} 已生成 · 含根因摘要与整改优先级，可追溯`);
  };

  const pushReport = async () => {
    if (!activeReport && !traces[0]) {
      notify('请先生成报告', 'info');
      return;
    }
    setPushing(true);
    await new Promise((r) => setTimeout(r, 700));
    const target = activeReport || traces[0];
    setTraces((arr) => arr.map((t) => (
      t.id === target.id ? { ...t, pushed: '已推送', channels: '企微+站内信+短信' } : t
    )));
    setActiveReport((a) => (a && a.id === target.id ? { ...a, pushed: '已推送', channels: '企微+站内信+短信' } : a));
    setPushing(false);
    notify(`${target.id} 已推送 · 审计已落库`);
  };

  return (
    <>
      <PageHeader
        eyebrow="ADAPTIVE RULES · SMART REPORT · A5-05"
        title="自适应规则 / 智能报告"
        desc="LLM 解析指南生成规则 · 人工确认后下发 · 自动根因摘要 · 多维报告与整改优先级 · 消息推送可追溯。"
        actions={
          <>
            <Btn icon="dashboard" onClick={() => go('/collection/qc-governance')}>★ 治理大屏</Btn>
            <Btn icon="book" onClick={() => go('/collection/qc-governance')}>知识库</Btn>
            <Btn icon="sparkles" loading={parsing} onClick={parseGuide}>解析指南</Btn>
            <Btn variant="primary" icon="file" loading={genReport} onClick={generateReport}>生成智能报告</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '规则建议', d: 'LLM 生成 · 人工确认' },
          { n: '02', t: '根因摘要', d: '自动聚类 · 证据链' },
          { n: '03', t: '报告追溯', d: '多维报告 · 推送留痕' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'rules' : i === 1 ? 'rootcause' : 'report') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 待确认 {pending} · 已确认 {confirmed}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="候选规则" value={String(rules.length)} unit="条" delta={`待确认 ${pending}`} icon="sparkles" tone="violet" onClick={() => setTab('rules')} />
        <StatCard label="根因簇" value={String(seedRoots.length)} unit="个" delta="自动摘要" icon="git" tone="amber" onClick={() => setTab('rootcause')} />
        <StatCard label="可追溯报告" value={String(traces.length)} unit="份" delta="推送留痕" icon="file" tone="blue" onClick={() => setTab('report')} />
        <StatCard label="自适应调整" value="3" unit="项" delta="阈值/权重/告警" icon="sliders" tone="green" />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'rules', label: '自适应规则', count: pending },
          { key: 'rootcause', label: '根因摘要', count: seedRoots.length },
          { key: 'report', label: '智能报告', count: traces.length },
        ]}
      />

      {tab === 'rules' && (
        <>
          <Card className="mt-14" title="指南解析 → 规则建议" subtitle="验收：规则建议可人工确认">
            <div className="ar-parse-bar">
              <Field label="指南文档">
                <Select
                  value={docName}
                  onChange={setDocName}
                  options={knowledgeDocs.map((d) => d.name)}
                  width={280}
                />
              </Field>
              <div className="ar-doc-meta">
                <Badge tone="blue">本地模型 Qwen2.5-14B</Badge>
                <span className="muted xs">{doc.name} · {doc.version}</span>
              </div>
              <Btn variant="primary" icon="sparkles" loading={parsing} onClick={parseGuide}>LLM 解析生成</Btn>
            </div>
            <div className="ar-pipe mt-14">
              {['读取指南条款', '实体/约束抽取', '生成候选规则', '自适应阈值', '人工确认'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`ar-pipe-node ${parsing && i < 4 ? 'is-run' : ''}`}>
                    <em>0{i + 1}</em>
                    <strong>{s}</strong>
                  </div>
                  {i < 4 && <Icon name="arrowright" size={12} />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          <Card
            className="mt-14"
            title="候选规则清单"
            subtitle="确认后可下发质控；驳回保留审计"
            noPad
            actions={
              <div className="filter-bar">
                <SearchInput value={q} onChange={setQ} placeholder="搜索规则" width={180} />
                <Select value={dim} onChange={setDim} options={['', '完整性', '一致性', '规范性', '及时性', '合规性', '逻辑性']} placeholder="全部维度" width={110} />
              </div>
            }
          >
            <div className="pad-h">
              <DataTable
                rows={filteredRules}
                pageSize={6}
                onRowClick={(r) => setActiveRule(r)}
                columns={[
                  { key: 'id', title: '编号', width: 72, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'text', title: '规则建议', render: (r) => <div className="cell-main"><strong>{r.text}</strong><small>{r.source} · {r.clause} · 自适应：{r.adaptive}</small></div> },
                  { key: 'dim', title: '维度', width: 72, render: (r) => <Badge tone="slate">{r.dim}</Badge> },
                  { key: 'confidence', title: '置信度', width: 80, align: 'right', render: (r) => `${r.confidence}%` },
                  { key: 'status', title: '状态', width: 84, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  {
                    key: 'ops', title: '操作', width: 160,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        {r.status === '待确认' && (
                          <>
                            <button type="button" className="link-btn" onClick={() => confirmRule(r.id, true)}>确认</button>
                            <button type="button" className="link-muted" onClick={() => confirmRule(r.id, false)}>驳回</button>
                          </>
                        )}
                        {r.status === '已确认' && (
                          <button type="button" className="link-btn" onClick={() => deployRule(r.id)}>下发</button>
                        )}
                        {r.status === '已下发' && (
                          <button type="button" className="link-muted" onClick={() => go('/collection/qc-designer')}>查看流程</button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'rootcause' && (
        <div className="ar-root-layout mt-14">
          <Card title="自动根因摘要" subtitle="异常聚类 → LLM 摘要 → 整改优先级" noPad>
            <div className="ar-root-list">
              {seedRoots.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`ar-root-item ${activeRoot?.id === r.id ? 'is-on' : ''}`}
                  onClick={() => setActiveRoot(r)}
                >
                  <Badge tone={toneOf(r.priority)}>{r.priority}</Badge>
                  <div>
                    <strong>{r.pattern}</strong>
                    <small>{r.dim} · {r.count} 次 · {r.owner}</small>
                  </div>
                  <Icon name="chevronright" size={12} />
                </button>
              ))}
            </div>
          </Card>
          <Card title="摘要详情" subtitle={activeRoot?.id || ''}>
            {activeRoot && (
              <>
                <div className="drawer-summary">
                  <div><span>优先级</span><strong>{activeRoot.priority}</strong></div>
                  <div><span>命中次数</span><strong className="text-amber">{activeRoot.count}</strong></div>
                  <div><span>维度</span><strong>{activeRoot.dim}</strong></div>
                  <div><span>责任方</span><strong className="sm">{activeRoot.owner}</strong></div>
                </div>
                <div className="section-title-sm mt-14">根因摘要</div>
                <p className="ar-summary">{activeRoot.summary}</p>
                <div className="section-title-sm mt-14">证据链</div>
                <ul className="ar-evidence">
                  {activeRoot.evidence.map((e) => <li key={e}>{e}</li>)}
                </ul>
                <div className="row-actions mt-14">
                  <Btn size="sm" icon="bell" onClick={() => notify(`已推送整改任务给 ${activeRoot.owner}`)}>推送整改</Btn>
                  <Btn size="sm" icon="dashboard" onClick={() => go('/collection/qc-governance')}>转问题工单</Btn>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === 'report' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="多维质量报告" subtitle="通过率 · 五维 · 趋势" actions={<Badge tone="violet">智能摘要</Badge>}>
              <div className="ar-report-kpis">
                <div><span>综合得分</span><strong>96.7</strong></div>
                <div><span>待确认规则</span><strong className="text-amber">{pending}</strong></div>
                <div><span>P1 根因</span><strong className="text-red">{seedRoots.filter((r) => r.priority === 'P1').length}</strong></div>
                <div><span>已下发规则</span><strong className="text-green">{rules.filter((r) => r.status === '已下发').length}</strong></div>
              </div>
              <div className="grid grid-2 mt-14">
                <AreaChart
                  data={[
                    { label: '03', value: 94.2 }, { label: '04', value: 95.0 }, { label: '05', value: 94.6 },
                    { label: '06', value: 95.8 }, { label: '07', value: 96.2 }, { label: '08', value: 96.7 },
                  ]}
                  height={140}
                  color="#6755F5"
                  suffix=" 分"
                  valueName="得分"
                  domainMin={90}
                  domainMax={100}
                />
                <Donut
                  size={120}
                  thickness={11}
                  centerValue="96.7"
                  label="综合"
                  segments={scoreDimensions.map((d) => ({ label: d.name, value: d.score, color: d.color }))}
                />
              </div>
              <div className="section-title-sm mt-14">整改优先级</div>
              <div className="ar-prio mt-10">
                {seedRoots.map((r, i) => (
                  <div key={r.id}>
                    <em>{r.priority}</em>
                    <div><strong>{r.pattern}</strong><small>{r.owner} · 影响 {r.count}</small></div>
                    <Progress value={100 - i * 18} tone={r.priority === 'P1' ? 'red' : 'amber'} height={5} />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="消息推送" subtitle="推送前可编辑说明 · 留痕可追溯">
              <Field label="推送说明">
                <textarea className="textarea" rows={4} value={reportNote} onChange={(e) => setReportNote(e.target.value)} />
              </Field>
              <Field label="渠道" className="mt-10">
                <Select value="企微 + 站内信 + 短信" onChange={() => {}} options={['企微 + 站内信 + 短信', '仅企微', '企微 + 邮件']} />
              </Field>
              <div className="row-actions mt-14">
                <Btn icon="file" loading={genReport} onClick={generateReport}>生成报告</Btn>
                <Btn variant="primary" icon="bell" loading={pushing} onClick={pushReport}>推送并留痕</Btn>
              </div>
              <div className="info-note mt-14">
                <Icon name="shield" size={12} />
                <span>验收：报告可追溯 — 每份报告保留生成人、时间、渠道与内容哈希。</span>
              </div>
            </Card>
          </div>

          <Card className="mt-14" title="报告追溯台账" subtitle="生成 → 推送 → 审计" noPad>
            <div className="pad-h">
              <DataTable
                rows={traces}
                pageSize={5}
                onRowClick={(r) => setActiveReport(r)}
                columns={[
                  { key: 'id', title: '报告ID', width: 120, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'title', title: '标题', render: (r) => <div className="cell-main"><strong>{r.title}</strong><small>{r.period} · {r.dims}</small></div> },
                  { key: 'pushed', title: '推送', width: 80, render: (r) => <Badge tone={toneOf(r.pushed)} dot>{r.pushed}</Badge> },
                  { key: 'channels', title: '渠道', width: 120 },
                  { key: 'by', title: '生成人', width: 80 },
                  { key: 'at', title: '时间', width: 100, render: (r) => <span className="muted">{r.at}</span> },
                  {
                    key: 'ops', title: '操作', width: 72,
                    render: (r) => <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); setActiveReport(r); }}>追溯</button>,
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      <Drawer
        open={!!activeRule}
        onClose={() => setActiveRule(null)}
        width={560}
        title={activeRule?.id || ''}
        desc={activeRule ? `${activeRule.source} · ${activeRule.clause}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveRule(null)}>关闭</Btn>
            {activeRule?.status === '待确认' && (
              <>
                <Btn onClick={() => activeRule && confirmRule(activeRule.id, false)}>驳回</Btn>
                <Btn variant="primary" onClick={() => activeRule && confirmRule(activeRule.id, true)}>人工确认</Btn>
              </>
            )}
            {activeRule?.status === '已确认' && (
              <Btn variant="primary" onClick={() => activeRule && deployRule(activeRule.id)}>下发质控</Btn>
            )}
          </>
        }
      >
        {activeRule && (
          <>
            <div className="drawer-summary">
              <div><span>置信度</span><strong>{activeRule.confidence}%</strong></div>
              <div><span>影响行</span><strong className="text-amber">{activeRule.impact}</strong></div>
              <div><span>维度</span><strong>{activeRule.dim}</strong></div>
              <div><span>状态</span><strong className="sm">{activeRule.status}</strong></div>
            </div>
            <KeyValue
              className="mt-14"
              cols={1}
              items={[
                { label: '规则内容', value: activeRule.text },
                { label: '自适应说明', value: activeRule.adaptive },
                { label: '来源条款', value: `${activeRule.source} ${activeRule.clause}` },
                { label: '确认策略', value: 'AI 只生成候选；发布前必须人工确认（验收点）。' },
              ]}
            />
          </>
        )}
      </Drawer>

      <Drawer
        open={!!activeReport}
        onClose={() => setActiveReport(null)}
        width={520}
        title={activeReport?.title || ''}
        desc={activeReport?.id || ''}
        footer={
          <>
            <Btn onClick={() => setActiveReport(null)}>关闭</Btn>
            <Btn variant="primary" icon="bell" loading={pushing} onClick={pushReport}>再次推送</Btn>
          </>
        }
      >
        {activeReport && (
          <KeyValue
            cols={2}
            items={[
              { label: '报告ID', value: activeReport.id },
              { label: '周期', value: activeReport.period },
              { label: '维度范围', value: activeReport.dims },
              { label: '推送状态', value: <Badge tone={toneOf(activeReport.pushed)}>{activeReport.pushed}</Badge> },
              { label: '渠道', value: activeReport.channels },
              { label: '生成人', value: activeReport.by },
              { label: '生成时间', value: activeReport.at },
              { label: '内容摘要', value: reportNote, wide: true },
              { label: '追溯哈希', value: `sha256:${activeReport.id.toLowerCase()}…demo`, wide: true },
            ]}
          />
        )}
      </Drawer>
    </>
  );
}
