'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { residents, residentVisits, residentLines, similarResidents } from '../../dataBid';

type HubTab = 'archive' | 'register' | 'ops';
type ArchiveTab = 'profile' | 'lines' | 'similar' | 'records';

type RegJob = { id: string; mode: '批量' | '接口'; domain: string; total: number; ok: number; status: '成功' | '运行中' | '失败'; at: string };
type MergeLog = { id: string; action: '合并' | '拆分'; master: string; slave: string; by: string; at: string; result: string };
type Account = { id: string; app: string; key: string; scope: string; status: '启用' | '停用'; qps: number };

const regJobsSeed: RegJob[] = [
  { id: 'REG-18', mode: '批量', domain: 'HIS 门诊', total: 12860, ok: 12842, status: '成功', at: '14:10' },
  { id: 'REG-17', mode: '接口', domain: '公卫建档', total: 420, ok: 418, status: '成功', at: '13:55' },
  { id: 'REG-16', mode: '批量', domain: '跨域 EMR', total: 2860, ok: 2801, status: '运行中', at: '13:40' },
  { id: 'REG-15', mode: '接口', domain: '基层卫生', total: 86, ok: 0, status: '失败', at: '12:08' },
];

const mergeLogsSeed: MergeLog[] = [
  { id: 'MG-41', action: '合并', master: 'P100248601', slave: 'P100248599', by: '张敏', at: '14:02', result: '已生效' },
  { id: 'MG-40', action: '拆分', master: 'P100248603', slave: 'P100248520', by: '李倩', at: '11:20', result: '误合并已拆分' },
  { id: 'MG-39', action: '合并', master: 'P100248602', slave: 'P100248588', by: '系统自动', at: '09:15', result: '证件完全匹配' },
];

const accounts: Account[] = [
  { id: 'ACC-01', app: 'HIS 注册服务', key: 'mpi_his_***', scope: '注册/查询', status: '启用', qps: 200 },
  { id: 'ACC-02', app: '公卫平台', key: 'mpi_ph_***', scope: '查询/订阅', status: '启用', qps: 80 },
  { id: 'ACC-03', app: '外部厂商测试', key: 'mpi_ext_***', scope: '查询', status: '停用', qps: 0 },
];

const auditRows = [
  { id: '1', time: '2026-08-06 14:20', user: '张敏', org: '两江新区人民医院', reason: '慢病随访', status: '正常调阅' },
  { id: '2', time: '2026-08-05 09:26', user: '李医生', org: '心血管内科', reason: '门诊接诊', status: '正常调阅' },
  { id: '3', time: '2026-08-01 16:40', user: '赵医生', org: '人和社区卫生服务中心', reason: '高血压随访', status: '正常调阅' },
  { id: '4', time: '2026-07-28 10:12', user: '王管理员', org: '数据治理办', reason: '质量核查', status: '已审批' },
];

/** B4 居民主索引：注册合并拆分 · 主档案▲ · 配置运维 */
export function MpiHubPage() {
  const { go, notify } = useApp();
  const [hub, setHub] = useState<HubTab>('archive');
  const [selected, setSelected] = useState(residents[0]);
  const [tab, setTab] = useState<ArchiveTab>('profile');
  const [q, setQ] = useState('');
  const [regJobs, setRegJobs] = useState(regJobsSeed);
  const [mergeLogs, setMergeLogs] = useState(mergeLogsSeed);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [threshold, setThreshold] = useState(80);
  const [linePri, setLinePri] = useState('HIS > EMR > 公卫 > 基层');
  const [activeMerge, setActiveMerge] = useState<MergeLog | null>(null);
  const [activeJob, setActiveJob] = useState<RegJob | null>(null);

  const results = useMemo(() => residents.filter((r) => !q || (r.id + r.name + r.idCard).includes(q)), [q]);

  const runRegister = async (mode: '批量' | '接口') => {
    setBusy(true);
    setHub('register');
    setRegisterOpen(false);
    await new Promise((r) => setTimeout(r, 900));
    const id = `REG-${18 + regJobs.length}`;
    const job: RegJob = {
      id, mode, domain: mode === '批量' ? 'HIS 增量批' : '跨域接口',
      total: mode === '批量' ? 860 : 42, ok: mode === '批量' ? 858 : 42,
      status: '成功', at: '14:22',
    };
    setRegJobs((arr) => [job, ...arr]);
    setBusy(false);
    notify(`${mode}注册完成 · ${job.ok}/${job.total} · 可归并跨条线档案`);
  };

  const doMerge = (slaveId: string) => {
    const row: MergeLog = {
      id: `MG-${41 + mergeLogs.length}`, action: '合并', master: selected.id, slave: slaveId,
      by: '张敏', at: '14:22', result: '已生效 · 可拆分',
    };
    setMergeLogs((arr) => [row, ...arr]);
    notify(`已合并 ${slaveId} → ${selected.id}，误合并可拆分`);
    setTab('similar');
    setHub('archive');
  };

  const doSplit = () => {
    setSplitOpen(false);
    const row: MergeLog = {
      id: `MG-${50 + mergeLogs.length}`, action: '拆分', master: selected.id, slave: 'P100248599',
      by: '张敏', at: '14:23', result: '误合并已拆分 · 原源保留',
    };
    setMergeLogs((arr) => [row, ...arr]);
    notify('拆分成功：原始来源档案已恢复独立主索引');
    setHub('register');
  };

  const runScan = async () => {
    setBusy(true);
    setHub('ops');
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    notify(`相似度扫描完成：阈值 ${threshold}% · 候选 128 对待确认`);
    setHub('archive');
    setTab('similar');
  };

  return (
    <>
      <PageHeader
        eyebrow="MASTER PATIENT INDEX · B4"
        title="居民主索引"
        desc="B4-01 注册/获取/合并拆分 · B4-02 主档案管理▲ · B4-03 相似度/条线/账号/接口运维。"
        actions={
          <>
            <Btn icon="boxes" onClick={() => go('/center/master-data')}>主数据管理</Btn>
            <Btn icon="git" onClick={() => setSplitOpen(true)}>拆分档案</Btn>
            <Btn icon="merge" onClick={() => { setHub('archive'); setTab('similar'); }}>合并档案</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setRegisterOpen(true)}>注册主索引</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '注册归并', d: '批量/接口·可拆分' },
          { n: '02', t: '主档案▲', d: '条线下钻·调阅留痕' },
          { n: '03', t: '配置运维', d: '相似度·账号·接口' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${hub === (['register', 'archive', 'ops'] as HubTab[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> MPI 128.6 万 · 阈值 {threshold}%</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="主索引人数" value="128.6" unit="万" delta="跨机构归并" icon="fingerprint" tone="violet" onClick={() => setHub('archive')} />
        <StatCard label="今日注册" value="1,286" unit="人" delta="批量+接口" icon="upload" tone="blue" onClick={() => setHub('register')} />
        <StatCard label="待合并" value="42" unit="对" delta={`相似度≥${threshold}%`} icon="merge" tone="amber" onClick={() => { setHub('archive'); setTab('similar'); }} />
        <StatCard label="调阅留痕" value="8,642" unit="次" delta="全程可审计" icon="scroll" tone="green" onClick={() => { setHub('archive'); setTab('records'); }} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={hub}
        onChange={(k) => setHub(k as HubTab)}
        items={[
          { key: 'archive', label: '主档案管理 ▲', count: residents.length },
          { key: 'register', label: '注册 / 合并拆分', count: regJobs.length },
          { key: 'ops', label: '配置与运维', count: accounts.length },
        ]}
      />

      {hub === 'archive' && (
        <>
          <div className="mpi-search mt-14">
            <div className="mpi-search-main">
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="输入主索引号、身份证号、姓名或就诊卡号" />
              <Btn variant="primary" onClick={() => notify(results.length ? `查询到 ${results.length} 条主档案（已脱敏）` : '未找到匹配档案')}>查询</Btn>
            </div>
            <div className="mpi-search-hint">
              示例：P100248601 / 5001**********12 / 张*华
              <span><Icon name="shield" size={12} /> 查询与调阅全程留痕</span>
            </div>
          </div>
          <div className="mpi-layout">
            <aside className="mpi-list">
              <div className="mpi-list-head"><span>查询结果</span><Badge tone="blue">{results.length} 条</Badge></div>
              {results.map((r) => (
                <button key={r.id} type="button" className={`mpi-item ${selected.id === r.id ? 'is-active' : ''}`} onClick={() => setSelected(r)}>
                  <span className="mpi-avatar">{r.name.slice(-1)}</span>
                  <div>
                    <strong>{r.name}<span>{r.gender} · {r.age} 岁</span></strong>
                    <small>{r.id} · {r.idCard}</small>
                    <em>{r.org}</em>
                  </div>
                  <Badge tone={r.status === '待合并' ? 'amber' : 'green'}>{r.status}</Badge>
                </button>
              ))}
              {results.length === 0 && <div className="empty" style={{ padding: 20 }}><p>未找到匹配档案</p></div>}
              <div className="mpi-list-foot"><Icon name="fingerprint" size={12} /> 主索引 1,286,420 人</div>
            </aside>
            <div className="mpi-main">
              <div className="mpi-profile-card">
                <div className="mpi-profile-left">
                  <span className="mpi-big-avatar">{selected.name.slice(-1)}</span>
                  <div>
                    <h2>{selected.name}<Badge tone="green" dot>主档案有效</Badge></h2>
                    <p>{selected.gender} · {selected.age} 岁 · {selected.idCard} · {selected.phone}</p>
                    <div className="tag-row">{selected.tags.map((t) => <Badge key={t} tone="violet">{t}</Badge>)}</div>
                  </div>
                </div>
                <div className="mpi-profile-stats">
                  <div><span>关联机构</span><strong>3</strong></div>
                  <div><span>业务条线</span><strong>5</strong></div>
                  <div><span>就诊记录</span><strong>62</strong></div>
                  <div><span>最近就诊</span><strong className="sm">{selected.last}</strong></div>
                </div>
                <div className="mpi-profile-actions">
                  <Btn size="sm" icon="activity" onClick={() => { notify('调阅申请已提交并留痕'); setTab('records'); }}>调阅数据</Btn>
                  <Btn size="sm" icon="git" onClick={() => setTab('similar')}>相似档案</Btn>
                </div>
              </div>
              <div className="mpi-tabs">
                <Tabs variant="line" value={tab} onChange={(k) => setTab(k as ArchiveTab)} items={[
                  { key: 'profile', label: '主档案' },
                  { key: 'lines', label: '业务条线', count: 5 },
                  { key: 'similar', label: '相似档案', count: 3 },
                  { key: 'records', label: '调阅记录' },
                ]} />
                <span className="muted xs">主索引 PID：{selected.id}</span>
              </div>
              {tab === 'profile' && (
                <div className="mpi-tab-body">
                  <div className="grid-2-1">
                    <Card title="基本信息" subtitle="跨机构主索引聚合 · 敏感字段已脱敏">
                      <KeyValue cols={2} items={[
                        { label: '姓名', value: selected.name }, { label: '性别', value: selected.gender },
                        { label: '年龄', value: `${selected.age} 岁` }, { label: '出生日期', value: '1968-04-12' },
                        { label: '身份证号', value: selected.idCard }, { label: '联系电话', value: selected.phone },
                        { label: '户籍地址', value: '重庆市两江新区人和街道', wide: true },
                        { label: '现居住地址', value: '重庆市两江新区大竹林街道', wide: true },
                        { label: '医保类型', value: '城镇职工基本医疗保险' }, { label: '建档机构', value: selected.org },
                      ]} />
                    </Card>
                    <Card title="健康画像" subtitle="标签与风险">
                      <div className="mpi-tags">{selected.tags.map((t) => <span key={t}><Icon name="tags" size={11} />{t}</span>)}</div>
                      <div className="divider-h" />
                      <div className="mpi-risk">
                        <div><span>慢病风险</span><strong className="text-amber">中</strong></div>
                        <div><span>就诊频次</span><strong>12 次/年</strong></div>
                        <div><span>费用水平</span><strong>较高</strong></div>
                      </div>
                    </Card>
                  </div>
                  <Card className="mt-14" title="就诊时间线" subtitle="跨机构 · 可下钻调阅">
                    <div className="mpi-timeline">
                      {residentVisits.map((v) => (
                        <div key={v.time + v.org} className="mpi-visit">
                          <div className="mv-time"><strong>{v.time}</strong><span>{v.type}</span></div>
                          <div className="mv-dot" />
                          <div className="mv-body"><div><strong>{v.org}</strong><Badge tone="slate">{v.dept}</Badge></div><p>{v.diag} · {v.doctor}</p></div>
                          <button type="button" className="link-muted" onClick={() => { notify('调阅已留痕'); setTab('records'); }}>调阅</button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
              {tab === 'lines' && (
                <Card title="业务条线" subtitle="各源系统档案 · 可下钻" noPad>
                  <div className="pad-h">
                    <DataTable rows={residentLines} pageSize={5} paginate={false} columns={[
                      { key: 'system', title: '业务条线', render: (l) => <div className="cell-main"><strong>{l.system}</strong><small>主键：{l.key}</small></div> },
                      { key: 'records', title: '记录数', width: 90, align: 'right', render: (l) => <span className="mono-cell">{l.records}</span> },
                      { key: 'last', title: '最近同步', width: 150, render: (l) => <span className="muted">{l.last}</span> },
                      { key: 'status', title: '状态', width: 90, render: (l) => <Badge dot>{l.status}</Badge> },
                      { key: 'ops', title: '操作', width: 90, render: () => <button type="button" className="link-btn" onClick={() => notify('条线档案已打开并留痕', 'info')}>下钻</button> },
                    ]} />
                  </div>
                </Card>
              )}
              {tab === 'similar' && (
                <div className="grid-2-1">
                  <Card title="相似档案" subtitle={`阈值 ${threshold}%`} noPad>
                    <div className="pad-h">
                      <DataTable rows={similarResidents} pageSize={3} paginate={false} columns={[
                        { key: 'name', title: '姓名', width: 70 },
                        { key: 'id', title: '主索引', render: (s) => <span className="mono-cell">{s.id}</span> },
                        { key: 'score', title: '相似度', width: 110, render: (s) => <div className="quality-cell"><Progress value={s.score} tone={s.score > 90 ? 'red' : 'amber'} /><span>{s.score}%</span></div> },
                        { key: 'org', title: '机构', width: 150 },
                        { key: 'diff', title: '差异', width: 100 },
                        { key: 'ops', title: '操作', width: 100, render: (s) => (
                          <div className="row-actions">
                            <button type="button" className="link-btn" onClick={() => doMerge(s.id)}>合并</button>
                            <button type="button" className="link-muted" onClick={() => notify('已忽略')}>忽略</button>
                          </div>
                        ) },
                      ]} />
                    </div>
                  </Card>
                  <Card title="合并规则" subtitle="自动 + 人工 · 可拆分">
                    <div className="check-list vertical">
                      <div><span className="ok"><Icon name="check" size={12} /></span><div><strong>完全匹配自动合并</strong><small>证件号 + 姓名 + 出生日期</small></div></div>
                      <div><span className="warn"><Icon name="alert" size={12} /></span><div><strong>不完全匹配人工确认</strong><small>相似度 ≥ {threshold}%</small></div></div>
                      <div><span className="ok"><Icon name="check" size={12} /></span><div><strong>误合并可拆分</strong><small>保留操作日志与原始来源</small></div></div>
                    </div>
                    <Btn className="mt-10" size="sm" icon="git" onClick={() => setSplitOpen(true)}>执行拆分</Btn>
                  </Card>
                </div>
              )}
              {tab === 'records' && (
                <Card title="调阅记录" subtitle="谁在何时因何调阅 · 留痕" noPad>
                  <div className="pad-h">
                    <DataTable rows={auditRows} pageSize={4} paginate={false} columns={[
                      { key: 'time', title: '调阅时间', width: 150, render: (r) => <span className="mono-cell">{r.time}</span> },
                      { key: 'user', title: '调阅人', width: 90 },
                      { key: 'org', title: '所属机构', width: 180 },
                      { key: 'reason', title: '事由' },
                      { key: 'status', title: '状态', width: 90, render: (r) => <Badge tone={r.status === '已审批' ? 'blue' : 'green'}>{r.status}</Badge> },
                    ]} />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {hub === 'register' && (
        <>
          <div className="grid-2-1 mt-14">
            <Card title="注册任务" subtitle="批量 / 接口 · 跨域主索引" noPad actions={
              <Btn size="sm" icon="plus" loading={busy} onClick={() => setRegisterOpen(true)}>新建注册</Btn>
            }>
              <div className="pad-h">
                <DataTable rows={regJobs} pageSize={5} onRowClick={(r) => setActiveJob(r)} columns={[
                  { key: 'id', title: '任务', width: 78, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'mode', title: '方式', width: 64, render: (r) => <Badge tone={r.mode === '批量' ? 'blue' : 'violet'}>{r.mode}</Badge> },
                  { key: 'domain', title: '来源域', render: (r) => r.domain },
                  { key: 'ok', title: '成功/总数', width: 110, render: (r) => <span className="mono-cell">{r.ok}/{r.total}</span> },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '成功' ? 'green' : r.status === '失败' ? 'red' : 'amber'}>{r.status}</Badge> },
                  { key: 'at', title: '时间', width: 60, render: (r) => <span className="muted">{r.at}</span> },
                ]} />
              </div>
            </Card>
            <Card title="获取主索引" subtitle="按证件 / 卡号查询">
              <div className="form-grid">
                <Field label="证件类型"><Select value="身份证" onChange={() => {}} options={['身份证', '护照', '港澳台通行证']} /></Field>
                <Field label="证件号"><input className="input mono" placeholder="5001**********12" /></Field>
                <Field label="就诊卡号" className="span-2"><input className="input mono" placeholder="CARD-****" /></Field>
              </div>
              <Btn className="mt-10" size="sm" variant="primary" icon="search" onClick={() => { setHub('archive'); setQ('P100248601'); notify('已获取主索引 P100248601（脱敏返回）'); }}>获取</Btn>
            </Card>
          </div>
          <Card className="mt-14" title="合并 / 拆分日志" subtitle="同一居民多条线可归并 · 误合并可拆分" noPad>
            <div className="pad-h">
              <DataTable rows={mergeLogs} pageSize={5} onRowClick={(r) => setActiveMerge(r)} columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'action', title: '动作', width: 64, render: (r) => <Badge tone={r.action === '合并' ? 'violet' : 'amber'}>{r.action}</Badge> },
                { key: 'master', title: '主索引', width: 110, render: (r) => <span className="mono-cell">{r.master}</span> },
                { key: 'slave', title: '从索引', width: 110, render: (r) => <span className="mono-cell">{r.slave}</span> },
                { key: 'by', title: '操作人', width: 80 },
                { key: 'result', title: '结果' },
                { key: 'at', title: '时间', width: 60, render: (r) => <span className="muted">{r.at}</span> },
              ]} />
            </div>
          </Card>
        </>
      )}

      {hub === 'ops' && (
        <>
          <div className="grid grid-2 mt-14">
            <Card title="相似度配置" subtitle="扫描阈值与规则" actions={
              <Btn size="sm" icon="scan" loading={busy} onClick={runScan}>执行扫描</Btn>
            }>
              <div className="mpi-ops-slider">
                <div className="resource-head"><span>相似度阈值</span><strong>{threshold}%</strong></div>
                <input type="range" min={70} max={95} value={threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ accentColor: '#6755F5', width: '100%' }} />
                <small>低于阈值自动忽略；高于阈值进入人工确认</small>
              </div>
              <div className="divider-h" />
              <Field label="条线优先级">
                <Select value={linePri} onChange={setLinePri} options={[
                  'HIS > EMR > 公卫 > 基层',
                  '公卫 > HIS > EMR > 基层',
                  'EMR > HIS > 公卫 > 基层',
                ]} />
              </Field>
              <Btn className="mt-10" size="sm" variant="primary" onClick={() => notify('相似度与条线优先级已保存')}>保存配置</Btn>
            </Card>
            <Card title="扩展 / 标签 / 可视化">
              <div className="md-cap-list">
                {[
                  { t: '扩展信息', d: '联系人、医保、居住史可挂载主档' },
                  { t: '标签库', d: '与标签看板贯通，支持人群分群' },
                  { t: '可视化', d: '归并关系、条线覆盖可图示' },
                  { t: '接口管理', d: '注册/查询/合并/订阅 API' },
                ].map((c) => (
                  <div key={c.t}><Icon name="checkcircle" size={13} /><div><strong>{c.t}</strong><small>{c.d}</small></div></div>
                ))}
              </div>
              <div className="row-actions mt-10">
                <Btn size="sm" icon="tags" onClick={() => go('/bid/tag-board')}>标签看板</Btn>
                <Btn size="sm" icon="network" onClick={() => notify('MPI 关系可视化已打开', 'info')}>可视化</Btn>
              </div>
            </Card>
          </div>
          <div className="grid-2-1 mt-14">
            <Card title="接入账号" subtitle="应用密钥与限额" noPad>
              <div className="pad-h">
                <DataTable rows={accounts} pageSize={4} columns={[
                  { key: 'app', title: '应用', render: (a) => <div className="cell-main"><strong>{a.app}</strong><small className="mono-cell">{a.key}</small></div> },
                  { key: 'scope', title: '范围', width: 100 },
                  { key: 'qps', title: 'QPS', width: 60, align: 'right' },
                  { key: 'status', title: '状态', width: 72, render: (a) => <Badge dot tone={a.status === '启用' ? 'green' : 'red'}>{a.status}</Badge> },
                ]} />
              </div>
            </Card>
            <Card title="接口清单" subtitle="MPI OpenAPI">
              <div className="mpi-api-list">
                {[
                  { m: 'POST', p: '/mpi/v1/register', d: '注册/批量注册' },
                  { m: 'GET', p: '/mpi/v1/query', d: '按证件/卡号获取' },
                  { m: 'POST', p: '/mpi/v1/merge', d: '合并主索引' },
                  { m: 'POST', p: '/mpi/v1/split', d: '拆分主索引' },
                ].map((a) => (
                  <div key={a.p}>
                    <Badge tone="slate">{a.m}</Badge>
                    <code>{a.p}</code>
                    <small>{a.d}</small>
                  </div>
                ))}
              </div>
              <Btn className="mt-10 w-full" size="sm" icon="download" onClick={() => notify('接口文档与调用日志已导出')}>导出接口/日志</Btn>
            </Card>
          </div>
        </>
      )}

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="注册主索引" desc="支持批量文件与接口实时注册。" width={520}
        footer={
          <>
            <Btn onClick={() => setRegisterOpen(false)}>取消</Btn>
            <Btn icon="upload" loading={busy} onClick={() => runRegister('批量')}>批量注册</Btn>
            <Btn variant="primary" loading={busy} onClick={() => runRegister('接口')}>接口注册</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="来源系统"><Select value="HIS" onChange={() => {}} options={['HIS', 'EMR', '公卫', '基层']} /></Field>
          <Field label="注册域"><Select value="本域" onChange={() => {}} options={['本域', '跨域']} /></Field>
          <Field label="批量文件" className="span-2"><div className="upload-box small"><Icon name="uploadcloud" size={16} /><strong>上传 CSV / Excel</strong><span>含证件号、姓名、出生日期</span></div></Field>
        </div>
      </Modal>

      <Modal open={splitOpen} onClose={() => setSplitOpen(false)} title="拆分主索引" desc="误合并可拆分，保留原始来源与操作日志。" width={480}
        footer={
          <>
            <Btn onClick={() => setSplitOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={doSplit}>确认拆分</Btn>
          </>
        }
      >
        <KeyValue cols={1} items={[
          { label: '当前主索引', value: <span className="mono">{selected.id}</span> },
          { label: '拟拆出', value: <span className="mono">P100248599</span> },
          { label: '说明', value: '拆分后双方恢复独立档案，历史合并日志保留可审计。' },
        ]} />
      </Modal>

      <Drawer open={!!activeJob} onClose={() => setActiveJob(null)} title={activeJob?.id || ''} desc={activeJob?.domain} width={420}
        footer={<Btn onClick={() => setActiveJob(null)}>关闭</Btn>}>
        {activeJob && (
          <KeyValue cols={2} items={[
            { label: '方式', value: activeJob.mode },
            { label: '状态', value: <Badge>{activeJob.status}</Badge> },
            { label: '成功', value: String(activeJob.ok) },
            { label: '总数', value: String(activeJob.total) },
          ]} />
        )}
      </Drawer>

      <Drawer open={!!activeMerge} onClose={() => setActiveMerge(null)} title={activeMerge ? `${activeMerge.action} ${activeMerge.id}` : ''} width={420}
        footer={<Btn onClick={() => setActiveMerge(null)}>关闭</Btn>}>
        {activeMerge && (
          <KeyValue cols={1} items={[
            { label: '主', value: <span className="mono">{activeMerge.master}</span> },
            { label: '从', value: <span className="mono">{activeMerge.slave}</span> },
            { label: '操作人', value: activeMerge.by },
            { label: '结果', value: activeMerge.result },
          ]} />
        )}
      </Drawer>
    </>
  );
}
