'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { aiRules, knowledgeDocs, scoreDimensions } from '../../dataBid';

type TabKey = 'issues' | 'knowledge' | 'screen';
type IssueStatus = '待分派' | '处理中' | '待复核' | '已闭环';
type IssueLevel = '高' | '中' | '低';

type Issue = {
  id: string;
  title: string;
  category: string;
  org: string;
  dim: string;
  level: IssueLevel;
  status: IssueStatus;
  owner: string;
  sla: string;
  created: string;
  root: string;
};

type KbRule = {
  id: string;
  text: string;
  source: string;
  confidence: number;
  status: '待审核' | '已采纳' | '已用于质控' | '已驳回';
};

const issuesSeed: Issue[] = [
  { id: 'IQ-1208', title: '患者主键缺失批量异常', category: '完整性', org: '两江新区人民医院', dim: '完整性', level: '高', status: '待分派', owner: '—', sla: '4h', created: '08-06 14:21', root: '源端接口未强制主键' },
  { id: 'IQ-1207', title: '检验危急值结论冲突', category: '合规性', org: '两江新区中医院', dim: '一致性', level: '高', status: '处理中', owner: '李倩', sla: '8h', created: '08-06 13:40', root: '报告模板未绑定危急值话术' },
  { id: 'IQ-1206', title: '科室编码无法关联维度', category: '一致性', org: '人和社区卫生服务中心', dim: '一致性', level: '中', status: '待复核', owner: '王磊', sla: '24h', created: '08-06 12:15', root: '本地科室码未入对码表' },
  { id: 'IQ-1205', title: '门诊记录入仓超时', category: '及时性', org: '鸳鸯社区卫生服务中心', dim: '及时性', level: '中', status: '处理中', owner: '张敏', sla: '12h', created: '08-06 11:50', root: 'CDC 延迟 / 调度间隔过大' },
  { id: 'IQ-1204', title: '身份证校验位错误', category: '规范性', org: '大竹林社区卫生服务中心', dim: '规范性', level: '高', status: '待分派', owner: '—', sla: '4h', created: '08-06 11:10', root: 'OCR / 手工录入误差' },
  { id: 'IQ-1203', title: '接口连续失败超阈值', category: '稳定性', org: '两江新区人民医院', dim: '稳定性', level: '高', status: '已闭环', owner: '运维值班', sla: '2h', created: '08-05 22:08', root: '源库连接池耗尽，已扩容' },
  { id: 'IQ-1202', title: '随访记录缺失', category: '完整性', org: '两江新区中医院', dim: '完整性', level: '中', status: '已闭环', owner: '李倩', sla: '24h', created: '08-05 16:20', root: '公卫系统未回写' },
  { id: 'IQ-1201', title: '诊断编码非国标', category: '规范性', org: '人和社区卫生服务中心', dim: '规范性', level: '低', status: '待复核', owner: '赵倩', sla: '48h', created: '08-05 15:02', root: '临时编码未映射 ICD' },
];

const screenWidgets = [
  { id: 'W01', name: '综合质量得分', kind: 'KPI', icon: 'chart' },
  { id: 'W02', name: '通过率趋势', kind: '趋势', icon: 'activity' },
  { id: 'W03', name: '待处理问题', kind: '清单', icon: 'circlealert' },
  { id: 'W04', name: '机构排名', kind: '排名', icon: 'building' },
  { id: 'W05', name: '五维质量分布', kind: '分布', icon: 'target' },
  { id: 'W06', name: '规则命中', kind: 'KPI', icon: 'shield' },
  { id: 'W07', name: '异常热力', kind: '热力', icon: 'layers' },
  { id: 'W08', name: '闭环时效', kind: '时效', icon: 'clock' },
  { id: 'W09', name: '消息推送', kind: '通知', icon: 'bell' },
  { id: 'W10', name: '知识库覆盖', kind: '覆盖', icon: 'book' },
  { id: 'W11', name: '分层质量 ODS→ADS', kind: '分层', icon: 'git' },
  { id: 'W12', name: '整改优先级', kind: '优先级', icon: 'listfilter' },
  { id: 'W13', name: '实时告警滚动', kind: '告警', icon: 'zap' },
] as const;

const notices = [
  { t: '14:21', m: 'IQ-1208 已推送至两江新区人民医院信息科', ch: '企微' },
  { t: '14:05', m: '日质控报告已生成，抄送治理办', ch: '站内信' },
  { t: '13:48', m: '危急值规则命中上升，建议复核模板', ch: '短信' },
  { t: '12:30', m: '人和社卫科室对码缺口 3 个', ch: '企微' },
];

const toneOf = (s: string) => {
  if (['已闭环', '已采纳', '已用于质控', '通过'].includes(s)) return 'green';
  if (['处理中', '待复核', '待审核', '中'].includes(s)) return 'amber';
  if (['待分派', '高', '已驳回'].includes(s)) return 'red';
  return 'slate';
};

/** A5-07 ★ 问题管理 / 知识库 / 治理大屏 */
export function QCGovernanceHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('issues');
  const [issues, setIssues] = useState(issuesSeed);
  const [cat, setCat] = useState('');
  const [st, setSt] = useState('');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Issue | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState('李倩');

  const [docs] = useState(knowledgeDocs);
  const [selectedDoc, setSelectedDoc] = useState(knowledgeDocs[0]);
  const [rules, setRules] = useState<KbRule[]>(aiRules.map((r) => ({ ...r, status: r.status as KbRule['status'] })));
  const [extracting, setExtracting] = useState(false);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [kbQ, setKbQ] = useState('');

  const [screenFocus, setScreenFocus] = useState<string>('W01');
  const [pushing, setPushing] = useState(false);

  const filteredIssues = useMemo(() => issues.filter((i) =>
    (!cat || i.category === cat)
    && (!st || i.status === st)
    && (i.id + i.title + i.org + i.root).toLowerCase().includes(q.toLowerCase())
  ), [issues, cat, st, q]);

  const stats = useMemo(() => {
    const open = issues.filter((i) => i.status !== '已闭环').length;
    const high = issues.filter((i) => i.level === '高' && i.status !== '已闭环').length;
    const closed = issues.filter((i) => i.status === '已闭环').length;
    const rate = Math.round((closed / issues.length) * 100);
    return { open, high, closed, rate };
  }, [issues]);

  const usedInQc = rules.filter((r) => r.status === '已用于质控').length;

  const extract = () => {
    setExtracting(true);
    setTab('knowledge');
    window.setTimeout(() => {
      setExtracting(false);
      setRules((arr) => [
        {
          id: `AI-${String(arr.length + 1).padStart(3, '0')}`,
          text: '影像所见存在阳性结节时，结论不得表述为「未见异常」',
          source: `${selectedDoc.name} · 自动抽取`,
          confidence: 91,
          status: '待审核',
        },
        ...arr,
      ]);
      notify('AI 已从指南抽取候选规则，请人工复核后用于质控');
    }, 1000);
  };

  const adoptToQc = (id: string) => {
    setRules((arr) => arr.map((r) => (r.id === id ? { ...r, status: '已用于质控' } : r)));
    notify(`${id} 已写入质控规则库并挂到流程编排`);
  };

  const closeLoop = (id: string) => {
    setIssues((arr) => arr.map((i) => (i.id === id ? { ...i, status: '已闭环' } : i)));
    notify(`${id} 已闭环 · 通知已回执`);
    setActive(null);
  };

  const assignIssue = () => {
    if (!active) return;
    setIssues((arr) => arr.map((i) => (i.id === active.id ? { ...i, status: '处理中', owner: assignee } : i)));
    setAssignOpen(false);
    notify(`${active.id} 已分派给 ${assignee}，企微通知已发送`);
    setActive((a) => (a ? { ...a, status: '处理中', owner: assignee } : a));
  };

  const pushDigest = async () => {
    setPushing(true);
    setTab('screen');
    await new Promise((r) => setTimeout(r, 700));
    setPushing(false);
    notify('治理日报已推送：企微 42 人 · 站内信 18 人 · 短信 6 人');
  };

  const addManualRule = () => {
    if (!newRuleText.trim()) return;
    const id = `KB-R${String(rules.length + 1).padStart(3, '0')}`;
    setRules((arr) => [
      { id, text: newRuleText.trim(), source: `${selectedDoc.name} · 手工录入`, confidence: 100, status: '已采纳' },
      ...arr,
    ]);
    setNewRuleOpen(false);
    setNewRuleText('');
    notify(`${id} 已新增，可一键用于质控`);
  };

  const docRows = useMemo(() => docs.filter((d) =>
    (d.name + d.type + d.owner).toLowerCase().includes(kbQ.toLowerCase())
  ), [docs, kbQ]);

  return (
    <>
      <PageHeader
        eyebrow="QC GOVERNANCE · A5-07"
        title="问题管理 / 知识库 / 治理大屏"
        desc="问题汇聚与处置闭环 · 质控知识库新增规则并用于质控 · 治理大屏 13 类组件可演示。"
        actions={
          <>
            <Btn icon="shield" onClick={() => go('/collection/qc-results')}>★ 结果统计</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/qc-designer')}>★ 质控流程</Btn>
            <Btn icon="sparkles" loading={extracting} onClick={extract}>AI 规则抽取</Btn>
            <Btn variant="primary" icon="bell" loading={pushing} onClick={pushDigest}>推送治理日报</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '问题闭环', d: '汇聚 · 分派 · 复核 · 闭环' },
          { n: '02', t: '知识库规则', d: '新增并用于质控' },
          { n: '03', t: '治理大屏', d: '13 类组件可演示' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'issues' : i === 1 ? 'knowledge' : 'screen') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 知识规则用于质控 {usedInQc} 条</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="待闭环问题" value={String(stats.open)} unit="条" delta={`高优 ${stats.high}`} icon="circlealert" tone="amber" onClick={() => { setTab('issues'); setSt(''); }} />
        <StatCard label="闭环率" value={String(stats.rate)} unit="%" delta={`已闭环 ${stats.closed}`} icon="checkcircle" tone="green" onClick={() => { setTab('issues'); setSt('已闭环'); }} />
        <StatCard label="知识文档" value={String(docs.length)} unit="份" delta="可抽取规则" icon="book" tone="blue" onClick={() => setTab('knowledge')} />
        <StatCard label="大屏组件" value="13" unit="类" delta="治理驾驶舱" icon="dashboard" tone="violet" onClick={() => setTab('screen')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'issues', label: '问题管理', count: stats.open },
          { key: 'knowledge', label: '质控知识库', count: rules.length },
          { key: 'screen', label: '治理大屏', count: 13 },
        ]}
      />

      {tab === 'issues' && (
        <>
          <Card className="mt-14" title="问题汇聚" subtitle="分类统计 · 通知 · 处置闭环" noPad actions={
            <div className="filter-bar">
              <SearchInput value={q} onChange={setQ} placeholder="搜索问题 / 机构" width={180} />
              <Select value={cat} onChange={setCat} options={['', '完整性', '一致性', '规范性', '及时性', '稳定性', '合规性']} placeholder="全部分类" width={110} />
              <Select value={st} onChange={setSt} options={['', '待分派', '处理中', '待复核', '已闭环']} placeholder="全部状态" width={110} />
            </div>
          }>
            <div className="pad-h">
              <DataTable
                rows={filteredIssues}
                pageSize={6}
                onRowClick={(r) => setActive(r)}
                columns={[
                  { key: 'id', title: '单号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'title', title: '问题', render: (r) => <div className="cell-main"><strong>{r.title}</strong><small>{r.org} · {r.root}</small></div> },
                  { key: 'category', title: '分类', width: 80, render: (r) => <Badge tone="slate">{r.category}</Badge> },
                  { key: 'level', title: '等级', width: 64, render: (r) => <Badge tone={toneOf(r.level)}>{r.level}</Badge> },
                  { key: 'status', title: '状态', width: 84, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  { key: 'owner', title: '负责人', width: 80 },
                  { key: 'sla', title: 'SLA', width: 56 },
                  {
                    key: 'ops', title: '操作', width: 120,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="link-btn" onClick={() => { setActive(r); setAssignOpen(true); }}>分派</button>
                        <button type="button" className="link-muted" onClick={() => closeLoop(r.id)} disabled={r.status === '已闭环'}>闭环</button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
          <div className="grid grid-3 mt-14">
            <Card title="分类统计" subtitle="按问题类型">
              <div className="gov-cat-bars">
                {['完整性', '一致性', '规范性', '及时性', '稳定性', '合规性'].map((c) => {
                  const n = issues.filter((i) => i.category === c).length;
                  return (
                    <button key={c} type="button" onClick={() => setCat(c)}>
                      <span>{c}</span>
                      <div className="mini-track"><i style={{ width: `${(n / 3) * 100}%` }} /></div>
                      <strong>{n}</strong>
                    </button>
                  );
                })}
              </div>
            </Card>
            <Card title="通知记录" subtitle="企微 / 站内信 / 短信">
              <div className="gov-notice-list">
                {notices.map((n) => (
                  <div key={n.t + n.m}>
                    <span>{n.t}</span>
                    <p>{n.m}</p>
                    <Badge tone="blue">{n.ch}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="闭环漏斗" subtitle="本周">
              <div className="gov-funnel">
                {[
                  ['汇聚', issues.length],
                  ['已分派', issues.filter((i) => i.owner !== '—').length],
                  ['待复核', issues.filter((i) => i.status === '待复核').length],
                  ['已闭环', stats.closed],
                ].map(([l, n]) => (
                  <div key={l as string}><span>{l}</span><strong>{n}</strong><Progress value={((n as number) / issues.length) * 100} tone="violet" height={5} /></div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'knowledge' && (
        <div className="gov-kb-layout mt-14">
          <Card title="知识文档" subtitle="沉淀指南 · 可抽取规则" noPad actions={<SearchInput value={kbQ} onChange={setKbQ} placeholder="搜索文档" width={160} />}>
            <div className="kb-doc-list">
              {docRows.map((d) => (
                <button key={d.id} type="button" className={`kb-doc ${selectedDoc.id === d.id ? 'is-active' : ''}`} onClick={() => setSelectedDoc(d)}>
                  <span className="kb-doc-icon"><Icon name="file" size={16} /></span>
                  <div><strong>{d.name}</strong><small>{d.type} · {d.rules} 条 · {d.owner}</small></div>
                  <Badge tone={d.status === '已发布' ? 'green' : 'slate'}>{d.status}</Badge>
                </button>
              ))}
            </div>
          </Card>
          <div className="stack">
            <Card
              title="规则建议"
              subtitle="AI 抽取 / 手工新增 → 人工确认 → 用于质控"
              actions={
                <div className="row-actions">
                  <Btn size="sm" icon="plus" onClick={() => setNewRuleOpen(true)}>新增规则</Btn>
                  <Btn size="sm" variant="primary" icon="sparkles" loading={extracting} onClick={extract}>AI 抽取</Btn>
                </div>
              }
            >
              <div className="ai-source"><Icon name="file" size={14} /><span>{selectedDoc.name}</span><Badge tone="blue">本地模型 Qwen2.5-14B</Badge></div>
              <div className="ai-rule-list">
                {rules.slice(0, 6).map((r) => (
                  <div className="ai-rule" key={r.id}>
                    <div className="ai-rule-head">
                      <Badge tone={r.status === '已用于质控' ? 'green' : r.status === '待审核' ? 'violet' : 'slate'}>{r.status}</Badge>
                      <span className="ai-confidence">置信度 {r.confidence}%</span>
                      <span className="mono-cell">{r.id}</span>
                    </div>
                    <p>{r.text}</p>
                    <div className="ai-rule-foot">
                      <span><Icon name="link" size={11} /> {r.source}</span>
                      <div className="row-actions">
                        {r.status !== '已用于质控' && (
                          <button type="button" className="link-btn" onClick={() => adoptToQc(r.id)}>用于质控</button>
                        )}
                        {r.status === '已用于质控' && (
                          <button type="button" className="link-muted" onClick={() => go('/collection/qc-designer')}>查看流程</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="用于质控的规则" subtitle={`已挂载 ${usedInQc} 条`}>
              {usedInQc === 0 ? (
                <div className="empty-hint">采纳规则后点「用于质控」，将挂到质控可视化流程。</div>
              ) : (
                <div className="gov-used-rules">
                  {rules.filter((r) => r.status === '已用于质控').map((r) => (
                    <div key={r.id}><Badge tone="green">质控中</Badge><strong>{r.id}</strong><span>{r.text}</span></div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'screen' && (
        <>
          <Card className="mt-14" title="治理大屏组件清单" subtitle="验收：13 类组件可演示 · 点击预览">
            <div className="gov-widget-grid">
              {screenWidgets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`gov-widget ${screenFocus === w.id ? 'is-on' : ''}`}
                  onClick={() => { setScreenFocus(w.id); notify(`大屏组件：${w.name}`); }}
                >
                  <span><Icon name={w.icon} size={14} /></span>
                  <strong>{w.name}</strong>
                  <small>{w.id} · {w.kind}</small>
                </button>
              ))}
            </div>
          </Card>

          <div className="gov-screen mt-14">
            <div className="gov-screen-head">
              <div>
                <Badge tone="violet" dot>治理驾驶舱</Badge>
                <h3>两江新区数据质量治理大屏</h3>
                <small>演示组件：{screenWidgets.find((w) => w.id === screenFocus)?.name}</small>
              </div>
              <div className="row-actions">
                <Btn size="sm" icon="bell" loading={pushing} onClick={pushDigest}>推送日报</Btn>
                <Btn size="sm" icon="expand" onClick={() => notify('已进入全屏演示模式', 'info')}>全屏</Btn>
              </div>
            </div>

            <div className="gov-screen-body">
              <div className="gov-kpi-row">
                <div><span>综合得分</span><strong>96.7</strong></div>
                <div><span>待处理</span><strong className="text-amber">{stats.open}</strong></div>
                <div><span>闭环率</span><strong className="text-green">{stats.rate}%</strong></div>
                <div><span>规则命中</span><strong>12.6 万</strong></div>
              </div>

              <div className="gov-screen-main">
                <Card title="通过率趋势" subtitle="近 6 月" noPad>
                  <div className="pad-h">
                    <AreaChart
                      data={[
                        { label: '03', value: 94.2 }, { label: '04', value: 95.0 }, { label: '05', value: 94.6 },
                        { label: '06', value: 95.8 }, { label: '07', value: 96.2 }, { label: '08', value: 96.7 },
                      ]}
                      height={160}
                      color="#6755F5"
                      suffix=" 分"
                      valueName="得分"
                      domainMin={90}
                      domainMax={100}
                    />
                  </div>
                </Card>
                <Card title="五维分布" subtitle="W05">
                  <Donut
                    size={130}
                    thickness={12}
                    centerValue="96.7"
                    label="综合"
                    segments={scoreDimensions.map((d) => ({ label: d.name, value: d.score, color: d.color }))}
                  />
                </Card>
                <Card title="整改优先级" subtitle="W12">
                  <div className="gov-prio">
                    {issues.filter((i) => i.status !== '已闭环').slice(0, 4).map((i, idx) => (
                      <div key={i.id}>
                        <em>P{idx + 1}</em>
                        <div><strong>{i.title}</strong><small>{i.org} · SLA {i.sla}</small></div>
                        <Badge tone={toneOf(i.level)}>{i.level}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="gov-screen-foot">
                <Card title="实时告警滚动" subtitle="W13" noPad>
                  <div className="gov-ticker">
                    {issues.filter((i) => i.level === '高').map((i) => (
                      <div key={i.id}><Badge tone="red">{i.level}</Badge><span className="mono-cell">{i.id}</span><strong>{i.title}</strong><small>{i.created}</small></div>
                    ))}
                  </div>
                </Card>
                <Card title="消息推送" subtitle="W09">
                  <div className="gov-notice-list compact">
                    {notices.map((n) => (
                      <div key={n.t}><span>{n.t}</span><p>{n.m}</p><Badge tone="blue">{n.ch}</Badge></div>
                    ))}
                  </div>
                </Card>
                <Card title="分层质量" subtitle="W11 · ODS→ADS">
                  <div className="gov-layers">
                    {[['ODS', 97.2], ['DWD', 96.8], ['DWS', 97.5], ['ADS', 98.1]].map(([l, v]) => (
                      <div key={l as string}><span>{l}</span><Progress value={v as number} tone="cyan" height={6} /><em>{v}</em></div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}

      <Drawer
        open={!!active && !assignOpen}
        onClose={() => setActive(null)}
        width={560}
        title={active?.title || ''}
        desc={active ? `${active.id} · ${active.org}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon="bell" onClick={() => notify(`已催办 ${active?.owner || '责任科室'}`)}>催办通知</Btn>
            <Btn onClick={() => setAssignOpen(true)}>分派</Btn>
            <Btn variant="primary" onClick={() => active && closeLoop(active.id)} disabled={active?.status === '已闭环'}>闭环</Btn>
          </>
        }
      >
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>等级</span><strong>{active.level}</strong></div>
              <div><span>状态</span><strong>{active.status}</strong></div>
              <div><span>SLA</span><strong>{active.sla}</strong></div>
              <div><span>负责人</span><strong className="sm">{active.owner}</strong></div>
            </div>
            <KeyValue
              className="mt-14"
              cols={2}
              items={[
                { label: '分类', value: active.category },
                { label: '质量维度', value: active.dim },
                { label: '发现时间', value: `2026-${active.created}` },
                { label: '所属机构', value: active.org },
                { label: '根因摘要', value: active.root, wide: true },
                { label: '处置建议', value: '核查源端约束与对码表，补数后重跑质控流程，复核通过后闭环。', wide: true },
              ]}
            />
          </>
        )}
      </Drawer>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="分派问题"
        desc={active ? `${active.id} · ${active.title}` : ''}
        width={440}
        footer={<><Btn onClick={() => setAssignOpen(false)}>取消</Btn><Btn variant="primary" onClick={assignIssue}>分派并通知</Btn></>}
      >
        <div className="form-grid">
          <Field label="负责人" required className="span-2">
            <Select value={assignee} onChange={setAssignee} options={['李倩', '张敏', '王磊', '赵倩', '运维值班']} />
          </Field>
          <Field label="通知渠道" className="span-2">
            <Select value="企微 + 站内信" onChange={() => {}} options={['企微 + 站内信', '仅企微', '短信']} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={newRuleOpen}
        onClose={() => setNewRuleOpen(false)}
        title="新增质控规则"
        desc="手工录入后可一键用于质控流程"
        width={520}
        footer={<><Btn onClick={() => setNewRuleOpen(false)}>取消</Btn><Btn variant="primary" onClick={addManualRule}>保存规则</Btn></>}
      >
        <div className="form-grid">
          <Field label="归属文档" className="span-2"><input className="input" readOnly value={selectedDoc.name} /></Field>
          <Field label="规则内容" required className="span-2">
            <textarea className="textarea" rows={3} value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} placeholder="例如：出院诊断须与病程主诊断一致" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
