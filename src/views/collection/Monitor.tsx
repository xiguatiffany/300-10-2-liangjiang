import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, Donut, RadialScore } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { alerts as seedAlerts, auditLogs, qualityDims, qualityIssues, qualityRules, qualityTrend, users as seedUsers, roles } from '../../data';

export function CollectionQualityPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('rules');
  const rows = qualityRules.filter((r) => (r.name + r.asset).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="QUALITY MONITORING" title="质量监控" desc="监控采集入仓数据的质量表现，覆盖空值、重复、值域与及时性校验。" actions={<><Btn icon="play" onClick={() => notify('已触发质量规则全量执行')}>执行检查</Btn><Btn variant="primary" icon="settings" onClick={() => notify('质量监控设置已打开', 'info')}>监控设置</Btn></>} />
      <div className="stat-grid">
        <StatCard label="质量综合得分" value="95.6" unit="分" delta="+0.6 环比" icon="shield" tone="green" />
        <StatCard label="监控规则" value="10" unit="条" delta="启用 9 条" icon="list" tone="blue" />
        <StatCard label="今日异常" value="3" unit="项" delta="影像关联 1 项" icon="circlealert" tone="amber" />
        <StatCard label="待处理问题" value="4" unit="项" delta="高优先级 1 项" icon="alert" tone="red" />
      </div>
      <div className="grid grid-2-1 mt-14">
        <Card title="质量趋势" subtitle="近 6 个月综合得分" actions={<Tabs variant="pill" value="6m" onChange={() => {}} items={[{ key: '6m', label: '近 6 月' }, { key: '30d', label: '近 30 天' }]} />}>
          <AreaChart data={qualityTrend} color="#059669" height={210} suffix=" 分" valueName="质量得分" />
        </Card>
        <Card title="维度得分" subtitle="最近一次评估">
          <div className="quality-mini-col">
            <RadialScore value={95.6} size={120} thickness={9} label="综合得分" />
            <div className="quality-dims">
              {qualityDims.map((d) => <div key={d.label}><span>{d.label}<strong>{d.value}</strong></span><div className="mini-track"><i style={{ width: `${d.value}%`, background: d.color }} /></div></div>)}
            </div>
          </div>
        </Card>
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'rules', label: '质量规则', count: 10 }, { key: 'issues', label: '质量问题', count: 4 }]} /><SearchInput value={q} onChange={setQ} placeholder="搜索规则或数据表" width={240} /></div>
        <div className="pad-h">
          {tab === 'rules' ? <DataTable rows={rows} pageSize={10} columns={[
            { key: 'name', title: '规则名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.rule}</small></div> },
            { key: 'asset', title: '监控表', width: 200, render: (r) => <span className="mono-cell">{r.asset}</span> },
            { key: 'dimension', title: '维度', width: 80, render: (r) => <Badge tone="slate">{r.dimension}</Badge> },
            { key: 'pass', title: '通过率', width: 140, render: (r) => <div className="quality-cell"><Progress value={r.pass} tone={r.pass > 99 ? 'green' : r.pass > 97 ? 'blue' : 'amber'} /><span>{r.pass}%</span></div> },
            { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'ops', title: '操作', width: 100, render: (r) => <div className="row-actions"><button className="link-btn" onClick={() => notify(`规则 ${r.name} 已执行`)}>执行</button><button className="link-muted" onClick={() => notify('规则详情已打开', 'info')}>详情</button></div> },
          ]} /> : <DataTable rows={qualityIssues} pageSize={6} columns={[
            { key: 'id', title: '问题编号', width: 100, render: (r) => <span className="mono-cell">{r.id}</span> },
            { key: 'rule', title: '问题描述', render: (r) => <div className="cell-main"><strong>{r.rule}</strong><small>{r.asset}</small></div> },
            { key: 'count', title: '影响记录', width: 90, align: 'right', render: (r) => <span className="text-red strong">{r.count}</span> },
            { key: 'level', title: '级别', width: 70, render: (r) => <Badge tone={r.level === '高' ? 'red' : r.level === '中' ? 'amber' : 'slate'}>{r.level}</Badge> },
            { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'owner', title: '负责人', width: 80 },
          ]} />}
        </div>
      </Card>
    </>
  );
}

export function AlertsPage() {
  const { notify } = useApp();
  const [rows, setRows] = useState(seedAlerts);
  const [level, setLevel] = useState('all');
  const [tab, setTab] = useState('all');
  const [active, setActive] = useState<typeof seedAlerts[0] | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const filtered = rows.filter((r) => (level === 'all' || r.level === level) && (tab === 'all' || (tab === 'todo' ? ['未读', '已读', '处理中'].includes(r.status) : ['已忽略', '已解决'].includes(r.status))));
  const ack = (id: string) => { setRows((arr) => arr.map((r) => r.id === id ? { ...r, status: '已读' } : r)); notify('告警已标记为已读'); };
  const resolve = (id: string) => { setRows((arr) => arr.map((r) => r.id === id ? { ...r, status: '已解决' } : r)); notify('告警已标记为已解决'); setActive(null); };
  return (
    <>
      <PageHeader eyebrow="ALERT CENTER" title="告警管理" desc="集中处理采集延迟、任务失败、数据质量与对账差异告警，支持告警规则配置与通知策略。" actions={<><Btn icon="settings" onClick={() => setRuleOpen(true)}>告警规则</Btn><Btn variant="primary" icon="checkcircle" onClick={() => { setRows((arr) => arr.map((r) => ({ ...r, status: '已读' }))); notify('全部告警已标记为已读'); }}>全部已读</Btn></>} />
      <div className="alert-severity">
        {[
          { key: 'all', label: '全部告警', value: rows.length, tone: 'blue', icon: 'bell' },
          { key: '严重', label: '严重', value: rows.filter((r) => r.level === '严重').length, tone: 'red', icon: 'circlealert' },
          { key: '警告', label: '警告', value: rows.filter((r) => r.level === '警告').length, tone: 'amber', icon: 'alert' },
          { key: '提示', label: '提示', value: rows.filter((r) => r.level === '提示').length, tone: 'slate', icon: 'circlealert' },
        ].map((s) => (
          <button key={s.key} className={`severity-card tone-${s.tone} ${level === s.key ? 'is-active' : ''}`} onClick={() => setLevel(s.key)}>
            <span className={`sev-ico ${s.tone}`}><Icon name={s.icon} size={17} /></span>
            <div><span>{s.label}</span><strong>{s.value}</strong></div>
            <em>{s.key === '严重' ? '需立即处理' : s.key === '警告' ? '24h 内处理' : '关注'}</em>
          </button>
        ))}
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'all', label: '全部' }, { key: 'todo', label: '待处理', count: rows.filter((r) => ['未读', '已读', '处理中'].includes(r.status)).length }, { key: 'done', label: '已关闭' }]} /><div className="flex center gap-10"><SearchInput value="" onChange={() => {}} placeholder="搜索告警内容" width={220} /><Btn size="sm" icon="refresh" onClick={() => notify('告警已刷新')}>刷新</Btn></div></div>
        <div className="pad-h">
          <DataTable rows={filtered} pageSize={8} onRowClick={(r) => setActive(r)} columns={[
            { key: 'title', title: '告警内容', render: (r) => <div className="alert-title"><span className={`severity-dot ${r.level === '严重' ? 'red' : r.level === '警告' ? 'amber' : 'slate'}`} /><div className="cell-main"><strong>{r.title}</strong><small>{r.id} · {r.source}</small></div></div> },
            { key: 'level', title: '级别', width: 76, render: (r) => <Badge tone={r.level === '严重' ? 'red' : r.level === '警告' ? 'amber' : 'slate'}>{r.level}</Badge> },
            { key: 'type', title: '类型', width: 90, render: (r) => <span className="tag">{r.type}</span> },
            { key: 'time', title: '产生时间', width: 130, render: (r) => <span className="muted">{r.time}</span> },
            { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'owner', title: '处理人', width: 80 },
            { key: 'ops', title: '操作', width: 138, render: (r) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => setActive(r)}>查看</button>{r.status !== '已解决' && <button className="link-muted" onClick={() => resolve(r.id)}>解决</button>}</div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="告警规则" subtitle="已配置的监控策略" actions={<button className="link-btn" onClick={() => setRuleOpen(true)}>管理规则</button>}>
          <div className="rule-list">
            {[['任务失败告警', '采集任务状态 = 失败', '严重', '5 分钟内'], ['数据延迟告警', '同步延迟 > 30 分钟', '严重', '立即'], ['质量阈值告警', '质量通过率 < 95%', '警告', '每 30 分钟'], ['对账差异告警', '对账差异 > 10 条', '警告', '对账完成后'], ['主机资源告警', 'CPU > 85% 持续 10 分钟', '提示', '持续 10 分钟']].map(([n, d, l, t]) => (
              <div key={n}><span className={`sev-dot ${l === '严重' ? 'red' : l === '警告' ? 'amber' : 'slate'}`} /><div><strong>{n}</strong><small>{d} · {t}</small></div><Badge tone={l === '严重' ? 'red' : l === '警告' ? 'amber' : 'slate'}>{l}</Badge></div>
            ))}
          </div>
        </Card>
        <Card title="通知策略" subtitle="告警触达方式">
          <div className="notify-grid">
            {[['站内信', '全部用户', true], ['企业微信', '值班运维组', true], ['短信', '严重级别', true], ['电话', 'P0 级故障', false]].map(([n, s, on]) => (
              <div key={n as string}><span className={`notify-ico ${on ? 'on' : ''}`}><Icon name="bell" size={14} /></span><div><strong>{n}</strong><small>{s}</small></div><Toggle checked={on as boolean} onChange={() => notify('通知策略已更新', 'info')} /></div>
            ))}
          </div>
        </Card>
      </div>
      <Drawer open={!!active} onClose={() => setActive(null)} width={620} title={active?.title || ''} desc={active ? `${active.id} · ${active.type} · ${active.time}` : ''}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn onClick={() => active && ack(active.id)}>标记已读</Btn><Btn variant="primary" onClick={() => active && resolve(active.id)}>标记解决</Btn></>}>
        {active && <>
          <div className="alert-detail-banner"><span className={`adb-ico ${active.level === '严重' ? 'red' : 'amber'}`}><Icon name="alert" size={20} /></span><div><strong>{active.level}告警</strong><p>{active.title}</p></div><Badge dot>{active.status}</Badge></div>
          <KeyValue className="mt-14" cols={2} items={[
            { label: '告警ID', value: <span className="mono">{active.id}</span> }, { label: '告警类型', value: active.type },
            { label: '告警来源', value: <span className="mono">{active.source}</span> }, { label: '处理人', value: active.owner },
            { label: '产生时间', value: active.time }, { label: '告警级别', value: active.level },
            { label: '触发规则', value: active.type === '延迟告警' ? '数据延迟 > 30 分钟' : active.type === '任务失败' ? '采集任务状态 = 失败' : '质量通过率 < 95%', wide: true },
            { label: '处理建议', value: '检查源端数据库连接与网络状况，确认任务日志后重试；若持续失败请联系源系统管理员。', wide: true },
          ]} />
          <div className="section-title-sm mt-14">告警时间线</div>
          <div className="timeline-list compact">
            <div className="tl-item"><span className="tl-dot" /><div className="tl-time">13:40</div><div className="tl-body"><div><strong>告警触发</strong><Badge tone="red">系统</Badge></div><p>检测到延迟超过阈值 30 分钟，生成告警 {active.id}</p></div></div>
            <div className="tl-item"><span className="tl-dot" /><div className="tl-time">13:42</div><div className="tl-body"><div><strong>通知已发送</strong><Badge tone="blue">通知</Badge></div><p>已通过企业微信通知值班运维组</p></div></div>
            <div className="tl-item"><span className="tl-dot" /><div className="tl-time">13:50</div><div className="tl-body"><div><strong>开始处理</strong><Badge tone="amber">人工</Badge></div><p>{active.owner} 已接单，正在排查源端连接</p></div></div>
          </div>
        </>}
      </Drawer>
      <Modal open={ruleOpen} onClose={() => setRuleOpen(false)} title="告警规则配置" desc="设置触发条件、告警级别与通知渠道。" width={600} footer={<><Btn onClick={() => setRuleOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setRuleOpen(false); notify('告警规则已保存'); }}>保存规则</Btn></>}>
        <div className="form-grid">
          <Field label="规则名称" required><input className="input" defaultValue="数据延迟告警" /></Field>
          <Field label="规则类型"><Select value="延迟告警" onChange={() => {}} options={['延迟告警', '任务失败', '质量告警', '对账告警', '资源告警']} /></Field>
          <Field label="触发条件"><Select value="延迟 > 30 分钟" onChange={() => {}} options={['延迟 > 10 分钟', '延迟 > 30 分钟', '延迟 > 60 分钟']} /></Field>
          <Field label="告警级别"><Select value="严重" onChange={() => {}} options={['严重', '警告', '提示']} /></Field>
          <Field label="通知渠道" className="span-2"><div className="flex gap-14"><Toggle checked label="站内信" /><Toggle checked label="企业微信" /><Toggle checked={false} label="短信" /></div></Field>
        </div>
      </Modal>
    </>
  );
}

export function AuditPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [user, setUser] = useState('');
  const [active, setActive] = useState<typeof auditLogs[0] | null>(null);
  const rows = auditLogs.filter((l) => (!user || l.user === user) && (l.action + l.object + l.detail).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="AUDIT LOG" title="审计日志" desc="记录平台内的关键操作与数据访问行为，满足医疗数据安全与等保合规要求。" actions={<><Btn icon="download" onClick={() => notify('审计日志导出任务已创建')}>导出日志</Btn><Btn variant="primary" icon="filter" onClick={() => notify('高级筛选已打开', 'info')}>高级筛选</Btn></>} />
      <div className="stat-grid">
        <StatCard label="今日操作" value="286" unit="次" delta="+12.4% 环比" icon="scroll" tone="blue" />
        <StatCard label="数据查询" value="168" unit="次" delta="占比 58.7%" icon="search" tone="cyan" />
        <StatCard label="配置变更" value="24" unit="次" delta="涉及 12 个配置" icon="sliders" tone="violet" />
        <StatCard label="异常操作" value="0" unit="次" delta="风险拦截 2 次" icon="shield" tone="green" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索操作、对象或详情" width={250} /><Select value={user} onChange={setUser} options={['', 'dp_admin', '张敏', '周宁', '赵倩', 'system', '李建华']} placeholder="全部操作人" width={120} /><input className="input" type="date" defaultValue="2026-08-06" style={{ width: 140 }} /></div>
          <span className="table-note"><Icon name="shield" size={12} /> 日志保留 180 天</span>
        </div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={10} onRowClick={(r) => setActive(r)} columns={[
            { key: 'time', title: '操作时间', width: 140, render: (l) => <span className="mono-cell">{l.time}</span> },
            { key: 'user', title: '操作人', width: 110, render: (l) => <div className="table-avatar"><span className="avatar sm">{l.user.slice(0, 2)}</span>{l.user}</div> },
            { key: 'action', title: '操作类型', width: 120, render: (l) => <Badge tone="blue">{l.action}</Badge> },
            { key: 'object', title: '操作对象', width: 200, render: (l) => <span className="mono-cell">{l.object}</span> },
            { key: 'detail', title: '操作详情', render: (l) => <span className="muted">{l.detail}</span> },
            { key: 'ip', title: 'IP 地址', width: 130, render: (l) => <span className="mono-cell">{l.ip}</span> },
            { key: 'result', title: '结果', width: 76, render: (l) => <Badge tone={l.result === '成功' ? 'green' : 'red'}>{l.result}</Badge> },
          ]} />
        </div>
      </Card>
      <Drawer open={!!active} onClose={() => setActive(null)} width={600} title="操作详情" desc={active ? `${active.id} · ${active.time}` : ''} footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" icon="download" onClick={() => notify('单条日志已导出')}>导出</Btn></>}>
        {active && <>
          <KeyValue cols={2} items={[{ label: '操作人', value: active.user }, { label: '操作类型', value: active.action }, { label: '操作对象', value: active.object }, { label: 'IP 地址', value: active.ip }, { label: '操作时间', value: active.time }, { label: '执行结果', value: active.result }, { label: '操作详情', value: active.detail, wide: true }]} />
          <div className="section-title-sm mt-14">原始日志</div>
          <div className="code-sample">{JSON.stringify({ logId: active.id, user: active.user, action: active.action, object: active.object, ip: active.ip, result: active.result, timestamp: active.time, detail: active.detail, traceId: 'a8f2c1e6-20260806' }, null, 2)}</div>
        </>}
      </Drawer>
    </>
  );
}

export function CollectionUsersPage() {
  const { go, notify } = useApp();
  const [rows, setRows] = useState(seedUsers);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = rows.filter((u) => (!role || u.role === role) && (u.name + u.account + u.dept).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="USER MANAGEMENT" title="用户管理" desc="管理平台用户、所属科室与角色授权，支持账号启停与密码策略。" actions={<><Btn icon="upload" onClick={() => notify('批量导入用户向导已打开', 'info')}>批量导入</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新增用户</Btn></>} />
      <div className="stat-grid">
        <StatCard label="用户总数" value={rows.length.toString()} unit="人" delta="+2 本月" icon="users" tone="blue" />
        <StatCard label="启用账号" value={rows.filter((u) => u.status === '启用').length.toString()} unit="个" delta="停用 1 个" icon="checkcircle" tone="green" />
        <StatCard label="今日登录" value="42" unit="人" delta="峰值 68 人" icon="activity" tone="cyan" />
        <StatCard label="待审批" value="2" unit="个" delta="新用户申请" icon="clock" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索姓名、账号或科室" width={250} /><Select value={role} onChange={setRole} options={['', '超级管理员', '数据管理员', '指标管理员', '数据分析师', '业务用户', '数据审核员', '审计员']} placeholder="全部角色" width={120} /></div><Btn size="sm" icon="download" onClick={() => notify('用户清单已导出')}>导出</Btn></div>
        <div className="pad-h">
          <DataTable rows={filtered} pageSize={10} columns={[
            { key: 'account', title: '用户', render: (u) => <div className="table-avatar"><span className="avatar sm">{u.name.slice(-2)}</span><div className="cell-main"><strong>{u.name}</strong><small>{u.account}</small></div></div> },
            { key: 'dept', title: '所属科室', width: 110 },
            { key: 'role', title: '角色', width: 110, render: (u) => <Badge tone={u.role.includes('管理员') ? 'violet' : 'blue'}>{u.role}</Badge> },
            { key: 'phone', title: '手机号', width: 120, render: (u) => <span className="mono-cell">{u.phone}</span> },
            { key: 'lastLogin', title: '最近登录', width: 130, render: (u) => <span className="muted">{u.lastLogin}</span> },
            { key: 'status', title: '状态', width: 76, render: (u) => <Badge dot>{u.status}</Badge> },
            { key: 'ops', title: '操作', width: 138, render: (u) => <div className="row-actions"><button className="link-btn" onClick={() => notify('用户编辑已打开', 'info')}>编辑</button><button className="link-muted" onClick={() => { setRows((arr) => arr.map((x) => x.id === u.id ? { ...x, status: x.status === '启用' ? '停用' : '启用' } : x)); notify(`用户 ${u.name} 已${u.status === '启用' ? '停用' : '启用'}`); }}>{u.status === '启用' ? '停用' : '启用'}</button><button className="link-muted" onClick={() => notify('已发送密码重置邮件')}>重置密码</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="角色分布" subtitle="按用户数">
          <div className="role-dist">
            {roles.map((r) => <div key={r.id}><span>{r.name}</span><div className="tag-dist-track"><i style={{ width: `${Math.min(100, r.users * 4)}%`, background: r.id === 'admin' ? '#6755F5' : '#9587FF' }} /></div><em>{r.users} 人</em></div>)}
          </div>
        </Card>
        <Card title="登录安全" subtitle="近 7 日">
          <div className="security-list">
            <div><Icon name="shield" size={14} /><span>弱密码账号</span><Badge tone="green">0 个</Badge></div>
            <div><Icon name="key" size={14} /><span>90 天未改密码</span><Badge tone="amber">3 个</Badge></div>
            <div><Icon name="circlealert" size={14} /><span>登录失败 5 次以上</span><Badge tone="green">0 个</Badge></div>
            <div><Icon name="clock" size={14} /><span>90 天未登录</span><Badge tone="amber">2 个</Badge></div>
          </div>
          <button className="link-btn mt-10" onClick={() => notify('安全策略设置已打开', 'info')}>配置密码策略 <Icon name="arrowright" size={11} /></button>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新增用户" desc="创建平台账号并分配角色，初始密码将发送至用户邮箱。" width={560}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('用户已创建，初始密码已发送'); }}>创建用户</Btn></>}>
        <div className="form-grid">
          <Field label="姓名" required><input className="input" placeholder="请输入姓名" /></Field>
          <Field label="登录账号" required><input className="input" placeholder="例如：zhangsan" /></Field>
          <Field label="所属科室"><Select value="信息中心" onChange={() => {}} options={['信息中心', '医务处', '门诊部', '财务处', '检验科', '放射科', '审计处']} /></Field>
          <Field label="角色" required><Select value="业务用户" onChange={() => {}} options={roles.map((r) => r.name)} /></Field>
          <Field label="手机号"><input className="input" placeholder="请输入手机号" /></Field>
          <Field label="邮箱"><input className="input" placeholder="name@meddata.cn" /></Field>
          <Field label="账号状态"><Toggle checked label="启用" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function CollectionRolesPage() {
  const { go, notify } = useApp();
  return (
    <>
      <PageHeader eyebrow="ROLE MANAGEMENT" title="角色管理" desc="定义平台角色与权限范围，按最小权限原则分配功能与数据访问权限。" actions={<><Btn icon="key" onClick={() => go('/admin/permissions')}>权限矩阵</Btn><Btn variant="primary" icon="plus" onClick={() => notify('新建角色已打开', 'info')}>新增角色</Btn></>} />
      <div className="role-grid">
        {roles.map((r) => (
          <div className="role-card" key={r.id}>
            <div className="role-head"><span className={`role-mark ${r.id}`}><Icon name={r.id === 'admin' ? 'shield' : 'usercog'} size={17} /></span><div><strong>{r.name}</strong><span>{r.level}</span></div><Badge tone={r.status === '启用' ? 'green' : 'slate'} dot>{r.status}</Badge></div>
            <p>{r.desc}</p>
            <div className="role-stats"><div><span>用户</span><strong>{r.users}</strong></div><div><span>应用</span><strong>{r.apps}</strong></div><div><span>权限项</span><strong>{r.id === 'admin' ? 32 : r.id === 'data_admin' ? 18 : 12}</strong></div></div>
            <div className="role-foot"><button onClick={() => go(`/admin/role/${r.id}`)}>编辑权限</button><button onClick={() => notify(`角色 ${r.name} 已复制`, 'info')}>复制</button><button onClick={() => notify(`角色 ${r.name} 成员列表已打开`, 'info')}>成员</button></div>
          </div>
        ))}
        <button className="role-add" onClick={() => notify('新建角色已打开', 'info')}><span><Icon name="plus" size={18} /></span><strong>新增角色</strong><small>按业务场景定义权限组合</small></button>
      </div>
      <Card className="mt-14" title="角色权限概览" subtitle="角色与核心功能权限对应关系" noPad>
        <div className="pad-h">
          <table className="data-table perm-table">
            <thead><tr><th>角色</th><th>数据资产</th><th>数据质量</th><th>数据查询</th><th>指标中台</th><th>采集配置</th><th>用户管理</th><th>审计日志</th></tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}><td><strong>{r.name}</strong></td>
                  {['asset', 'quality', 'query', 'indicator', 'config', 'user', 'audit'].map((p) => {
                    const full = r.id === 'admin';
                    const yes = full || (r.id === 'data_admin' && ['asset', 'quality', 'query', 'config', 'audit'].includes(p)) || (r.id === 'indicator_admin' && ['asset', 'indicator', 'query', 'quality'].includes(p)) || (r.id === 'analyst' && ['asset', 'query', 'indicator', 'quality'].includes(p)) || (r.id === 'business' && ['indicator'].includes(p)) || (r.id === 'auditor' && ['audit', 'asset'].includes(p));
                    return <td key={p}>{yes ? <span className="perm-yes"><Icon name="check" size={13} /></span> : <span className="perm-no">—</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
