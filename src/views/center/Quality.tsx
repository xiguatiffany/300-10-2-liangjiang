import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut, RadialScore } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { qualityDims, qualityIssues, qualityRules, qualityTrend, assets } from '../../data';

export function QualityOverview() {
  const { go, notify } = useApp();
  const dims = qualityDims;
  return (
    <>
      <PageHeader eyebrow="DATA QUALITY" title="质量总览" desc="围绕完整性、准确性、一致性、及时性与唯一性五个维度，对全院数据资产进行持续质量监测。" actions={<><Btn icon="download" onClick={() => notify('质量报告已生成，可在下载中心查看')}>生成质量报告</Btn><Btn variant="primary" icon="plus" onClick={() => go('/center/quality-rules')}>新建质量规则</Btn></>} />
      <div className="quality-hero">
        <div className="qh-score">
          <RadialScore value={95.6} size={150} thickness={11} label="数据质量综合得分" />
          <div className="qh-score-meta">
            <Badge tone="green" dot>质量良好</Badge>
            <p>较上月 <strong className="text-green">+0.6</strong> 分</p>
            <span>全院 12,846 张表 · 10 条规则</span>
          </div>
        </div>
        <div className="qh-dims">
          {dims.map((d) => (
            <div className="qh-dim" key={d.label}>
              <div className="qh-dim-top"><span>{d.label}</span><strong>{d.value}<small>%</small></strong></div>
              <div className="qh-track"><i style={{ width: `${d.value}%`, background: d.color }} /></div>
              <em>{d.value >= 97 ? '优秀' : d.value >= 94 ? '良好' : '需关注'}</em>
            </div>
          ))}
        </div>
        <div className="qh-trend">
          <div className="qh-trend-head"><span>质量趋势</span><Badge tone="green">+3.2% YoY</Badge></div>
          <AreaChart data={qualityTrend} color="#059669" height={150} suffix=" 分" valueName="质量得分" />
        </div>
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="质量问题分布" subtitle="按质量维度统计待处理问题">
          <div className="flex gap-14 center">
            <Donut size={162} thickness={14} centerValue="386" label="待处理问题" segments={[
              { label: '完整性', value: 132, color: '#6755F5' }, { label: '及时性', value: 96, color: '#F59E0B' },
              { label: '一致性', value: 78, color: '#9587FF' }, { label: '唯一性', value: 48, color: '#0891B2' }, { label: '准确性', value: 32, color: '#10B981' },
            ]} />
            <div className="issue-summary">
              <div><span className="sev high" />高优先级<strong>86</strong><em>需 24h 内处理</em></div>
              <div><span className="sev mid" />中优先级<strong>186</strong><em>需 3 日内处理</em></div>
              <div><span className="sev low" />低优先级<strong>114</strong><em>本周期内处理</em></div>
              <button className="link-btn" onClick={() => go('/center/quality-issues')}>查看全部问题 <Icon name="arrowright" size={11} /></button>
            </div>
          </div>
        </Card>
        <Card title="资产质量排行" subtitle="质量得分最低的 5 张数据表">
          <BarList color="#D97706" items={[
            { label: 'ods_pacs_study', value: 95.68, display: '95.68 分', color: '#DC2626' },
            { label: 'ods_lis_report', value: 96.42, display: '96.42 分', color: '#D97706' },
            { label: 'ods_emr_cpoe_ba_ssk', value: 95.4, display: '95.40 分', color: '#DC2626' },
            { label: 'ods_pacs_dicom_index', value: 94.8, display: '94.80 分', color: '#DC2626' },
            { label: 'ods_his_outpatient', value: 96.8, display: '96.80 分', color: '#D97706' },
          ]} />
          <div className="info-note mt-14"><Icon name="circlealert" size={13} /><span>PACS 影像类资产质量波动较大，建议优先治理影像报告关联完整性。</span></div>
        </Card>
      </div>

      <Card className="mt-14" title="质量规则执行情况" subtitle="最近一次执行：2026-08-06 14:00" actions={<button className="link-btn" onClick={() => go('/center/quality-rules')}>全部规则 <Icon name="arrowright" size={11} /></button>} noPad>
        <div className="pad-h">
          <DataTable rows={qualityRules.slice(0, 6)} pageSize={6} paginate={false} columns={[
            { key: 'name', title: '规则名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.asset}</small></div> },
            { key: 'dimension', title: '维度', width: 82, render: (r) => <Badge tone="slate">{r.dimension}</Badge> },
            { key: 'rule', title: '校验逻辑', render: (r) => <span className="muted">{r.rule}</span> },
            { key: 'pass', title: '通过率', width: 130, sortable: true, render: (r) => <div className="quality-cell"><Progress value={r.pass} tone={r.pass > 99 ? 'green' : r.pass > 97 ? 'blue' : 'amber'} /><span>{r.pass}%</span></div> },
            { key: 'status', title: '状态', width: 76, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'owner', title: '负责人', width: 76, render: (r) => r.owner },
          ]} />
        </div>
      </Card>
    </>
  );
}

export function QualityRules() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [dim, setDim] = useState('');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<typeof qualityRules[0] | null>(null);
  const rows = qualityRules.filter((r) => (!dim || r.dimension === dim) && (r.name + r.asset).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="QUALITY RULES" title="质量规则" desc="配置数据质量校验规则，支持唯一性、完整性、值域、及时性等 8 类模板，按调度周期自动执行。" actions={<><Btn icon="play" onClick={() => notify('已触发全部规则执行，预计 2 分钟完成')}>执行全部</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建规则</Btn></>} />
      <div className="stat-grid">
        <StatCard label="规则总数" value="10" unit="条" delta="启用 9 条" icon="list" tone="blue" />
        <StatCard label="今日执行" value="186" unit="次" delta="成功率 100%" icon="play" tone="green" />
        <StatCard label="整体通过率" value="98.1" unit="%" delta="+0.4% 环比" icon="checkcircle" tone="cyan" />
        <StatCard label="异常规则" value="1" unit="条" delta="影像关联完整性" icon="circlealert" tone="red" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索规则名称或数据表" width={240} /><Select value={dim} onChange={setDim} options={['', '完整性', '准确性', '一致性', '及时性', '唯一性']} placeholder="全部维度" width={120} /><span className="filter-label">共 {rows.length} 条规则</span></div>
          <Btn size="sm" icon="download" onClick={() => notify('规则清单已导出')}>导出</Btn>
        </div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={10} onRowClick={(r) => setDetail(r)} columns={[
            { key: 'name', title: '规则', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.rule}</small></div> },
            { key: 'asset', title: '监控对象', width: 180, render: (r) => <span className="mono-cell">{r.asset}</span> },
            { key: 'dimension', title: '维度', width: 80, render: (r) => <Badge tone="slate">{r.dimension}</Badge> },
            { key: 'pass', title: '通过率', width: 136, sortable: true, render: (r) => <div className="quality-cell"><Progress value={r.pass} tone={r.pass > 99 ? 'green' : r.pass > 97 ? 'blue' : 'amber'} /><span>{r.pass}%</span></div> },
            { key: 'runs', title: '执行次数', width: 90, align: 'right', render: (r) => <span className="mono-cell">{r.runs.toLocaleString()}</span> },
            { key: 'owner', title: '负责人', width: 80, render: (r) => r.owner },
            { key: 'status', title: '状态', width: 76, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'ops', title: '操作', width: 100, render: (r) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => setDetail(r)}>详情</button><button className="link-muted" onClick={() => notify(`规则“${r.name}”已开始执行`)}>执行</button></div> },
          ]} />
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="新建质量规则" desc="选择校验对象与规则模板，配置告警阈值后立即生效。" width={620}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('质量规则已创建并启用'); }}>创建并启用</Btn></>}>
        <div className="form-grid">
          <Field label="规则名称" required className="span-2"><input className="input" placeholder="例如：患者主键唯一性校验" /></Field>
          <Field label="监控对象" required><Select value="" onChange={() => {}} options={assets.map((a) => a.id)} placeholder="请选择数据表" /></Field>
          <Field label="质量维度" required><Select value="完整性" onChange={() => {}} options={['完整性', '准确性', '一致性', '及时性', '唯一性', '有效性']} /></Field>
          <Field label="规则模板" required><Select value="字段非空校验" onChange={() => {}} options={['字段非空校验', '主键唯一性校验', '值域范围校验', '关联完整性校验', '及时性阈值校验', '自定义 SQL']} /></Field>
          <Field label="告警阈值"><input className="input" defaultValue="95" placeholder="通过率低于该值时告警" /></Field>
          <Field label="校验字段" className="span-2"><input className="input" placeholder="patient_id, visit_id" /></Field>
          <Field label="调度周期"><Select value="每日 02:00" onChange={() => {}} options={['每小时', '每日 02:00', '每周一 02:00', '每月 1 日 02:00']} /></Field>
          <Field label="负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩', '周宁']} /></Field>
        </div>
      </Modal>
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''} desc={detail ? `${detail.id} · ${detail.asset}` : ''} width={600}
        footer={<><Btn onClick={() => setDetail(null)}>关闭</Btn><Btn variant="primary" icon="play" onClick={() => notify('规则已触发执行')}>立即执行</Btn></>}>
        {detail && <>
          <div className="drawer-summary"><div><span>通过率</span><strong className={detail.pass > 99 ? 'text-green' : 'text-amber'}>{detail.pass}%</strong></div><div><span>质量维度</span><strong>{detail.dimension}</strong></div><div><span>执行次数</span><strong>{detail.runs.toLocaleString()}</strong></div><div><span>状态</span><strong>{detail.status}</strong></div></div>
          <KeyValue className="mt-14" cols={2} items={[
            { label: '校验对象', value: <span className="mono">{detail.asset}</span> }, { label: '负责人', value: detail.owner },
            { label: '校验逻辑', value: detail.rule, wide: true },
            { label: '调度周期', value: '每日 02:00' }, { label: '告警阈值', value: '通过率 < 95%' },
            { label: '告警方式', value: '站内信 + 企业微信' }, { label: '最近执行', value: '2026-08-06 02:00' },
          ]} />
          <div className="section-title-sm mt-14">最近执行记录</div>
          <div className="timeline-list compact">
            {[{ t: '08-06 02:00', v: detail.pass, r: '通过' }, { t: '08-05 02:00', v: detail.pass - 0.12, r: '通过' }, { t: '08-04 02:00', v: detail.pass - 0.4, r: '通过' }, { t: '08-03 02:00', v: detail.pass - 0.2, r: '通过' }].map((x) => (
              <div className="tl-item" key={x.t}><span className="tl-dot" /><div className="tl-time">{x.t}</div><div className="tl-body"><div><strong>通过率 {x.v.toFixed(2)}%</strong><Badge tone="green">{x.r}</Badge></div><p>扫描 2,184,690 行 · 耗时 12s</p></div></div>
            ))}
          </div>
        </>}
      </Drawer>
    </>
  );
}

export function QualityIssues() {
  const { notify } = useApp();
  const [state, setState] = useState<'待处理' | '处理中' | '已修复' | '全部'>('全部');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(qualityIssues);
  const [active, setActive] = useState<typeof qualityIssues[0] | null>(null);
  const filtered = useMemo(() => rows.filter((r) => (state === '全部' || r.status === state) && (r.rule + r.asset).toLowerCase().includes(q.toLowerCase())), [rows, state, q]);
  return (
    <>
      <PageHeader eyebrow="DATA ISSUES" title="质量问题" desc="集中管理质量校验发现的问题，跟踪从发现、分派、修复到复核的完整闭环。" actions={<><Btn icon="download" onClick={() => notify('质量问题清单已导出')}>导出清单</Btn><Btn variant="primary" icon="plus" onClick={() => notify('已打开质量工单创建表单', 'info')}>新建工单</Btn></>} />
      <div className="issue-tabs">
        {(['全部', '待处理', '处理中', '已修复'] as const).map((s) => (
          <button key={s} className={state === s ? 'is-active' : ''} onClick={() => setState(s)}>
            <span>{s}</span>
            <em>{s === '全部' ? rows.length : rows.filter((r) => r.status === s).length}</em>
          </button>
        ))}
        <div className="spacer" />
        <SearchInput value={q} onChange={setQ} placeholder="搜索问题或数据表" width={240} />
      </div>
      <div className="grid grid-2 mt-14">
        {filtered.map((r) => (
          <div className={`issue-card level-${r.level}`} key={r.id}>
            <div className="issue-card-head">
              <span className={`issue-level ${r.level === '高' ? 'high' : r.level === '中' ? 'mid' : 'low'}`}>{r.level}</span>
              <div className="issue-title"><strong>{r.rule}</strong><span>{r.id} · {r.found}</span></div>
              <Badge tone={r.status === '待处理' ? 'amber' : r.status === '处理中' ? 'cyan' : 'green'} dot>{r.status}</Badge>
            </div>
            <div className="issue-meta">
              <span><Icon name="table" size={12} /> {r.asset}</span>
              <span><Icon name="shield" size={12} /> {r.dimension}</span>
              <span><Icon name="circlealert" size={12} /> 影响 <strong>{r.count}</strong> 条记录</span>
              <span><Icon name="users" size={12} /> {r.owner}</span>
            </div>
            <div className="issue-card-foot">
              <div className="issue-bar"><i style={{ width: `${Math.min(100, 100 - r.count / 6)}%`, background: r.status === '已修复' ? '#059669' : '#D97706' }} /></div>
              <div className="row-actions">
                <button className="link-btn" onClick={() => setActive(r)}>查看详情</button>
                {r.status !== '已修复' && <button className="link-muted" onClick={() => { setRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '已修复' } : x)); notify(`问题 ${r.id} 已标记为修复`); }}>标记修复</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <Card className="mt-14"><div className="empty"><div className="empty-icon"><Icon name="checkcircle" size={22} /></div><h4>当前状态暂无质量问题</h4><p>切换其他状态或调整搜索条件查看。</p></div></Card>}
      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.rule || ''} desc={active ? `${active.id} · 发现于 ${active.found}` : ''} width={560}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" onClick={() => { if (active) { setRows((arr) => arr.map((x) => x.id === active.id ? { ...x, status: '处理中' } : x)); notify('问题已分派给负责人'); setActive(null); } }}>分派处理</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>影响记录</span><strong className="text-red">{active.count}</strong></div><div><span>严重程度</span><strong>{active.level}</strong></div><div><span>质量维度</span><strong>{active.dimension}</strong></div><div><span>状态</span><strong>{active.status}</strong></div></div>
          <div className="section-title-sm mt-14">问题详情</div>
          <div className="code-sample">SELECT * FROM {active.asset}{'\n'}WHERE report_id IS NULL{'\n'}LIMIT 100;</div>
          <KeyValue className="mt-14" cols={2} items={[{ label: '数据表', value: <span className="mono">{active.asset}</span> }, { label: '负责人', value: active.owner }, { label: '发现时间', value: active.found }, { label: '处理时限', value: active.level === '高' ? '24 小时内' : '3 个工作日' }, { label: '修复建议', value: '核查上游报告接口，补充缺失的影像报告关联记录，并重跑质量规则。', wide: true }]} />
        </>}
      </Drawer>
    </>
  );
}
