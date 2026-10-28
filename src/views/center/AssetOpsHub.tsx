'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { auditFeed, bidAssets, publishAssets } from '../../dataBid';

type TabKey = 'panorama' | 'catalog' | 'publish' | 'share';

type ShareTask = { id: string; name: string; channel: 'API' | '共享库' | '文件'; role: string; level: string; status: '运行中' | '成功' | '待审批' | '已拒绝' };
type ApproveRow = { id: string; asset: string; applicant: string; dept: string; role: string; purpose: string; status: '待审批' | '已通过' | '已驳回' };

const shareTasks: ShareTask[] = [
  { id: 'SH-01', name: '门诊就诊 API 订阅', channel: 'API', role: '医保办分析岗', level: '有条件开放', status: '运行中' },
  { id: 'SH-02', name: '检验结果共享库同步', channel: '共享库', role: '区域检验中心', level: '有条件开放', status: '成功' },
  { id: 'SH-03', name: '公卫人群包文件导出', channel: '文件', role: '公卫科', level: '有条件开放', status: '待审批' },
  { id: 'SH-04', name: 'DRG 指标 API', channel: 'API', role: '医政科', level: '无条件开放', status: '运行中' },
  { id: 'SH-05', name: '敏感病历下载申请', channel: '文件', role: '科研办', level: '非开放', status: '已拒绝' },
];

const approveSeed: ApproveRow[] = [
  { id: 'AP-01', asset: '门诊就诊记录资源', applicant: '刘一鸣', dept: '医保办', role: '分析岗', purpose: '费用稽核看板', status: '待审批' },
  { id: 'AP-02', asset: '患者主索引数据资源', applicant: '王思远', dept: '信息中心', role: '集成岗', purpose: '跨机构调阅', status: '待审批' },
  { id: 'AP-03', asset: '检验报告资源', applicant: '张敏', dept: '检验科', role: '质控岗', purpose: '室间质评', status: '已通过' },
  { id: 'AP-04', asset: '电子病历文书资源', applicant: '陈研', dept: '科研办', role: '课题员', purpose: '回顾性研究', status: '已驳回' },
];

const growth = [
  { label: '00', value: 12 }, { label: '04', value: 8 }, { label: '08', value: 46 },
  { label: '12', value: 62 }, { label: '16', value: 58 }, { label: '20', value: 34 }, { label: '24', value: 18 },
];

/** B10 资产运营：全景 · 资产管理★ · 发布/停用★ · 审批共享监控 */
export function AssetOpsHubPage({ initialTab = 'catalog' }: { initialTab?: TabKey }) {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [security, setSecurity] = useState('');
  const [openLv, setOpenLv] = useState('');
  const [active, setActive] = useState<typeof bidAssets[0] | null>(null);
  const [detailTab, setDetailTab] = useState('meta');
  const [pubRows, setPubRows] = useState(publishAssets);
  const [pubTab, setPubTab] = useState('pending');
  const [selected, setSelected] = useState<string[]>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approves, setApproves] = useState(approveSeed);
  const [shareQ, setShareQ] = useState('');
  const [view, setView] = useState<'物理' | '逻辑'>('逻辑');

  const catalogRows = useMemo(() => bidAssets.filter((a) =>
    (domain === 'all' || a.domain === domain)
    && (!security || a.security === security)
    && (!openLv || a.open === openLv)
    && (!q || (a.name + a.id + a.domain).includes(q))
  ), [q, domain, security, openLv]);

  const filteredPub = pubRows.filter((r) =>
    pubTab === 'pending' ? r.status === '待审核' : pubTab === 'published' ? r.status === '已发布' : r.status === '已停用'
  );

  const shareRows = useMemo(() => shareTasks.filter((s) =>
    (s.name + s.role).toLowerCase().includes(shareQ.toLowerCase())
  ), [shareQ]);

  const toggle = (id: string) => setSelected((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const batch = (action: 'publish' | 'stop') => {
    if (!selected.length) { notify('请先勾选资产', 'error'); return; }
    setPubRows((arr) => arr.map((r) => selected.includes(r.id) ? { ...r, status: action === 'publish' ? '已发布' : '已停用' } : r));
    notify(action === 'publish' ? `已发布 ${selected.length} 项资产 · 订阅方已通知` : `已停用 ${selected.length} 项 · 审计已记`);
    setSelected([]);
  };

  const decide = (id: string, ok: boolean) => {
    setApproves((arr) => arr.map((a) => a.id === id ? { ...a, status: ok ? '已通过' : '已驳回' } : a));
    notify(ok ? '授权已通过 · 可下载/调用受控' : '申请已驳回 · 已通知申请人');
  };

  return (
    <>
      <PageHeader
        eyebrow="ASSET OPERATIONS · B10"
        title="资产运营"
        desc="B10-01 数据全景 · B10-02 资产管理★ · B10-03 发布/停用★ · B10-04 审批·共享·监控·分级。"
        actions={
          <>
            <Btn icon="chart" onClick={() => go('/bid/self-bi')}>自服务 BI</Btn>
            <Btn icon="store" onClick={() => go('/bid/indicator-market')}>指标管理</Btn>
            <Btn variant="primary" icon="uploadcloud" onClick={() => { setTab('publish'); setApproveOpen(true); }}>批量发布</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '数据全景', d: '物理/逻辑·报告' },
          { n: '02', t: '资产管理★', d: '编目·分级·脱敏' },
          { n: '03', t: '发布/停用★', d: '批量·审核·审计' },
          { n: '04', t: '共享监控', d: '审批·订阅·API' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['panorama', 'catalog', 'publish', 'share'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 286 项资产 · 发布率 84.6%</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="资产总量" value="286" unit="项" delta="全景可下钻" icon="layers" tone="blue" onClick={() => setTab('panorama')} />
        <StatCard label="编目资产" value={String(bidAssets.length)} unit="项" delta="★ 可演示" icon="folder" tone="violet" onClick={() => setTab('catalog')} />
        <StatCard label="待发布" value={String(pubRows.filter((r) => r.status === '待审核').length)} unit="项" delta="★ 批量审核" icon="uploadcloud" tone="amber" onClick={() => setTab('publish')} />
        <StatCard label="共享任务" value={String(shareTasks.length)} unit="个" delta="可监控" icon="network" tone="green" onClick={() => setTab('share')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'panorama', label: '数据全景' },
          { key: 'catalog', label: '资产管理 ★', count: bidAssets.length },
          { key: 'publish', label: '发布 / 停用 ★', count: pubRows.filter((r) => r.status === '待审核').length },
          { key: 'share', label: '审批共享监控', count: approves.filter((a) => a.status === '待审批').length },
        ]}
      />

      {tab === 'panorama' && (
        <>
          <div className="market-filters mt-14">
            <div className="market-cats">
              {(['逻辑', '物理'] as const).map((v) => (
                <button key={v} className={view === v ? 'is-active' : ''} onClick={() => setView(v)}>{v}视角</button>
              ))}
            </div>
            <Btn size="sm" icon="download" onClick={() => notify(`${view}视角全景报告已导出（采集/治理/共享）`)}>导出全景报告</Btn>
          </div>
          <div className="grid grid-3 mt-14">
            <Card title="24 小时数据总量" subtitle="入湖 / 治理 / 共享">
              <AreaChart data={growth} color="#6755F5" height={160} suffix=" 万条" />
              <div className="chart-foot-stats">
                <div><span>采集入湖</span><strong>1.82 亿</strong></div>
                <div><span>质控通过</span><strong>98.6%</strong></div>
                <div><span>共享调用</span><strong>28.6 万</strong></div>
              </div>
            </Card>
            <Card title={view === '逻辑' ? '逻辑资产关系' : '物理存储分布'} subtitle={view === '逻辑' ? '主题 · 指标 · API' : '湖仓分层'}>
              {view === '逻辑' ? (
                <Donut size={140} thickness={12} centerValue="286" label="资产" segments={[
                  { label: '主题表', value: 120, color: '#6755F5' },
                  { label: '指标', value: 86, color: '#9587FF' },
                  { label: 'API', value: 50, color: '#0891B2' },
                  { label: '文件', value: 30, color: '#059669' },
                ]} />
              ) : (
                <BarList items={[
                  { label: 'ODS', value: 9862 },
                  { label: 'DWD', value: 1842 },
                  { label: 'DIM', value: 682 },
                  { label: 'DM', value: 460 },
                ]} unit=" 表" color="#0891B2" />
              )}
            </Card>
            <Card title="机构 / 主题覆盖" subtitle="42 家机构">
              <BarList items={[
                { label: '两江新区人民医院', value: 96 },
                { label: '两江妇幼保健院', value: 88 },
                { label: '金山街道社区', value: 72 },
                { label: '礼嘉街道社区', value: 68 },
                { label: '蔡家中心卫生院', value: 64 },
              ]} unit="%" color="#6755F5" />
            </Card>
          </div>
          <div className="grid grid-2 mt-14">
            <Card title="采集 / 治理 / 共享报告" subtitle="一键生成">
              <div className="publish-checks">
                {[
                  ['采集报告', '通道延迟、表增量、对账差异', 'activity'],
                  ['治理报告', '五维质量、问题闭环、标准覆盖', 'shield'],
                  ['共享报告', '订阅、API、文件、审批时效', 'network'],
                ].map(([t, d, i]) => (
                  <div key={t}>
                    <span><Icon name={i} size={13} /></span>
                    <div><strong>{t}</strong><small>{d}</small></div>
                    <button className="link-btn" onClick={() => notify(`${t}已生成`)}>生成</button>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="关系图谱摘要" subtitle="资产血缘入口">
              <div className="check-list">
                {[
                  ['患者主索引', '上游 6 · 下游 18', '通过'],
                  ['门诊就诊', '上游 4 · 下游 12', '通过'],
                  ['检验报告', '上游 3 · 下游 9', '预警'],
                  ['DRG 指标集', '上游 8 · 下游 5', '通过'],
                ].map(([n, d, s]) => (
                  <div key={n}>
                    <span className={s === '通过' ? 'ok' : 'warn'}>{s === '通过' ? <Icon name="check" size={12} /> : <Icon name="alert" size={12} />}</span>
                    <strong>{n}</strong>
                    <em>{d}</em>
                  </div>
                ))}
              </div>
              <Btn className="mt-14 w-full" variant="secondary" icon="network" onClick={() => go('/center/graph')}>打开依赖/血缘</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'catalog' && (
        <div className="assetops-layout mt-14">
          <aside className="assetops-side">
            <div className="aos-head"><Icon name="folder" size={14} /> 资源类目</div>
            {[['all', '全部资源', 286, 'layers'], ['HIS', 'HIS 业务', 86, 'database'], ['EMR', 'EMR 病历', 64, 'file'], ['LIS', 'LIS 检验', 42, 'activity'], ['PACS', 'PACS 影像', 36, 'scan'], ['公卫', '公卫健康', 28, 'users'], ['指标', '指标服务', 30, 'gauge']].map(([k, l, n, i]) => (
              <button key={k as string} className={domain === k ? 'is-active' : ''} onClick={() => setDomain(k as string)}><Icon name={i as string} size={13} /><span>{l}</span><em>{n}</em></button>
            ))}
            <div className="aos-divider" />
            <div className="aos-title">安全级别 L1—L4</div>
            {[['L4', '敏感', '#DC2626', 12], ['L3', '较敏感', '#D97706', 74], ['L2', '低敏感', '#6755F5', 126], ['L1', '不敏感', '#059669', 74]].map(([k, l, c, n]) => (
              <button key={k as string} className={security === k ? 'is-active' : ''} onClick={() => setSecurity(security === k ? '' : k as string)}>
                <span className="aos-dot" style={{ background: c as string }} /><span>{k} · {l}</span><em>{n}</em>
              </button>
            ))}
            <div className="aos-tip"><Icon name="sparkles" size={14} /><div><strong>智能编目</strong><p>自动识别业务域、敏感字段、开放级别与主题分类。</p></div></div>
          </aside>
          <div className="assetops-main">
            <Card noPad>
              <div className="assetops-toolbar">
                <div className="filter-bar">
                  <SearchInput value={q} onChange={setQ} placeholder="搜索资产名称、编号或业务域" width={240} />
                  <Select value={openLv} onChange={setOpenLv} options={['', '无条件开放', '有条件开放', '非开放']} placeholder="开放级别" width={120} />
                </div>
                <div className="row-actions">
                  <Btn size="sm" icon="settings" onClick={() => notify('主题分类 / 类目管理已打开')}>类目</Btn>
                  <Btn size="sm" icon="download" onClick={() => notify('资产清单已导出')}>导出</Btn>
                  <Btn size="sm" variant="primary" icon="uploadcloud" onClick={() => setTab('publish')}>去发布</Btn>
                </div>
              </div>
              <div className="assetops-note"><Icon name="shield" size={12} /><span>发布前须完成安全分级、脱敏规则与开放条件；敏感资产（L3/L4）需审批。</span></div>
              <div className="pad-h">
                <DataTable rows={catalogRows} pageSize={8} onRowClick={(r) => { setActive(r); setDetailTab('meta'); }} columns={[
                  { key: 'name', title: '数据资产', render: (a) => (
                    <div className="assetops-name">
                      <span className={`asset-type-icon ${a.type === 'API' ? 'api' : a.type === '文件' ? 'file' : 'table'}`}>
                        <Icon name={a.type === 'API' ? 'network' : a.type === '文件' ? 'file' : 'table'} size={14} />
                      </span>
                      <div className="cell-main"><strong>{a.name}</strong><small>{a.id} · {a.type} · {a.domain}</small></div>
                    </div>
                  ) },
                  { key: 'security', title: '安全', width: 70, render: (a) => <Badge tone={a.security === 'L4' ? 'red' : a.security === 'L3' ? 'amber' : 'blue'}>{a.security}</Badge> },
                  { key: 'open', title: '开放', width: 100, render: (a) => <Badge tone={a.open === '无条件开放' ? 'green' : a.open === '有条件开放' ? 'blue' : 'slate'}>{a.open}</Badge> },
                  { key: 'masking', title: '脱敏', width: 130, render: (a) => <span className="muted">{a.masking}</span> },
                  { key: 'api', title: 'API', width: 80, render: (a) => <Badge tone={a.api === '已发布' ? 'green' : a.api === '待发布' ? 'amber' : 'slate'}>{a.api}</Badge> },
                  { key: 'subscribers', title: '订阅', width: 50, align: 'right', render: (a) => <span className="mono-cell">{a.subscribers}</span> },
                  { key: 'ops', title: '操作', width: 120, render: (a) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => { setActive(a); setDetailTab('meta'); }}>详情</button>
                      <button className="link-muted" onClick={() => notify('编目编辑已打开')}>编目</button>
                      <button className="link-muted" onClick={() => notify('API 发布配置已打开')}>API</button>
                    </div>
                  ) },
                ]} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'publish' && (
        <div className="publish-layout mt-14">
          <div className="publish-main">
            <Card noPad>
              <div className="publish-toolbar">
                <Tabs variant="line" value={pubTab} onChange={(v) => { setPubTab(v); setSelected([]); }} items={[
                  { key: 'pending', label: '待发布', count: pubRows.filter((r) => r.status === '待审核').length },
                  { key: 'published', label: '已发布', count: pubRows.filter((r) => r.status === '已发布').length },
                  { key: 'stopped', label: '已停用', count: pubRows.filter((r) => r.status === '已停用').length },
                ]} />
                <div className="row-actions">
                  <span className="muted xs">已选 {selected.length} 项</span>
                  {pubTab === 'pending' ? <Btn size="sm" variant="primary" icon="checkcircle" onClick={() => setApproveOpen(true)}>批量发布</Btn> : null}
                  {pubTab === 'published' ? <Btn size="sm" variant="danger" icon="x" onClick={() => batch('stop')}>批量停用</Btn> : null}
                  <Btn size="sm" icon="download" onClick={() => notify('清单已导出')}>导出</Btn>
                </div>
              </div>
              <div className="pad-h">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}><input type="checkbox" className="checkbox" checked={filteredPub.length > 0 && selected.length === filteredPub.length} onChange={(e) => setSelected(e.target.checked ? filteredPub.map((r) => r.id) : [])} /></th>
                      <th>资产名称</th><th>类型</th><th>安全</th><th>申请人</th><th>更新</th><th>状态</th><th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPub.map((r) => (
                      <tr key={r.id}>
                        <td><input type="checkbox" className="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                        <td><div className="cell-main"><strong>{r.name}</strong><small>{r.id}</small></div></td>
                        <td><Badge tone="slate">{r.type}</Badge></td>
                        <td><Badge tone={r.security === 'L4' ? 'red' : r.security === 'L3' ? 'amber' : 'blue'}>{r.security}</Badge></td>
                        <td>{r.applicant}</td>
                        <td className="muted">{r.updated}</td>
                        <td><Badge dot>{r.status === '待审核' ? '待审核' : r.status}</Badge></td>
                        <td>
                          <div className="row-actions">
                            <button className="link-btn" onClick={() => notify('资产详情已打开')}>详情</button>
                            {r.status === '待审核' ? <button className="link-muted" onClick={() => { setPubRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '已发布' } : x)); notify(`${r.name} 已发布`); }}>发布</button> : null}
                            {r.status === '已发布' ? <button className="link-muted" onClick={() => { setPubRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '已停用' } : x)); notify(`${r.name} 已停用`); }}>停用</button> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-foot"><span className="table-count">共 {filteredPub.length} 项</span><span className="muted xs">发布后开放平台可见 · 停用保留历史版本 · 订阅/API 通知</span></div>
              </div>
            </Card>
            <Card className="mt-14" title="发布前检查" subtitle="批量发布前确认">
              <div className="publish-checks">
                {[['安全分级', 'L1—L4 已确认，敏感资产需审批', 'shield'], ['脱敏规则', '身份证/手机号/姓名已绑定', 'eye'], ['开放条件', '范围、用途与安全措施已登记', 'key'], ['API 配置', '服务已生成并连通测试', 'network'], ['订阅关系', '已有订阅方将收到变更通知', 'bell'], ['审计留痕', '发布/停用全程记录', 'scroll']].map(([t, d, i]) => (
                  <div key={t}><span><Icon name={i} size={13} /></span><div><strong>{t}</strong><small>{d}</small></div></div>
                ))}
              </div>
            </Card>
          </div>
          <aside className="publish-side">
            <Card title="发布流程" subtitle="审核后生效">
              <div className="publish-flow">
                {[['选择资产', `已选 ${selected.length} 项`], ['安全校验', '分级 / 脱敏 / 开放条件'], ['发布审核', '数据治理办'], ['开放平台', '订阅 / API / 共享']].map(([t, d], i) => (
                  <div key={t} className={i === 0 && selected.length ? 'is-done' : ''}><span>{i + 1}</span><div><strong>{t}</strong><small>{d}</small></div></div>
                ))}
              </div>
            </Card>
            <Card className="mt-14" title="发布审计" subtitle="最近操作">
              <div className="audit-feed">{auditFeed.map(([t, u, a, o, s]) => (
                <div key={t + o}><span className="audit-time">{t}</span><div><strong>{u} · {a}</strong><small>{o}</small></div><Badge tone={s === '成功' ? 'green' : 'amber'}>{s}</Badge></div>
              ))}</div>
            </Card>
            <Card className="mt-14" title="开放平台监控" subtitle="今日">
              <div className="open-stats">
                <div><span>订阅</span><strong>18</strong></div>
                <div><span>API 调用</span><strong>28.6 万</strong></div>
                <div><span>共享库</span><strong>12</strong></div>
                <div><span>文件</span><strong>6</strong></div>
              </div>
            </Card>
          </aside>
        </div>
      )}

      {tab === 'share' && (
        <>
          <div className="grid grid-2 mt-14">
            <Card title="资产审批" subtitle="按处室 / 岗位 / 角色授权" noPad actions={
              <Badge tone="amber">{approves.filter((a) => a.status === '待审批').length} 待审</Badge>
            }>
              <div className="pad-h">
                <DataTable rows={approves} pageSize={6} columns={[
                  { key: 'asset', title: '资产', render: (r) => <div className="cell-main"><strong>{r.asset}</strong><small>{r.purpose}</small></div> },
                  { key: 'who', title: '申请人', width: 110, render: (r) => <div className="cell-main"><strong>{r.applicant}</strong><small>{r.dept} · {r.role}</small></div> },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已通过' ? 'green' : r.status === '待审批' ? 'amber' : 'red'} dot>{r.status}</Badge> },
                  { key: 'ops', title: '操作', width: 110, render: (r) => r.status === '待审批' ? (
                    <div className="row-actions">
                      <button className="link-btn" onClick={() => decide(r.id, true)}>通过</button>
                      <button className="link-muted" onClick={() => decide(r.id, false)}>驳回</button>
                    </div>
                  ) : <span className="muted xs">—</span> },
                ]} />
              </div>
            </Card>
            <Card title="下载与开放管控" subtitle="分析下载 · 开放等级与条件">
              <div className="open-options">
                {['无条件开放', '有条件开放', '非开放'].map((o) => (
                  <button key={o} className={o === '有条件开放' ? 'is-active' : ''}>
                    <span className="radio-dot" />
                    <div>
                      <strong>{o}</strong>
                      <small>{o === '无条件开放' ? '无需申请即可获取' : o === '有条件开放' ? '须用途、场景与安全措施' : '脱敏匿名后方可开放'}</small>
                    </div>
                    {o === '有条件开放' && <Badge tone="blue">默认</Badge>}
                  </button>
                ))}
              </div>
              <div className="info-note mt-14"><Icon name="key" size={13} /><span>分析下载需审批；敏感字段强制脱敏；密钥由安全管理员签发。</span></div>
            </Card>
          </div>

          <Card className="mt-14" title="共享任务 / 订阅 · API · 文件监控" subtitle="通道状态与审计" noPad actions={
            <SearchInput value={shareQ} onChange={setShareQ} placeholder="搜索任务/角色" width={180} />
          }>
            <div className="pad-h">
              <DataTable rows={shareRows} pageSize={6} columns={[
                { key: 'name', title: '共享任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.role}</small></div> },
                { key: 'channel', title: '通道', width: 80, render: (r) => <Badge tone={r.channel === 'API' ? 'violet' : r.channel === '共享库' ? 'blue' : 'slate'}>{r.channel}</Badge> },
                { key: 'level', title: '开放等级', width: 100, render: (r) => r.level },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '成功' || r.status === '运行中' ? 'green' : r.status === '待审批' ? 'amber' : 'red'} dot>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 90, render: (r) => (
                  <button className="link-btn" onClick={() => notify(`${r.name} 监控明细已打开`)}>监控</button>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} width={680} title={active?.name || ''} desc={active ? `${active.id} · ${active.type} · ${active.domain}` : ''}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn icon="uploadcloud" onClick={() => { setActive(null); setTab('publish'); }}>去发布</Btn><Btn variant="primary" icon="network" onClick={() => notify(active?.api === '已发布' ? 'API 文档已打开' : 'API 发布配置已打开')}>{active?.api === '已发布' ? '查看 API' : '发布 API'}</Btn></>}>
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>安全级别</span><strong>{active.security}</strong></div>
              <div><span>开放级别</span><strong className="sm">{active.open}</strong></div>
              <div><span>订阅方</span><strong>{active.subscribers}</strong></div>
              <div><span>API</span><strong className="sm">{active.api}</strong></div>
            </div>
            <Tabs variant="line" value={detailTab} onChange={setDetailTab} items={[
              { key: 'meta', label: '元数据' }, { key: 'security', label: '安全与脱敏' }, { key: 'open', label: '开放与共享' }, { key: 'api', label: 'API 服务' },
            ]} />
            <div className="tab-panel">
              {detailTab === 'meta' && (
                <>
                  <KeyValue cols={2} items={[
                    { label: '资源编号', value: active.id }, { label: '资源类型', value: active.type },
                    { label: '业务域', value: active.domain }, { label: '负责人', value: active.owner },
                    { label: '更新时间', value: active.updated }, { label: '订阅方', value: `${active.subscribers} 个` },
                    { label: '资源描述', value: '已纳入统一资产目录并完成安全分级与主题分类。', wide: true },
                  ]} />
                  <div className="section-title-sm mt-14">核心元数据</div>
                  <div className="tag-row">
                    {['信息资源名称', '摘要', '分类', '提供方', '信息项', '数据库信息'].map((t) => <Badge key={t} tone="blue">{t}</Badge>)}
                  </div>
                </>
              )}
              {detailTab === 'security' && (
                <>
                  <div className="security-banner">
                    <span className={`sev-ico ${active.security === 'L4' ? 'red' : active.security === 'L3' ? 'amber' : 'blue'}`}><Icon name="shield" size={17} /></span>
                    <div>
                      <strong>{active.security} · {active.security === 'L4' ? '敏感数据' : active.security === 'L3' ? '较敏感数据' : '低敏感数据'}</strong>
                      <p>按 GB/T 39725-2020 健康医疗数据安全指南分级</p>
                    </div>
                    <Badge tone="amber">需审批</Badge>
                  </div>
                  <div className="mask-list mt-14">
                    {[['身份证号', '保留后 4 位', true], ['手机号', '保留前 3 位与后 4 位', true], ['姓名', '保留姓氏', true], ['地址', '保留到街道', false]].map(([n, d, on]) => (
                      <div key={n as string}><div><strong>{n as string}</strong><small>{d as string}</small></div><Toggle checked={on as boolean} /></div>
                    ))}
                  </div>
                </>
              )}
              {detailTab === 'open' && (
                <>
                  <div className="open-options">
                    {['无条件开放', '有条件开放', '非开放'].map((o) => (
                      <button key={o} className={active.open === o ? 'is-active' : ''}>
                        <span className="radio-dot" />
                        <div><strong>{o}</strong><small>{o === '无条件开放' ? '无需申请即可获取' : o === '有条件开放' ? '需提交用途、场景与安全措施' : '需脱敏匿名后转为开放'}</small></div>
                        {active.open === o && <Badge tone="blue">当前</Badge>}
                      </button>
                    ))}
                  </div>
                  <div className="section-title-sm mt-14">共享方式</div>
                  <div className="tag-row"><Badge tone="green">API 接口</Badge><Badge tone="blue">共享库</Badge><Badge tone="slate">文件导出</Badge></div>
                </>
              )}
              {detailTab === 'api' && (
                <>
                  <div className="api-code">
                    <span>{active.api === '已发布' ? 'GET' : 'POST'}</span>
                    <code>/api/v1/assets/{active.id.toLowerCase()}</code>
                    <button onClick={() => notify('API 测试已通过 · 328ms')}>测试</button>
                  </div>
                  <KeyValue className="mt-14" cols={2} items={[
                    { label: '认证方式', value: 'OAuth 2.0 / AppKey' }, { label: '限流', value: '1,000 次/分钟' },
                    { label: '脱敏', value: active.masking }, { label: 'SLA', value: '99.95%' },
                  ]} />
                </>
              )}
            </div>
          </>
        )}
      </Drawer>

      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="提交发布审核" desc={`共 ${selected.length || '所选'} 项资产待提交；请确认安全等级、脱敏规则与开放条件。`} width={540}
        footer={<><Btn onClick={() => setApproveOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setApproveOpen(false); if (selected.length) batch('publish'); else notify('请先勾选待发布资产', 'error'); }}>提交审核并发布</Btn></>}>
        <div className="check-list vertical">
          <div><span className="ok"><Icon name="check" size={12} /></span><div><strong>安全分级已完成</strong><small>L1—L4 与审批流程已配置</small></div></div>
          <div><span className="ok"><Icon name="check" size={12} /></span><div><strong>脱敏规则已绑定</strong><small>身份证、手机号、姓名</small></div></div>
          <div><span className="warn"><Icon name="alert" size={12} /></span><div><strong>开放条件待确认</strong><small>部分资产为「有条件开放」</small></div></div>
        </div>
        <Field label="审核说明" className="mt-14"><textarea className="textarea" rows={3} placeholder="填写发布原因、使用范围与安全措施" /></Field>
      </Modal>
    </>
  );
}

export function AssetManagementPage() {
  return <AssetOpsHubPage initialTab="catalog" />;
}

export function AssetPublishPage() {
  return <AssetOpsHubPage initialTab="publish" />;
}
