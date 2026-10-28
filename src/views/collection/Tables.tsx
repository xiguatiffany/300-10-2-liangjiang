import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { SqlWorkbench } from '../../components/SqlWorkbench';
import { Badge, Btn, Card, DataTable, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { assets } from '../../data';

type ManagedTable = { id: string; target: string; source: string; timeField: string; countThreshold: string; monthThreshold: string; quality: string; modifier: string; modified: string; fields: number; tags: string[] };

const managedTables: ManagedTable[] = [
  { id: 'T01', target: 'ods_jh_inquiry_center_t_inquiry', source: 'ih_in_inquiry_center_source', timeField: 'update_time', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2026-01-05 16:29:02', fields: 18, tags: ['核心', '问询'] },
  { id: 'T02', target: 'ods_his_dbo_cj_cmxdmysfk', source: 'THIS4_ZS_DY.dbo.CJ_CMXDMYSFK', timeField: '—', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-09-23 12:48:52', fields: 26, tags: ['核心'] },
  { id: 'T03', target: 'ods_his_dbo_cj_parts', source: 'THIS4_ZS_DY.dbo.CJ_PARTS', timeField: '—', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-09-23 12:48:52', fields: 12, tags: [] },
  { id: 'T04', target: 'ods_his_dbo_emr_inf_report', source: 'THIS4_ZS_DY.dbo.emr_inf_report', timeField: '—', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-09-23 12:48:52', fields: 34, tags: ['大字段'] },
  { id: 'T05', target: 'ods_ris_dbo_pacs_monitor', source: 'DbrRis501.dbo.Pacs_monitor', timeField: '—', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-09-23 12:48:52', fields: 22, tags: ['影像'] },
  { id: 'T06', target: 'ods_lis_dbo_report_main', source: 'LIS_PROD.dbo.REPORT_MAIN', timeField: 'report_time', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-08-18 09:20:16', fields: 42, tags: ['核心', '高频更新'] },
  { id: 'T07', target: 'ods_emr_dbo_cpoe_ba_ssk', source: 'EMRDB.dbo.CPOE_BA_SSK', timeField: 'update_time', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-08-15 14:42:30', fields: 38, tags: ['大字段'] },
  { id: 'T08', target: 'ods_his_dbo_patient', source: 'HISDB.dbo.PATIENT', timeField: 'update_time', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-07-22 10:06:18', fields: 56, tags: ['核心', '主数据'] },
  { id: 'T09', target: 'ods_hrp_dbo_cost_detail', source: 'HRPDB.dbo.COST_DETAIL', timeField: 'biz_date', countThreshold: '0-0', monthThreshold: '0-0', quality: '是', modifier: 'dp_admin', modified: '2025-07-10 16:18:44', fields: 28, tags: ['运营'] },
];

const fieldRows = [
  { no: 1, name: 'id', cn: '主键ID', type: 'bigint', len: '19', precision: '0', scale: '0', target: 'id', targetType: 'BIGINT', updated: '2026-04-29 16:39:50', status: '自动创建', pk: true },
  { no: 2, name: 'order_id', cn: '医嘱ID', type: 'bigint', len: '19', precision: '0', scale: '0', target: 'order_id', targetType: 'BIGINT', updated: '2026-04-29 16:39:50', status: '自动创建' },
  { no: 3, name: 'user_id', cn: '用户ID', type: 'bigint', len: '19', precision: '0', scale: '0', target: 'user_id', targetType: 'BIGINT', updated: '2026-04-29 16:39:50', status: '自动创建' },
  { no: 4, name: 'user_name', cn: '用户名', type: 'varchar', len: '20', precision: '0', scale: '0', target: 'user_name', targetType: 'VARCHAR(20)', updated: '2026-04-29 16:39:50', status: '自动创建' },
  { no: 5, name: 'patient_id', cn: '患者ID', type: 'bigint', len: '19', precision: '0', scale: '0', target: 'patient_id', targetType: 'BIGINT', updated: '2026-04-29 16:39:50', status: '自动创建' },
  { no: 6, name: 'patient_name', cn: '患者姓名', type: 'varchar', len: '255', precision: '0', scale: '0', target: 'patient_name', targetType: 'VARCHAR(255)', updated: '2026-04-29 16:39:50', status: '自动创建' },
  { no: 7, name: 'his_id', cn: 'HIS标识', type: 'bigint', len: '19', precision: '0', scale: '0', target: 'his_id', targetType: 'BIGINT', updated: '2026-04-29 16:38:40', status: '自动创建' },
  { no: 8, name: 'inquiry_content', cn: '问询内容', type: 'varchar', len: '2000', precision: '0', scale: '0', target: 'inquiry_content', targetType: 'VARCHAR(2000)', updated: '2026-04-29 16:38:40', status: '自动创建' },
  { no: 9, name: 'create_time', cn: '创建时间', type: 'datetime', len: '—', precision: '0', scale: '0', target: 'create_time', targetType: 'DATETIME', updated: '2026-04-29 16:38:40', status: '自动创建' },
  { no: 10, name: 'update_time', cn: '更新时间', type: 'datetime', len: '—', precision: '0', scale: '0', target: 'update_time', targetType: 'DATETIME', updated: '2026-04-29 16:38:40', status: '自动创建' },
];

export function TablesPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('fields');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const rows = managedTables.filter((t) => (!source || t.source.includes(source)) && (!tag || t.tags.includes(tag)) && (t.target + t.source).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="TABLE MANAGEMENT" title="数据表管理" desc="管理采集入仓的数据表，配置源目标映射、时间字段、对账阈值与字段标签。" actions={<><Btn icon="sliders" onClick={() => notify('采集表设置已打开', 'info')}>采集表设置</Btn><Btn icon="list" onClick={() => notify('对账设置已打开', 'info')}>对账设置</Btn><Btn variant="primary" icon="checkcircle" onClick={() => notify('批量管理已开启，请选择数据表')}>批量管理</Btn></>} />
      <div className="table-admin-filter">
        <div className="taf-row">
          <div className="taf-item"><span>数据库</span><Select value="" onChange={() => {}} options={['全部数据库', 'ods_his', 'ods_emr', 'ods_lis', 'ods_ris', 'ods_hrp']} placeholder="请选择数据库" width={150} /></div>
          <div className="taf-item"><span>源端库</span><Select value={source} onChange={setSource} options={['', 'HISDB', 'EMRDB', 'LIS_PROD', 'THIS4_ZS_DY', 'HRPDB']} placeholder="请选择源端库" width={150} /></div>
          <div className="taf-item"><span>表名</span><div className="search-input" style={{ width: 190 }}><Icon name="search" size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入表名" /></div></div>
          <div className="taf-item"><span>标签</span><Select value={tag} onChange={setTag} options={['', '核心', '主数据', '大字段', '影像', '运营', '高频更新']} placeholder="请选择标签" width={130} /></div>
          <div className="taf-actions"><Btn size="sm" variant="primary" icon="search" onClick={() => notify(`已筛选 ${rows.length} 张数据表`)}>查询</Btn><Btn size="sm" icon="refresh" onClick={() => { setQ(''); setSource(''); setTag(''); }}>重置</Btn></div>
        </div>
      </div>
      <div className="grid grid-4 mt-14">
        <StatCard label="采集表" value="290" unit="张" delta="本月新增 8 张" icon="table" tone="blue" />
        <StatCard label="已配置对账" value="242" unit="张" delta="覆盖率 83.4%" icon="list" tone="green" />
        <StatCard label="已设置质量校验" value="186" unit="张" delta="64.1%" icon="shield" tone="violet" />
        <StatCard label="未配置标签" value="42" unit="张" delta="建议补充" icon="tags" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="tables-tabs-bar">
          <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'fields', label: '字段配置' }, { key: 'relations', label: '表关系' }]} />
          <div className="row-actions"><span className="muted xs">已选 {selected.length} 张</span><Btn size="sm" icon="download" onClick={() => notify('数据表清单已导出')}>导出</Btn></div>
        </div>
        {tab === 'fields' ? (
          <div className="pad-h">
            <DataTable rows={rows} pageSize={8} onRowClick={(t) => go(`/collection/table/${t.target}`)} columns={[
              { key: 'target', title: '目标库表', width: 230, render: (t) => <div className="cell-main"><strong className="mono">{t.target}</strong><small>{t.source}</small></div> },
              { key: 'timeField', title: '时间字段', width: 110, render: (t) => <span className="mono-cell">{t.timeField}</span> },
              { key: 'countThreshold', title: '数量对账阈值', width: 112, render: (t) => <span className="mono-cell">{t.countThreshold}</span> },
              { key: 'monthThreshold', title: '月度对账阈值', width: 112, render: (t) => <span className="mono-cell">{t.monthThreshold}</span> },
              { key: 'quality', title: '质量校验', width: 80, render: (t) => <Badge tone={t.quality === '是' ? 'green' : 'slate'}>{t.quality}</Badge> },
              { key: 'tags', title: '标签', width: 120, render: (t) => <div className="tag-inline">{t.tags.length ? t.tags.slice(0, 2).map((x) => <Badge key={x} tone="slate">{x}</Badge>) : <span className="muted">—</span>}</div> },
              { key: 'modified', title: '修改时间', width: 130, render: (t) => <div className="cell-main"><strong className="fw-normal">{t.modified.slice(5, 16)}</strong><small>{t.modifier}</small></div> },
              { key: 'ops', title: '操作', width: 150, render: (t) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => notify(`已打开 ${t.target} 对账配置`, 'info')}>对账配置</button><button className="link-btn" onClick={() => go(`/collection/table/${t.target}`)}>字段详情</button><button className="link-muted" onClick={() => notify('打标签弹窗已打开', 'info')}>打标签</button></div> },
            ]} />
          </div>
        ) : (
          <div className="pad-h">
            <DataTable rows={rows} pageSize={8} columns={[
              { key: 'source', title: '源端表', width: 260, render: (t) => <span className="mono-cell">{t.source}</span> },
              { key: 'target', title: '目标表', width: 260, render: (t) => <span className="mono-cell">{t.target}</span> },
              { key: 'fields', title: '字段数', width: 80, align: 'right', render: (t) => <span className="mono-cell">{t.fields}</span> },
              { key: 'timeField', title: '增量字段', width: 110, render: (t) => <span className="mono-cell">{t.timeField}</span> },
              { key: 'status', title: '映射状态', width: 96, render: () => <Badge tone="green" dot>已映射</Badge> },
              { key: 'ops', title: '操作', width: 90, render: (t) => <button className="link-btn" onClick={() => go(`/collection/table/${t.target}`)}>查看字段</button> },
            ]} />
          </div>
        )}
      </Card>
    </>
  );
}

export function TableFieldsPage({ param }: { param?: string }) {
  const { go, notify } = useApp();
  const table = param || 'ods_jh_inquiry_center_t_inquiry';
  const [tab, setTab] = useState('fields');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const rows = fieldRows.filter((f) => (f.name + f.cn).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader back={() => go('/collection/tables')} eyebrow="FIELD CONFIGURATION" title="字段详情" desc={<span className="detail-desc">表名称：<span className="mono">{table}</span><i />源端 ih_in_inquiry_center_source<i />18 个字段</span>}
        actions={<><Btn icon="plus" onClick={() => setOpen(true)}>新增字段</Btn><Btn icon="key" onClick={() => notify('主键设置已打开', 'info')}>主键设置</Btn><Btn variant="primary" icon="clock" onClick={() => setTab('history')}>修改记录</Btn></>} />
      <div className="field-info-strip">
        <div><span>目标库</span><strong className="mono">ods_his</strong></div>
        <div><span>源端库</span><strong className="mono">ih_in_inquiry_center_source</strong></div>
        <div><span>字段总数</span><strong>18</strong></div>
        <div><span>主键</span><strong className="mono">id</strong></div>
        <div><span>最近同步</span><strong>2026-04-29 16:39</strong></div>
        <div className="field-strip-tags"><Badge tone="green" dot>映射正常</Badge><Badge tone="slate">自动创建</Badge></div>
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'fields', label: '字段列表', count: 18 }, { key: 'mapping', label: '映射校验' }, { key: 'history', label: '修改记录' }]} />
          <SearchInput value={q} onChange={setQ} placeholder="搜索字段名" width={220} />
        </div>
        <div className="pad-h">
          {tab === 'fields' && (
            <DataTable rows={rows} pageSize={12} columns={[
              { key: 'no', title: '序号', width: 54, align: 'center', render: (f) => <span className="muted">{f.no}</span> },
              { key: 'name', title: '源字段名', width: 150, render: (f) => <div className="field-name-cell"><span className="mono">{f.name}</span>{f.pk && <span className="pk-tag">主键</span>}</div> },
              { key: 'cn', title: '中文名', width: 110, render: (f) => f.cn },
              { key: 'type', title: '源字段类型', width: 100, render: (f) => <span className="mono-cell">{f.type}</span> },
              { key: 'len', title: '源字段长度', width: 96, render: (f) => <span className="mono-cell">{f.len}</span> },
              { key: 'precision', title: '源字段精度', width: 96, render: (f) => <span className="mono-cell">{f.precision}</span> },
              { key: 'scale', title: '小数位数', width: 80, render: (f) => <span className="mono-cell">{f.scale}</span> },
              { key: 'target', title: '目标字段名', width: 130, render: (f) => <span className="mono-cell">{f.target}</span> },
              { key: 'targetType', title: '目标字段类型', width: 130, render: (f) => <span className="mono-cell">{f.targetType}</span> },
              { key: 'updated', title: '更新时间', width: 130, render: (f) => <span className="muted">{f.updated.slice(5)}</span> },
              { key: 'status', title: '状态', width: 82, render: (f) => <Badge tone="slate">{f.status}</Badge> },
              { key: 'ops', title: '操作', width: 76, render: (f) => <div className="row-actions"><button className="link-btn" onClick={() => notify(`字段 ${f.name} 编辑已打开`, 'info')}>编辑</button></div> },
            ]} />
          )}
          {tab === 'mapping' && (
            <div className="mapping-panel">
              <div className="mapping-summary"><span className="ok"><Icon name="checkcircle" size={16} /></span><div><strong>字段映射校验通过</strong><p>18 个字段全部完成映射，其中自动映射 15 个、手动映射 3 个。发现 2 个字段类型需人工确认。</p></div></div>
              <div className="table-wrap mt-14"><table className="data-table"><thead><tr><th>源字段</th><th>源类型</th><th>目标字段</th><th>目标类型</th><th>映射方式</th><th>校验结果</th></tr></thead><tbody>
                {[['order_id', 'bigint(19)', 'order_id', 'BIGINT', '自动', '通过'], ['patient_name', 'varchar(255)', 'patient_name', 'VARCHAR(255)', '自动', '通过'], ['inquiry_content', 'varchar(2000)', 'inquiry_content', 'VARCHAR(2000)', '手动', '需确认长度'], ['create_time', 'datetime', 'create_time', 'DATETIME', '自动', '通过']].map((r) => (
                  <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td className="mono-cell">{r[1]}</td><td className="mono-cell">{r[2]}</td><td className="mono-cell">{r[3]}</td><td><Badge tone={r[4] === '自动' ? 'blue' : 'amber'}>{r[4]}</Badge></td><td><Badge tone={r[5] === '通过' ? 'green' : 'amber'}>{r[5]}</Badge></td></tr>
                ))}
              </tbody></table></div>
            </div>
          )}
          {tab === 'history' && (
            <div className="timeline-list">
              {[['2026-04-29 16:39', '自动同步创建 18 个字段', '系统根据源端表结构自动生成字段映射', '自动创建'], ['2026-04-29 16:38', '设置主键 id', '将 id 字段设置为主键', '主键设置'], ['2026-03-12 10:20', '调整 inquiry_content 长度', '由 VARCHAR(1000) 调整为 VARCHAR(2000)', '类型变更']].map(([t, title, desc, tag]) => (
                <div className="tl-item" key={t}><span className="tl-dot" /><div className="tl-time">{t.slice(5)}</div><div className="tl-body"><div><strong>{title}</strong><Badge tone="blue">{tag}</Badge></div><p>{desc}</p></div></div>
              ))}
            </div>
          )}
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="新增字段" width={560} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('字段已新增'); }}>保存字段</Btn></>}>
        <div className="form-grid">
          <Field label="源字段名" required><input className="input" placeholder="例如：status" /></Field>
          <Field label="中文名"><input className="input" placeholder="例如：状态" /></Field>
          <Field label="字段类型"><Select value="varchar" onChange={() => {}} options={['varchar', 'bigint', 'datetime', 'decimal', 'text']} /></Field>
          <Field label="长度"><input className="input" placeholder="255" /></Field>
          <Field label="目标字段名"><input className="input" placeholder="status" /></Field>
          <Field label="是否主键"><Toggle checked={false} label="否" /></Field>
          <Field label="字段说明" className="span-2"><textarea className="textarea" rows={2} placeholder="描述字段的业务含义" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function CollectionQueryPage() {
  const { notify } = useApp();
  return (
    <>
      <PageHeader eyebrow="DATA QUERY" title="数据查询" desc="面向采集运维人员的 SQL 查询工具，可快速核对源端与目标端数据、排查同步问题。" actions={<><Btn icon="clock" onClick={() => notify('查询历史已打开', 'info')}>查询历史</Btn><Btn variant="primary" icon="plus" onClick={() => notify('已新建查询', 'info')}>新建查询</Btn></>} />
      <div className="query-strip">
        <div className="query-strip-main"><Icon name="terminal" size={16} /><span>采集数据查询</span><em>ods_his.ods_jh_inquiry_center_t_inquiry</em><Badge tone="green" dot>目标库连接正常</Badge></div>
        <div className="query-chips"><span>快捷查询：</span>{['查询目标表前 100 行', '核对源目标行数', '检查今日增量'].map((c) => <button key={c} onClick={() => notify(`已载入「${c}」`, 'info')}>{c}</button>)}</div>
      </div>
      <SqlWorkbench context="采集监控" initialSql={"SELECT *\nFROM ods_his.ods_jh_inquiry_center_t_inquiry\nWHERE update_time >= '2026-08-01'\nORDER BY update_time DESC\nLIMIT 100;"} height={266} />
    </>
  );
}

export function DebugPage() {
  const { notify } = useApp();
  const [channel, setChannel] = useState('ods_cis_his_init');
  const [action, setAction] = useState('表结构查询');
  const [params, setParams] = useState('{\n  "schema": "dbo",\n  "table": "EMR_CPOE_BA_SSK",\n  "fetchSize": 5000\n}');
  const [running, setRunning] = useState(false);
  const [responded, setResponded] = useState(true);
  const [tab, setTab] = useState('response');
  const run = () => {
    setRunning(true); setResponded(false);
    window.setTimeout(() => { setRunning(false); setResponded(true); notify('调试请求执行成功'); }, 800);
  };
  return (
    <>
      <PageHeader eyebrow="DEBUG TOOL" title="调试工具" desc="对采集通道与连接执行调试请求，快速验证连通性、表结构与数据抽取逻辑。" actions={<><Btn icon="book" onClick={() => notify('调试接口文档已打开', 'info')}>接口文档</Btn><Btn icon="clock" onClick={() => notify('调试历史已打开', 'info')}>调试历史</Btn></>} />
      <div className="debug-layout">
        <Card title="请求配置" subtitle="选择通道与调试动作" className="debug-request">
          <div className="form-grid">
            <Field label="采集通道" required><Select value={channel} onChange={setChannel} options={['ods_cis_his_init', 'ods_cva_init', 'ods_lis60_PROD', 'ods_hyy_mysql_init', 'ods_cis_sync']} /></Field>
            <Field label="调试动作" required><Select value={action} onChange={setAction} options={['表结构查询', '连通性测试', '数据预览', '增量位点查询', '元数据加载']} /></Field>
          </div>
          <Field label="请求参数" className="mt-14" hint="JSON 格式，参数将透传至采集服务">
            <textarea className="textarea code-textarea" rows={9} value={params} onChange={(e) => setParams(e.target.value)} spellCheck={false} />
          </Field>
          <div className="debug-actions"><Btn variant="primary" icon="play" loading={running} onClick={run}>发送请求</Btn><Btn icon="refresh" onClick={() => setParams('{\n  "schema": "dbo",\n  "table": "EMR_CPOE_BA_SSK",\n  "fetchSize": 5000\n}')}>重置参数</Btn><span className="muted xs">请求将记录到审计日志</span></div>
        </Card>
        <Card title="响应结果" subtitle="调试服务返回" className="debug-response" actions={responded ? <Badge tone="green" dot>200 OK · 328ms</Badge> : running ? <Badge tone="blue" dot>请求中</Badge> : <Badge tone="slate">等待请求</Badge>}>
          <Tabs variant="pill" value={tab} onChange={setTab} items={[{ key: 'response', label: '响应结果' }, { key: 'headers', label: '响应头' }]} />
          <div className="response-console mt-10">
            {running && <div className="sql-loading"><span className="spinner dark" /><div><strong>正在发送调试请求…</strong><small>通道 {channel} · {action}</small></div></div>}
            {!running && tab === 'response' && (
              <>
                <div className="resp-line"><span className="k">status</span><span className="v green">200</span><span className="k">time</span><span className="v">328ms</span><span className="k">traceId</span><span className="v mono">dbg-a8f2c1e6</span></div>
                <pre>{`{
  "code": 0,
  "message": "success",
  "data": {
    "channel": "${channel}",
    "action": "${action}",
    "schema": "dbo",
    "table": "EMR_CPOE_BA_SSK",
    "columns": [
      { "name": "order_id", "type": "bigint", "nullable": false },
      { "name": "patient_id", "type": "varchar(32)", "nullable": false },
      { "name": "visit_id", "type": "varchar(32)", "nullable": true },
      { "name": "order_time", "type": "datetime", "nullable": false }
    ],
    "rowCount": 1842300,
    "sampleRows": 3
  },
  "traceId": "dbg-a8f2c1e6"
}`}</pre>
              </>
            )}
            {!running && tab === 'headers' && <pre>{`content-type: application/json;charset=UTF-8
x-trace-id: dbg-a8f2c1e6
x-channel: ${channel}
x-response-time: 328ms
server: meddata-collect/3.8.2`}</pre>}
          </div>
        </Card>
      </div>
      <div className="grid grid-2 mt-14">
        <Card title="最近调试请求" subtitle="近 24 小时">
          <div className="table-wrap"><table className="data-table"><thead><tr><th>时间</th><th>通道</th><th>动作</th><th>耗时</th><th>结果</th></tr></thead><tbody>
            {[['14:22:08', 'ods_cis_his_init', '表结构查询', '328ms', '成功'], ['13:50:42', 'ods_cis_sync', '连通性测试', '86ms', '成功'], ['11:40:16', 'ods_emr_cpoe_sync', '数据预览', '1.24s', '成功'], ['10:12:30', 'ods_hrp_cost_sync', '增量位点查询', '2.1s', '失败']].map((r) => (
              <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td className="mono-cell">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Badge tone={r[4] === '成功' ? 'green' : 'red'}>{r[4]}</Badge></td></tr>
            ))}
          </tbody></table></div>
        </Card>
        <Card title="常用调试模板" subtitle="一键载入参数">
          <div className="template-list">
            {[['表结构查询', '读取指定表字段结构'], ['增量位点查询', '查看当前增量同步位点'], ['连通性测试', '测试通道源端与目标端连通性'], ['数据预览', '抽样查看源端数据']].map(([n, d]) => (
              <button key={n} onClick={() => { setAction(n); notify(`已载入「${n}」模板`, 'info'); }}><span className="template-ico"><Icon name="braces" size={14} /></span><div><strong>{n}</strong><small>{d}</small></div><Icon name="arrowright" size={12} /></button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
