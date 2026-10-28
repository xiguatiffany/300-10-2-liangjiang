'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, PageHeader, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type Role = 'user' | 'admin';
type View = 'cdc' | 'std';
type Period = 'day' | 'week' | 'month';

const periodLabel: Record<Period, string> = { day: '按天', week: '按周', month: '按月' };

const syncTrend = {
  day: [
    { label: '08-01', value: 126 }, { label: '08-02', value: 142 }, { label: '08-03', value: 138 },
    { label: '08-04', value: 156 }, { label: '08-05', value: 168 }, { label: '08-06', value: 174 },
  ],
  week: [
    { label: 'W27', value: 820 }, { label: 'W28', value: 910 }, { label: 'W29', value: 886 },
    { label: 'W30', value: 964 }, { label: 'W31', value: 1012 }, { label: 'W32', value: 1086 },
  ],
  month: [
    { label: '3月', value: 2860 }, { label: '4月', value: 3120 }, { label: '5月', value: 3340 },
    { label: '6月', value: 3510 }, { label: '7月', value: 3720 }, { label: '8月', value: 2180 },
  ],
};

const schemaChangeTrend = {
  day: [
    { label: '08-01', value: 2 }, { label: '08-02', value: 5 }, { label: '08-03', value: 1 },
    { label: '08-04', value: 8 }, { label: '08-05', value: 3 }, { label: '08-06', value: 6 },
  ],
  week: [
    { label: 'W27', value: 12 }, { label: 'W28', value: 18 }, { label: 'W29', value: 9 },
    { label: 'W30', value: 22 }, { label: 'W31', value: 15 }, { label: 'W32', value: 19 },
  ],
  month: [
    { label: '3月', value: 46 }, { label: '4月', value: 52 }, { label: '5月', value: 61 },
    { label: '6月', value: 48 }, { label: '7月', value: 73 }, { label: '8月', value: 28 },
  ],
};

const hotChangeTables = [
  { table: 'HISDB.dbo.PATIENT', org: '重医附二院', changes: 18, last: '08-06 11:20', type: '新增字段' },
  { table: 'LIS_PROD.dbo.REPORT_MAIN', org: '两江医院', changes: 12, last: '08-06 09:40', type: '类型变更' },
  { table: 'EMRDB.dbo.VISIT', org: '渝北人民医院', changes: 9, last: '08-05 16:12', type: '字段重命名' },
  { table: 'HISDB.dbo.ORDERS', org: '重医附二院', changes: 7, last: '08-05 14:05', type: '新增字段' },
  { table: 'RISDB.dbo.STUDY', org: '两江医院', changes: 6, last: '08-04 18:22', type: '删除字段' },
];

const orgStdRank = [
  { org: '重医附二院', rate: 92.6, tables: 486, done: 450 },
  { org: '两江医院', rate: 86.4, tables: 312, done: 270 },
  { org: '渝北人民医院', rate: 78.2, tables: 228, done: 178 },
  { org: '两江妇幼', rate: 71.5, tables: 186, done: 133 },
  { org: '两江疾控', rate: 64.8, tables: 142, done: 92 },
];

const sourceHealth = [
  { name: 'HIS-重医附二院', status: '稳定', latency: 12, uptime: 99.8 },
  { name: 'LIS-两江医院', status: '波动', latency: 86, uptime: 97.2 },
  { name: 'EMR-渝北人民', status: '稳定', latency: 18, uptime: 99.5 },
  { name: 'HIS-两江医院', status: '中断风险', latency: 240, uptime: 91.4 },
  { name: '公卫-两江疾控', status: '稳定', latency: 24, uptime: 99.1 },
];

export function AccessPanoramaPage() {
  const { go, notify } = useApp();
  const [role, setRole] = useState<Role>('user');
  const [view, setView] = useState<View>('cdc');
  const [period, setPeriod] = useState<Period>('day');
  const [demoing, setDemoing] = useState(false);
  const [drillOk, setDrillOk] = useState(false);
  const [periodOk, setPeriodOk] = useState(false);

  const syncData = syncTrend[period];
  const changeData = schemaChangeTrend[period];

  const connectedPct = 78.6;
  const shouldConnect = 42;
  const connected = 33;

  const stdSuccess = useMemo(() => ({ day: 94.2, week: 92.8, month: 91.5 })[period], [period]);
  const avgCost = useMemo(() => ({ day: 18, week: 22, month: 26 })[period], [period]);
  const maxCost = useMemo(() => ({ day: 86, week: 124, month: 186 })[period], [period]);

  const demoAccept = async () => {
    setDemoing(true);
    setView('cdc'); setRole('admin'); setPeriod('day');
    notify('① CDC 全景 · 天粒度');
    await new Promise((r) => setTimeout(r, 400));
    setPeriod('week'); setPeriodOk(true);
    notify('② 切换周粒度 · 指标联动');
    await new Promise((r) => setTimeout(r, 400));
    setPeriod('month'); setView('std'); setDrillOk(true);
    notify('③ 标化全景下钻 · 天/周/月可切换');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="ACCESS PANORAMA · A2-07"
        title="接入全景视图"
        desc="验收：指标可下钻、按天/周/月切换；区分普通用户/管理员。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="activity" onClick={() => go('/collection/runtime')}>运行监控</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => notify('全景指标已刷新 · 14:22:08')}>刷新</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '角色视图', d: role === 'admin' ? '管理员' : '普通用户', on: true },
          { n: '02', t: '天/周/月', d: periodLabel[period], on: periodOk },
          { n: '03', t: '指标下钻', d: view === 'std' ? '标化全景' : 'CDC 全景', on: drillOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {drillOk ? '下钻就绪' : '待验收'}</span>
      </div>

      <div className="meta-toolbar mt-14" style={{ marginBottom: 14, borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', background: '#fff', padding: '10px 14px' }}>
        <Tabs
          variant="pill"
          value={view}
          onChange={(k) => { setView(k as View); setDrillOk(true); }}
          items={[
            { key: 'cdc', label: 'CDC 同步全景' },
            { key: 'std', label: '数据标化全景' },
          ]}
        />
        <div className="filter-bar">
          <Tabs
            variant="pill"
            value={role}
            onChange={(k) => setRole(k as Role)}
            items={[
              { key: 'user', label: '普通用户' },
              { key: 'admin', label: '管理员' },
            ]}
          />
          <Tabs
            variant="pill"
            value={period}
            onChange={(k) => { setPeriod(k as Period); setPeriodOk(true); }}
            items={[
              { key: 'day', label: '天' },
              { key: 'week', label: '周' },
              { key: 'month', label: '月' },
            ]}
          />
        </div>
      </div>

      {view === 'cdc' && role === 'user' && (
        <>
          <div className="stat-grid">
            <StatCard label="应接入数据源" value={String(shouldConnect)} unit="个" delta={`已接入 ${connected}`} icon="database" tone="blue" onClick={() => go('/collection/services')} />
            <StatCard label="已接入占比" value={String(connectedPct)} unit="%" delta="+2.4% 本周" icon="gauge" tone="green" />
            <StatCard label="连通正常" value="29" unit="个" delta="波动 3 · 风险 1" icon="activity" tone="cyan" />
            <StatCard label={`${periodLabel[period]}同步表量`} value={String(syncData[syncData.length - 1].value)} unit="张" delta="可下钻任务" icon="table" tone="violet" onClick={() => go('/collection/channels')} />
          </div>

          <div className="grid grid-2 mt-14">
            <Card title="应接入 / 已接入占比" subtitle="普通用户视角 · 本机构授权范围" actions={<span className="live-badge"><i /> 准实时</span>}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
                <Donut
                  size={150}
                  thickness={14}
                  centerValue={`${connectedPct}%`}
                  label="已接入"
                  segments={[
                    { label: '已接入', value: connected, color: '#6755F5' },
                    { label: '未接入', value: shouldConnect - connected, color: '#E2E8F0' },
                  ]}
                />
                <div className="coverage-list" style={{ flex: 1 }}>
                  <div><span>HIS / EMR</span><strong>18/20</strong><div className="coverage-track"><i style={{ width: '90%', background: '#6755F5' }} /></div></div>
                  <div><span>LIS / RIS</span><strong>9/12</strong><div className="coverage-track"><i style={{ width: '75%', background: '#9587FF' }} /></div></div>
                  <div><span>公卫 / 其他</span><strong>6/10</strong><div className="coverage-track"><i style={{ width: '60%', background: '#0891B2' }} /></div></div>
                </div>
              </div>
            </Card>
            <Card title="数据源连通性监测" subtitle="网络连通与连接稳定性" actions={<button className="link-btn" onClick={() => notify('已触发连通性复检')}>复检</button>}>
              <DataTable
                rows={sourceHealth}
                pageSize={5}
                paginate={false}
                dense
                columns={[
                  { key: 'name', title: '数据源', render: (r) => <strong>{r.name}</strong> },
                  { key: 'status', title: '状态', width: 90, render: (r) => <Badge tone={r.status === '稳定' ? 'green' : r.status === '波动' ? 'amber' : 'red'} dot>{r.status}</Badge> },
                  { key: 'latency', title: '延迟', width: 70, render: (r) => <span className="mono-cell">{r.latency}ms</span> },
                  { key: 'uptime', title: '可用率', width: 70, render: (r) => `${r.uptime}%` },
                ]}
              />
            </Card>
          </div>

          <div className="grid grid-2 mt-14">
            <Card title={`数据表同步总量（${periodLabel[period]}）`} subtitle="统计周期内完成同步的数据表数量">
              <AreaChart data={syncData} color="#6755F5" height={180} suffix=" 张" valueName="同步表" />
            </Card>
            <Card title={`数据结构变更次数（${periodLabel[period]}）`} subtitle="识别高频变更表，评估同步影响">
              <AreaChart data={changeData} color="#D97706" height={180} suffix=" 次" valueName="结构变更" />
              <div className="info-note mt-10"><Icon name="circlealert" size={13} /><span>本周期高频变更 Top：PATIENT、REPORT_MAIN，建议复核 CDC 映射。</span></div>
            </Card>
          </div>

          <Card className="mt-14" title="高频结构变更数据表" subtitle="按变更次数排序" noPad actions={<Btn size="sm" onClick={() => go('/bid/realtime-channel')}>实时通道</Btn>}>
            <div className="pad-h">
              <DataTable
                rows={hotChangeTables}
                pageSize={5}
                columns={[
                  { key: 'table', title: '源端表', render: (r) => <span className="mono">{r.table}</span> },
                  { key: 'org', title: '机构', width: 110, render: (r) => r.org },
                  { key: 'changes', title: '变更次数', width: 90, align: 'right', render: (r) => r.changes },
                  { key: 'type', title: '最近类型', width: 100, render: (r) => <Badge tone="amber">{r.type}</Badge> },
                  { key: 'last', title: '最近时间', width: 110, render: (r) => r.last },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {view === 'cdc' && role === 'admin' && (
        <>
          <div className="stat-grid">
            <StatCard label="已接入机构" value="42" unit="家" delta="授权开通 42/48" icon="network" tone="blue" onClick={() => go('/collection/services')} />
            <StatCard label="同步数据表总量" value="12,846" unit="张" delta="本周 +186" icon="table" tone="violet" />
            <StatCard label="同步入库总记录" value="8.62" unit="亿" delta="评估平台负载" icon="layers" tone="green" />
            <StatCard label="平台日均吞吐" value="1.28" unit="亿行" delta="峰值 2.1 亿" icon="zap" tone="amber" />
          </div>

          <div className="grid grid-2-1 mt-14">
            <Card title="平台接入规模" subtitle="管理员视角 · 全平台汇总" actions={<span className="live-badge"><i /> 准实时</span>}>
              <div className="coverage-list">
                {[
                  ['三级医院', 18, 96, '#6755F5'],
                  ['二级医院', 14, 82, '#9587FF'],
                  ['基层机构', 8, 64, '#0891B2'],
                  ['疾控/妇幼', 2, 70, '#059669'],
                ].map(([l, n, p, c]) => (
                  <div key={l as string}><span>{l} · {n} 家</span><strong>{p}%</strong><div className="coverage-track"><i style={{ width: `${p}%`, background: c as string }} /></div></div>
                ))}
              </div>
              <div className="info-note mt-14"><Icon name="gauge" size={13} /><span>入库总记录 8.62 亿，当前集群负载 68%，建议关注高峰窗口 CDC 积压。</span></div>
            </Card>
            <Card title="机构同步表量 TOP" subtitle="便于督导滞后机构">
              <BarList
                items={[
                  { label: '重医附二院', value: 2140, display: '2,140 张' },
                  { label: '两江医院', value: 1680, display: '1,680 张' },
                  { label: '渝北人民医院', value: 1320, display: '1,320 张' },
                  { label: '两江妇幼', value: 860, display: '860 张' },
                  { label: '两江疾控', value: 420, display: '420 张' },
                ]}
                color="#6755F5"
              />
            </Card>
          </div>

          <div className="grid grid-2 mt-14">
            <Card title={`全平台同步表趋势（${periodLabel[period]}）`} subtitle="评估接入规模增长">
              <AreaChart data={syncData.map((d) => ({ ...d, value: d.value * (period === 'day' ? 42 : period === 'week' ? 8 : 3) }))} color="#6755F5" height={180} suffix=" 张" valueName="同步表" />
            </Card>
            <Card title="入库记录与负载" subtitle="总量 / 成功率 / 延迟">
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <StatCard label="入库成功率" value="98.6" unit="%" icon="checkcircle" tone="green" />
                <StatCard label="平均入湖延迟" value="42" unit="秒" icon="clock" tone="cyan" />
                <StatCard label="结构变更" value={String(changeData.reduce((a, b) => a + b.value, 0))} unit="次" icon="listfilter" tone="amber" />
              </div>
              <div className="mt-14">
                <AreaChart data={changeData} color="#DC2626" height={120} suffix=" 次" valueName="结构变更" />
              </div>
            </Card>
          </div>
        </>
      )}

      {view === 'std' && role === 'user' && (
        <>
          <div className="stat-grid">
            <StatCard label="机构表标化率" value="86.4" unit="%" delta="+1.8% 本周" icon="shield" tone="green" onClick={() => go('/collection/std-tasks')} />
            <StatCard label="任务执行成功率" value={String(stdSuccess)} unit="%" delta={periodLabel[period]} icon="checkcircle" tone="blue" />
            <StatCard label="平均耗时" value={String(avgCost)} unit="分钟" delta="识别瓶颈" icon="clock" tone="cyan" />
            <StatCard label="最大耗时" value={String(maxCost)} unit="分钟" delta="需关注长尾" icon="circlealert" tone="amber" onClick={() => go('/collection/std-monitor')} />
          </div>

          <div className="grid grid-2 mt-14">
            <Card title="本机构数据表标化率" subtitle="普通用户 · 授权机构范围">
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <Donut
                  size={150}
                  thickness={14}
                  centerValue="86.4%"
                  label="已标化"
                  segments={[
                    { label: '已标化', value: 270, color: '#059669' },
                    { label: '进行中', value: 28, color: '#F59E0B' },
                    { label: '未开始', value: 14, color: '#E2E8F0' },
                  ]}
                />
                <div className="coverage-list" style={{ flex: 1 }}>
                  <div><span>ODS 贴源层</span><strong>92%</strong><div className="coverage-track"><i style={{ width: '92%', background: '#6755F5' }} /></div></div>
                  <div><span>DWD 明细层</span><strong>81%</strong><div className="coverage-track"><i style={{ width: '81%', background: '#9587FF' }} /></div></div>
                  <div><span>对码依赖表</span><strong>74%</strong><div className="coverage-track"><i style={{ width: '74%', background: '#D97706' }} /></div></div>
                </div>
              </div>
            </Card>
            <Card title="标化任务耗时分布" subtitle="平均 / 最大耗时，定位性能瓶颈" actions={<button className="link-btn" onClick={() => go('/collection/std-monitor')}>打开监控</button>}>
              <BarList
                items={[
                  { label: '患者主索引标化', value: maxCost, display: `${maxCost} 分`, color: '#DC2626' },
                  { label: '检验报告标化', value: Math.round(maxCost * 0.7), display: `${Math.round(maxCost * 0.7)} 分`, color: '#D97706' },
                  { label: '就诊记录标化', value: avgCost + 8, display: `${avgCost + 8} 分` },
                  { label: '诊断明细标化', value: avgCost, display: `${avgCost} 分` },
                  { label: '科室字典对码', value: Math.max(6, avgCost - 8), display: `${Math.max(6, avgCost - 8)} 分` },
                ]}
                color="#6755F5"
              />
            </Card>
          </div>

          <Card className="mt-14" title="标化任务执行成功率" subtitle={`${periodLabel[period]}统计，可下钻任务过程`} noPad actions={<Btn size="sm" onClick={() => go('/collection/std-tasks')}>任务分派</Btn>}>
            <div className="pad-h">
              <AreaChart
                data={syncData.map((d, i) => ({ label: d.label, value: Math.min(99, stdSuccess - 3 + (i % 4) * 1.2) }))}
                color="#059669"
                height={160}
                suffix="%"
                valueName="成功率"
              />
            </div>
          </Card>
        </>
      )}

      {view === 'std' && role === 'admin' && (
        <>
          <div className="stat-grid">
            <StatCard label="已标准化处理记录" value="3.86" unit="亿" delta="全平台累计" icon="layers" tone="green" />
            <StatCard label="全平台标化率" value="79.4" unit="%" delta="督导滞后机构" icon="gauge" tone="blue" />
            <StatCard label="进行中任务" value="47" unit="项" delta="待审核 12" icon="workflow" tone="amber" onClick={() => go('/collection/std-tasks')} />
            <StatCard label="缺项豁免" value="18" unit="项" delta="已备案" icon="file" tone="violet" />
          </div>

          <div className="grid grid-2-1 mt-14">
            <Card title="机构数据表标化率排名" subtitle="管理员 · 便于督导滞后机构" noPad actions={<Btn size="sm" icon="download" onClick={() => notify('排名已导出')}>导出</Btn>}>
              <div className="pad-h">
                <DataTable
                  rows={orgStdRank}
                  pageSize={5}
                  onRowClick={(r) => { notify(`已定位 ${r.org} 标化任务`); go('/collection/std-monitor'); }}
                  columns={[
                    { key: 'rank', title: '#', width: 40, render: (_r, i) => <span className="mono-cell">{(i ?? 0) + 1}</span> },
                    { key: 'org', title: '机构', render: (r) => <strong>{r.org}</strong> },
                    { key: 'rate', title: '标化率', width: 90, render: (r) => <Badge tone={r.rate >= 85 ? 'green' : r.rate >= 75 ? 'amber' : 'red'}>{r.rate}%</Badge> },
                    { key: 'done', title: '已完成/总表', width: 120, render: (r) => `${r.done}/${r.tables}` },
                    { key: 'bar', title: '进度', render: (r) => <div className="coverage-track"><i style={{ width: `${r.rate}%`, background: r.rate >= 85 ? '#059669' : '#D97706' }} /></div> },
                  ]}
                />
              </div>
            </Card>
            <Card title="标准化处理记录增长" subtitle="全平台累计入标化库">
              <AreaChart
                data={syncData.map((d, i) => ({ label: d.label, value: 320 + i * 18 + (period === 'month' ? i * 40 : 0) }))}
                color="#059669"
                height={200}
                suffix=" 百万行"
                valueName="处理量"
              />
              <div className="info-note mt-10"><Icon name="sparkles" size={13} /><span>排名末位机构可一键下钻至标化任务监控，发起督导催办。</span></div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
