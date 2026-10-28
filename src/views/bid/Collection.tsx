import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LineageGraph } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { catalogSchemas, catalogTables, previewColumns, previewRows, CatalogTable } from '../../dataBid';

const wizardSteps = ['选择数据源', '选择表与策略', '字段映射', '试跑与提交'];

export function CollectionWizard() {
  const { go, notify } = useApp();
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState('两江新区人民医院');
  const [driver, setDriver] = useState('达梦 DM8');
  const [host, setHost] = useState('10.20.31.18');
  const [db, setDb] = useState('HISDB');
  const [tested, setTested] = useState(false);
  const [testError, setTestError] = useState('');
  const [selected, setSelected] = useState<string[]>(['ods_his_patient', 'ods_his_outpatient', 'ods_his_inpatient']);
  const [mode, setMode] = useState('存量 + 时间戳增量');
  const [target, setTarget] = useState('ODS 贴源层');
  const [schedule, setSchedule] = useState('每日 02:00');
  const [running, setRunning] = useState(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  const tables = catalogTables.concat([
    { id: 'ods_his_charges', schema: 'ods_his', name: 'charges', cn: '住院费用明细', rows: '18,620,410', size: '9.2 GB', owner: '刘一鸣', updated: '2026-08-06 14:00', quality: 97.2, layer: 'ODS', tags: ['费用'] },
    { id: 'ods_emr_diagnosis', schema: 'ods_emr', name: 'diagnosis', cn: '出院诊断', rows: '2,184,690', size: '3.1 GB', owner: '陈晓', updated: '2026-08-06 14:09', quality: 97.2, layer: 'ODS', tags: ['诊断'] },
    { id: 'ods_lis_result', schema: 'ods_lis', name: 'lab_result', cn: '检验结果明细', rows: '286,420,000', size: '64.2 GB', owner: '赵倩', updated: '2026-08-06 14:07', quality: 98.4, layer: 'ODS', tags: ['大字段'] },
    { id: 'ods_pacs_report', schema: 'ods_pacs', name: 'pacs_report', cn: '影像报告', rows: '4,286,410', size: '6.4 GB', owner: '周宁', updated: '2026-08-06 14:03', quality: 96.2, layer: 'ODS', tags: ['影像'] },
  ]);

  useEffect(() => {
    if (step !== 3 || !running) return;
    setPct(0); setDone(false);
    let cur = 0;
    const t = window.setInterval(() => {
      cur += 8 + Math.round(Math.random() * 9);
      if (cur >= 100) {
        cur = 100; window.clearInterval(t); setRunning(false); setDone(true); setPct(100);
      } else setPct(cur);
    }, 220);
    return () => window.clearInterval(t);
  }, [step, running]);

  const configure = () => {
    if (!host.trim() || !db.trim()) { setTested(false); setTestError('连接失败：主机地址与数据库名不能为空'); notify('连接失败：请填写主机地址与数据库名', 'error'); return; }
    if (host.includes('0.0.0.0') || host.includes('invalid')) { setTested(false); setTestError('连接失败：主机不可达（10s 超时），请检查网络与白名单'); notify('连接失败：主机不可达', 'error'); return; }
    setTestError(''); setTested(true);
    notify('连接测试成功 · 达梦 DM8 · 延迟 32ms');
  };
  const start = () => { setRunning(true); setPct(0); setDone(false); };

  return (
    <>
      <PageHeader eyebrow="COLLECTION BLUEPRINT" title="采集方案配置" desc="面向多机构、多类型数据源的可视化采集方案，支持存量、增量、CDC 与非结构化采集，配置完成后可直接试跑并进入任务监控。" actions={<><Btn icon="book" onClick={() => notify('采集方案模板已打开', 'info')}>方案模板</Btn><Btn variant="primary" icon="play" onClick={() => { setStep(3); start(); }}>一键试跑</Btn></>} />
      <div className="wizard-shell">
        <div className="wizard-steps">
          {wizardSteps.map((s, i) => (
            <React.Fragment key={s}>
              <button className={`wizard-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`} onClick={() => setStep(i)}>
                <span className="ws-index">{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
                <span className="ws-text"><strong>{s}</strong><small>{['源端、机构与连接', '表清单、抽取策略、目标层', '字段映射与校验', '运行并查看结果'][i]}</small></span>
              </button>
              {i < wizardSteps.length - 1 && <span className={`ws-line ${i < step ? 'is-done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <div className="wizard-body grid-1-2">
            <Card title="数据源连接" subtitle="支持达梦、金仓、openGauss、MySQL、Oracle">
              <div className="form-grid">
                <Field label="归属机构" required><Select value={org} onChange={setOrg} options={['两江新区人民医院', '两江新区中医院', '人和社区卫生服务中心', '鸳鸯社区卫生服务中心']} /></Field>
                <Field label="数据库类型" required><Select value={driver} onChange={setDriver} options={['达梦 DM8', '人大金仓 V8', 'openGauss', 'MySQL 8.0', 'Oracle 19c']} /></Field>
                <Field label="主机地址" required><input className="input" value={host} onChange={(e) => setHost(e.target.value)} /></Field>
                <Field label="端口"><input className="input" defaultValue="5236" /></Field>
                <Field label="数据库名" required><input className="input" value={db} onChange={(e) => setDb(e.target.value)} /></Field>
                <Field label="只读账号" required><input className="input" defaultValue="readonly_dm" /></Field>
                <Field label="密码" required className="span-2"><input className="input" type="password" defaultValue="••••••••" /></Field>
              </div>
              <div className="wizard-test-row">
                <Btn icon="link" onClick={configure}>测试连接</Btn>
                {tested && <span className="test-ok"><Icon name="checkcircle" size={14} /> 连接成功 · 32ms · 达梦 DM8 V8.1.2.128</span>}
                {testError && <span className="test-error"><Icon name="circlex" size={14} /> {testError}</span>}
              </div>
              <div className="info-note mt-14"><Icon name="shield" size={13} /><span>平台仅使用只读账号；连接信息加密存储，采集行为全链路审计。</span></div>
            </Card>
            <Card title="接入机构与数据源" subtitle="已授权的机构范围">
              <div className="institution-list">
                {[
                  { name: '两江新区人民医院', tables: 328, status: '已授权', desc: 'HIS / EMR / LIS / PACS', tone: 'blue' },
                  { name: '两江新区中医院', tables: 186, status: '已授权', desc: 'HIS / EMR / LIS', tone: 'violet' },
                  { name: '人和社区卫生服务中心', tables: 64, status: '已授权', desc: '基层卫生 / 公卫', tone: 'cyan' },
                  { name: '鸳鸯社区卫生服务中心', tables: 52, status: '已授权', desc: '基层卫生 / 公卫', tone: 'green' },
                ].map((o) => (
                  <button key={o.name} className={`institution-card ${org === o.name ? 'is-active' : ''}`} onClick={() => setOrg(o.name)}>
                    <span className={`inst-logo tone-${o.tone}`}><Icon name="building" size={16} /></span>
                    <div><strong>{o.name}</strong><small>{o.desc}</small></div>
                    <em>{o.tables} 表</em>
                    <Badge tone="green" dot>{o.status}</Badge>
                  </button>
                ))}
              </div>
              <div className="wizard-conn-card">
                <div className="wcc-head"><span><i className="live-dot" /> 连接健康度</span><strong>99.2%</strong></div>
                <Progress value={99.2} tone="green" height={6} />
                <div className="wcc-foot"><span>近 7 日失败 2 次</span><span>平均延迟 28ms</span></div>
              </div>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-body">
            <Card title="选择同步表" subtitle={`已选 ${selected.length} 张 · 共 ${tables.length} 张`} actions={<><Btn size="sm" icon="uploadcloud" onClick={() => notify('批量导入表清单已打开', 'info')}>批量导入</Btn><button className="link-muted" onClick={() => setSelected(selected.length === tables.length ? [] : tables.map((t) => t.id))}>{selected.length === tables.length ? '取消全选' : '全选'}</button></>} noPad>
              <div className="wizard-table-grid">
                {tables.map((t) => (
                  <label key={t.id} className={`wizard-table ${selected.includes(t.id) ? 'is-checked' : ''}`}>
                    <input type="checkbox" className="checkbox" checked={selected.includes(t.id)} onChange={(e) => setSelected((arr) => e.target.checked ? [...arr, t.id] : arr.filter((x) => x !== t.id))} />
                    <div className="wt-main"><strong>{t.cn}</strong><small>{t.schema}.{t.name}</small></div>
                    <div className="wt-meta"><span>{t.rows} 行</span><span>{t.size}</span></div>
                    <Badge tone="slate">{t.layer}</Badge>
                  </label>
                ))}
              </div>
            </Card>
            <div className="grid grid-3 mt-14">
              <Card title="抽取策略" subtitle="源端读取方式">
                <div className="radio-stack">
                  {['存量初始化', '存量 + 时间戳增量', '日志 CDC 实时同步', '文件 / 非结构化'].map((m) => <label key={m} className={mode === m ? 'is-active' : ''}><input type="radio" checked={mode === m} onChange={() => setMode(m)} /><span className="radio-dot" />{m}</label>)}
                </div>
              </Card>
              <Card title="目标与调度" subtitle="落湖位置与执行频率">
                <Field label="目标层级"><Select value={target} onChange={setTarget} options={['ODS 贴源层', 'DWD 明细层', 'DWS 服务层']} /></Field>
                <Field label="调度策略" className="mt-10"><Select value={schedule} onChange={setSchedule} options={['单次执行', '每小时', '每日 02:00', '每日 06:00', '每周一 02:00']} /></Field>
                <div className="flex between center mt-10"><span className="small muted">自动创建对账任务</span><Toggle checked label="开启" /></div>
              </Card>
              <Card title="方案摘要" subtitle="请确认以下配置">
                <div className="run-summary">
                  <div><span>归属机构</span><strong>{org}</strong></div>
                  <div><span>数据源</span><strong>{driver}</strong></div>
                  <div><span>同步表</span><strong>{selected.length} 张</strong></div>
                  <div><span>抽取策略</span><strong>{mode}</strong></div>
                  <div><span>目标层级</span><strong>{target}</strong></div>
                  <div><span>执行频率</span><strong>{schedule}</strong></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body">
            <Card title="字段映射" subtitle={`${selected.length} 张表 · 自动映射 94.2% · 待确认 3 项`} actions={<><Badge tone="green" dot>自动映射完成</Badge><Btn size="sm" icon="refresh" onClick={() => notify('已重新执行智能映射')}>重新映射</Btn></>} noPad>
              <div className="table-wrap">
                <table className="data-table mapping-table">
                  <thead><tr><th>源字段</th><th>中文名</th><th>源类型</th><th>目标字段</th><th>目标类型</th><th>映射方式</th><th>校验</th></tr></thead>
                  <tbody>
                    {[['patient_id', '患者ID', 'varchar(32)', 'patient_id', 'VARCHAR(32)', '自动', '通过'], ['patient_name', '患者姓名', 'varchar(64)', 'patient_name', 'VARCHAR(64)', '自动', '通过'], ['gender_code', '性别代码', 'char(1)', 'gender', 'CHAR(1)', '字典转换', '通过'], ['id_card_no', '身份证号', 'varchar(18)', 'id_card_no', 'VARCHAR(18)', '自动', '需脱敏'], ['birth_date', '出生日期', 'date', 'birth_date', 'DATE', '自动', '通过'], ['dept_code', '科室编码', 'varchar(20)', 'dept_code', 'VARCHAR(20)', '标准对照', '通过'], ['phone_no', '联系电话', 'varchar(20)', 'phone_no', 'VARCHAR(20)', '自动', '需脱敏'], ['create_time', '建档时间', 'datetime', 'create_time', 'DATETIME', '自动', '通过']].map((r) => (
                      <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{r[1]}</td><td className="mono-cell">{r[2]}</td><td className="mono-cell">{r[3]}</td><td className="mono-cell">{r[4]}</td><td><Badge tone={r[5] === '自动' ? 'blue' : 'violet'}>{r[5]}</Badge></td><td><Badge tone={r[6] === '通过' ? 'green' : 'amber'}>{r[6]}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mapping-foot"><span><Icon name="circlealert" size={13} /> 身份证、手机号将自动套用 L3 脱敏规则</span><button className="link-btn" onClick={() => notify('字段映射配置已保存')}>保存映射</button></div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-body">
            <div className="grid-2-1">
              <Card title="试跑执行" subtitle={done ? '试跑完成，数据已进入 ODS 贴源层' : '正在执行采集方案'}>
                <div className="trial-hero">
                  <div className={`trial-ring ${done ? 'is-done' : ''}`}>
                    <div className="trial-pct">{pct}<small>%</small></div>
                    <div className="trial-label">{done ? '试跑成功' : running ? '执行中…' : '待执行'}</div>
                  </div>
                  <div className="trial-meta">
                    <div><span>方案名称</span><strong>ods_his_patient_init</strong></div>
                    <div><span>同步表</span><strong>{selected.length} 张</strong></div>
                    <div><span>预计数据量</span><strong>24.8 GB</strong></div>
                    <div><span>目标层级</span><strong>{target}</strong></div>
                  </div>
                </div>
                <Progress value={pct} tone={done ? 'green' : 'blue'} height={8} />
                <div className="trial-log">
                  <div><span>14:20:12</span>加载采集方案，校验数据源连通性…</div>
                  <div><span>14:20:14</span>连接成功，读取源端表结构（3 张表）</div>
                  <div><span>14:20:18</span>开始抽取 ods_his.patient（分页 100000）</div>
                  <div><span>14:21:02</span>已写入 128,642 行，质量校验通过</div>
                  {done && <div className="ok"><span>14:21:08</span>试跑完成，自动创建对账任务 RC-20260806</div>}
                </div>
              </Card>
              <Card title="试跑结果" subtitle={done ? '本次试跑指标' : '执行完成后展示'}>
                {done ? (
                  <>
                    <div className="trial-result-grid">
                      <div><span>同步行数</span><strong>128,642</strong></div>
                      <div><span>耗时</span><strong>56s</strong></div>
                      <div><span>质量通过率</span><strong className="text-green">99.2%</strong></div>
                      <div><span>对账差异</span><strong className="text-green">0</strong></div>
                    </div>
                    <div className="trial-checks">
                      {['连接校验通过', '表结构校验通过', '字段映射 94.2%', '脱敏规则已应用', '自动对账已创建'].map((x) => <span key={x}><Icon name="checkcircle" size={13} />{x}</span>)}
                    </div>
                    <div className="row-actions mt-14">
                      <Btn variant="primary" icon="activity" onClick={() => go('/bid/monitor')}>查看监控</Btn>
                      <Btn icon="refresh" onClick={() => { setStep(0); setDone(false); }}>再建一个方案</Btn>
                    </div>
                  </>
                ) : <div className="empty"><div className="empty-icon"><Icon name="play" size={22} /></div><h4>试跑执行中</h4><p>正在抽取并校验数据，请稍候。</p></div>}
              </Card>
            </div>
          </div>
        )}

        <div className="wizard-footer">
          <span className="muted xs"><Icon name="shield" size={12} /> 配置仅保存到当前演示会话；生产环境将写入配置库并生成版本。</span>
          <div className="row-actions">
            <Btn onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</Btn>
            {step < 3 ? <Btn variant="primary" onClick={() => setStep(step + 1)} disabled={step === 0 && !tested}>下一步 <Icon name="arrowright" size={13} /></Btn> : <Btn variant="primary" icon="refresh" onClick={start} loading={running}>重新试跑</Btn>}
          </div>
        </div>
      </div>
    </>
  );
}

type PreviewField = {
  name: string; cn: string; type: string; pk: boolean; null: boolean; std: string; desc: string;
  level?: 'L1' | 'L2' | 'L3' | 'L4'; mask?: string; raw?: string; masked?: string;
};

const defaultFields: PreviewField[] = [
  { name: 'patient_id', cn: '患者ID', type: 'varchar(32)', pk: true, null: false, std: 'DE-PAT-001', desc: '院内患者唯一标识', level: 'L1' },
  { name: 'patient_name', cn: '患者姓名', type: 'varchar(64)', pk: false, null: false, std: 'DE-PAT-002', desc: '患者姓名（脱敏展示）', level: 'L2', mask: '姓+*', raw: '张敏', masked: '张*' },
  { name: 'gender', cn: '性别代码', type: 'char(1)', pk: false, null: true, std: 'DE-GEN-001', desc: '1 男 / 2 女 / 9 未知', level: 'L1' },
  { name: 'id_card_no', cn: '身份证号', type: 'varchar(18)', pk: false, null: true, std: 'DE-PAT-003', desc: '18 位身份证号码 · L3', level: 'L3', mask: '保留前4后4', raw: '500103199001011234', masked: '5001**********1234' },
  { name: 'phone_no', cn: '联系电话', type: 'varchar(20)', pk: false, null: true, std: 'DE-PAT-005', desc: '手机号 · L3 脱敏', level: 'L3', mask: '中间4位*', raw: '13812345678', masked: '138****5678' },
  { name: 'birth_date', cn: '出生日期', type: 'date', pk: false, null: true, std: 'DE-PAT-004', desc: '出生日期', level: 'L2' },
  { name: 'dept_name', cn: '所属科室', type: 'varchar(64)', pk: false, null: true, std: 'DE-DEP-001', desc: '标准科室名称', level: 'L1' },
  { name: 'create_time', cn: '建档时间', type: 'datetime', pk: false, null: false, std: 'DE-TIM-001', desc: '患者建档时间', level: 'L1' },
];

/** A3-05★ 数据预览：目录树 → 表 → 字段 → 样例 · 脱敏 · 血缘 */
export function DataPreview() {
  const { go, notify } = useApp();
  const [schema, setSchema] = useState('ods_his');
  const [tableId, setTableId] = useState('ods_his_patient');
  const [tab, setTab] = useState('preview');
  const [q, setQ] = useState('');
  const [treeQ, setTreeQ] = useState('');
  const [maskOn, setMaskOn] = useState(true);
  const [activeField, setActiveField] = useState<PreviewField | null>(defaultFields[3]);
  const [chain, setChain] = useState<'tree' | 'table' | 'field' | 'sample'>('sample');

  const table = catalogTables.find((t) => t.id === tableId) || catalogTables.find((t) => t.name === tableId.split('_').slice(1).join('_')) || catalogTables[0];
  const fields = useMemo(() => defaultFields, []);
  const rows = previewRows.filter((r) => !q || r.join('').includes(q));
  const maskedCols = new Set(['patient_name', 'id_card_no', 'phone_no', 'name']);

  const filteredSchemas = useMemo(() => {
    const qq = treeQ.trim().toLowerCase();
    if (!qq) return catalogSchemas;
    return catalogSchemas
      .map((s) => ({ ...s, tables: s.tables.filter((t) => (s.name + s.label + t).toLowerCase().includes(qq)) }))
      .filter((s) => (s.name + s.label).toLowerCase().includes(qq) || s.tables.length > 0);
  }, [treeQ]);

  const pickSchema = (name: string) => {
    const s = catalogSchemas.find((x) => x.name === name) || catalogSchemas[0];
    setSchema(s.name);
    setTableId(s.tables[0]);
    setChain('table');
    setTab('schema');
    notify(`已进入库 ${s.label} · 选择表查看结构`);
  };

  const pickTable = (id: string) => {
    setTableId(id);
    setChain('table');
    setTab('preview');
    notify(`已打开表 ${id} · 可切换表结构 / 样例 / 血缘`);
  };

  const pickField = (f: PreviewField) => {
    setActiveField(f);
    setChain('field');
    setTab('schema');
    notify(`字段 ${f.cn}（${f.name}）${f.mask ? ' · 已绑定脱敏' : ''}`);
  };

  const showSample = () => {
    setChain('sample');
    setTab('preview');
    notify('样例数据已加载 · 敏感字段按 L3 脱敏展示');
  };

  return (
    <>
      <PageHeader
        eyebrow="LAKEHOUSE DATA PREVIEW · A3-05 ★"
        title="数据预览"
        desc="验收：目录树 → 表 → 字段 → 样例数据全链路；敏感字段自动脱敏，可切换血缘追溯。"
        actions={
          <>
            <Btn icon="code" onClick={() => go('/bid/data-query')}>打开数据查询</Btn>
            <Btn icon="download" onClick={() => notify('数据预览导出需审批，已提交申请')}>导出</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => notify('元数据已刷新')}>刷新元数据</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '目录树', d: '库/表层可检索', on: chain === 'tree' },
          { n: '02', t: '选表', d: '元数据与质量', on: chain === 'table' },
          { n: '03', t: '字段', d: '标准·分级·脱敏', on: chain === 'field' },
          { n: '04', t: '样例', d: '脱敏明细可验', on: chain === 'sample' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 脱敏 {maskOn ? '开' : '关'} · L3 字段 {fields.filter((f) => f.level === 'L3').length}</span>
      </div>

      <div className="preview-layout mt-14">
        <aside className="preview-tree">
          <div className="pt-head"><span><Icon name="database" size={14} /> 湖仓目录</span><Badge tone="green" dot>已连接</Badge></div>
          <div className="pt-search"><Icon name="search" size={13} /><input value={treeQ} onChange={(e) => { setTreeQ(e.target.value); setChain('tree'); }} placeholder="搜索库表" /></div>
          <div className="pt-body">
            {filteredSchemas.map((s) => (
              <div key={s.name} className="pt-group">
                <button className={`pt-schema ${schema === s.name ? 'is-active' : ''}`} onClick={() => pickSchema(s.name)}>
                  <Icon name="chevron" size={11} /><Icon name="database" size={12} /><span>{s.label}</span><em>{s.count}</em>
                </button>
                {schema === s.name && (
                  <div className="pt-tables">
                    {(treeQ ? s.tables : (catalogSchemas.find((x) => x.name === s.name)?.tables || s.tables)).map((t) => (
                      <button key={t} className={`pt-table ${tableId === t ? 'is-active' : ''}`} onClick={() => pickTable(t)}>
                        <Icon name="table" size={11} /><span>{t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pt-foot"><Icon name="shield" size={12} /> 数据权限：全院 · 脱敏 {fields.filter((f) => !!f.mask).length} 字段</div>
        </aside>

        <div className="preview-main">
          <div className="preview-meta">
            <div className="pm-title">
              <span className={`layer-mark ${table.layer.toLowerCase()}`}>{table.layer}</span>
              <div>
                <h2>{table.cn}<Badge tone="green" dot>已认证</Badge></h2>
                <span className="preview-crumb">
                  <button type="button" className="link-btn" onClick={() => setChain('tree')}>{table.schema}</button>
                  <Icon name="chevronright" size={11} />
                  <button type="button" className="link-btn" onClick={() => setChain('table')}>{table.name}</button>
                  {activeField && (<><Icon name="chevronright" size={11} /><button type="button" className="link-btn" onClick={() => setChain('field')}>{activeField.name}</button></>)}
                  <span> · {table.owner} · {table.updated}</span>
                </span>
              </div>
            </div>
            <div className="pm-stats">
              <div><span>数据行数</span><strong>{table.rows}</strong></div>
              <div><span>存储容量</span><strong>{table.size}</strong></div>
              <div><span>质量得分</span><strong className="text-green">{table.quality}</strong></div>
              <div><span>安全级别</span><strong>L3</strong></div>
            </div>
            <div className="pm-actions">
              <Btn size="sm" variant={maskOn ? 'secondary' : 'ghost'} icon="eye" onClick={() => { setMaskOn((v) => !v); notify(maskOn ? '已关闭脱敏（仅演示对照）' : '已恢复 L3 脱敏展示'); }}>
                {maskOn ? '脱敏开' : '脱敏关'}
              </Btn>
              <Btn size="sm" icon="download" onClick={() => notify('导出申请已提交')}>导出</Btn>
              <Btn size="sm" variant="primary" icon="play" onClick={showSample}>加载样例</Btn>
            </div>
          </div>
          <div className="tag-row">{table.tags.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}<Badge tone="amber">L3 · 含个人敏感信息</Badge></div>
          <div className="preview-tabs">
            <Tabs variant="line" value={tab} onChange={(k) => { setTab(k); if (k === 'preview') setChain('sample'); if (k === 'schema') setChain('field'); }} items={[
              { key: 'preview', label: '样例数据' },
              { key: 'schema', label: '表结构', count: fields.length },
              { key: 'lineage', label: '字段血缘' },
              { key: 'history', label: '变更记录' },
            ]} />
            <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="筛选预览数据" width={190} /><Btn size="sm" icon="filter" onClick={() => notify('高级筛选已打开', 'info')}>筛选</Btn></div>
          </div>
          {tab === 'preview' && (
            <div className="preview-table">
              <div className="preview-note">
                <Icon name="eye" size={13} />
                <span>角色：数据分析师 · 身份证/手机号/姓名按 L3 {maskOn ? '已脱敏' : '明文对照（演示）'}；导出需审批。</span>
                <span className="preview-count">预览 {rows.length} 行 · 共 {table.rows} 行</span>
              </div>
              <div className="table-wrap">
                <table className="data-table preview-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {previewColumns.map((c) => (
                        <th key={c.key} className={maskedCols.has(c.key) ? 'is-masked-col' : ''}>
                          <button type="button" className="link-btn" onClick={() => {
                            const f = fields.find((x) => x.name === c.key) || fields[0];
                            pickField(f);
                          }}>{c.label}</button>
                          {c.pk && <span className="pk-tag">PK</span>}
                          {maskedCols.has(c.key) && <Badge tone="amber">脱敏</Badge>}
                          <small className="col-type">{c.type}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        {r.map((v, j) => {
                          const col = previewColumns[j]?.key;
                          const f = fields.find((x) => x.name === col);
                          const show = !maskOn && f?.raw ? f.raw : v;
                          return <td key={j} className={j === 0 ? 'mono-cell' : ''}>{show}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-foot"><span className="table-count">共 {table.rows} 行 · 当前展示 {rows.length} 行</span><div className="pager"><button disabled>上一页</button><button className="is-active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
            </div>
          )}
          {tab === 'schema' && (
            <div className="preview-schema grid grid-2-1">
              <table className="data-table">
                <thead><tr><th>序号</th><th>字段名</th><th>中文名</th><th>类型</th><th>分级</th><th>标准</th><th>说明</th></tr></thead>
                <tbody>
                  {fields.map((f, i) => (
                    <tr key={f.name} className={activeField?.name === f.name ? 'is-active-row' : ''} onClick={() => pickField(f)} style={{ cursor: 'pointer' }}>
                      <td className="muted">{i + 1}</td>
                      <td className="mono-cell">{f.name}{f.pk && <span className="pk-tag">PK</span>}</td>
                      <td>{f.cn}</td>
                      <td className="mono-cell">{f.type}</td>
                      <td><Badge tone={f.level === 'L3' || f.level === 'L4' ? 'amber' : 'slate'}>{f.level || 'L1'}</Badge></td>
                      <td><Badge tone="blue">{f.std}</Badge></td>
                      <td className="muted">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Card title="字段详情" subtitle={activeField ? activeField.cn : '点选字段'}>
                {activeField ? (
                  <>
                    <KeyValue cols={1} items={[
                      { label: '字段名', value: activeField.name },
                      { label: '类型', value: activeField.type },
                      { label: '安全分级', value: activeField.level || 'L1' },
                      { label: '标准编码', value: activeField.std },
                      { label: '脱敏策略', value: activeField.mask || '不脱敏' },
                    ]} />
                    {activeField.mask && (
                      <div className="mask-list mt-14">
                        <div><div><strong>明文样例</strong><small>{activeField.raw}</small></div></div>
                        <div><div><strong>脱敏结果</strong><small>{activeField.masked}</small></div></div>
                      </div>
                    )}
                    <Btn className="mt-14 w-full" variant="primary" icon="play" onClick={showSample}>查看样例数据</Btn>
                  </>
                ) : <div className="empty-hint">请选择字段</div>}
              </Card>
            </div>
          )}
          {tab === 'lineage' && (
            <div className="preview-lineage">
              <LineageGraph height={360} nodes={[
                { id: 'src', label: 'HIS 生产库', sub: 'dbo.PATIENT', type: 'source', x: 30, y: 150, w: 160 },
                { id: 'ods', label: `${table.schema}.${table.name}`, sub: 'ODS 贴源表', type: 'ods', x: 260, y: 150, w: 170 },
                { id: 'dwd', label: 'dwd.dim_patient', sub: 'DWD 维度表', type: 'model', x: 500, y: 150, w: 170 },
                { id: 'ind', label: '患者主索引', sub: '主数据服务', type: 'indicator', x: 740, y: 80, w: 150 },
                { id: 'tag', label: '居民标签', sub: '标签中心', type: 'app', x: 740, y: 220, w: 150 },
              ]} edges={[{ from: 'src', to: 'ods' }, { from: 'ods', to: 'dwd' }, { from: 'dwd', to: 'ind' }, { from: 'dwd', to: 'tag' }]} />
              <div className="info-note mt-14"><Icon name="network" size={13} /><span>字段级血缘：点表结构字段可对照标准编码；完整图谱见依赖/血缘页。</span>
                <button className="link-btn" onClick={() => go('/center/graph')}>打开图谱</button>
              </div>
            </div>
          )}
          {tab === 'history' && (
            <div className="timeline-list preview-history">
              {[['2026-08-06 14:12', '新增字段 dept_name', '字段类型 varchar(64)，关联标准 DE-DEP-001', '新增字段'], ['2026-07-28 09:20', '字段脱敏规则调整', '身份证号由保留后 6 位调整为后 4 位', '安全变更'], ['2026-06-15 16:08', '表结构变更', '新增 create_time 字段，重建分区', '结构变更'], ['2026-05-20 11:32', '质量规则绑定', '新增主键唯一性、非空校验 3 条规则', '质量规则']].map(([t, title, desc, tag]) => <div className="tl-item" key={t}><span className="tl-dot" /><div className="tl-time">{t.slice(5)}</div><div className="tl-body"><div><strong>{title}</strong><Badge tone="blue">{tag}</Badge></div><p>{desc}</p></div></div>)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export { RealtimeChannel } from '../collection/DataChannel';
