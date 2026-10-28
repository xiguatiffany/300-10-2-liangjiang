import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { auditFeed, bidAssets, publishAssets } from '../../dataBid';

export function AssetManagement() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [security, setSecurity] = useState('');
  const [active, setActive] = useState<typeof bidAssets[0] | null>(null);
  const [tab, setTab] = useState('meta');
  const rows = useMemo(() => bidAssets.filter((a) => (domain === 'all' || a.domain === domain) && (!security || a.security === security) && (!q || (a.name + a.id + a.domain).includes(q))), [q, domain, security]);
  return (
    <>
      <PageHeader eyebrow="DATA ASSET OPERATIONS" title="数据资产管理" desc="通过资源类目、数据资源与编目形成数据资产，配置安全级别、开放级别、脱敏方式与 API 发布。" actions={<><Btn icon="download" onClick={() => notify('资产目录已导出')}>导出目录</Btn><Btn icon="settings" onClick={() => notify('资源类目管理已打开', 'info')}>类目管理</Btn><Btn variant="primary" icon="uploadcloud" onClick={() => go('/bid/asset-publish')}>批量发布</Btn></>} />
      <div className="stat-grid">
        <StatCard label="数据资产" value="286" unit="项" delta="本月新增 18 项" icon="layers" tone="blue" />
        <StatCard label="已发布" value="242" unit="项" delta="发布率 84.6%" icon="checkcircle" tone="green" />
        <StatCard label="敏感资产" value="86" unit="项" delta="L3 + L4" icon="shieldalert" tone="amber" />
        <StatCard label="API 已发布" value="126" unit="个" delta="今日调用 28.6 万" icon="network" tone="violet" />
      </div>
      <div className="assetops-layout mt-14">
        <aside className="assetops-side">
          <div className="aos-head"><Icon name="folder" size={14} /> 资源类目</div>
          {[['all', '全部资源', 286, 'layers'], ['HIS', 'HIS 业务', 86, 'database'], ['EMR', 'EMR 病历', 64, 'file'], ['LIS', 'LIS 检验', 42, 'activity'], ['PACS', 'PACS 影像', 36, 'scan'], ['公卫', '公卫健康', 28, 'users'], ['指标', '指标服务', 30, 'gauge']].map(([k, l, n, i]) => (
            <button key={k as string} className={domain === k ? 'is-active' : ''} onClick={() => setDomain(k as string)}><Icon name={i as string} size={13} /><span>{l}</span><em>{n}</em></button>
          ))}
          <div className="aos-divider" />
          <div className="aos-title">安全级别</div>
          {[['L4', '敏感', '#DC2626', 12], ['L3', '较敏感', '#D97706', 74], ['L2', '低敏感', '#6755F5', 126], ['L1', '不敏感', '#059669', 74]].map(([k, l, c, n]) => <button key={k as string} className={security === k ? 'is-active' : ''} onClick={() => setSecurity(security === k ? '' : k as string)}><span className="aos-dot" style={{ background: c as string }} /><span>{k} · {l}</span><em>{n}</em></button>)}
          <div className="aos-tip"><Icon name="sparkles" size={14} /><div><strong>智能编目</strong><p>基于元数据自动识别业务域、敏感字段与开放级别。</p></div></div>
        </aside>
        <div className="assetops-main">
          <Card noPad>
            <div className="assetops-toolbar">
              <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索资产名称、编号或业务域" width={260} /><Select value={security} onChange={setSecurity} options={['', 'L4', 'L3', 'L2', 'L1']} placeholder="全部安全级别" width={120} /><Select value="" onChange={() => {}} options={['全部开放级别', '无条件开放', '有条件开放', '非开放']} placeholder="全部开放级别" width={130} /></div>
              <div className="row-actions"><span className="muted xs">已选 0 项</span><Btn size="sm" icon="download" onClick={() => notify('资产清单已导出')}>导出</Btn></div>
            </div>
            <div className="assetops-note"><Icon name="shield" size={12} /><span>资产发布前需完成安全分级、脱敏规则与开放条件配置；敏感资产需审批。</span></div>
            <div className="pad-h"><DataTable rows={rows} pageSize={8} onRowClick={(r) => { setActive(r); setTab('meta'); }} columns={[
              { key: 'name', title: '数据资产', render: (a) => <div className="assetops-name"><span className={`asset-type-icon ${a.type === 'API' ? 'api' : a.type === '文件' ? 'file' : 'table'}`}><Icon name={a.type === 'API' ? 'network' : a.type === '文件' ? 'file' : 'table'} size={14} /></span><div className="cell-main"><strong>{a.name}</strong><small>{a.id} · {a.type} · {a.domain}</small></div></div> },
              { key: 'security', title: '安全级别', width: 82, render: (a) => <Badge tone={a.security === 'L4' ? 'red' : a.security === 'L3' ? 'amber' : 'blue'}>{a.security}</Badge> },
              { key: 'open', title: '开放级别', width: 100, render: (a) => <Badge tone={a.open === '无条件开放' ? 'green' : a.open === '有条件开放' ? 'blue' : 'slate'}>{a.open}</Badge> },
              { key: 'masking', title: '脱敏方式', width: 150, render: (a) => <span className="muted">{a.masking}</span> },
              { key: 'api', title: 'API 状态', width: 86, render: (a) => <Badge tone={a.api === '已发布' ? 'green' : a.api === '待发布' ? 'amber' : 'slate'}>{a.api}</Badge> },
              { key: 'subscribers', title: '订阅', width: 56, align: 'right', render: (a) => <span className="mono-cell">{a.subscribers}</span> },
              { key: 'ops', title: '操作', width: 116, render: (a) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => { setActive(a); setTab('meta'); }}>详情</button><button className="link-muted" onClick={() => notify('编目编辑已打开', 'info')}>编目</button><button className="link-muted" onClick={() => notify('API 发布配置已打开', 'info')}>API</button></div> },
            ]} /></div>
          </Card>
        </div>
      </div>
      <Drawer open={!!active} onClose={() => setActive(null)} width={680} title={active?.name || ''} desc={active ? `${active.id} · ${active.type} · ${active.domain}` : ''} footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn icon="uploadcloud" onClick={() => { setActive(null); go('/bid/asset-publish'); }}>去发布</Btn><Btn variant="primary" icon="network" onClick={() => notify(active?.api === '已发布' ? 'API 文档已打开' : 'API 发布配置已打开')}>{active?.api === '已发布' ? '查看 API' : '发布 API'}</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>安全级别</span><strong>{active.security}</strong></div><div><span>开放级别</span><strong className="sm">{active.open}</strong></div><div><span>订阅方</span><strong>{active.subscribers}</strong></div><div><span>API</span><strong className="sm">{active.api}</strong></div></div>
          <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'meta', label: '元数据' }, { key: 'security', label: '安全与脱敏' }, { key: 'open', label: '开放与共享' }, { key: 'api', label: 'API 服务' }]} />
          <div className="tab-panel">
            {tab === 'meta' && <><KeyValue cols={2} items={[{ label: '资源编号', value: active.id }, { label: '资源类型', value: active.type }, { label: '业务域', value: active.domain }, { label: '负责人', value: active.owner }, { label: '更新时间', value: active.updated }, { label: '订阅方', value: `${active.subscribers} 个` }, { label: '资源描述', value: '面向区域医疗健康业务的数据资源，已纳入统一资产目录并完成安全分级。', wide: true }]} /><div className="section-title-sm mt-14">核心元数据</div><div className="tag-row"><Badge tone="blue">信息资源名称</Badge><Badge tone="blue">摘要</Badge><Badge tone="blue">分类</Badge><Badge tone="blue">提供方</Badge><Badge tone="blue">信息项</Badge><Badge tone="blue">数据库信息</Badge></div></>}
            {tab === 'security' && <><div className="security-banner"><span className={`sev-ico ${active.security === 'L4' ? 'red' : active.security === 'L3' ? 'amber' : 'blue'}`}><Icon name="shield" size={17} /></span><div><strong>{active.security} · {active.security === 'L4' ? '敏感数据' : active.security === 'L3' ? '较敏感数据' : '低敏感数据'}</strong><p>按 GB/T 39725-2020 健康医疗数据安全指南分级</p></div><Badge tone="amber">需审批</Badge></div><div className="mask-list mt-14"><div><div><strong>身份证号</strong><small>保留后 4 位</small></div><Toggle checked /></div><div><div><strong>手机号</strong><small>保留前 3 位与后 4 位</small></div><Toggle checked /></div><div><div><strong>姓名</strong><small>保留姓氏</small></div><Toggle checked /></div><div><div><strong>地址</strong><small>保留到街道</small></div><Toggle checked={false} /></div></div><div className="info-note mt-14"><Icon name="key" size={13} /><span>脱敏密钥由安全管理员分配，支持审批后还原。</span></div></>}
            {tab === 'open' && <><div className="open-options">{['无条件开放', '有条件开放', '非开放'].map((o) => <button key={o} className={active.open === o ? 'is-active' : ''}><span className="radio-dot" /><div><strong>{o}</strong><small>{o === '无条件开放' ? '无需申请即可获取' : o === '有条件开放' ? '需提交用途、场景与安全措施' : '需脱敏匿名后转为开放'}</small></div>{active.open === o && <Badge tone="blue">当前</Badge>}</button>)}</div><div className="section-title-sm mt-14">共享方式</div><div className="tag-row"><Badge tone="green">API 接口</Badge><Badge tone="blue">共享库</Badge><Badge tone="slate">文件导出</Badge></div></>}
            {tab === 'api' && <><div className="api-code"><span>{active.api === '已发布' ? 'GET' : 'POST'}</span><code>/api/v1/assets/{active.id.toLowerCase()}</code><button onClick={() => notify('API 测试已通过 · 328ms')}>测试</button></div><KeyValue className="mt-14" cols={2} items={[{ label: '认证方式', value: 'OAuth 2.0 / AppKey' }, { label: '限流', value: '1,000 次/分钟' }, { label: '脱敏', value: active.masking }, { label: 'SLA', value: '99.95%' }]} /><div className="info-note mt-14"><Icon name="network" size={13} /><span>API 发布后可在开放门户被订阅，调用日志进入审计。</span></div></>}
          </div>
        </>}
      </Drawer>
    </>
  );
}

export function AssetPublish() {
  const { notify } = useApp();
  const [rows, setRows] = useState(publishAssets);
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState<string[]>([]);
  const [approve, setApprove] = useState(false);
  const filtered = rows.filter((r) => tab === 'pending' ? r.status === '待审核' : tab === 'published' ? r.status === '已发布' : r.status === '已停用');
  const toggle = (id: string) => setSelected((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const batch = (action: 'publish' | 'stop') => {
    if (!selected.length) { notify('请先勾选资产', 'error'); return; }
    setRows((arr) => arr.map((r) => selected.includes(r.id) ? { ...r, status: action === 'publish' ? '已发布' : '已停用' } : r));
    notify(action === 'publish' ? `已发布 ${selected.length} 项资产` : `已停用 ${selected.length} 项资产`);
    setSelected([]);
  };
  return (
    <>
      <PageHeader eyebrow="ASSET PUBLISHING" title="资产发布 / 停用" desc="对待审核资产批量发布到开放平台，对已发布资产批量停用；发布/停用均需审核并记录审计。" actions={<><Btn icon="scroll" onClick={() => notify('发布审计日志已打开', 'info')}>审计日志</Btn><Btn variant="primary" icon="uploadcloud" onClick={() => setApprove(true)}>批量发布</Btn></>} />
      <div className="stat-grid">
        <StatCard label="待发布" value={rows.filter((r) => r.status === '待审核').length.toString()} unit="项" delta="需审核" icon="clock" tone="amber" />
        <StatCard label="已发布" value={rows.filter((r) => r.status === '已发布').length.toString()} unit="项" delta="开放平台可见" icon="checkcircle" tone="green" />
        <StatCard label="已停用" value={rows.filter((r) => r.status === '已停用').length.toString()} unit="项" delta="保留历史版本" icon="circlex" tone="slate" />
        <StatCard label="今日订阅" value="18" unit="次" delta="+4 环比" icon="bell" tone="blue" />
      </div>
      <div className="publish-layout mt-14">
        <div className="publish-main">
          <Card noPad>
            <div className="publish-toolbar">
              <Tabs variant="line" value={tab} onChange={(v) => { setTab(v); setSelected([]); }} items={[{ key: 'pending', label: '待发布', count: rows.filter((r) => r.status === '待审核').length }, { key: 'published', label: '已发布', count: rows.filter((r) => r.status === '已发布').length }, { key: 'stopped', label: '已停用', count: rows.filter((r) => r.status === '已停用').length }]} />
              <div className="row-actions"><span className="muted xs">已选 {selected.length} 项</span>{tab === 'pending' ? <Btn size="sm" variant="primary" icon="checkcircle" onClick={() => batch('publish')}>批量发布</Btn> : tab === 'published' ? <Btn size="sm" variant="danger" icon="x" onClick={() => batch('stop')}>批量停用</Btn> : null}<Btn size="sm" icon="download" onClick={() => notify('清单已导出')}>导出</Btn></div>
            </div>
            <div className="pad-h">
              <table className="data-table">
                <thead><tr><th style={{ width: 34 }}><input type="checkbox" className="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={(e) => setSelected(e.target.checked ? filtered.map((r) => r.id) : [])} /></th><th>资产名称</th><th>类型</th><th>安全级别</th><th>申请人</th><th>更新时间</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>{filtered.map((r) => <tr key={r.id}><td><input type="checkbox" className="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td><td><div className="cell-main"><strong>{r.name}</strong><small>{r.id}</small></div></td><td><Badge tone="slate">{r.type}</Badge></td><td><Badge tone={r.security === 'L4' ? 'red' : r.security === 'L3' ? 'amber' : 'blue'}>{r.security}</Badge></td><td>{r.applicant}</td><td className="muted">{r.updated}</td><td><Badge dot>{r.status === '待审核' ? '待审核' : r.status}</Badge></td><td><div className="row-actions"><button className="link-btn" onClick={() => notify('资产详情已打开', 'info')}>详情</button>{r.status === '待审核' ? <button className="link-muted" onClick={() => { setRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '已发布' } : x)); notify(`${r.name} 已发布`); }}>发布</button> : r.status === '已发布' ? <button className="link-muted" onClick={() => { setRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '已停用' } : x)); notify(`${r.name} 已停用`); }}>停用</button> : null}</div></td></tr>)}</tbody>
              </table>
              <div className="table-foot"><span className="table-count">共 {filtered.length} 项</span><span className="muted xs">发布后开放平台可见，停用保留历史版本</span></div>
            </div>
          </Card>
          <Card className="mt-14" title="发布前检查" subtitle="批量发布前建议逐项确认">
            <div className="publish-checks">
              {[['安全分级','L1—L4 已确认，敏感资产需审批','shield'],['脱敏规则','身份证/手机号/姓名规则已绑定','eye'],['开放条件','开放范围、用途与安全措施已登记','key'],['API 配置','服务已生成并完成连通性测试','network'],['订阅关系','已有订阅方将收到变更通知','bell'],['审计留痕','发布/停用操作全程记录','scroll']].map(([t, d, i]) => <div key={t}><span><Icon name={i} size={13} /></span><div><strong>{t}</strong><small>{d}</small></div></div>)}
            </div>
          </Card>
        </div>
        <aside className="publish-side">
          <Card title="发布流程" subtitle="审核后生效">
            <div className="publish-flow">{[['选择资产', '已选 0 项'], ['安全校验', '分级 / 脱敏 / 开放条件'], ['发布审核', '数据治理办'], ['开放平台', '订阅 / API / 共享']].map(([t, d], i) => <div key={t} className={i === 0 && selected.length ? 'is-done' : ''}><span>{i + 1}</span><div><strong>{t}</strong><small>{d}</small></div></div>)}</div>
            <div className="info-note mt-14"><Icon name="shield" size={13} /><span>批量发布仅可勾选“待审核”资产；批量停用仅可操作“已发布”资产。</span></div>
          </Card>
          <Card className="mt-14" title="发布审计" subtitle="最近操作">
            <div className="audit-feed">{auditFeed.map(([t, u, a, o, s]) => <div key={t + o}><span className="audit-time">{t}</span><div><strong>{u} · {a}</strong><small>{o}</small></div><Badge tone={s === '成功' ? 'green' : 'amber'}>{s}</Badge></div>)}</div>
          </Card>
          <Card className="mt-14" title="开放平台监控" subtitle="今日">
            <div className="open-stats"><div><span>订阅</span><strong>18</strong></div><div><span>API 调用</span><strong>28.6 万</strong></div><div><span>共享库任务</span><strong>12</strong></div><div><span>文件生成</span><strong>6</strong></div></div>
          </Card>
        </aside>
      </div>
      <Modal open={approve} onClose={() => setApprove(false)} title="提交发布审核" desc={`共 ${selected.length} 项资产待提交；请确认安全等级、脱敏规则与开放条件已配置。`} width={540} footer={<><Btn onClick={() => setApprove(false)}>取消</Btn><Btn variant="primary" onClick={() => { setApprove(false); batch('publish'); }}>提交审核并发布</Btn></>}>
        <div className="check-list vertical"><div><span className="ok"><Icon name="check" size={12} /></span><div><strong>安全分级已完成</strong><small>L1—L4 分级与审批流程已配置</small></div></div><div><span className="ok"><Icon name="check" size={12} /></span><div><strong>脱敏规则已绑定</strong><small>身份证、手机号、姓名</small></div></div><div><span className="warn"><Icon name="alert" size={12} /></span><div><strong>开放条件待确认</strong><small>2 项资产为“有条件开放”</small></div></div></div>
        <Field label="审核说明" className="mt-14"><textarea className="textarea" rows={3} placeholder="填写发布原因、使用范围与安全措施" /></Field>
      </Modal>
    </>
  );
}
