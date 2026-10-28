import React from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut, Gantt, RadialScore } from '../../components/charts';
import { Badge, Btn, Card, DataTable, StatCard, Tabs } from '../../components/ui';
import { useApp as useCtx } from '../../app-context';
import {
  assetTimeline, dashboardStats, dataGrowth, qualityDims, qualityTrend, sourceDistribution, storageTop,
  runTasks, indicators, alerts,
} from '../../data';

export function CenterDashboard() {
  const { go, notify } = useCtx();
  return (
    <>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="hero-content">
          <span className="hero-eyebrow"><i /> DATA INTELLIGENCE PLATFORM</span>
          <h1>让每一份医疗数据<br />成为可行动的洞察</h1>
          <p>汇聚全院 42 个业务系统与 12,846 张数据表，统一指标口径、强化质量治理，支撑临床、运营与科研决策。</p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => go('/center/sql')}><Icon name="code" size={14} /> 数据查询</button>
            <button className="hero-btn" onClick={() => go('/center/indicators')}><Icon name="gauge" size={14} /> 指标中台</button>
            <button className="hero-btn ghost" onClick={() => go('/collection/runtime')}><Icon name="activity" size={14} /> 采集监控</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-ring">
            <RadialScore value={95.6} size={122} thickness={9} color="#7FE3CE" label="数据健康度" />
          </div>
          <div className="hero-metrics">
            <div><span>数据可用率</span><strong>99.2<small>%</small></strong></div>
            <div><span>指标覆盖</span><strong>2,572<small>项</small></strong></div>
            <div><span>今日更新</span><strong>1.82<small>亿条</small></strong></div>
          </div>
        </div>
        <div className="hero-corner">
          <span><i className="live-dot" /> 数据服务运行正常</span>
          <span>重庆 · 渝中 / 江南院区</span>
        </div>
      </section>

      <div className="stat-grid mt-14">
        {dashboardStats.map((s) => (
          <StatCard key={s.label} {...s} onClick={() => {
            if (s.label === '已接入数据源') go('/center/sources');
            else if (s.label === '指标资产') go('/center/indicators');
            else if (s.label === '数据表总量') go('/center/assets');
            else go('/collection/runtime');
          }} />
        ))}
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="数据资产增长" subtitle="近 12 个月入仓数据表累计数量" actions={<Tabs variant="pill" value="12m" onChange={() => notify('已切换统计周期', 'info')} items={[{ key: '12m', label: '近 12 月' }, { key: '6m', label: '近 6 月' }]} />}>
          <div className="chart-headline">
            <div><strong>12,846</strong><span>张数据表</span><em><Icon name="arrowupright" size={11} /> 88.3%</em></div>
            <div className="chart-headline-sub"><span className="dot-color" style={{ background: '#6755F5' }} />较去年同期新增 6,026 张</div>
          </div>
          <AreaChart data={dataGrowth} color="#6755F5" height={218} suffix=" 张" valueName="数据表" />
          <div className="chart-foot-stats"><div><span>ODS 贴源层</span><strong>9,862</strong></div><div><span>DWD 明细层</span><strong>1,842</strong></div><div><span>DIM 维度层</span><strong>682</strong></div><div><span>DM 主题层</span><strong>460</strong></div></div>
        </Card>
        <Card title="数据源接入分布" subtitle="按业务系统统计数据表数量" actions={<button className="link-btn" onClick={() => go('/center/sources')}>全部 42 个 <Icon name="arrowright" size={11} /></button>}>
          <Donut segments={sourceDistribution} size={166} thickness={15} label="数据表总量" centerValue="12,846" />
        </Card>
      </div>

      <div className="grid grid-3-1 mt-14">
        <Card title="数据资产覆盖" subtitle="核心业务系统数据入仓时间轴" actions={<Badge tone="green" dot>实时同步中</Badge>}>
          <Gantt rows={assetTimeline} />
          <div className="gantt-foot">
            <span><i style={{ background: '#6755F5' }} />已入仓</span>
            <span><i style={{ background: '#CFE0FF' }} />规划中</span>
            <button className="link-btn" onClick={() => go('/center/assets')}>查看资产目录 <Icon name="arrowright" size={11} /></button>
          </div>
        </Card>
        <Card title="数据量 TOP 5" subtitle="按存储容量统计">
          <BarList items={storageTop.slice(0, 5)} color="#6755F5" />
          <div className="divider-h" />
          <div className="quick-links">
            <button onClick={() => go('/center/metadata')}><span className="qi blue"><Icon name="folder" size={14} /></span>元数据管理<Icon name="chevronright" size={12} /></button>
            <button onClick={() => go('/center/quality')}><span className="qi green"><Icon name="shield" size={14} /></span>数据质量报告<Icon name="chevronright" size={12} /></button>
            <button onClick={() => go('/center/report')}><span className="qi amber"><Icon name="uploadcloud" size={14} /></span>数据上报任务<Icon name="chevronright" size={12} /></button>
          </div>
        </Card>
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="最近采集任务" subtitle="全院数据采集与同步执行状态" noPad actions={<Btn size="sm" variant="ghost" icon="arrowright" onClick={() => go('/collection/tasks')}>任务列表</Btn>}>
          <div className="pad-h">
            <DataTable
              dense
              rows={runTasks.slice(0, 6)}
              rowKey="id"
              pageSize={6}
              paginate={false}
              onRowClick={(r) => go('/collection/tasks')}
              columns={[
                { key: 'config', title: '任务 / 配置', render: (r) => <div className="cell-main"><strong>{r.config}</strong><small>{r.id}</small></div> },
                { key: 'type', title: '类型', width: 88, render: (r) => <span className="tag">{r.type}</span> },
                { key: 'rows', title: '同步行数', width: 96, align: 'right', render: (r) => <span className="mono-cell">{r.rows}</span> },
                { key: 'duration', title: '耗时', width: 82, render: (r) => <span className="muted">{r.duration}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
              ]}
            />
          </div>
        </Card>
        <div className="stack">
          <Card title="数据质量概览" subtitle="质量综合得分" actions={<button className="link-btn" onClick={() => go('/center/quality')}>报告 <Icon name="arrowright" size={11} /></button>}>
            <div className="quality-mini">
              <RadialScore value={95.6} size={112} thickness={8} label="综合得分" />
              <div className="quality-dims">
                {qualityDims.slice(0, 4).map((d) => (
                  <div key={d.label}>
                    <span>{d.label}<strong>{d.value}</strong></span>
                    <div className="mini-track"><i style={{ width: `${d.value}%`, background: d.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="指标与告警" subtitle="最新动态" actions={<span className="live-badge"><i /> LIVE</span>}>
            <ul className="feed-list">
              <li onClick={() => go('/center/indicators')}><span className="feed-ico blue"><Icon name="gauge" size={13} /></span><div><strong>门诊预约爽约人次 V3.2 已发布</strong><small>张敏 · 14:12 · 指标中台</small></div></li>
              <li onClick={() => go('/collection/alerts')}><span className="feed-ico red"><Icon name="alert" size={13} /></span><div><strong>ICU 数据同步延迟 34 分钟</strong><small>系统告警 · 13:40 · 采集监控</small></div></li>
              <li onClick={() => go('/center/quality')}><span className="feed-ico amber"><Icon name="shield" size={13} /></span><div><strong>影像报告关联完整率低于阈值</strong><small>周宁 · 13:20 · 数据质量</small></div></li>
              <li onClick={() => go('/center/models')}><span className="feed-ico green"><Icon name="boxes" size={13} /></span><div><strong>新增超声诊断主题模型</strong><small>cywa_admin · 11:08 · 模型管理</small></div></li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
