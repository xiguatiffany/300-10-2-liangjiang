'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'factory' | 'govern' | 'indicator';

type ApiItem = {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST';
  source: string;
  format: 'JSON' | 'XML' | 'CSV';
  cache: string;
  status: '草稿' | '已发布' | '已停用';
  qps: number;
};

type CallLog = {
  id: string;
  api: string;
  app: string;
  result: '成功' | '未授权' | '超限拒绝' | '脱敏返回';
  latency: number;
  at: string;
  ip: string;
};

type IndItem = {
  id: string;
  name: string;
  theme: '医疗服务' | '公共卫生' | '人口监测';
  grain: string;
  source: string;
  formula: string;
  value: string;
  owner: string;
};

const apisSeed: ApiItem[] = [
  { id: 'API-01', name: '门诊人次查询', path: '/open/v1/outpatient/count', method: 'GET', source: 'dws.ads_op_daily', format: 'JSON', cache: '5m', status: '已发布', qps: 120 },
  { id: 'API-02', name: '患者主索引检索', path: '/open/v1/mpi/search', method: 'POST', source: 'dwd.dim_patient', format: 'JSON', cache: '1m', status: '已发布', qps: 80 },
  { id: 'API-03', name: '检验结果批量', path: '/open/v1/lab/batch', method: 'GET', source: 'dwd.fact_lab', format: 'CSV', cache: '关闭', status: '草稿', qps: 0 },
  { id: 'API-04', name: '公卫随访清单', path: '/open/v1/ph/followup', method: 'GET', source: 'dws.ph_followup', format: 'JSON', cache: '15m', status: '已发布', qps: 45 },
  { id: 'API-05', name: '床位占用 XML', path: '/open/v1/bed/occupancy', method: 'GET', source: 'dws.bed_occ', format: 'XML', cache: '2m', status: '已停用', qps: 0 },
];

const logsSeed: CallLog[] = [
  { id: 'L-9001', api: 'API-01', app: '医政驾驶舱', result: '成功', latency: 42, at: '14:21:08', ip: '10.12.3.21' },
  { id: 'L-9002', api: 'API-02', app: '未登记应用', result: '未授权', latency: 8, at: '14:21:02', ip: '10.88.1.9' },
  { id: 'L-9003', api: 'API-01', app: '基层报表', result: '超限拒绝', latency: 5, at: '14:20:55', ip: '10.12.8.44' },
  { id: 'L-9004', api: 'API-02', app: '预问诊', result: '脱敏返回', latency: 63, at: '14:20:40', ip: '10.12.3.18' },
  { id: 'L-9005', api: 'API-04', app: '公卫平台', result: '成功', latency: 51, at: '14:19:12', ip: '10.20.1.7' },
  { id: 'L-9006', api: 'API-01', app: '医政驾驶舱', result: '成功', latency: 38, at: '14:18:50', ip: '10.12.3.21' },
];

const indicators: IndItem[] = [
  { id: 'IND-R01', name: '门诊人次（日）', theme: '医疗服务', grain: '机构×日', source: 'dws.ads_op_daily · T+1', formula: 'COUNT(DISTINCT visit_id)', value: '18,642', owner: '医政科' },
  { id: 'IND-R02', name: '住院床位使用率', theme: '医疗服务', grain: '机构×日', source: 'dws.bed_occ · T+1', formula: '占用床日/开放床日', value: '86.4%', owner: '医政科' },
  { id: 'IND-R03', name: '高血压规范管理率', theme: '公共卫生', grain: '街镇×月', source: 'dws.ph_htn · T+1', formula: '规范管理数/在管数', value: '72.8%', owner: '公卫科' },
  { id: 'IND-R04', name: '疫苗接种及时率', theme: '公共卫生', grain: '机构×周', source: 'dws.ph_vac · T+1', formula: '及时接种/应接种', value: '94.1%', owner: '疾控' },
  { id: 'IND-R05', name: '常住人口监测数', theme: '人口监测', grain: '街镇×月', source: 'dws.pop_resident · T+1', formula: '去重 PID 计数', value: '128.6 万', owner: '人口监测办' },
  { id: 'IND-R06', name: '出生人口数', theme: '人口监测', grain: '区×月', source: 'dws.pop_birth · T+1', formula: 'COUNT(birth_id)', value: '1,286', owner: '妇幼' },
];

const toneOf = (s: string) => {
  if (['成功', '已发布', '脱敏返回'].includes(s)) return 'green';
  if (['草稿', '超限拒绝'].includes(s)) return 'amber';
  if (['未授权', '已停用'].includes(s)) return 'red';
  return 'slate';
};

/** A8 数据应用服务：API 工厂 · 服务治理 · 综合监管指标 */
export function DataAppServiceHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('factory');
  const [apis, setApis] = useState(apisSeed);
  const [logs, setLogs] = useState(logsSeed);
  const [q, setQ] = useState('');
  const [activeApi, setActiveApi] = useState<ApiItem | null>(apisSeed[0]);
  const [activeInd, setActiveInd] = useState<IndItem | null>(null);
  const [activeLog, setActiveLog] = useState<CallLog | null>(null);

  const [tableName, setTableName] = useState('dws.ads_op_daily');
  const [apiName, setApiName] = useState('门诊人次查询');
  const [format, setFormat] = useState('JSON');
  const [cache, setCache] = useState('5m');
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOut, setTestOut] = useState<string | null>(null);
  const [authApp, setAuthApp] = useState('医政驾驶舱');
  const [rateLimit, setRateLimit] = useState('100');
  const [maskOn, setMaskOn] = useState(true);
  const [theme, setTheme] = useState('');

  const filteredApis = useMemo(() => apis.filter((a) =>
    (a.id + a.name + a.path + a.source).toLowerCase().includes(q.toLowerCase())
  ), [apis, q]);

  const filteredInd = useMemo(() => indicators.filter((i) =>
    (!theme || i.theme === theme)
  ), [theme]);

  const published = apis.filter((a) => a.status === '已发布').length;
  const denyAuth = logs.filter((l) => l.result === '未授权').length;
  const denyLimit = logs.filter((l) => l.result === '超限拒绝').length;

  const generateApi = async () => {
    setGenerating(true);
    setTab('factory');
    setTestOut(null);
    await new Promise((r) => setTimeout(r, 900));
    const id = `API-${String(apis.length + 1).padStart(2, '0')}`;
    const path = `/open/v1/gen/${tableName.split('.').pop()}`;
    const row: ApiItem = {
      id,
      name: apiName || '零代码生成 API',
      path,
      method: 'GET',
      source: tableName,
      format: format as ApiItem['format'],
      cache,
      status: '草稿',
      qps: 0,
    };
    setApis((arr) => [row, ...arr]);
    setActiveApi(row);
    setGenerating(false);
    notify(`${id} 已零代码生成（${format} · 缓存 ${cache}），可在线测试`);
  };

  const testApi = async (deny?: 'auth' | 'limit' | null) => {
    if (!activeApi) return;
    setTesting(true);
    setTestOut(null);
    await new Promise((r) => setTimeout(r, 700));
    let result: CallLog['result'] = '成功';
    let body = '';
    if (deny === 'auth') {
      result = '未授权';
      body = '{\n  "code": 401,\n  "message": "应用未授权，拒绝访问"\n}';
    } else if (deny === 'limit') {
      result = '超限拒绝';
      body = '{\n  "code": 429,\n  "message": "超过限流阈值，请稍后重试"\n}';
    } else {
      result = maskOn ? '脱敏返回' : '成功';
      const sample =
        format === 'XML'
          ? '<rows><row><org>两江新区人民医院</org><cnt>1286</cnt></row></rows>'
          : format === 'CSV'
            ? 'org,cnt\n两江新区人民医院,1286'
            : '{\n  "code": 0,\n  "data": [{ "org": "两江新区人民医院", "cnt": 1286, "id_no": "5001**********1234" }],\n  "masked": ' + (maskOn ? 'true' : 'false') + '\n}';
      body = sample;
      if (activeApi.status === '草稿') {
        setApis((arr) => arr.map((a) => (a.id === activeApi.id ? { ...a, status: '已发布', qps: 12 } : a)));
        setActiveApi((a) => (a ? { ...a, status: '已发布', qps: 12 } : a));
      }
    }
    const log: CallLog = {
      id: `L-${9000 + logs.length + 1}`,
      api: activeApi.id,
      app: deny === 'auth' ? '未登记应用' : authApp,
      result,
      latency: deny ? 6 : 48,
      at: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      ip: '10.12.3.21',
    };
    setLogs((arr) => [log, ...arr]);
    setTestOut(body);
    setTesting(false);
    notify(deny === 'auth' ? '未授权拒绝 · 日志已记录' : deny === 'limit' ? '超限拒绝 · 日志已记录' : `测试通过 · ${activeApi.id} · 日志完整`);
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA APPLICATION SERVICE · A8"
        title="数据应用服务"
        desc="A8-01 零代码 API 生成/转换/缓存/测试 · A8-02 脱敏·授权·限流·监控 · A8-03 综合监管指标（T+1）可追溯。"
        actions={
          <>
            <Btn icon="store" onClick={() => go('/center/marketplace')}>开放集市</Btn>
            <Btn icon="chart" onClick={() => go('/bid/indicator-market')}>指标市场</Btn>
            <Btn icon="play" loading={testing} onClick={() => testApi(null)} disabled={!activeApi}>在线测试</Btn>
            <Btn variant="primary" icon="sparkles" loading={generating} onClick={generateApi}>零代码生成 API</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: 'API 工厂', d: '生成·转换·缓存·测试' },
          { n: '02', t: '服务治理', d: '脱敏·授权·限流·日志' },
          { n: '03', t: '监管指标', d: '口径与来源可追溯' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'factory' : i === 1 ? 'govern' : 'indicator') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 已发布 {published} · 拦截 {denyAuth + denyLimit}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="API 服务" value={String(apis.length)} unit="个" delta={`已发布 ${published}`} icon="code" tone="blue" onClick={() => setTab('factory')} />
        <StatCard label="未授权拒绝" value={String(denyAuth)} unit="次" delta="今日" icon="shieldalert" tone="red" onClick={() => setTab('govern')} />
        <StatCard label="超限拒绝" value={String(denyLimit)} unit="次" delta="限流生效" icon="zap" tone="amber" onClick={() => setTab('govern')} />
        <StatCard label="监管指标" value={String(indicators.length)} unit="项" delta="T+1 主题" icon="target" tone="green" onClick={() => setTab('indicator')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'factory', label: 'API 开发与测试', count: apis.length },
          { key: 'govern', label: 'API 服务治理', count: logs.length },
          { key: 'indicator', label: '综合监管指标', count: indicators.length },
        ]}
      />

      {tab === 'factory' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="零代码 API 工厂" subtitle="表单/多表查询 → 生成 · XML/JSON/CSV · 缓存">
              <div className="form-grid">
                <Field label="API 名称" required className="span-2">
                  <input className="input" value={apiName} onChange={(e) => setApiName(e.target.value)} />
                </Field>
                <Field label="源表 / 视图" required className="span-2">
                  <Select
                    value={tableName}
                    onChange={setTableName}
                    options={['dws.ads_op_daily', 'dwd.dim_patient', 'dwd.fact_lab', 'dws.ph_followup', 'dws.bed_occ']}
                  />
                </Field>
                <Field label="输出格式">
                  <Select value={format} onChange={setFormat} options={['JSON', 'XML', 'CSV']} />
                </Field>
                <Field label="缓存策略">
                  <Select value={cache} onChange={setCache} options={['关闭', '1m', '2m', '5m', '15m']} />
                </Field>
              </div>
              <div className="da-pipe mt-14">
                {['选表', '生成路由', '格式转换', '缓存策略', '在线测试'].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`da-pipe-node ${generating && i < 4 ? 'is-run' : ''}`}>
                      <em>0{i + 1}</em><strong>{s}</strong>
                    </div>
                    {i < 4 && <Icon name="arrowright" size={12} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="row-actions mt-14">
                <Btn variant="primary" icon="sparkles" loading={generating} onClick={generateApi}>生成 API</Btn>
                <Btn icon="play" loading={testing} onClick={() => testApi(null)} disabled={!activeApi}>测试当前 API</Btn>
                <span className="muted xs">验收：零代码生成并测试通过</span>
              </div>
            </Card>
            <Card title="测试控制台" subtitle={activeApi ? `${activeApi.id} · ${activeApi.path}` : '请选择或生成 API'}>
              {activeApi ? (
                <>
                  <KeyValue
                    cols={2}
                    items={[
                      { label: '方法', value: activeApi.method },
                      { label: '格式', value: activeApi.format },
                      { label: '缓存', value: activeApi.cache },
                      { label: '状态', value: <Badge tone={toneOf(activeApi.status)}>{activeApi.status}</Badge> },
                      { label: '源表', value: activeApi.source, wide: true },
                    ]}
                  />
                  <div className="da-console mt-14">
                    <div className="da-console-head">
                      <span>Response</span>
                      <Badge tone={testOut?.includes('401') ? 'red' : testOut?.includes('429') ? 'amber' : testOut ? 'green' : 'slate'}>
                        {testOut ? '已返回' : '待测试'}
                      </Badge>
                    </div>
                    <pre>{testOut || '// 点击「测试当前 API」查看返回'}</pre>
                  </div>
                </>
              ) : (
                <div className="empty-hint">生成或选择左侧 API 后可测试</div>
              )}
            </Card>
          </div>

          <Card className="mt-14" title="API 清单" subtitle="点击选中后测试" noPad actions={<SearchInput value={q} onChange={setQ} placeholder="搜索 API" width={180} />}>
            <div className="pad-h">
              <DataTable
                rows={filteredApis}
                pageSize={6}
                onRowClick={(r) => { setActiveApi(r); setTestOut(null); }}
                columns={[
                  { key: 'id', title: '编号', width: 72, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small className="mono">{r.path}</small></div> },
                  { key: 'method', title: '方法', width: 64, render: (r) => <Badge tone="slate">{r.method}</Badge> },
                  { key: 'format', title: '格式', width: 64 },
                  { key: 'cache', title: '缓存', width: 64 },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                  { key: 'qps', title: 'QPS', width: 60, align: 'right' },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'govern' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="脱敏 / 授权 / 限流" subtitle="验收：未授权拒绝、超限拒绝、日志完整">
              <div className="form-grid">
                <Field label="调用应用">
                  <Select value={authApp} onChange={setAuthApp} options={['医政驾驶舱', '基层报表', '公卫平台', '预问诊', '未登记应用']} />
                </Field>
                <Field label="限流阈值 (QPS)">
                  <Select value={rateLimit} onChange={setRateLimit} options={['50', '100', '200', '500']} />
                </Field>
                <Field label="身份证/手机号脱敏" className="span-2">
                  <Select value={maskOn ? '开启（中间位掩码）' : '关闭'} onChange={(v) => setMaskOn(v.startsWith('开启'))} options={['开启（中间位掩码）', '关闭']} />
                </Field>
                <Field label="IP 策略" className="span-2">
                  <Select value="白名单：10.12.0.0/16" onChange={() => {}} options={['白名单：10.12.0.0/16', '白名单：全区 VPN', '不限制']} />
                </Field>
              </div>
              <div className="row-actions mt-14">
                <Btn icon="play" loading={testing} onClick={() => testApi(null)}>正常调用</Btn>
                <Btn icon="shieldalert" loading={testing} onClick={() => testApi('auth')}>模拟未授权</Btn>
                <Btn icon="zap" loading={testing} onClick={() => testApi('limit')}>模拟超限</Btn>
              </div>
              <div className="info-note mt-14">
                <Icon name="shield" size={12} />
                <span>传输可加密（TLS）；敏感字段脱敏后落日志，完整调用链可审计。</span>
              </div>
            </Card>
            <Card title="调用监控" subtitle="今日">
              <div className="da-mon-kpis">
                <div><span>成功</span><strong className="text-green">{logs.filter((l) => l.result === '成功' || l.result === '脱敏返回').length}</strong></div>
                <div><span>未授权</span><strong className="text-red">{denyAuth}</strong></div>
                <div><span>超限</span><strong className="text-amber">{denyLimit}</strong></div>
                <div><span>P99</span><strong>86ms</strong></div>
              </div>
              <AreaChart
                data={[
                  { label: '10', value: 42 }, { label: '11', value: 58 }, { label: '12', value: 36 },
                  { label: '13', value: 64 }, { label: '14', value: 88 }, { label: '15', value: 72 },
                ]}
                height={140}
                color="#6755F5"
                suffix=" 次"
                valueName="调用量"
              />
            </Card>
          </div>

          <Card className="mt-14" title="调用日志" subtitle="完整留痕 · 可下钻" noPad>
            <div className="pad-h">
              <DataTable
                rows={logs}
                pageSize={6}
                onRowClick={(r) => setActiveLog(r)}
                columns={[
                  { key: 'id', title: '日志ID', width: 80, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'at', title: '时间', width: 80 },
                  { key: 'api', title: 'API', width: 72 },
                  { key: 'app', title: '应用', render: (r) => r.app },
                  { key: 'ip', title: 'IP', width: 110, render: (r) => <span className="mono-cell">{r.ip}</span> },
                  { key: 'latency', title: '耗时', width: 70, align: 'right', render: (r) => `${r.latency}ms` },
                  { key: 'result', title: '结果', width: 90, render: (r) => <Badge tone={toneOf(r.result)}>{r.result}</Badge> },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'indicator' && (
        <>
          <Card className="mt-14" title="医疗卫生综合监管主题" subtitle="基于 T+1 数据 · 医疗服务 / 公卫 / 人口监测">
            <div className="da-theme-row">
              {(['医疗服务', '公共卫生', '人口监测'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`da-theme ${theme === t ? 'is-on' : ''}`}
                  onClick={() => setTheme(theme === t ? '' : t)}
                >
                  <Icon name={t === '医疗服务' ? 'activity' : t === '公共卫生' ? 'shield' : 'users'} size={14} />
                  <strong>{t}</strong>
                  <small>{indicators.filter((i) => i.theme === t).length} 项指标</small>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid-2-1 mt-14">
            <Card title="监管指标清单" subtitle="验收：口径与数据来源可追溯" noPad actions={
              <Select value={theme} onChange={setTheme} options={['', '医疗服务', '公共卫生', '人口监测']} placeholder="全部主题" width={120} />
            }>
              <div className="pad-h">
                <DataTable
                  rows={filteredInd}
                  pageSize={6}
                  onRowClick={(r) => setActiveInd(r)}
                  columns={[
                    { key: 'id', title: '指标ID', width: 86, render: (r) => <span className="mono-cell">{r.id}</span> },
                    { key: 'name', title: '指标', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.grain}</small></div> },
                    { key: 'theme', title: '主题', width: 90, render: (r) => <Badge tone="slate">{r.theme}</Badge> },
                    { key: 'value', title: '最新值', width: 90, align: 'right', render: (r) => <span className="strong">{r.value}</span> },
                    { key: 'owner', title: '归口', width: 80 },
                  ]}
                />
              </div>
            </Card>
            <Card title="主题覆盖" subtitle="T+1 产出">
              <BarList
                items={[
                  { label: '医疗服务', value: indicators.filter((i) => i.theme === '医疗服务').length },
                  { label: '公共卫生', value: indicators.filter((i) => i.theme === '公共卫生').length },
                  { label: '人口监测', value: indicators.filter((i) => i.theme === '人口监测').length },
                ]}
                color="#059669"
              />
              <Btn className="mt-14 w-full" variant="secondary" icon="chart" onClick={() => go('/bid/indicator-market')}>打开指标市场</Btn>
            </Card>
          </div>
        </>
      )}

      <Drawer
        open={!!activeInd}
        onClose={() => setActiveInd(null)}
        width={560}
        title={activeInd?.name || ''}
        desc={activeInd?.id || ''}
        footer={<><Btn onClick={() => setActiveInd(null)}>关闭</Btn><Btn variant="primary" onClick={() => go('/bid/indicator-market')}>指标详情</Btn></>}
      >
        {activeInd && (
          <KeyValue
            cols={2}
            items={[
              { label: '主题', value: activeInd.theme },
              { label: '粒度', value: activeInd.grain },
              { label: '最新值', value: activeInd.value },
              { label: '归口', value: activeInd.owner },
              { label: '数据来源', value: activeInd.source, wide: true },
              { label: '口径公式', value: activeInd.formula, wide: true },
              { label: '追溯说明', value: '指标绑定 T+1 主题表与公式，支持血缘下钻至 ODS/DWD。', wide: true },
            ]}
          />
        )}
      </Drawer>

      <Drawer
        open={!!activeLog}
        onClose={() => setActiveLog(null)}
        width={480}
        title={activeLog?.id || ''}
        desc="调用审计明细"
        footer={<Btn onClick={() => setActiveLog(null)}>关闭</Btn>}
      >
        {activeLog && (
          <KeyValue
            cols={2}
            items={[
              { label: 'API', value: activeLog.api },
              { label: '应用', value: activeLog.app },
              { label: '结果', value: <Badge tone={toneOf(activeLog.result)}>{activeLog.result}</Badge> },
              { label: '耗时', value: `${activeLog.latency}ms` },
              { label: 'IP', value: activeLog.ip },
              { label: '时间', value: activeLog.at },
            ]}
          />
        )}
      </Drawer>
    </>
  );
}
