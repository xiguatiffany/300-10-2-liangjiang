'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, RadialScore } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { bidRules, scoreDimensions, scoreModels } from '../../dataBid';

type TabKey = 'foundation' | 'rules' | 'score' | 'report' | 'algo';

type BaseCfg = { id: string; kind: '条线' | '数据源' | '表' | '机构' | '字典'; name: string; weight: number; status: '启用' | '停用' };
type AlgoRow = {
  id: string; dim: '准确性' | '完整性' | '一致性' | '时效性' | '可用性';
  metric: string; mean: number; median: number; sigma: number; z: number; p: string; alert: '正常' | '预警' | '告警';
};
type ReportRow = { id: string; name: string; cycle: string; scope: string; score: number; at: string; status: '已生成' | '生成中' | '失败' };
type CheckLog = { id: string; at: string; target: string; result: string; vendor: string };

const baseSeed: BaseCfg[] = [
  { id: 'BF-01', kind: '条线', name: '医疗服务', weight: 30, status: '启用' },
  { id: 'BF-02', kind: '条线', name: '公共卫生', weight: 25, status: '启用' },
  { id: 'BF-03', kind: '数据源', name: 'HIS / MySQL', weight: 20, status: '启用' },
  { id: 'BF-04', kind: '表', name: 'ods_his.patient', weight: 8, status: '启用' },
  { id: 'BF-05', kind: '机构', name: '两江新区人民医院', weight: 5, status: '启用' },
  { id: 'BF-06', kind: '字典', name: 'ICD-10 国临版', weight: 6, status: '启用' },
  { id: 'BF-07', kind: '表', name: 'dwd.fact_visit', weight: 8, status: '启用' },
  { id: 'BF-08', kind: '机构', name: '人和社区卫生服务中心', weight: 3, status: '停用' },
];

const algoSeed: AlgoRow[] = [
  { id: 'AL-01', dim: '完整性', metric: '必填字段空值率', mean: 1.2, median: 0.9, sigma: 0.6, z: 1.1, p: '0.27', alert: '正常' },
  { id: 'AL-02', dim: '准确性', metric: '身份证校验失败率', mean: 0.4, median: 0.3, sigma: 0.2, z: 2.4, p: '0.016', alert: '预警' },
  { id: 'AL-03', dim: '一致性', metric: '科室码不可关联率', mean: 0.8, median: 0.6, sigma: 0.4, z: 1.8, p: '0.07', alert: '正常' },
  { id: 'AL-04', dim: '时效性', metric: '入仓延迟(分钟)', mean: 18, median: 12, sigma: 9, z: 3.1, p: '0.002', alert: '告警' },
  { id: 'AL-05', dim: '可用性', metric: '接口可用性%', mean: 99.2, median: 99.4, sigma: 0.5, z: -0.4, p: '0.69', alert: '正常' },
  { id: 'AL-06', dim: '完整性', metric: '主键重复率', mean: 0.05, median: 0.02, sigma: 0.03, z: 0.9, p: '0.37', alert: '正常' },
];

const reportsSeed: ReportRow[] = [
  { id: 'RP-Q-08', name: '8 月医疗机构质量考核', cycle: '月', scope: '42 家机构', score: 96.8, at: '08-01', status: '已生成' },
  { id: 'RP-Q-07', name: '7 月医疗机构质量考核', cycle: '月', scope: '42 家机构', score: 95.6, at: '07-01', status: '已生成' },
  { id: 'RP-S-Q2', name: 'Q2 病案首页专项', cycle: '季', scope: '12 家三级', score: 94.2, at: '07-01', status: '已生成' },
  { id: 'RP-W-32', name: '第 32 周基层自检', cycle: '周', scope: '30 家基层', score: 97.1, at: '08-05', status: '已生成' },
  { id: 'RP-D-0806', name: '日校验 · 门诊入仓', cycle: '日', scope: '全部接口表', score: 96.2, at: '08-06', status: '生成中' },
];

const checkLogs: CheckLog[] = [
  { id: 'CK-1', at: '14:20', target: '完整性规则包', result: '通过 98.6%', vendor: '平台自检' },
  { id: 'CK-2', at: '13:10', target: '厂商 HIS 接口包', result: '异常 12 条', vendor: '厂商 A' },
  { id: 'CK-3', at: '11:40', target: '及时性专项', result: '预警触发', vendor: '平台自检' },
  { id: 'CK-4', at: '09:05', target: '一致性对码包', result: '通过 97.8%', vendor: '厂商 B' },
];

/** B5 数据质量控制：基础 · 规则▲ · 评分▲ · 考核报告 · 算法 */
export function QualityControlHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('rules');
  const [bases, setBases] = useState(baseSeed);
  const [rules, setRules] = useState(bidRules);
  const [dim, setDim] = useState('完整性');
  const [openRule, setOpenRule] = useState(false);
  const [activeRule, setActiveRule] = useState<typeof bidRules[0] | null>(null);
  const [trialing, setTrialing] = useState(false);
  const [trial, setTrial] = useState<{ rows: number; hit: number; sec: number } | null>({ rows: 128642, hit: 214, sec: 42 });

  const [name, setName] = useState('2026 年医疗机构数据质量考核');
  const [cycle, setCycle] = useState('月');
  const [orgScope, setOrgScope] = useState('全部 42 家机构');
  const [tableScope, setTableScope] = useState('全部 386 张接口表');
  const [weights, setWeights] = useState(scoreDimensions.map((d) => d.weight));
  const [generating, setGenerating] = useState(false);
  const [modelsTab, setModelsTab] = useState('models');
  const [reports, setReports] = useState(reportsSeed);
  const [algoRows] = useState(algoSeed);
  const [algoDim, setAlgoDim] = useState('');
  const [bq, setBq] = useState('');
  const [recomputing, setRecomputing] = useState(false);

  const ruleRows = useMemo(() => rules.filter((r) => r.dim === dim), [rules, dim]);
  const baseRows = useMemo(() => bases.filter((b) => (b.id + b.name + b.kind).includes(bq)), [bases, bq]);
  const algoFiltered = useMemo(() => algoRows.filter((a) => !algoDim || a.dim === algoDim), [algoRows, algoDim]);

  const weightSum = weights.reduce((a, b) => a + b, 0);
  const score = (scoreDimensions.reduce((n, d, i) => n + d.score * weights[i], 0) / (weightSum || 1)).toFixed(1);

  const runTrial = async () => {
    setTrialing(true);
    setTab('rules');
    await new Promise((r) => setTimeout(r, 900));
    setTrial({ rows: 128642 + Math.floor(Math.random() * 800), hit: 180 + Math.floor(Math.random() * 60), sec: 38 + Math.floor(Math.random() * 12) });
    setTrialing(false);
    notify(`${dim}规则试跑完成 · 评分可解释（通过率×权重）`);
  };

  const saveRule = () => {
    if (!activeRule) return;
    notify(`${activeRule.name} 已保存 · 评分标准可解释`);
  };

  const generateReport = async () => {
    setGenerating(true);
    setTab('score');
    await new Promise((r) => setTimeout(r, 1000));
    const id = `RP-${cycle}-${String(reports.length + 1).padStart(2, '0')}`;
    const row: ReportRow = {
      id, name: `${name}（${cycle}）`, cycle, scope: orgScope, score: +score, at: '08-06', status: '已生成',
    };
    setReports((arr) => [row, ...arr]);
    setGenerating(false);
    setTab('report');
    notify(`考核报告已生成：综合得分 ${score} · 周期 ${cycle}`);
  };

  const recomputeAlgo = async () => {
    setRecomputing(true);
    setTab('algo');
    await new Promise((r) => setTimeout(r, 800));
    setRecomputing(false);
    notify('统计量与 Z/t/P 值已复算，预警结果可复核');
  };

  const toggleBase = (id: string) => {
    setBases((arr) => arr.map((b) => b.id === id ? { ...b, status: b.status === '启用' ? '停用' : '启用' } : b));
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA QUALITY CONTROL · B5"
        title="数据质量控制"
        desc="B5-01 基础配置 · B5-02 五维规则▲ · B5-03 考核报告 · B5-04 评分模型▲ · B5-05 算法服务。"
        actions={
          <>
            <Btn icon="workflow" onClick={() => go('/collection/qc-designer')}>质控流程</Btn>
            <Btn icon="shield" onClick={() => go('/collection/qc-results')}>结果统计</Btn>
            <Btn icon="play" loading={trialing} onClick={runTrial}>试跑规则</Btn>
            <Btn variant="primary" icon="chart" loading={generating} onClick={generateReport}>生成考核报告</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '基础配置', d: '条线·表·权重' },
          { n: '02', t: '规则▲', d: '可保存·试跑·可解释' },
          { n: '03', t: '评分▲', d: '可配置·可生成' },
          { n: '04', t: '考核报告', d: '日周月季年' },
          { n: '05', t: '算法', d: '统计可复算' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['foundation', 'rules', 'score', 'report', 'algo'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 4 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 综合 {score} · 规则 {rules.length}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="基础对象" value={String(bases.filter((b) => b.status === '启用').length)} unit="项" delta="权重可调" icon="sliders" tone="blue" onClick={() => setTab('foundation')} />
        <StatCard label="五维规则" value="486" unit="条" delta="▲ 可试跑" icon="listfilter" tone="violet" onClick={() => setTab('rules')} />
        <StatCard label="评分模型" value={String(scoreModels.length)} unit="个" delta="▲ 可生成" icon="chart" tone="cyan" onClick={() => setTab('score')} />
        <StatCard label="考核报告" value={String(reports.filter((r) => r.status === '已生成').length)} unit="份" delta="多周期" icon="file" tone="green" onClick={() => setTab('report')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'foundation', label: '质控基础', count: bases.length },
          { key: 'rules', label: '规则配置 ▲', count: rules.length },
          { key: 'score', label: '评分模型 ▲', count: scoreModels.length },
          { key: 'report', label: '考核报告', count: reports.length },
          { key: 'algo', label: '算法服务', count: algoRows.length },
        ]}
      />

      {tab === 'foundation' && (
        <>
          <Card className="mt-14" title="质控基础管理" subtitle="条线 · 数据源 · 表 · 机构 · 字典 · 权重" noPad actions={
            <SearchInput value={bq} onChange={setBq} placeholder="搜索配置项" width={200} />
          }>
            <div className="pad-h">
              <DataTable rows={baseRows} pageSize={8} columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'kind', title: '类型', width: 70, render: (r) => <Badge tone="slate">{r.kind}</Badge> },
                { key: 'name', title: '对象', render: (r) => r.name },
                { key: 'weight', title: '权重', width: 140, render: (r) => (
                  <div className="quality-cell"><Progress value={r.weight * 3} tone="violet" /><span>{r.weight}%</span></div>
                ) },
                { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '启用' ? 'green' : 'slate'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 80, render: (r) => (
                  <button type="button" className="link-btn" onClick={() => { toggleBase(r.id); notify(`${r.name} 已${r.status === '启用' ? '停用' : '启用'}`); }}>
                    {r.status === '启用' ? '停用' : '启用'}
                  </button>
                ) },
              ]} />
            </div>
          </Card>
          <Card className="mt-14" title="五维权重总览" subtitle="与评分模型联动">
            <div className="b5-dim-weights">
              {scoreDimensions.map((d) => (
                <div key={d.key}>
                  <div className="resource-head"><span><i style={{ background: d.color, width: 8, height: 8, borderRadius: 2, display: 'inline-block', marginRight: 6 }} />{d.name}</span><strong>{d.weight}%</strong></div>
                  <Progress value={d.weight * 2.5} tone="violet" height={6} />
                </div>
              ))}
            </div>
            <Btn className="mt-12" size="sm" icon="chart" onClick={() => setTab('score')}>去评分模型调整</Btn>
          </Card>
        </>
      )}

      {tab === 'rules' && (
        <>
          <div className="rules-hero mt-14">
            <div className="rules-dims">
              {scoreDimensions.map((d) => (
                <button key={d.key} type="button" className={dim === d.name ? 'is-active' : ''} onClick={() => setDim(d.name)}>
                  <span style={{ background: d.color }} />
                  <div><strong>{d.name}</strong><small>{rules.filter((r) => r.dim === d.name).length} 条规则</small></div>
                  <em>{d.score}</em>
                </button>
              ))}
            </div>
            <div className="rules-summary">
              <div><span>规则总数</span><strong>486</strong></div>
              <div><span>已启用</span><strong>468</strong></div>
              <div><span>今日命中</span><strong>12.6 万</strong></div>
              <div><span>整体通过率</span><strong className="text-green">96.7%</strong></div>
            </div>
          </div>
          <div className="grid-2-1 mt-14">
            <Card title={`${dim}规则`} subtitle="约束 · 权重 · 评分标准 · 可保存试跑" noPad actions={
              <Btn size="sm" icon="plus" onClick={() => setOpenRule(true)}>新建</Btn>
            }>
              <div className="pad-h">
                <DataTable rows={ruleRows} pageSize={8} onRowClick={(r) => setActiveRule(r)} columns={[
                  { key: 'name', title: '规则名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.object}</small></div> },
                  { key: 'expr', title: '约束条件', render: (r) => <span className="mono-cell">{r.expr}</span> },
                  { key: 'weight', title: '权重', width: 56, align: 'right', render: (r) => `${r.weight}%` },
                  { key: 'score', title: '通过率', width: 100, render: (r) => <div className="quality-cell"><Progress value={r.score} tone={r.score > 98 ? 'green' : 'amber'} /><span>{r.score}%</span></div> },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <div className="stack">
              <Card title="评分可解释" subtitle="通过率 × 权重">
                <div className="rule-score-list">
                  {ruleRows.map((r) => (
                    <div key={r.id}><span>{r.name}</span><strong>{r.weight}%</strong><div className="mini-track"><i style={{ width: `${r.score}%` }} /></div><em>{r.score}</em></div>
                  ))}
                </div>
              </Card>
              <Card title="规则试跑" subtitle="最近一次" actions={
                <Btn size="sm" icon="play" loading={trialing} onClick={runTrial}>试跑</Btn>
              }>
                {trial && (
                  <div className="rule-trial">
                    <div><span>扫描行数</span><strong>{trial.rows.toLocaleString()}</strong></div>
                    <div><span>命中异常</span><strong className="text-amber">{trial.hit}</strong></div>
                    <div><span>耗时</span><strong>{trial.sec}s</strong></div>
                  </div>
                )}
                <div className="divider-h" />
                <div className="check-list vertical">
                  {ruleRows.slice(0, 3).map((r) => (
                    <div key={r.id}>
                      <span className={r.score > 98 ? 'ok' : 'warn'}><Icon name={r.score > 98 ? 'check' : 'alert'} size={12} /></span>
                      <div><strong>{r.name}</strong><small>通过率 {r.score}% · 贡献 {(r.score * r.weight / 100).toFixed(1)}</small></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
          <Card className="mt-14" title="规则命中趋势" subtitle="近 6 个月" actions={<Badge tone="amber">及时性需关注</Badge>}>
            <div className="grid grid-2-1">
              <AreaChart data={[{ label: '03', value: 9.2 }, { label: '04', value: 9.8 }, { label: '05', value: 10.6 }, { label: '06', value: 11.2 }, { label: '07', value: 12.1 }, { label: '08', value: 12.6 }]} height={150} color="#9587FF" suffix=" 万" valueName="命中次数" />
              <div className="rule-insight">
                <div><Icon name="sparkles" size={14} /><div><strong>及时性规则命中上升</strong><p>门诊 15 分钟入仓命中率 94.6%，建议核查调度频率。</p></div></div>
                <div><Icon name="checkcircle" size={14} /><div><strong>完整性规则稳定</strong><p>主键非空通过率 ≥98%，可维持当前权重。</p></div></div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'score' && (
        <>
          <div className="score-layout mt-14">
            <Card title="评分模型配置" subtitle="机构 / 接口表 / 质量指标 · 周期可配">
              <div className="form-grid">
                <Field label="模型名称" required className="span-2"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="考核周期"><Select value={cycle} onChange={setCycle} options={['日', '周', '月', '季', '年']} /></Field>
                <Field label="机构范围"><Select value={orgScope} onChange={setOrgScope} options={['全部 42 家机构', '12 家三级医院', '30 家基层机构', '妇幼保健院']} /></Field>
                <Field label="接口表范围" className="span-2"><Select value={tableScope} onChange={setTableScope} options={['全部 386 张接口表', '病案首页 86 张', '公卫 126 张', '检验 64 张']} /></Field>
              </div>
              <div className="divider-h" />
              <div className="section-title-sm">五维权重（可调）</div>
              <div className="weight-list">
                {scoreDimensions.map((d, i) => (
                  <div key={d.key}>
                    <div className="weight-head"><span><i style={{ background: d.color }} />{d.name}</span><strong>{weights[i]}%</strong><em>当前得分 {d.score}</em></div>
                    <input type="range" min={5} max={40} value={weights[i]} onChange={(e) => setWeights((arr) => arr.map((x, j) => (j === i ? +e.target.value : x)))} style={{ accentColor: d.color }} />
                  </div>
                ))}
              </div>
              <div className="row-actions mt-14">
                <Btn variant="primary" icon="play" loading={generating} onClick={generateReport}>生成考核报告</Btn>
                <Btn icon="save" onClick={() => notify('评分模型已保存 · 可追溯版本')}>保存模型</Btn>
                <Btn icon="refresh" onClick={() => setWeights(scoreDimensions.map((d) => d.weight))}>恢复默认</Btn>
                <span className="muted xs">权重合计 {weightSum}%</span>
              </div>
            </Card>
            <div className="score-side">
              <Card title="综合得分预览" subtitle={name}>
                <div className="score-preview">
                  <RadialScore value={+score} size={156} thickness={11} color="#6755F5" label="加权综合得分" />
                  <div className="score-preview-meta">
                    <Badge tone="green" dot>优秀</Badge>
                    <p>较上期 <strong className="text-green">+1.2</strong> 分</p>
                    <span>{orgScope} · {cycle}周期</span>
                  </div>
                </div>
                <div className="score-dims">
                  {scoreDimensions.map((d, i) => (
                    <div key={d.key}>
                      <div className="resource-head"><span>{d.name}</span><strong>{d.score}</strong></div>
                      <Progress value={d.score} tone={i === 0 ? 'blue' : i === 1 ? 'violet' : i === 2 ? 'cyan' : i === 3 ? 'amber' : 'green'} height={5} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="mt-14" title="最近报告" subtitle="可追溯">
                <div className="exec-history">
                  {reports.slice(0, 3).map((r) => (
                    <div key={r.id}>
                      <span className={`status-dot tone-${r.status === '已生成' ? 'green' : r.status === '失败' ? 'red' : 'amber'}`} />
                      <div><strong>{r.name}</strong><small>{r.at} · {r.score} 分</small></div>
                      <button type="button" className="link-btn" onClick={() => { setTab('report'); notify('报告详情已打开', 'info'); }}>查看</button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <Tabs variant="line" value={modelsTab} onChange={setModelsTab} items={[
                { key: 'models', label: '评分模型', count: scoreModels.length },
                { key: 'logs', label: '评分日志' },
              ]} />
              <span className="table-note"><Icon name="clock" size={12} /> 最近执行 2026-08-01 02:00</span>
            </div>
            <div className="pad-h">
              {modelsTab === 'models' ? (
                <DataTable rows={scoreModels} pageSize={4} columns={[
                  { key: 'name', title: '模型名称', render: (m) => <div className="cell-main"><strong>{m.name}</strong><small>{m.id} · {m.scope}</small></div> },
                  { key: 'tables', title: '接口表', width: 80, align: 'right' },
                  { key: 'cycle', title: '周期', width: 60, render: (m) => <Badge tone="slate">{m.cycle}</Badge> },
                  { key: 'score', title: '最近得分', width: 90, render: (m) => <span className="strong text-green">{m.score}</span> },
                  { key: 'last', title: '最近执行', width: 130, render: (m) => <span className="muted">{m.last}</span> },
                  { key: 'status', title: '状态', width: 76, render: (m) => <Badge dot>{m.status}</Badge> },
                  { key: 'ops', title: '操作', width: 100, render: () => (
                    <div className="row-actions">
                      <button type="button" className="link-btn" onClick={() => notify('模型已载入编辑', 'info')}>编辑</button>
                      <button type="button" className="link-muted" onClick={generateReport}>报告</button>
                    </div>
                  ) },
                ]} />
              ) : (
                <div className="timeline-list">
                  {[
                    ['2026-08-01 02:00', '2026 年医疗机构数据质量考核', '成功', '96.8 分 · 42 家机构'],
                    ['2026-07-01 02:00', '2026 年医疗机构数据质量考核', '成功', '95.6 分 · 42 家机构'],
                    ['2026-07-01 02:10', '三级医院病案首页专项', '成功', '94.2 分 · 12 家机构'],
                    ['2026-06-01 02:00', '基层医疗机构公卫数据考核', '失败', '源表连接超时'],
                  ].map(([t, n, s, d]) => (
                    <div className="tl-item" key={t}>
                      <span className="tl-dot" />
                      <div className="tl-time">{t.slice(5)}</div>
                      <div className="tl-body"><div><strong>{n}</strong><Badge tone={s === '成功' ? 'green' : 'red'}>{s}</Badge></div><p>{d}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === 'report' && (
        <>
          <Card className="mt-14" title="质量考核报告" subtitle="总体概览 · 专项 · 校验 · 自检 · 按日/周/月/季/年" actions={
            <Btn size="sm" icon="play" loading={generating} onClick={generateReport}>按当前模型生成</Btn>
          } noPad>
            <div className="pad-h">
              <DataTable rows={reports} pageSize={6} columns={[
                { key: 'id', title: '编号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '报告', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.scope}</small></div> },
                { key: 'cycle', title: '周期', width: 56, render: (r) => <Badge tone="slate">{r.cycle}</Badge> },
                { key: 'score', title: '得分', width: 70, render: (r) => <span className="strong text-green">{r.score}</span> },
                { key: 'at', title: '生成日', width: 70, render: (r) => <span className="muted">{r.at}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已生成' ? 'green' : r.status === '失败' ? 'red' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 100, render: (r) => (
                  <div className="row-actions">
                    <button type="button" className="link-btn" onClick={() => notify(`${r.name} 已打开`, 'info')}>查看</button>
                    <button type="button" className="link-muted" onClick={() => notify('报告已下载')}>下载</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="校验配置与日志" subtitle="异常追踪">
              <div className="exec-history">
                {checkLogs.map((c) => (
                  <div key={c.id}>
                    <span className={`status-dot tone-${c.result.includes('异常') || c.result.includes('预警') ? 'amber' : 'green'}`} />
                    <div><strong>{c.target}</strong><small>{c.at} · {c.vendor} · {c.result}</small></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="厂商自检 / 质量总览" subtitle="联动结果统计">
              <div className="b5-report-kpis">
                <div><span>综合得分</span><strong>96.8</strong></div>
                <div><span>异常待办</span><strong className="text-amber">86</strong></div>
                <div><span>自检通过</span><strong className="text-green">38/42</strong></div>
              </div>
              <div className="row-actions mt-12">
                <Btn size="sm" icon="shield" onClick={() => go('/collection/qc-results')}>质控结果</Btn>
                <Btn size="sm" icon="dashboard" onClick={() => go('/collection/qc-governance')}>治理大屏</Btn>
                <Btn size="sm" icon="download" onClick={() => notify('专项分析包已导出')}>导出分析</Btn>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'algo' && (
        <>
          <Card className="mt-14" title="质量算法服务" subtitle="均值 / 中位数 / 方差 / 分位数 / Z·t·P 预警" actions={
            <>
              <Select value={algoDim} onChange={setAlgoDim} options={['', '准确性', '完整性', '一致性', '时效性', '可用性']} placeholder="全部维度" width={110} />
              <Btn size="sm" icon="refresh" loading={recomputing} onClick={recomputeAlgo}>复算</Btn>
            </>
          } noPad>
            <div className="pad-h">
              <DataTable rows={algoFiltered} pageSize={6} columns={[
                { key: 'dim', title: '维度', width: 70, render: (r) => <Badge tone="slate">{r.dim}</Badge> },
                { key: 'metric', title: '指标', render: (r) => r.metric },
                { key: 'mean', title: '均值', width: 70, align: 'right', render: (r) => r.mean },
                { key: 'median', title: '中位数', width: 70, align: 'right', render: (r) => r.median },
                { key: 'sigma', title: 'σ', width: 56, align: 'right', render: (r) => r.sigma },
                { key: 'z', title: 'Z', width: 56, align: 'right', render: (r) => <span className={Math.abs(r.z) >= 2 ? 'text-amber' : ''}>{r.z}</span> },
                { key: 'p', title: 'P', width: 64, align: 'right', render: (r) => r.p },
                { key: 'alert', title: '预警', width: 70, render: (r) => <Badge tone={r.alert === '正常' ? 'green' : r.alert === '预警' ? 'amber' : 'red'}>{r.alert}</Badge> },
              ]} />
            </div>
          </Card>
          <div className="grid grid-3 mt-14">
            {[
              { t: '准确性', d: '校验位、格式、值域偏离 · Z/P 预警' },
              { t: '完整性', d: '空值率、主键唯一 · 分位数监控' },
              { t: '一致性', d: '跨表引用、对码一致 · t 检验' },
              { t: '时效性', d: '入仓延迟分布 · 均值/方差' },
              { t: '可用性', d: '接口可用率 · 滑动窗口' },
              { t: '复算说明', d: '同批次样本可复现统计与预警结论' },
            ].map((x) => (
              <div key={x.t} className="b5-algo-card">
                <strong>{x.t}</strong>
                <small>{x.d}</small>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={openRule} onClose={() => setOpenRule(false)} title="新建质量规则" desc="配置约束与评分标准，保存后可试跑。" width={620}
        footer={
          <>
            <Btn onClick={() => setOpenRule(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `BR-${String(rules.length + 1).padStart(3, '0')}`;
              const row = { id, dim, name: '新建规则', object: 'ods_his.patient', expr: '/* 约束 */', weight: 8, score: 100, status: '启用' };
              setRules((arr) => [row, ...arr]);
              setOpenRule(false);
              setActiveRule(row);
              notify('质量规则已创建并启用');
            }}>创建规则</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="规则名称" required className="span-2"><input className="input" placeholder="例如：患者主键非空" /></Field>
          <Field label="质量维度"><Select value={dim} onChange={setDim} options={['完整性', '一致性', '规范性', '及时性', '稳定性']} /></Field>
          <Field label="数据表"><Select value="ods_his.patient" onChange={() => {}} options={['ods_his.patient', 'dwd.fact_visit', 'ods_lis.lab_report']} /></Field>
          <Field label="约束条件" className="span-2"><input className="input mono" placeholder="patient_id IS NOT NULL" /></Field>
          <Field label="权重"><input className="input" defaultValue="10" /></Field>
          <Field label="告警阈值"><input className="input" defaultValue="95%" /></Field>
          <Field label="评分标准" className="span-2"><textarea className="textarea" rows={2} defaultValue="通过率 ≥ 98% 得满分；每低 1% 扣 2 分；低于 90% 计 0 分。" /></Field>
        </div>
      </Modal>

      <Drawer open={!!activeRule} onClose={() => setActiveRule(null)} width={520} title={activeRule?.name || ''} desc={activeRule ? `${activeRule.id} · ${activeRule.object}` : ''}
        footer={
          <>
            <Btn onClick={() => setActiveRule(null)}>关闭</Btn>
            <Btn icon="play" loading={trialing} onClick={runTrial}>试跑</Btn>
            <Btn variant="primary" onClick={saveRule}>保存</Btn>
          </>
        }
      >
        {activeRule && (
          <>
            <div className="drawer-summary">
              <div><span>维度</span><strong>{activeRule.dim}</strong></div>
              <div><span>权重</span><strong>{activeRule.weight}%</strong></div>
              <div><span>通过率</span><strong className="text-green">{activeRule.score}%</strong></div>
              <div><span>贡献分</span><strong>{(activeRule.score * activeRule.weight / 100).toFixed(1)}</strong></div>
            </div>
            <KeyValue className="mt-14" cols={1} items={[
              { label: '约束条件', value: <span className="mono">{activeRule.expr}</span> },
              { label: '评分解释', value: `得分 = 通过率 ${activeRule.score}% × 权重 ${activeRule.weight}% = ${(activeRule.score * activeRule.weight / 100).toFixed(1)}` },
              { label: '告警方式', value: '站内信 + 企业微信' },
              { label: '负责人', value: '张敏' },
            ]} />
          </>
        )}
      </Drawer>
    </>
  );
}
