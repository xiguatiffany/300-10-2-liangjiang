'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { roles, users } from '../../data';

type TabKey = 'org' | 'catalog' | 'ops';

type OrgNode = { id: string; name: string; kind: '集团' | '医院' | '院区' | '科室'; parent?: string; staff: number; apps: number };
type StaffRow = { id: string; name: string; org: string; dept: string; role: string; status: '在职' | '停用' };
type TodoPush = { id: string; title: string; to: string; channel: '站内' | '短信' | '企微'; status: '已推送' | '待推送' | '失败'; at: string };
type StdItem = {
  id: string; name: string; domain: '药品' | '诊疗材料' | '医嘱' | '疾病' | '数据字典';
  source: '云标准' | '机构扩展'; ver: string; status: '已发布' | '待审核' | '驳回'; applicant: string;
};
type ReleaseRow = { id: string; service: string; ver: string; action: '发布' | '更新' | '回滚'; status: '成功' | '进行中' | '失败'; at: string };
type TraceSpan = { id: string; service: string; span: string; ms: number; status: 'OK' | 'ERROR' };

const orgs: OrgNode[] = [
  { id: 'ORG-ROOT', name: '两江智慧健康集团', kind: '集团', staff: 12860, apps: 18 },
  { id: 'ORG-RJ', name: '两江新区人民医院', kind: '医院', parent: 'ORG-ROOT', staff: 4200, apps: 12 },
  { id: 'ORG-FY', name: '两江妇幼保健院', kind: '医院', parent: 'ORG-ROOT', staff: 1860, apps: 8 },
  { id: 'CAMP-A', name: '江南院区', kind: '院区', parent: 'ORG-RJ', staff: 2600, apps: 10 },
  { id: 'CAMP-B', name: '礼嘉院区', kind: '院区', parent: 'ORG-RJ', staff: 1600, apps: 8 },
  { id: 'DEPT-NK', name: '内科', kind: '科室', parent: 'CAMP-A', staff: 186, apps: 4 },
  { id: 'DEPT-WK', name: '外科', kind: '科室', parent: 'CAMP-A', staff: 142, apps: 3 },
  { id: 'DEPT-MZ', name: '门诊部', kind: '科室', parent: 'CAMP-B', staff: 96, apps: 3 },
];

const staffSeed: StaffRow[] = [
  { id: 'U-01', name: '张敏', org: '两江新区人民医院', dept: '信息中心', role: '数据管理员', status: '在职' },
  { id: 'U-02', name: '刘一鸣', org: '两江新区人民医院', dept: '医保办', role: '业务分析师', status: '在职' },
  { id: 'U-03', name: '王思远', org: '两江妇幼保健院', dept: '医务科', role: '业务分析师', status: '在职' },
  { id: 'U-04', name: '周宁', org: '两江新区人民医院', dept: '江南院区·内科', role: '科室用户', status: '在职' },
  { id: 'U-05', name: '陈研', org: '两江新区人民医院', dept: '科研处', role: '只读访客', status: '停用' },
];

const todos: TodoPush[] = [
  { id: 'TD-01', title: '资产发布审核', to: '数据治理办', channel: '站内', status: '已推送', at: '14:20' },
  { id: 'TD-02', title: '开放资源申请', to: '张敏', channel: '企微', status: '已推送', at: '14:05' },
  { id: 'TD-03', title: '角色权限复核', to: '安全管理员', channel: '站内', status: '待推送', at: '—' },
  { id: 'TD-04', title: '标准扩展审核', to: '药学部', channel: '短信', status: '失败', at: '13:40' },
];

const stdSeed: StdItem[] = [
  { id: 'STD-YP-01', name: '国家药品目录（云）', domain: '药品', source: '云标准', ver: 'V2026.3', status: '已发布', applicant: '—' },
  { id: 'STD-ZL-01', name: '医疗服务项目目录（云）', domain: '诊疗材料', source: '云标准', ver: 'V2026.1', status: '已发布', applicant: '—' },
  { id: 'STD-YZ-01', name: '医嘱标准术语（云）', domain: '医嘱', source: '云标准', ver: 'V2.4', status: '已发布', applicant: '—' },
  { id: 'STD-JB-01', name: 'ICD-10 疾病分类（云）', domain: '疾病', source: '云标准', ver: 'V2.0', status: '已发布', applicant: '—' },
  { id: 'STD-ZD-01', name: '平台数据字典（云）', domain: '数据字典', source: '云标准', ver: 'V3.1', status: '已发布', applicant: '—' },
  { id: 'STD-YP-EX', name: '院内协定药品扩展', domain: '药品', source: '机构扩展', ver: 'V1.2', status: '待审核', applicant: '药学部' },
  { id: 'STD-ZL-EX', name: '两江特色诊疗项目', domain: '诊疗材料', source: '机构扩展', ver: 'V1.0', status: '待审核', applicant: '医务科' },
  { id: 'STD-ZD-EX', name: '基层表单值域扩展', domain: '数据字典', source: '机构扩展', ver: 'V0.9', status: '驳回', applicant: '基层卫生' },
];

const monitors = [
  { name: 'CPU', value: 42, unit: '%' },
  { name: '内存', value: 68, unit: '%' },
  { name: 'JVM Heap', value: 61, unit: '%' },
  { name: 'Redis', value: 34, unit: '%' },
  { name: 'Nginx', value: 28, unit: '%' },
  { name: '数据库', value: 55, unit: '%' },
];

const releases: ReleaseRow[] = [
  { id: 'RL-118', service: 'open-gateway', ver: '3.8.2', action: '发布', status: '成功', at: '10-27 02:18' },
  { id: 'RL-117', service: 'biz-auth', ver: '2.4.1', action: '更新', status: '成功', at: '10-26 22:40' },
  { id: 'RL-116', service: 'std-catalog', ver: '1.6.0', action: '发布', status: '进行中', at: '10-28 14:10' },
  { id: 'RL-115', service: 'task-push', ver: '1.3.4', action: '回滚', status: '成功', at: '10-25 19:02' },
  { id: 'RL-114', service: 'portal-bff', ver: '3.8.1', action: '更新', status: '失败', at: '10-24 11:20' },
];

const traces: TraceSpan[] = [
  { id: 'TR-1', service: 'portal-bff', span: 'GET /home', ms: 42, status: 'OK' },
  { id: 'TR-2', service: 'biz-auth', span: 'POST /token', ms: 28, status: 'OK' },
  { id: 'TR-3', service: 'std-catalog', span: 'GET /drugs', ms: 86, status: 'OK' },
  { id: 'TR-4', service: 'open-gateway', span: 'GET /mpi', ms: 210, status: 'ERROR' },
];

const cpuTrend = [
  { label: '10', value: 38 }, { label: '11', value: 44 }, { label: '12', value: 52 },
  { label: '13', value: 48 }, { label: '14', value: 61 }, { label: '15', value: 55 }, { label: '16', value: 42 },
];

/** C1 业务中台基础支撑：组织权限 · 统一标准目录 · 统一运维 */
export function BizFoundationHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('org');
  const [orgId, setOrgId] = useState('ORG-RJ');
  const [staffQ, setStaffQ] = useState('');
  const [stdDomain, setStdDomain] = useState('');
  const [stdQ, setStdQ] = useState('');
  const [stds, setStds] = useState(stdSeed);
  const [activeStd, setActiveStd] = useState<StdItem | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [relRows, setRelRows] = useState(releases);
  const [deployBusy, setDeployBusy] = useState(false);

  const activeOrg = orgs.find((o) => o.id === orgId) || orgs[1];
  const childOrgs = orgs.filter((o) => o.parent === orgId);

  const staffRows = useMemo(() => staffSeed.filter((s) =>
    (s.name + s.dept + s.role).toLowerCase().includes(staffQ.toLowerCase())
  ), [staffQ]);

  const stdRows = useMemo(() => stds.filter((s) =>
    (!stdDomain || s.domain === stdDomain)
    && (s.name + s.id + s.applicant).toLowerCase().includes(stdQ.toLowerCase())
  ), [stds, stdDomain, stdQ]);

  const approveStd = (id: string, ok: boolean) => {
    setStds((arr) => arr.map((s) => s.id === id ? { ...s, status: ok ? '已发布' : '驳回' } : s));
    notify(ok ? '机构扩展已审核通过 · 并入目录' : '扩展申请已驳回');
    setActiveStd(null);
  };

  const deploy = async (action: '发布' | '回滚') => {
    setDeployBusy(true);
    setTab('ops');
    await new Promise((r) => setTimeout(r, 800));
    setRelRows((arr) => [{
      id: `RL-${120 + arr.length}`, service: 'std-catalog', ver: action === '发布' ? '1.6.1' : '1.5.9',
      action, status: '成功', at: '刚刚',
    }, ...arr]);
    setDeployBusy(false);
    notify(`${action}完成 · 服务自动化流水线成功`);
  };

  return (
    <>
      <PageHeader
        eyebrow="BIZ FOUNDATION · C1"
        title="基础支撑"
        desc="C1-01 组织与权限 · C1-02 统一标准目录 · C1-03 统一运维（监控·追踪·发布回滚）。"
        actions={
          <>
            <Btn icon="users" onClick={() => go('/admin/users')}>用户管理</Btn>
            <Btn icon="usercog" onClick={() => go('/admin/roles')}>角色管理</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setTab('catalog'); setApplyOpen(true); }}>申请标准扩展</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '组织与权限', d: '多机构·多角色' },
          { n: '02', t: '标准目录', d: '云标准+审核' },
          { n: '03', t: '统一运维', d: '监控·发布·回滚' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['org', 'catalog', 'ops'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {orgs.filter((o) => o.kind === '医院').length} 医院 · {roles.length} 角色</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="组织节点" value={String(orgs.length)} unit="个" delta="集团/院区/科室" icon="building" tone="blue" onClick={() => setTab('org')} />
        <StatCard label="在职职工" value={String(staffSeed.filter((s) => s.status === '在职').length)} unit="人" delta={`用户库 ${users.length}`} icon="users" tone="violet" onClick={() => setTab('org')} />
        <StatCard label="标准目录" value={String(stds.length)} unit="项" delta={`${stds.filter((s) => s.status === '待审核').length} 待审`} icon="book" tone="cyan" onClick={() => setTab('catalog')} />
        <StatCard label="服务健康" value="5/5" unit="" delta="可发布/回滚" icon="activity" tone="green" onClick={() => setTab('ops')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'org', label: '组织与权限', count: orgs.length },
          { key: 'catalog', label: '统一标准目录', count: stds.filter((s) => s.status === '待审核').length },
          { key: 'ops', label: '统一运维', count: relRows.length },
        ]}
      />

      {tab === 'org' && (
        <div className="bi-query mt-14">
          <div className="bi-query-side">
            <Card title="机构主索引" subtitle="集团 · 医院 · 院区 · 科室" noPad>
              <div className="bi-theme-list">
                {orgs.map((o) => (
                  <button key={o.id} className={orgId === o.id ? 'is-on' : ''} onClick={() => setOrgId(o.id)}>
                    <strong>{o.name}</strong>
                    <small>{o.kind} · 职工 {o.staff.toLocaleString()} · 应用 {o.apps}</small>
                  </button>
                ))}
              </div>
            </Card>
          </div>
          <div className="bi-query-main">
            <Card title={activeOrg.name} subtitle={`${activeOrg.kind} · 多院区 / 多角色可配置`} actions={
              <>
                <Btn size="sm" icon="key" onClick={() => go('/admin/permissions')}>菜单权限</Btn>
                <Btn size="sm" variant="primary" icon="usercog" onClick={() => go('/admin/roles')}>角色配置</Btn>
              </>
            }>
              <KeyValue cols={3} items={[
                { label: '节点类型', value: activeOrg.kind },
                { label: '职工数', value: activeOrg.staff.toLocaleString() },
                { label: '接入应用', value: String(activeOrg.apps) },
                { label: '下级节点', value: String(childOrgs.length) },
                { label: '角色模型', value: `${roles.length} 类` },
                { label: '行为权限', value: '菜单 + 按钮 + 数据域' },
              ]} />
              {childOrgs.length > 0 && (
                <>
                  <div className="section-title-sm mt-14">下级组织</div>
                  <div className="tag-row">
                    {childOrgs.map((c) => <Badge key={c.id} tone="blue">{c.name}</Badge>)}
                  </div>
                </>
              )}
            </Card>

            <div className="grid grid-2 mt-14">
              <Card title="职工与科室" subtitle="可检索" noPad actions={
                <SearchInput value={staffQ} onChange={setStaffQ} placeholder="姓名/科室/角色" width={160} />
              }>
                <div className="pad-h">
                  <DataTable rows={staffRows} pageSize={5} columns={[
                    { key: 'name', title: '职工', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.org}</small></div> },
                    { key: 'dept', title: '科室', width: 110, render: (r) => r.dept },
                    { key: 'role', title: '角色', width: 90, render: (r) => <Badge tone="slate">{r.role}</Badge> },
                    { key: 'status', title: '状态', width: 70, render: (r) => <Badge tone={r.status === '在职' ? 'green' : 'slate'} dot>{r.status}</Badge> },
                  ]} />
                </div>
              </Card>
              <Card title="待办任务推送" subtitle="站内 / 短信 / 企微">
                <div className="check-list">
                  {todos.map((t) => (
                    <div key={t.id}>
                      <span className={t.status === '已推送' ? 'ok' : t.status === '失败' ? 'warn' : 'warn'}>
                        {t.status === '已推送' ? <Icon name="check" size={12} /> : <Icon name="bell" size={12} />}
                      </span>
                      <strong>{t.title}</strong>
                      <em>{t.channel} · {t.to}</em>
                    </div>
                  ))}
                </div>
                <Btn className="mt-14 w-full" variant="secondary" icon="bell" onClick={() => notify('待办已批量推送')}>推送待办</Btn>
              </Card>
            </div>

            <Card className="mt-14" title="应用与基础设置" subtitle="验收：多机构、多院区、多角色可配置">
              <div className="publish-checks">
                {[
                  ['机构主索引', '集团—医院—院区—科室', 'building'],
                  ['菜单权限', '按角色裁剪导航与按钮', 'key'],
                  ['职工科室', '组织归属与岗位映射', 'users'],
                  ['行为权限', '操作级授权 + 数据域', 'shield'],
                  ['任务推送', '待办多通道触达', 'bell'],
                  ['基础设置', '会话/水印/密码策略', 'settings'],
                ].map(([t, d, i]) => (
                  <div key={t}>
                    <span><Icon name={i} size={13} /></span>
                    <div><strong>{t}</strong><small>{d}</small></div>
                    <button className="link-btn" onClick={() => {
                      if (t === '菜单权限') go('/admin/permissions');
                      else if (t === '基础设置') go('/admin/settings');
                      else if (t === '职工科室') go('/admin/users');
                      else notify(`${t} 配置已打开`);
                    }}>配置</button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'catalog' && (
        <>
          <div className="market-filters mt-14">
            <div className="market-cats">
              {['', '药品', '诊疗材料', '医嘱', '疾病', '数据字典'].map((d) => (
                <button key={d || 'all'} className={stdDomain === d ? 'is-active' : !d && !stdDomain ? 'is-active' : ''} onClick={() => setStdDomain(d)}>
                  {d || '全部标准'}
                </button>
              ))}
            </div>
            <div className="row-actions">
              <SearchInput value={stdQ} onChange={setStdQ} placeholder="搜索标准" width={180} />
              <Btn size="sm" variant="primary" icon="plus" onClick={() => setApplyOpen(true)}>机构扩展申请</Btn>
            </div>
          </div>

          <Card className="mt-14" title="统一标准数据管理" subtitle="云标准 + 机构扩展 + 申请审核闭环" noPad>
            <div className="pad-h">
              <DataTable rows={stdRows} pageSize={8} columns={[
                { key: 'name', title: '标准', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.ver}</small></div> },
                { key: 'domain', title: '领域', width: 90, render: (r) => <Badge tone="blue">{r.domain}</Badge> },
                { key: 'source', title: '来源', width: 90, render: (r) => <Badge tone={r.source === '云标准' ? 'violet' : 'amber'}>{r.source}</Badge> },
                { key: 'applicant', title: '申请人', width: 80, render: (r) => r.applicant },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已发布' ? 'green' : r.status === '待审核' ? 'amber' : 'red'} dot>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 140, render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => setActiveStd(r)}>详情</button>
                    {r.status === '待审核' ? (
                      <>
                        <button className="link-muted" onClick={() => approveStd(r.id, true)}>通过</button>
                        <button className="link-muted" onClick={() => approveStd(r.id, false)}>驳回</button>
                      </>
                    ) : null}
                  </div>
                ) },
              ]} />
            </div>
          </Card>

          <div className="grid grid-2 mt-14">
            <Card title="目录构成" subtitle="云标准为主 · 机构可扩展">
              <BarList items={[
                { label: '药品', value: stds.filter((s) => s.domain === '药品').length },
                { label: '诊疗材料', value: stds.filter((s) => s.domain === '诊疗材料').length },
                { label: '医嘱', value: stds.filter((s) => s.domain === '医嘱').length },
                { label: '疾病', value: stds.filter((s) => s.domain === '疾病').length },
                { label: '数据字典', value: stds.filter((s) => s.domain === '数据字典').length },
              ]} unit=" 项" color="#6755F5" />
            </Card>
            <Card title="审核闭环" subtitle="申请 → 审核 → 发布/驳回">
              <div className="publish-flow">
                {[['机构申请', `${stds.filter((s) => s.source === '机构扩展').length} 单扩展`], ['标准审核', `${stds.filter((s) => s.status === '待审核').length} 待审`], ['并入目录', '云标准+机构版本'], ['下发引用', '业务系统可拉取']].map(([t, d], i) => (
                  <div key={t} className={i < 2 ? 'is-done' : ''}><span>{i + 1}</span><div><strong>{t}</strong><small>{d}</small></div></div>
                ))}
              </div>
              <div className="info-note mt-14"><Icon name="book" size={13} /><span>验收：云标准 + 机构扩展 + 审核闭环可演示。</span></div>
            </Card>
          </div>
        </>
      )}

      {tab === 'ops' && (
        <>
          <Card className="mt-14" title="运行监控" subtitle="CPU / 内存 / JVM / Redis / Nginx / 数据库">
            <div className="ds-level-row">
              {monitors.map((m) => (
                <div key={m.name} className="ds-level" style={{ minWidth: 90 }}>
                  <strong>{m.value}{m.unit}</strong>
                  <small>{m.name}</small>
                  <Progress value={m.value} tone={m.value > 70 ? 'amber' : 'green'} height={5} />
                </div>
              ))}
            </div>
            <div className="mt-14">
              <AreaChart data={cpuTrend} color="#0891B2" height={150} suffix="%" valueName="CPU" />
            </div>
          </Card>

          <div className="grid grid-2 mt-14">
            <Card title="链路追踪" subtitle="最近调用链">
              <DataTable rows={traces} pageSize={5} columns={[
                { key: 'service', title: '服务', render: (r) => <div className="cell-main"><strong>{r.service}</strong><small>{r.span}</small></div> },
                { key: 'ms', title: '耗时', width: 70, render: (r) => `${r.ms}ms` },
                { key: 'status', title: '状态', width: 70, render: (r) => <Badge tone={r.status === 'OK' ? 'green' : 'red'}>{r.status}</Badge> },
              ]} />
            </Card>
            <Card title="发布 / 更新 / 回滚" subtitle="服务自动化" actions={
              <>
                <Btn size="sm" loading={deployBusy} icon="uploadcloud" onClick={() => deploy('发布')}>发布</Btn>
                <Btn size="sm" variant="danger" loading={deployBusy} icon="refresh" onClick={() => deploy('回滚')}>回滚</Btn>
              </>
            } noPad>
              <div className="pad-h">
                <DataTable rows={relRows} pageSize={5} columns={[
                  { key: 'service', title: '服务', render: (r) => <div className="cell-main"><strong>{r.service}</strong><small>{r.id} · {r.ver}</small></div> },
                  { key: 'action', title: '动作', width: 70, render: (r) => <Badge tone={r.action === '回滚' ? 'amber' : 'blue'}>{r.action}</Badge> },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '成功' ? 'green' : r.status === '进行中' ? 'blue' : 'red'} dot>{r.status}</Badge> },
                  { key: 'at', title: '时间', width: 110, render: (r) => r.at },
                ]} />
              </div>
            </Card>
          </div>
          <div className="info-note mt-14"><Icon name="activity" size={13} /><span>验收：监控、发布、回滚可用；链路异常可下钻。</span></div>
        </>
      )}

      <Drawer open={!!activeStd} onClose={() => setActiveStd(null)} width={520} title={activeStd?.name || ''} desc={activeStd ? `${activeStd.id} · ${activeStd.domain}` : ''}
        footer={<>
          <Btn onClick={() => setActiveStd(null)}>关闭</Btn>
          {activeStd?.status === '待审核' ? (
            <>
              <Btn onClick={() => activeStd && approveStd(activeStd.id, false)}>驳回</Btn>
              <Btn variant="primary" onClick={() => activeStd && approveStd(activeStd.id, true)}>审核通过</Btn>
            </>
          ) : null}
        </>}>
        {activeStd && (
          <KeyValue cols={2} items={[
            { label: '领域', value: activeStd.domain },
            { label: '来源', value: activeStd.source },
            { label: '版本', value: activeStd.ver },
            { label: '状态', value: activeStd.status },
            { label: '申请人', value: activeStd.applicant },
            { label: '说明', value: activeStd.source === '云标准' ? '平台统一下发，机构只读引用。' : '机构申请扩展项，审核通过后并入可引用目录。', wide: true },
          ]} />
        )}
      </Drawer>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="机构标准扩展申请" desc="提交后进入审核队列，通过后并入统一标准目录。" width={560}
        footer={<><Btn onClick={() => setApplyOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => {
          setApplyOpen(false);
          const row: StdItem = { id: `STD-EX-${stds.length}`, name: '新建机构扩展标准', domain: '药品', source: '机构扩展', ver: 'V0.1', status: '待审核', applicant: '药学部' };
          setStds((arr) => [row, ...arr]);
          setTab('catalog');
          notify('扩展申请已提交 · 等待审核');
        }}>提交审核</Btn></>}>
        <div className="form-grid">
          <Field label="标准名称" required className="span-2"><input className="input" placeholder="例如：院内协定药品扩展" /></Field>
          <Field label="领域"><Select value="药品" onChange={() => {}} options={['药品', '诊疗材料', '医嘱', '疾病', '数据字典']} /></Field>
          <Field label="申请科室"><Select value="药学部" onChange={() => {}} options={['药学部', '医务科', '信息中心', '基层卫生']} /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="扩展原因与引用范围" /></Field>
        </div>
      </Modal>
    </>
  );
}
