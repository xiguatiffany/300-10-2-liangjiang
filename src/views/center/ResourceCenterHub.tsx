'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'three' | 'themes' | 'base';

type LibItem = {
  id: string;
  name: string;
  std: string;
  forms: number;
  tables: number;
  rows: string;
  cover: number;
  status: '已建库' | '建设中' | '待对齐';
  owner: string;
};

type ThemeLib = {
  id: string;
  name: string;
  domain: '妇幼' | '基层' | '运营' | '疾控' | '监督' | '职健';
  models: number;
  indicators: number;
  apis: number;
  cover: number;
  status: '可用' | '建设中';
};

type BaseItem = {
  id: string;
  kind: '机构资源' | '药品目录' | '诊断目录' | '收费目录' | '材料目录' | '数据元字典' | '事件库' | '索引库' | '交换库';
  name: string;
  items: number;
  refs: number;
  status: '已发布' | '维护中';
  ver: string;
};

type FormRow = { id: string; lib: string; name: string; stdCode: string; fields: number; status: string };

const threeSeed: LibItem[] = [
  { id: 'LIB-POP', name: '全员人口库', std: 'WS/T 表单对齐', forms: 18, tables: 42, rows: '128.6 万', cover: 94, status: '已建库', owner: '人口监测办' },
  { id: 'LIB-EMR', name: '电子病历库', std: '电子病历共享文档规范', forms: 86, tables: 268, rows: '42.8 亿', cover: 91, status: '已建库', owner: '医政科' },
  { id: 'LIB-EHR', name: '健康档案库', std: '城乡居民健康档案规范', forms: 64, tables: 186, rows: '86.4 万', cover: 88, status: '建设中', owner: '公卫科' },
];

const formsSeed: FormRow[] = [
  { id: 'F-01', lib: '全员人口库', name: '个人基本信息', stdCode: 'WS-POP-01', fields: 48, status: '可查询' },
  { id: 'F-02', lib: '全员人口库', name: '户籍与居住信息', stdCode: 'WS-POP-02', fields: 22, status: '可查询' },
  { id: 'F-03', lib: '电子病历库', name: '门急诊病历', stdCode: 'EMR-C0001', fields: 86, status: '可查询' },
  { id: 'F-04', lib: '电子病历库', name: '住院病案首页', stdCode: 'EMR-C0002', fields: 128, status: '可查询' },
  { id: 'F-05', lib: '健康档案库', name: '个人健康档案封面', stdCode: 'EHR-A01', fields: 36, status: '可查询' },
  { id: 'F-06', lib: '健康档案库', name: '高血压随访', stdCode: 'EHR-B02', fields: 42, status: '建设中' },
];

const themesSeed: ThemeLib[] = [
  { id: 'TH-01', name: '妇幼健康主题库', domain: '妇幼', models: 18, indicators: 86, apis: 12, cover: 90, status: '可用' },
  { id: 'TH-02', name: '基层卫生主题库', domain: '基层', models: 22, indicators: 64, apis: 10, cover: 86, status: '可用' },
  { id: 'TH-03', name: '医院运营主题库', domain: '运营', models: 28, indicators: 128, apis: 24, cover: 92, status: '可用' },
  { id: 'TH-04', name: '疾病预防控制主题库', domain: '疾控', models: 16, indicators: 72, apis: 8, cover: 84, status: '可用' },
  { id: 'TH-05', name: '卫生监督主题库', domain: '监督', models: 12, indicators: 48, apis: 6, cover: 78, status: '建设中' },
  { id: 'TH-06', name: '职业健康主题库', domain: '职健', models: 10, indicators: 36, apis: 4, cover: 72, status: '建设中' },
];

const baseSeed: BaseItem[] = [
  { id: 'BR-01', kind: '机构资源', name: '医疗卫生机构资源目录', items: 42, refs: 1286, status: '已发布', ver: 'V2.1' },
  { id: 'BR-02', kind: '药品目录', name: '国家/院内药品目录', items: 18620, refs: 8642, status: '已发布', ver: 'V3.0' },
  { id: 'BR-03', kind: '诊断目录', name: 'ICD-10 诊断目录', items: 32846, refs: 12420, status: '已发布', ver: 'V2.0' },
  { id: 'BR-04', kind: '收费目录', name: '医疗服务项目目录', items: 4820, refs: 3260, status: '已发布', ver: 'V1.8' },
  { id: 'BR-05', kind: '材料目录', name: '耗材与材料目录', items: 9640, refs: 2140, status: '维护中', ver: 'V1.4' },
  { id: 'BR-06', kind: '数据元字典', name: '平台数据元与值域', items: 1286, refs: 28600, status: '已发布', ver: 'V2.3' },
  { id: 'BR-07', kind: '事件库', name: '业务事件主库', items: 420, refs: 1860, status: '已发布', ver: 'V1.2' },
  { id: 'BR-08', kind: '索引库', name: '主索引与交叉索引', items: 1286420, refs: 42, status: '已发布', ver: 'V1.6' },
  { id: 'BR-09', kind: '交换库', name: '共享交换落地库', items: 86, refs: 28, status: '已发布', ver: 'V1.4' },
];

/** B6 数据资源中心：三大库 · 六大主题 · 基础/交换库 */
export function ResourceCenterHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('three');
  const [activeLib, setActiveLib] = useState<LibItem | null>(threeSeed[0]);
  const [activeTheme, setActiveTheme] = useState<ThemeLib | null>(null);
  const [activeBase, setActiveBase] = useState<BaseItem | null>(null);
  const [activeForm, setActiveForm] = useState<FormRow | null>(null);
  const [fq, setFq] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [bq, setBq] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryOut, setQueryOut] = useState<string | null>(null);

  const formRows = useMemo(() => formsSeed.filter((f) =>
    (!activeLib || f.lib === activeLib.name)
    && (f.name + f.stdCode).toLowerCase().includes(fq.toLowerCase())
  ), [activeLib, fq]);

  const themeRows = useMemo(() => themesSeed.filter((t) =>
    (!themeFilter || t.domain === themeFilter)
  ), [themeFilter]);

  const baseRows = useMemo(() => baseSeed.filter((b) =>
    (b.id + b.name + b.kind).toLowerCase().includes(bq.toLowerCase())
  ), [bq]);

  const threeOk = threeSeed.filter((t) => t.status === '已建库').length;
  const themeOk = themesSeed.filter((t) => t.status === '可用').length;
  const basePub = baseSeed.filter((b) => b.status === '已发布').length;

  const runQuery = async () => {
    if (!activeLib) return;
    setQuerying(true);
    setTab('three');
    await new Promise((r) => setTimeout(r, 800));
    setQueryOut(`${activeLib.name} · 样例查询返回 20 行 · 国标字段对齐 · 耗时 186ms`);
    setQuerying(false);
    notify(`${activeLib.name} 数据可查询 · 模型与国标对齐`);
  };

  const openService = (t: ThemeLib) => {
    notify(`${t.name} 数据服务已打开 · ${t.apis} 个 API 可用`);
    go('/center/marketplace');
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA RESOURCE CENTER · B6"
        title="数据资源中心"
        desc="B6-01 全员人口/电子病历/健康档案 · B6-02 六大业务主题库 · B6-03 基础资源与交换共享库。"
        actions={
          <>
            <Btn icon="fingerprint" onClick={() => go('/bid/main-archive')}>居民主索引</Btn>
            <Btn icon="book" onClick={() => go('/bid/standard-docs')}>数据标准</Btn>
            <Btn icon="store" onClick={() => go('/center/marketplace')}>数据服务</Btn>
            <Btn variant="primary" icon="search" loading={querying} onClick={runQuery}>资源查询</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '三大资源库', d: '国标对齐·可查询' },
          { n: '02', t: '六大主题库', d: '模型·指标·服务' },
          { n: '03', t: '基础/交换库', d: '全平台可引用' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'three' : i === 1 ? 'themes' : 'base') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 三大库 {threeOk}/3 · 主题可用 {themeOk}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="三大资源库" value="3" unit="类" delta={`已建 ${threeOk}`} icon="database" tone="violet" onClick={() => setTab('three')} />
        <StatCard label="六大主题库" value="6" unit="个" delta={`可用 ${themeOk}`} icon="layers" tone="blue" onClick={() => setTab('themes')} />
        <StatCard label="基础目录" value={String(baseSeed.length)} unit="套" delta={`已发布 ${basePub}`} icon="book" tone="cyan" onClick={() => setTab('base')} />
        <StatCard label="表单覆盖" value="168" unit="张" delta="国标对齐" icon="table" tone="green" onClick={() => setTab('three')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'three', label: '三大资源库', count: 3 },
          { key: 'themes', label: '六大主题库', count: 6 },
          { key: 'base', label: '基础 / 交换库', count: baseSeed.length },
        ]}
      />

      {tab === 'three' && (
        <>
          <div className="rc-three-grid mt-14">
            {threeSeed.map((lib) => (
              <button
                key={lib.id}
                type="button"
                className={`rc-three-card ${activeLib?.id === lib.id ? 'is-on' : ''} tone-${lib.status === '已建库' ? 'green' : lib.status === '建设中' ? 'amber' : 'slate'}`}
                onClick={() => { setActiveLib(lib); setQueryOut(null); }}
              >
                <div className="rc-three-head">
                  <strong>{lib.name}</strong>
                  <Badge tone={lib.status === '已建库' ? 'green' : 'amber'}>{lib.status}</Badge>
                </div>
                <small>{lib.std}</small>
                <div className="rc-three-meta">
                  <span>表单 {lib.forms}</span>
                  <span>表 {lib.tables}</span>
                  <span>{lib.rows}</span>
                </div>
                <Progress value={lib.cover} tone={lib.cover >= 90 ? 'green' : 'amber'} height={6} />
                <em>国标覆盖 {lib.cover}%</em>
              </button>
            ))}
          </div>

          {queryOut && (
            <div className="rc-query-out mt-14">
              <Icon name="checkcircle" size={14} />
              <span>{queryOut}</span>
              <Btn size="sm" variant="ghost" onClick={() => go('/center/sql')}>打开查询台</Btn>
            </div>
          )}

          <div className="grid-2-1 mt-14">
            <Card title={activeLib ? `${activeLib.name} · 表单目录` : '表单目录'} subtitle="与国标表单对齐 · 数据可查询" noPad actions={
              <div className="filter-bar">
                <SearchInput value={fq} onChange={setFq} placeholder="搜索表单" width={160} />
                <Btn size="sm" icon="search" loading={querying} onClick={runQuery}>查询</Btn>
              </div>
            }>
              <div className="pad-h">
                <DataTable rows={formRows} pageSize={6} onRowClick={(r) => setActiveForm(r)} columns={[
                  { key: 'stdCode', title: '国标码', width: 100, render: (r) => <span className="mono-cell">{r.stdCode}</span> },
                  { key: 'name', title: '表单', render: (r) => r.name },
                  { key: 'fields', title: '字段', width: 60, align: 'right' },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '可查询' ? 'green' : 'amber'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <Card title="库概况" subtitle={activeLib?.owner || ''}>
              {activeLib && (
                <>
                  <KeyValue cols={1} items={[
                    { label: '对齐标准', value: activeLib.std },
                    { label: '物理表', value: `${activeLib.tables} 张` },
                    { label: '数据量', value: activeLib.rows },
                    { label: '负责人', value: activeLib.owner },
                  ]} />
                  <div className="info-note mt-12"><Icon name="shield" size={13} /><span>模型按国标建设，查询结果自动脱敏，可下钻至湖仓表。</span></div>
                  <div className="row-actions mt-10">
                    <Btn size="sm" icon="table" onClick={() => go('/center/datasets')}>数据集</Btn>
                    <Btn size="sm" icon="layers" onClick={() => go('/collection/lake-layers')}>湖仓分层</Btn>
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {tab === 'themes' && (
        <>
          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <Select value={themeFilter} onChange={setThemeFilter} options={['', '妇幼', '基层', '运营', '疾控', '监督', '职健']} placeholder="全部主题" width={120} />
              <span className="table-note"><Icon name="gauge" size={12} /> 主题模型 · 指标 · 数据服务可用</span>
            </div>
            <div className="pad-h">
              <DataTable rows={themeRows} pageSize={6} onRowClick={(r) => setActiveTheme(r)} columns={[
                { key: 'domain', title: '域', width: 64, render: (r) => <Badge tone="slate">{r.domain}</Badge> },
                { key: 'name', title: '主题库', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id}</small></div> },
                { key: 'models', title: '模型', width: 60, align: 'right' },
                { key: 'indicators', title: '指标', width: 60, align: 'right' },
                { key: 'apis', title: '服务', width: 60, align: 'right' },
                { key: 'cover', title: '覆盖', width: 110, render: (r) => <div className="quality-cell"><Progress value={r.cover} tone={r.cover >= 85 ? 'green' : 'amber'} /><span>{r.cover}%</span></div> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '可用' ? 'green' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 90, render: (r) => (
                  <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); openService(r); }}>服务</button>
                ) },
              ]} />
            </div>
          </Card>
          <div className="rc-theme-grid mt-14">
            {themesSeed.map((t) => (
              <button key={t.id} type="button" className="rc-theme" onClick={() => setActiveTheme(t)}>
                <strong>{t.name}</strong>
                <small>模型 {t.models} · 指标 {t.indicators} · API {t.apis}</small>
                <Progress value={t.cover} height={5} tone={t.status === '可用' ? 'green' : 'amber'} />
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'base' && (
        <>
          <Card className="mt-14" title="基础资源 / 基础信息 / 交换共享库" subtitle="机构·药品·诊断·收费·材料·数据元·事件·索引·交换 · 全平台可引用" noPad actions={
            <SearchInput value={bq} onChange={setBq} placeholder="搜索目录" width={200} />
          }>
            <div className="pad-h">
              <DataTable rows={baseRows} pageSize={8} onRowClick={(r) => setActiveBase(r)} columns={[
                { key: 'kind', title: '类型', width: 90, render: (r) => <Badge tone="slate">{r.kind}</Badge> },
                { key: 'name', title: '资源', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.ver}</small></div> },
                { key: 'items', title: '条目', width: 90, align: 'right', render: (r) => r.items.toLocaleString() },
                { key: 'refs', title: '引用次数', width: 90, align: 'right', render: (r) => r.refs.toLocaleString() },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已发布' ? 'green' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 80, render: (r) => (
                  <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); notify(`${r.name} 已被平台组件引用`); }}>引用</button>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-3 mt-14">
            {[
              { t: '主数据衔接', d: '机构/药品/诊断目录与主数据管理贯通', path: '/center/master-data', icon: 'boxes' },
              { t: '标准字典', d: '数据元字典引用标准管理与值域', path: '/bid/standard-docs', icon: 'braces' },
              { t: '交换共享', d: '交换库对接共享服务与开放 API', path: '/center/marketplace', icon: 'network' },
            ].map((x) => (
              <Card key={x.t} title={x.t} subtitle={x.d}>
                <Btn size="sm" icon={x.icon} onClick={() => go(x.path)}>打开</Btn>
              </Card>
            ))}
          </div>
        </>
      )}

      <Drawer open={!!activeForm} onClose={() => setActiveForm(null)} title={activeForm?.name || ''} desc={activeForm?.stdCode} width={480}
        footer={
          <>
            <Btn onClick={() => setActiveForm(null)}>关闭</Btn>
            <Btn variant="primary" loading={querying} onClick={runQuery}>查询样例</Btn>
          </>
        }
      >
        {activeForm && (
          <KeyValue cols={2} items={[
            { label: '所属库', value: activeForm.lib },
            { label: '字段数', value: String(activeForm.fields) },
            { label: '状态', value: <Badge>{activeForm.status}</Badge> },
            { label: '说明', value: '表单结构与国标字段一一映射，支持样例查询与湖仓下钻。', wide: true },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeTheme} onClose={() => setActiveTheme(null)} title={activeTheme?.name || ''} desc={activeTheme?.domain} width={500}
        footer={
          <>
            <Btn onClick={() => setActiveTheme(null)}>关闭</Btn>
            <Btn icon="gauge" onClick={() => go('/center/indicators')}>指标</Btn>
            {activeTheme && <Btn variant="primary" onClick={() => activeTheme && openService(activeTheme)}>数据服务</Btn>}
          </>
        }
      >
        {activeTheme && (
          <KeyValue cols={2} items={[
            { label: '模型数', value: String(activeTheme.models) },
            { label: '指标数', value: String(activeTheme.indicators) },
            { label: 'API', value: String(activeTheme.apis) },
            { label: '覆盖', value: `${activeTheme.cover}%` },
            { label: '状态', value: <Badge tone={activeTheme.status === '可用' ? 'green' : 'amber'}>{activeTheme.status}</Badge> },
            { label: '能力', value: '主题模型、主题指标、主题数据服务已挂载，可供业务应用订阅。', wide: true },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeBase} onClose={() => setActiveBase(null)} title={activeBase?.name || ''} desc={activeBase?.kind} width={460}
        footer={<><Btn onClick={() => setActiveBase(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('目录引用凭证已生成')}>生成引用</Btn></>}
      >
        {activeBase && (
          <KeyValue cols={2} items={[
            { label: '版本', value: activeBase.ver },
            { label: '条目', value: activeBase.items.toLocaleString() },
            { label: '引用', value: activeBase.refs.toLocaleString() },
            { label: '状态', value: <Badge>{activeBase.status}</Badge> },
          ]} />
        )}
      </Drawer>
    </>
  );
}
