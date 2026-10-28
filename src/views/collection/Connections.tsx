import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { services as seedServices, channels as seedChannels, environment, hosts, Service, Channel } from '../../data';

const dbIcon: Record<string, string> = {
  mysql: 'database', oracle: 'database', tidb: 'database', sqlserver: 'database', postgresql: 'database',
  dameng: 'database', kingbase: 'database', opengauss: 'database', kafka: 'zap', pulsar: 'zap', doris: 'layers',
};
const typeLabel: Record<string, string> = {
  mysql: 'MySQL', oracle: 'Oracle', tidb: 'TiDB', sqlserver: 'SQL Server', postgresql: 'PostgreSQL',
  dameng: '达梦', kingbase: '人大金仓', opengauss: 'openGauss', kafka: 'Kafka', pulsar: 'Pulsar', doris: 'Doris 湖仓',
};
const ORGS = ['重医附二院', '两江医院', '渝北人民医院', '两江疾控', '两江妇幼'];

export function ServicesPage() {
  const { notify } = useApp();
  const [rows, setRows] = useState<Service[]>(seedServices);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [tab, setTab] = useState('components');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Service | null>(null);
  const [authTarget, setAuthTarget] = useState<Service | null>(null);
  const [authOrg, setAuthOrg] = useState('重医附二院');
  const [demoing, setDemoing] = useState(false);
  const [tested, setTested] = useState(false);
  const [replicaOk, setReplicaOk] = useState(false);
  const [mqOk, setMqOk] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  const filtered = rows.filter((r) => (!type || r.type === type) && (r.name + r.desc + (r.org || '')).toLowerCase().includes(q.toLowerCase()));
  const domestic = rows.filter((r) => ['dameng', 'kingbase', 'opengauss'].includes(r.type)).length;
  const mq = rows.filter((r) => r.category === 'mq').length;

  const demoAccept = async () => {
    setDemoing(true);
    setTab('components'); setType('dameng');
    const dm = rows.find((r) => r.type === 'dameng') || rows[0];
    notify(`① 国产库接入验证：${dm?.name || '达梦'} JDBC 连通`);
    setTested(true);
    await new Promise((r) => setTimeout(r, 400));
    setReplicaOk(true);
    notify('② 副本入湖可追溯已启用');
    await new Promise((r) => setTimeout(r, 350));
    setType('kafka'); setMqOk(true);
    notify('③ Kafka/Pulsar 实时捕获组件就绪');
    await new Promise((r) => setTimeout(r, 350));
    setTab('auth'); setAuthOk(true);
    if (dm) setAuthTarget(dm);
    notify('④ 机构授权：未授权不可获取连接 · 越权拦截可验');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="DATABASE COMPONENT ACCESS · A2-06"
        title="数据库组件接入"
        desc="验收：至少 3 类国产库 JDBC/ODBC 接入验证；副本入湖可追溯；Kafka/Pulsar 实时捕获。"
        actions={<><Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新增组件</Btn></>}
      />
      <div className="qc-accept">
        {[
          { n: '01', t: '国产库接入', d: '达梦/金仓/openGauss', on: tested },
          { n: '02', t: '副本入湖', d: '可追溯', on: replicaOk },
          { n: '03', t: '实时捕获', d: 'Kafka / Pulsar', on: mqOk },
          { n: '04', t: '机构授权', d: '越权拦截', on: authOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 国产库 {domestic} · MQ {mq}{authOk ? ' · 授权可验' : ''}</span>
      </div>
      <div className="stat-grid mt-14">
        <StatCard label="接入组件" value={rows.length.toString()} unit="个" delta={`国产库 ${domestic}`} icon="server" tone="blue" />
        <StatCard label="副本入湖" value={rows.filter((r) => r.replica).length.toString()} unit="个" delta="可追溯" icon="layers" tone="green" />
        <StatCard label="消息队列" value={String(mq)} unit="个" delta="Kafka / Pulsar" icon="zap" tone="violet" />
        <StatCard label="元数据完成" value={rows.filter((r) => r.metaStatus === '已完成').length.toString()} unit="个" delta="完成率高" icon="checkcircle" tone="cyan" />
      </div>

      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs
            variant="line"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'components', label: '组件清单', count: filtered.length },
              { key: 'auth', label: '源/端授权分配' },
              { key: 'capability', label: '接入能力' },
            ]}
          />
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="搜索组件、机构、说明" width={220} />
            <Select value={type} onChange={setType} options={['', 'dameng', 'kingbase', 'opengauss', 'mysql', 'oracle', 'sqlserver', 'kafka', 'pulsar', 'doris']} placeholder="全部类型" width={120} />
          </div>
        </div>

        {tab === 'components' && (
          <div className="pad-h">
            <DataTable
              rows={filtered}
              pageSize={8}
              columns={[
                { key: 'name', title: '组件名称', width: 220, render: (r) => <div className="service-name"><span className={`db-logo ${r.type}`}><Icon name={dbIcon[r.type] || 'database'} size={14} /></span><div className="cell-main"><strong>{r.name}</strong><small>{r.desc}</small></div></div> },
                { key: 'type', title: '类型', width: 100, render: (r) => <Badge tone={['dameng', 'kingbase', 'opengauss'].includes(r.type) ? 'green' : r.category === 'mq' ? 'violet' : 'slate'}>{typeLabel[r.type] || r.type}</Badge> },
                { key: 'connType', title: '接口', width: 70, render: (r) => <span className="mono-cell">{r.connType.toUpperCase()}</span> },
                { key: 'org', title: '归属机构', width: 100, render: (r) => r.org || '—' },
                { key: 'replica', title: '副本入湖', width: 80, render: (r) => r.replica ? <Badge tone="green">已启用</Badge> : <span className="muted">—</span> },
                { key: 'metaStatus', title: '元数据', width: 90, render: (r) => <Badge tone={r.metaStatus === '已完成' ? 'green' : 'cyan'} dot>{r.metaStatus}</Badge> },
                { key: 'auth', title: '已授权', width: 70, render: (r) => <span className="mono-cell">{(r.authorized || []).length}</span> },
                {
                  key: 'ops', title: '操作', width: 180,
                  render: (r) => (
                    <div className="row-actions">
                      <button className="link-btn" onClick={() => setEdit(r)}>编辑</button>
                      <button className="link-btn" onClick={() => { setAuthTarget(r); setAuthOrg((r.authorized || [])[0] || '重医附二院'); }}>授权</button>
                      <button className="link-muted" onClick={() => notify(`${r.name} 连接测试成功，延迟 26ms`)}>测试</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {tab === 'auth' && (
          <div className="pad-h">
            <div className="info-note"><Icon name="shield" size={13} /><span>按机构分配数据源 / 数据端访问权限；未授权机构用户不可获取连接信息。</span></div>
            <div className="mt-14">
              <DataTable
                rows={rows}
                pageSize={8}
                columns={[
                  { key: 'name', title: '组件', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.category === 'lake' ? '数据端' : r.category === 'mq' ? '消息通道' : '数据源'}</small></div> },
                  { key: 'org', title: '归属', width: 100, render: (r) => r.org || '—' },
                  { key: 'authorized', title: '已授权机构', render: (r) => <div className="tag-inline">{(r.authorized || []).map((o) => <Badge key={o} tone="slate">{o}</Badge>)}</div> },
                  { key: 'ops', title: '操作', width: 100, render: (r) => <button className="link-btn" onClick={() => { setAuthTarget(r); }}>调整授权</button> },
                ]}
              />
            </div>
          </div>
        )}

        {tab === 'capability' && (
          <div className="pad-h">
            <div className="grid grid-3">
              <Card title="国产数据库" subtitle="JDBC / ODBC 标准接口">
                <div className="meta-mini-list">
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>达梦 DM8</strong><em>已验证</em></div>
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>人大金仓</strong><em>已验证</em></div>
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>openGauss</strong><em>已验证</em></div>
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>MySQL / Oracle</strong><em>兼容</em></div>
                </div>
              </Card>
              <Card title="副本入湖" subtitle="保障安全可追溯">
                <p className="page-desc" style={{ margin: 0 }}>接入后可生成只读数据副本写入湖仓着陆区，保留源端位点与变更审计，支撑回放与追责。</p>
                <div className="info-note mt-14"><Icon name="layers" size={13} /><span>当前 {rows.filter((r) => r.replica).length} 个库已开启副本入湖。</span></div>
              </Card>
              <Card title="实时捕获" subtitle="Kafka / Pulsar">
                <div className="meta-mini-list">
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>Kafka CDC Topic</strong><em>运行中</em></div>
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>Pulsar 实时总线</strong><em>运行中</em></div>
                  <div><span className="ok"><Icon name="check" size={12} /></span><strong>入湖消费者组</strong><em>3 组</em></div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>

      <ServiceModal
        open={open || !!edit}
        onClose={() => { setOpen(false); setEdit(null); }}
        initial={edit}
        onSave={(s) => {
          if (edit) setRows((arr) => arr.map((x) => (x.id === edit.id ? { ...x, ...s } : x)));
          else setRows((arr) => [{ ...s, id: `S${Date.now()}`, modifier: 'dp_admin', modified: '2026-08-06 14:30', metaStatus: '同步中', category: 'db', replica: true, authorized: [] } as Service, ...arr]);
          setOpen(false); setEdit(null); notify(edit ? '组件配置已保存' : '数据库组件已接入，正在采集元数据');
        }}
      />

      <Modal
        open={!!authTarget}
        onClose={() => setAuthTarget(null)}
        title="数据源 / 数据端授权"
        desc={authTarget ? `${authTarget.name} · 仅授权机构可获取连接信息` : ''}
        width={520}
        footer={
          <>
            <Btn onClick={() => setAuthTarget(null)}>取消</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                if (!authTarget) return;
                setRows((arr) => arr.map((x) => {
                  if (x.id !== authTarget.id) return x;
                  const set = new Set(x.authorized || []);
                  set.add(authOrg);
                  return { ...x, authorized: [...set] };
                }));
                setAuthTarget(null);
                notify(`已授权 ${authOrg} 访问该组件`);
              }}
            >
             确认授权
            </Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="授权机构" required className="span-2"><Select value={authOrg} onChange={setAuthOrg} options={ORGS} /></Field>
          <Field label="当前已授权" className="span-2">
            <div className="tag-inline">{(authTarget?.authorized || []).length ? (authTarget?.authorized || []).map((o) => <Badge key={o} tone="blue">{o}</Badge>) : <span className="muted">暂无授权</span>}</div>
          </Field>
        </div>
      </Modal>
    </>
  );
}

function ServiceModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: Service | null; onSave: (s: Partial<Service>) => void }) {
  const { notify } = useApp();
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.desc || '');
  const [type, setType] = useState(initial?.type || 'dameng');
  const [connType, setConnType] = useState(initial?.connType || 'jdbc');
  const [replica, setReplica] = useState(initial?.replica ?? true);
  React.useEffect(() => {
    setName(initial?.name || ''); setDesc(initial?.desc || ''); setType(initial?.type || 'dameng'); setConnType(initial?.connType || 'jdbc'); setReplica(initial?.replica ?? true);
  }, [initial, open]);
  return (
    <Modal open={open} onClose={onClose} title={initial ? '编辑接入组件' : '新增数据库组件'} desc="注册数据源 / 消息队列 / 湖仓数据端，保存后自动采集元数据。" width={680}
      footer={<><Btn onClick={onClose}>取消</Btn><Btn onClick={() => notify('连接测试成功，延迟 28ms · 只读账号校验通过')}>测试连接</Btn><Btn variant="primary" onClick={() => onSave({ name: name || 'new_component', desc: desc || '新建接入组件', type, connType, replica, org: '重医附二院' })}>{initial ? '保存修改' : '确认接入'}</Btn></>}>
      <div className="form-grid">
        <Field label="组件名称" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：his_dm_prod_source" /></Field>
        <Field label="说明"><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="例如：HIS 达梦生产库" /></Field>
        <Field label="组件类型" required><Select value={type} onChange={setType} options={['dameng', 'kingbase', 'opengauss', 'mysql', 'oracle', 'sqlserver', 'postgresql', 'kafka', 'pulsar', 'doris']} /></Field>
        <Field label="接口标准"><Select value={connType} onChange={setConnType} options={['jdbc', 'odbc', 'mq', 'api']} /></Field>
        <Field label="主机地址" required><input className="input" placeholder="192.168.242.45" /></Field>
        <Field label="端口" required><input className="input" placeholder={type === 'kafka' ? '9092' : '5236'} /></Field>
        <Field label="库名 / Topic"><input className="input" placeholder="HISDB 或 cdc.his.patient" /></Field>
        <Field label="归属机构"><Select value="重医附二院" onChange={() => {}} options={ORGS} /></Field>
        <Field label="用户名"><input className="input" placeholder="readonly_cdc" /></Field>
        <Field label="密码"><input className="input" type="password" placeholder="••••••••" /></Field>
        <Field label="副本入湖" className="span-2"><Toggle checked={replica} onChange={setReplica} label={replica ? '已启用：生成可追溯数据副本' : '未启用'} /></Field>
      </div>
    </Modal>
  );
}

export function ChannelsPage() {
  const { go, notify } = useApp();
  const [rows, setRows] = useState<Channel[]>(seedChannels);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [edit, setEdit] = useState<Channel | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Channel | null>(null);
  const [busyId, setBusyId] = useState('');
  const [demoing, setDemoing] = useState(false);
  const [cfgOk, setCfgOk] = useState(false);
  const [toggleOk, setToggleOk] = useState(false);
  const [failOk, setFailOk] = useState(false);

  const filtered = rows.filter((r) =>
    (!type || r.type === type)
    && (!mode || r.deployMode === mode)
    && (r.name + r.source + r.target + (r.org || '')).toLowerCase().includes(q.toLowerCase())
  );

  const toggleRun = (ch: Channel, action: 'start' | 'stop') => {
    setBusyId(ch.id);
    window.setTimeout(() => {
      const fail = ch.id === 'C11' && action === 'start';
      setRows((arr) => {
        const next = arr.map((x) => {
          if (x.id !== ch.id) return x;
          if (fail) return { ...x, running: false, status: '启停失败', failReason: x.failReason || '前置节点网络单向策略未放行 9092 端口' };
          if (action === 'start') return { ...x, running: true, status: '正常', failReason: '' };
          return { ...x, running: false, status: '已暂停', failReason: '' };
        });
        setDetail((d) => (d && d.id === ch.id ? next.find((r) => r.id === ch.id) || d : d));
        return next;
      });
      setBusyId('');
      setToggleOk(true);
      if (fail) { setFailOk(true); notify(`启动失败：${ch.failReason || '前置网络未放行'}`, 'error'); }
      else notify(action === 'start' ? `${ch.name} 已启动` : `${ch.name} 已停止`);
    }, 700);
  };

  const demoAccept = async () => {
    setDemoing(true);
    setCfgOk(true); setMode('前置模式'); setType('CDC同步');
    notify('① CDC 配置：源端/表选择/路由/前置模式');
    await new Promise((r) => setTimeout(r, 400));
    const okCh = rows.find((r) => r.type.includes('CDC') && r.id !== 'C11') || rows[0];
    if (okCh) toggleRun(okCh, okCh.running ? 'stop' : 'start');
    await new Promise((r) => setTimeout(r, 800));
    const failCh = rows.find((r) => r.id === 'C11') || rows.find((r) => r.failReason);
    if (failCh) { toggleRun(failCh, 'start'); setFailOk(true); }
    notify('②③ 启停反馈 + 失败原因可追溯');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="CDC SYNC MANAGEMENT · A2-09/10"
        title="CDC 同步管理"
        desc="验收：同步配置可保存运行；启停成功率可演示，失败原因可追溯；前置/集中部署模式。"
        actions={
          <>
            <Btn icon="zap" loading={demoing || !!busyId} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="gauge" onClick={() => go('/collection/cdc-monitor')}>同步监控</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setEdit(null); setOpen(true); }}>新建同步任务</Btn>
          </>
        }
      />
      <div className="qc-accept">
        {[
          { n: '01', t: '同步配置', d: '源端·表·路由', on: cfgOk },
          { n: '02', t: '任务启停', d: '页面一键控制', on: toggleOk },
          { n: '03', t: '失败追溯', d: '原因可回看', on: failOk || rows.some((r) => !!r.failReason) },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 运行中 {rows.filter((r) => r.running).length} · 前置 {rows.filter((r) => r.deployMode === '前置模式').length}</span>
      </div>
      <div className="stat-grid mt-14">
        <StatCard label="同步任务" value={rows.length.toString()} unit="条" delta={`CDC ${rows.filter((r) => r.type.includes('CDC')).length}`} icon="cable" tone="blue" />
        <StatCard label="运行中" value={rows.filter((r) => r.running).length.toString()} unit="条" delta="可一键启停" icon="play" tone="green" />
        <StatCard label="前置模式" value={rows.filter((r) => r.deployMode === '前置模式').length.toString()} unit="条" delta="跨网单向" icon="network" tone="violet" />
        <StatCard label="启停失败" value={rows.filter((r) => r.status === '启停失败' || r.status === '异常').length.toString()} unit="条" delta="可查看原因" icon="circlealert" tone="amber" />
      </div>

      <div className="grid grid-2 mt-14">
        <Card title="部署模式说明" subtitle="对齐招标 CDC 前置 / 集中">
          <div className="meta-mini-list">
            <div><span className="ok"><Icon name="network" size={12} /></span><strong>前置模式</strong><em>源端网段部署采集程序，单向访问平台</em></div>
            <div><span className="ok"><Icon name="server" size={12} /></span><strong>集中模式</strong><em>平台侧直连源库网络集中部署</em></div>
          </div>
        </Card>
        <Card title="启停反馈" subtitle="失败原因可追溯">
          <ul className="feed-list">
            {rows.filter((r) => r.failReason).slice(0, 3).map((r) => (
              <li key={r.id}><span className="feed-ico red"><Icon name="circlealert" size={13} /></span><div><strong>{r.name}</strong><small>{r.failReason}</small></div></li>
            ))}
            {!rows.some((r) => r.failReason) && <li><span className="feed-ico green"><Icon name="checkcircle" size={13} /></span><div><strong>暂无启停失败</strong><small>全部任务反馈正常</small></div></li>}
          </ul>
        </Card>
      </div>

      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="搜索任务、源端、机构" width={230} />
            <Select value={type} onChange={setType} options={['', '静态数据', 'CDC同步', 'FlinkCDC同步']} placeholder="任务类型" width={130} />
            <Select value={mode} onChange={setMode} options={['', '前置模式', '集中模式']} placeholder="部署模式" width={120} />
          </div>
          <span className="table-note"><Icon name="shield" size={12} /> 启停结果实时回写任务状态</span>
        </div>
        <div className="pad-h">
          <DataTable
            rows={filtered}
            pageSize={8}
            onRowClick={(r) => setDetail(r)}
            columns={[
              { key: 'name', title: '任务名称', width: 170, render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.desc}</small></div> },
              { key: 'route', title: '源端 → 目标端', render: (r) => <div className="route-cell"><span className="mono">{r.source}</span><Icon name="arrowright" size={12} /><span className="mono target">{r.target}</span></div> },
              { key: 'type', title: '类型', width: 110, render: (r) => <Badge tone={r.type.includes('CDC') ? 'violet' : 'slate'}>{r.type}</Badge> },
              { key: 'deployMode', title: '部署模式', width: 90, render: (r) => <Badge tone={r.deployMode === '前置模式' ? 'blue' : 'cyan'}>{r.deployMode || '—'}</Badge> },
              { key: 'org', title: '机构', width: 100, render: (r) => r.org || '—' },
              { key: 'status', title: '状态', width: 88, render: (r) => <Badge tone={r.status === '正常' ? 'green' : r.status === '已暂停' ? 'slate' : r.status === '延迟' ? 'amber' : 'red'} dot>{r.status}</Badge> },
              {
                key: 'ops', title: '操作', width: 170,
                render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    {r.running
                      ? <button className="link-btn" disabled={busyId === r.id} onClick={() => toggleRun(r, 'stop')}>{busyId === r.id ? '停止中…' : '停止'}</button>
                      : <button className="link-btn" disabled={busyId === r.id} onClick={() => toggleRun(r, 'start')}>{busyId === r.id ? '启动中…' : '启动'}</button>}
                    <button className="link-btn" onClick={() => { setEdit(r); setOpen(true); }}>配置</button>
                    <button className="link-muted" onClick={() => setDetail(r)}>详情</button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <ChannelModal
        open={open}
        onClose={() => { setOpen(false); setEdit(null); }}
        initial={edit}
        onSave={(c) => {
          if (edit) setRows((arr) => arr.map((x) => (x.id === edit.id ? { ...x, ...c } : x)));
          else setRows((arr) => [{ ...c, id: `C${Date.now()}`, status: '已暂停', running: false, updated: '2026-08-06 14:30', owner: 'dp_admin' } as Channel, ...arr]);
          setOpen(false); setEdit(null); notify(edit ? '同步任务已保存' : '同步任务已创建，请启动');
        }}
      />

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        width={560}
        title={detail?.name || ''}
        desc={detail ? `${detail.deployMode} · ${detail.org || '—'}` : ''}
        footer={
          <>
            <Btn onClick={() => setDetail(null)}>关闭</Btn>
            {detail && (
              <Btn
                variant="primary"
                icon={detail.running ? 'pause' : 'play'}
                loading={busyId === detail.id}
                onClick={() => toggleRun(detail, detail.running ? 'stop' : 'start')}
              >
                {detail.running ? '停止任务' : '启动任务'}
              </Btn>
            )}
          </>
        }
      >
        {detail && (
          <>
            <KeyValue
              cols={2}
              items={[
                { label: '源端', value: <span className="mono">{detail.source}</span> },
                { label: '目标端', value: <span className="mono">{detail.target}</span> },
                { label: '任务类型', value: detail.type },
                { label: '部署模式', value: detail.deployMode || '—' },
                { label: '运行状态', value: <Badge tone={detail.running ? 'green' : 'slate'} dot>{detail.status}</Badge> },
                { label: '归属机构', value: detail.org || '—' },
              ]}
            />
            {detail.failReason && (
              <>
                <div className="divider-h" />
                <div className="info-note"><Icon name="circlealert" size={13} /><span>启停失败原因：{detail.failReason}</span></div>
              </>
            )}
            <div className="divider-h" />
            <div className="section-title-sm">部署拓扑</div>
            <div className="schema-map mt-10" style={{ flexWrap: 'wrap' }}>
              {detail.deployMode === '前置模式'
                ? <><span>源端网段 Agent</span><Icon name="arrowright" size={12} /><span>单向出网</span><Icon name="arrowright" size={12} /><span>平台 Kafka</span><Icon name="arrowright" size={12} /><span>湖仓</span></>
                : <><span>平台 Collector</span><Icon name="arrowright" size={12} /><span>直连源库</span><Icon name="arrowright" size={12} /><span>CDC 解析</span><Icon name="arrowright" size={12} /><span>湖仓</span></>}
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

function ChannelModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: Channel | null; onSave: (c: Partial<Channel>) => void }) {
  const { notify } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState('CDC同步');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [deployMode, setDeployMode] = useState<'前置模式' | '集中模式'>('前置模式');
  const [org, setOrg] = useState('重医附二院');
  React.useEffect(() => {
    setName(initial?.name || '');
    setType(initial?.type || 'CDC同步');
    setSource(initial?.source || '');
    setTarget(initial?.target || '');
    setDeployMode(initial?.deployMode || '前置模式');
    setOrg(initial?.org || '重医附二院');
  }, [initial, open]);
  return (
    <Modal open={open} onClose={onClose} title={initial ? '编辑同步任务' : '新建同步任务'} desc="定义数据源、数据端、表选择与部署模式；保存后可在列表启停。" width={700}
      footer={<><Btn onClick={onClose}>取消</Btn><Btn onClick={() => notify('源端连通性测试通过')}>测试连接</Btn><Btn variant="primary" onClick={() => onSave({ name: name || 'new_cdc_task', type, source: source || 'source_db', target: target || 'ods_target', desc: '新建 CDC 同步任务', deployMode, org })}>{initial ? '保存' : '创建任务'}</Btn></>}>
      <div className="channel-type-picker">
        {[
          { k: 'CDC同步', d: '数据库日志增量' }, { k: 'FlinkCDC同步', d: '实时流式同步' }, { k: '静态数据', d: '批量全量抽取' },
        ].map((t) => (
          <button key={t.k} className={type === t.k ? 'is-active' : ''} onClick={() => setType(t.k)}><strong>{t.k}</strong><span>{t.d}</span></button>
        ))}
      </div>
      <div className="form-grid mt-14">
        <Field label="任务名称" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：his_patient_cdc" /></Field>
        <Field label="归属机构" required><Select value={org} onChange={setOrg} options={ORGS} /></Field>
        <Field label="数据源" required><input className="input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="his_dm_prod_source" /></Field>
        <Field label="数据端" required><input className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="ods_his.patient" /></Field>
        <Field label="表选择策略"><Select value="按清单" onChange={() => {}} options={['按清单', '按正则', '整库']} /></Field>
        <Field label="路由策略"><Select value="直写 ODS" onChange={() => {}} options={['直写 ODS', '经 Kafka 再入湖', '着陆区+合并']} /></Field>
        <Field label="部署模式" required className="span-2">
          <div className="filter-bar">
            <Btn size="sm" variant={deployMode === '前置模式' ? 'primary' : 'secondary'} onClick={() => setDeployMode('前置模式')}>前置模式</Btn>
            <Btn size="sm" variant={deployMode === '集中模式' ? 'primary' : 'secondary'} onClick={() => setDeployMode('集中模式')}>集中模式</Btn>
          </div>
        </Field>
        <Field label="转换策略" className="span-2"><textarea className="textarea" rows={2} placeholder="字段映射 / 时区转换 / 软删除标记" /></Field>
      </div>
      <div className="info-note mt-14">
        <Icon name="circlealert" size={13} />
        <span>{deployMode === '前置模式' ? '前置模式：采集程序部署在源端网段，仅允许单向访问平台侧消息总线。' : '集中模式：平台侧采集服务直接访问源库网络，适合专线互通环境。'}</span>
      </div>
    </Modal>
  );
}

export function EnvironmentPage() {
  const { notify } = useApp();
  const [active, setActive] = useState(environment[0]);
  const components = [
    { name: '数据采集服务', version: '3.8.2', port: '8080', status: '运行中', nodes: 3 },
    { name: '任务调度服务', version: '3.8.2', port: '8081', status: '运行中', nodes: 2 },
    { name: '元数据服务', version: '3.8.0', port: '8082', status: '运行中', nodes: 1 },
    { name: '数据服务网关', version: '2.6.4', port: '8443', status: '运行中', nodes: 2 },
    { name: 'Web 应用', version: '3.8.2', port: '80', status: '运行中', nodes: 2 },
    { name: 'MySQL', version: '8.0.34', port: '3306', status: '运行中', nodes: 1 },
    { name: 'TiDB', version: '6.5.2', port: '4000', status: '运行中', nodes: 3 },
    { name: 'Redis', version: '7.0.11', port: '6379', status: '运行中', nodes: 3 },
    { name: 'Kafka', version: '3.4.0', port: '9092', status: '运行中', nodes: 3 },
    { name: 'ClickHouse', version: '23.3', port: '8123', status: '告警', nodes: 2 },
  ];
  return (
    <>
      <PageHeader eyebrow="SYSTEM ENVIRONMENT" title="系统环境" desc="管理生产、预发布与测试环境，查看平台组件版本、节点与运行状态。" actions={<><Btn icon="download" onClick={() => notify('环境巡检报告已生成')}>环境巡检</Btn><Btn variant="primary" icon="refresh" onClick={() => notify('已发起版本检查')}>版本检查</Btn></>} />
      <div className="env-grid">
        {environment.map((e) => (
          <button key={e.key} className={`env-card ${active.key === e.key ? 'is-active' : ''}`} onClick={() => setActive(e)}>
            <div className="env-head"><span className={`env-mark ${e.key}`}>{e.key === 'prod' ? 'PROD' : e.key === 'pre' ? 'PRE' : 'TEST'}</span><Badge tone="green" dot>{e.status}</Badge></div>
            <strong>{e.name}</strong>
            <p>{e.desc}</p>
            <div className="env-meta"><span><Icon name="server" size={11} /> {e.nodes} 节点</span><span><Icon name="box" size={11} /> {e.version}</span></div>
            <div className="env-foot"><span>运行 {e.since} 起</span><Icon name="arrowright" size={12} /></div>
          </button>
        ))}
      </div>
      <div className="grid grid-2-1 mt-14">
        <Card title={`${active.name} · 组件状态`} subtitle={`${active.version} · ${active.db}`} noPad actions={<Btn size="sm" icon="refresh" onClick={() => notify('组件状态已刷新')}>刷新</Btn>}>
          <div className="pad-h">
            <DataTable rows={components} pageSize={9} paginate={false} columns={[
              { key: 'name', title: '组件名称', render: (c) => <div className="flex center gap-6"><span className="comp-ico"><Icon name="box" size={12} /></span><strong className="fw-normal">{c.name}</strong></div> },
              { key: 'version', title: '版本', width: 100, render: (c) => <span className="mono-cell">{c.version}</span> },
              { key: 'port', title: '端口', width: 70, render: (c) => <span className="mono-cell">{c.port}</span> },
              { key: 'nodes', title: '节点', width: 60, align: 'center' },
              { key: 'status', title: '状态', width: 80, render: (c) => <Badge dot>{c.status}</Badge> },
            ]} />
          </div>
        </Card>
        <div className="stack">
          <Card title="环境概况">
            <KeyValue cols={1} items={[
              { label: '平台版本', value: active.version }, { label: '部署方式', value: 'Kubernetes 高可用集群' },
              { label: '数据库', value: active.db }, { label: '节点数量', value: `${active.nodes} 台` },
              { label: '运行时长', value: '186 天' },
            ]} />
          </Card>
          <Card title="资源使用">
            {[['CPU', 58, 'blue'], ['内存', 66, 'violet'], ['存储', 71, 'amber']].map(([l, v, t]) => (
              <div key={l as string} className="mb-10"><div className="resource-head"><span>{l}</span><strong>{v}%</strong></div><Progress value={v as number} tone={t as string} height={7} /></div>
            ))}
            <button className="link-btn mt-6" onClick={() => notify('资源监控已打开', 'info')}>查看详细资源监控 <Icon name="arrowright" size={11} /></button>
          </Card>
        </div>
      </div>
    </>
  );
}

export function HostsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<typeof hosts[0] | null>(null);
  const rows = hosts.filter((h) => (h.hostname + h.ip + h.role).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="HOSTS" title="主机信息" desc="监控采集节点与数据生产服务器的主机资源、运行状态与部署角色。" actions={<><Btn icon="refresh" onClick={() => notify('主机状态已刷新')}>刷新</Btn><Btn variant="primary" icon="plus" onClick={() => notify('主机接入向导已打开', 'info')}>接入主机</Btn></>} />
      <div className="stat-grid">
        <StatCard label="主机总数" value="8" unit="台" delta="在线 7 台" icon="server" tone="blue" />
        <StatCard label="平均 CPU" value="46.5" unit="%" delta="峰值 76%" icon="cpu" tone="violet" />
        <StatCard label="平均内存" value="57.8" unit="%" delta="峰值 82%" icon="memory" tone="cyan" />
        <StatCard label="平均磁盘" value="54.8" unit="%" delta="容量充足" icon="harddrive" tone="green" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索主机名、IP 或角色" width={260} /><Select value="" onChange={() => {}} options={['全部状态', '在线', '维护中', '离线']} placeholder="全部状态" width={100} /></div><span className="live-badge"><i /> 5 秒自动刷新</span></div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={8} onRowClick={(r) => setActive(r)} columns={[
            { key: 'hostname', title: '主机', render: (h) => <div className="host-cell"><span className="host-ico"><Icon name="server" size={14} /></span><div className="cell-main"><strong>{h.hostname}</strong><small>{h.ip} · {h.role}</small></div></div> },
            { key: 'cpu', title: 'CPU', width: 130, render: (h) => <div className="quality-cell"><Progress value={h.cpu} tone={h.cpu > 75 ? 'red' : h.cpu > 60 ? 'amber' : 'blue'} /><span>{h.cpu}%</span></div> },
            { key: 'mem', title: '内存', width: 130, render: (h) => <div className="quality-cell"><Progress value={h.mem} tone={h.mem > 80 ? 'red' : h.mem > 65 ? 'amber' : 'green'} /><span>{h.mem}%</span></div> },
            { key: 'disk', title: '磁盘', width: 130, render: (h) => <div className="quality-cell"><Progress value={h.disk} tone={h.disk > 75 ? 'amber' : 'blue'} /><span>{h.disk}%</span></div> },
            { key: 'uptime', title: '运行时长', width: 90, render: (h) => <span className="muted">{h.uptime}</span> },
            { key: 'status', title: '状态', width: 84, render: (h) => <Badge dot>{h.status}</Badge> },
            { key: 'ops', title: '操作', width: 90, render: (h) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); notify(`已打开 ${h.hostname} 的终端（演示）`, 'info'); }}>终端</button> },
          ]} />
        </div>
      </Card>
      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.hostname || ''} desc={active ? `${active.ip} · ${active.role}` : ''} width={620}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('已发起主机巡检')}>主机巡检</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>CPU</span><strong>{active.cpu}%</strong></div><div><span>内存</span><strong>{active.mem}%</strong></div><div><span>磁盘</span><strong>{active.disk}%</strong></div><div><span>状态</span><strong>{active.status}</strong></div></div>
          <div className="chart-headline mt-14"><div><strong>CPU 使用趋势</strong><span>近 24 小时</span></div><div className="chart-headline-sub">峰值 76% · 平均 46.5%</div></div>
          <AreaChart data={Array.from({ length: 12 }, (_, i) => ({ label: `${i * 2}:00`, value: 30 + Math.round(Math.sin(i / 2) * 12 + i * 1.8) }))} height={200} suffix="%" valueName="CPU" />
          <div className="divider-h" />
          <div className="section-title-sm">磁盘分区</div>
          <div className="table-wrap mt-10">
            <table className="data-table"><thead><tr><th>挂载点</th><th>文件系统</th><th>总容量</th><th>已使用</th><th>使用率</th></tr></thead><tbody>
              {[['/', 'ext4', '200 GB', '86 GB', '43%'], ['/data', 'xfs', '2 TB', '1.2 TB', '60%'], ['/backup', 'xfs', '4 TB', '2.1 TB', '53%']].map((r) => (
                <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Badge tone="blue">{r[4]}</Badge></td></tr>
              ))}
            </tbody></table>
          </div>
        </>}
      </Drawer>
    </>
  );
}
