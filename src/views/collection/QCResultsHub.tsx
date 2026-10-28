'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, KeyValue, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { scoreDimensions } from '../../dataBid';

type RangeKey = 'day' | 'week' | 'month' | 'quarter';
type DimName = '' | '完整性' | '一致性' | '规范性' | '及时性' | '稳定性';
type StatusName = '' | '待处理' | '处理中' | '已修复';

type Institution = {
  name: string;
  score: number;
  pass: number;
  pending: number;
  hits: number;
  rank: number;
};

type ExceptionRow = {
  id: string;
  desc: string;
  table: string;
  dim: string;
  level: '高' | '中' | '低';
  rows: number;
  status: '待处理' | '处理中' | '已修复';
  org: string;
  rule: string;
  time: string;
};

const orgs = [
  '两江新区人民医院',
  '两江新区中医院',
  '人和社区卫生服务中心',
  '鸳鸯社区卫生服务中心',
  '大竹林社区卫生服务中心',
];

const institutionsAll: Institution[] = [
  { name: '两江新区人民医院', score: 98.2, pass: 98.6, pending: 42, hits: 28600, rank: 1 },
  { name: '两江新区中医院', score: 96.8, pass: 97.1, pending: 68, hits: 21400, rank: 2 },
  { name: '人和社区卫生服务中心', score: 95.4, pass: 96.2, pending: 86, hits: 12800, rank: 3 },
  { name: '鸳鸯社区卫生服务中心', score: 94.2, pass: 95.0, pending: 94, hits: 9600, rank: 4 },
  { name: '大竹林社区卫生服务中心', score: 92.8, pass: 93.6, pending: 96, hits: 8200, rank: 5 },
];

const exceptionsAll: ExceptionRow[] = [
  { id: 'EX-2086', desc: 'patient_id 为空', table: 'ods_his.patient', dim: '完整性', level: '高', rows: 128, status: '待处理', org: '两江新区人民医院', rule: '主键非空', time: '08-06 14:21' },
  { id: 'EX-2085', desc: 'gender_code 值域异常', table: 'ods_his.patient', dim: '一致性', level: '中', rows: 86, status: '待处理', org: '两江新区中医院', rule: '值域合法', time: '08-06 14:18' },
  { id: 'EX-2084', desc: 'report_time 晚于入仓时间', table: 'ods_lis.lab_report', dim: '及时性', level: '中', rows: 42, status: '处理中', org: '人和社区卫生服务中心', rule: '15 分钟入仓', time: '08-06 14:12' },
  { id: 'EX-2083', desc: 'dept_code 无法关联科室维度', table: 'dwd.fact_visit', dim: '一致性', level: '低', rows: 36, status: '已修复', org: '鸳鸯社区卫生服务中心', rule: '关联完整性', time: '08-06 13:58' },
  { id: 'EX-2082', desc: '身份证号校验位错误', table: 'ods_his.patient', dim: '规范性', level: '高', rows: 24, status: '待处理', org: '大竹林社区卫生服务中心', rule: '身份证校验', time: '08-06 13:40' },
  { id: 'EX-2081', desc: '诊断编码非国标', table: 'dwd.fact_visit', dim: '规范性', level: '中', rows: 58, status: '待处理', org: '两江新区人民医院', rule: 'ICD-10 值域', time: '08-06 13:22' },
  { id: 'EX-2080', desc: '随访记录缺失', table: 'dwd.fact_followup', dim: '完整性', level: '高', rows: 74, status: '处理中', org: '两江新区中医院', rule: '必填关联', time: '08-06 12:55' },
  { id: 'EX-2079', desc: '接口连续失败超阈值', table: 'ods_his.outpatient', dim: '稳定性', level: '高', rows: 12, status: '待处理', org: '人和社区卫生服务中心', rule: '连续失败 ≤3', time: '08-06 12:30' },
  { id: 'EX-2078', desc: '血压值逻辑冲突', table: 'dwd.fact_vital', dim: '一致性', level: '中', rows: 31, status: '已修复', org: '鸳鸯社区卫生服务中心', rule: 'SBP≥DBP', time: '08-06 11:48' },
  { id: 'EX-2077', desc: '开单时间晚于报告时间', table: 'ods_lis.lab_report', dim: '及时性', level: '低', rows: 19, status: '待处理', org: '大竹林社区卫生服务中心', rule: '时序合法', time: '08-06 11:10' },
];

const rangeMeta: Record<RangeKey, { label: string; pass: number; pending: number; hits: string; rankDelta: string; trendBoost: number }> = {
  day: { label: '近 24 小时', pass: 97.2, pending: 86, hits: '1.8', rankDelta: '持平', trendBoost: 0.4 },
  week: { label: '近一周', pass: 96.9, pending: 214, hits: '6.4', rankDelta: '+1', trendBoost: 0.2 },
  month: { label: '近一月', pass: 96.7, pending: 386, hits: '12.6', rankDelta: '+2', trendBoost: 0 },
  quarter: { label: '近一季', pass: 95.8, pending: 986, hits: '38.2', rankDelta: '+3', trendBoost: -0.6 },
};

const dimLabels = ['完整', '一致', '规范', '及时', '稳定', '关联', '唯一'];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildTrend(range: RangeKey, org: string, dim: DimName) {
  const base = [
    { label: '03', value: 94.2 }, { label: '04', value: 95.0 }, { label: '05', value: 94.6 },
    { label: '06', value: 95.8 }, { label: '07', value: 96.2 }, { label: '08', value: 96.7 },
  ];
  const orgAdj = org ? ((hash(org) % 20) - 10) / 10 : 0;
  const dimAdj = dim ? ((hash(dim) % 16) - 8) / 10 : 0;
  const boost = rangeMeta[range].trendBoost;
  return base.map((p, i) => ({
    ...p,
    value: Math.min(99.5, Math.max(90, +(p.value + orgAdj + dimAdj + boost + i * 0.05).toFixed(1))),
  }));
}

const dimRowMap: Record<string, number> = {
  完整性: 0, 一致性: 1, 规范性: 2, 及时性: 3, 稳定性: 4,
};

function buildHeatmap(org: string, dim: DimName) {
  const seed = hash(org + dim) % 7;
  const focus = dim ? dimRowMap[dim] : -1;
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 12 }, (_, m) => {
      let v = 88 + ((d * 7 + m * 3 + seed) % 11);
      if (focus >= 0 && d === focus) v = Math.min(99, v + 3);
      if (focus >= 0 && d !== focus) v = Math.max(88, v - 2);
      return v;
    }),
  );
}

type AcceptPhase = 'filter' | 'rank' | 'export';

/** A5-06 ★ 质控结果统计：筛选联动 · 排名下钻 · 明细导出 */
export function QCResultsHubPage() {
  const { go, notify } = useApp();
  const [org, setOrg] = useState('');
  const [range, setRange] = useState<RangeKey>('month');
  const [dim, setDim] = useState<DimName>('');
  const [status, setStatus] = useState<StatusName>('');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<ExceptionRow | null>(null);
  const [drillOrg, setDrillOrg] = useState<Institution | null>(null);
  const [heatCell, setHeatCell] = useState<{ dim: string; month: number; value: number } | null>(null);
  const [phase, setPhase] = useState<AcceptPhase>('filter');
  const [filtered, setFiltered] = useState(false);
  const [ranked, setRanked] = useState(false);
  const [exported, setExported] = useState(false);
  const [demoing, setDemoing] = useState(false);

  const meta = rangeMeta[range];

  const institutions = useMemo(() => {
    let list = institutionsAll.map((i) => ({ ...i }));
    if (org) list = list.filter((i) => i.name === org);
    // mild score shift by range
    const adj = range === 'day' ? 0.4 : range === 'quarter' ? -0.8 : 0;
    return list
      .map((i) => ({
        ...i,
        score: +(i.score + adj).toFixed(1),
        pass: +(i.pass + adj * 0.5).toFixed(1),
        pending: Math.max(8, Math.round(i.pending * (range === 'day' ? 0.22 : range === 'week' ? 0.55 : range === 'quarter' ? 2.4 : 1))),
      }))
      .sort((a, b) => b.score - a.score);
  }, [org, range]);

  const exceptions = useMemo(() => {
    return exceptionsAll.filter((e) => {
      if (org && e.org !== org) return false;
      if (dim && e.dim !== dim) return false;
      if (status && e.status !== status) return false;
      if (q && !(e.id + e.desc + e.table + e.rule + e.org).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [org, dim, status, q]);

  const trend = useMemo(() => buildTrend(range, org, dim), [range, org, dim]);
  const heatmap = useMemo(() => buildHeatmap(org, dim), [org, dim]);

  const passRate = useMemo(() => {
    if (org) {
      const hit = institutions[0];
      return hit ? hit.pass.toFixed(1) : meta.pass.toFixed(1);
    }
    let v = meta.pass;
    if (dim) v = +(v - 0.4 + (hash(dim) % 8) / 10).toFixed(1);
    return v.toFixed(1);
  }, [org, dim, institutions, meta.pass]);

  const pendingCount = useMemo(() => {
    if (org || dim || status) return exceptions.filter((e) => e.status !== '已修复').length * 18 + exceptions.length;
    return meta.pending;
  }, [org, dim, status, exceptions, meta.pending]);

  const hitsLabel = useMemo(() => {
    if (org) {
      const hit = institutionsAll.find((i) => i.name === org);
      const scale = range === 'day' ? 0.14 : range === 'week' ? 0.5 : range === 'quarter' ? 3 : 1;
      return hit ? ((hit.hits * scale) / 10000).toFixed(1) : meta.hits;
    }
    return meta.hits;
  }, [org, range, meta.hits]);

  const dimSegments = useMemo(() => {
    return scoreDimensions.map((d) => {
      let score = d.score;
      if (dim && d.name !== dim) score = Math.max(90, score - 2.2);
      if (dim && d.name === dim) score = Math.min(99.2, score + 0.8);
      if (org) score = Math.min(99.2, score + ((hash(org + d.name) % 10) - 5) / 10);
      return { label: d.name, value: +score.toFixed(1), color: d.color };
    });
  }, [dim, org]);

  const centerScore = useMemo(() => {
    const avg = dimSegments.reduce((s, d) => s + d.value, 0) / dimSegments.length;
    return avg.toFixed(1);
  }, [dimSegments]);

  const filterChips = [
    org && { key: 'org', label: org },
    dim && { key: 'dim', label: dim },
    status && { key: 'status', label: status },
    range !== 'month' && { key: 'range', label: meta.label },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilters = () => {
    setOrg('');
    setDim('');
    setStatus('');
    setRange('month');
    setQ('');
    setHeatCell(null);
    setPhase('filter');
    notify('已清除全部筛选');
  };

  const exportDetail = () => {
    setPhase('export'); setExported(true);
    notify(`已导出异常明细 ${exceptions.length} 条（CSV）· 筛选：${org || '全部机构'} / ${dim || '全部维度'} / ${meta.label}`);
  };

  const exportReport = () => {
    setPhase('export'); setExported(true);
    notify(`质控报告已生成（PDF）· 通过率 ${passRate}% · 待处理 ${pendingCount}`);
  };

  const openOrgDrill = (inst: Institution) => {
    setDrillOrg(inst);
    setOrg(inst.name);
    setPhase('rank'); setRanked(true); setFiltered(true);
    notify(`已下钻机构：${inst.name}，明细已联动筛选`);
  };

  const demoAccept = async () => {
    setDemoing(true);
    setPhase('filter'); setDim('完整性'); setRange('week'); setFiltered(true);
    notify('① 筛选联动：完整性 · 近一周');
    await new Promise((r) => setTimeout(r, 450));
    const target = institutionsAll.find((i) => i.rank >= 35) || institutionsAll[institutionsAll.length - 1];
    openOrgDrill(target);
    notify('② 排名下钻：末位机构明细');
    await new Promise((r) => setTimeout(r, 450));
    exportDetail();
    notify('③ 明细导出完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="QUALITY ANALYTICS · A5-06 ★"
        title="质控结果统计"
        desc="验收：筛选联动 → 排名下钻 → 明细导出；按机构/时间/维度统计通过率、趋势与热力。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="download" onClick={exportReport}>导出报告</Btn>
            <Btn variant="primary" icon="download" onClick={exportDetail}>导出明细</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '筛选联动', d: '机构 · 时间 · 维度', k: 'filter' as const, on: filtered || !!org || !!dim },
          { n: '02', t: '排名下钻', d: '点击机构看明细', k: 'rank' as const, on: ranked },
          { n: '03', t: '明细导出', d: 'CSV / PDF 报告', k: 'export' as const, on: exported },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${phase === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {exported ? '导出完成' : ranked ? '已下钻' : filtered ? '筛选已联动' : '统计口径 v2.1'} · 42 家机构</span>
      </div>

      <div className="qc-filter mt-14">
        <div className="filter-bar">
          <Select
            value={org}
            onChange={(v) => setOrg(v)}
            options={['', ...orgs]}
            placeholder="全部机构"
            width={168}
          />
          <Tabs
            variant="pill"
            value={range}
            onChange={(k) => setRange(k as RangeKey)}
            items={[
              { key: 'day', label: '近 24 小时' },
              { key: 'week', label: '近一周' },
              { key: 'month', label: '近一月' },
              { key: 'quarter', label: '近一季' },
            ]}
          />
          <Select
            value={dim}
            onChange={(v) => setDim(v as DimName)}
            options={['', '完整性', '一致性', '规范性', '及时性', '稳定性']}
            placeholder="全部维度"
            width={120}
          />
          <Select
            value={status}
            onChange={(v) => setStatus(v as StatusName)}
            options={['', '待处理', '处理中', '已修复']}
            placeholder="全部状态"
            width={110}
          />
          {filterChips.length > 0 && (
            <button type="button" className="link-muted" onClick={clearFilters}>
              <Icon name="x" size={12} /> 清除筛选
            </button>
          )}
        </div>
        <span className="muted xs">
          统计时间：2026-08-06 14:21 · 当前结果 {exceptions.length} 条异常
          {filterChips.length > 0 && (
            <> · 已选 {filterChips.map((c) => c.label).join(' / ')}</>
          )}
        </span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard
          label="质控通过率"
          value={passRate}
          unit="%"
          delta={`${meta.rankDelta === '持平' ? '环比持平' : `排名 ${meta.rankDelta}`} · ${meta.label}`}
          icon="checkcircle"
          tone="green"
        />
        <StatCard
          label="待处理异常"
          value={String(pendingCount)}
          unit="条"
          delta={status ? `状态：${status}` : '较昨日 -42'}
          icon="circlealert"
          tone="amber"
          onClick={() => { setStatus('待处理'); setDim(''); }}
        />
        <StatCard
          label="规则命中"
          value={hitsLabel}
          unit="万次"
          delta={dim ? `维度：${dim}` : '覆盖 486 条规则'}
          icon="target"
          tone="blue"
        />
        <StatCard
          label="数据质量排名"
          value={org ? `第 ${institutions[0]?.rank || '—'}` : '第 2'}
          unit="名"
          delta={org || '全区综合'}
          icon="chart"
          tone="violet"
          onClick={() => notify('机构排名面板已定位', 'info')}
        />
      </div>

      <div className="grid-2-1 mt-14">
        <Card
          title="质量趋势"
          subtitle={`${meta.label}${org ? ` · ${org}` : ''}${dim ? ` · ${dim}` : ''}`}
          actions={<Badge tone="green">筛选已联动</Badge>}
        >
          <AreaChart data={trend} height={205} color="#059669" suffix=" 分" valueName="综合得分" domainMin={90} domainMax={100} />
        </Card>
        <Card title="五维质量分布" subtitle={dim ? `突出：${dim}` : '按规则命中权重'}>
          <Donut
            size={150}
            thickness={13}
            centerValue={centerScore}
            label="综合得分"
            segments={dimSegments.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          />
          <div className="qc-dim-chips mt-10">
            {dimSegments.map((d) => (
              <button
                key={d.label}
                type="button"
                className={`qc-dim-chip ${dim === d.label ? 'is-on' : ''}`}
                onClick={() => setDim(dim === d.label ? '' : (d.label as DimName))}
              >
                <i style={{ background: d.color }} />
                {d.label}
                <em>{d.value}</em>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid-2-1 mt-14">
        <Card
          title="机构质量排名"
          subtitle="点击行下钻 · 联动异常明细"
          actions={<button type="button" className="link-btn" onClick={() => { setOrg(''); notify('已显示全部机构排名', 'info'); }}>全部 {institutionsAll.length} 家</button>}
        >
          <div className="qc-rank-list">
            {institutions.map((i, idx) => (
              <button
                key={i.name}
                type="button"
                className={`qc-rank-row ${org === i.name ? 'is-on' : ''}`}
                onClick={() => openOrgDrill(i)}
              >
                <span className={`rank ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
                <div className="qc-rank-main">
                  <div>
                    <strong>{i.name}</strong>
                    <small>通过率 {i.pass}% · 待处理 {i.pending}</small>
                  </div>
                  <div className="qc-rank-track"><i style={{ width: `${Math.min(100, i.score)}%` }} /></div>
                </div>
                <em>{i.score}</em>
                <Icon name="chevronright" size={12} />
              </button>
            ))}
          </div>
        </Card>
        <Card title="规则热力分布" subtitle="维度 × 月份 · 通过率 · 点击单元格筛选维度">
          <div className="qc-heatmap">
            <div className="heat-head">
              <span />
              {Array.from({ length: 12 }, (_, i) => <span key={i}>{String(i + 1).padStart(2, '0')}</span>)}
            </div>
            {heatmap.map((row, ri) => {
              const focusIdx = dim ? dimRowMap[dim] : -1;
              const rowDim = (['完整性', '一致性', '规范性', '及时性', '稳定性', '一致性', '规范性'] as DimName[])[ri] || '';
              return (
                <div className={`heat-row ${focusIdx === ri ? 'is-focus' : dim ? 'is-dim' : ''}`} key={ri}>
                  <span>{dimLabels[ri]}</span>
                  {row.map((v, ci) => (
                    <i
                      key={ci}
                      title={`${dimLabels[ri]} · ${ci + 1}月 · ${v}%`}
                      className={heatCell?.dim === dimLabels[ri] && heatCell.month === ci + 1 ? 'is-pick' : ''}
                      style={{
                        background: v >= 97 ? '#059669' : v >= 94 ? '#5AC4A8' : v >= 91 ? '#E9C06D' : '#E79AA5',
                        opacity: 0.55 + (v - 88) / 30,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setDim(rowDim);
                        setHeatCell({ dim: dimLabels[ri], month: ci + 1, value: v });
                        notify(`热力下钻：${dimLabels[ri]} · ${ci + 1}月 · 通过率 ${v}%`);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          {heatCell && (
            <div className="info-note mt-10">
              <Icon name="target" size={12} />
              <span>已选 {heatCell.dim} / {heatCell.month}月 · 通过率 {heatCell.value}% · 异常明细已按维度联动</span>
            </div>
          )}
        </Card>
      </div>

      <Card
        className="mt-14"
        title="异常明细"
        subtitle={`共 ${exceptions.length} 条 · 筛选结果可导出`}
        noPad
        actions={
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="搜索异常 / 表 / 规则" width={200} />
            <Btn size="sm" icon="download" onClick={exportDetail}>导出明细</Btn>
          </div>
        }
      >
        <div className="pad-h">
          <DataTable
            rows={exceptions}
            pageSize={6}
            onRowClick={(r) => setActive(r)}
            columns={[
              { key: 'id', title: '异常ID', width: 96, render: (r) => <span className="mono-cell">{r.id}</span> },
              { key: 'desc', title: '异常描述', render: (r) => <div className="cell-main"><strong>{r.desc}</strong><small>{r.table} · {r.org}</small></div> },
              { key: 'dim', title: '维度', width: 80, render: (r) => <Badge tone="slate">{r.dim}</Badge> },
              { key: 'level', title: '等级', width: 68, render: (r) => <Badge tone={r.level === '高' ? 'red' : r.level === '中' ? 'amber' : 'slate'}>{r.level}</Badge> },
              { key: 'rows', title: '影响行数', width: 92, align: 'right', render: (r) => <span className="text-red strong">{r.rows}</span> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已修复' ? 'green' : r.status === '处理中' ? 'blue' : 'amber'} dot>{r.status}</Badge> },
              {
                key: 'ops', title: '操作', width: 100,
                render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="link-btn" onClick={() => setActive(r)}>下钻</button>
                    <button type="button" className="link-muted" onClick={() => notify(`${r.id} 已分派`)}>处理</button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={560}
        title={active?.desc || ''}
        desc={active ? `${active.id} · ${active.table}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/qc-designer')}>查看流程</Btn>
            <Btn variant="primary" onClick={() => { setActive(null); notify('异常已分派给责任人'); }}>分派处理</Btn>
          </>
        }
      >
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>影响行数</span><strong className="text-red">{active.rows}</strong></div>
              <div><span>质量维度</span><strong>{active.dim}</strong></div>
              <div><span>等级</span><strong>{active.level}</strong></div>
              <div><span>状态</span><strong>{active.status}</strong></div>
            </div>
            <KeyValue
              className="mt-14"
              cols={2}
              items={[
                { label: '所属机构', value: active.org },
                { label: '发现时间', value: `2026-${active.time}` },
                { label: '数据表', value: active.table },
                { label: '违反规则', value: active.rule },
                { label: '修正建议', value: '核查上游接口与源端数据，补充缺失字段并重跑质控任务。', wide: true },
              ]}
            />
          </>
        )}
      </Drawer>

      <Drawer
        open={!!drillOrg}
        onClose={() => setDrillOrg(null)}
        width={520}
        title={drillOrg?.name || ''}
        desc={drillOrg ? `综合得分 ${drillOrg.score} · 排名第 ${drillOrg.rank}` : ''}
        footer={
          <>
            <Btn onClick={() => setDrillOrg(null)}>关闭</Btn>
            <Btn icon="download" onClick={() => notify(`${drillOrg?.name} 机构质控明细已导出`)}>导出该机构</Btn>
            <Btn variant="primary" onClick={() => setDrillOrg(null)}>保留筛选</Btn>
          </>
        }
      >
        {drillOrg && (
          <>
            <div className="drawer-summary">
              <div><span>通过率</span><strong className="text-green">{drillOrg.pass}%</strong></div>
              <div><span>待处理</span><strong className="text-amber">{drillOrg.pending}</strong></div>
              <div><span>规则命中</span><strong>{(drillOrg.hits / 10000).toFixed(1)} 万</strong></div>
              <div><span>全区排名</span><strong>第 {drillOrg.rank}</strong></div>
            </div>
            <div className="section-title-sm mt-14">该机构异常（已联动主表）</div>
            <div className="qc-org-ex-list mt-10">
              {exceptionsAll.filter((e) => e.org === drillOrg.name).map((e) => (
                <button key={e.id} type="button" className="qc-org-ex" onClick={() => { setActive(e); setDrillOrg(null); }}>
                  <Badge tone={e.level === '高' ? 'red' : 'amber'}>{e.level}</Badge>
                  <div>
                    <strong>{e.desc}</strong>
                    <small>{e.dim} · {e.status} · {e.rows} 行</small>
                  </div>
                  <Icon name="chevronright" size={12} />
                </button>
              ))}
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
