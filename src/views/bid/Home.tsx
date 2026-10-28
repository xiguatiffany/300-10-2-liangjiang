import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut, RadialScore } from '../../components/charts';
import { Badge, Btn, Card, Field, Modal, PageHeader, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { portalApps, portalNews, portalTodos, portalFavorites, portalTrend, qcInstitutions } from '../../dataBid';

type RoleKey = 'leader' | 'admin' | 'clinical';
type WidgetKey = 'hero' | 'stats' | 'trend' | 'apps' | 'news' | 'fav';

const roleMeta: Record<RoleKey, { label: string; blurb: string; hero: string; apps: string[] }> = {
  leader: {
    label: '领导驾驶舱',
    blurb: '决策视角 · 全区健康与治理态势',
    hero: '数据驱动健康\n治理创造价值',
    apps: ['indicator', 'bi', 'qc', 'share', 'mpi', 'tag'],
  },
  admin: {
    label: '数据管理员',
    blurb: '治理视角 · 采集质量资产与服务',
    hero: '管好每一份数据\n服务每一次决策',
    apps: ['collect', 'govern', 'qc', 'indicator', 'share', 'bi'],
  },
  clinical: {
    label: '临床业务',
    blurb: '业务视角 · 主索引标签与质控闭环',
    hero: '让临床看见数据\n让数据服务患者',
    apps: ['mpi', 'tag', 'qc', 'indicator', 'govern', 'share'],
  },
};

const defaultWidgets: Record<WidgetKey, boolean> = {
  hero: true, stats: true, trend: true, apps: true, news: true, fav: true,
};

export function BidHome() {
  const { go, notify } = useApp();
  const [role, setRole] = useState<RoleKey>('leader');
  const [custom, setCustom] = useState(false);
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [q, setQ] = useState('');
  const meta = roleMeta[role];

  const apps = useMemo(() => {
    const map = Object.fromEntries(portalApps.map((a) => [a.key, a]));
    return meta.apps.map((k) => map[k]).filter(Boolean);
  }, [meta.apps]);

  const todos = useMemo(() => {
    if (role === 'clinical') return portalTodos.filter((t) => t.from.includes('质量') || t.from.includes('医务') || t.level === '高').slice(0, 4);
    if (role === 'admin') return portalTodos;
    return portalTodos.filter((t) => t.level !== '低').slice(0, 4);
  }, [role]);

  const toggleWidget = (k: WidgetKey) => setWidgets((w) => ({ ...w, [k]: !w[k] }));

  const doSearch = () => {
    const hit = [...portalApps.map((a) => a.name), ...portalFavorites.map((f) => f.name)].find((n) => n.includes(q.trim()));
    notify(hit ? `已定位：${hit}` : (q.trim() ? `未命中「${q}」，可切换至指标市场继续检索` : '请输入关键词'));
    if (hit?.includes('指标') || portalFavorites.some((f) => f.name === hit)) go('/bid/indicator-market');
    else if (hit) {
      const app = portalApps.find((a) => a.name === hit);
      if (app) go(app.path);
    }
    setSearchOpen(false);
  };

  return (
    <div className={`bid-home ${custom ? 'is-custom' : ''}`}>
      <div className="portal-top">
        <div>
          <span className="portal-eyebrow">LIANGJIANG DIGITAL HEALTH · C2 ▲</span>
          <h1>两江新区数智健康管理服务平台</h1>
          <p>{meta.blurb} · 角色化首页 · 组件可配置 · PC/移动/大屏模板就绪</p>
        </div>
        <div className="portal-top-actions">
          <div className="portal-search" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={15} /><span>搜索指标、机构、数据资源…</span><kbd>⌘ K</kbd>
          </div>
          <Tabs variant="pill" value={role} onChange={(k) => setRole(k as RoleKey)} items={[
            { key: 'leader', label: '领导驾驶舱' },
            { key: 'admin', label: '数据管理员' },
            { key: 'clinical', label: '临床业务' },
          ]} />
          <Btn size="sm" icon="dashboard" variant={custom ? 'primary' : 'secondary'} onClick={() => { setCustom((v) => !v); notify(custom ? '已退出自定义模式' : '已进入首页自定义模式 · 勾选组件'); }}>
            {custom ? '完成配置' : '自定义看板'}
          </Btn>
          <Btn size="sm" icon="boxes" onClick={() => go('/admin/portal-composer')}>门户编排</Btn>
          <div className="portal-account">
            <button type="button" onClick={() => setPwdOpen(true)}><Icon name="key" size={13} /> 改密</button>
            <button type="button" onClick={() => notify('已安全退出登录')}><Icon name="logout" size={13} /> 退出</button>
          </div>
        </div>
      </div>

      {custom && (
        <div className="portal-widget-bar">
          <span>显示组件</span>
          {([
            ['hero', '驾驶舱'], ['stats', '统计卡'], ['trend', '趋势/质量'],
            ['apps', '我的应用'], ['news', '资讯待办'], ['fav', '关注/排名/最近'],
          ] as [WidgetKey, string][]).map(([k, l]) => (
            <button key={k} type="button" className={widgets[k] ? 'is-on' : ''} onClick={() => toggleWidget(k)}>{l}</button>
          ))}
          <em>切换角色可预览差异化布局 · 保存后按角色模板生效</em>
        </div>
      )}

      {widgets.hero && (
      <section className="portal-hero">
        <div className="portal-hero-grid" />
        <div className="portal-hero-left">
          <span className="portal-hero-tag"><i /> {meta.label} · C2-01 ▲ 角色化首页</span>
          <h2>{meta.hero.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 ? <br /> : null}</React.Fragment>)}</h2>
          <p>覆盖 42 家医疗机构、12,846 张数据表、2,572 项指标，构建“采集—治理—指标—标签—服务”的区域健康数据底座。</p>
          <div className="portal-hero-actions">
            <button className="hero-btn primary" onClick={() => go('/bid/collection-wizard')}><Icon name="play" size={14} /> 开始演示</button>
            <button className="hero-btn" onClick={() => go('/bid/demo')}><Icon name="list" size={14} /> 查看演示清单</button>
            <button className="hero-btn ghost" onClick={() => go(role === 'clinical' ? '/bid/main-archive' : role === 'admin' ? '/bid/monitor' : '/bid/self-bi')}><Icon name="activity" size={14} /> {role === 'clinical' ? '主索引' : role === 'admin' ? '实时监控' : '自服务 BI'}</button>
          </div>
          <div className="portal-hero-stats">
            <div><span>接入机构</span><strong>42<small>家</small></strong></div>
            <div><span>数据总量</span><strong>8.62<small>亿条</small></strong></div>
            <div><span>指标资产</span><strong>2,572<small>项</small></strong></div>
            <div><span>今日入湖</span><strong>1.82<small>亿条</small></strong></div>
          </div>
        </div>
        <div className="portal-hero-right">
          <div className="portal-ring-card">
            <RadialScore value={95.6} size={142} thickness={10} color="#7FE3CE" label="数据健康度" />
            <div className="portal-ring-meta">
              <span><i className="ok" /> 42 家机构在线</span>
              <span><i className="warn" /> 3 条延迟告警</span>
              <span><i className="bad" /> 1 条质量异常</span>
            </div>
          </div>
          <div className="portal-live-card">
            <div className="plc-head"><span><i className="live-dot" /> 实时数据流</span><em>14:21:32</em></div>
            <div className="plc-row"><span>HIS 患者</span><strong>+ 1,286</strong><em>条/分钟</em></div>
            <div className="plc-row"><span>EMR 医嘱</span><strong>+ 862</strong><em>条/分钟</em></div>
            <div className="plc-row"><span>LIS 报告</span><strong>+ 486</strong><em>条/分钟</em></div>
          </div>
        </div>
        <div className="portal-corner"><span><i className="live-dot" /> 数据服务运行正常</span><span>重庆 · 两江新区 · {meta.label}</span></div>
      </section>
      )}

      {widgets.stats && (
      <div className="stat-grid mt-14">
        {[
          { label: '接入医疗机构', value: '42', unit: '家', delta: '二级以上 26 家', icon: 'building', tone: 'blue' },
          { label: '数据表总量', value: '12,846', unit: '张', delta: '本月新增 128 张', icon: 'table', tone: 'violet' },
          { label: '指标资产', value: '2,572', unit: '项', delta: '国考指标 364 项', icon: 'gauge', tone: 'cyan' },
          { label: '数据质量得分', value: '95.6', unit: '分', delta: '+0.6 环比', icon: 'shield', tone: 'green' },
        ].map((s) => (
          <div className={`stat-card tone-${s.tone}`} key={s.label} onClick={() => go(s.label.includes('机构') ? '/bid/main-archive' : s.label.includes('指标') ? '/bid/indicator-market' : s.label.includes('质量') ? '/bid/qc-results' : '/bid/data-preview')}>
            <div className="stat-top"><span className="stat-label">{s.label}</span><span className="stat-icon"><Icon name={s.icon} size={17} /></span></div>
            <div className="stat-value">{s.value}<small>{s.unit}</small></div>
            <div className="stat-foot"><span className="stat-delta">{s.delta}</span></div>
          </div>
        ))}
      </div>
      )}

      {widgets.trend && (
      <div className="portal-grid mt-14">
        <Card title="数据接入与治理趋势" subtitle="近 8 个月入湖数据表数量" actions={<span className="live-badge"><i /> 实时</span>}>
          <div className="chart-headline"><div><strong>12,846</strong><span>张数据表</span><em><Icon name="arrowupright" size={11} /> 88.3%</em></div><div className="chart-headline-sub"><span className="dot-color" style={{ background: '#6755F5' }} />数据表 · 近 8 个月</div></div>
          <AreaChart data={portalTrend} height={215} color="#6755F5" valueName="数据表" />
        </Card>
        <Card title="数据质量分布" subtitle="按质量维度" actions={<button className="link-btn" onClick={() => go('/bid/qc-results')}>质控报告 <Icon name="arrowright" size={11} /></button>}>
          <Donut size={150} thickness={13} centerValue="95.6" label="综合得分" segments={[
            { label: '完整性', value: 98.2, color: '#6755F5' }, { label: '一致性', value: 96.4, color: '#9587FF' },
            { label: '规范性', value: 95.8, color: '#0891B2' }, { label: '及时性', value: 96.2, color: '#F59E0B' }, { label: '稳定性', value: 97.1, color: '#10B981' },
          ]} />
        </Card>
      </div>
      )}

      {(widgets.apps || widgets.news) && (
      <div className="portal-grid-2 mt-14">
        {widgets.apps && (
        <Card title="我的应用" subtitle={`按「${meta.label}」推荐`} actions={<button className="link-btn" onClick={() => go('/admin/apps')}>全部应用 <Icon name="arrowright" size={11} /></button>}>
          <div className="app-tile-grid">
            {apps.map((a) => (
              <button key={a.key} className={`app-tile tone-${a.tone}`} onClick={() => go(a.path)}>
                <span className="app-tile-icon"><Icon name={a.icon} size={19} /></span>
                <strong>{a.name}</strong>
                <small>{a.desc}</small>
                <Icon name="arrowupright" size={12} className="app-tile-arrow" />
              </button>
            ))}
          </div>
        </Card>
        )}
        {widgets.news && (
        <div className="portal-side-stack">
          <Card title="政策资讯" subtitle="国家 / 市级 / 区级" actions={<button className="link-btn" onClick={() => notify('政策资讯栏目已打开', 'info')}>更多</button>}>
            <div className="news-list">
              {portalNews.map((n) => (
                <button key={n.title} onClick={() => notify('资讯详情已打开', 'info')}>
                  <Badge tone={n.tag === '政策' ? 'blue' : n.tag === '通知' ? 'amber' : 'green'}>{n.tag}</Badge>
                  <span>{n.title}</span>
                  <em>{n.date}</em>
                </button>
              ))}
            </div>
          </Card>
          <Card title="待办事项" subtitle={`${todos.length} 项待处理`} actions={<span className="todo-count">{todos.length}</span>}>
            <div className="todo-list">
              {todos.map((t) => (
                <button key={t.title} onClick={() => notify(`已打开待办：${t.title}`, 'info')}>
                  <span className={`todo-dot ${t.level === '高' ? 'red' : t.level === '中' ? 'amber' : 'slate'}`} />
                  <div><strong>{t.title}</strong><small>{t.from} · {t.due}</small></div>
                  <Badge tone={t.level === '高' ? 'red' : t.level === '中' ? 'amber' : 'slate'}>{t.level}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>
        )}
      </div>
      )}

      {widgets.fav && (
      <div className="portal-grid-3 mt-14">
        <Card title="我的关注" subtitle="指标与资源">
          <div className="favorite-list">
            {portalFavorites.map((f) => (
              <button key={f.name} onClick={() => go('/bid/indicator-market')}>
                <div><span>{f.type}</span><strong>{f.name}</strong></div>
                <div className="fav-value"><strong>{f.value}</strong><small>{f.unit}</small><em className={f.trend.startsWith('-') ? 'down' : ''}>{f.trend}</em></div>
              </button>
            ))}
          </div>
        </Card>
        <Card title="机构数据质量排名" subtitle="2026 年 8 月" actions={<button className="link-btn" onClick={() => go('/bid/qc-results')}>查看全部</button>}>
          <div className="ranking-list">
            {qcInstitutions.map((i, idx) => (
              <div key={i.name}><span className={`rank ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span><div><strong>{i.name}</strong><div className="mini-track"><i style={{ width: `${i.score}%` }} /></div></div><em>{i.score}</em></div>
            ))}
          </div>
        </Card>
        <Card title="最近使用" subtitle="快捷入口">
          <div className="recent-list">
            {[
              { label: '采集方案配置', icon: 'sliders', path: '/bid/collection-wizard' },
              { label: '质控可视化流程', icon: 'workflow', path: '/collection/qc-designer' },
              { label: '指标市场', icon: 'store', path: '/bid/indicator-market' },
              { label: '居民主档案', icon: 'fingerprint', path: '/bid/main-archive' },
              { label: '门户编排', icon: 'boxes', path: '/admin/portal-composer' },
            ].map((r) => <button key={r.label} onClick={() => go(r.path)}><span><Icon name={r.icon} size={14} /></span>{r.label}<Icon name="arrowright" size={12} /></button>)}
          </div>
          <div className="divider-h" />
          <button className="portal-help" onClick={() => notify('演示指引已打开', 'info')}><Icon name="help" size={14} /><div><strong>演示遇到问题？</strong><small>查看 17 项演示脚本与常见问题</small></div><Icon name="arrowright" size={12} /></button>
        </Card>
      </div>
      )}

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="快速搜索" desc="检索指标、机构、数据表或应用入口" width={520}
        footer={<><Btn onClick={() => setSearchOpen(false)}>取消</Btn><Btn variant="primary" icon="search" onClick={doSearch}>搜索</Btn></>}>
        <Field label="关键词" required><input className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="例如：门诊预约、质控中心、居民主索引" /></Field>
        <div className="tag-row mt-14">
          {['门诊预约', '质控中心', '居民主索引', '指标市场'].map((h) => (
            <button key={h} type="button" className="link-btn" onClick={() => setQ(h)}>{h}</button>
          ))}
        </div>
      </Modal>

      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="修改密码" desc="修改后需重新登录" width={460}
        footer={<><Btn onClick={() => setPwdOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setPwdOpen(false); notify('密码已更新'); }}>确认修改</Btn></>}>
        <div className="form-grid">
          <Field label="当前密码" required className="span-2"><input className="input" type="password" placeholder="••••••••" /></Field>
          <Field label="新密码" required className="span-2"><input className="input" type="password" placeholder="至少 8 位" /></Field>
          <Field label="确认新密码" required className="span-2"><input className="input" type="password" placeholder="再次输入" /></Field>
        </div>
      </Modal>
    </div>
  );
}

const demoGroups = [
  { key: 'collect', title: '故事一：数据从哪来', desc: '机构授权 → 采集方案 → CDC 实时入湖 → 预览/查询 → 监控', items: [
    { id: 'A2-01', name: '采集方案配置', type: '★', path: '/bid/collection-wizard', desc: '可视化选源、选表、映射、试跑' },
    { id: 'A4-07', name: '数据通道', type: '★', path: '/bid/realtime-channel', desc: '实时入湖 CDC、离线入湖、Doris 导出' },
    { id: 'A3-05', name: '数据预览', type: '★', path: '/bid/data-preview', desc: '目录树、表结构、样例、脱敏' },
    { id: 'A4-04', name: '数据查询', type: '★', path: '/bid/data-query', desc: '湖仓 SQL、结果、图表、历史' },
    { id: 'A4-06', name: '监控总览', type: '★', path: '/bid/monitor', desc: '任务/表看板、DAG、日志' },
  ]},
  { key: 'quality', title: '故事二：质量怎么保', desc: '五维规则 → 评分模型 → 质控流程 → 结果统计 → 知识库', items: [
    { id: 'B5-02', name: '五维规则配置', type: '▲', path: '/bid/rules', desc: '完整性/一致性/规范性/及时性/稳定性' },
    { id: 'B5-04', name: '质量评分模型', type: '▲', path: '/bid/score-model', desc: '机构/表/指标、权重、报告' },
    { id: 'A5-04', name: '质控可视化流程', type: '★', path: '/collection/qc-designer', desc: '拖拽编排、节点指标、异常下钻' },
    { id: 'A5-06', name: '质控结果统计', type: '★', path: '/collection/qc-results', desc: '筛选联动、排名下钻、明细导出' },
    { id: 'B1-02', name: '标准文档管理', type: '▲', path: '/bid/standard-docs', desc: '12 类标准、在线预览、版本' },
    { id: 'A5-07', name: '问题管理/治理大屏', type: '★', path: '/collection/qc-governance', desc: '问题闭环、知识规则用于质控、13 组件大屏' },
  ]},
  { key: 'value', title: '故事三：价值怎么用', desc: '指标市场 → 标签看板 → 主档案 → 资产管理 → 发布/停用 → 首页大屏', items: [
    { id: 'B8-02', name: '指标市场', type: '▲', path: '/bid/indicator-market', desc: '授权、预览、生命周期' },
    { id: 'B7-01', name: '标签看板', type: '▲', path: '/bid/tag-board', desc: '居民/医生/机构、样本下钻' },
    { id: 'B4-02', name: '居民主档案', type: '▲', path: '/bid/main-archive', desc: 'PID、条线、相似度、调阅' },
    { id: 'B10-02', name: '数据资产管理', type: '★', path: '/bid/asset-management', desc: '编目、分级、脱敏、API' },
    { id: 'B10-03', name: '资产发布/停用', type: '★', path: '/bid/asset-publish', desc: '批量发布、审批、审计' },
    { id: 'C2-01', name: '首页大屏', type: '▲', path: '/bid/home', desc: '驾驶舱、应用、资讯、关注' },
  ]},
];

export function DemoIndex() {
  const { go, notify } = useApp();
  const total = demoGroups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <PageHeader eyebrow="BID DEMO CONTROL" title="应标演示清单" desc="10 项 ★ 现场演示 + 7 项 ▲ 功能截图，按三个故事组织，建议按顺序演示。" actions={<><Btn icon="download" onClick={() => notify('演示脚本已导出（Excel）')}>导出脚本</Btn><Btn variant="primary" icon="play" onClick={() => go('/bid/collection-wizard')}>开始演示</Btn></>} />
      <div className="demo-hero">
        <div className="demo-hero-left">
          <span className="demo-tag"><i /> 应标演示版 · 17 项硬指标</span>
          <h2>17 项 ★/▲ 已全部就绪</h2>
          <p>从数据接入到质量治理，再到指标、标签、资产运营，形成一条可讲、可演、可追溯的故事线。</p>
          <div className="demo-hero-actions">
            <button className="hero-btn primary" onClick={() => go('/bid/collection-wizard')}>按顺序演示 <Icon name="arrowright" size={14} /></button>
            <button className="hero-btn" onClick={() => go('/collection/qc-designer')}>跳到质控流程</button>
            <button className="hero-btn ghost" onClick={() => go('/bid/asset-publish')}>跳到资产发布</button>
          </div>
        </div>
        <div className="demo-hero-right">
          <RadialScore value={100} size={132} thickness={10} color="#7FE3CE" label="准备度" suffix="%" />
          <div className="demo-progress-list">
            <div><span>★ 现场演示</span><strong>10 / 10</strong></div>
            <div><span>▲ 功能截图</span><strong>7 / 7</strong></div>
            <div><span>端到端故事</span><strong>3 / 3</strong></div>
            <div><span>演示环境</span><strong>已冻结</strong></div>
          </div>
        </div>
      </div>

      <div className="demo-story-grid">
        {demoGroups.map((g, gi) => (
          <div className="demo-story" key={g.key}>
            <div className="demo-story-head"><span className="story-index">0{gi + 1}</span><div><strong>{g.title}</strong><p>{g.desc}</p></div><Badge tone={gi === 0 ? 'blue' : gi === 1 ? 'violet' : 'green'}>{g.items.length} 项</Badge></div>
            <div className="demo-item-list">
              {g.items.map((it) => (
                <button key={it.id} className="demo-item" onClick={() => go(it.path)}>
                  <span className={`demo-type ${it.type === '★' ? 'star' : 'tri'}`}>{it.type}</span>
                  <div><strong>{it.name}</strong><small>{it.id} · {it.desc}</small></div>
                  <Icon name="arrowupright" size={13} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="info-note mt-14"><Icon name="circlealert" size={14} /><span>演示顺序建议：采集方案 → 实时通道 → 数据预览/查询 → 监控 → 质控规则/评分 → 质控流程/结果 → 知识库 → 指标/标签/主档案 → 资产/发布 → 首页大屏。每项预留 2—4 分钟。</span></div>
    </>
  );
}
