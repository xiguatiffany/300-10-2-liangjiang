'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'query' | 'report' | 'manage';

type ThemeRes = { id: string; name: string; inds: number; tables: number; owner: string };
type PivotCell = { org: string; outpatient: number; inpatient: number; surgery: number; bed: number };
type DetailRow = { id: string; date: string; org: string; dept: string; metric: string; value: string; source: string };
type ReportItem = {
  id: string; name: string; kind: '基础表' | '分组表' | '交叉表' | '主题报告';
  theme: 'PC' | '移动' | '大屏'; charts: number; status: '已发布' | '草稿' | '审核中'; owner: string; updated: string;
};
type ChartType = { id: string; name: string; group: string };
type FavItem = { id: string; name: string; kind: '主题' | '报表' | '图表'; star: boolean };
type ManageRow = { id: string; name: string; kind: string; refs: number; status: '启用' | '停用'; owner: string };

const themes: ThemeRes[] = [
  { id: 'TH-OP', name: '医院运营主题', inds: 128, tables: 28, owner: '信息中心' },
  { id: 'TH-QC', name: '医疗质量主题', inds: 86, tables: 18, owner: '质管办' },
  { id: 'TH-DRG', name: 'DRG/DIP 主题', inds: 64, tables: 12, owner: '医保办' },
  { id: 'TH-PH', name: '公共卫生主题', inds: 72, tables: 16, owner: '公卫科' },
  { id: 'TH-MY', name: '妇幼健康主题', inds: 48, tables: 10, owner: '妇幼中心' },
];

const pivotSeed: PivotCell[] = [
  { org: '两江新区人民医院', outpatient: 18642, inpatient: 1240, surgery: 386, bed: 92.4 },
  { org: '两江妇幼保健院', outpatient: 12480, inpatient: 860, surgery: 210, bed: 88.6 },
  { org: '金山街道社区卫生', outpatient: 6420, inpatient: 0, surgery: 0, bed: 0 },
  { org: '礼嘉街道社区卫生', outpatient: 5186, inpatient: 0, surgery: 0, bed: 0 },
  { org: '蔡家中心卫生院', outpatient: 4320, inpatient: 186, surgery: 24, bed: 76.2 },
];

const detailsSeed: DetailRow[] = [
  { id: 'D-01', date: '2026-10-27', org: '两江新区人民医院', dept: '呼吸内科', metric: '门诊人次', value: '426', source: 'HIS' },
  { id: 'D-02', date: '2026-10-27', org: '两江新区人民医院', dept: '普外科', metric: '手术台次', value: '18', source: '手术麻醉' },
  { id: 'D-03', date: '2026-10-27', org: '两江妇幼保健院', dept: '产科', metric: '分娩人次', value: '12', source: 'HIS' },
  { id: 'D-04', date: '2026-10-26', org: '蔡家中心卫生院', dept: '全科', metric: '门诊人次', value: '186', source: '基层 HIS' },
  { id: 'D-05', date: '2026-10-26', org: '两江新区人民医院', dept: 'ICU', metric: '床位使用率', value: '94.2%', source: '护理' },
  { id: 'D-06', date: '2026-10-25', org: '两江妇幼保健院', dept: '儿科', metric: '门诊人次', value: '312', source: 'HIS' },
];

const reportsSeed: ReportItem[] = [
  { id: 'RP-01', name: '门诊运营日报', kind: '基础表', theme: 'PC', charts: 6, status: '已发布', owner: '王思远', updated: '10-27' },
  { id: 'RP-02', name: '科室绩效分组表', kind: '分组表', theme: 'PC', charts: 4, status: '已发布', owner: '刘一鸣', updated: '10-26' },
  { id: 'RP-03', name: '机构×指标交叉分析', kind: '交叉表', theme: 'PC', charts: 3, status: '已发布', owner: '张敏', updated: '10-25' },
  { id: 'RP-04', name: '医疗质量主题报告', kind: '主题报告', theme: 'PC', charts: 12, status: '已发布', owner: '质管办', updated: '10-24' },
  { id: 'RP-05', name: '领导驾驶舱大屏', kind: '主题报告', theme: '大屏', charts: 18, status: '已发布', owner: '信息中心', updated: '10-23' },
  { id: 'RP-06', name: '基层巡查移动简报', kind: '基础表', theme: '移动', charts: 5, status: '审核中', owner: '基层卫生', updated: '10-22' },
  { id: 'RP-07', name: '国考指标周报', kind: '分组表', theme: 'PC', charts: 8, status: '草稿', owner: '医政科', updated: '10-21' },
];

const chartTypes: ChartType[] = [
  { id: 'c01', name: '柱状图', group: '对比' }, { id: 'c02', name: '条形图', group: '对比' },
  { id: 'c03', name: '折线图', group: '趋势' }, { id: 'c04', name: '面积图', group: '趋势' },
  { id: 'c05', name: '饼图', group: '构成' }, { id: 'c06', name: '环形图', group: '构成' },
  { id: 'c07', name: '雷达图', group: '对比' }, { id: 'c08', name: '散点图', group: '分布' },
  { id: 'c09', name: '气泡图', group: '分布' }, { id: 'c10', name: '热力图', group: '分布' },
  { id: 'c11', name: '漏斗图', group: '流程' }, { id: 'c12', name: '桑基图', group: '流程' },
  { id: 'c13', name: '仪表盘', group: '指标' }, { id: 'c14', name: '进度环', group: '指标' },
  { id: 'c15', name: '瀑布图', group: '对比' }, { id: 'c16', name: '箱线图', group: '分布' },
  { id: 'c17', name: '树图', group: '构成' }, { id: 'c18', name: '旭日图', group: '构成' },
  { id: 'c19', name: '词云', group: '文本' }, { id: 'c20', name: '地图', group: '空间' },
  { id: 'c21', name: '卡片 KPI', group: '指标' }, { id: 'c22', name: '交叉表', group: '表格' },
];

const favSeed: FavItem[] = [
  { id: 'F-01', name: '医院运营主题', kind: '主题', star: true },
  { id: 'F-02', name: '门诊运营日报', kind: '报表', star: true },
  { id: 'F-03', name: '领导驾驶舱大屏', kind: '报表', star: true },
  { id: 'F-04', name: '床位使用率趋势', kind: '图表', star: false },
];

const manageSeed: ManageRow[] = [
  { id: 'M-01', name: 'Doris 分析库', kind: '数据源', refs: 42, status: '启用', owner: '数仓组' },
  { id: 'M-02', name: '指标服务 API', kind: '指标', refs: 128, status: '启用', owner: '指标组' },
  { id: 'M-03', name: '运营分析域', kind: '分析域', refs: 18, status: '启用', owner: '信息中心' },
  { id: 'M-04', name: '医院运营主题', kind: '主题', refs: 24, status: '启用', owner: '信息中心' },
  { id: 'M-05', name: '门诊运营日报', kind: '报表', refs: 86, status: '启用', owner: '王思远' },
  { id: 'M-06', name: '柱状+折线组合', kind: '图表', refs: 64, status: '启用', owner: '模板库' },
  { id: 'M-07', name: '卫健委周报模板', kind: '模板', refs: 12, status: '启用', owner: '质管办' },
  { id: 'M-08', name: '质量主题月报规则', kind: '报告', refs: 8, status: '启用', owner: '质管办' },
  { id: 'M-09', name: 'PDF/Word 导出通道', kind: '导出', refs: 220, status: '启用', owner: '平台' },
  { id: 'M-10', name: 'BI 操作审计日志', kind: '日志', refs: 0, status: '启用', owner: '安全组' },
];

const trend = [
  { label: '周一', value: 16200 }, { label: '周二', value: 17840 },
  { label: '周三', value: 17120 }, { label: '周四', value: 18640 },
  { label: '周五', value: 19280 }, { label: '周六', value: 12460 }, { label: '周日', value: 9860 },
];

/** B9 自服务 BI：可视化查询 · 主题报表 · 管理中心 */
export function SelfServiceBIHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('report');
  const [themeId, setThemeId] = useState(themes[0].id);
  const [pivotMode, setPivotMode] = useState<'汇总' | '行列转换' | '多源对比'>('汇总');
  const [freeze, setFreeze] = useState(true);
  const [calcCol, setCalcCol] = useState(true);
  const [q, setQ] = useState('');
  const [rptQ, setRptQ] = useState('');
  const [rptTheme, setRptTheme] = useState('');
  const [rptKind, setRptKind] = useState('');
  const [activeRpt, setActiveRpt] = useState<ReportItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [favs, setFavs] = useState(favSeed);
  const [mgmtKind, setMgmtKind] = useState('');
  const [mgmtQ, setMgmtQ] = useState('');
  const [chartPick, setChartPick] = useState('c01');
  const [exporting, setExporting] = useState(false);

  const activeTheme = themes.find((t) => t.id === themeId) || themes[0];

  const detailRows = useMemo(() => detailsSeed.filter((d) =>
    (d.org + d.dept + d.metric).toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const reportRows = useMemo(() => reportsSeed.filter((r) =>
    (!rptTheme || r.theme === rptTheme)
    && (!rptKind || r.kind === rptKind)
    && (r.name + r.owner).toLowerCase().includes(rptQ.toLowerCase())
  ), [rptQ, rptTheme, rptKind]);

  const manageRows = useMemo(() => manageSeed.filter((m) =>
    (!mgmtKind || m.kind === mgmtKind)
    && (m.name + m.owner).toLowerCase().includes(mgmtQ.toLowerCase())
  ), [mgmtKind, mgmtQ]);

  const pivotRows = useMemo(() => pivotSeed.map((r) => ({
    ...r,
    load: calcCol ? Math.round(r.outpatient / Math.max(1, r.inpatient || 1) * 10) / 10 : undefined,
  })), [calcCol]);

  const doExport = async (fmt: 'PDF' | 'Word') => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 700));
    setExporting(false);
    notify(`${activeRpt?.name || '当前报表'} 已导出为 ${fmt}`);
  };

  const toggleFav = (id: string) => {
    setFavs((arr) => arr.map((f) => f.id === id ? { ...f, star: !f.star } : f));
    notify('关注状态已更新');
  };

  return (
    <>
      <PageHeader
        eyebrow="SELF-SERVICE BI · B9"
        title="自服务 BI"
        desc="B9-01 可视化查询 · B9-02 主题报表（22 图表 / PC·移动·大屏） · B9-03 关注与管理中心。"
        actions={
          <>
            <Btn icon="store" onClick={() => go('/bid/indicator-market')}>指标管理</Btn>
            <Btn icon="database" onClick={() => go('/center/resource-center')}>资源中心</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setTab('report'); setNewOpen(true); }}>新建报表</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '可视化查询', d: '概览·透视·明细' },
          { n: '02', t: '主题报表', d: '22 图·三端·导出' },
          { n: '03', t: '管理中心', d: '关注·资产·日志' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['query', 'report', 'manage'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 22 种图表 · 三端主题就绪</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="分析主题" value={String(themes.length)} unit="个" delta="可下钻" icon="layers" tone="blue" onClick={() => setTab('query')} />
        <StatCard label="主题报表" value={String(reportsSeed.length)} unit="份" delta="P2 可演示" icon="file" tone="violet" onClick={() => setTab('report')} />
        <StatCard label="图表组件" value="22" unit="种" delta="已入库" icon="chart" tone="cyan" onClick={() => setTab('report')} />
        <StatCard label="我的关注" value={String(favs.filter((f) => f.star).length)} unit="项" delta="可收藏" icon="mail" tone="green" onClick={() => setTab('manage')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'query', label: '可视化查询', count: themes.length },
          { key: 'report', label: '主题报表', count: reportsSeed.length },
          { key: 'manage', label: '管理中心', count: manageSeed.length },
        ]}
      />

      {tab === 'query' && (
        <div className="bi-query mt-14">
          <div className="bi-query-side">
            <Card title="资源概览" subtitle="主题 · 指标 · 表" noPad>
              <div className="bi-theme-list">
                {themes.map((t) => (
                  <button key={t.id} className={themeId === t.id ? 'is-on' : ''} onClick={() => setThemeId(t.id)}>
                    <strong>{t.name}</strong>
                    <small>{t.inds} 指标 · {t.tables} 表 · {t.owner}</small>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="mt-14" title="多源对比" subtitle="HIS / 护理 / 基层">
              <BarList items={[
                { label: 'HIS', value: 68 },
                { label: '手术麻醉', value: 22 },
                { label: '护理', value: 18 },
                { label: '基层 HIS', value: 14 },
              ]} unit="%" color="#6755F5" />
            </Card>
          </div>

          <div className="bi-query-main">
            <Card
              title={`可视化查询 · ${activeTheme.name}`}
              subtitle="汇总分析 · 行列转换 · 计算列 · 下钻 · 冻结列 · 多源对比"
              actions={
                <>
                  <Select value={pivotMode} onChange={(v) => setPivotMode(v as typeof pivotMode)} options={['汇总', '行列转换', '多源对比']} width={110} />
                  <Btn size="sm" variant={freeze ? 'secondary' : 'ghost'} onClick={() => setFreeze((v) => !v)}>{freeze ? '已冻结首列' : '冻结列'}</Btn>
                  <Btn size="sm" variant={calcCol ? 'secondary' : 'ghost'} onClick={() => setCalcCol((v) => !v)}>{calcCol ? '计算列开' : '计算列'}</Btn>
                  <Btn size="sm" variant="primary" icon="play" onClick={() => notify(`${pivotMode} 已刷新 · 可下钻明细`)}>运行分析</Btn>
                </>
              }
            >
              <div className={`bi-pivot ${freeze ? 'is-freeze' : ''}`}>
                <table>
                  <thead>
                    <tr>
                      <th>机构</th>
                      {pivotMode === '行列转换'
                        ? (<><th>指标</th><th>数值</th></>)
                        : (<>
                          <th>门诊人次</th>
                          <th>出院人次</th>
                          <th>手术台次</th>
                          <th>床位使用率%</th>
                          {calcCol && <th>人效比（计算列）</th>}
                          {pivotMode === '多源对比' && <th>对比源</th>}
                        </>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotMode === '行列转换'
                      ? pivotRows.flatMap((r) => ([
                        <tr key={`${r.org}-o`}><td>{r.org}</td><td>门诊人次</td><td><button className="link-btn" onClick={() => notify(`下钻 ${r.org} 门诊明细`)}>{r.outpatient.toLocaleString()}</button></td></tr>,
                        <tr key={`${r.org}-i`}><td>{r.org}</td><td>出院人次</td><td><button className="link-btn" onClick={() => notify(`下钻 ${r.org} 出院明细`)}>{r.inpatient.toLocaleString()}</button></td></tr>,
                      ]))
                      : pivotRows.map((r) => (
                        <tr key={r.org}>
                          <td>{r.org}</td>
                          <td><button className="link-btn" onClick={() => notify(`下钻 ${r.org} 门诊明细`)}>{r.outpatient.toLocaleString()}</button></td>
                          <td>{r.inpatient.toLocaleString()}</td>
                          <td>{r.surgery}</td>
                          <td>{r.bed || '—'}</td>
                          {calcCol && <td>{r.load ?? '—'}</td>}
                          {pivotMode === '多源对比' && <td><Badge tone="slate">HIS+护理</Badge></td>}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-2 mt-14">
              <Card title="趋势预览" subtitle="近 7 日门诊人次">
                <AreaChart data={trend} color="#6755F5" height={180} />
              </Card>
              <Card title="明细分析" subtitle="可检索 · 可导出" noPad actions={
                <SearchInput value={q} onChange={setQ} placeholder="机构/科室/指标" width={160} />
              }>
                <div className="pad-h">
                  <DataTable rows={detailRows} pageSize={5} columns={[
                    { key: 'date', title: '日期', width: 88, render: (r) => r.date },
                    { key: 'org', title: '机构', render: (r) => <div className="cell-main"><strong>{r.org}</strong><small>{r.dept}</small></div> },
                    { key: 'metric', title: '指标', width: 90, render: (r) => r.metric },
                    { key: 'value', title: '值', width: 70, render: (r) => r.value },
                    { key: 'source', title: '来源', width: 72, render: (r) => <Badge tone="slate">{r.source}</Badge> },
                  ]} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <>
          <div className="market-filters mt-14">
            <div className="market-cats">
              {['', 'PC', '移动', '大屏'].map((t) => (
                <button key={t || 'all'} className={!t && !rptTheme ? 'is-active' : rptTheme === t ? 'is-active' : ''} onClick={() => setRptTheme(t)}>
                  {t || '全部主题'}
                </button>
              ))}
            </div>
            <div className="row-actions">
              <Select value={rptKind} onChange={setRptKind} options={['', '基础表', '分组表', '交叉表', '主题报告']} placeholder="全部类型" width={110} />
              <SearchInput value={rptQ} onChange={setRptQ} placeholder="搜索报表" width={180} />
              <Btn icon="download" loading={exporting} onClick={() => doExport('PDF')}>导出 PDF</Btn>
              <Btn icon="file" loading={exporting} onClick={() => doExport('Word')}>导出 Word</Btn>
            </div>
          </div>

          <Card className="mt-14" title="主题报表" subtitle="基础 / 分组 / 交叉表 · PC / 移动 / 大屏主题 · 报告规则 · Word/PDF" noPad actions={
            <Btn size="sm" variant="primary" icon="plus" onClick={() => setNewOpen(true)}>新建</Btn>
          }>
            <div className="pad-h">
              <DataTable rows={reportRows} pageSize={8} columns={[
                { key: 'name', title: '报表', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.owner} · {r.updated}</small></div> },
                { key: 'kind', title: '类型', width: 90, render: (r) => <Badge tone={r.kind === '主题报告' ? 'violet' : 'blue'}>{r.kind}</Badge> },
                { key: 'theme', title: '主题', width: 70, render: (r) => <Badge tone={r.theme === '大屏' ? 'cyan' : r.theme === '移动' ? 'amber' : 'slate'}>{r.theme}</Badge> },
                { key: 'charts', title: '图表', width: 60, render: (r) => r.charts },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已发布' ? 'green' : r.status === '审核中' ? 'amber' : 'slate'} dot>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 150, render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => { setActiveRpt(r); setPreviewOpen(true); }}>预览</button>
                    <button className="link-muted" onClick={() => { setActiveRpt(r); doExport('PDF'); }}>PDF</button>
                    <button className="link-muted" onClick={() => notify(`${r.name} 报告规则已打开`)}>规则</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>

          <div className="grid grid-2 mt-14">
            <Card title="22 种可视化组件" subtitle="点选预览入库组件">
              <div className="bi-chart-grid">
                {chartTypes.map((c) => (
                  <button key={c.id} className={chartPick === c.id ? 'is-on' : ''} onClick={() => { setChartPick(c.id); notify(`已选组件：${c.name}`); }}>
                    <Icon name="chart" size={14} />
                    <strong>{c.name}</strong>
                    <small>{c.group}</small>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="组件预览" subtitle={chartTypes.find((c) => c.id === chartPick)?.name}>
              {['c05', 'c06'].includes(chartPick) ? (
                <Donut size={150} thickness={14} centerValue="100%" label="构成" segments={[
                  { label: '门诊', value: 62, color: '#6755F5' },
                  { label: '住院', value: 28, color: '#9587FF' },
                  { label: '其他', value: 10, color: '#0891B2' },
                ]} />
              ) : chartPick === 'c13' || chartPick === 'c14' || chartPick === 'c21' ? (
                <div className="bi-kpi-preview">
                  <div><span>门诊人次</span><strong>18,642</strong><em>+6.2%</em></div>
                  <div><span>床位使用率</span><strong>92.4%</strong><em>+1.1pt</em></div>
                  <div><span>手术台次</span><strong>386</strong><em>+4.8%</em></div>
                </div>
              ) : (
                <AreaChart data={trend} color="#0891B2" height={200} />
              )}
              <div className="table-note mt-14"><Icon name="checkcircle" size={12} /> 组件可拖入 PC / 移动 / 大屏画布，支持报告规则绑定与导出。</div>
            </Card>
          </div>
        </>
      )}

      {tab === 'manage' && (
        <>
          <div className="grid grid-2 mt-14">
            <Card title="我的关注" subtitle="主题 · 报表 · 图表收藏">
              <div className="bi-fav-list">
                {favs.map((f) => (
                  <div key={f.id}>
                    <div>
                      <strong>{f.name}</strong>
                      <small>{f.kind}</small>
                    </div>
                    <button className={f.star ? 'is-on' : ''} onClick={() => toggleFav(f.id)}>
                      <Icon name="mail" size={13} /> {f.star ? '已关注' : '关注'}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="导出与日志" subtitle="最近操作">
              <div className="check-list">
                {[
                  ['10-27 14:20', '门诊运营日报 → PDF', '成功'],
                  ['10-27 11:06', '领导驾驶舱 → 大屏发布', '成功'],
                  ['10-26 18:40', '国考指标周报 → Word', '成功'],
                  ['10-26 09:12', '交叉分析下钻明细', '审计'],
                  ['10-25 16:33', '停用草稿报表 RP-07', '变更'],
                ].map(([t, d, s]) => (
                  <div key={t}><span className={s === '成功' ? 'ok' : 'warn'}>{s === '成功' ? <Icon name="check" size={12} /> : <Icon name="alert" size={12} />}</span><strong>{d}</strong><em>{t}</em></div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-14" title="BI 管理中心" subtitle="数据源 · 指标 · 分析域 · 主题 · 报表 · 图表 · 模板 · 报告 · 导出 · 日志" noPad actions={
            <>
              <Select value={mgmtKind} onChange={setMgmtKind} options={['', '数据源', '指标', '分析域', '主题', '报表', '图表', '模板', '报告', '导出', '日志']} placeholder="全部对象" width={110} />
              <SearchInput value={mgmtQ} onChange={setMgmtQ} placeholder="搜索管理对象" width={180} />
            </>
          }>
            <div className="pad-h">
              <DataTable rows={manageRows} pageSize={8} columns={[
                { key: 'name', title: '对象', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.owner}</small></div> },
                { key: 'kind', title: '类型', width: 80, render: (r) => <Badge tone="blue">{r.kind}</Badge> },
                { key: 'refs', title: '引用', width: 70, render: (r) => r.refs },
                { key: 'status', title: '状态', width: 70, render: (r) => <Badge tone={r.status === '启用' ? 'green' : 'slate'} dot>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 100, render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => notify(`${r.name} 配置已打开`)}>配置</button>
                    <button className="link-muted" onClick={() => notify(`${r.name} 已${r.status === '启用' ? '停用' : '启用'}`)}>{r.status === '启用' ? '停用' : '启用'}</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      <Drawer open={!!activeRpt && previewOpen} onClose={() => setPreviewOpen(false)} title={activeRpt?.name || '报表预览'} width={520}
        footer={<><Btn onClick={() => setPreviewOpen(false)}>关闭</Btn><Btn icon="download" onClick={() => doExport('PDF')}>PDF</Btn><Btn variant="primary" icon="file" onClick={() => doExport('Word')}>Word</Btn></>}>
        {activeRpt && (
          <>
            <KeyValue items={[
              { label: '类型', value: activeRpt.kind },
              { label: '主题端', value: activeRpt.theme },
              { label: '图表数', value: String(activeRpt.charts) },
              { label: '状态', value: activeRpt.status },
              { label: '责任人', value: activeRpt.owner },
              { label: '更新', value: activeRpt.updated },
            ]} />
            <div className="section-title-sm mt-14">报告规则</div>
            <div className="table-note">按日/周/月自动生成 · 订阅推送 · 脱敏后导出 · 审计留痕</div>
            <div className="mt-14">
              <AreaChart data={trend} height={160} color="#6755F5" />
            </div>
          </>
        )}
      </Drawer>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="新建主题报表" desc="选择表类型与端主题，绑定图表组件后可发布与导出。" width={560}
        footer={<><Btn onClick={() => setNewOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setNewOpen(false); notify('报表已创建（草稿）· 可继续配置图表与规则'); setTab('report'); }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="报表名称" required className="span-2"><input className="input" placeholder="例如：运营分析周报" /></Field>
          <Field label="表类型"><Select value="基础表" onChange={() => {}} options={['基础表', '分组表', '交叉表', '主题报告']} /></Field>
          <Field label="端主题"><Select value="PC" onChange={() => {}} options={['PC', '移动', '大屏']} /></Field>
          <Field label="绑定主题" className="span-2"><Select value={themes[0].name} onChange={() => {}} options={themes.map((t) => t.name)} /></Field>
        </div>
      </Modal>
    </>
  );
}
