'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { apiServices } from '../../data';

type TabKey = 'catalog' | 'service' | 'resources';
type ResKind = '数据集' | 'API' | '数据文件';

type CatalogItem = {
  id: string; name: string; cat: string; level: 'L1' | 'L2' | 'L3' | 'L4';
  open: '无条件开放' | '有条件开放' | '非开放'; kind: ResKind; fav: boolean; subs: number; owner: string; updated: string;
};

type FlowReq = {
  id: string; name: string; mode: '文件' | '在线' | 'API' | '前置机';
  applicant: string; status: '申请中' | '审批中' | '加工中' | '已生成' | '已获取' | '已驳回'; updated: string;
};

type DatasetRow = { id: string; name: string; rows: string; cols: number; domain: string; fav: boolean; updated: string };
type FileRow = { id: string; name: string; size: string; fmt: string; fav: boolean; status: '可下载' | '需申请' | '生成中' };

const cats = ['全部', '患者服务', '就诊服务', '医技服务', '运营主题', '公卫健康', '科研开放'];

const catalogSeed: CatalogItem[] = [
  { id: 'OP-001', name: '患者主索引开放资源', cat: '患者服务', level: 'L3', open: '有条件开放', kind: 'API', fav: true, subs: 12, owner: '信息中心', updated: '10-27' },
  { id: 'OP-002', name: '门诊就诊明细数据集', cat: '就诊服务', level: 'L3', open: '有条件开放', kind: '数据集', fav: true, subs: 8, owner: '门诊部', updated: '10-26' },
  { id: 'OP-003', name: '检验结果查询服务', cat: '医技服务', level: 'L2', open: '有条件开放', kind: 'API', fav: false, subs: 6, owner: '检验科', updated: '10-25' },
  { id: 'OP-004', name: '医院运营主题包', cat: '运营主题', level: 'L2', open: '无条件开放', kind: '数据集', fav: false, subs: 18, owner: '运营部', updated: '10-24' },
  { id: 'OP-005', name: '慢病人群文件包', cat: '公卫健康', level: 'L3', open: '有条件开放', kind: '数据文件', fav: true, subs: 4, owner: '公卫科', updated: '10-23' },
  { id: 'OP-006', name: '科研脱敏病历集', cat: '科研开放', level: 'L4', open: '非开放', kind: '数据集', fav: false, subs: 2, owner: '科研处', updated: '10-22' },
  { id: 'OP-007', name: 'DRG 分组结果 API', cat: '运营主题', level: 'L2', open: '有条件开放', kind: 'API', fav: false, subs: 9, owner: '医保办', updated: '10-21' },
  { id: 'OP-008', name: '基层诊疗周报文件', cat: '公卫健康', level: 'L1', open: '无条件开放', kind: '数据文件', fav: false, subs: 14, owner: '基层卫生', updated: '10-20' },
];

const flowSeed: FlowReq[] = [
  { id: 'REQ-210', name: '门诊就诊明细导出', mode: '文件', applicant: '刘一鸣', status: '审批中', updated: '10-27 14:10' },
  { id: 'REQ-209', name: '主索引在线查询授权', mode: '在线', applicant: '王思远', status: '加工中', updated: '10-27 11:20' },
  { id: 'REQ-208', name: '检验结果 API 开通', mode: 'API', applicant: '张敏', status: '已获取', updated: '10-26 16:40' },
  { id: 'REQ-207', name: '区域前置机同步包', mode: '前置机', applicant: '周宁', status: '已生成', updated: '10-26 09:12' },
  { id: 'REQ-206', name: '科研病历脱敏集', mode: '文件', applicant: '陈研', status: '已驳回', updated: '10-25 18:05' },
  { id: 'REQ-205', name: '运营主题复合检索包', mode: '在线', applicant: '赵倩', status: '申请中', updated: '10-25 10:30' },
];

const datasets: DatasetRow[] = [
  { id: 'DS-01', name: '门诊就诊明细', rows: '1,286 万', cols: 48, domain: '就诊', fav: true, updated: '10-27' },
  { id: 'DS-02', name: '住院病案首页', rows: '86 万', cols: 128, domain: '病案', fav: false, updated: '10-26' },
  { id: 'DS-03', name: '运营主题宽表', rows: '420 万', cols: 86, domain: '运营', fav: true, updated: '10-25' },
  { id: 'DS-04', name: '公卫随访明细', rows: '64 万', cols: 36, domain: '公卫', fav: false, updated: '10-24' },
];

const files: FileRow[] = [
  { id: 'FL-01', name: '慢病人群包_202610.csv', size: '128 MB', fmt: 'CSV', fav: true, status: '可下载' },
  { id: 'FL-02', name: '基层诊疗周报.xlsx', size: '4.2 MB', fmt: 'XLSX', fav: false, status: '可下载' },
  { id: 'FL-03', name: '科研脱敏病历_批次08.zip', size: '860 MB', fmt: 'ZIP', fav: false, status: '需申请' },
  { id: 'FL-04', name: 'DRG 月报导出.parquet', size: '62 MB', fmt: 'Parquet', fav: true, status: '生成中' },
];

const related = [
  { id: 'R1', name: '患者主索引', rel: '上游主数据' },
  { id: 'R2', name: '门诊就诊主题表', rel: '同源明细' },
  { id: 'R3', name: '指标：门诊人次', rel: '下游指标' },
  { id: 'R4', name: '开放 API 网关', rel: '服务出口' },
];

/** B11 数据发布与开放：资产目录 · 资源服务 · 数据集/API/文件 */
export function OpenPublishHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('catalog');
  const [cat, setCat] = useState('全部');
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [kind, setKind] = useState('');
  const [searchMode, setSearchMode] = useState<'简单' | '复合'>('简单');
  const [items, setItems] = useState(catalogSeed);
  const [active, setActive] = useState<CatalogItem | null>(null);
  const [flows, setFlows] = useState(flowSeed);
  const [applyOpen, setApplyOpen] = useState(false);
  const [resKind, setResKind] = useState<'数据集' | 'API' | '数据文件'>('数据集');
  const [dsFav, setDsFav] = useState(datasets);
  const [fileFav, setFileFav] = useState(files);
  const [apiTest, setApiTest] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [flowBusy, setFlowBusy] = useState(false);
  const [c4Done, setC4Done] = useState({ publish: false, sub: false, approve: false, call: false });

  const rows = useMemo(() => items.filter((i) =>
    (cat === '全部' || i.cat === cat)
    && (!level || i.level === level)
    && (!kind || i.kind === kind)
    && (i.name + i.id + i.owner).toLowerCase().includes(q.toLowerCase())
  ), [items, cat, level, kind, q]);

  const toggleFav = (id: string) => {
    setItems((arr) => arr.map((x) => x.id === id ? { ...x, fav: !x.fav } : x));
    notify('收藏状态已更新');
  };

  const subscribe = (item: CatalogItem) => {
    setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, subs: x.subs + 1, fav: true } : x));
    notify(`${item.name} 已订阅 · 变更将通知`);
  };

  const advanceFlow = async (id: string) => {
    const order: FlowReq['status'][] = ['申请中', '审批中', '加工中', '已生成', '已获取'];
    setFlowBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setFlows((arr) => arr.map((f) => {
      if (f.id !== id) return f;
      const i = order.indexOf(f.status);
      if (i < 0 || i >= order.length - 1) return f;
      return { ...f, status: order[i + 1], updated: '刚刚' };
    }));
    setFlowBusy(false);
    notify('资源流程已推进 · 申请—审批—加工—生成—获取');
  };

  const runApiTest = async (name: string) => {
    setTesting(true);
    setApiTest(null);
    await new Promise((r) => setTimeout(r, 700));
    setApiTest(`200 OK · 48ms · { "code": 0, "data": [{ "id": "PID-…", "org": "两江新区人民医院" }], "service": "${name}" }`);
    setTesting(false);
    notify(`${name} 在线测试通过`);
  };

  const demoAcquire = async () => {
    setTab('catalog');
    setFlowBusy(true);
    setC4Done({ publish: true, sub: false, approve: false, call: false });
    notify('① 发布：开放目录上架');
    await new Promise((r) => setTimeout(r, 450));
    const target = items[0];
    if (target) subscribe(target);
    setC4Done((d) => ({ ...d, sub: true }));
    notify('② 订阅：已加入订阅清单');
    setTab('service');
    await new Promise((r) => setTimeout(r, 500));
    setFlows((arr) => [{ id: 'REQ-NEW', name: '共享服务 API 订阅', mode: 'API', applicant: '演示用户', status: '审批中', updated: '刚刚' }, ...arr]);
    notify('③ 审批中…');
    await new Promise((r) => setTimeout(r, 500));
    setFlows((arr) => arr.map((f) => f.id === 'REQ-NEW' ? { ...f, status: '已获取' } : f));
    setC4Done((d) => ({ ...d, approve: true }));
    setTab('resources'); setResKind('API');
    await runApiTest(target?.name || '开放 API');
    setC4Done((d) => ({ ...d, call: true }));
    setFlowBusy(false);
    notify('④ 调用成功 · 发布—订阅—审批—调用闭环完成（C4）');
  };

  return (
    <>
      <PageHeader
        eyebrow="SHARED SERVICE / OPEN PORTAL · C4 / B11"
        title="共享服务与开放门户"
        desc="验收：发布—订阅—审批—调用闭环；兼 B11 开放目录与三类资源。"
        actions={
          <>
            <Btn icon="network" onClick={() => go('/collection/data-service')}>数据服务管理</Btn>
            <Btn variant="primary" icon="zap" loading={flowBusy || testing} onClick={demoAcquire}>演示验收</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '发布', d: '目录上架', on: c4Done.publish || tab === 'catalog' },
          { n: '02', t: '订阅', d: '申请清单', on: c4Done.sub },
          { n: '03', t: '审批', d: '流程推进', on: c4Done.approve },
          { n: '04', t: '调用', d: '在线测试', on: c4Done.call },
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
        <span className="live-badge"><i /> {c4Done.call ? '闭环完成' : `开放 ${items.length} · 订阅 ${items.reduce((n, i) => n + i.subs, 0)}`}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="开放目录" value={String(items.length)} unit="项" delta="可检索" icon="store" tone="blue" onClick={() => setTab('catalog')} />
        <StatCard label="资源申请" value={String(flows.filter((f) => f.status === '申请中' || f.status === '审批中').length)} unit="单" delta="流程中" icon="mail" tone="amber" onClick={() => setTab('service')} />
        <StatCard label="已发布 API" value={String(apiServices.filter((a) => a.status === '已发布').length)} unit="个" delta="可在线测" icon="network" tone="violet" onClick={() => { setTab('resources'); setResKind('API'); }} />
        <StatCard label="我的收藏" value={String(items.filter((i) => i.fav).length)} unit="项" delta="可订阅" icon="bell" tone="green" onClick={() => setTab('catalog')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'catalog', label: '开放资产目录', count: items.length },
          { key: 'service', label: '资源服务', count: flows.length },
          { key: 'resources', label: '数据集 / API / 文件' },
        ]}
      />

      {tab === 'catalog' && (
        <>
          <div className="market-hero mt-14">
            <div className="market-hero-left">
              <Badge tone="cyan">OPEN CATALOG</Badge>
              <h2>发现可开放的数据资产</h2>
              <p>目录分类、分级检索、元数据详情、关联图谱与订阅收藏，支撑门户一站式发现。</p>
              <div className="market-search">
                <Icon name="search" size={14} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchMode === '简单' ? '搜索资源名称、编号…' : '复合：主题+级别+类型，如 门诊 L3 数据集'} />
                <Btn size="sm" variant="primary" onClick={() => notify(`${searchMode}检索已执行 · ${rows.length} 条`)}>检索</Btn>
              </div>
              <div className="market-hot">
                <span>热门</span>
                {['患者主索引', '门诊就诊', '检验结果', '运营主题'].map((h) => (
                  <button key={h} onClick={() => setQ(h)}>{h}</button>
                ))}
                <button onClick={() => setSearchMode((m) => m === '简单' ? '复合' : '简单')}>{searchMode}检索 ⇄</button>
              </div>
            </div>
            <div className="market-hero-right">
              <div><span>目录资源</span><strong>{items.length}</strong></div>
              <div><span>可无条件开放</span><strong>{items.filter((i) => i.open === '无条件开放').length}</strong></div>
              <div><span>今日订阅</span><strong>18</strong></div>
              <div className="market-badge"><Badge tone="green" dot>开放门户正常</Badge></div>
            </div>
          </div>

          <div className="market-filters">
            <div className="market-cats">
              {cats.map((c) => (
                <button key={c} className={cat === c ? 'is-active' : ''} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
            <div className="row-actions">
              <Select value={level} onChange={setLevel} options={['', 'L1', 'L2', 'L3', 'L4']} placeholder="安全级别" width={100} />
              <Select value={kind} onChange={setKind} options={['', '数据集', 'API', '数据文件']} placeholder="资源类型" width={110} />
            </div>
          </div>

          <div className="market-grid">
            {rows.map((item) => (
              <button key={item.id} className="market-card" onClick={() => setActive(item)}>
                <div className="row-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Badge tone={item.kind === 'API' ? 'violet' : item.kind === '数据集' ? 'blue' : 'slate'}>{item.kind}</Badge>
                  <Badge tone={item.level === 'L4' ? 'red' : item.level === 'L3' ? 'amber' : 'green'}>{item.level}</Badge>
                </div>
                <strong style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{item.name}</strong>
                <small style={{ display: 'block', marginTop: 4, color: '#8b98b0' }}>{item.id} · {item.cat} · {item.owner}</small>
                <div className="row-actions" style={{ marginTop: 12, width: '100%', justifyContent: 'space-between' }}>
                  <Badge tone={item.open === '无条件开放' ? 'green' : item.open === '有条件开放' ? 'blue' : 'slate'}>{item.open}</Badge>
                  <span className="muted xs">订阅 {item.subs}</span>
                </div>
                <div className="row-actions" style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                  <button className="link-btn" onClick={() => setActive(item)}>详情</button>
                  <button className="link-muted" onClick={() => toggleFav(item.id)}>{item.fav ? '已收藏' : '收藏'}</button>
                  <button className="link-muted" onClick={() => subscribe(item)}>订阅</button>
                </div>
              </button>
            ))}
            <button className="market-add" onClick={() => { setTab('service'); setApplyOpen(true); }}>
              <span><Icon name="plus" size={16} /></span>
              <strong>申请开放资源</strong>
              <small>进入资源服务流程</small>
            </button>
          </div>
        </>
      )}

      {tab === 'service' && (
        <>
          <div className="grid grid-2 mt-14">
            <Card title="开放管理" subtitle="简单 / 复合检索 · 开放范围">
              <div className="market-cats" style={{ marginBottom: 12 }}>
                {(['简单', '复合'] as const).map((m) => (
                  <button key={m} className={searchMode === m ? 'is-active' : ''} onClick={() => setSearchMode(m)}>{m}检索</button>
                ))}
              </div>
              <div className="form-grid">
                <Field label="关键词" className="span-2"><input className="input" placeholder="主题 / 指标 / 表名" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
                {searchMode === '复合' && (
                  <>
                    <Field label="安全级别"><Select value={level} onChange={setLevel} options={['', 'L1', 'L2', 'L3', 'L4']} placeholder="全部" /></Field>
                    <Field label="资源类型"><Select value={kind} onChange={setKind} options={['', '数据集', 'API', '数据文件']} placeholder="全部" /></Field>
                  </>
                )}
              </div>
              <Btn className="mt-14" variant="primary" icon="search" onClick={() => { setTab('catalog'); notify(`${searchMode}检索命中 ${rows.length} 项`); }}>执行检索</Btn>
            </Card>
            <Card title="加工方式" subtitle="文件 / 在线 / API / 前置机">
              <div className="publish-checks">
                {[
                  ['文件', '脱敏打包导出', 'file'],
                  ['在线', '门户在线查询', 'eye'],
                  ['API', '网关接口调用', 'network'],
                  ['前置机', '区域前置交换', 'server'],
                ].map(([t, d, i]) => (
                  <div key={t}>
                    <span><Icon name={i} size={13} /></span>
                    <div><strong>{t}</strong><small>{d}</small></div>
                    <button className="link-btn" onClick={() => { setApplyOpen(true); notify(`已选择「${t}」加工方式`); }}>选择</button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-14" title="资源生成与获取流程" subtitle="申请 → 审批 → 加工 → 生成 → 获取" noPad actions={
            <Btn size="sm" variant="primary" icon="plus" onClick={() => setApplyOpen(true)}>新建申请</Btn>
          }>
            <div className="pad-h">
              <DataTable rows={flows} pageSize={8} columns={[
                { key: 'name', title: '申请单', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.applicant}</small></div> },
                { key: 'mode', title: '加工', width: 80, render: (r) => <Badge tone="blue">{r.mode}</Badge> },
                { key: 'status', title: '状态', width: 90, render: (r) => (
                  <Badge tone={r.status === '已获取' || r.status === '已生成' ? 'green' : r.status === '已驳回' ? 'red' : 'amber'} dot>{r.status}</Badge>
                ) },
                { key: 'updated', title: '更新', width: 110, render: (r) => r.updated },
                { key: 'ops', title: '操作', width: 130, render: (r) => (
                  <div className="row-actions">
                    {r.status !== '已获取' && r.status !== '已驳回' ? (
                      <button className="link-btn" onClick={() => advanceFlow(r.id)}>推进</button>
                    ) : null}
                    {r.status === '已生成' || r.status === '已获取' ? (
                      <button className="link-muted" onClick={() => notify(`${r.name} 已下载/开通`)}>获取</button>
                    ) : null}
                    <button className="link-muted" onClick={() => notify(`${r.name} 详情`)}>详情</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      {tab === 'resources' && (
        <>
          <div className="market-filters mt-14">
            <div className="market-cats">
              {(['数据集', 'API', '数据文件'] as const).map((k) => (
                <button key={k} className={resKind === k ? 'is-active' : ''} onClick={() => setResKind(k)}>{k}</button>
              ))}
            </div>
          </div>

          {resKind === '数据集' && (
            <Card className="mt-14" title="数据集" subtitle="查询 · 导出 · 排序 · 收藏" noPad>
              <div className="pad-h">
                <DataTable rows={dsFav} pageSize={8} columns={[
                  { key: 'name', title: '数据集', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.domain}</small></div> },
                  { key: 'rows', title: '行数', width: 90, render: (r) => r.rows },
                  { key: 'cols', title: '字段', width: 60, render: (r) => r.cols },
                  { key: 'updated', title: '更新', width: 70, render: (r) => r.updated },
                  { key: 'ops', title: '操作', width: 160, render: (r) => (
                    <div className="row-actions">
                      <button className="link-btn" onClick={() => notify(`${r.name} 已查询预览`)}>查询</button>
                      <button className="link-muted" onClick={() => notify(`${r.name} 已导出 CSV`)}>导出</button>
                      <button className="link-muted" onClick={() => {
                        setDsFav((arr) => arr.map((x) => x.id === r.id ? { ...x, fav: !x.fav } : x));
                        notify(r.fav ? '已取消收藏' : '已收藏');
                      }}>{r.fav ? '已收藏' : '收藏'}</button>
                    </div>
                  ) },
                ]} />
              </div>
            </Card>
          )}

          {resKind === 'API' && (
            <div className="grid grid-2 mt-14">
              <Card title="API 信息" subtitle="可在线测试" noPad>
                <div className="pad-h">
                  <DataTable rows={apiServices.filter((a) => a.status === '已发布')} pageSize={6} columns={[
                    { key: 'name', title: 'API', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.method} {r.path}</small></div> },
                    { key: 'latency', title: '延迟', width: 70, render: (r) => r.latency },
                    { key: 'ops', title: '操作', width: 90, render: (r) => (
                      <button className="link-btn" onClick={() => runApiTest(r.name)}>测试</button>
                    ) },
                  ]} />
                </div>
              </Card>
              <Card title="在线测试台" subtitle="模拟网关响应" actions={
                <Btn size="sm" variant="primary" loading={testing} icon="play" onClick={() => runApiTest('患者主索引查询')}>运行</Btn>
              }>
                <div className="api-code"><span>GET</span><code>/api/v1/patient/{'{patientId}'}</code></div>
                <pre className="bi-api-out mt-14">{apiTest || '// 点击测试查看响应'}</pre>
                <div className="table-note mt-14"><Icon name="shield" size={12} /> 调用经网关鉴权与脱敏，审计写入统一日志。</div>
              </Card>
            </div>
          )}

          {resKind === '数据文件' && (
            <div className="grid grid-2 mt-14">
              <Card title="数据文件" subtitle="查询 · 收藏 · 下载申请 · 订阅通知" noPad>
                <div className="pad-h">
                  <DataTable rows={fileFav} pageSize={8} columns={[
                    { key: 'name', title: '文件', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.fmt} · {r.size}</small></div> },
                    { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '可下载' ? 'green' : r.status === '需申请' ? 'amber' : 'blue'} dot>{r.status}</Badge> },
                    { key: 'ops', title: '操作', width: 150, render: (r) => (
                      <div className="row-actions">
                        {r.status === '可下载' ? <button className="link-btn" onClick={() => notify(`${r.name} 开始下载`)}>下载</button>
                          : <button className="link-btn" onClick={() => { setApplyOpen(true); notify('已转入下载申请'); }}>申请</button>}
                        <button className="link-muted" onClick={() => {
                          setFileFav((arr) => arr.map((x) => x.id === r.id ? { ...x, fav: !x.fav } : x));
                          notify(r.fav ? '已取消收藏' : '已收藏');
                        }}>{r.fav ? '已收藏' : '收藏'}</button>
                        <button className="link-muted" onClick={() => notify('文件变更订阅已开启')}>订阅</button>
                      </div>
                    ) },
                  ]} />
                </div>
              </Card>
              <Card title="资源构成" subtitle="三类开放资源">
                <Donut size={140} thickness={12} centerValue={String(items.length)} label="开放项" segments={[
                  { label: '数据集', value: items.filter((i) => i.kind === '数据集').length, color: '#6755F5' },
                  { label: 'API', value: items.filter((i) => i.kind === 'API').length, color: '#9587FF' },
                  { label: '数据文件', value: items.filter((i) => i.kind === '数据文件').length, color: '#0891B2' },
                ]} />
                <div className="mt-14">
                  <BarList items={[
                    { label: '今日下载', value: 26 },
                    { label: 'API 调用', value: 86 },
                    { label: '订阅通知', value: 12 },
                  ]} unit=" 次" color="#6755F5" />
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} width={640} title={active?.name || ''} desc={active ? `${active.id} · ${active.kind} · ${active.cat}` : ''}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn icon="bell" onClick={() => active && subscribe(active)}>订阅</Btn><Btn variant="primary" icon="download" onClick={() => { setActive(null); setTab('service'); setApplyOpen(true); }}>申请获取</Btn></>}>
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>安全级别</span><strong>{active.level}</strong></div>
              <div><span>开放级别</span><strong className="sm">{active.open}</strong></div>
              <div><span>订阅</span><strong>{active.subs}</strong></div>
              <div><span>类型</span><strong className="sm">{active.kind}</strong></div>
            </div>
            <KeyValue cols={2} items={[
              { label: '资源编号', value: active.id },
              { label: '目录分类', value: active.cat },
              { label: '责任人', value: active.owner },
              { label: '更新', value: active.updated },
              { label: '元数据摘要', value: '含信息资源名称、摘要、分类、提供方、信息项与库表定位，支持分级检索。', wide: true },
            ]} />
            <div className="section-title-sm mt-14">关联资源 / 数据图谱</div>
            <div className="check-list">
              {related.map((r) => (
                <div key={r.id}>
                  <span className="ok"><Icon name="link" size={12} /></span>
                  <strong>{r.name}</strong>
                  <em>{r.rel}</em>
                </div>
              ))}
            </div>
            <Btn className="mt-14 w-full" variant="secondary" icon="network" onClick={() => go('/center/graph')}>打开完整图谱</Btn>
          </>
        )}
      </Drawer>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="申请资源获取" desc="选择加工方式并提交，进入审批—加工—生成—获取流程。" width={560}
        footer={<><Btn onClick={() => setApplyOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => {
          setApplyOpen(false);
          setFlows((arr) => [{ id: `REQ-${200 + arr.length}`, name: active?.name || '开放资源申请', mode: 'API', applicant: '演示用户', status: '申请中', updated: '刚刚' }, ...arr]);
          setTab('service');
          notify('申请已提交 · 等待审批');
        }}>提交申请</Btn></>}>
        <div className="form-grid">
          <Field label="资源名称" required className="span-2"><input className="input" defaultValue={active?.name || ''} placeholder="选择或填写资源" /></Field>
          <Field label="加工方式"><Select value="API" onChange={() => {}} options={['文件', '在线', 'API', '前置机']} /></Field>
          <Field label="用途场景"><Select value="业务分析" onChange={() => {}} options={['业务分析', '监管上报', '科研', '公众服务']} /></Field>
          <Field label="申请说明" className="span-2"><textarea className="textarea" rows={3} placeholder="用途、范围与安全措施" /></Field>
        </div>
      </Modal>
    </>
  );
}

/** 兼容原 center/marketplace 入口 */
export function MarketplacePage() {
  return <OpenPublishHubPage />;
}
