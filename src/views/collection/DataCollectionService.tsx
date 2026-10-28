'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type ModeKey = 'full' | 'incr' | 'unstruct';

type DatasetCat = {
  id: string;
  name: string;
  en: string;
  tables: number;
  covered: number;
  status: string;
  owner: string;
  items: { name: string; tables: number; status: string; priority: string }[];
};

const modes = [
  {
    key: 'full' as ModeKey,
    title: '存量结构化数据采集',
    desc: '数据库备份文件初始化；无备份时用库同步完成存量结构化采集。',
    icon: 'database',
    tone: 'blue',
    methods: ['备份文件恢复入湖', '库表全量同步（只读账号）', '分片并行 + 校验对账'],
    sla: '支持亿级初始化与行数校验',
  },
  {
    key: 'incr' as ModeKey,
    title: '增量结构化数据采集',
    desc: '国产库日志同步实现 T+0；不满足复制条件时用业务时间戳 ETL 兜底。',
    icon: 'zap',
    tone: 'violet',
    methods: ['达梦 / 金仓 / openGauss 日志 CDC', 'binlog / 归档日志复制', '增量时间戳 / 业务主键 ETL'],
    sla: '目标增量延迟 ≤ 5 分钟',
  },
  {
    key: 'unstruct' as ModeKey,
    title: '非结构化数据采集',
    desc: '通过 ETL 完成存量与增量非结构化采集（TXT / PDF 等病历文书）。',
    icon: 'file',
    tone: 'amber',
    methods: ['目录扫描与增量监听', 'PDF / TXT 元数据抽取', '对象存储落湖 + 检索索引'],
    sla: '文件可检索、可调阅、可溯源',
  },
];

const modeJobs = [
  { id: 'JOB-F01', mode: 'full', name: 'HIS 患者库存量初始化', org: '重医附二院', method: '备份文件', progress: 100, status: '已完成', rows: '3,428 万', updated: '08-05 22:10' },
  { id: 'JOB-F02', mode: 'full', name: 'LIS 检验库全量同步', org: '两江医院', method: '库同步', progress: 76, status: '运行中', rows: '1,860 万', updated: '08-06 14:08' },
  { id: 'JOB-I01', mode: 'incr', name: 'EMR 就诊 CDC', org: '渝北人民医院', method: '日志同步', progress: 100, status: '运行中', rows: 'T+0', updated: '08-06 14:20' },
  { id: 'JOB-I02', mode: 'incr', name: '医嘱时间戳 ETL', org: '两江医院', method: '时间戳 ETL', progress: 100, status: '已完成', rows: '每 5 分钟', updated: '08-06 14:15' },
  { id: 'JOB-U01', mode: 'unstruct', name: '门诊病历 PDF 采集', org: '重医附二院', method: '目录增量', progress: 62, status: '运行中', rows: '12.6 万文件', updated: '08-06 13:50' },
  { id: 'JOB-U02', mode: 'unstruct', name: '病程 TXT 文本采集', org: '两江妇幼', method: 'ETL 批处理', progress: 100, status: '已完成', rows: '8.2 万文件', updated: '08-04 18:20' },
];

const datasets: DatasetCat[] = [
  {
    id: 'DS-EMR', name: '医疗电子病历数据集', en: 'EMR Dataset', tables: 128, covered: 102, status: '采集中', owner: '张敏',
    items: [
      { name: '患者基本信息', tables: 6, status: '已覆盖', priority: '高' },
      { name: '门（急）诊信息', tables: 12, status: '已覆盖', priority: '高' },
      { name: '检查检验记录', tables: 18, status: '已覆盖', priority: '高' },
      { name: '住院病案首页', tables: 8, status: '已覆盖', priority: '高' },
      { name: '手术输血记录', tables: 10, status: '部分', priority: '中' },
      { name: '护理评估与计划', tables: 9, status: '部分', priority: '中' },
      { name: '血液透析', tables: 4, status: '未覆盖', priority: '低' },
      { name: '统计信息', tables: 5, status: '已覆盖', priority: '中' },
    ],
  },
  {
    id: 'DS-PH', name: '公卫健康档案数据集', en: 'Public Health', tables: 86, covered: 64, status: '采集中', owner: '李建华',
    items: [
      { name: '个人健康档案', tables: 8, status: '已覆盖', priority: '高' },
      { name: '家庭医生签约', tables: 5, status: '已覆盖', priority: '高' },
      { name: '高血压 / 糖尿病', tables: 12, status: '已覆盖', priority: '高' },
      { name: '预防接种', tables: 6, status: '部分', priority: '中' },
      { name: '传染病及突发公卫', tables: 7, status: '部分', priority: '高' },
      { name: '新冠肺炎管理', tables: 4, status: '未覆盖', priority: '中' },
    ],
  },
  {
    id: 'DS-POP', name: '全员人口数据集', en: 'Population', tables: 18, covered: 14, status: '已覆盖', owner: '陈晓',
    items: [
      { name: '全员人口个案', tables: 10, status: '已覆盖', priority: '高' },
      { name: '妇女生育史', tables: 8, status: '已覆盖', priority: '高' },
    ],
  },
  {
    id: 'DS-DOC', name: '电子病历文书数据集', en: 'Clinical Documents', tables: 36, covered: 22, status: '建设中', owner: '赵倩',
    items: [
      { name: '主诉 / 现病史 TXT', tables: 12, status: '部分', priority: '高' },
      { name: '既往史文本', tables: 6, status: '部分', priority: '中' },
      { name: '病历 PDF 文书', tables: 14, status: '部分', priority: '高' },
      { name: '知情告知扫描件', tables: 4, status: '未覆盖', priority: '中' },
    ],
  },
];

const statusTone = (s: string) => {
  if (['已完成', '已覆盖', '运行中'].includes(s)) return s === '运行中' ? 'blue' : 'green';
  if (['部分', '采集中', '建设中'].includes(s)) return 'amber';
  if (s === '未覆盖' || s === '失败') return 'red';
  return 'slate';
};

/** 数据采集服务总览：流程入口 + ★采集方案配置 */
export function CollectServiceHubPage() {
  const { go, notify } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="DATA COLLECTION SERVICE"
        title="数据采集服务"
        desc="覆盖采集方案配置、存量/增量/非结构化采集，以及电子病历、公卫、人口、文书四类数据集范围管理。"
        actions={
          <>
            <Btn icon="layers" onClick={() => go('/collection/collect-datasets')}>数据集范围</Btn>
            <Btn icon="sliders" onClick={() => go('/collection/collect-modes')}>采集方式</Btn>
            <Btn variant="primary" icon="workflow" onClick={() => go('/collection/collection-wizard')}>★ 采集方案配置</Btn>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="采集方案" value="26" unit="套" delta="本周新增 3" icon="sliders" tone="blue" onClick={() => go('/collection/collection-wizard')} />
        <StatCard label="存量任务" value="12" unit="个" delta="运行中 2" icon="database" tone="green" onClick={() => go('/collection/collect-modes')} />
        <StatCard label="增量通道" value="18" unit="条" delta="T+0 占比 72%" icon="zap" tone="violet" onClick={() => go('/bid/realtime-channel')} />
        <StatCard label="数据集覆盖" value="74.6" unit="%" delta="四类模板" icon="table" tone="amber" onClick={() => go('/collection/collect-datasets')} />
      </div>

      <Card className="mt-14" title="数据采集基本流程" subtitle="选源 → 选方式 → 选数据集 → 试跑入湖">
        <div className="schema-map" style={{ flexWrap: 'wrap', gap: 10 }}>
          {[
            ['1', '授权数据源', () => go('/collection/services')],
            ['2', '★采集方案配置', () => go('/collection/collection-wizard')],
            ['3', '存量 / 增量 / 非结构化', () => go('/collection/collect-modes')],
            ['4', '绑定数据集范围', () => go('/collection/collect-datasets')],
            ['5', '试跑与入湖校验', () => go('/bid/data-preview')],
          ].map(([n, label, fn]) => (
            <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>
              <Badge tone="blue">{n as string}</Badge> {label as string}
            </button>
          ))}
        </div>
        <div className="info-note mt-14">
          <Icon name="sparkles" size={13} />
          <span>招标 ★ 项「采集方案配置」已提供可视化拖拽与真实入仓试跑，可直接演示。</span>
        </div>
      </Card>

      <div className="grid grid-3 mt-14">
        {modes.map((m) => (
          <Card key={m.key} title={m.title} subtitle={m.desc} actions={<Badge tone={m.tone}>{m.key === 'full' ? '存量' : m.key === 'incr' ? '增量' : '非结构化'}</Badge>}>
            <ul className="feed-list">
              {m.methods.map((x) => (
                <li key={x}><span className="feed-ico blue"><Icon name="check" size={12} /></span><div><strong>{x}</strong></div></li>
              ))}
            </ul>
            <div className="row-actions mt-14">
              <Btn size="sm" variant="primary" onClick={() => go(`/collection/collect-modes?mode=${m.key}`)}>查看任务</Btn>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-14" title="四类采集数据集" subtitle="点击进入范围管理" noPad actions={<Btn size="sm" onClick={() => go('/collection/collect-datasets')}>全部数据集</Btn>}>
        <div className="pad-h">
          <DataTable
            rows={datasets}
            pageSize={4}
            paginate={false}
            onRowClick={(r) => go('/collection/collect-datasets')}
            columns={[
              { key: 'name', title: '数据集', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.en}</small></div> },
              { key: 'covered', title: '覆盖', width: 120, render: (r) => <div className="cell-main"><strong>{r.covered}/{r.tables}</strong><div className="coverage-track" style={{ marginTop: 4 }}><i style={{ width: `${Math.round((r.covered / r.tables) * 100)}%`, background: '#6755F5' }} /></div></div> },
              { key: 'status', title: '状态', width: 90, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              { key: 'owner', title: '负责人', width: 80, render: (r) => r.owner },
            ]}
          />
        </div>
      </Card>
    </>
  );
}

/** 存量 / 增量 / 非结构化采集 */
export function CollectModesPage() {
  const { go, notify } = useApp();
  const [mode, setMode] = useState<ModeKey>('full');
  const [open, setOpen] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [seen, setSeen] = useState<Record<ModeKey, boolean>>({ full: true, incr: false, unstruct: false });
  React.useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('mode') as ModeKey | null;
    if (m && modes.some((x) => x.key === m)) { setMode(m); setSeen((s) => ({ ...s, [m]: true })); }
  }, []);
  const current = modes.find((m) => m.key === mode)!;
  const jobs = modeJobs.filter((j) => j.mode === mode);

  const demoAccept = async () => {
    setDemoing(true);
    for (const k of ['full', 'incr', 'unstruct'] as ModeKey[]) {
      setMode(k); setSeen((s) => ({ ...s, [k]: true }));
      notify(k === 'full' ? '① 存量结构化：初始化校验策略' : k === 'incr' ? '② 增量 T+0：延迟≤5 分钟' : '③ 非结构化：文件目录可检索');
      await new Promise((r) => setTimeout(r, 450));
    }
    setMode('incr');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="COLLECTION MODES · A2-02/03/04"
        title="存量 / 增量 / 非结构化采集"
        desc="验收：存量初始化可校验 · 增量延迟≤5 分钟 · 非结构化目录/元数据可检索。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/collection-wizard')}>采集方案</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建采集任务</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '存量结构化', d: '初始化·校验', k: 'full' as ModeKey },
          { n: '02', t: '增量结构化', d: 'T+0 · ≤5min', k: 'incr' as ModeKey },
          { n: '03', t: '非结构化', d: '目录·元数据', k: 'unstruct' as ModeKey },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${mode === s.k || seen[s.k] ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {current.sla}</span>
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={mode}
        onChange={(k) => { const m = k as ModeKey; setMode(m); setSeen((s) => ({ ...s, [m]: true })); }}
        items={modes.map((m) => ({ key: m.key, label: m.key === 'full' ? '存量结构化' : m.key === 'incr' ? '增量结构化' : '非结构化' }))}
      />

      <div className="stat-grid mt-14">
        <StatCard label="当前方式" value={current.key === 'full' ? '存量' : current.key === 'incr' ? '增量' : '文件'} unit="" delta={current.sla} icon={current.icon} tone={current.tone as any} />
        <StatCard label="任务数" value={String(jobs.length)} unit="个" delta={`运行中 ${jobs.filter((j) => j.status === '运行中').length}`} icon="clipboard" tone="blue" />
        <StatCard label="策略要点" value={String(current.methods.length)} unit="项" delta="可演示" icon="list" tone="violet" />
        <StatCard label="关联通道" value={mode === 'incr' ? '18' : mode === 'full' ? '12' : '6'} unit="条" delta="可下钻" icon="cable" tone="green" onClick={() => go(mode === 'incr' ? '/collection/channels' : '/collection/configs')} />
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title={current.title} subtitle={current.desc}>
          <div className="coverage-list">
            {current.methods.map((m, i) => (
              <div key={m}><span>{i + 1}. {m}</span><strong><Icon name="checkcircle" size={14} className="text-green" /></strong><div className="coverage-track"><i style={{ width: `${88 - i * 8}%`, background: '#6755F5' }} /></div></div>
            ))}
          </div>
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>{current.sla}。生产库仅使用只读账号；增量优先日志同步以降低源端压力。</span></div>
        </Card>
        <Card title="推荐路径" subtitle="与现有能力衔接">
          <ul className="feed-list">
            <li><span className="feed-ico blue"><Icon name="workflow" size={13} /></span><div><strong>可视化采集方案</strong><small>拖拽选源、映射、试跑入仓</small></div><button className="link-btn" onClick={() => go('/collection/collection-wizard')}>打开</button></li>
            <li><span className="feed-ico violet"><Icon name="zap" size={13} /></span><div><strong>CDC 同步管理</strong><small>增量通道启停与部署模式</small></div><button className="link-btn" onClick={() => go('/collection/channels')}>打开</button></li>
            <li><span className="feed-ico amber"><Icon name="file" size={13} /></span><div><strong>文书数据集</strong><small>PDF/TXT 范围与覆盖率</small></div><button className="link-btn" onClick={() => go('/collection/collect-datasets')}>打开</button></li>
          </ul>
        </Card>
      </div>

      <Card className="mt-14" title="采集任务" subtitle={`${current.title} · 最近任务`} noPad actions={<Btn size="sm" icon="refresh" onClick={() => notify('任务状态已刷新')}>刷新</Btn>}>
        <div className="pad-h">
          <DataTable
            rows={jobs}
            pageSize={6}
            columns={[
              { key: 'id', title: '任务号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
              { key: 'name', title: '任务名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.method}</small></div> },
              { key: 'org', title: '机构', width: 100, render: (r) => r.org },
              { key: 'progress', title: '进度', width: 120, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.status === '运行中' ? 'blue' : 'green'} /><span>{r.progress}%</span></div> },
              { key: 'rows', title: '规模', width: 90, render: (r) => r.rows },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              { key: 'updated', title: '更新', width: 90, render: (r) => r.updated },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建采集任务"
        desc={`当前方式：${current.title}`}
        width={640}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('采集任务已创建并进入调度队列'); }}>创建任务</Btn></>}
      >
        <div className="form-grid">
          <Field label="任务名称" required className="span-2"><input className="input" placeholder="例如：HIS 患者库存量初始化" /></Field>
          <Field label="采集方式" required>
            <Select
              value={mode === 'full' ? '存量结构化' : mode === 'incr' ? '增量结构化' : '非结构化'}
              onChange={(v) => setMode(v === '存量结构化' ? 'full' : v === '增量结构化' ? 'incr' : 'unstruct')}
              options={['存量结构化', '增量结构化', '非结构化']}
            />
          </Field>
          <Field label="归属机构" required><Select value="重医附二院" onChange={() => {}} options={['重医附二院', '两江医院', '渝北人民医院', '两江疾控']} /></Field>
          {mode === 'full' && (
            <>
              <Field label="初始化方式" required><Select value="备份文件" onChange={() => {}} options={['备份文件', '库表全量同步']} /></Field>
              <Field label="备份/源端"><input className="input" placeholder="/backup/his_20260801.dump 或 his_dm_prod_source" /></Field>
            </>
          )}
          {mode === 'incr' && (
            <>
              <Field label="增量技术" required><Select value="日志同步" onChange={() => {}} options={['日志同步', '时间戳 ETL', '业务主键 ETL']} /></Field>
              <Field label="目标延迟"><Select value="≤5分钟" onChange={() => {}} options={['≤1分钟', '≤5分钟', '≤15分钟']} /></Field>
            </>
          )}
          {mode === 'unstruct' && (
            <>
              <Field label="文件类型" required><Select value="PDF" onChange={() => {}} options={['PDF', 'TXT', 'PDF+TXT']} /></Field>
              <Field label="目录/接口"><input className="input" placeholder="s3://emr-docs/outpatient/ 或 API" /></Field>
            </>
          )}
          <Field label="绑定数据集" className="span-2"><Select value="医疗电子病历数据集" onChange={() => {}} options={datasets.map((d) => d.name)} /></Field>
        </div>
      </Modal>
    </>
  );
}

/** 四类采集数据集范围 */
export function CollectDatasetsPage() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<DatasetCat | null>(datasets[0]);
  const [open, setOpen] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set([datasets[0]?.name || '']));
  const [exported, setExported] = useState(false);

  const rows = useMemo(() => datasets.filter((d) => (d.name + d.en).toLowerCase().includes(q.toLowerCase())), [q]);
  const detailItems = useMemo(() => {
    if (!active) return [];
    return active.items.filter((i) => (i.name).toLowerCase().includes(q.toLowerCase()) || !q);
  }, [active, q]);

  const totalTables = datasets.reduce((a, d) => a + d.tables, 0);
  const totalCovered = datasets.reduce((a, d) => a + d.covered, 0);

  const demoAccept = async () => {
    setDemoing(true);
    for (const d of datasets) {
      setActive(d);
      setVisited((v) => new Set(v).add(d.name));
      notify(`覆盖数据集：${d.name}`);
      await new Promise((r) => setTimeout(r, 350));
    }
    setExported(true);
    notify('四类数据集模板与校验规则已落地 · 范围清单可导出');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="COLLECTION DATASETS · A2-05"
        title="采集数据集管理"
        desc="验收：电子病历 / 公卫 / 全员人口 / 文书四类数据集模板与校验规则落地。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="download" onClick={() => { setExported(true); notify('数据集范围清单已导出'); }}>导出范围</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>登记缺项表</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {datasets.slice(0, 4).map((d, i) => (
          <React.Fragment key={d.name}>
            <div className={`qc-accept-step ${active?.name === d.name || visited.has(d.name) ? 'is-on' : ''}`}>
              <em>{String(i + 1).padStart(2, '0')}</em>
              <strong>{d.name.replace(/数据集|采集/, '').slice(0, 8)}</strong>
              <small>{d.covered}/{d.tables} 表</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {exported ? '范围已导出' : `覆盖 ${visited.size}/4 类`}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="数据集" value="4" unit="类" delta="招标全覆盖" icon="boxes" tone="blue" />
        <StatCard label="标准表项" value={String(totalTables)} unit="张" delta={`已覆盖 ${totalCovered}`} icon="table" tone="violet" />
        <StatCard label="整体覆盖率" value={String(Math.round((totalCovered / totalTables) * 1000) / 10)} unit="%" delta="+3.2% 本月" icon="gauge" tone="green" />
        <StatCard label="未覆盖高优" value="6" unit="项" delta="需排期" icon="circlealert" tone="amber" />
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="数据集目录" subtitle="选择类别查看明细表范围" noPad
          actions={<SearchInput value={q} onChange={setQ} placeholder="搜索数据集" width={180} />}
        >
          <div className="pad-h">
            <DataTable
              rows={rows}
              pageSize={4}
              paginate={false}
              onRowClick={(r) => setActive(r)}
              columns={[
                { key: 'name', title: '数据集', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.en}</small></div> },
                { key: 'rate', title: '覆盖率', width: 100, render: (r) => `${Math.round((r.covered / r.tables) * 100)}%` },
                { key: 'status', title: '状态', width: 90, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              ]}
            />
          </div>
        </Card>
        <Card title="范围摘要" subtitle={active?.name}>
          {active && (
            <>
              <KeyValue
                cols={2}
                items={[
                  { label: '表项总数', value: active.tables },
                  { label: '已覆盖', value: active.covered },
                  { label: '负责人', value: active.owner },
                  { label: '状态', value: <Badge tone={statusTone(active.status)}>{active.status}</Badge> },
                ]}
              />
              <div className="mt-14">
                <div className="resource-head"><span>覆盖进度</span><strong>{Math.round((active.covered / active.tables) * 100)}%</strong></div>
                <Progress value={Math.round((active.covered / active.tables) * 100)} tone="blue" height={8} />
              </div>
              <div className="row-actions mt-14">
                <Btn size="sm" onClick={() => go('/collection/collection-wizard')}>按此集生成方案</Btn>
                <Btn size="sm" onClick={() => notify('已生成采集校验规则包')}>校验规则</Btn>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="mt-14" title={active ? `${active.name} · 明细范围` : '明细范围'} subtitle="对齐招标采集范围条目" noPad
        actions={<Btn size="sm" icon="workflow" onClick={() => go('/collection/collection-wizard')}>采集方案配置</Btn>}
      >
        <div className="pad-h">
          <DataTable
            rows={detailItems}
            pageSize={8}
            columns={[
              { key: 'name', title: '业务范围', render: (r) => <strong>{r.name}</strong> },
              { key: 'tables', title: '关联表', width: 80, align: 'right', render: (r) => r.tables },
              { key: 'priority', title: '优先级', width: 80, render: (r) => <Badge tone={r.priority === '高' ? 'red' : r.priority === '中' ? 'amber' : 'slate'}>{r.priority}</Badge> },
              { key: 'status', title: '覆盖状态', width: 90, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              {
                key: 'ops', title: '操作', width: 140,
                render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => notify(`已打开 ${r.name} 表清单`, 'info')}>表清单</button>
                    {r.status !== '已覆盖' && <button className="link-btn" onClick={() => go('/collection/collect-modes')}>安排采集</button>}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <div className="info-note mt-14">
        <Icon name="book" size={13} />
        <span>
          电子病历含门急诊、住院、检验检查、病案首页等全套表；公卫含家医签约、慢病、传染病等；人口含个案与生育史；文书支持 TXT 字段与 PDF 文件双轨采集。
        </span>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="登记业务缺项表"
        desc="机构未开展对应业务时可登记，免除该表采集考核。"
        width={560}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('缺项表已登记'); }}>提交</Btn></>}
      >
        <div className="form-grid">
          <Field label="数据集" required><Select value={active?.name || datasets[0].name} onChange={() => {}} options={datasets.map((d) => d.name)} /></Field>
          <Field label="机构" required><Select value="两江疾控" onChange={() => {}} options={['重医附二院', '两江医院', '两江疾控', '两江妇幼']} /></Field>
          <Field label="缺项范围" className="span-2" required><input className="input" placeholder="例如：血液透析 / 新冠肺炎管理" /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="未开展原因与佐证材料编号" /></Field>
        </div>
      </Modal>
    </>
  );
}
