'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { apiServices } from '../../data';

type TabKey = 'catalog' | 'publish' | 'subscribe' | 'keys' | 'audit';
type ApiRow = typeof apiServices[0] & { enabled?: boolean };

type SubReq = {
  id: string;
  api: string;
  app: string;
  owner: string;
  scene: string;
  status: '待审批' | '已通过' | '已驳回';
  time: string;
  quota: string;
};

type KeyRow = {
  id: string;
  app: string;
  clientId: string;
  secret: string;
  status: '启用' | '停用' | '轮换中';
  expire: string;
  apis: number;
};

type AuditRow = {
  id: string;
  time: string;
  api: string;
  app: string;
  code: number;
  latency: string;
  ip: string;
};

const seedSubs: SubReq[] = [
  { id: 'SUB-086', api: '患者主索引查询', app: '互联网医院', owner: '周宁', scene: '患者服务', status: '待审批', time: '08-06 13:40', quota: '1—10 万/日' },
  { id: 'SUB-085', api: '门诊就诊记录', app: '区域协同平台', owner: '刘一鸣', scene: '临床业务', status: '待审批', time: '08-06 11:20', quota: '10 万以上' },
  { id: 'SUB-084', api: '检验报告查询', app: '慢病管理 App', owner: '赵倩', scene: '患者服务', status: '已通过', time: '08-05 16:08', quota: '1 万以下' },
  { id: 'SUB-083', api: '指标数据服务', app: '运营看板', owner: '陈晓', scene: '运营管理', status: '已驳回', time: '08-05 10:12', quota: '1—10 万/日' },
  { id: 'SUB-082', api: '费用明细查询', app: 'HRP 成本', owner: '张敏', scene: '运营管理', status: '已通过', time: '08-04 09:30', quota: '1—10 万/日' },
];

const seedKeys: KeyRow[] = [
  { id: 'KEY-01', app: '互联网医院', clientId: 'app_ihospital_01', secret: 'sk_live_••••8f2a', status: '启用', expire: '2027-06-01', apis: 4 },
  { id: 'KEY-02', app: '区域协同平台', clientId: 'app_region_02', secret: 'sk_live_••••c91e', status: '启用', expire: '2026-12-31', apis: 6 },
  { id: 'KEY-03', app: '慢病管理 App', clientId: 'app_cdm_03', secret: 'sk_live_••••11b0', status: '轮换中', expire: '2026-09-30', apis: 2 },
  { id: 'KEY-04', app: '科研沙箱', clientId: 'app_research_04', secret: 'sk_test_••••aa3d', status: '停用', expire: '2026-08-01', apis: 1 },
];

const seedAudit: AuditRow[] = [
  { id: 'LOG-9012', time: '14:21:08', api: '患者主索引查询', app: '互联网医院', code: 200, latency: '48ms', ip: '10.20.18.22' },
  { id: 'LOG-9011', time: '14:21:02', api: '检验报告查询', app: '慢病管理 App', code: 200, latency: '62ms', ip: '10.20.18.41' },
  { id: 'LOG-9010', time: '14:20:55', api: '指标数据服务', app: '运营看板', code: 429, latency: '12ms', ip: '10.20.19.08' },
  { id: 'LOG-9009', time: '14:20:41', api: '门诊就诊记录', app: '区域协同平台', code: 200, latency: '71ms', ip: '10.20.16.10' },
  { id: 'LOG-9008', time: '14:20:18', api: '患者主索引查询', app: '互联网医院', code: 401, latency: '8ms', ip: '10.20.18.22' },
  { id: 'LOG-9007', time: '14:19:56', api: '费用明细查询', app: 'HRP 成本', code: 200, latency: '55ms', ip: '10.20.17.33' },
];

const toneOf = (s: string) => {
  if (['已发布', '已通过', '启用', '运行中'].includes(s)) return 'green';
  if (['待审批', '灰度', '轮换中'].includes(s)) return 'amber';
  if (['已驳回', '停用', '已下线'].includes(s)) return 'red';
  return 'slate';
};

/** A4-08 数据服务管理：发布 → 订阅 → 调用 → 审计 */
export function DataServiceHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('catalog');
  const [q, setQ] = useState('');
  const [services, setServices] = useState<ApiRow[]>(apiServices.map((a) => ({ ...a, enabled: a.status === '已发布' })));
  const [subs, setSubs] = useState(seedSubs);
  const [keys, setKeys] = useState(seedKeys);
  const [audit, setAudit] = useState(seedAudit);
  const [active, setActive] = useState<ApiRow | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [callBusy, setCallBusy] = useState(false);

  const catalog = useMemo(() => services.filter((a) =>
    (a.name + a.path + a.category).toLowerCase().includes(q.toLowerCase())
  ), [services, q]);

  const pending = subs.filter((s) => s.status === '待审批').length;

  const runClosedLoop = async () => {
    setDemoStep(1);
    setTab('publish');
    notify('① 发布：已准备接口上架');
    await new Promise((r) => setTimeout(r, 700));
    setDemoStep(2);
    setTab('subscribe');
    notify('② 订阅：进入审批队列');
    await new Promise((r) => setTimeout(r, 700));
    setSubs((arr) => {
      const first = arr.find((s) => s.status === '待审批');
      if (!first) return arr;
      return arr.map((s) => (s.id === first.id ? { ...s, status: '已通过' as const } : s));
    });
    await new Promise((r) => setTimeout(r, 500));
    setDemoStep(3);
    setTab('keys');
    notify('③ 签发密钥：第三方认证就绪');
    await new Promise((r) => setTimeout(r, 700));
    setDemoStep(4);
    setTab('audit');
    setCallBusy(true);
    const stamp = new Date();
    const t = `${String(stamp.getHours()).padStart(2, '0')}:${String(stamp.getMinutes()).padStart(2, '0')}:${String(stamp.getSeconds()).padStart(2, '0')}`;
    setAudit((a) => [{
      id: `LOG-${9000 + Math.floor(Math.random() * 90)}`,
      time: t,
      api: '患者主索引查询',
      app: '互联网医院',
      code: 200,
      latency: '46ms',
      ip: '10.20.18.22',
    }, ...a].slice(0, 12));
    setCallBusy(false);
    notify('④ 调用成功并写入审计日志 · 闭环完成');
    setDemoStep(0);
  };

  const approve = (id: string, pass: boolean) => {
    setSubs((arr) => arr.map((s) => (s.id === id ? { ...s, status: pass ? '已通过' : '已驳回' } : s)));
    notify(pass ? `订阅 ${id} 已通过，可签发密钥` : `订阅 ${id} 已驳回`);
    if (pass) setTab('keys');
  };

  const toggleService = (id: string) => {
    setServices((arr) => arr.map((a) => {
      if (a.id !== id) return a;
      const on = !a.enabled;
      return { ...a, enabled: on, status: on ? '已发布' : '已下线' };
    }));
    const cur = services.find((a) => a.id === id);
    notify(cur?.enabled ? `${cur.name} 已停用` : `${cur?.name} 已启用`);
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA SERVICE GOVERNANCE"
        title="数据服务管理"
        desc="接口发布、第三方认证与密钥、启停、访问统计与调用审计；验收：发布 → 订阅 → 调用 → 审计闭环。"
        actions={
          <>
            <Btn icon="play" onClick={runClosedLoop} loading={callBusy || demoStep > 0}>闭环演示</Btn>
            <Btn icon="book" onClick={() => notify('开发者文档已打开', 'info')}>开发者文档</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setPublishOpen(true)}>发布服务</Btn>
          </>
        }
      />

      <Card className="mt-0" title="闭环路径" subtitle="一键演示完整链路">
        <div className="svc-loop">
          {[
            { n: 1, t: '发布', d: '上架 API', k: 'publish' as TabKey },
            { n: 2, t: '订阅', d: '申请审批', k: 'subscribe' as TabKey },
            { n: 3, t: '认证', d: '密钥签发', k: 'keys' as TabKey },
            { n: 4, t: '调用', d: '访问统计', k: 'catalog' as TabKey },
            { n: 5, t: '审计', d: '日志留痕', k: 'audit' as TabKey },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <button type="button" className={`svc-loop-step${demoStep === s.n || tab === s.k ? ' is-on' : ''}`} onClick={() => setTab(s.k)}>
                <em>{s.n}</em>
                <div><strong>{s.t}</strong><small>{s.d}</small></div>
              </button>
              {i < 4 && <span className="svc-loop-arrow"><Icon name="arrowright" size={13} /></span>}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="stat-grid mt-14">
        <StatCard label="已发布 API" value={String(services.filter((a) => a.status === '已发布').length)} unit="个" delta="目录可订阅" icon="store" tone="blue" onClick={() => setTab('catalog')} />
        <StatCard label="待审批订阅" value={String(pending)} unit="单" delta="需处理" icon="mail" tone="amber" onClick={() => setTab('subscribe')} />
        <StatCard label="今日调用" value="28.6" unit="万次" delta="成功率 99.96%" icon="activity" tone="green" onClick={() => setTab('audit')} />
        <StatCard label="有效密钥" value={String(keys.filter((k) => k.status === '启用').length)} unit="个" delta="OAuth / AppKey" icon="key" tone="violet" onClick={() => setTab('keys')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'catalog', label: '服务目录', count: services.length },
          { key: 'publish', label: '发布治理' },
          { key: 'subscribe', label: '订阅审批', count: pending },
          { key: 'keys', label: '密钥认证', count: keys.length },
          { key: 'audit', label: '调用审计' },
        ]}
      />

      {tab === 'catalog' && (
        <Card className="mt-14" title="API 服务目录" subtitle="面向应用的可订阅服务" noPad
          actions={
            <div className="filter-bar">
              <SearchInput value={q} onChange={setQ} placeholder="名称 / 路径" width={220} />
              <Btn size="sm" onClick={() => setApplyOpen(true)}>申请订阅</Btn>
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={catalog}
              pageSize={8}
              onRowClick={(r) => setActive(r as ApiRow)}
              columns={[
                {
                  key: 'name', title: '服务',
                  render: (a) => (
                    <div className="api-name">
                      <span className={`method ${a.method.toLowerCase()}`}>{a.method}</span>
                      <div className="cell-main"><strong>{a.name}</strong><small>{a.path}</small></div>
                    </div>
                  ),
                },
                { key: 'category', title: '分类', width: 90, render: (a) => <Badge tone="slate">{a.category}</Badge> },
                { key: 'status', title: '状态', width: 80, render: (a) => <Badge tone={toneOf(a.status)} dot>{a.status}</Badge> },
                { key: 'calls', title: '调用量', width: 90, align: 'right', render: (a) => <span className="mono-cell">{a.calls}</span> },
                { key: 'latency', title: '延迟', width: 70, render: (a) => a.latency },
                {
                  key: 'ops', title: '操作', width: 150,
                  render: (a) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => setActive(a)}>详情</button>
                      <button className="link-btn" onClick={() => { setActive(a); setApplyOpen(true); }}>订阅</button>
                      <button className="link-muted" onClick={() => toggleService(a.id)}>{a.enabled ? '停用' : '启用'}</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'publish' && (
        <div className="grid grid-2 mt-14">
          <Card title="发布检查清单" subtitle="上架前必过">
            <ul className="feed-list">
              {[
                ['接口文档完整', '路径、参数、响应示例'],
                ['认证与脱敏', 'Bearer / AppKey · 敏感字段'],
                ['限流与配额', '默认 1000 次/分钟'],
                ['审批人确认', '数据负责人 + 安全员'],
              ].map(([t, d]) => (
                <li key={t}><span className="feed-ico green"><Icon name="check" size={13} /></span><div><strong>{t}</strong><small>{d}</small></div></li>
              ))}
            </ul>
            <div className="row-actions mt-14">
              <Btn variant="primary" icon="plus" onClick={() => setPublishOpen(true)}>新建发布</Btn>
              <Btn onClick={() => go('/collection/lake-tables')}>从湖表生成</Btn>
            </div>
          </Card>
          <Card title="最近发布" subtitle="启停与灰度" noPad>
            <div className="pad-h">
              <DataTable
                rows={services.slice(0, 5)}
                pageSize={5}
                paginate={false}
                columns={[
                  { key: 'name', title: '服务', render: (a) => <strong>{a.name}</strong> },
                  { key: 'status', title: '状态', width: 80, render: (a) => <Badge tone={toneOf(a.status)} dot>{a.status}</Badge> },
                  {
                    key: 'ops', title: '启停', width: 80,
                    render: (a) => <button className="link-btn" onClick={() => toggleService(a.id)}>{a.enabled ? '停用' : '启用'}</button>,
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === 'subscribe' && (
        <Card className="mt-14" title="订阅审批" subtitle="第三方应用申请接入" noPad
          actions={<Badge tone="amber">{pending} 待审批</Badge>}
        >
          <div className="pad-h">
            <DataTable
              rows={subs}
              pageSize={8}
              columns={[
                { key: 'id', title: '单号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'api', title: '服务', render: (r) => <div className="cell-main"><strong>{r.api}</strong><small>{r.app} · {r.owner}</small></div> },
                { key: 'scene', title: '场景', width: 90, render: (r) => r.scene },
                { key: 'quota', title: '配额', width: 100, render: (r) => r.quota },
                { key: 'time', title: '提交', width: 100, render: (r) => r.time },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 120,
                  render: (r) => r.status === '待审批' ? (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => approve(r.id, true)}>通过</button>
                      <button className="link-muted" onClick={() => approve(r.id, false)}>驳回</button>
                    </div>
                  ) : <span className="muted">—</span>,
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'keys' && (
        <Card className="mt-14" title="第三方认证 / 密钥" subtitle="Client ID · Secret · 轮换" noPad
          actions={<Btn size="sm" icon="key" onClick={() => notify('已签发新密钥（演示）')}>签发密钥</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={keys}
              pageSize={8}
              columns={[
                { key: 'app', title: '应用', render: (r) => <div className="cell-main"><strong>{r.app}</strong><small>{r.clientId}</small></div> },
                { key: 'secret', title: '密钥', width: 140, render: (r) => <span className="mono-cell">{r.secret}</span> },
                { key: 'apis', title: '授权 API', width: 80, align: 'right', render: (r) => r.apis },
                { key: 'expire', title: '过期', width: 100, render: (r) => r.expire },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 130,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => notify(`${r.app} 密钥已复制`)}>复制</button>
                      <button className="link-btn" onClick={() => {
                        setKeys((arr) => arr.map((k) => (k.id === r.id ? { ...k, status: '轮换中' } : k)));
                        notify(`${r.app} 开始轮换密钥`);
                      }}>轮换</button>
                      <button className="link-muted" onClick={() => {
                        setKeys((arr) => arr.map((k) => (k.id === r.id ? { ...k, status: k.status === '停用' ? '启用' : '停用' } : k)));
                      }}>{r.status === '停用' ? '启用' : '停用'}</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'audit' && (
        <div className="grid grid-2-1 mt-14">
          <Card title="调用审计日志" subtitle="保留 180 天 · 可下钻" noPad
            actions={<Btn size="sm" icon="download" onClick={() => notify('审计日志已导出')}>导出</Btn>}
          >
            <div className="pad-h">
              <DataTable
                rows={audit}
                pageSize={8}
                columns={[
                  { key: 'time', title: '时间', width: 80, render: (r) => <span className="mono-cell">{r.time}</span> },
                  { key: 'api', title: '接口', render: (r) => <div className="cell-main"><strong>{r.api}</strong><small>{r.app}</small></div> },
                  { key: 'code', title: '状态码', width: 70, render: (r) => <Badge tone={r.code === 200 ? 'green' : r.code === 429 ? 'amber' : 'red'}>{r.code}</Badge> },
                  { key: 'latency', title: '耗时', width: 70, render: (r) => r.latency },
                  { key: 'ip', title: '来源 IP', width: 110, render: (r) => <span className="mono-cell">{r.ip}</span> },
                ]}
              />
            </div>
          </Card>
          <Card title="访问统计" subtitle="近 7 日">
            <div className="api-trend">
              {[42, 58, 51, 68, 74, 66, 82].map((v, i) => (
                <div key={i}><span style={{ height: `${v}%` }} /><em>{['四', '五', '六', '日', '一', '二', '三'][i]}</em></div>
              ))}
            </div>
            <div className="divider-h" />
            <KeyValue cols={1} items={[
              { label: '平均延迟', value: '52 ms' },
              { label: 'P95', value: '126 ms' },
              { label: '错误率', value: '0.04%' },
              { label: '限流命中', value: '128 次' },
            ]} />
          </Card>
        </div>
      )}

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name || ''}
        desc={active ? `${active.method} ${active.path}` : ''}
        width={640}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon={active?.enabled ? 'pause' : 'play'} onClick={() => active && toggleService(active.id)}>{active?.enabled ? '停用' : '启用'}</Btn>
            <Btn variant="primary" onClick={() => { setApplyOpen(true); }}>申请订阅</Btn>
          </>
        }
      >
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>调用量</span><strong>{active.calls}</strong></div>
              <div><span>延迟</span><strong>{active.latency}</strong></div>
              <div><span>状态</span><strong>{active.status}</strong></div>
              <div><span>提供方</span><strong>{active.owner}</strong></div>
            </div>
            <div className="section-title-sm mt-14">请求示例</div>
            <div className="code-sample">{active.method} {active.path}{'\n'}Authorization: Bearer &lt;access_token&gt;{'\n'}X-App-Key: &lt;client_id&gt;</div>
            <div className="section-title-sm mt-14">治理策略</div>
            <KeyValue cols={2} items={[
              { label: '认证', value: 'OAuth 2.0 / AppKey' },
              { label: '限流', value: '1,000 次/分钟' },
              { label: '脱敏', value: '身份证、手机号' },
              { label: '审计', value: '日志保留 180 天' },
            ]} />
          </>
        )}
      </Drawer>

      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="发布数据服务" desc="从湖表或已有接口发布到服务目录" width={620}
        footer={
          <>
            <Btn onClick={() => setPublishOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              setPublishOpen(false);
              setServices((arr) => [{
                id: `API-${100 + arr.length}`,
                name: '湖表实时查询（演示）',
                path: '/api/v1/lake/ods_his/patient',
                method: 'GET',
                status: '已发布',
                calls: '0',
                latency: '—',
                owner: '湖仓开发',
                category: '湖仓服务',
                enabled: true,
              }, ...arr]);
              setTab('catalog');
              notify('服务已发布到目录');
            }}>发布上架</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="服务名称" required className="span-2"><input className="input" placeholder="例如：患者主索引查询" /></Field>
          <Field label="方法"><Select value="GET" onChange={() => {}} options={['GET', 'POST']} /></Field>
          <Field label="路径" required><input className="input" placeholder="/api/v1/..." /></Field>
          <Field label="数据来源" className="span-2"><Select value="ods_his.patient" onChange={() => {}} options={['ods_his.patient', 'ods_lis.lab_report', 'dm_ops.daily_kpi']} /></Field>
          <Field label="认证方式"><Select value="OAuth 2.0" onChange={() => {}} options={['OAuth 2.0', 'AppKey', '双重认证']} /></Field>
          <Field label="限流"><Select value="1000 次/分钟" onChange={() => {}} options={['200 次/分钟', '1000 次/分钟', '5000 次/分钟']} /></Field>
        </div>
      </Modal>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="申请订阅" desc="审批通过后自动进入密钥签发" width={560}
        footer={
          <>
            <Btn onClick={() => setApplyOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              setApplyOpen(false);
              setSubs((arr) => [{
                id: `SUB-${80 + arr.length}`,
                api: active?.name || '患者主索引查询',
                app: '演示应用',
                owner: '当前用户',
                scene: '临床业务',
                status: '待审批',
                time: '刚刚',
                quota: '1—10 万/日',
              }, ...arr]);
              setTab('subscribe');
              notify('订阅申请已提交，等待审批');
            }}>提交申请</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="申请服务" className="span-2"><Select value={active?.name || '患者主索引查询'} onChange={() => {}} options={services.map((a) => a.name)} /></Field>
          <Field label="应用名称" required><input className="input" placeholder="例如：互联网医院患者端" /></Field>
          <Field label="负责人"><input className="input" placeholder="姓名 / 工号" /></Field>
          <Field label="日调用量"><Select value="1—10 万次" onChange={() => {}} options={['1 万次以下', '1—10 万次', '10 万次以上']} /></Field>
          <Field label="场景"><Select value="临床业务" onChange={() => {}} options={['临床业务', '运营管理', '科研分析', '患者服务']} /></Field>
        </div>
      </Modal>
    </>
  );
}

/** 兼容原 center/marketplace 入口 */
export function MarketplacePage() {
  return <DataServiceHubPage />;
}
