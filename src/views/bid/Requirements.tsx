import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, KeyValue, PageHeader, SearchInput, Select, StatCard } from '../../components/ui';
import { useApp } from '../../app-context';
import { REQUIREMENTS, REQUIREMENT_STATS, RequirementRow } from '../../dataRequirements';

const domainTone: Record<string, string> = { '数据采集与治理': 'blue', '数据中台': 'violet', '业务中台': 'green', '非功能与交付': 'amber' };
const readyTone = (r: RequirementRow) => r.readiness.startsWith('可演示') ? 'green' : r.readiness === '已实现' ? 'blue' : r.readiness === '需增强' ? 'amber' : r.readiness === '待建设' ? 'slate' : 'violet';

export function RequirementsPage() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('全部');
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState('');
  const [demoOnly, setDemoOnly] = useState(false);
  const [active, setActive] = useState<RequirementRow | null>(null);

  const rows = useMemo(() => REQUIREMENTS.filter((r) => {
    if (domain !== '全部' && r.module !== domain) return false;
    if (status && r.readiness !== status) return false;
    if (phase && r.phase !== phase) return false;
    if (demoOnly && !r.readiness.startsWith('可演示')) return false;
    if (q && !(r.id + r.tenderName + r.planName + r.page + r.subSystem + r.detail).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, domain, status, phase, demoOnly]);

  const domains = ['全部', '数据采集与治理', '数据中台', '业务中台', '平台管理'];
  const domainCount = (d: string) => REQUIREMENTS.filter((r) => r.module === d).length;

  const exportCsv = () => {
    const header = ['编号', '一级域', '二级子域', '招标功能名称', '规划系统功能名称', '页面/服务', '路由', '就绪度', '阶段'];
    const body = rows.map((r) => [r.id, r.module, r.subSystem, r.tenderName, r.planName, r.page, r.route, r.readiness, r.phase].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + header.join(',') + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '系统功能对标对表.csv'; a.click(); URL.revokeObjectURL(a.href);
    notify(`已导出 ${rows.length} 条对标记录`);
  };

  return (
    <>
      <PageHeader eyebrow="REQUIREMENT BENCHMARKING" title="功能对标对表" desc="以第3章招标需求为基准，将 96 项功能逐条映射到规划系统名称、所属模块与页面；招标名称保留，系统名称标准化。" actions={<><Btn icon="download" onClick={exportCsv}>导出当前视图</Btn><Btn variant="primary" icon="database" onClick={() => notify('对标底稿：bid-analysis/系统功能对标对表.xlsx', 'info')}>查看底稿</Btn></>} />
      <div className="req-hero">
        <div className="req-hero-left"><span className="portal-eyebrow">BID TO SYSTEM · 96 ITEMS</span><h2>需求不丢项，名称可落地</h2><p>一级域对齐招标三大板块，二级子域沿用招标术语，三级功能做系统化命名，四级落到页面/服务。★/▲ 项单独标记，优先保证可演示。</p><div className="req-hero-stats"><div><span>需求项</span><strong>96</strong></div><div><span>★/▲ 可演示</span><strong>17</strong></div><div><span>需增强</span><strong>45</strong></div><div><span>待建设</span><strong>29</strong></div><div><span>咨询/交付</span><strong>5</strong></div></div></div>
        <div className="req-hero-right"><div className="req-arch"><span>统一门户</span><i>→</i><span>数据采集与治理</span><i>→</i><span>数据中台</span><i>→</i><span>业务中台</span></div><div className="req-naming"><strong>命名规则</strong><span>一级域 / 二级子域 / 功能名称 / 页面·服务</span><em>例：数据采集与治理 / 湖仓一体数据采集 / 采集方案配置 / 采集方案配置页</em></div></div>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="数据采集与治理" value="44" unit="项" delta="采集 · 标化 · 湖仓 · 治理" icon="database" tone="blue" />
        <StatCard label="数据中台" value="38" unit="项" delta="标准 · 质量 · 指标 · 资产" icon="layers" tone="violet" />
        <StatCard label="业务中台" value="11" unit="项" delta="门户 · 认证 · 共享 · 流程" icon="network" tone="green" />
        <StatCard label="平台与交付" value="3" unit="项" delta="信创 · 安全 · 实施" icon="shield" tone="amber" />
      </div>

      <div className="req-toolbar mt-14">
        <div className="req-domains">{domains.map((d) => <button key={d} className={domain === d ? 'is-active' : ''} onClick={() => setDomain(d)}>{d}<em>{d === '全部' ? 96 : domainCount(d)}</em></button>)}</div>
        <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索功能、页面、编号" width={230} /><Select value={status} onChange={setStatus} options={['', '可演示（1.0）', '已实现', '需增强', '待建设', '咨询/交付']} placeholder="全部就绪度" width={120} /><Select value={phase} onChange={setPhase} options={['', 'P1', 'P2', 'P3', 'P4']} placeholder="全部阶段" width={90} /><button className={`req-demo-toggle ${demoOnly ? 'is-on' : ''}`} onClick={() => setDemoOnly((v) => !v)}><span>★/▲</span> 只看演示项</button></div>
      </div>

      <Card className="mt-10" noPad>
        <div className="req-table-head"><span>对标结果 <em>{rows.length} 项</em></span><span className="muted xs">招标名称 → 规划名称 → 页面/路由</span></div>
        <div className="pad-h"><DataTable<RequirementRow> rows={rows} pageSize={12} onRowClick={(r) => setActive(r)} columns={[
          { key: 'id', title: '编号', width: 72, render: (r) => <span className="mono-cell">{r.id}</span> },
          { key: 'tenderName', title: '招标功能名称', width: 190, render: (r) => <div className="cell-main"><strong>{r.tenderName}</strong><small>{r.subSystem}</small></div> },
          { key: 'planName', title: '规划系统功能 / 页面', render: (r) => <div className="req-map"><span>{r.planName}</span><Icon name="arrowright" size={10} /><em>{r.page}</em>{r.route !== '—' && <code>{r.route}</code>}</div> },
          { key: 'module', title: '一级域', width: 110, render: (r) => <Badge tone={domainTone[r.domain] as any}>{r.module}</Badge> },
          { key: 'kind', title: '类型', width: 64, render: (r) => <span className={`req-kind ${r.kind === '★演示' ? 'star' : r.kind === '▲截图' ? 'tri' : ''}`}>{r.kind === '功能' ? '功能' : r.kind}</span> },
          { key: 'readiness', title: '就绪度', width: 92, render: (r) => <Badge tone={readyTone(r) as any} dot>{r.readiness}</Badge> },
          { key: 'phase', title: '阶段', width: 54, render: (r) => <Badge tone="slate">{r.phase}</Badge> },
        ]} /></div>
        <div className="req-table-foot"><span>已按招标序号排序 · 共 96 项</span><span><Icon name="info" size={11} /> 点击行查看详细参数、验收要点与命名路径</span></div>
      </Card>

      <div className="grid grid-2 mt-14">
        <Card title="对标口径" subtitle="招标名称与系统名称的关系">
          <div className="req-rules"><div><b>01</b><div><strong>招标名称不改</strong><small>保留第3章原文，便于评标逐条核对。</small></div></div><div><b>02</b><div><strong>系统名称标准化</strong><small>统一为“动词 + 对象 + 范围”，如“存量数据初始化”。</small></div></div><div><b>03</b><div><strong>页面名称可演示</strong><small>每个 P1 功能必须落到一个页面/服务，不能只停留在模块名。</small></div></div><div><b>04</b><div><strong>新建项有归属</strong><small>待建设项也给出目标模块、页面与服务边界，避免漏项。</small></div></div></div>
        </Card>
        <Card title="板块就绪度" subtitle="按可演示/已实现/需增强/待建设">
          <div className="req-bars">{['数据采集与治理', '数据中台', '业务中台', '平台管理'].map((d) => { const list = REQUIREMENTS.filter((r) => r.module === d); const ready = list.filter((r) => r.readiness.startsWith('可演示') || r.readiness === '已实现').length; return <div key={d}><div className="resource-head"><span>{d}</span><strong>{ready} / {list.length}</strong></div><div className="req-bar"><i style={{ width: `${(ready / Math.max(list.length, 1)) * 100}%` }} /></div></div>; })}</div>
          <div className="info-note mt-10"><Icon name="sparkles" size={12} /><span>17 项 ★/▲ 已全部落到演示页面；P1 之外的建设项按 P2—P4 排期。</span></div>
        </Card>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} width={640} title={active?.tenderName || ''} desc={active ? `${active.id} · ${active.module} / ${active.subSystem}` : ''} footer={<><Btn onClick={() => setActive(null)}>关闭</Btn>{active?.route && active.route !== '—' && <Btn variant="primary" icon="arrowupright" onClick={() => { if (active?.route) { go(active.route.startsWith('/') ? active.route : `/${active.route}`); setActive(null); } }}>打开页面</Btn>}</>}>
        {active && <>
          <div className="req-detail-tags"><Badge tone={domainTone[active.domain] as any}>{active.module}</Badge><Badge tone={readyTone(active) as any} dot>{active.readiness}</Badge><Badge tone="slate">{active.phase}</Badge><Badge tone={active.priority === '高' ? 'red' : 'amber'}>{active.priority}优先级</Badge><span className={`req-kind ${active.kind === '★演示' ? 'star' : active.kind === '▲截图' ? 'tri' : ''}`}>{active.kind}</span></div>
          <div className="req-detail-naming"><span>命名路径</span><strong>{active.naming}</strong><em>页面：{active.page} {active.route !== '—' ? `· ${active.route}` : '· 待建设'}</em></div>
          <div className="section-title-sm mt-14">招标详细要求</div><p className="req-detail-text">{active.detail}</p>
          <div className="section-title-sm mt-14">验收 / 演示要点</div><p className="req-detail-text">{active.acceptance}</p>
          <KeyValue className="mt-14" cols={2} items={[{ label: '当前状态', value: active.status }, { label: '覆盖率', value: `${active.coverage}%` }, { label: '建设动作', value: active.action }, { label: '目标形态', value: active.target }, { label: '页面用途', value: active.purpose || '—', wide: true }]} />
        </>}
      </Drawer>
    </>
  );
}
