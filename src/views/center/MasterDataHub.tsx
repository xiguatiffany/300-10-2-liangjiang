'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'model' | 'integrate' | 'dict';

type MdModel = {
  id: string;
  name: string;
  domain: '人员' | '机构' | '药品' | '科室' | '物资';
  attrs: number;
  rules: number;
  status: '草稿' | '审核中' | '已发布' | '已实例化';
  ver: string;
  owner: string;
};

type MdInstance = { id: string; model: string; name: string; code: string; ver: string; status: '有效' | '停用'; updated: string };
type IntegRow = {
  id: string;
  name: string;
  mode: '数据库' | 'API';
  dir: '接入' | '共享';
  target: string;
  ver: string;
  status: '运行中' | '已发布' | '异常';
  last: string;
};
type LogRow = { id: string; at: string; kind: '接入' | '共享' | '审核' | '发布'; object: string; result: string; actor: string };
type DictReg = {
  id: string;
  name: string;
  std: string;
  items: number;
  mapped: number;
  status: '已注册' | '对照中' | '已发布';
  ver: string;
};

const modelsSeed: MdModel[] = [
  { id: 'MDM-01', name: '医疗机构主数据', domain: '机构', attrs: 42, rules: 12, status: '已实例化', ver: 'V2.1', owner: '信息中心' },
  { id: 'MDM-02', name: '科室主数据', domain: '科室', attrs: 28, rules: 8, status: '已实例化', ver: 'V1.8', owner: '医政科' },
  { id: 'MDM-03', name: '医护人员主数据', domain: '人员', attrs: 36, rules: 14, status: '已发布', ver: 'V1.4', owner: '人事科' },
  { id: 'MDM-04', name: '药品目录主数据', domain: '药品', attrs: 48, rules: 16, status: '审核中', ver: 'V3.0', owner: '药事办' },
  { id: 'MDM-05', name: '物资耗材主数据', domain: '物资', attrs: 32, rules: 9, status: '草稿', ver: 'V0.9', owner: '后勤' },
];

const instancesSeed: MdInstance[] = [
  { id: 'INS-01', model: '医疗机构主数据', name: '两江新区人民医院', code: 'ORG-5001', ver: 'V2.1', status: '有效', updated: '08-06' },
  { id: 'INS-02', model: '医疗机构主数据', name: '金渝社区卫生服务中心', code: 'ORG-5028', ver: 'V2.1', status: '有效', updated: '08-05' },
  { id: 'INS-03', model: '科室主数据', name: '心内科', code: 'DEPT-心内', ver: 'V1.8', status: '有效', updated: '08-06' },
  { id: 'INS-04', model: '科室主数据', name: '检验科', code: 'DEPT-检验', ver: 'V1.8', status: '有效', updated: '08-04' },
  { id: 'INS-05', model: '医护人员主数据', name: '张敏', code: 'STAFF-10086', ver: 'V1.4', status: '有效', updated: '08-03' },
  { id: 'INS-06', model: '药品目录主数据', name: '阿司匹林肠溶片', code: 'DRUG-ASPL', ver: 'V2.8', status: '停用', updated: '07-28' },
];

const integSeed: IntegRow[] = [
  { id: 'IG-01', name: 'HIS 机构主数据接入', mode: '数据库', dir: '接入', target: 'ods_mdm.org', ver: 'V2.1', status: '运行中', last: '14:18' },
  { id: 'IG-02', name: 'HRP 人员主数据接入', mode: 'API', dir: '接入', target: '/mdm/staff/sync', ver: 'V1.4', status: '运行中', last: '14:10' },
  { id: 'IG-03', name: '科室主数据共享视图', mode: '数据库', dir: '共享', target: 'vw_mdm_dept', ver: 'V1.8', status: '已发布', last: '13:55' },
  { id: 'IG-04', name: '机构主数据开放 API', mode: 'API', dir: '共享', target: '/open/v1/mdm/org', ver: 'V2.1', status: '已发布', last: '13:40' },
  { id: 'IG-05', name: '药品目录接入', mode: '数据库', dir: '接入', target: 'ods_mdm.drug', ver: 'V2.8', status: '异常', last: '12:02' },
  { id: 'IG-06', name: '公卫机构字典共享', mode: 'API', dir: '共享', target: '/open/v1/mdm/ph-org', ver: 'V1.2', status: '已发布', last: '11:20' },
];

const logsSeed: LogRow[] = [
  { id: 'LG-901', at: '14:18:22', kind: '接入', object: 'IG-01', result: '增量 128 条成功', actor: '系统' },
  { id: 'LG-900', at: '14:05:10', kind: '审核', object: 'MDM-04', result: '提交药事办审核', actor: '赵倩' },
  { id: 'LG-899', at: '13:55:01', kind: '共享', object: 'IG-03', result: '视图刷新完成', actor: '系统' },
  { id: 'LG-898', at: '13:40:44', kind: '发布', object: 'IG-04', result: 'API V2.1 已发布', actor: '李倩' },
  { id: 'LG-897', at: '12:02:18', kind: '接入', object: 'IG-05', result: '源库连接超时', actor: '系统' },
  { id: 'LG-896', at: '11:20:06', kind: '共享', object: 'IG-06', result: '调用 42 次', actor: '公卫平台' },
];

const dictSeed: DictReg[] = [
  { id: 'DR-01', name: '机构类别代码', std: 'WS 218', items: 18, mapped: 18, status: '已发布', ver: 'V2.0' },
  { id: 'DR-02', name: '科室分类代码', std: '院内+国标', items: 286, mapped: 274, status: '对照中', ver: 'V1.6' },
  { id: 'DR-03', name: '职称代码', std: 'GB/T 8561', items: 42, mapped: 42, status: '已发布', ver: 'V1.2' },
  { id: 'DR-04', name: '药品剂型', std: '国家医保', items: 128, mapped: 120, status: '对照中', ver: 'V3.1' },
  { id: 'DR-05', name: '物资分类', std: '院内', items: 64, mapped: 64, status: '已注册', ver: 'V1.0' },
];

const flowSteps = ['模型注册', '规则配置', '审核', '发布', '实例化'] as const;

/** B3 主数据管理：模型审核实例化 · 集成共享 · 字典注册 */
export function MasterDataHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('model');
  const [models, setModels] = useState(modelsSeed);
  const [instances, setInstances] = useState(instancesSeed);
  const [integs, setIntegs] = useState(integSeed);
  const [logs, setLogs] = useState(logsSeed);
  const [dicts, setDicts] = useState(dictSeed);

  const [mq, setMq] = useState('');
  const [mstatus, setMstatus] = useState('');
  const [activeModel, setActiveModel] = useState<MdModel | null>(null);
  const [activeInst, setActiveInst] = useState<MdInstance | null>(null);
  const [activeInteg, setActiveInteg] = useState<IntegRow | null>(null);
  const [activeDict, setActiveDict] = useState<DictReg | null>(null);
  const [newModel, setNewModel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [iq, setIq] = useState('');
  const [idir, setIdir] = useState('');
  const [dq, setDq] = useState('');
  const [lq, setLq] = useState('');

  const modelRows = useMemo(() => models.filter((m) =>
    (!mstatus || m.status === mstatus)
    && (m.id + m.name + m.domain).toLowerCase().includes(mq.toLowerCase())
  ), [models, mq, mstatus]);

  const integRows = useMemo(() => integs.filter((i) =>
    (!idir || i.dir === idir)
    && (i.id + i.name + i.target).toLowerCase().includes(iq.toLowerCase())
  ), [integs, iq, idir]);

  const dictRows = useMemo(() => dicts.filter((d) =>
    (d.id + d.name + d.std).toLowerCase().includes(dq.toLowerCase())
  ), [dicts, dq]);

  const logRows = useMemo(() => logs.filter((l) =>
    (l.id + l.object + l.result + l.actor).toLowerCase().includes(lq.toLowerCase())
  ), [logs, lq]);

  const published = models.filter((m) => m.status === '已发布' || m.status === '已实例化').length;
  const instantiated = models.filter((m) => m.status === '已实例化').length;
  const shareOk = integs.filter((i) => i.dir === '共享' && i.status === '已发布').length;

  const stepIndex = (s: MdModel['status']) => {
    if (s === '草稿') return 1;
    if (s === '审核中') return 2;
    if (s === '已发布') return 3;
    return 4;
  };

  const advanceModel = async (m: MdModel) => {
    setBusy(true);
    setTab('model');
    await new Promise((r) => setTimeout(r, 700));
    const next: MdModel['status'] =
      m.status === '草稿' ? '审核中'
        : m.status === '审核中' ? '已发布'
          : m.status === '已发布' ? '已实例化'
            : '已实例化';
    setModels((arr) => arr.map((x) => x.id === m.id ? { ...x, status: next } : x));
    setActiveModel((x) => x && x.id === m.id ? { ...x, status: next } : x);
    if (next === '已实例化') {
      const id = `INS-${String(instances.length + 1).padStart(2, '0')}`;
      setInstances((arr) => [{
        id, model: m.name, name: `${m.name}样例实例`, code: `AUTO-${id}`, ver: m.ver, status: '有效', updated: '08-06',
      }, ...arr]);
    }
    setLogs((arr) => [{
      id: `LG-${900 + arr.length}`, at: '14:22:00', kind: next === '已发布' ? '发布' : '审核',
      object: m.id, result: `${m.name} → ${next}`, actor: '张敏',
    }, ...arr]);
    setBusy(false);
    notify(`${m.name} 已推进至「${next}」`);
  };

  const syncInteg = async (row: IntegRow) => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setIntegs((arr) => arr.map((i) => i.id === row.id ? { ...i, status: '运行中', last: '14:22', ver: i.ver } : i));
    setLogs((arr) => [{
      id: `LG-${910 + arr.length}`, at: '14:22:18', kind: row.dir, object: row.id,
      result: row.status === '异常' ? '重连成功 · 增量补齐' : '同步完成', actor: '系统',
    }, ...arr]);
    setBusy(false);
    notify(`${row.name} 同步完成 · 日志已记录`);
  };

  const publishShare = (row: IntegRow) => {
    setIntegs((arr) => arr.map((i) => i.id === row.id ? { ...i, status: '已发布', last: '14:22' } : i));
    setLogs((arr) => [{
      id: `LG-${920 + arr.length}`, at: '14:22:40', kind: '发布', object: row.id,
      result: `${row.target} 共享已发布`, actor: '李倩',
    }, ...arr]);
    notify(`${row.name} 已发布共享`);
  };

  const registerDict = () => {
    const id = `DR-${String(dicts.length + 1).padStart(2, '0')}`;
    const row: DictReg = { id, name: '新建主数据字典', std: '院内', items: 0, mapped: 0, status: '已注册', ver: 'V1.0' };
    setDicts((arr) => [row, ...arr]);
    setActiveDict(row);
    notify('字典已注册，可开展对照');
  };

  const finishMap = (d: DictReg) => {
    setDicts((arr) => arr.map((x) => x.id === d.id ? { ...x, mapped: x.items || 12, items: x.items || 12, status: '已发布' } : x));
    setActiveDict((x) => x && x.id === d.id ? { ...x, mapped: x.items || 12, items: x.items || 12, status: '已发布' } : x);
    notify(`${d.name} 对照完成并发布`);
  };

  return (
    <>
      <PageHeader
        eyebrow="MASTER DATA · B3"
        title="主数据管理"
        desc="B3-01 模型注册/审核/实例化 · B3-02 接入共享/版本日志/字典注册对照。"
        actions={
          <>
            <Btn icon="fingerprint" onClick={() => go('/bid/main-archive')}>居民主索引</Btn>
            <Btn icon="braces" onClick={() => go('/center/domains')}>值域字典</Btn>
            <Btn icon="book" onClick={() => go('/bid/standard-docs')}>数据标准</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setTab('model'); setNewModel(true); }}>注册模型</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '模型闭环', d: '注册→审核→实例化' },
          { n: '02', t: '集成共享', d: '版本·日志可追溯' },
          { n: '03', t: '字典注册', d: '注册·对照·发布' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'model' : i === 1 ? 'integrate' : 'dict') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 已实例化 {instantiated} · 共享 {shareOk}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="主数据模型" value={String(models.length)} unit="套" delta={`已发布 ${published}`} icon="boxes" tone="violet" onClick={() => setTab('model')} />
        <StatCard label="实例数据" value={String(instances.length)} unit="条" delta="可版本查询" icon="database" tone="blue" onClick={() => setTab('model')} />
        <StatCard label="接入/共享" value={String(integs.length)} unit="路" delta={`共享已发 ${shareOk}`} icon="cable" tone="cyan" onClick={() => setTab('integrate')} />
        <StatCard label="字典注册" value={String(dicts.length)} unit="套" delta="对照可追溯" icon="braces" tone="green" onClick={() => setTab('dict')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'model', label: '模型 / 审核 / 实例化', count: models.length },
          { key: 'integrate', label: '集成与共享', count: integs.length },
          { key: 'dict', label: '字典注册对照', count: dicts.length },
        ]}
      />

      {tab === 'model' && (
        <>
          <Card className="mt-14" title="模型生命周期" subtitle="注册 → 规则 → 审核 → 发布 → 实例化">
            <div className="mdm-flow">
              {flowSteps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="mdm-flow-step">
                    <em>{String(i + 1).padStart(2, '0')}</em>
                    <strong>{s}</strong>
                  </div>
                  {i < flowSteps.length - 1 && <Icon name="arrowright" size={13} />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          <div className="grid-2-1 mt-14">
            <Card title="主数据模型" subtitle="数据类与校验规则元数据" noPad actions={
              <div className="filter-bar">
                <SearchInput value={mq} onChange={setMq} placeholder="搜索模型" width={160} />
                <Select value={mstatus} onChange={setMstatus} options={['', '草稿', '审核中', '已发布', '已实例化']} placeholder="状态" width={100} />
              </div>
            }>
              <div className="pad-h">
                <DataTable rows={modelRows} pageSize={6} onRowClick={(r) => setActiveModel(r)} columns={[
                  { key: 'id', title: '编号', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '模型', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.domain} · {r.ver}</small></div> },
                  { key: 'attrs', title: '属性', width: 50, align: 'right' },
                  { key: 'rules', title: '规则', width: 50, align: 'right' },
                  { key: 'status', title: '状态', width: 84, render: (r) => <Badge dot tone={r.status === '已实例化' || r.status === '已发布' ? 'green' : r.status === '审核中' ? 'amber' : 'slate'}>{r.status}</Badge> },
                  { key: 'ops', title: '操作', width: 90, render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      {r.status !== '已实例化' ? (
                        <button type="button" className="link-btn" onClick={() => advanceModel(r)}>推进</button>
                      ) : (
                        <button type="button" className="link-muted" onClick={() => setActiveModel(r)}>详情</button>
                      )}
                    </div>
                  ) },
                ]} />
              </div>
            </Card>
            <Card title="实例清单" subtitle="模型实例化结果" noPad>
              <div className="pad-h">
                <DataTable rows={instances} pageSize={6} onRowClick={(r) => setActiveInst(r)} columns={[
                  { key: 'code', title: '编码', width: 100, render: (r) => <span className="mono-cell">{r.code}</span> },
                  { key: 'name', title: '实例', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.model}</small></div> },
                  { key: 'status', title: '状态', width: 64, render: (r) => <Badge tone={r.status === '有效' ? 'green' : 'slate'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'integrate' && (
        <>
          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <div className="filter-bar">
                <SearchInput value={iq} onChange={setIq} placeholder="搜索接入/共享" width={220} />
                <Select value={idir} onChange={setIdir} options={['', '接入', '共享']} placeholder="方向" width={90} />
              </div>
              <span className="table-note"><Icon name="scroll" size={12} /> 版本与日志可追溯</span>
            </div>
            <div className="pad-h">
              <DataTable rows={integRows} pageSize={6} onRowClick={(r) => setActiveInteg(r)} columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '通道', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.target}</small></div> },
                { key: 'mode', title: '方式', width: 70, render: (r) => <Badge tone="slate">{r.mode}</Badge> },
                { key: 'dir', title: '方向', width: 64, render: (r) => <Badge tone={r.dir === '接入' ? 'blue' : 'violet'}>{r.dir}</Badge> },
                { key: 'ver', title: '版本', width: 64, render: (r) => <Badge tone="slate">{r.ver}</Badge> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '异常' ? 'red' : 'green'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 100, render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="link-btn" onClick={() => syncInteg(r)}>同步</button>
                    {r.dir === '共享' && r.status !== '已发布' && (
                      <button type="button" className="link-muted" onClick={() => publishShare(r)}>发布</button>
                    )}
                  </div>
                ) },
              ]} />
            </div>
          </Card>

          <div className="grid grid-2 mt-14">
            <Card title="接入 / 共享概览" subtitle="数据库 · API">
              <div className="mdm-integ-grid">
                {[
                  { t: '数据库接入', n: integs.filter((i) => i.mode === '数据库' && i.dir === '接入').length, tone: 'blue' },
                  { t: 'API 接入', n: integs.filter((i) => i.mode === 'API' && i.dir === '接入').length, tone: 'violet' },
                  { t: '表/视图共享', n: integs.filter((i) => i.mode === '数据库' && i.dir === '共享').length, tone: 'cyan' },
                  { t: 'API 共享', n: integs.filter((i) => i.mode === 'API' && i.dir === '共享').length, tone: 'green' },
                ].map((x) => (
                  <div key={x.t} className={`mdm-integ tone-${x.tone}`}>
                    <strong>{x.n}</strong>
                    <small>{x.t}</small>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="接入/共享日志" subtitle="可追溯" noPad actions={
              <SearchInput value={lq} onChange={setLq} placeholder="检索日志" width={140} />
            }>
              <div className="pad-h">
                <DataTable rows={logRows} pageSize={5} columns={[
                  { key: 'at', title: '时间', width: 80, render: (r) => <span className="muted">{r.at.slice(0, 8)}</span> },
                  { key: 'kind', title: '类型', width: 56, render: (r) => <Badge tone="slate">{r.kind}</Badge> },
                  { key: 'object', title: '对象', width: 70, render: (r) => <span className="mono-cell">{r.object}</span> },
                  { key: 'result', title: '结果', render: (r) => <span>{r.result}</span> },
                ]} />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'dict' && (
        <>
          <Card className="mt-14" title="主数据字典注册" subtitle="注册 · 对照 · 发布" actions={
            <Btn size="sm" icon="plus" onClick={registerDict}>注册字典</Btn>
          } noPad>
            <div className="meta-toolbar">
              <SearchInput value={dq} onChange={setDq} placeholder="搜索字典" width={220} />
              <span className="table-note"><Icon name="link" size={12} /> 与标准值域贯通</span>
            </div>
            <div className="pad-h">
              <DataTable rows={dictRows} pageSize={6} onRowClick={(r) => setActiveDict(r)} columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '字典', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.std} · {r.ver}</small></div> },
                { key: 'items', title: '条目', width: 60, align: 'right' },
                { key: 'map', title: '对照', width: 120, render: (r) => {
                  const pct = r.items ? Math.round((r.mapped / r.items) * 100) : 0;
                  return <div className="quality-cell"><Progress value={pct} tone={pct >= 95 ? 'green' : 'amber'} /><span>{pct}%</span></div>;
                } },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '已发布' ? 'green' : r.status === '对照中' ? 'amber' : 'blue'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 90, render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    {r.status !== '已发布' ? (
                      <button type="button" className="link-btn" onClick={() => finishMap(r)}>完成对照</button>
                    ) : (
                      <button type="button" className="link-muted" onClick={() => go('/bid/standard-docs')}>标准</button>
                    )}
                  </div>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-2 mt-14">
            <Card title="对照说明" subtitle="主数据码 ↔ 国标/院内码">
              <div className="mdm-map-demo">
                {[
                  { src: 'ORG-TYPE-01', dst: 'A100', name: '综合医院' },
                  { src: 'DEPT-心内', dst: 'A03.01', name: '心血管内科' },
                  { src: 'TITLE-03', dst: '411', name: '副主任医师' },
                ].map((x) => (
                  <div key={x.src}>
                    <code>{x.src}</code>
                    <Icon name="arrowright" size={12} />
                    <code>{x.dst}</code>
                    <span>{x.name}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="关联能力">
              <div className="md-cap-list">
                {[
                  { t: '版本查询', d: '模型/实例/共享通道均可按版本回溯' },
                  { t: '审核发布', d: '字典与模型共用审核流' },
                  { t: '日志追溯', d: '接入、共享、发布全记录' },
                  { t: 'MPI 衔接', d: '人员主数据可下钻居民主索引' },
                ].map((c) => (
                  <div key={c.t}><Icon name="checkcircle" size={13} /><div><strong>{c.t}</strong><small>{c.d}</small></div></div>
                ))}
              </div>
              <Btn className="mt-10" size="sm" icon="fingerprint" onClick={() => go('/bid/main-archive')}>打开居民主档案</Btn>
            </Card>
          </div>
        </>
      )}

      <Drawer
        open={!!activeModel}
        onClose={() => setActiveModel(null)}
        title={activeModel?.name || ''}
        desc={activeModel ? `${activeModel.id} · ${activeModel.domain} · ${activeModel.ver}` : ''}
        width={560}
        footer={
          <>
            <Btn onClick={() => setActiveModel(null)}>关闭</Btn>
            {activeModel && activeModel.status !== '已实例化' && (
              <Btn variant="primary" loading={busy} onClick={() => activeModel && advanceModel(activeModel)}>推进下一步</Btn>
            )}
          </>
        }
      >
        {activeModel && (
          <>
            <div className="mdm-flow compact">
              {flowSteps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`mdm-flow-step ${i <= stepIndex(activeModel.status) ? 'is-on' : ''}`}>
                    <em>{String(i + 1).padStart(2, '0')}</em>
                    <strong>{s}</strong>
                  </div>
                  {i < flowSteps.length - 1 && <Icon name="arrowright" size={12} />}
                </React.Fragment>
              ))}
            </div>
            <KeyValue className="mt-14" cols={2} items={[
              { label: '属性数', value: String(activeModel.attrs) },
              { label: '校验规则', value: String(activeModel.rules) },
              { label: '负责人', value: activeModel.owner },
              { label: '状态', value: <Badge>{activeModel.status}</Badge> },
              { label: '规则元数据', value: '编码唯一、必填、值域、引用完整性、停用级联', wide: true },
            ]} />
            <div className="info-note mt-14"><Icon name="shield" size={13} /><span>模型变更须审核通过后方可发布；实例化后生成可共享主数据。</span></div>
          </>
        )}
      </Drawer>

      <Drawer open={!!activeInst} onClose={() => setActiveInst(null)} title={activeInst?.name || ''} desc={activeInst?.code} width={460}
        footer={<><Btn onClick={() => setActiveInst(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('实例版本历史已打开', 'info')}>版本</Btn></>}>
        {activeInst && (
          <KeyValue cols={2} items={[
            { label: '所属模型', value: activeInst.model },
            { label: '版本', value: activeInst.ver },
            { label: '状态', value: <Badge tone={activeInst.status === '有效' ? 'green' : 'slate'}>{activeInst.status}</Badge> },
            { label: '更新', value: activeInst.updated },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeInteg} onClose={() => setActiveInteg(null)} title={activeInteg?.name || ''} desc={activeInteg?.id} width={500}
        footer={
          <>
            <Btn onClick={() => setActiveInteg(null)}>关闭</Btn>
            {activeInteg && <Btn icon="refresh" loading={busy} onClick={() => activeInteg && syncInteg(activeInteg)}>同步</Btn>}
            {activeInteg && activeInteg.dir === '共享' && activeInteg.status !== '已发布' && (
              <Btn variant="primary" onClick={() => activeInteg && publishShare(activeInteg)}>发布共享</Btn>
            )}
          </>
        }
      >
        {activeInteg && (
          <KeyValue cols={2} items={[
            { label: '方式', value: activeInteg.mode },
            { label: '方向', value: activeInteg.dir },
            { label: '目标', value: <span className="mono">{activeInteg.target}</span> },
            { label: '版本', value: activeInteg.ver },
            { label: '状态', value: <Badge>{activeInteg.status}</Badge> },
            { label: '最近', value: activeInteg.last },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeDict} onClose={() => setActiveDict(null)} title={activeDict?.name || ''} desc={activeDict ? `${activeDict.std} · ${activeDict.ver}` : ''} width={480}
        footer={
          <>
            <Btn onClick={() => setActiveDict(null)}>关闭</Btn>
            {activeDict && activeDict.status !== '已发布' && (
              <Btn variant="primary" onClick={() => activeDict && finishMap(activeDict)}>完成对照并发布</Btn>
            )}
          </>
        }
      >
        {activeDict && (
          <KeyValue cols={2} items={[
            { label: '条目', value: String(activeDict.items) },
            { label: '已对照', value: String(activeDict.mapped) },
            { label: '标准', value: activeDict.std },
            { label: '状态', value: <Badge>{activeDict.status}</Badge> },
          ]} />
        )}
      </Drawer>

      <Modal
        open={newModel}
        onClose={() => setNewModel(false)}
        title="注册主数据模型"
        desc="定义数据类、属性与校验规则，提交后进入审核。"
        width={600}
        footer={
          <>
            <Btn onClick={() => setNewModel(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `MDM-${String(models.length + 1).padStart(2, '0')}`;
              const row: MdModel = {
                id, name: '新建主数据模型', domain: '机构', attrs: 12, rules: 4, status: '草稿', ver: 'V1.0', owner: '数据治理办',
              };
              setModels((arr) => [row, ...arr]);
              setNewModel(false);
              setActiveModel(row);
              notify('主数据模型已注册（草稿）');
            }}>提交注册</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="模型名称" required className="span-2"><input className="input" placeholder="例如：机构主数据" /></Field>
          <Field label="主题域"><Select value="机构" onChange={() => {}} options={['人员', '机构', '药品', '科室', '物资']} /></Field>
          <Field label="版本"><input className="input" defaultValue="V1.0" /></Field>
          <Field label="校验规则" className="span-2"><textarea className="textarea" rows={2} defaultValue="编码唯一；名称必填；引用完整性；停用不可被新业务引用。" /></Field>
        </div>
      </Modal>
    </>
  );
}
