import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { standardElements, valueDomains } from '../../data';

export function StandardsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof standardElements[0] | null>(null);
  const rows = standardElements.filter((r) => (!status || r.status === status) && (r.name + r.code + r.en).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="DATA STANDARDS" title="数据标准" desc="建立全院统一的数据元、命名与值域标准，支撑数据资产规范化治理与互联互通。" actions={<><Btn icon="upload" onClick={() => notify('标准文件导入向导已打开', 'info')}>导入标准</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建数据元</Btn></>} />
      <div className="stat-grid">
        <StatCard label="数据元总数" value="1,286" unit="个" delta="已发布 1,142" icon="book" tone="blue" />
        <StatCard label="值域字典" value="186" unit="套" delta="引用 2.8 万次" icon="braces" tone="violet" />
        <StatCard label="标准覆盖率" value="86.4" unit="%" delta="+4.2% 环比" icon="checkcircle" tone="green" />
        <StatCard label="待治理字段" value="4,862" unit="个" delta="涉及 426 张表" icon="circlealert" tone="amber" />
      </div>
      <div className="grid grid-2-1 mt-14">
        <Card title="数据元目录" subtitle="统一数据定义与命名规范" noPad actions={<div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索数据元" width={180} /><Select value={status} onChange={setStatus} options={['', '已发布', '草稿']} placeholder="全部状态" width={100} /></div>}>
          <div className="pad-h">
            <DataTable rows={rows} pageSize={8} onRowClick={(r) => setSelected(r)} columns={[
              { key: 'code', title: '标准编码', width: 110, render: (r) => <span className="mono-cell">{r.code}</span> },
              { key: 'name', title: '数据元名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.en}</small></div> },
              { key: 'type', title: '类型', width: 82, render: (r) => <span className="tag">{r.type}</span> },
              { key: 'length', title: '长度', width: 60, render: (r) => r.length },
              { key: 'domain', title: '值域', width: 150, render: (r) => <span className="muted">{r.domain}</span> },
              { key: 'source', title: '来源', width: 64, render: (r) => r.source },
              { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot>{r.status}</Badge> },
            ]} />
          </div>
        </Card>
        <div className="stack">
          <Card title="标准覆盖情况" subtitle="按业务域统计">
            <div className="coverage-list">
              {[['患者主数据', 96, '#6755F5'], ['就诊与医嘱', 92, '#9587FF'], ['检验检查', 88, '#0891B2'], ['手术与病案', 84, '#10B981'], ['运营财务', 72, '#F59E0B']].map(([l, v, c]) => (
                <div key={l as string}><span>{l}</span><strong>{v}%</strong><div className="coverage-track"><i style={{ width: `${v}%`, background: c as string }} /></div></div>
              ))}
            </div>
            <div className="info-note mt-14"><Icon name="sparkles" size={13} /><span>基于大模型的标准映射建议已就绪，可辅助完成 1,286 个字段的标准映射。</span></div>
          </Card>
          <Card title="标准动态" subtitle="最近更新">
            <ul className="feed-list">
              <li><span className="feed-ico blue"><Icon name="book" size={13} /></span><div><strong>ICD-10 国临版 2.0 字典更新</strong><small>新增 128 条诊断编码 · 07-30</small></div></li>
              <li><span className="feed-ico green"><Icon name="checkcircle" size={13} /></span><div><strong>46 个字段完成标准映射</strong><small>李建华 · 07-28</small></div></li>
              <li><span className="feed-ico violet"><Icon name="braces" size={13} /></span><div><strong>新增“医保结算方式”值域</strong><small>医保办 · 07-20</small></div></li>
            </ul>
          </Card>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新建数据元" desc="定义医院统一的数据元标准，发布后可供各业务系统引用。" width={620}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('数据元已创建并提交审核'); }}>创建数据元</Btn></>}>
        <div className="form-grid">
          <Field label="数据元名称" required><input className="input" placeholder="例如：患者标识" /></Field>
          <Field label="英文名称" required><input className="input" placeholder="Patient ID" /></Field>
          <Field label="标准编码" required><input className="input" placeholder="DE-PAT-001" /></Field>
          <Field label="数据类型" required><Select value="字符型" onChange={() => {}} options={['字符型', '数值型', '日期型', '日期时间', '布尔型']} /></Field>
          <Field label="数据长度"><input className="input" placeholder="32" /></Field>
          <Field label="值域字典"><Select value="" onChange={() => {}} options={['性别代码', 'ICD-10 诊断编码', '科室字典', '检验项目字典']} placeholder="请选择值域" /></Field>
          <Field label="来源系统"><Select value="HIS" onChange={() => {}} options={['HIS', 'EMR', 'LIS', 'PACS', 'HRP', '通用']} /></Field>
          <Field label="负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩']} /></Field>
          <Field label="定义说明" className="span-2"><textarea className="textarea" rows={3} placeholder="描述数据元的业务含义、取值规则与使用场景" /></Field>
        </div>
      </Modal>
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} desc={selected ? `${selected.code} · ${selected.en}` : ''} width={560}
        footer={<><Btn onClick={() => setSelected(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('数据元已进入编辑模式', 'info')}>编辑</Btn></>}>
        {selected && <>
          <KeyValue cols={2} items={[
            { label: '标准编码', value: <span className="mono">{selected.code}</span> }, { label: '数据元名称', value: selected.name },
            { label: '英文名称', value: selected.en }, { label: '数据类型', value: selected.type + (selected.length !== '-' ? `(${selected.length})` : '') },
            { label: '值域', value: selected.domain }, { label: '来源系统', value: selected.source },
            { label: '状态', value: <Badge tone="green" dot>{selected.status}</Badge> }, { label: '版本', value: 'V2.1' },
          ]} />
          <div className="divider-h" />
          <div className="section-title-sm">引用情况</div>
          <div className="coverage-list mt-10">
            {[['HIS 业务库', 86, '#6755F5'], ['EMR 病历库', 42, '#9587FF'], ['CDR 临床库', 28, '#0891B2']].map(([l, v, c]) => <div key={l as string}><span>{l}</span><strong>{v} 个字段</strong><div className="coverage-track"><i style={{ width: `${v}%`, background: c as string }} /></div></div>)}
          </div>
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>该数据元为“已发布”状态，修改需经数据标准委员会审核。</span></div>
        </>}
      </Drawer>
    </>
  );
}

export function DomainsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<typeof valueDomains[0] | null>(null);
  const rows = valueDomains.filter((d) => (d.name + d.code).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="VALUE DOMAINS" title="值域字典" desc="维护全院共享的编码值域与字典表，保障跨系统数据同源、同义、同码。" actions={<><Btn icon="refresh" onClick={() => notify('字典版本检查完成，均为最新版本')}>检查版本</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建值域</Btn></>} />
      <div className="grid grid-4">
        {[
          { l: '值域总数', v: '186', s: '套', i: 'braces', t: 'blue' },
          { l: '字典条目', v: '82,640', s: '条', i: 'list', t: 'violet' },
          { l: '被引用字段', v: '28,642', s: '个', i: 'link', t: 'cyan' },
          { l: '本月更新', v: '12', s: '套', i: 'refresh', t: 'green' },
        ].map((x) => (
          <div className="domain-kpi" key={x.l}><span className={`mk-ico ${x.t}`}><Icon name={x.i} size={17} /></span><div><span>{x.l}</span><strong>{x.v}<small>{x.s}</small></strong></div></div>
        ))}
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs variant="line" value="all" onChange={() => {}} items={[{ key: 'all', label: '全部值域', count: 186 }, { key: 'std', label: '国标/行标' }, { key: 'custom', label: '院内部标' }]} />
          <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索值域名称或编码" width={240} /></div>
        </div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={10} onRowClick={(r) => setActive(r)} columns={[
            { key: 'code', title: '值域编码', width: 100, render: (d) => <span className="mono-cell">{d.code}</span> },
            { key: 'name', title: '值域名称', render: (d) => <div className="cell-main"><strong>{d.name}</strong><small>{d.std}</small></div> },
            { key: 'count', title: '字典条目', width: 100, align: 'right', render: (d) => <span className="mono-cell">{d.count.toLocaleString()}</span> },
            { key: 'version', title: '版本', width: 80, render: (d) => <Badge tone="slate">{d.version}</Badge> },
            { key: 'updated', title: '更新时间', width: 110, render: (d) => d.updated },
            { key: 'status', title: '状态', width: 80, render: (d) => <Badge dot>{d.status}</Badge> },
            { key: 'ops', title: '操作', width: 100, render: (d) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => setActive(d)}>查看</button><button className="link-muted" onClick={() => notify(`已打开 ${d.name} 的字典条目`, 'info')}>条目</button></div> },
          ]} />
        </div>
      </Card>
      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name || ''} desc={active ? `${active.code} · ${active.std} · ${active.version}` : ''} width={600}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('字典已导出为 Excel')}>导出字典</Btn></>}>
        {active && <>
          <KeyValue cols={2} items={[{ label: '值域编码', value: active.code }, { label: '标准来源', value: active.std }, { label: '字典条目', value: active.count.toLocaleString() + ' 条' }, { label: '最近更新', value: active.updated }]} />
          <div className="section-title-sm mt-14">字典条目预览</div>
          <div className="table-wrap mt-10">
            <table className="data-table">
              <thead><tr><th>编码</th><th>名称</th><th>简称</th><th>状态</th></tr></thead>
              <tbody>
                {[['1', '男', 'M', '启用'], ['2', '女', 'F', '启用'], ['9', '未说明的性别', 'U', '启用'], ['0', '未知的性别', 'N', '停用']].map((r) => (
                  <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{r[1]}</td><td className="mono-cell">{r[2]}</td><td><Badge tone={r[3] === '启用' ? 'green' : 'slate'}>{r[3]}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>该值域被 86 个字段引用，修改将触发影响分析。</span></div>
        </>}
      </Drawer>
      <Modal open={open} onClose={() => setOpen(false)} title="新建值域字典" width={560} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('值域字典已创建'); }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="值域名称" required><input className="input" placeholder="例如：医保结算方式" /></Field>
          <Field label="标准来源"><input className="input" placeholder="国家医保局 / 院内部标" /></Field>
          <Field label="编码规则" className="span-2"><input className="input" placeholder="例如：2 位数字编码" /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="描述值域的使用范围与维护责任" /></Field>
        </div>
      </Modal>
    </>
  );
}
