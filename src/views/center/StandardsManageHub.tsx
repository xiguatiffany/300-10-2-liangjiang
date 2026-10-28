'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BarList } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { standardElements, valueDomains } from '../../data';
import { standardDocs } from '../../dataBid';

type TabKey = 'docs' | 'elements' | 'mapping';

type MapRow = {
  id: string;
  domain: '药品' | '检验' | '检查' | '诊断' | '手术';
  srcCode: string;
  srcName: string;
  stdCode: string;
  stdName: string;
  mode: '自动' | '人工';
  conf: number;
  status: '已生效' | '待确认' | '冲突';
};

const mapSeed: MapRow[] = [
  { id: 'MP-01', domain: '诊断', srcCode: 'I10.x00', srcName: '原发性高血压', stdCode: 'I10.x00x001', stdName: '原发性高血压', mode: '自动', conf: 98, status: '已生效' },
  { id: 'MP-02', domain: '检验', srcCode: 'GLU', srcName: '血糖', stdCode: '2345-7', stdName: 'Glucose [Mass/volume] in Serum', mode: '自动', conf: 94, status: '已生效' },
  { id: 'MP-03', domain: '药品', srcCode: 'YP8821', srcName: '阿司匹林肠溶片 100mg', stdCode: 'XJ01CA04', stdName: '阿司匹林肠溶片', mode: '人工', conf: 86, status: '待确认' },
  { id: 'MP-04', domain: '手术', srcCode: '87.4401', srcName: '胸部CT', stdCode: '87.4100', stdName: '胸部CT检查', mode: '自动', conf: 91, status: '已生效' },
  { id: 'MP-05', domain: '检查', srcCode: 'US-ABD', srcName: '腹部彩超', stdCode: 'US.ABD.01', stdName: '腹部超声检查', mode: '人工', conf: 78, status: '待确认' },
  { id: 'MP-06', domain: '诊断', srcCode: 'E11.9', srcName: '2型糖尿病', stdCode: 'E11.900', stdName: '2型糖尿病', mode: '自动', conf: 97, status: '已生效' },
  { id: 'MP-07', domain: '药品', srcCode: 'YP1102', srcName: '二甲双胍片', stdCode: 'XA10BA02', stdName: '盐酸二甲双胍片', mode: '自动', conf: 88, status: '冲突' },
  { id: 'MP-08', domain: '检验', srcCode: 'HbA1c', srcName: '糖化血红蛋白', stdCode: '4548-4', stdName: 'Hemoglobin A1c', mode: '自动', conf: 96, status: '已生效' },
];

const datasetsLite = [
  { id: 'DS-OP', name: '门诊就诊数据集', elems: 86, status: '已发布', ver: 'V2.1' },
  { id: 'DS-IP', name: '住院病案数据集', elems: 128, status: '已发布', ver: 'V1.8' },
  { id: 'DS-LAB', name: '检验报告数据集', elems: 42, status: '已发布', ver: 'V1.4' },
  { id: 'DS-PH', name: '公卫随访数据集', elems: 64, status: '草稿', ver: 'V0.9' },
];

const versionsOf = (name: string) => [
  { ver: 'V2.3', at: '2026-08-01', note: '一期升级修订 · 采集时效条款' },
  { ver: 'V2.2', at: '2026-06-12', note: '补充共享交换字段' },
  { ver: 'V2.1', at: '2026-03-20', note: '对齐国标批次' },
].map((v) => ({ ...v, name }));

/** B1 数据标准管理：文档 · 数据元/字典/数据集 · 交换对照 */
export function StandardsManageHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('docs');
  const [docs, setDocs] = useState(standardDocs);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeDoc, setActiveDoc] = useState<typeof standardDocs[0] | null>(null);
  const [upload, setUpload] = useState(false);
  const [showVer, setShowVer] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [eq, setEq] = useState('');
  const [estatus, setEstatus] = useState('');
  const [selectedEl, setSelectedEl] = useState<typeof standardElements[0] | null>(null);
  const [newEl, setNewEl] = useState(false);
  const [elements, setElements] = useState(standardElements);

  const [maps, setMaps] = useState(mapSeed);
  const [mq, setMq] = useState('');
  const [mdomain, setMdomain] = useState('');
  const [activeMap, setActiveMap] = useState<MapRow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);

  const docRows = useMemo(() => docs.filter((d) =>
    (!typeFilter || d.type === typeFilter)
    && (d.name + d.type + d.id).includes(q)
  ), [docs, q, typeFilter]);

  const elRows = useMemo(() => elements.filter((r) =>
    (!estatus || r.status === estatus)
    && (r.name + r.code + r.en).toLowerCase().includes(eq.toLowerCase())
  ), [elements, eq, estatus]);

  const mapRows = useMemo(() => maps.filter((m) =>
    (!mdomain || m.domain === mdomain)
    && (m.srcCode + m.srcName + m.stdCode + m.stdName).toLowerCase().includes(mq.toLowerCase())
  ), [maps, mq, mdomain]);

  const publishedDocs = docs.filter((d) => d.status === '已发布').length;
  const pendingDocs = docs.filter((d) => d.status === '审核中').length;
  const publishedEls = elements.filter((e) => e.status === '已发布').length;
  const mapDone = maps.filter((m) => m.status === '已生效').length;
  const mapPending = maps.filter((m) => m.status === '待确认').length;

  const publishDoc = async () => {
    if (!activeDoc) return;
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 700));
    setDocs((arr) => arr.map((d) => d.id === activeDoc.id ? { ...d, status: '已发布', updated: '2026-08-06' } : d));
    setActiveDoc((d) => d ? { ...d, status: '已发布', updated: '2026-08-06' } : d);
    setPublishing(false);
    notify(`${activeDoc.name} 已发布 · 版本受控可引用`);
  };

  const downloadDoc = (name: string) => {
    notify(`《${name}》下载已开始（登录权限校验通过）`);
  };

  const runAutoMatch = async () => {
    setAutoMatching(true);
    setTab('mapping');
    await new Promise((r) => setTimeout(r, 900));
    setMaps((arr) => arr.map((m) =>
      m.status === '待确认' && m.conf >= 85
        ? { ...m, mode: '自动' as const, status: '已生效' as const, conf: Math.min(99, m.conf + 3) }
        : m
    ));
    setAutoMatching(false);
    notify('自动匹配完成：高置信条目已生效，低置信保留人工确认');
  };

  const syncNational = async () => {
    setSyncing(true);
    setTab('mapping');
    await new Promise((r) => setTimeout(r, 1000));
    setSyncing(false);
    notify('国标批次同步完成：ICD / 药品 / LOINC 增量已入库，对照可生效');
  };

  const confirmMap = (row: MapRow) => {
    setMaps((arr) => arr.map((m) => m.id === row.id ? { ...m, status: '已生效', mode: '人工' } : m));
    setActiveMap((m) => m && m.id === row.id ? { ...m, status: '已生效', mode: '人工' } : m);
    notify(`${row.srcName} → ${row.stdName} 人工确认已生效`);
  };

  const publishElement = () => {
    if (!selectedEl) return;
    setElements((arr) => arr.map((e) => e.code === selectedEl.code ? { ...e, status: '已发布' } : e));
    setSelectedEl((e) => e ? { ...e, status: '已发布' } : e);
    notify(`${selectedEl.name} 已发布，可供业务系统与数据集引用`);
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA STANDARDS · B1"
        title="数据标准管理"
        desc="B1-01 数据元/字典/数据集 · B1-02 标准文档入库/版本/下载 · B1-03 交换标准与标准对照。"
        actions={
          <>
            <Btn icon="link" onClick={() => go('/collection/dict-bridge')}>字典贯通</Btn>
            <Btn icon="braces" onClick={() => go('/collection/code-mapping')}>对码方案</Btn>
            <Btn icon="refresh" loading={syncing} onClick={syncNational}>同步国标</Btn>
            <Btn variant="primary" icon="upload" onClick={() => { setTab('docs'); setUpload(true); }}>新增标准</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '标准文档', d: '入库·版本·下载·权限' },
          { n: '02', t: '数据元字典', d: '发布·引用·版本' },
          { n: '03', t: '交换对照', d: '自动+人工·同步生效' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'docs' : i === 1 ? 'elements' : 'mapping') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 12 类 · 对照生效 {mapDone}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="标准文档" value={String(docs.length)} unit="类" delta={`已发布 ${publishedDocs}`} icon="file" tone="blue" onClick={() => setTab('docs')} />
        <StatCard label="数据元" value={String(elements.length)} unit="样例" delta={`已发布 ${publishedEls}`} icon="book" tone="violet" onClick={() => setTab('elements')} />
        <StatCard label="值域字典" value={String(valueDomains.length)} unit="套样例" delta="生产 186 套" icon="braces" tone="cyan" onClick={() => setTab('elements')} />
        <StatCard label="对照生效" value={String(mapDone)} unit="条" delta={`待确认 ${mapPending}`} icon="link" tone="green" onClick={() => setTab('mapping')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'docs', label: '标准文档管理', count: docs.length },
          { key: 'elements', label: '数据元 / 字典 / 数据集', count: elements.length },
          { key: 'mapping', label: '交换标准与对照', count: maps.length },
        ]}
      />

      {tab === 'docs' && (
        <>
          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <div className="filter-bar">
                <SearchInput value={q} onChange={setQ} placeholder="搜索标准名称或类型" width={250} />
                <Select value={typeFilter} onChange={setTypeFilter} options={['', '总体标准', '业务标准', '技术标准', '管理标准']} placeholder="全部类型" width={120} />
              </div>
              <span className="table-note"><Icon name="shield" size={12} /> 版本受控 · 下载需登录 · 待审 {pendingDocs}</span>
            </div>
            <div className="pad-h">
              <DataTable rows={docRows} pageSize={8} onRowClick={(r) => setActiveDoc(r)} columns={[
                { key: 'id', title: '编号', width: 78, render: (d) => <span className="mono-cell">{d.id}</span> },
                { key: 'name', title: '标准名称', render: (d) => <div className="cell-main"><strong>{d.name}</strong><small>{d.type} · {d.pages} 页</small></div> },
                { key: 'version', title: '版本', width: 70, render: (d) => <Badge tone="slate">{d.version}</Badge> },
                { key: 'status', title: '状态', width: 80, render: (d) => <Badge dot tone={d.status === '已发布' ? 'green' : 'amber'}>{d.status}</Badge> },
                { key: 'owner', title: '归口部门', width: 100 },
                { key: 'updated', title: '更新', width: 100, render: (d) => <span className="muted">{d.updated}</span> },
                { key: 'ops', title: '操作', width: 160, render: (d) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="link-btn" onClick={() => setActiveDoc(d)}>预览</button>
                    <button type="button" className="link-muted" onClick={() => downloadDoc(d.name)}>下载</button>
                    <button type="button" className="link-muted" onClick={() => { setActiveDoc(d); setShowVer(true); }}>版本</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>

          <div className="grid grid-3 mt-14">
            <Card title="标准体系" subtitle="总体 / 业务 / 技术 / 管理">
              <div className="std-cat-list">
                {[['总体标准', 1, '#6755F5'], ['业务标准', 3, '#9587FF'], ['技术标准', 6, '#0891B2'], ['管理标准', 2, '#F59E0B']].map(([l, n, c]) => (
                  <div key={l as string}>
                    <span><i style={{ background: c as string }} />{l}</span>
                    <strong>{n} 类</strong>
                    <div className="mini-track"><i style={{ width: `${(n as number) / 6 * 100}%`, background: c as string }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="最近更新" subtitle="版本变更">
              <div className="exec-history">
                {[['数据采集规范', 'V2.3', '08-01'], ['数据归集标准', 'V1.2', '08-05'], ['业务编码标准', 'V2.0', '07-25']].map(([n, v, d]) => (
                  <div key={n}><span className="status-dot tone-blue" /><div><strong>{n} · {v}</strong><small>{d} · 标准修订</small></div></div>
                ))}
              </div>
            </Card>
            <Card title="标准使用" subtitle="近 30 天">
              <div className="std-usage">
                <strong>1,286</strong>
                <span>次下载 · 42 家机构</span>
                <BarList items={[{ label: '技术要求', value: 86 }, { label: '数据元', value: 64 }, { label: '接口规范', value: 48 }]} color="#0891B2" />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'elements' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="数据元目录" subtitle="统一定义 · 可发布 · 可引用 · 可版本" noPad actions={
              <div className="filter-bar">
                <SearchInput value={eq} onChange={setEq} placeholder="搜索数据元" width={160} />
                <Select value={estatus} onChange={setEstatus} options={['', '已发布', '草稿']} placeholder="状态" width={90} />
                <Btn size="sm" icon="plus" onClick={() => setNewEl(true)}>新建</Btn>
              </div>
            }>
              <div className="pad-h">
                <DataTable rows={elRows} pageSize={8} onRowClick={(r) => setSelectedEl(r)} columns={[
                  { key: 'code', title: '编码', width: 110, render: (r) => <span className="mono-cell">{r.code}</span> },
                  { key: 'name', title: '数据元', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.en}</small></div> },
                  { key: 'type', title: '类型', width: 72, render: (r) => <span className="tag">{r.type}</span> },
                  { key: 'domain', title: '值域', width: 130, render: (r) => <span className="muted">{r.domain}</span> },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '已发布' ? 'green' : 'amber'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <div className="stack">
              <Card title="值域字典" subtitle="跨系统同源同码" actions={<Btn size="sm" icon="arrowright" onClick={() => go('/center/domains')}>全部</Btn>}>
                <div className="sm-domain-list">
                  {valueDomains.slice(0, 5).map((d) => (
                    <div key={d.code}>
                      <strong>{d.name}</strong>
                      <small>{d.std} · {d.count.toLocaleString()} 项 · {d.version}</small>
                      <Badge tone="green" dot>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="数据集目录" subtitle="数据元组合配置">
                <div className="sm-ds-list">
                  {datasetsLite.map((d) => (
                    <div key={d.id} className="sm-ds">
                      <div>
                        <strong>{d.name}</strong>
                        <small>{d.id} · {d.elems} 个数据元 · {d.ver}</small>
                      </div>
                      <Badge tone={d.status === '已发布' ? 'green' : 'amber'}>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
          <Card className="mt-14" title="标准覆盖" subtitle="按业务域">
            <div className="coverage-list">
              {[['患者主数据', 96, '#6755F5'], ['就诊与医嘱', 92, '#9587FF'], ['检验检查', 88, '#0891B2'], ['手术与病案', 84, '#10B981'], ['运营财务', 72, '#F59E0B']].map(([l, v, c]) => (
                <div key={l as string}><span>{l}</span><strong>{v}%</strong><div className="coverage-track"><i style={{ width: `${v}%`, background: c as string }} /></div></div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'mapping' && (
        <>
          <Card className="mt-14" title="交换标准与对照" subtitle="药品 / 检验 / 检查 / 诊断 / 手术 · 自动匹配 + 人工确认" actions={
            <>
              <Btn size="sm" icon="sparkles" loading={autoMatching} onClick={runAutoMatch}>自动匹配</Btn>
              <Btn size="sm" icon="refresh" loading={syncing} onClick={syncNational}>国标同步</Btn>
            </>
          }>
            <div className="sm-map-hero">
              <div>
                <span>对照进度</span>
                <strong>{Math.round((mapDone / maps.length) * 100)}%</strong>
                <Progress value={(mapDone / maps.length) * 100} tone="green" height={8} />
                <small>已生效 {mapDone} · 待确认 {mapPending} · 冲突 {maps.filter((m) => m.status === '冲突').length}</small>
              </div>
              <div className="sm-map-modes">
                {[['自动匹配', maps.filter((m) => m.mode === '自动').length, 'violet'], ['人工匹配', maps.filter((m) => m.mode === '人工').length, 'blue'], ['待生效', mapPending, 'amber']].map(([l, n, t]) => (
                  <div key={l as string} className={`sm-mode tone-${t}`}>
                    <strong>{n}</strong>
                    <small>{l}</small>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="mt-14" noPad>
            <div className="meta-toolbar">
              <div className="filter-bar">
                <SearchInput value={mq} onChange={setMq} placeholder="搜索源码/标准码" width={220} />
                <Select value={mdomain} onChange={setMdomain} options={['', '药品', '检验', '检查', '诊断', '手术']} placeholder="全部域" width={100} />
              </div>
              <span className="table-note"><Icon name="checkcircle" size={12} /> 更新后可即时生效</span>
            </div>
            <div className="pad-h">
              <DataTable rows={mapRows} pageSize={8} onRowClick={(r) => setActiveMap(r)} columns={[
                { key: 'domain', title: '域', width: 64, render: (r) => <Badge tone="slate">{r.domain}</Badge> },
                { key: 'src', title: '源编码 / 名称', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.srcCode}</strong><small>{r.srcName}</small></div> },
                { key: 'std', title: '标准编码 / 名称', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.stdCode}</strong><small>{r.stdName}</small></div> },
                { key: 'mode', title: '方式', width: 64, render: (r) => <Badge tone={r.mode === '自动' ? 'violet' : 'blue'}>{r.mode}</Badge> },
                { key: 'conf', title: '置信', width: 90, render: (r) => <div className="quality-cell"><Progress value={r.conf} tone={r.conf >= 90 ? 'green' : 'amber'} /><span>{r.conf}%</span></div> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '已生效' ? 'green' : r.status === '冲突' ? 'red' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 90, render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    {r.status !== '已生效' ? (
                      <button type="button" className="link-btn" onClick={() => confirmMap(r)}>确认</button>
                    ) : (
                      <button type="button" className="link-muted" onClick={() => setActiveMap(r)}>详情</button>
                    )}
                  </div>
                ) },
              ]} />
            </div>
          </Card>

          <div className="grid grid-2 mt-14">
            <Card title="共享交换模板" subtitle="交换表目录">
              <div className="sm-xchg-list">
                {[
                  { name: '居民基本信息交换包', tables: 6, std: 'STD-08 V1.4' },
                  { name: '诊疗事件交换包', tables: 12, std: 'STD-08 V1.4' },
                  { name: '检验结果交换包', tables: 4, std: 'STD-09 V1.0' },
                  { name: '公卫随访交换包', tables: 8, std: 'STD-07 V2.3' },
                ].map((x) => (
                  <div key={x.name} className="sm-xchg">
                    <Icon name="network" size={14} />
                    <div><strong>{x.name}</strong><small>{x.tables} 张交换表 · {x.std}</small></div>
                    <Btn size="sm" variant="ghost" icon="download" onClick={() => notify(`${x.name} 模板已下载`)}>下载</Btn>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="国标更新" subtitle="最近同步批次">
              <div className="exec-history">
                {[
                  ['ICD-10 国临版 2.0', '诊断', '08-01', '成功'],
                  ['国家药品编码增量', '药品', '07-28', '成功'],
                  ['LOINC 映射包', '检验', '07-18', '成功'],
                  ['手术操作编码补丁', '手术', '07-10', '部分冲突'],
                ].map(([n, d, t, s]) => (
                  <div key={n as string}>
                    <span className={`status-dot tone-${s === '成功' ? 'green' : 'amber'}`} />
                    <div><strong>{n}</strong><small>{d} · {t} · {s}</small></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <Drawer
        open={!!activeDoc}
        onClose={() => { setActiveDoc(null); setShowVer(false); }}
        width={640}
        title={activeDoc?.name || ''}
        desc={activeDoc ? `${activeDoc.id} · ${activeDoc.type} · ${activeDoc.version}` : ''}
        footer={
          <>
            <Btn onClick={() => { setActiveDoc(null); setShowVer(false); }}>关闭</Btn>
            <Btn icon="git" onClick={() => setShowVer((v) => !v)}>{showVer ? '预览' : '版本'}</Btn>
            <Btn icon="download" onClick={() => activeDoc && downloadDoc(activeDoc.name)}>下载</Btn>
            {activeDoc?.status !== '已发布' ? (
              <Btn variant="primary" loading={publishing} onClick={publishDoc}>发布</Btn>
            ) : (
              <Btn variant="primary" onClick={() => notify('标准文档已进入修订流程', 'info')}>修订</Btn>
            )}
          </>
        }
      >
        {activeDoc && (
          <>
            {!showVer ? (
              <div className="std-doc-preview">
                <div className="std-doc-page">
                  <div className="std-page-head">两江新区卫生健康标准规范体系</div>
                  <h3>{activeDoc.name}</h3>
                  <p>Standard Specification · {activeDoc.version}</p>
                  <div className="std-page-lines">{Array.from({ length: 10 }).map((_, i) => <i key={i} style={{ width: `${60 + (i * 7) % 35}%` }} />)}</div>
                  <div className="std-page-seal">两江新区<br />数据治理办</div>
                </div>
              </div>
            ) : (
              <div className="sm-ver-list">
                {versionsOf(activeDoc.name).map((v) => (
                  <div key={v.ver} className={v.ver === activeDoc.version ? 'is-cur' : ''}>
                    <Badge tone={v.ver === activeDoc.version ? 'green' : 'slate'}>{v.ver}</Badge>
                    <div><strong>{v.at}</strong><small>{v.note}</small></div>
                    {v.ver === activeDoc.version && <em>当前</em>}
                  </div>
                ))}
              </div>
            )}
            <KeyValue className="mt-14" cols={2} items={[
              { label: '标准编号', value: activeDoc.id },
              { label: '版本', value: activeDoc.version },
              { label: '归口部门', value: activeDoc.owner },
              { label: '更新时间', value: activeDoc.updated },
              { label: '页数', value: `${activeDoc.pages} 页` },
              { label: '状态', value: <Badge tone={activeDoc.status === '已发布' ? 'green' : 'amber'}>{activeDoc.status}</Badge> },
            ]} />
            <div className="info-note mt-14"><Icon name="shield" size={13} /><span>标准文档受版本控制，下载与修订均记录审计日志，未授权不可导出。</span></div>
          </>
        )}
      </Drawer>

      <Drawer
        open={!!selectedEl}
        onClose={() => setSelectedEl(null)}
        title={selectedEl?.name || ''}
        desc={selectedEl ? `${selectedEl.code} · ${selectedEl.en}` : ''}
        width={560}
        footer={
          <>
            <Btn onClick={() => setSelectedEl(null)}>关闭</Btn>
            {selectedEl?.status !== '已发布' && <Btn variant="primary" onClick={publishElement}>发布</Btn>}
            {selectedEl?.status === '已发布' && <Btn variant="primary" onClick={() => notify('数据元已进入编辑审核', 'info')}>修订</Btn>}
          </>
        }
      >
        {selectedEl && (
          <>
            <KeyValue cols={2} items={[
              { label: '标准编码', value: <span className="mono">{selectedEl.code}</span> },
              { label: '数据类型', value: selectedEl.type + (selectedEl.length !== '-' ? `(${selectedEl.length})` : '') },
              { label: '值域', value: selectedEl.domain },
              { label: '来源', value: selectedEl.source },
              { label: '状态', value: <Badge tone={selectedEl.status === '已发布' ? 'green' : 'amber'} dot>{selectedEl.status}</Badge> },
              { label: '版本', value: 'V2.1' },
            ]} />
            <div className="divider-h" />
            <div className="section-title-sm">引用情况</div>
            <div className="coverage-list mt-10">
              {[['HIS 业务库', 86, '#6755F5'], ['EMR 病历库', 42, '#9587FF'], ['CDR 临床库', 28, '#0891B2']].map(([l, v, c]) => (
                <div key={l as string}><span>{l}</span><strong>{v} 个字段</strong><div className="coverage-track"><i style={{ width: `${v}%`, background: c as string }} /></div></div>
              ))}
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        open={!!activeMap}
        onClose={() => setActiveMap(null)}
        title={activeMap ? `${activeMap.srcName} → ${activeMap.stdName}` : ''}
        desc={activeMap ? `${activeMap.domain} · ${activeMap.mode} · 置信 ${activeMap.conf}%` : ''}
        width={520}
        footer={
          <>
            <Btn onClick={() => setActiveMap(null)}>关闭</Btn>
            {activeMap && activeMap.status !== '已生效' && (
              <Btn variant="primary" onClick={() => activeMap && confirmMap(activeMap)}>人工确认生效</Btn>
            )}
          </>
        }
      >
        {activeMap && (
          <KeyValue cols={1} items={[
            { label: '源编码', value: <span className="mono">{activeMap.srcCode}</span> },
            { label: '标准编码', value: <span className="mono">{activeMap.stdCode}</span> },
            { label: '匹配方式', value: activeMap.mode },
            { label: '置信度', value: `${activeMap.conf}%` },
            { label: '状态', value: <Badge tone={activeMap.status === '已生效' ? 'green' : activeMap.status === '冲突' ? 'red' : 'amber'}>{activeMap.status}</Badge> },
            { label: '说明', value: activeMap.status === '冲突' ? '存在多候选标准码，需人工裁定后生效。' : '对照更新后即时下发至标化任务与交换通道。' },
          ]} />
        )}
      </Drawer>

      <Modal
        open={upload}
        onClose={() => setUpload(false)}
        title="新增标准文档"
        desc="支持手工录入与文件导入，提交后进入审核；发布后可下载引用。"
        width={560}
        footer={
          <>
            <Btn onClick={() => setUpload(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `STD-${String(docs.length + 1).padStart(2, '0')}`;
              const row = { id, name: '新建卫生健康标准（待命名）', type: '技术标准', version: 'V1.0', status: '审核中', owner: '数据治理办', updated: '2026-08-06', pages: 24 };
              setDocs((arr) => [...arr, row]);
              setUpload(false);
              setActiveDoc(row);
              notify('标准文档已入库并提交审核');
            }}>提交审核</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="标准名称" required className="span-2"><input className="input" placeholder="例如：数据共享交换信息标准" /></Field>
          <Field label="标准类型"><Select value="技术标准" onChange={() => {}} options={['总体标准', '业务标准', '技术标准', '管理标准']} /></Field>
          <Field label="版本号"><input className="input" defaultValue="V1.0" /></Field>
          <Field label="归口部门"><Select value="数据治理办" onChange={() => {}} options={['数据治理办', '信息中心', '卫健委', '项目管理办']} /></Field>
          <Field label="文件"><div className="upload-box small"><Icon name="uploadcloud" size={16} /><strong>上传 PDF / Word</strong><span>≤ 50MB</span></div></Field>
        </div>
      </Modal>

      <Modal
        open={newEl}
        onClose={() => setNewEl(false)}
        title="新建数据元"
        desc="定义统一数据元标准，发布后可供数据集与业务系统引用。"
        width={620}
        footer={
          <>
            <Btn onClick={() => setNewEl(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const code = `DE-NEW-${String(elements.length + 1).padStart(3, '0')}`;
              const row = { code, name: '新建数据元', en: 'New Element', type: '字符型', length: '32', domain: '待配置', source: '通用', status: '草稿' as const };
              setElements((arr) => [...arr, row]);
              setNewEl(false);
              setSelectedEl(row);
              notify('数据元已创建（草稿），可发布后引用');
            }}>创建</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="数据元名称" required><input className="input" placeholder="例如：患者标识" /></Field>
          <Field label="英文名称" required><input className="input" placeholder="Patient ID" /></Field>
          <Field label="标准编码" required><input className="input" placeholder="DE-PAT-001" /></Field>
          <Field label="数据类型" required><Select value="字符型" onChange={() => {}} options={['字符型', '数值型', '日期型', '日期时间', '布尔型']} /></Field>
          <Field label="值域字典" className="span-2"><Select value="" onChange={() => {}} options={valueDomains.map((d) => d.name)} placeholder="请选择值域" /></Field>
        </div>
      </Modal>
    </>
  );
}
