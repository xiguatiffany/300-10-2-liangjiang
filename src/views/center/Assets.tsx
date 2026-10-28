import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Empty, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { assets, assetDomains, dataSources, getFields, Asset } from '../../data';

const layerTone: Record<string, string> = { ODS: 'slate', DWD: 'blue', DIM: 'cyan', DM: 'violet' };

export function AssetsPage() {
  const { go, notify } = useApp();
  const [domain, setDomain] = useState('all');
  const [q, setQ] = useState('');
  const [layer, setLayer] = useState('all');
  const [owner, setOwner] = useState('');
  const [onlyCertified, setOnlyCertified] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [tab, setTab] = useState('overview');
  const [createOpen, setCreateOpen] = useState(false);
  const filtered = useMemo(() => assets.filter((a) =>
    (domain === 'all' || a.domain === domain) &&
    (layer === 'all' || a.layer === layer) &&
    (!owner || a.owner === owner) &&
    (!onlyCertified || a.id === 'dwd_fact_visit' || a.id === 'ods_his_patient') &&
    (!q || (a.name + a.id + a.owner).toLowerCase().includes(q.toLowerCase()))
  ), [domain, layer, owner, onlyCertified, q]);

  const openAsset = (a: Asset) => { setSelected(a); setTab('overview'); };

  return (
    <>
      <PageHeader
        eyebrow="DATA ASSETS"
        title="资产目录"
        desc="统一管理全院结构化数据资产，覆盖 42 个业务系统、12,846 张数据表，支持血缘追溯与质量画像。"
        actions={<><Btn icon="download" onClick={() => notify('资产目录导出任务已创建')}>导出目录</Btn><Btn variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>新建数据表</Btn></>}
      />

      <div className="stat-grid">
        <StatCard label="数据表总量" value="12,846" unit="张" delta="+128 本月" icon="table" tone="blue" />
        <StatCard label="已认证资产" value="2,186" unit="张" delta="认证率 17.0%" icon="checkcircle" tone="green" />
        <StatCard label="字段总数" value="286,420" unit="个" delta="+2,860 本月" icon="rows" tone="violet" />
        <StatCard label="元数据完整度" value="96.7" unit="%" delta="待补全 426 张" icon="folder" tone="amber" />
      </div>

      <div className="assets-layout mt-14">
        <aside className="asset-side">
          <Card title="数据域" subtitle="按业务系统" noPad>
            <div className="domain-list">
              {assetDomains.map((d) => (
                <button key={d.key} className={domain === d.key ? 'is-active' : ''} onClick={() => setDomain(d.key)}>
                  <i style={{ background: d.tone }} />
                  <span>{d.label}</span>
                  <em>{d.count.toLocaleString()}</em>
                </button>
              ))}
            </div>
          </Card>
          <Card title="数据分层" noPad className="mt-14">
            <div className="domain-list">
              {[['all', '全部分层', 12846], ['ODS', 'ODS 贴源层', 9862], ['DWD', 'DWD 明细层', 1842], ['DIM', 'DIM 维度层', 682], ['DM', 'DM 主题层', 460]].map(([k, l, c]) => (
                <button key={k} className={layer === k ? 'is-active' : ''} onClick={() => setLayer(k as string)}>
                  <span className="layer-dot" style={{ background: k === 'all' ? '#9AA9C4' : layerTone[k as string] === 'blue' ? '#6755F5' : k === 'DIM' ? '#0891B2' : k === 'DM' ? '#9587FF' : '#9AA9C4' }} />
                  <span>{l}</span><em>{Number(c).toLocaleString()}</em>
                </button>
              ))}
            </div>
          </Card>
          <div className="asset-tip mt-14">
            <span className="tip-icon"><Icon name="sparkles" size={14} /></span>
            <div><strong>智能资产推荐</strong><p>根据近期查询热度，推荐关注“门诊预约主题数据集”。</p><button className="link-btn" onClick={() => { const a = assets.find((x) => x.id === 'hm_reg_appt_data'); if (a) openAsset(a); }}>查看资产 <Icon name="arrowright" size={11} /></button></div>
          </div>
        </aside>

        <Card noPad className="asset-main">
          <div className="asset-toolbar">
            <div className="filter-bar">
              <SearchInput value={q} onChange={setQ} placeholder="搜索表名、表编码、负责人" width={236} />
              <Select value={owner} onChange={setOwner} options={['', '李建华', '张敏', '陈晓', '赵倩', '周宁', '刘一鸣', '王思远']} placeholder="全部负责人" width={122} />
              <label className="cert-filter"><input type="checkbox" className="checkbox" checked={onlyCertified} onChange={(e) => setOnlyCertified(e.target.checked)} /> 仅看已认证</label>
            </div>
            <div className="asset-view-toggle">
              <button className="is-active" aria-label="列表视图"><Icon name="list" size={15} /></button>
              <button aria-label="卡片视图" onClick={() => notify('卡片视图即将上线', 'info')}><Icon name="boxes" size={15} /></button>
            </div>
          </div>
          <div className="tabs-row">
            <Tabs variant="line" value="tables" onChange={() => {}} items={[{ key: 'tables', label: '数据表', count: filtered.length }, { key: 'views', label: '数据视图', count: 86 }, { key: 'files', label: '文件资产', count: 42 }]} />
            <span className="table-note"><Icon name="shield" size={12} /> 已按数据权限过滤</span>
          </div>
          <div className="pad-h">
            <DataTable
              rows={filtered}
              pageSize={8}
              rowKey="id"
              onRowClick={openAsset}
              columns={[
                { key: 'name', title: '数据表', render: (a) => <div className="asset-name"><span className={`layer-mark ${a.layer.toLowerCase()}`}>{a.layer}</span><div className="cell-main"><strong>{a.name}</strong><small>{a.schema}.{a.id}</small></div></div> },
                { key: 'domain', title: '数据域', width: 78, render: (a) => <Badge tone="slate">{a.domain}</Badge> },
                { key: 'rows', title: '数据量', width: 98, align: 'right', render: (a) => <div className="cell-main align-right"><strong>{a.rows}</strong><small>{a.size}</small></div> },
                { key: 'quality', title: '质量', width: 108, sortable: true, render: (a) => <div className="quality-cell"><Progress value={a.quality} tone={a.quality >= 98 ? 'green' : a.quality >= 96 ? 'blue' : 'amber'} /><span>{a.quality}</span></div> },
                { key: 'owner', title: '负责人', width: 82, render: (a) => <span className="owner-cell"><span className="avatar sm">{a.owner.slice(-2)}</span>{a.owner}</span> },
                { key: 'updated', title: '最近更新', width: 126, render: (a) => <div className="cell-main"><strong className="fw-normal">{a.updated.slice(5, 16)}</strong><small>{a.updated.slice(0, 10)}</small></div> },
                { key: 'ops', title: '操作', width: 74, render: (a) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => openAsset(a)}>详情</button><button className="link-muted" onClick={() => notify(`已打开 ${a.name} 的血缘视图`, 'info')}>血缘</button></div> },
              ]}
            />
          </div>
        </Card>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} width={700} title={selected ? <span className="drawer-title">{selected.name}<Badge tone={layerTone[selected.layer]}>{selected.layer}</Badge></span> : ''} desc={selected ? `${selected.schema}.${selected.id} · 更新于 ${selected.updated}` : ''}
        footer={<><Btn variant="secondary" icon="download" onClick={() => notify('字段清单已导出')}>导出字段</Btn><Btn variant="secondary" onClick={() => go('/center/sql')}>查询数据</Btn><Btn variant="primary" icon="network" onClick={() => setTab('lineage')}>查看血缘</Btn></>}>
        {selected && (
          <>
            <div className="drawer-summary">
              <div><span>数据行数</span><strong>{selected.rows}</strong></div>
              <div><span>存储容量</span><strong>{selected.size}</strong></div>
              <div><span>质量得分</span><strong className="text-green">{selected.quality}</strong></div>
              <div><span>负责人</span><strong>{selected.owner}</strong></div>
            </div>
            <div className="tag-row">{selected.tags.map((t) => <Badge key={t}>{t}</Badge>)}<Badge tone="slate">来源：{selected.source}</Badge></div>
            <Tabs className="mt-14" variant="line" value={tab} onChange={setTab} items={[{ key: 'overview', label: '概要' }, { key: 'fields', label: '字段信息', count: getFields(selected).length }, { key: 'lineage', label: '数据血缘' }]} />
            {tab === 'overview' && (
              <div className="tab-panel">
                <KeyValue cols={2} items={[
                  { label: '中文名称', value: selected.name }, { label: '英文名称', value: <span className="mono">{selected.id}</span> },
                  { label: '所属数据域', value: selected.domain }, { label: '数据分层', value: selected.layer },
                  { label: '业务描述', value: selected.desc, wide: true },
                  { label: '数据来源', value: selected.source }, { label: '更新方式', value: 'T+1 增量' },
                  { label: '最近更新', value: selected.updated }, { label: '生命周期', value: '永久' },
                  { label: '认证状态', value: <Badge tone="green" dot>已认证</Badge> }, { label: '密级', value: <Badge tone="amber">3 级 · 敏感</Badge> },
                ]} />
                <div className="divider-h" />
                <div className="two-col-cards">
                  <div className="mini-panel"><span className="mp-icon blue"><Icon name="shield" size={15} /></span><div><strong>质量监控</strong><p>10 条规则 · 本月通过率 99.2%</p></div><button className="link-btn" onClick={() => go('/center/quality-rules')}>查看</button></div>
                  <div className="mini-panel"><span className="mp-icon violet"><Icon name="gauge" size={15} /></span><div><strong>关联指标</strong><p>6 项指标基于此表构建</p></div><button className="link-btn" onClick={() => go('/center/indicators')}>查看</button></div>
                </div>
              </div>
            )}
            {tab === 'fields' && (
              <div className="tab-panel">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>字段名</th><th>中文名</th><th>类型</th><th>主键</th><th>非空</th><th>标准</th><th>说明</th></tr></thead>
                    <tbody>{getFields(selected).map((f) => (
                      <tr key={f.name}><td className="mono-cell">{f.name}</td><td>{f.cn}</td><td className="mono-cell">{f.type}{f.length !== '-' ? `(${f.length})` : ''}</td><td>{f.pk ? <Badge tone="amber">PK</Badge> : '—'}</td><td>{f.nullable ? '—' : <Icon name="check" size={12} className="text-green" />}</td><td className="mono-cell">{f.std || '—'}</td><td className="muted">{f.desc}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {tab === 'lineage' && (
              <div className="tab-panel">
                <div className="asset-lineage">
                  {[
                    { type: 'source', label: selected.source, sub: '业务系统' },
                    { type: 'ods', label: selected.id, sub: 'ODS 贴源表' },
                    { type: 'model', label: 'dwd_fact_visit', sub: '明细宽表' },
                    { type: 'indicator', label: '就诊主题指标', sub: '6 项指标' },
                  ].map((n, i) => (
                    <React.Fragment key={n.label}>
                      <div className={`al-node type-${n.type}`}><Icon name={n.type === 'source' ? 'database' : n.type === 'ods' ? 'table' : n.type === 'model' ? 'boxes' : 'gauge'} size={15} /><div><strong>{n.label}</strong><small>{n.sub}</small></div></div>
                      {i < 3 && <div className="al-link"><span>→</span></div>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="info-note mt-14"><Icon name="network" size={14} /><span>血缘由 SQL 解析自动生成，最近解析时间 2026-08-06 13:50。共发现 4 条上游依赖、12 条下游引用。</span></div>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建数据表" desc="在指定数据域中创建逻辑表，创建后可通过采集配置同步数据。" width={600}
        footer={<><Btn onClick={() => setCreateOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setCreateOpen(false); notify('数据表已创建，等待采集配置'); }}>创建数据表</Btn></>}>
        <div className="form-grid">
          <Field label="中文名称" required><input className="input" placeholder="例如：门诊预约记录表" /></Field>
          <Field label="英文表名" required><input className="input" placeholder="例如：ods_appointment" /></Field>
          <Field label="所属数据域" required><Select value="HIS" onChange={() => {}} options={['HIS', 'EMR', 'LIS', 'PACS', 'HRP', 'CDR']} /></Field>
          <Field label="数据分层"><Select value="ODS" onChange={() => {}} options={['ODS', 'DWD', 'DIM', 'DM']} /></Field>
          <Field label="数据来源" className="span-2"><Select value="" onChange={() => {}} options={['HIS 生产库', 'EMR 临床库', 'LIS 生产库', 'PACS 归档库']} placeholder="请选择数据来源" /></Field>
          <Field label="业务描述" className="span-2"><textarea className="textarea" rows={3} placeholder="描述该表的业务含义、主要用途与更新频率" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function SourcesPage() {
  const { notify } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const list = dataSources.filter((d) => (d.name + d.type).toLowerCase().includes(filter.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="DATA SOURCES" title="数据源" desc="管理全院 42 个业务系统的接入连接，监控连通状态与同步时效，支持关系型数据库、API 与文件接入。" actions={<><Btn icon="refresh" onClick={() => notify('已重新检测全部数据源连通性')}>检测连通性</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新增数据源</Btn></>} />
      <div className="stat-grid">
        <StatCard label="数据源总数" value="42" unit="个" delta="+3 本月" icon="database" tone="blue" />
        <StatCard label="连通正常" value="38" unit="个" delta="健康率 90.5%" icon="checkcircle" tone="green" />
        <StatCard label="同步中" value="3" unit="个" delta="HRP 延迟 41 分钟" icon="refresh" tone="amber" />
        <StatCard label="今日同步数据量" value="1.82" unit="亿条" delta="平均延迟 4.2 分钟" icon="activity" tone="cyan" />
      </div>
      <div className="source-toolbar mt-14">
        <SearchInput value={filter} onChange={setFilter} placeholder="搜索数据源名称或类型" width={260} />
        <div className="source-legend"><span><i className="ok" />正常 38</span><span><i className="warn" />延迟 2</span><span><i className="bad" />异常 1</span><span><i className="off" />维护 1</span></div>
      </div>
      <div className="grid grid-3 mt-14">
        {list.map((d, idx) => (
          <div className={`source-card ${d.status === '维护中' ? 'is-muted' : ''}`} key={d.id}>
            <div className="source-head">
              <span className={`source-logo t${idx % 5}`}>{d.type.slice(0, 2).toUpperCase()}</span>
              <div className="source-title"><strong>{d.name}</strong><span>{d.type} · {d.owner}</span></div>
              <Badge tone={d.status === '正常' ? 'green' : d.status === '延迟' ? 'amber' : 'slate'} dot>{d.status}</Badge>
            </div>
            <div className="source-host"><Icon name="server" size={12} /><span className="mono">{d.host}</span><em>{d.db}</em></div>
            <div className="source-stats">
              <div><span>数据表</span><strong>{d.tables.toLocaleString()}</strong></div>
              <div><span>最近同步</span><strong>{d.sync}</strong></div>
              <div><span>今日增量</span><strong>{(d.tables * 1.8).toFixed(0)} 万</strong></div>
            </div>
            <div className="source-foot">
              <button className="link-btn" onClick={() => notify(`已打开 ${d.name} 的数据表列表`, 'info')}>数据表</button>
              <button className="link-muted" onClick={() => notify(`${d.name} 连通性正常，延迟 32ms`)}>测试连接</button>
              <button className="link-muted" onClick={() => notify('连接配置已打开', 'info')}>配置</button>
              <span className="source-sync"><i style={{ background: d.status === '正常' ? '#23a983' : d.status === '延迟' ? '#e0a02e' : '#c3cede' }} />{d.status === '正常' ? '实时同步' : d.status === '延迟' ? '同步延迟' : '已暂停'}</span>
            </div>
          </div>
        ))}
        <button className="source-add" onClick={() => setOpen(true)}><span><Icon name="plus" size={18} /></span><strong>新增数据源</strong><small>支持 MySQL、Oracle、SQL Server、API 等</small></button>
      </div>
      <Card className="mt-14" title="接入规范" subtitle="数据源接入前请确认以下事项">
        <div className="guideline-grid">
          {[
            { icon: 'shield', title: '最小权限', desc: '使用只读账号接入，仅授予所需库表的 SELECT 权限。' },
            { icon: 'network', title: '网络策略', desc: '通过采集专线或 VPN 接入，需提前开通 IP 白名单。' },
            { icon: 'clock', title: '同步窗口', desc: '业务高峰期（08:00-18:00）建议采用增量同步策略。' },
            { icon: 'file', title: '元数据登记', desc: '接入后 24 小时内完成负责人、数据域与密级登记。' },
          ].map((g) => (
            <div key={g.title}><span className="gi"><Icon name={g.icon} size={15} /></span><div><strong>{g.title}</strong><p>{g.desc}</p></div></div>
          ))}
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="新增数据源" desc="配置业务系统数据库连接，系统将自动采集元数据。" width={620}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn onClick={() => notify('连接测试成功，延迟 28ms')}>测试连接</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('数据源已创建，正在采集元数据'); }}>保存并接入</Btn></>}>
        <div className="form-grid">
          <Field label="数据源名称" required><input className="input" placeholder="例如：HIS 生产库" /></Field>
          <Field label="数据源类型" required><Select value="MySQL" onChange={() => {}} options={['MySQL', 'Oracle', 'SQL Server', 'PostgreSQL', 'TiDB', 'API 接口', 'FTP']} /></Field>
          <Field label="主机地址" required><input className="input" placeholder="10.20.31.18" /></Field>
          <Field label="端口" required><input className="input" placeholder="3306" /></Field>
          <Field label="数据库名" required><input className="input" placeholder="HISDB" /></Field>
          <Field label="所属科室"><input className="input" placeholder="信息中心" /></Field>
          <Field label="用户名" required><input className="input" placeholder="readonly_user" /></Field>
          <Field label="密码" required><input className="input" type="password" placeholder="••••••••" /></Field>
          <Field label="同步方式" className="span-2"><Select value="增量同步" onChange={() => {}} options={['全量同步', '增量同步', 'CDC 实时同步']} /></Field>
        </div>
      </Modal>
    </>
  );
}

export function MetadataPage() {
  const { notify } = useApp();
  const [tab, setTab] = useState('tables');
  const [q, setQ] = useState('');
  const rows = assets.filter((a) => (a.id + a.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="METADATA" title="元数据管理" desc="采集与管理数据表、字段、分区、索引等元数据，持续监测元数据完整度与变更。" actions={<><Btn icon="refresh" onClick={() => notify('元数据采集任务已触发，预计 3 分钟完成')}>采集元数据</Btn><Btn variant="primary" icon="plus" onClick={() => notify('已打开元数据登记表单', 'info')}>登记元数据</Btn></>} />
      <div className="grid grid-4">
        <div className="meta-kpi"><span className="mk-ico blue"><Icon name="table" size={17} /></span><div><span>表元数据</span><strong>12,846</strong><em>已采集 12,420</em></div></div>
        <div className="meta-kpi"><span className="mk-ico violet"><Icon name="columns" size={17} /></span><div><span>字段元数据</span><strong>286,420</strong><em>已补全 96.7%</em></div></div>
        <div className="meta-kpi"><span className="mk-ico amber"><Icon name="clock" size={17} /></span><div><span>近 7 日变更</span><strong>186</strong><em>新增 42 · 修改 144</em></div></div>
        <div className="meta-kpi"><span className="mk-ico green"><Icon name="checkcircle" size={17} /></span><div><span>完整度</span><strong>96.7%</strong><em>待补全 426 张</em></div></div>
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'tables', label: '表元数据' }, { key: 'fields', label: '字段元数据' }, { key: 'changes', label: '变更记录' }]} />
          <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索表名或编码" width={220} /></div>
        </div>
        <div className="pad-h">
          {tab === 'tables' && (
            <DataTable rows={rows} pageSize={9} rowKey="id" columns={[
              { key: 'name', title: '数据表', render: (a) => <div className="cell-main"><strong>{a.name}</strong><small>{a.id}</small></div> },
              { key: 'domain', title: '数据域', width: 80, render: (a) => <Badge tone="slate">{a.domain}</Badge> },
              { key: 'layer', title: '分层', width: 62, render: (a) => <span className="mono-cell">{a.layer}</span> },
              { key: 'size', title: '存储', width: 80, render: (a) => <span>{a.size}</span> },
              { key: 'complete', title: '元数据完整度', width: 150, render: (a) => <div className="quality-cell"><Progress value={Math.min(100, a.quality + 1)} /><span>{Math.min(100, a.quality + 1)}%</span></div> },
              { key: 'owner', title: '负责人', width: 80, render: (a) => a.owner },
              { key: 'updated', title: '最近采集', width: 120, render: (a) => <span className="muted">{a.updated.slice(5, 16)}</span> },
              { key: 'ops', title: '操作', width: 90, render: (a) => <div className="row-actions"><button className="link-btn" onClick={() => notify(`已同步 ${a.id} 的元数据`)}>同步</button><button className="link-muted" onClick={() => notify('元数据编辑表单已打开', 'info')}>编辑</button></div> },
            ]} />
          )}
          {tab === 'fields' && (
            <DataTable rows={assetFields()} pageSize={10} rowKey="key" columns={[
              { key: 'table', title: '所属表', width: 170, render: (r) => <span className="mono-cell">{r.table}</span> },
              { key: 'name', title: '字段名', width: 130, render: (r) => <span className="mono-cell">{r.name}</span> },
              { key: 'cn', title: '中文名', width: 120, render: (r) => r.cn },
              { key: 'type', title: '类型', width: 100, render: (r) => <span className="mono-cell">{r.type}</span> },
              { key: 'std', title: '关联标准', render: (r) => r.std ? <Badge tone="blue">{r.std}</Badge> : <span className="muted">未关联</span> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.std ? 'green' : 'amber'}>{r.std ? '已标准' : '待治理'}</Badge> },
            ]} />
          )}
          {tab === 'changes' && (
            <div className="timeline-list">
              {[
                { t: '14:20', title: 'ods_hrp_cost 新增字段 cost_center_code', desc: '字段类型 varchar(20)，负责人刘一鸣', tag: '新增字段' },
                { t: '13:50', title: 'dwd_fact_visit 表注释更新', desc: '补充“仅包含已完成就诊”的业务口径', tag: '表变更' },
                { t: '11:08', title: 'ods_emr_cpoe_ba_ssk 字段类型变更', desc: 'dosage decimal(10,2) → decimal(12,3)', tag: '类型变更' },
                { t: '09:30', title: '新增数据表 hm_infection_data', desc: '院感监测主题数据表，数据域 CDR', tag: '新增表' },
                { t: '08-05 17:12', title: 'dim_department 维度数据更新', desc: '新增江南院区 12 个科室', tag: '数据变更' },
              ].map((c) => (
                <div className="tl-item" key={c.title}><span className="tl-dot" /><div className="tl-time">{c.t}</div><div className="tl-body"><div><strong>{c.title}</strong><Badge tone="blue">{c.tag}</Badge></div><p>{c.desc}</p></div></div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function assetFields() {
  return [
    { key: '1', table: 'ods_his_patient', name: 'patient_id', cn: '患者ID', type: 'varchar(32)', std: 'DE-PAT-001' },
    { key: '2', table: 'ods_his_patient', name: 'patient_name', cn: '患者姓名', type: 'varchar(64)', std: 'DE-PAT-002' },
    { key: '3', table: 'ods_his_patient', name: 'gender_code', cn: '性别代码', type: 'char(1)', std: 'DE-GEN-001' },
    { key: '4', table: 'ods_his_outpatient', name: 'appt_id', cn: '预约ID', type: 'bigint(20)', std: '' },
    { key: '5', table: 'ods_his_outpatient', name: 'appt_time', cn: '预约时间', type: 'datetime', std: 'DE-TIM-001' },
    { key: '6', table: 'ods_emr_cpoe_ba_ssk', name: 'order_id', cn: '医嘱ID', type: 'bigint(20)', std: '' },
    { key: '7', table: 'ods_emr_cpoe_ba_ssk', name: 'dosage', cn: '剂量', type: 'decimal(10,2)', std: '' },
    { key: '8', table: 'ods_emr_diagnosis', name: 'diag_code', cn: '诊断编码', type: 'varchar(10)', std: 'DE-DIAG-001' },
    { key: '9', table: 'ods_lis_report', name: 'report_id', cn: '报告ID', type: 'varchar(32)', std: '' },
    { key: '10', table: 'dwd_fact_visit', name: 'dept_code', cn: '科室编码', type: 'varchar(20)', std: 'DE-DEP-001' },
  ];
}
