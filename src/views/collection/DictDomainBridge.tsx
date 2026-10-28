'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { standardElements, valueDomains } from '../../data';

type BridgeRow = {
  id: string;
  lakeField: string;
  lakeTable: string;
  element: string;
  domain: string;
  attr: string;
  combo: string;
  deps: number;
  sync: '已贯通' | '部分' | '待对齐' | '冲突';
  side: string;
  updated: string;
};

type RelNode = {
  id: string;
  name: string;
  kind: '数据元' | '值域' | '组合' | '依赖表';
  side: '中台标准' | '湖仓元数据';
  version: string;
  status: string;
};

const bridges: BridgeRow[] = [
  { id: 'BR-01', lakeField: 'gender_code', lakeTable: 'ods_his.patient', element: 'DE-GEN-001 性别代码', domain: 'GB/T 2261.1', attr: '字符(1)·必填', combo: '患者主索引组合', deps: 4, sync: '已贯通', side: '双侧一致', updated: '08-06 10:20' },
  { id: 'BR-02', lakeField: 'diag_code', lakeTable: 'ods_emr.diagnosis', element: 'DE-DIAG-001 主要诊断编码', domain: 'ICD-10 国临版 2.0', attr: '字符(10)·索引', combo: '门诊诊断组合', deps: 6, sync: '部分', side: '值域版本差 1', updated: '08-06 09:40' },
  { id: 'BR-03', lakeField: 'dept_code', lakeTable: 'dim_department', element: 'DE-DEP-001 科室编码', domain: '卫健委科室分类', attr: '字符(20)·外键', combo: '组织机构组合', deps: 3, sync: '已贯通', side: '双侧一致', updated: '08-05 18:12' },
  { id: 'BR-04', lakeField: 'lab_item', lakeTable: 'ods_lis.lab_item', element: 'DE-LAB-001 检验项目编码', domain: 'LOINC / 互认目录', attr: '字符(20)·可空', combo: '检验结果组合', deps: 5, sync: '待对齐', side: '湖仓缺值域绑定', updated: '08-06 11:05' },
  { id: 'BR-05', lakeField: 'nation_code', lakeTable: 'ods_his.patient', element: 'DE-PAT-006 民族代码', domain: 'GB/T 3304', attr: '字符(2)·草稿', combo: '人口学组合', deps: 2, sync: '冲突', side: '中台草稿 / 湖仓已引用', updated: '08-06 08:50' },
  { id: 'BR-06', lakeField: 'op_code', lakeTable: 'ods_emr.operation', element: 'DE-OPR-001 手术操作编码', domain: 'ICD-9-CM-3', attr: '字符(10)·必填', combo: '手术记录组合', deps: 4, sync: '已贯通', side: '双侧一致', updated: '08-04 16:30' },
  { id: 'BR-07', lakeField: 'region_code', lakeTable: 'ods_ph.archive', element: 'DE-ADR-001 行政区划代码', domain: 'GB/T 2260', attr: '字符(6)·索引', combo: '公卫档案组合', deps: 3, sync: '部分', side: '依赖表未同步', updated: '08-05 14:22' },
  { id: 'BR-08', lakeField: 'pay_type', lakeTable: 'ods_his.settle', element: 'DE-FEE-PAY 结算方式', domain: '医保结算方式', attr: '字符(4)·必填', combo: '费用结算组合', deps: 2, sync: '待对齐', side: '中台新增未下发', updated: '08-06 12:10' },
];

const relNodes: RelNode[] = [
  { id: 'N1', name: '性别代码', kind: '数据元', side: '中台标准', version: 'V2.1', status: '已发布' },
  { id: 'N2', name: 'GB/T 2261.1 值域', kind: '值域', side: '中台标准', version: 'V2.1', status: '已发布' },
  { id: 'N3', name: 'ods_his.patient.gender_code', kind: '依赖表', side: '湖仓元数据', version: 'ODS', status: '已绑定' },
  { id: 'N4', name: '患者主索引组合', kind: '组合', side: '中台标准', version: 'V1.4', status: '已发布' },
  { id: 'N5', name: 'dim_patient_master', kind: '依赖表', side: '湖仓元数据', version: 'DIM', status: '已绑定' },
  { id: 'N6', name: 'ICD-10 诊断编码', kind: '值域', side: '中台标准', version: 'V2.0', status: '已发布' },
  { id: 'N7', name: 'ods_emr.diagnosis.diag_code', kind: '依赖表', side: '湖仓元数据', version: 'ODS', status: '版本差' },
];

const syncJobs = [
  { id: 'SYNC-01', name: '标准字典全量下发湖仓', scope: '值域 186 套', status: '成功', rows: '82,640', cost: '4m12s', at: '08-06 02:10' },
  { id: 'SYNC-02', name: '湖仓元数据回写中台', scope: '字段绑定 1,286', status: '成功', rows: '1,286', cost: '1m08s', at: '08-06 02:18' },
  { id: 'SYNC-03', name: 'ICD-10 增量同步', scope: '新增 128 条', status: '运行中', rows: '128', cost: '—', at: '08-06 14:05' },
  { id: 'SYNC-04', name: '冲突字典人工复核队列', scope: '民族代码等 6 项', status: '待处理', rows: '6', cost: '—', at: '08-06 08:50' },
];

const toneOf = (s: string) => {
  if (['已贯通', '已发布', '成功', '已绑定'].includes(s)) return 'green';
  if (['部分', '运行中', '版本差', '草稿'].includes(s)) return 'amber';
  if (['待对齐', '待处理'].includes(s)) return 'slate';
  if (['冲突', '失败'].includes(s)) return 'red';
  return 'blue';
};

/** 标准字典值域贯通总览 */
export function DictBridgeHubPage() {
  const { go, notify } = useApp();
  const [demoing, setDemoing] = useState(false);
  const [syncedOk, setSyncedOk] = useState(false);
  const [aligned, setAligned] = useState(false);
  const synced = bridges.filter((b) => b.sync === '已贯通').length;
  const conflict = bridges.filter((b) => b.sync === '冲突').length;

  const demoAccept = async () => {
    setDemoing(true);
    notify('① 触发标准→湖仓双向同步');
    await new Promise((r) => setTimeout(r, 500));
    setSyncedOk(true);
    notify('② 属性/组合/依赖对齐完成');
    setAligned(true);
    await new Promise((r) => setTimeout(r, 400));
    notify('③ 治理侧与开发侧口径一致 · 验收通过');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="STANDARD DICT & DOMAIN BRIDGE · A3-01"
        title="标准字典值域贯通"
        desc="验收：同一字典在治理与开发侧属性、组合、依赖口径一致，版本可追溯。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="braces" onClick={() => go('/collection/domain-bridge')}>值域贯通</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => { setSyncedOk(true); notify('已触发标准→湖仓双向同步任务'); }}>立即同步</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '标准同步', d: '中台→湖仓', on: syncedOk },
          { n: '02', t: '属性对齐', d: '组合·依赖', on: aligned },
          { n: '03', t: '口径一致', d: '双侧可校验', on: syncedOk && aligned },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 已贯通 {synced} · 冲突 {conflict}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="贯通字段" value={String(synced)} unit={`/ ${bridges.length}`} delta="双侧口径一致" icon="checkcircle" tone="green" onClick={() => go('/collection/domain-bridge')} />
        <StatCard label="中台值域" value={String(valueDomains.length)} unit="套样例" delta="生产 186 套" icon="braces" tone="violet" onClick={() => go('/center/domains')} />
        <StatCard label="数据元" value={String(standardElements.length)} unit="个样例" delta="已发布为主" icon="book" tone="blue" onClick={() => go('/center/standards')} />
        <StatCard label="冲突待解" value={String(conflict)} unit="项" delta="需人工复核" icon="circlealert" tone="amber" onClick={() => go('/collection/domain-bridge?tab=conflict')} />
      </div>

      <Card className="mt-14" title="贯通基本流程" subtitle="标准发布 → 属性对齐 → 组合绑定 → 依赖下发 → 对码复用">
        <div className="schema-map" style={{ flexWrap: 'wrap', gap: 10 }}>
          {[
            ['1', '维护数据元 / 值域', () => go('/center/standards')],
            ['2', '属性 · 组合 · 依赖对齐', () => go('/collection/domain-bridge')],
            ['3', '发布对码方案', () => go('/collection/code-mapping')],
            ['4', '标化任务引用字典', () => go('/collection/std-tasks')],
            ['5', '湖仓侧预览校验', () => go('/bid/data-preview')],
          ].map(([n, label, fn]) => (
            <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>
              <Badge tone="blue">{n as string}</Badge> {label as string}
            </button>
          ))}
        </div>
        <div className="info-note mt-14">
          <Icon name="sparkles" size={13} />
          <span>验收口径：同一字典在数据治理（中台标准）与湖仓开发侧属性、组合、依赖保持一致，版本可追溯。</span>
        </div>
      </Card>

      <div className="grid grid-3 mt-14">
        {[
          { title: '统一属性', desc: '类型、长度、必填、索引等字段属性在中台与湖仓元数据双侧同步。', icon: 'sliders', tone: 'blue', go: '/collection/domain-bridge?tab=attr' },
          { title: '组合关系', desc: '数据元组成数据集 / 主索引组合，开发侧按组合拉取字段清单。', icon: 'boxes', tone: 'violet', go: '/collection/domain-bridge?tab=combo' },
          { title: '依赖引用', desc: '值域被哪些表字段引用、对码方案与标化任务依赖一目了然。', icon: 'network', tone: 'amber', go: '/collection/domain-bridge?tab=deps' },
        ].map((x) => (
          <Card key={x.title} title={x.title} subtitle={x.desc} actions={<Badge tone={x.tone as any}>{x.title.slice(2)}</Badge>}>
            <div className="row-actions mt-14">
              <Btn size="sm" variant="primary" icon={x.icon} onClick={() => go(x.go)}>查看明细</Btn>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="贯通对照一览" subtitle="湖仓字段 ↔ 中台数据元 / 值域" noPad actions={<Btn size="sm" onClick={() => go('/collection/domain-bridge')}>全部明细</Btn>}>
          <div className="pad-h">
            <DataTable
              rows={bridges.slice(0, 5)}
              pageSize={5}
              paginate={false}
              onRowClick={() => go('/collection/domain-bridge')}
              columns={[
                { key: 'lakeField', title: '湖仓字段', render: (r) => <div className="cell-main"><strong className="mono">{r.lakeField}</strong><small>{r.lakeTable}</small></div> },
                { key: 'element', title: '数据元', render: (r) => r.element },
                { key: 'domain', title: '值域', width: 130, render: (r) => <span className="muted">{r.domain}</span> },
                { key: 'sync', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.sync)} dot>{r.sync}</Badge> },
              ]}
            />
          </div>
        </Card>
        <Card title="能力衔接" subtitle="标化链路复用贯通结果">
          <ul className="feed-list">
            <li><span className="feed-ico blue"><Icon name="braces" size={13} /></span><div><strong>对码方案</strong><small>原始码 ↔ 标准码映射</small></div><button className="link-btn" onClick={() => go('/collection/code-mapping')}>打开</button></li>
            <li><span className="feed-ico violet"><Icon name="clipboard" size={13} /></span><div><strong>标化任务分派</strong><small>任务绑定标准字典版本</small></div><button className="link-btn" onClick={() => go('/collection/std-tasks')}>打开</button></li>
            <li><span className="feed-ico green"><Icon name="book" size={13} /></span><div><strong>中台值域字典</strong><small>权威发布与版本管理</small></div><button className="link-btn" onClick={() => go('/center/domains')}>打开</button></li>
          </ul>
        </Card>
      </div>
    </>
  );
}

/** 值域贯通明细：属性 / 组合 / 依赖 */
export function DomainBridgePage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [syncFilter, setSyncFilter] = useState('');
  const [active, setActive] = useState<BridgeRow | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);

  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t && ['all', 'attr', 'combo', 'deps', 'conflict'].includes(t)) setTab(t);
    if (t === 'conflict') setSyncFilter('冲突');
  }, []);

  const rows = useMemo(() => bridges.filter((b) => {
    if (tab === 'conflict' && b.sync !== '冲突') return false;
    if (syncFilter && b.sync !== syncFilter) return false;
    const hay = `${b.lakeField}${b.lakeTable}${b.element}${b.domain}${b.combo}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [q, syncFilter, tab]);

  return (
    <>
      <PageHeader
        eyebrow="DOMAIN BRIDGE DETAIL"
        title="值域贯通明细"
        desc="对照湖仓字段与中台标准：属性定义、组合归属、依赖引用；支持一键同步与冲突复核。"
        actions={
          <>
            <Btn icon="dashboard" onClick={() => go('/collection/dict-bridge')}>贯通总览</Btn>
            <Btn icon="braces" onClick={() => go('/collection/code-mapping')}>对码方案</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => setSyncOpen(true)}>同步标准</Btn>
          </>
        }
      />

      <Tabs
        variant="pill"
        value={tab === 'conflict' ? 'all' : tab}
        onChange={(k) => { setTab(k); if (k !== 'all') setSyncFilter(''); }}
        items={[
          { key: 'all', label: '全部对照' },
          { key: 'attr', label: '属性对齐' },
          { key: 'combo', label: '组合关系' },
          { key: 'deps', label: '依赖引用' },
        ]}
      />

      <div className="stat-grid mt-14">
        <StatCard label="对照项" value={String(rows.length)} unit="条" delta={`冲突 ${bridges.filter((b) => b.sync === '冲突').length}`} icon="list" tone="blue" />
        <StatCard label="属性一致率" value="87.5" unit="%" delta="类型/长度/约束" icon="sliders" tone="green" />
        <StatCard label="组合覆盖" value="12" unit="组" delta="主索引 / 诊断 / 检验" icon="boxes" tone="violet" />
        <StatCard label="同步任务" value={String(syncJobs.length)} unit="个" delta="运行中 1" icon="activity" tone="amber" onClick={() => notify('已定位同步任务列表')} />
      </div>

      {(tab === 'attr' || tab === 'all') && (
        <Card className="mt-14" title={tab === 'attr' ? '属性对齐' : '字段对照'} subtitle="湖仓元数据字段 ↔ 中台数据元属性" noPad
          actions={
            <div className="filter-bar">
              <SearchInput value={q} onChange={setQ} placeholder="搜索字段 / 数据元 / 值域" width={220} />
              <Select value={syncFilter} onChange={setSyncFilter} options={['', '已贯通', '部分', '待对齐', '冲突']} placeholder="全部状态" width={110} />
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={rows}
              pageSize={8}
              onRowClick={(r) => setActive(r as BridgeRow)}
              columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'lakeField', title: '湖仓字段', render: (r) => <div className="cell-main"><strong className="mono">{r.lakeField}</strong><small>{r.lakeTable}</small></div> },
                { key: 'element', title: '中台数据元', render: (r) => r.element },
                { key: 'attr', title: '属性', width: 120, render: (r) => <span className="tag">{r.attr}</span> },
                { key: 'domain', title: '值域', width: 140, render: (r) => <span className="muted">{r.domain}</span> },
                { key: 'sync', title: '贯通', width: 80, render: (r) => <Badge tone={toneOf(r.sync)} dot>{r.sync}</Badge> },
                { key: 'side', title: '差异说明', width: 140, render: (r) => r.side },
              ]}
            />
          </div>
        </Card>
      )}

      {(tab === 'combo' || tab === 'all') && (
        <Card className="mt-14" title="组合关系" subtitle="数据元组合在中台定义，湖仓开发按组合取数字段">
          <div className="coverage-list">
            {[
              ['患者主索引组合', 8, 8, '#6755F5'],
              ['门诊诊断组合', 6, 5, '#9587FF'],
              ['检验结果组合', 10, 7, '#0891B2'],
              ['手术记录组合', 5, 5, '#10B981'],
              ['费用结算组合', 4, 2, '#F59E0B'],
            ].map(([name, total, ok, color]) => (
              <div key={name as string}>
                <span>{name as string}</span>
                <strong>{ok as number}/{total as number}</strong>
                <div className="coverage-track"><i style={{ width: `${Math.round(((ok as number) / (total as number)) * 100)}%`, background: color as string }} /></div>
              </div>
            ))}
          </div>
          <div className="info-note mt-14"><Icon name="boxes" size={13} /><span>组合发布后，标化 SQL 模板可引用组合内字段清单，避免开发侧手写散字段。</span></div>
        </Card>
      )}

      {(tab === 'deps' || tab === 'all') && (
        <div className="grid grid-2-1 mt-14">
          <Card title="依赖关系图（示意）" subtitle="标准侧节点 ↔ 湖仓引用">
            <ul className="feed-list">
              {relNodes.map((n) => (
                <li key={n.id}>
                  <span className={`feed-ico ${toneOf(n.status)}`}><Icon name={n.kind === '值域' ? 'braces' : n.kind === '组合' ? 'boxes' : n.kind === '依赖表' ? 'table' : 'book'} size={13} /></span>
                  <div>
                    <strong>{n.name}</strong>
                    <small>{n.kind} · {n.side} · {n.version}</small>
                  </div>
                  <Badge tone={toneOf(n.status)}>{n.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="同步任务" subtitle="标准下发 / 元数据回写" noPad actions={<Btn size="sm" icon="refresh" onClick={() => notify('同步状态已刷新')}>刷新</Btn>}>
            <div className="pad-h">
              <DataTable
                rows={syncJobs}
                pageSize={4}
                paginate={false}
                columns={[
                  { key: 'id', title: '任务', width: 80, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.scope}</small></div> },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.lakeField || ''}
        desc={active ? `${active.lakeTable} · ${active.element}` : ''}
        width={560}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn onClick={() => { notify('已跳转对码方案'); go('/collection/code-mapping'); }}>对码</Btn>
            <Btn variant="primary" onClick={() => { notify(`${active?.id} 已标记为人工确认贯通`); setActive(null); }}>确认贯通</Btn>
          </>
        }
      >
        {active && (
          <>
            <KeyValue cols={2} items={[
              { label: '湖仓字段', value: <span className="mono">{active.lakeField}</span> },
              { label: '所属表', value: active.lakeTable },
              { label: '数据元', value: active.element },
              { label: '值域', value: active.domain },
              { label: '属性', value: active.attr },
              { label: '组合', value: active.combo },
              { label: '依赖数', value: `${active.deps} 处引用` },
              { label: '贯通状态', value: <Badge tone={toneOf(active.sync)} dot>{active.sync}</Badge> },
              { label: '差异', value: active.side },
              { label: '更新', value: active.updated },
            ]} />
            <div className="divider-h" />
            <div className="section-title-sm">对齐进度</div>
            <div className="quality-cell mt-10">
              <Progress value={active.sync === '已贯通' ? 100 : active.sync === '部分' ? 62 : active.sync === '冲突' ? 35 : 20} tone={toneOf(active.sync) as any} />
              <span>{active.sync}</span>
            </div>
            <div className="info-note mt-14"><Icon name="shield" size={13} /><span>确认贯通后将写入版本快照，供标化任务与对码方案锁定字典版本。</span></div>
          </>
        )}
      </Drawer>

      <Modal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        title="同步标准字典 / 值域"
        desc="将中台已发布标准下发湖仓元数据，或回写湖仓绑定关系。"
        width={560}
        footer={<><Btn onClick={() => setSyncOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setSyncOpen(false); notify('双向同步任务已入队'); }}>开始同步</Btn></>}
      >
        <div className="form-grid">
          <Field label="同步方向" required className="span-2">
            <Select value="中台 → 湖仓（标准下发）" onChange={() => {}} options={['中台 → 湖仓（标准下发）', '湖仓 → 中台（绑定回写）', '双向增量']} />
          </Field>
          <Field label="范围" required>
            <Select value="全部已发布值域" onChange={() => {}} options={['全部已发布值域', '仅冲突项', '指定字典']} />
          </Field>
          <Field label="冲突策略">
            <Select value="保留中台版本并告警" onChange={() => {}} options={['保留中台版本并告警', '保留湖仓绑定', '进入人工队列']} />
          </Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="可选：同步批次说明" /></Field>
        </div>
      </Modal>
    </>
  );
}
