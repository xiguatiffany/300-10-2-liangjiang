import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, LineageGraph, Sparkline, GraphNode } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Empty, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { indicators, indicatorCategories, indicatorTrend, indicatorBreakdown, changes, subscriptions, tags, models, Indicator } from '../../data';

const typeTone: Record<string, string> = { 原子指标: 'blue', 派生指标: 'violet', 复合指标: 'cyan' };

export function IndicatorsPage() {
  const { go, notify } = useApp();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(['运营指标分析']);
  const rows = useMemo(() => indicators.filter((i) => {
    const catMatch = cat === 'all' || i.category.includes(cat);
    return catMatch && (!type || i.type === type) && (!status || i.status === status) && (!owner || i.owner === owner) && (!q || (i.name + i.code + i.tags.join('')).toLowerCase().includes(q.toLowerCase()));
  }), [cat, q, type, status, owner]);

  return (
    <>
      <PageHeader eyebrow="INDICATOR PLATFORM" title="指标列表" desc="统一管理全院指标资产，覆盖定义、口径、血缘、订阅与权限，当前共 2,572 项指标。" actions={<><Btn icon="download" onClick={() => notify('指标清单导出任务已创建')}>导出全部</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建指标</Btn></>} />
      <div className="indicator-layout">
        <aside className="indicator-tree">
          <div className="it-head"><span><Icon name="folder" size={14} /> 指标目录</span><button onClick={() => notify('目录管理已打开', 'info')}><Icon name="settings" size={13} /></button></div>
          <div className="it-body">
            {indicatorCategories.map((c) => (
              <div key={c.key} className="it-group">
                <button className={`it-item ${cat === c.key ? 'is-active' : ''}`} onClick={() => { setCat(c.key); if (c.children) setExpanded((e) => e.includes(c.key) ? e : [...e, c.key]); }}>
                  {c.children ? <span className="it-caret" onClick={(e) => { e.stopPropagation(); setExpanded((arr) => arr.includes(c.key) ? arr.filter((x) => x !== c.key) : [...arr, c.key]); }}><Icon name={expanded.includes(c.key) ? 'chevron' : 'chevronright'} size={11} /></span> : <span className="it-caret" />}
                  <span className="it-label">{c.label}</span><em>{c.count.toLocaleString()}</em>
                </button>
                {c.children && expanded.includes(c.key) && (
                  <div className="it-children">
                    {c.children.map((ch) => (
                      <button key={ch.key} className={`it-child ${cat === ch.key ? 'is-active' : ''}`} onClick={() => setCat(ch.key)}>
                        <span>{ch.label}</span><em>{ch.count}</em>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button className="it-add" onClick={() => notify('新建指标目录已打开', 'info')}><Icon name="plus" size={12} /> 新建目录</button>
          </div>
          <div className="it-foot"><span>国考指标覆盖率</span><div className="mini-track"><i style={{ width: '92%' }} /></div><strong>92%</strong></div>
        </aside>

        <div className="indicator-main">
          <div className="indicator-summary">
            <div><span>指标总数</span><strong>2,572</strong><em>本月 +86</em></div>
            <div><span>已发布</span><strong>2,186</strong><em>85.0%</em></div>
            <div><span>待审核</span><strong>42</strong><em>需处理</em></div>
            <div><span>本周期更新</span><strong>186</strong><em>最近 7 日</em></div>
            <div className="is-action"><button onClick={() => notify('指标审核队列已打开', 'info')}>进入审核队列 <Icon name="arrowright" size={12} /></button></div>
          </div>
          <Card noPad>
            <div className="indicator-toolbar">
              <div className="filter-bar">
                <SearchInput value={q} onChange={setQ} placeholder="搜索指标名称、编码或标签" width={250} />
                <Select value={type} onChange={setType} options={['', '原子指标', '派生指标', '复合指标']} placeholder="全部类型" width={108} />
                <Select value={status} onChange={setStatus} options={['', '已发布', '草稿']} placeholder="全部状态" width={100} />
                <Select value={owner} onChange={setOwner} options={['', '张敏', '王思远', '陈晓', '刘一鸣', '赵倩']} placeholder="全部创建者" width={112} />
              </div>
              <div className="view-toggle"><button className="is-active"><Icon name="list" size={14} /></button><button onClick={() => notify('卡片视图已切换', 'info')}><Icon name="boxes" size={14} /></button></div>
            </div>
            <div className="indicator-table-note">
              <span>当前目录：<strong>{cat === 'all' ? '全部指标' : cat}</strong> · 共 {rows.length} 项</span>
              <span className="muted"><Icon name="shield" size={11} /> 指标口径经数据治理委员会审核后发布</span>
            </div>
            <div className="pad-h">
              <DataTable rows={rows} pageSize={10} onRowClick={(r) => go(`/center/indicator/${r.id}`)} columns={[
                { key: 'code', title: '指标编码', width: 104, render: (r) => <span className="mono-cell">{r.code}</span> },
                { key: 'name', title: '指标名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.category}</small></div> },
                { key: 'tags', title: '标签', width: 128, render: (r) => <div className="tag-inline">{r.tags.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}</div> },
                { key: 'type', title: '指标类型', width: 90, render: (r) => <Badge tone={typeTone[r.type] || 'blue'}>{r.type}</Badge> },
                { key: 'status', title: '状态', width: 76, render: (r) => <Badge dot>{r.status}</Badge> },
                { key: 'owner', title: '创建者', width: 76, render: (r) => r.owner },
                { key: 'updated', title: '更新时间', width: 118, render: (r) => <span className="muted">{r.updated.slice(5, 16)}</span> },
                { key: 'ops', title: '操作', width: 168, render: (r) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => go(`/center/indicator/${r.id}`)}>指标图谱</button><button className="link-muted" onClick={() => notify('标签管理已打开', 'info')}>标签管理</button><button className="link-muted" onClick={() => notify('指标权限设置已打开', 'info')}>权限</button></div> },
              ]} />
            </div>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新建指标" desc="定义指标的业务属性、统计口径与数据来源，提交后进入审核流程。" width={680}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn onClick={() => { setOpen(false); notify('指标已保存为草稿'); }}>保存草稿</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('指标已提交审核'); }}>提交审核</Btn></>}>
        <div className="form-grid">
          <Field label="指标名称" required><input className="input" placeholder="例如：门诊预约爽约人次" /></Field>
          <Field label="指标编码" required><input className="input" placeholder="MZ-YY-148" /></Field>
          <Field label="所属目录" required><Select value="运营指标分析 / 就诊主题分析" onChange={() => {}} options={['运营指标分析 / 就诊主题分析', '运营指标分析 / 手术主题分析', '医疗质量 / 核心制度', '国考指标', 'DRG 指标']} /></Field>
          <Field label="指标类型" required><Select value="原子指标" onChange={() => {}} options={['原子指标', '派生指标', '复合指标']} /></Field>
          <Field label="数据来源" required><Select value="hm_reg_appt_data" onChange={() => {}} options={['hm_reg_appt_data', 'hm_fs_surgeries_data', 'dwd_fact_visit', 'hm_revenue_data']} /></Field>
          <Field label="更新频率"><Select value="日" onChange={() => {}} options={['实时', '日', '周', '月', '季']} /></Field>
          <Field label="统计口径" required className="span-2"><textarea className="textarea" rows={3} placeholder="描述指标的统计对象、过滤条件与计算逻辑" /></Field>
          <Field label="业务负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '王思远', '陈晓', '刘一鸣']} /></Field>
          <Field label="责任部门"><Select value="门诊部" onChange={() => {}} options={['门诊部', '医务处', '质管办', '财务处', '医保办']} /></Field>
        </div>
      </Modal>
    </>
  );
}

export function IndicatorDetail({ param }: { param?: string }) {
  const { go, notify } = useApp();
  const ind = indicators.find((i) => i.id === param) || indicators[0];
  const [tab, setTab] = useState('basic');
  const [subOpen, setSubOpen] = useState(false);
  const [graphNode, setGraphNode] = useState<GraphNode | null>(null);
  const nodes: GraphNode[] = [
    { id: 'src', label: '预约挂号系统', sub: 'HIS · 生产库', type: 'source', x: 20, y: 150, w: 154 },
    { id: 'ods', label: 'ods_his_outpatient', sub: 'ODS 贴源表', type: 'ods', x: 218, y: 76, w: 176 },
    { id: 'ods2', label: 'ods_his_patient', sub: 'ODS 贴源表', type: 'ods', x: 218, y: 224, w: 176 },
    { id: 'dwd', label: 'dwd_fact_visit', sub: 'DWD 就诊宽表', type: 'model', x: 438, y: 150, w: 172 },
    { id: 'dim', label: 'dim_department', sub: '公共维度', type: 'model', x: 438, y: 300, w: 172 },
    { id: 'hm', label: 'hm_reg_appt_data', sub: '主题模型 · 预约', type: 'model', x: 654, y: 150, w: 172 },
    { id: 'ind', label: ind.name, sub: ind.code, type: 'indicator', x: 820, y: 96, w: 164, h: 58 },
    { id: 'rate', label: '门诊预约爽约率', sub: '派生指标', type: 'indicator', x: 820, y: 190, w: 164 },
    { id: 'app', label: '运营驾驶舱', sub: '应用看板', type: 'app', x: 820, y: 290, w: 164 },
  ];
  const edges = [
    { from: 'src', to: 'ods' }, { from: 'src', to: 'ods2' }, { from: 'ods', to: 'dwd' }, { from: 'ods2', to: 'dwd' },
    { from: 'dwd', to: 'hm' }, { from: 'dim', to: 'hm', label: '科室维度' }, { from: 'hm', to: 'ind' }, { from: 'ind', to: 'rate', label: '派生' }, { from: 'ind', to: 'app' },
  ];
  return (
    <>
      <PageHeader
        back={() => go('/center/indicators')}
        eyebrow="INDICATOR DETAIL"
        title={<span className="title-with-badges">{ind.name}<Badge tone={typeTone[ind.type] || 'blue'}>{ind.type}</Badge><Badge tone="green" dot>{ind.status}</Badge></span>}
        desc={<span className="detail-desc">{ind.code}<i />{ind.category}<i />更新于 {ind.updated}</span>}
        actions={<><Btn icon="pencil" onClick={() => notify('指标编辑模式已开启', 'info')}>编辑</Btn><Btn icon="bell" onClick={() => setSubOpen(true)}>订阅</Btn><Btn variant="primary" icon="plus" onClick={() => notify('派生指标创建向导已打开', 'info')}>创建派生指标</Btn><Btn variant="ghost" onClick={() => notify('指标已申请下线，待审核', 'info')}>下线</Btn></>}
      />
      <div className="indicator-detail-hero">
        <div className="idh-left">
          <span className="idh-label">最新值 · 2026-08</span>
          <div className="idh-value">{ind.value}<small>{ind.unit}</small></div>
          <div className="idh-trend"><span className="up"><Icon name="arrowupright" size={11} /> 12.6%</span><span>较上月</span><Sparkline values={indicatorTrend.slice(-8).map((x) => x.value)} color="#6755F5" width={132} height={30} /></div>
        </div>
        <div className="idh-mid">
          <div><span>数据来源</span><strong className="mono">{ind.source}</strong></div>
          <div><span>更新频率</span><strong>{ind.frequency}</strong></div>
          <div><span>责任部门</span><strong>{ind.dept}</strong></div>
          <div><span>业务负责人</span><strong>{ind.owner}</strong></div>
        </div>
        <div className="idh-right">
          <div className="idh-ring"><Progress value={96} tone="green" height={7} /><span>数据完整度 96%</span></div>
          <div className="idh-ring"><Progress value={92} tone="blue" height={7} /><span>口径一致性 92%</span></div>
          <button className="link-btn" onClick={() => go('/center/graph')}>在全景图谱中查看 <Icon name="arrowright" size={11} /></button>
        </div>
      </div>

      <Card className="mt-14" noPad>
        <div className="detail-tabs"><Tabs variant="line" value={tab} onChange={setTab} items={[
          { key: 'basic', label: '基本信息' }, { key: 'visual', label: '可视化分析' }, { key: 'subscribe', label: '指标订阅', count: 8 }, { key: 'graph', label: '指标图谱' }, { key: 'lineage', label: '血缘关系' }, { key: 'history', label: '变更历史' },
        ]} /><div className="detail-tabs-actions"><button className="link-muted" onClick={() => notify('指标权限设置已打开', 'info')}><Icon name="key" size={12} /> 权限</button><button className="link-muted" onClick={() => notify('已复制指标链接')}><Icon name="copy" size={12} /> 分享</button></div></div>

        {tab === 'basic' && (
          <div className="tab-panel detail-basic">
            <div className="detail-section">
              <div className="ds-head"><h3>业务属性</h3><span>定义指标的业务含义与统计口径</span></div>
              <KeyValue cols={2} items={[
                { label: '指标中文名称', value: ind.name }, { label: '指标编码', value: <span className="mono">{ind.code}</span> },
                { label: '指标别名', value: ind.alias || '—' }, { label: '所属目录', value: ind.category },
                { label: '指标类型', value: <Badge tone={typeTone[ind.type]}>{ind.type}</Badge> }, { label: '数据类型', value: ind.format + ' · ' + ind.precision },
                { label: '统计口径', value: ind.caliber, wide: true },
                { label: '业务描述', value: ind.desc, wide: true },
                { label: '数据来源', value: <span className="mono">{ind.source}</span> }, { label: '更新频率', value: ind.frequency },
                { label: '责任部门', value: ind.dept }, { label: '业务负责人', value: ind.owner },
                { label: '指标单位', value: ind.unit }, { label: '精度', value: ind.precision },
                { label: '数据格式', value: ind.format }, { label: '指标属性', value: '定量' },
                { label: '依赖指标', value: <button className="link-btn" onClick={() => notify('依赖指标已打开', 'info')}>门诊预约人次</button> }, { label: '依赖模型', value: <span className="mono">hm_reg_appt_data</span> },
                { label: '汇聚方式', value: '去重计数（DISTINCT COUNT）' }, { label: '指标导向', value: '正向' },
                { label: '过滤条件', value: '预约时间在统计周期内，且预约状态等于「爽约」', wide: true },
                { label: '时间维度', value: '预约时间' }, { label: '时间粒度', value: '日' },
                { label: '时间周期', value: '近一年' }, { label: '技术负责人', value: '张敏' },
              ]} />
            </div>
            <div className="detail-section">
              <div className="ds-head"><h3>技术属性</h3><span>指标计算与存储配置</span></div>
              <KeyValue cols={3} items={[
                { label: '存储表', value: <span className="mono">ads_indicator_value</span> },
                { label: '计算引擎', value: 'Spark 3.3 / Doris' },
                { label: '最近计算', value: '2026-08-06 14:10' },
                { label: '调度任务', value: <span className="mono">JOB-1040</span> },
                { label: '版本', value: 'V3.2' },
                { label: '发布状态', value: <Badge tone="green">已发布</Badge> },
              ]} />
            </div>
            <div className="detail-side-grid">
              <div className="detail-section">
                <div className="ds-head"><h3>订阅情况</h3><button className="link-btn" onClick={() => setTab('subscribe')}>查看全部</button></div>
                <div className="sub-mini">
                  <div className="sub-avatars">{['门诊部', '医务处', '院领导', '运营部'].map((d) => <span className="avatar sm" key={d}>{d.slice(0, 2)}</span>)}<span className="sub-more">+4</span></div>
                  <p>共 <strong>8</strong> 个部门 / 角色订阅，每日 08:00 推送</p>
                </div>
              </div>
              <div className="detail-section">
                <div className="ds-head"><h3>关联指标</h3></div>
                <div className="related-list">
                  {['门诊预约爽约率', '门诊预约率', '门诊次均费用'].map((n, i) => <button key={n} onClick={() => go(`/center/indicator/${indicators[i + 3].id}`)}><Icon name="gauge" size={13} />{n}<Icon name="arrowupright" size={11} /></button>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'visual' && (
          <div className="tab-panel">
            <div className="grid grid-2-1">
              <div className="detail-section">
                <div className="ds-head"><h3>月度趋势</h3><span>近 12 个月 · {ind.unit}</span></div>
                <div className="chart-headline"><div><strong>1,284</strong><span>{ind.unit}</span><em className="down"><Icon name="arrowupright" size={11} /> 12.6%</em></div><div className="chart-headline-sub">2026 年 8 月累计</div></div>
                <AreaChart data={indicatorTrend} height={250} suffix={` ${ind.unit}`} valueName={ind.name} />
              </div>
              <div className="detail-section">
                <div className="ds-head"><h3>科室分布</h3><span>TOP 6</span></div>
                <BarList items={indicatorBreakdown} />
              </div>
            </div>
            <div className="insight-grid mt-14">
              <div className="insight-card"><span className="ii blue"><Icon name="sparkles" size={15} /></span><div><strong>异常波动提示</strong><p>2026-02 爽约人次环比下降 21.5%，与春节假期门诊量下降趋势一致。</p></div></div>
              <div className="insight-card"><span className="ii amber"><Icon name="alert" size={15} /></span><div><strong>重点关注</strong><p>心血管内科爽约人次连续 3 个月上升，建议加强预约提醒与号源管理。</p></div></div>
              <div className="insight-card"><span className="ii green"><Icon name="target" size={15} /></span><div><strong>目标达成</strong><p>年度爽约率控制目标 ≤ 5%，当前 4.2%，处于达标区间。</p></div></div>
            </div>
          </div>
        )}

        {tab === 'subscribe' && (
          <div className="tab-panel">
            <div className="flex between center mb-10"><span className="muted">指标发布后，订阅方将在设定时间收到数据推送。</span><Btn size="sm" variant="primary" icon="plus" onClick={() => setSubOpen(true)}>新增订阅</Btn></div>
            <DataTable rows={subscriptions.filter((s) => s.indicator === ind.name || true).slice(0, 6)} pageSize={6} paginate={false} columns={[
              { key: 'subscriber', title: '订阅方', render: (s) => <div className="table-avatar"><span className="avatar sm">{s.subscriber.slice(0, 2)}</span><strong>{s.subscriber}</strong></div> },
              { key: 'channel', title: '推送渠道', render: (s) => s.channel },
              { key: 'frequency', title: '推送频率', render: (s) => s.frequency },
              { key: 'since', title: '订阅时间', render: (s) => s.since },
              { key: 'status', title: '状态', render: (s) => <Badge dot>{s.status}</Badge> },
              { key: 'ops', title: '操作', render: (s) => <div className="row-actions"><button className="link-btn" onClick={() => notify('订阅设置已打开', 'info')}>设置</button><button className="link-muted" onClick={() => notify('已取消订阅')}>取消</button></div> },
            ]} />
          </div>
        )}

        {tab === 'graph' && (
          <div className="tab-panel">
            <div className="lineage-summary"><span><i className="dot src" />上游 4 个节点</span><span><i className="dot mid" />模型 3 个</span><span><i className="dot ind" />下游 2 项指标</span><span className="muted">点击节点查看详情</span></div>
            <LineageGraph nodes={nodes} edges={edges} onSelect={setGraphNode} height={430} />
            {graphNode && (
              <div className="graph-inspector">
                <div><span className="muted xs">当前节点</span><strong>{graphNode.label}</strong><small>{graphNode.sub}</small></div>
                <div className="row-actions"><button className="link-btn" onClick={() => notify('节点元数据已打开', 'info')}>查看元数据</button><button className="link-muted" onClick={() => setGraphNode(null)}>关闭</button></div>
              </div>
            )}
          </div>
        )}

        {tab === 'lineage' && (
          <div className="tab-panel">
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>方向</th><th>对象</th><th>类型</th><th>关联字段</th><th>关系说明</th><th>负责人</th><th>更新时间</th></tr></thead>
                <tbody>
                  {[
                    ['上游', 'ods_his_outpatient', '数据表', 'appt_id, status', '提供预约状态明细', '王思远', '2026-08-06 14:10'],
                    ['上游', 'ods_his_patient', '数据表', 'patient_id', '患者人口学信息', '李建华', '2026-08-06 14:12'],
                    ['上游', 'dim_department', '维度表', 'dept_code', '科室标准名称映射', '张敏', '2026-08-06 10:20'],
                    ['上游', 'hm_reg_appt_data', '主题模型', 'appt_status, appt_time', '预约主题汇总', '张敏', '2026-08-06 13:42'],
                    ['下游', '门诊预约爽约率', '派生指标', '—', '由爽约人次 / 预约人次计算', '张敏', '2026-06-18 09:12'],
                    ['下游', '运营驾驶舱', '应用看板', '—', '门诊运营看板展示', '刘一鸣', '2026-07-20 15:00'],
                  ].map((r, i) => (
                    <tr key={i}><td><Badge tone={r[0] === '上游' ? 'blue' : 'violet'}>{r[0]}</Badge></td><td><span className="mono-cell">{r[1]}</span></td><td>{r[2]}</td><td><span className="mono-cell">{r[3]}</span></td><td className="muted">{r[4]}</td><td>{r[5]}</td><td className="muted">{r[6]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="tab-panel">
            <div className="timeline-list">
              {changes.map((c) => (
                <div className="tl-item" key={c.time}><span className="tl-dot" /><div className="tl-time">{c.time.slice(5)}</div><div className="tl-body"><div><strong>{c.action}</strong><Badge tone="blue">{c.version}</Badge><span className="muted xs">· {c.user}</span></div><p>{c.detail}</p></div></div>
              ))}
            </div>
            <div className="info-note mt-14"><Icon name="clock" size={13} /><span>变更记录保留 24 个月，指标口径变更需经数据治理委员会审批。</span></div>
          </div>
        )}
      </Card>

      <Modal open={subOpen} onClose={() => setSubOpen(false)} title="订阅指标" desc={`订阅「${ind.name}」，按设定频率接收数据推送。`} width={520}
        footer={<><Btn onClick={() => setSubOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setSubOpen(false); notify('指标订阅已创建'); }}>确认订阅</Btn></>}>
        <div className="form-grid">
          <Field label="订阅方" className="span-2"><Select value="门诊部" onChange={() => {}} options={['门诊部', '医务处', '运营部', '院领导', '财务处']} /></Field>
          <Field label="推送渠道"><Select value="工作台 + 邮件" onChange={() => {}} options={['工作台', '邮件', '企业微信', '工作台 + 邮件', '短信']} /></Field>
          <Field label="推送频率"><Select value="每日 08:00" onChange={() => {}} options={['每日 08:00', '每周一 09:00', '每月 1 日', '实时']} /></Field>
          <Field label="订阅备注" className="span-2"><textarea className="textarea" rows={3} placeholder="说明订阅用途，便于后续管理" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function SubscriptionsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const rows = subscriptions.filter((s) => (s.indicator + s.subscriber).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="INDICATOR SUBSCRIPTION" title="订阅列表" desc="管理指标订阅关系与推送策略，支持工作台、邮件、企业微信与短信多渠道触达。" actions={<><Btn icon="download" onClick={() => notify('订阅清单已导出')}>导出</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建订阅</Btn></>} />
      <div className="stat-grid">
        <StatCard label="订阅关系" value="86" unit="项" delta="+6 本月" icon="mail" tone="blue" />
        <StatCard label="启用中" value="78" unit="项" delta="90.7%" icon="checkcircle" tone="green" />
        <StatCard label="今日推送" value="42" unit="次" delta="成功率 100%" icon="bell" tone="cyan" />
        <StatCard label="订阅部门" value="18" unit="个" delta="覆盖 12 个临床科室" icon="users" tone="violet" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><SearchInput value={q} onChange={setQ} placeholder="搜索指标或订阅方" width={260} /><Select value="" onChange={() => {}} options={['全部渠道', '工作台', '邮件', '企业微信', '短信']} placeholder="全部渠道" width={110} /></div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={10} columns={[
            { key: 'indicator', title: '订阅指标', render: (s) => <div className="cell-main"><strong>{s.indicator}</strong><small>{s.id}</small></div> },
            { key: 'subscriber', title: '订阅方', width: 110, render: (s) => <div className="table-avatar"><span className="avatar sm">{s.subscriber.slice(0, 2)}</span>{s.subscriber}</div> },
            { key: 'channel', title: '推送渠道', width: 150, render: (s) => <span className="tag"><Icon name="mail" size={10} />{s.channel}</span> },
            { key: 'frequency', title: '推送频率', width: 120 },
            { key: 'since', title: '订阅时间', width: 100, render: (s) => s.since },
            { key: 'status', title: '状态', width: 76, render: (s) => <Badge dot>{s.status}</Badge> },
            { key: 'ops', title: '操作', width: 122, render: (s) => <div className="row-actions"><button className="link-btn" onClick={() => notify('订阅设置已打开', 'info')}>编辑</button><button className="link-muted" onClick={() => notify(`订阅 ${s.id} 已暂停`)}>{s.status === '启用' ? '暂停' : '启用'}</button></div> },
          ]} />
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="新建订阅" desc="选择指标与接收方，配置推送频率和渠道。" width={560}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('订阅已创建'); }}>创建订阅</Btn></>}>
        <div className="form-grid">
          <Field label="订阅指标" required className="span-2"><Select value="门诊预约爽约人次" onChange={() => {}} options={indicators.slice(0, 8).map((i) => i.name)} /></Field>
          <Field label="订阅方"><Select value="门诊部" onChange={() => {}} options={['门诊部', '医务处', '运营部', '院领导', '财务处', '质管办']} /></Field>
          <Field label="推送渠道"><Select value="工作台" onChange={() => {}} options={['工作台', '邮件', '企业微信', '短信']} /></Field>
          <Field label="推送频率"><Select value="每日 08:00" onChange={() => {}} options={['每日 08:00', '每周一 09:00', '每月 1 日']} /></Field>
          <Field label="生效时间"><input className="input" type="date" defaultValue="2026-08-06" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function TagsPage() {
  const { notify } = useApp();
  const [active, setActive] = useState('国考');
  const [open, setOpen] = useState(false);
  const activeTag = tags.find((t) => t.name === active);
  const rows = indicators.filter((i) => i.tags.some((t) => t === active) || (active === '运营' && i.category.includes('运营')) || active === '国考' && i.tags.includes('国考'));
  return (
    <>
      <PageHeader eyebrow="INDICATOR TAGS" title="标签管理" desc="通过标签对指标进行多维分类与组合检索，支撑国考、DRG、运营等专题分析。" actions={<><Btn icon="refresh" onClick={() => notify('标签统计已刷新')}>刷新统计</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建标签</Btn></>} />
      <div className="tag-cloud">
        {tags.map((t) => (
          <button key={t.name} className={`tag-card ${active === t.name ? 'is-active' : ''}`} onClick={() => setActive(t.name)}>
            <span className="tag-dot" style={{ background: t.color }} />
            <div><strong>{t.name}</strong><p>{t.desc}</p></div>
            <em>{t.count}</em>
          </button>
        ))}
      </div>
      <div className="grid grid-2-1 mt-14">
        <Card title={`「${active}」标签指标`} subtitle={activeTag?.desc} noPad actions={<Btn size="sm" icon="plus" onClick={() => notify('已打开批量打标', 'info')}>批量打标</Btn>}>
          <div className="pad-h">
            <DataTable rows={rows.slice(0, 8)} pageSize={8} paginate={false} columns={[
              { key: 'name', title: '指标名称', render: (i) => <div className="cell-main"><strong>{i.name}</strong><small>{i.code} · {i.category}</small></div> },
              { key: 'type', title: '类型', width: 90, render: (i) => <Badge tone={typeTone[i.type]}>{i.type}</Badge> },
              { key: 'status', title: '状态', width: 76, render: (i) => <Badge dot>{i.status}</Badge> },
              { key: 'owner', title: '负责人', width: 76 },
            ]} />
          </div>
        </Card>
        <div className="stack">
          <Card title="标签分布" subtitle="按指标数量">
            {tags.slice(0, 6).map((t) => (
              <div className="tag-dist" key={t.name}><span><i style={{ background: t.color }} />{t.name}</span><div className="tag-dist-track"><i style={{ width: `${(t.count / 486) * 100}%`, background: t.color }} /></div><em>{t.count}</em></div>
            ))}
          </Card>
          <Card title="标签治理建议">
            <div className="info-note"><Icon name="sparkles" size={14} /><span>检测到 12 项指标同时具备“运营”“门诊”标签，建议合并为“门诊运营”复合标签。</span></div>
            <div className="info-note mt-10"><Icon name="circlealert" size={14} /><span>“重点监控”标签下 6 项指标超过 90 天未更新口径，建议复核。</span></div>
            <Btn size="sm" variant="subtle" className="mt-10" onClick={() => notify('已生成标签治理报告', 'info')}>生成治理报告</Btn>
          </Card>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新建指标标签" width={480} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('标签已创建'); }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="标签名称" required><input className="input" placeholder="例如：重点监控" /></Field>
          <Field label="标签颜色"><input className="input" type="color" defaultValue="#6755F5" style={{ padding: 3 }} /></Field>
          <Field label="标签说明" className="span-2"><textarea className="textarea" rows={3} placeholder="描述标签的使用场景与打标规则" /></Field>
        </div>
      </Modal>
    </>
  );
}

export { GraphPage } from '../collection/LineageHub';

export function ModelsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<typeof models[0] | null>(null);
  const [tab, setTab] = useState('all');
  const rows = models.filter((m) => (m.name + m.desc).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="DATA MODELS" title="模型管理" desc="沉淀面向专科与主题的数据模型，支撑指标开发、临床分析与科研探索。" actions={<><Btn icon="listfilter" onClick={() => notify('分类管理已打开', 'info')}>分类管理</Btn><Btn icon="workflow" onClick={() => notify('调度任务已打开', 'info')}>调度任务</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建数据模型</Btn></>} />
      <div className="model-toolbar">
        <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'all', label: '全部', count: 9 }, { key: 'topic', label: '主题数据集', count: 9 }, { key: 'public', label: '公共维度表', count: 24 }]} />
        <div className="filter-bar"><Select value="" onChange={() => {}} options={['全部发布状态', '已发布', '草稿']} placeholder="全部发布状态" width={120} /><Select value="" onChange={() => {}} options={['全部创建者', 'cywa_admin', '张敏']} placeholder="全部创建者" width={110} /><SearchInput value={q} onChange={setQ} placeholder="请输入数据集名称或描述" width={230} /></div>
      </div>
      <div className="model-grid mt-14">
        {rows.map((m) => (
          <div className="model-card" key={m.id} onClick={() => setActive(m)}>
            <div className="mc-head"><span className="mc-icon"><Icon name="boxes" size={16} /></span><Badge tone="violet">{m.type}</Badge><button className="mc-more" onClick={(e) => { e.stopPropagation(); notify('更多操作菜单已打开', 'info'); }}><Icon name="more" size={15} /></button></div>
            <strong className="mc-name">{m.name}</strong>
            <p className="mc-desc">{m.desc}</p>
            <div className="mc-meta"><span>创建者 <strong>{m.owner}</strong></span><span>更新时间 <strong>{m.updated.slice(5, 10)}</strong></span></div>
            <div className="mc-topics"><span>{m.tables} 张表</span><span>{m.rows} 行</span><span>已发布</span></div>
            <div className="mc-foot"><button onClick={(e) => { e.stopPropagation(); notify('模型编辑已打开', 'info'); }}>编辑</button><button onClick={(e) => { e.stopPropagation(); notify('可视化分析已生成', 'info'); }}>可视化分析</button><button onClick={(e) => { e.stopPropagation(); notify('血缘关系视图已打开', 'info'); }}>血缘关系</button></div>
          </div>
        ))}
        <button className="model-add" onClick={() => setOpen(true)}><span className="ma-icon"><Icon name="plus" size={18} /></span><strong>新建数据模型</strong><p>基于主题域快速构建标准化数据模型</p></button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新建数据模型" desc="选择主题域与来源表，系统将自动生成模型草稿与基础血缘。" width={620}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('数据模型已创建，正在生成血缘'); }}>创建模型</Btn></>}>
        <div className="form-grid">
          <Field label="模型名称" required><input className="input" placeholder="例如：hm_cardio_data" /></Field>
          <Field label="模型类型"><Select value="主题数据集" onChange={() => {}} options={['主题数据集', '公共维度表', '应用数据集']} /></Field>
          <Field label="所属专科"><Select value="" onChange={() => {}} options={['心血管内科', '消化内科', '骨科', '神经内科', '呼吸内科', '康复医学科']} placeholder="请选择专科" /></Field>
          <Field label="负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩']} /></Field>
          <Field label="模型描述" className="span-2"><textarea className="textarea" rows={3} placeholder="描述模型的分析主题、包含的主要实体与指标" /></Field>
        </div>
      </Modal>
      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name || ''} desc={active ? `${active.type} · 创建者 ${active.owner}` : ''} width={620}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" icon="chart" onClick={() => { setActive(null); notify('可视化分析已生成', 'info'); }}>可视化分析</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>物理表</span><strong>{active.tables}</strong></div><div><span>数据行数</span><strong>{active.rows}</strong></div><div><span>关联指标</span><strong>12</strong></div><div><span>质量得分</span><strong className="text-green">98.2</strong></div></div>
          <p className="prose mt-14">{active.desc}。模型采用星型结构组织，包含 1 张事实表与多张维度表，适用于专科运营分析与临床科研。</p>
          <div className="section-title-sm mt-14">模型表结构</div>
          <div className="table-wrap mt-10">
            <table className="data-table"><thead><tr><th>表名</th><th>类型</th><th>数据量</th><th>更新时间</th></tr></thead><tbody>
              {[['hm_fact_visit', '事实表', '9.8M', '2026-08-06'], ['dim_department', '维度表', '1,286', '2026-08-06'], ['dim_doctor', '维度表', '8,420', '2026-08-06'], ['dim_diagnosis', '维度表', '32,846', '2026-07-30']].map((r) => (
                <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td><Badge tone={r[1] === '事实表' ? 'blue' : 'cyan'}>{r[1]}</Badge></td><td>{r[2]}</td><td className="muted">{r[3]}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div className="info-note mt-14"><Icon name="git" size={13} /><span>模型已关联 12 项指标，最近一次调度成功，数据延迟 4 分钟。</span></div>
        </>}
      </Drawer>
    </>
  );
}
