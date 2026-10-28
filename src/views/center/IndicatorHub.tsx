'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BarList, Donut, Sparkline } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { indicators } from '../../data';

type TabKey = 'config' | 'market' | 'develop' | 'lifecycle' | 'schedule';

type DimItem = { id: string; name: string; kind: '维度' | '字典' | '函数' | '字段类型'; refs: number; status: '启用' | '停用' };
type DevItem = {
  id: string; name: string; mode: '模型' | '指标';
  type: '原子' | '派生' | '复合' | '实时';
  calc: '批量' | '单次' | '实时'; status: '开发中' | '已固化' | '已发布' | '已停用'; owner: string;
};
type LifeItem = { id: string; name: string; stage: string; auth: string; service: boolean; tags: number };
type SchedJob = { id: string; name: string; executor: string; cron: string; last: string; status: '成功' | '运行中' | '失败' | '补跑中' };

const marketCats = ['全部指标', '运营指标', '医疗质量', '国考指标', 'DRG 指标', '妇幼健康', '公共卫生'];

const dimsSeed: DimItem[] = [
  { id: 'CFG-01', name: '机构维度', kind: '维度', refs: 1860, status: '启用' },
  { id: 'CFG-02', name: '时间维度（日/周/月）', kind: '维度', refs: 2420, status: '启用' },
  { id: 'CFG-03', name: '科室字典', kind: '字典', refs: 980, status: '启用' },
  { id: 'CFG-04', name: '诊断字典 ICD-10', kind: '字典', refs: 640, status: '启用' },
  { id: 'CFG-05', name: '同比/环比函数', kind: '函数', refs: 420, status: '启用' },
  { id: 'CFG-06', name: '占比计算函数', kind: '函数', refs: 386, status: '启用' },
  { id: 'CFG-07', name: 'DECIMAL(18,4)', kind: '字段类型', refs: 1200, status: '启用' },
  { id: 'CFG-08', name: '数仓 ODS/DWD/DWS', kind: '维度', refs: 86, status: '启用' },
];

const sources = [
  { name: 'dwd.fact_visit', kind: '主题表', status: '已采集' },
  { name: 'hm_reg_appt_data', kind: '业务模型', status: '已审核' },
  { name: 'hm_fs_surgeries_data', kind: '业务模型', status: '已审核' },
  { name: 'ods_lis_report', kind: '明细表', status: '采集中' },
];

const devSeed: DevItem[] = [
  { id: 'DEV-01', name: '门诊人次', mode: '指标', type: '原子', calc: '批量', status: '已发布', owner: '王思远' },
  { id: 'DEV-02', name: '床位使用率', mode: '指标', type: '派生', calc: '批量', status: '已发布', owner: '刘一鸣' },
  { id: 'DEV-03', name: 'DRG 组数（CMI）', mode: '模型', type: '复合', calc: '批量', status: '已固化', owner: '刘一鸣' },
  { id: 'DEV-04', name: '实时在院人数', mode: '指标', type: '实时', calc: '实时', status: '开发中', owner: '张敏' },
  { id: 'DEV-05', name: '门诊预约率', mode: '指标', type: '派生', calc: '单次', status: '开发中', owner: '王思远' },
  { id: 'DEV-06', name: '手术台次（批量 SQL）', mode: '指标', type: '原子', calc: '批量', status: '已发布', owner: '张敏' },
];

const lifeSeed: LifeItem[] = [
  { id: '148', name: '门诊预约爽约人次', stage: '服务中', auth: '角色+用户', service: true, tags: 2 },
  { id: '68', name: '床位使用率', stage: '已授权', auth: '角色', service: true, tags: 2 },
  { id: '168', name: 'DRG 组数（CMI）', stage: '已发布', auth: '部门', service: true, tags: 2 },
  { id: '139', name: '门诊预约率', stage: '已固化', auth: '未授权', service: false, tags: 1 },
  { id: '201', name: '住院预约等待时间', stage: '配置中', auth: '未授权', service: false, tags: 0 },
];

const schedSeed: SchedJob[] = [
  { id: 'IS-01', name: '日批指标固化', executor: 'ind-exec-a', cron: '每日 02:00', last: '02:18', status: '成功' },
  { id: 'IS-02', name: '实时在院刷新', executor: 'ind-exec-b', cron: '每 5 分钟', last: '14:20', status: '运行中' },
  { id: 'IS-03', name: '国考月指标补跑', executor: 'ind-exec-a', cron: '手工', last: '13:40', status: '补跑中' },
  { id: 'IS-04', name: 'DRG 周聚合', executor: 'ind-exec-c', cron: '每周一 03:00', last: '周一 03:22', status: '失败' },
];

const lifeSteps = ['定义', '配置', '固化', '发布', '授权', '服务'] as const;

/** B8 指标管理：基础配置 · 市场▲ · 开发 · 生命周期 · 调度 */
export function IndicatorHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('market');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('全部指标');
  const [type, setType] = useState('');
  const [active, setActive] = useState<typeof indicators[0] | null>(null);
  const [cq, setCq] = useState('');
  const [devRows, setDevRows] = useState(devSeed);
  const [activeDev, setActiveDev] = useState<DevItem | null>(null);
  const [newDev, setNewDev] = useState(false);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState(schedSeed);
  const [dtype, setDtype] = useState('');
  const [lifeQ, setLifeQ] = useState('');

  const marketRows = useMemo(() => indicators.filter((i) =>
    (!q || (i.name + i.code + i.tags.join('')).includes(q))
    && (!type || i.type === type)
    && (cat === '全部指标' || i.category.includes(cat.replace('指标', '')) || i.tags.some((t) => cat.includes(t)))
  ).slice(0, 12), [q, cat, type]);

  const cfgRows = useMemo(() => dimsSeed.filter((d) =>
    (d.id + d.name + d.kind).toLowerCase().includes(cq.toLowerCase())
  ), [cq]);

  const filteredDev = useMemo(() => devRows.filter((d) =>
    (!dtype || d.type === dtype)
  ), [devRows, dtype]);

  const lifeRows = useMemo(() => lifeSeed.filter((l) =>
    (l.id + l.name).includes(lifeQ)
  ), [lifeQ]);

  const advanceDev = async (d: DevItem) => {
    setBusy(true);
    setTab('develop');
    await new Promise((r) => setTimeout(r, 800));
    const next: DevItem['status'] =
      d.status === '开发中' ? '已固化'
        : d.status === '已固化' ? '已发布'
          : d.status === '已发布' ? '已停用'
            : '开发中';
    setDevRows((arr) => arr.map((x) => x.id === d.id ? { ...x, status: next } : x));
    setActiveDev((x) => x && x.id === d.id ? { ...x, status: next } : x);
    setBusy(false);
    notify(`${d.name} → ${next}`);
  };

  const authorize = (name: string) => {
    notify(`${name} 授权已生效 · 可调用统一指标服务`);
    setTab('lifecycle');
  };

  const rerunJob = async (j: SchedJob) => {
    setBusy(true);
    setTab('schedule');
    await new Promise((r) => setTimeout(r, 700));
    setJobs((arr) => arr.map((x) => x.id === j.id ? { ...x, status: '成功', last: '14:22' } : x));
    setBusy(false);
    notify(`${j.name} 补跑/重跑成功 · 日志已记录`);
  };

  return (
    <>
      <PageHeader
        eyebrow="INDICATOR PLATFORM · B8"
        title="指标管理"
        desc="B8-01 基础配置 · B8-02 指标市场▲ · B8-03 指标开发 · B8-04 生命周期 · B8-05 调度管理。"
        actions={
          <>
            <Btn icon="network" onClick={() => go('/center/graph')}>依赖图谱</Btn>
            <Btn icon="tags" onClick={() => go('/bid/tag-board')}>标签</Btn>
            <Btn icon="store" onClick={() => go('/center/marketplace')}>数据服务</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setTab('develop'); setNewDev(true); }}>开发指标</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '基础配置', d: '维度·字典·函数' },
          { n: '02', t: '市场▲', d: '发现·授权·调用' },
          { n: '03', t: '开发', d: '原子/派生/复合/实时' },
          { n: '04', t: '生命周期', d: '固化·发布·服务' },
          { n: '05', t: '调度', d: '执行器·补跑·日志' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['config', 'market', 'develop', 'lifecycle', 'schedule'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 4 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 2,572 项 · 已授权 2,186</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="可复用配置" value={String(dimsSeed.length)} unit="项" delta="维度/字典/函数" icon="sliders" tone="blue" onClick={() => setTab('config')} />
        <StatCard label="指标市场" value="2,572" unit="项" delta="▲ 可订阅" icon="store" tone="violet" onClick={() => setTab('market')} />
        <StatCard label="开发中" value={String(devRows.filter((d) => d.status === '开发中').length)} unit="个" delta="四类可创建" icon="code" tone="cyan" onClick={() => setTab('develop')} />
        <StatCard label="调度任务" value={String(jobs.length)} unit="个" delta="可补跑" icon="clock" tone="green" onClick={() => setTab('schedule')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'config', label: '基础配置', count: dimsSeed.length },
          { key: 'market', label: '指标市场 ▲', count: marketRows.length },
          { key: 'develop', label: '指标开发', count: devRows.length },
          { key: 'lifecycle', label: '生命周期', count: lifeSeed.length },
          { key: 'schedule', label: '调度管理', count: jobs.length },
        ]}
      />

      {tab === 'config' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="数据信息 / 系统配置" subtitle="维度 · 字典 · 函数 · 字段类型可复用" noPad actions={
              <SearchInput value={cq} onChange={setCq} placeholder="搜索配置" width={180} />
            }>
              <div className="pad-h">
                <DataTable rows={cfgRows} pageSize={8} columns={[
                  { key: 'id', title: '编号', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'kind', title: '类型', width: 80, render: (r) => <Badge tone="slate">{r.kind}</Badge> },
                  { key: 'name', title: '名称', render: (r) => r.name },
                  { key: 'refs', title: '引用', width: 70, align: 'right', render: (r) => r.refs.toLocaleString() },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '启用' ? 'green' : 'slate'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <Card title="数据源与信息模型" subtitle="采集 / 审核">
              <div className="ind-src-list">
                {sources.map((s) => (
                  <div key={s.name}>
                    <strong className="mono-cell">{s.name}</strong>
                    <small>{s.kind}</small>
                    <Badge tone={s.status === '已审核' || s.status === '已采集' ? 'green' : 'amber'}>{s.status}</Badge>
                  </div>
                ))}
              </div>
              <Btn className="mt-10" size="sm" icon="database" onClick={() => go('/center/sources')}>数据源管理</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'market' && (
        <>
          <div className="market-hero mt-14">
            <div className="market-hero-left">
              <span className="portal-eyebrow">DATA AS A PRODUCT</span>
              <h2>找到可信指标，直接用于分析</h2>
              <p>2,572 项指标已完成口径审核、血缘登记与权限分级，支持一键订阅、API 调用与 BI 分析。</p>
              <div className="market-search">
                <Icon name="search" size={16} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索指标名称、编码、标签…" />
                <Btn size="sm" variant="primary" onClick={() => notify(marketRows.length ? `找到 ${marketRows.length} 项` : '无结果')}>搜索</Btn>
              </div>
              <div className="market-hot">
                热门：
                <button type="button" onClick={() => setQ('门诊')}>门诊人次</button>
                <button type="button" onClick={() => setQ('手术')}>手术台次</button>
                <button type="button" onClick={() => setQ('DRG')}>DRG 组数</button>
                <button type="button" onClick={() => setQ('床位')}>床位使用率</button>
              </div>
            </div>
            <div className="market-hero-right">
              <div><span>指标总数</span><strong>2,572</strong></div>
              <div><span>今日访问</span><strong>1,286</strong></div>
              <div><span>已授权</span><strong>2,186</strong></div>
              <div><span>订阅部门</span><strong>18</strong></div>
              <div className="market-badge"><Badge tone="green" dot>指标服务正常</Badge></div>
            </div>
          </div>
          <div className="market-filters">
            <div className="market-cats">{marketCats.map((c) => <button key={c} type="button" className={cat === c ? 'is-active' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
            <div className="filter-bar">
              <Select value={type} onChange={setType} options={['', '原子指标', '派生指标', '复合指标']} placeholder="全部类型" width={100} />
              <span className="muted xs">共 {marketRows.length} 项</span>
            </div>
          </div>
          <div className="market-grid">
            {marketRows.map((i) => (
              <button type="button" className="market-card" key={i.id} onClick={() => setActive(i)}>
                <div className="mc-top">
                  <Badge tone={i.type === '原子指标' ? 'blue' : i.type === '派生指标' ? 'violet' : 'cyan'}>{i.type}</Badge>
                  <Badge tone={i.status === '已发布' ? 'green' : 'slate'} dot>{i.status}</Badge>
                  <span className="mc-access"><Icon name="eye" size={11} /> {128 + Number(i.id) * 3}</span>
                </div>
                <strong className="mc-title">{i.name}</strong>
                <p className="mc-cat">{i.category}</p>
                <div className="mc-value"><strong>{i.value}</strong><span>{i.unit}</span><Sparkline values={[8, 12, 10, 15, 13, 18, 16, 20]} color="#6755F5" width={86} height={26} /></div>
                <div className="mc-tags">{i.tags.map((t) => <span key={t}>{t}</span>)}</div>
                <div className="mc-foot"><span>负责人 {i.owner}</span><span>更新 {i.updated.slice(5, 10)}</span><em>查看详情 <Icon name="arrowright" size={11} /></em></div>
              </button>
            ))}
            <button type="button" className="market-add" onClick={() => { setTab('develop'); setNewDev(true); }}>
              <span><Icon name="plus" size={19} /></span>
              <strong>申请 / 开发新指标</strong>
              <small>提交需求或进入指标开发</small>
            </button>
          </div>
          <div className="grid grid-3 mt-14">
            <Card title="指标热度 TOP5" subtitle="近 30 天访问">
              <BarList items={indicators.slice(0, 5).map((i, idx) => ({ label: i.name, value: 1260 - idx * 160, display: `${1260 - idx * 160} 次` }))} color="#6755F5" />
            </Card>
            <Card title="指标类型分布" subtitle="原子 / 派生 / 复合">
              <Donut size={130} thickness={12} centerValue="2,572" label="指标" segments={[
                { label: '原子指标', value: 1286, color: '#6755F5' },
                { label: '派生指标', value: 986, color: '#9587FF' },
                { label: '复合指标', value: 300, color: '#0891B2' },
              ]} />
            </Card>
            <Card title="订阅动态" subtitle="最近订阅">
              <div className="exec-history">
                {[['门诊部', '门诊预约爽约人次', '08-06'], ['医务处', '手术台次', '08-06'], ['运营部', '床位使用率', '08-05'], ['医保办', 'DRG 组数（CMI）', '08-04']].map(([d, n, t]) => (
                  <div key={n}><span className="status-dot tone-blue" /><div><strong>{n}</strong><small>{d} · {t}</small></div></div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'develop' && (
        <>
          <Card className="mt-14" title="指标开发" subtitle="模型/指标模式 · 原子/派生/复合/实时 · 批量/单次/实时" noPad actions={
            <div className="filter-bar">
              <Select value={dtype} onChange={setDtype} options={['', '原子', '派生', '复合', '实时']} placeholder="全部类型" width={100} />
              <Btn size="sm" icon="plus" onClick={() => setNewDev(true)}>新建</Btn>
            </div>
          }>
            <div className="pad-h">
              <DataTable rows={filteredDev} pageSize={6} onRowClick={(r) => setActiveDev(r)} columns={[
                { key: 'id', title: '编号', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '指标', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.mode}模式 · {r.owner}</small></div> },
                { key: 'type', title: '类型', width: 64, render: (r) => <Badge tone="violet">{r.type}</Badge> },
                { key: 'calc', title: '计算', width: 64, render: (r) => <Badge tone="slate">{r.calc}</Badge> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '已发布' ? 'green' : r.status === '已固化' ? 'blue' : r.status === '已停用' ? 'red' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 100, render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="link-btn" onClick={() => advanceDev(r)}>
                      {r.status === '开发中' ? '固化' : r.status === '已固化' ? '发布' : r.status === '已发布' ? '停用' : '重启'}
                    </button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="SQL 批量指标样例" subtitle="可编辑 / 解固">
              <div className="code-sample">{`SELECT dept_id, COUNT(DISTINCT visit_id) AS mz_rc\nFROM dwd.fact_visit\nWHERE visit_date = \${bizdate}\n  AND visit_type = '门诊'\nGROUP BY dept_id;`}</div>
              <Btn className="mt-10" size="sm" icon="play" onClick={() => notify('批量计算已提交执行器')}>试算</Btn>
            </Card>
            <Card title="维度映射" subtitle="开发时绑定可复用配置">
              <div className="ind-map-list">
                {['机构维度', '时间维度', '科室字典', '同比函数'].map((m) => (
                  <div key={m}><Icon name="link" size={12} /><strong>{m}</strong><Badge tone="green">已映射</Badge></div>
                ))}
              </div>
              <Btn className="mt-10" size="sm" icon="sliders" onClick={() => setTab('config')}>打开基础配置</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'lifecycle' && (
        <>
          <Card className="mt-14" title="指标生命周期" subtitle="固化 · 发布 · 授权 · 服务 · 标签 · 多源 · 血缘导出" noPad actions={
            <SearchInput value={lifeQ} onChange={setLifeQ} placeholder="搜索指标" width={180} />
          }>
            <div className="pad-h">
              <DataTable rows={lifeRows} pageSize={6} columns={[
                { key: 'id', title: 'ID', width: 56, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '指标', render: (r) => r.name },
                { key: 'stage', title: '阶段', width: 80, render: (r) => <Badge tone="violet">{r.stage}</Badge> },
                { key: 'auth', title: '授权', width: 90 },
                { key: 'service', title: '服务', width: 64, render: (r) => <Badge tone={r.service ? 'green' : 'slate'}>{r.service ? '开' : '关'}</Badge> },
                { key: 'tags', title: '标签', width: 56, align: 'right' },
                { key: 'ops', title: '操作', width: 120, render: (r) => (
                  <div className="row-actions">
                    <button type="button" className="link-btn" onClick={() => authorize(r.name)}>授权</button>
                    <button type="button" className="link-muted" onClick={() => go('/center/graph')}>血缘</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
          <div className="ind-life-flow mt-14">
            {lifeSteps.map((s, i) => (
              <React.Fragment key={s}>
                <div className="ind-life-step is-on">
                  <em>{String(i + 1).padStart(2, '0')}</em>
                  <strong>{s}</strong>
                </div>
                {i < lifeSteps.length - 1 && <Icon name="arrowright" size={13} />}
              </React.Fragment>
            ))}
          </div>
          <div className="grid grid-3 mt-14">
            {[
              { t: '增量固化策略', d: '全日量 / 分区增量 / 按业务日' },
              { t: '统一指标服务', d: 'GET /api/v1/indicators/{code}' },
              { t: '多源与导出', d: '多仓源配置 · 清单/血缘导出' },
            ].map((x) => (
              <Card key={x.t} title={x.t} subtitle={x.d}>
                <Btn size="sm" icon="checkcircle" onClick={() => notify(`${x.t}已就绪`)}>确认</Btn>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <>
          <Card className="mt-14" title="指标调度管理" subtitle="执行器集群 · 任务 · 补跑 · 调度/执行日志" noPad>
            <div className="pad-h">
              <DataTable rows={jobs} pageSize={6} columns={[
                { key: 'id', title: '任务', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.cron}</small></div> },
                { key: 'executor', title: '执行器', width: 100, render: (r) => <span className="mono-cell">{r.executor}</span> },
                { key: 'last', title: '最近', width: 90, render: (r) => <span className="muted">{r.last}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '成功' ? 'green' : r.status === '失败' ? 'red' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 80, render: (r) => (
                  <button type="button" className="link-btn" onClick={() => rerunJob(r)}>补跑</button>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="执行器集群" subtitle="健康状态">
              <div className="ind-exec-grid">
                {[
                  { n: 'ind-exec-a', load: 62, s: '健康' },
                  { n: 'ind-exec-b', load: 78, s: '健康' },
                  { n: 'ind-exec-c', load: 91, s: '繁忙' },
                ].map((e) => (
                  <div key={e.n} className="ind-exec">
                    <strong className="mono-cell">{e.n}</strong>
                    <Badge tone={e.s === '健康' ? 'green' : 'amber'}>{e.s}</Badge>
                    <Progress value={e.load} tone={e.load > 85 ? 'amber' : 'green'} height={5} />
                    <small>负载 {e.load}%</small>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="调度 / 执行日志" subtitle="最近">
              <div className="timeline-list">
                {[
                  ['14:20', '实时在院刷新', '成功', 'exec-b · 1.2s'],
                  ['13:40', '国考月指标补跑', '补跑中', 'exec-a · 手工'],
                  ['02:18', '日批指标固化', '成功', 'exec-a · 18m'],
                  ['周一 03:22', 'DRG 周聚合', '失败', '源表超时'],
                ].map(([t, n, s, d]) => (
                  <div className="tl-item" key={t + n}>
                    <span className="tl-dot" />
                    <div className="tl-time">{t}</div>
                    <div className="tl-body"><div><strong>{n}</strong><Badge tone={s === '成功' ? 'green' : s === '失败' ? 'red' : 'amber'}>{s}</Badge></div><p>{d}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={660}
        title={active?.name || ''}
        desc={active ? `${active.code} · ${active.category}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon="bell" onClick={() => notify('指标订阅已创建')}>订阅</Btn>
            <Btn icon="key" onClick={() => active && authorize(active.name)}>申请授权</Btn>
            <Btn variant="primary" icon="code" onClick={() => notify('API 调用示例已复制')}>调用</Btn>
          </>
        }
      >
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>最新值</span><strong>{active.value} <small>{active.unit}</small></strong></div>
              <div><span>访问次数</span><strong>1,286</strong></div>
              <div><span>订阅部门</span><strong>8</strong></div>
              <div><span>状态</span><strong>{active.status}</strong></div>
            </div>
            <div className="tag-row">{active.tags.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}<Badge tone="blue">{active.type}</Badge></div>
            <div className="indicator-lifecycle mt-14">
              {lifeSteps.map((s, i) => (
                <div key={s} className={i <= 3 ? 'is-done' : ''}>
                  <span>{i < 4 ? <Icon name="check" size={11} /> : i + 1}</span>
                  <em>{s}</em>
                </div>
              ))}
            </div>
            <KeyValue className="mt-14" cols={2} items={[
              { label: '指标编码', value: active.code },
              { label: '指标类型', value: active.type },
              { label: '数据来源', value: active.source },
              { label: '更新频率', value: active.frequency },
              { label: '统计口径', value: active.caliber, wide: true },
              { label: '责任部门', value: active.dept },
              { label: '业务负责人', value: active.owner },
            ]} />
            <div className="section-title-sm mt-14">指标服务</div>
            <div className="api-code">
              <span>GET</span>
              <code>/api/v1/indicators/{active.code}</code>
              <button type="button" onClick={() => notify('API 文档已打开', 'info')}>文档</button>
            </div>
            <div className="info-note mt-14"><Icon name="shield" size={13} /><span>市场—详情—授权—调用闭环；调用需携带应用 Token。</span></div>
          </>
        )}
      </Drawer>

      <Drawer open={!!activeDev} onClose={() => setActiveDev(null)} title={activeDev?.name || ''} desc={activeDev ? `${activeDev.type} · ${activeDev.calc}` : ''} width={480}
        footer={
          <>
            <Btn onClick={() => setActiveDev(null)}>关闭</Btn>
            {activeDev && <Btn variant="primary" loading={busy} onClick={() => activeDev && advanceDev(activeDev)}>推进</Btn>}
          </>
        }
      >
        {activeDev && (
          <KeyValue cols={2} items={[
            { label: '模式', value: activeDev.mode },
            { label: '负责人', value: activeDev.owner },
            { label: '状态', value: <Badge>{activeDev.status}</Badge> },
            { label: '说明', value: '支持列表编辑、停用、解固；四类指标可创建、计算、发布。', wide: true },
          ]} />
        )}
      </Drawer>

      <Modal open={newDev} onClose={() => setNewDev(false)} title="新建指标" desc="选择开发模式与类型，进入计算与发布流水线。" width={580}
        footer={
          <>
            <Btn onClick={() => setNewDev(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `DEV-${String(devRows.length + 1).padStart(2, '0')}`;
              const row: DevItem = { id, name: '新建指标', mode: '指标', type: '原子', calc: '批量', status: '开发中', owner: '张敏' };
              setDevRows((arr) => [row, ...arr]);
              setNewDev(false);
              setActiveDev(row);
              notify('指标已创建（开发中）');
            }}>创建</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="指标名称" required className="span-2"><input className="input" placeholder="例如：门诊人次" /></Field>
          <Field label="开发模式"><Select value="指标" onChange={() => {}} options={['指标', '模型']} /></Field>
          <Field label="类型"><Select value="原子" onChange={() => {}} options={['原子', '派生', '复合', '实时']} /></Field>
          <Field label="计算方式"><Select value="批量" onChange={() => {}} options={['批量', '单次', '实时']} /></Field>
          <Field label="绑定维度"><Select value="机构+时间" onChange={() => {}} options={['机构+时间', '机构+科室+时间', '全区']} /></Field>
        </div>
      </Modal>
    </>
  );
}
