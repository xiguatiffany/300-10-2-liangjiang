import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Btn, Card, DataTable, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../components/ui';
import { useApp } from '../app-context';
import { roles, permissionApps, rolePermissions, users, auditLogs } from '../data';
import { CollectionUsersPage, AuditPage } from './CollectionPages';

export function AdminUsersPage() {
  return <CollectionUsersPage />;
}

export function AdminRolesPage() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const rows = roles.filter((r) => (r.name + r.desc).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="ROLE & PERMISSION" title="角色管理" desc="Eywa 管理后台统一管理多应用角色、功能权限与安全等级，支持按最小权限原则精细授权。" actions={<><Btn icon="download" onClick={() => notify('角色清单已导出')}>导出</Btn><Btn variant="primary" icon="plus" onClick={() => notify('新建角色已打开', 'info')}>新建角色</Btn></>} />
      <div className="stat-grid">
        <StatCard label="角色总数" value="6" unit="个" delta="系统内置 2 个" icon="usercog" tone="blue" />
        <StatCard label="授权用户" value="131" unit="人" delta="覆盖 18 个科室" icon="users" tone="violet" />
        <StatCard label="受管应用" value="4" unit="个" delta="PC / 移动 / 临床" icon="boxes" tone="cyan" />
        <StatCard label="高风险权限" value="2" unit="项" delta="仅超级管理员" icon="shieldalert" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索角色名称或描述" width={250} /><Select value="" onChange={() => {}} options={['全部安全等级', '5级-机密', '4级-重要', '3级-敏感', '2级-普通']} placeholder="全部安全等级" width={130} /></div><span className="table-note"><Icon name="shield" size={12} /> 权限变更将记录审计日志</span></div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={6} columns={[
            { key: 'name', title: '角色', render: (r) => <div className="role-cell"><span className={`role-mark ${r.id}`}><Icon name={r.id === 'admin' ? 'shield' : 'usercog'} size={15} /></span><div className="cell-main"><strong>{r.name}</strong><small>{r.desc}</small></div></div> },
            { key: 'level', title: '安全等级', width: 110, render: (r) => <Badge tone={r.level.includes('5') ? 'red' : r.level.includes('4') ? 'amber' : r.level.includes('3') ? 'violet' : 'blue'}>{r.level}</Badge> },
            { key: 'users', title: '用户数', width: 80, align: 'right', render: (r) => <span className="mono-cell">{r.users}</span> },
            { key: 'apps', title: '授权应用', width: 90, align: 'right', render: (r) => <span className="mono-cell">{r.apps} 个</span> },
            { key: 'perms', title: '权限项', width: 90, align: 'right', render: (r) => <span className="mono-cell">{rolePermissions[r.id]?.length || 0} 项</span> },
            { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'updated', title: '最近更新', width: 130, render: (r) => <span className="muted">{r.updated}</span> },
            { key: 'ops', title: '操作', width: 150, render: (r) => <div className="row-actions"><button className="link-btn" onClick={() => go(`/admin/role/${r.id}`)}>编辑角色</button><button className="link-muted" onClick={() => notify('成员列表已打开', 'info')}>成员</button><button className="link-muted" onClick={() => notify(`角色 ${r.name} 已复制`, 'info')}>复制</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="权限分布" subtitle="角色权限项数量">
          <div className="role-dist">
            {roles.map((r) => <div key={r.id}><span>{r.name}</span><div className="tag-dist-track"><i style={{ width: `${((rolePermissions[r.id]?.length || 0) / 32) * 100}%` }} /></div><em>{rolePermissions[r.id]?.length || 0} 项</em></div>)}
          </div>
        </Card>
        <Card title="安全提示" subtitle="权限治理建议">
          <div className="info-note"><Icon name="circlealert" size={14} /><span>“数据管理员”角色拥有 18 项权限，其中 3 项涉及敏感数据访问，建议每季度复核。</span></div>
          <div className="info-note mt-10"><Icon name="shield" size={14} /><span>2 个角色超过 90 天未更新权限配置，建议结合岗位调整进行复核。</span></div>
          <Btn size="sm" variant="secondary" className="mt-10" onClick={() => notify('权限复核任务已创建')}>发起权限复核</Btn>
        </Card>
      </div>
    </>
  );
}

const securityLevels = [
  { value: '5级-机密', color: '#DC2626', desc: '绝密级医疗数据，需专项授权' },
  { value: '4级-重要', color: '#D97706', desc: '重要业务数据，需审批访问' },
  { value: '3级-敏感', color: '#9587FF', desc: '含患者隐私，自动脱敏' },
  { value: '2级-普通', color: '#6755F5', desc: '内部一般数据，按需访问' },
  { value: '1级-公开', color: '#059669', desc: '可公开的统计类数据' },
];

export function RoleEditPage({ param }: { param?: string }) {
  const { go, notify } = useApp();
  const role = roles.find((r) => r.id === param) || roles[0];
  const [name, setName] = useState(role.name === 'admin' ? 'admin' : role.name);
  const [level, setLevel] = useState(role.level);
  const [desc, setDesc] = useState(role.desc);
  const [apps, setApps] = useState<string[]>(role.id === 'admin' ? permissionApps.map((a) => a.key) : role.id === 'auditor' ? ['platform'] : ['platform', 'hrp']);
  const [perms, setPerms] = useState<string[]>(rolePermissions[role.id] || []);
  const [activeApp, setActiveApp] = useState('platform');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');
  const [dataScope, setDataScope] = useState('all');
  const [maskPhone, setMaskPhone] = useState(true);
  const [maskId, setMaskId] = useState(true);
  const [maskName, setMaskName] = useState(false);
  const appDef = permissionApps.find((a) => a.key === activeApp)!;
  const togglePerm = (key: string) => setPerms((arr) => arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  const toggleModule = (module: any) => {
    const keys = [module.key, ...(module.children || []).map((c: any) => c.key)];
    const allOn = keys.every((k) => perms.includes(k));
    setPerms((arr) => allOn ? arr.filter((x) => !keys.includes(x)) : Array.from(new Set([...arr, ...keys])));
  };
  const save = () => { setSaving(true); window.setTimeout(() => { setSaving(false); notify('角色权限已保存'); }, 700); };

  return (
    <>
      <PageHeader back={() => go('/admin/roles')} eyebrow="EDIT ROLE" title={`编辑角色 · ${role.name}`} desc="配置角色的基础信息、应用授权与功能权限，保存后立即生效。" actions={<><Btn onClick={() => go('/admin/roles')}>取消</Btn><Btn variant="primary" icon="save" loading={saving} onClick={save}>保存配置</Btn></>} />
      <div className="role-edit-layout">
        <div className="role-edit-main">
          <div className="role-tabs"><Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'basic', label: '基本信息' }, { key: 'apps', label: '应用授权' }, { key: 'perms', label: '功能权限' }, { key: 'data', label: '数据权限' }]} /></div>
          {tab === 'basic' && (
            <Card title="基本信息" subtitle="角色的标识、安全等级与用途说明" className="mt-14">
              <div className="form-grid">
                <Field label="角色名称" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="安全等级" required>
                  <div className="level-select">
                    <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>{securityLevels.map((l) => <option key={l.value}>{l.value}</option>)}</select>
                  </div>
                </Field>
                <Field label="角色描述" className="span-2"><textarea className="textarea" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
                <Field label="角色编码" className="span-2"><input className="input mono" value={role.id} readOnly /></Field>
              </div>
              <div className="divider-h" />
              <div className="section-title-sm">安全等级说明</div>
              <div className="level-list">
                {securityLevels.map((l) => (
                  <button key={l.value} className={level === l.value ? 'is-active' : ''} onClick={() => setLevel(l.value)}>
                    <span className="level-dot" style={{ background: l.color }} />
                    <div><strong>{l.value}</strong><small>{l.desc}</small></div>
                    {level === l.value && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            </Card>
          )}
          {tab === 'apps' && (
            <Card title="应用授权" subtitle="该角色可访问的业务应用" className="mt-14">
              <div className="app-auth-grid">
                {permissionApps.map((a) => (
                  <label key={a.key} className={`app-auth-card ${apps.includes(a.key) ? 'is-checked' : ''}`}>
                    <input type="checkbox" className="checkbox" checked={apps.includes(a.key)} onChange={(e) => setApps((arr) => e.target.checked ? [...arr, a.key] : arr.filter((x) => x !== a.key))} />
                    <span className="aa-icon"><Icon name={a.key === 'platform' ? 'database' : a.key === 'clinical' ? 'activity' : 'chart'} size={18} /></span>
                    <div><strong>{a.name}</strong><small>{a.modules.length} 个功能模块</small></div>
                    {apps.includes(a.key) && <Badge tone="green">已授权</Badge>}
                  </label>
                ))}
              </div>
              <div className="info-note mt-14"><Icon name="circlealert" size={13} /><span>取消应用授权后，该角色用户将无法访问对应应用的任何页面。</span></div>
            </Card>
          )}
          {tab === 'perms' && (
            <Card title="功能权限" subtitle="按应用配置页面与操作权限" className="mt-14" noPad>
              <div className="perm-editor">
                <aside className="perm-apps">
                  {permissionApps.map((a) => (
                    <button key={a.key} className={activeApp === a.key ? 'is-active' : ''} onClick={() => setActiveApp(a.key)}>
                      <Icon name={a.key === 'platform' ? 'database' : a.key === 'clinical' ? 'activity' : 'chart'} size={15} />
                      <span>{a.name}</span>
                      <em>{perms.filter((p) => a.modules.some((m) => m.key === p || m.children?.some((c) => c.key === p))).length}</em>
                    </button>
                  ))}
                </aside>
                <div className="perm-tree">
                  <div className="perm-toolbar">
                    <span>已选 <strong>{perms.length}</strong> 项权限</span>
                    <div className="row-actions">
                      <button className="link-muted" onClick={() => setPerms(Array.from(new Set([...perms, ...appDef.modules.flatMap((m) => [m.key, ...(m.children || []).map((c) => c.key)])])))}>全选当前应用</button>
                      <button className="link-muted" onClick={() => setPerms((arr) => arr.filter((p) => !appDef.modules.some((m) => m.key === p || m.children?.some((c) => c.key === p))))}>清空当前应用</button>
                    </div>
                  </div>
                  {appDef.modules.map((m) => {
                    const childKeys = (m.children || []).map((c) => c.key);
                    const allOn = [m.key, ...childKeys].every((k) => perms.includes(k));
                    return (
                      <div className="perm-module" key={m.key}>
                        <div className="perm-module-head">
                          <Toggle checked={allOn} onChange={() => toggleModule(m)} />
                          <strong>{m.name}</strong>
                          <span className="muted xs">{childKeys.filter((k) => perms.includes(k)).length} / {childKeys.length || 1}</span>
                        </div>
                        {m.children && (
                          <div className="perm-children">
                            {m.children.map((c) => (
                              <label key={c.key} className={perms.includes(c.key) ? 'is-checked' : ''}>
                                <input type="checkbox" className="checkbox" checked={perms.includes(c.key)} onChange={() => togglePerm(c.key)} />
                                <span>{c.name}</span>
                                <em>{c.key}</em>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
          {tab === 'data' && (
            <Card title="数据权限" subtitle="控制角色可见的数据范围与敏感字段" className="mt-14">
              <div className="data-scope-list">
                {[{ k: 'all', t: '全院数据', d: '可访问全院所有科室与患者数据' }, { k: 'dept', t: '本科室数据', d: '仅可访问所属科室及下级科室数据' }, { k: 'self', t: '本人数据', d: '仅可访问本人创建或负责的数据' }, { k: 'custom', t: '自定义范围', d: '按科室、病区或数据域组合授权' }].map((s) => (
                  <button key={s.k} className={dataScope === s.k ? 'is-active' : ''} onClick={() => setDataScope(s.k)}><span className="radio-dot" /><div><strong>{s.t}</strong><small>{s.d}</small></div>{dataScope === s.k && <Badge tone="blue">当前</Badge>}</button>
                ))}
              </div>
              <div className="divider-h" />
              <div className="section-title-sm">字段脱敏</div>
              <div className="mask-list">
                <div><div><strong>手机号码</strong><small>保留前 3 位与后 4 位</small></div><Toggle checked={maskPhone} onChange={setMaskPhone} /></div>
                <div><div><strong>身份证号</strong><small>仅显示后 4 位</small></div><Toggle checked={maskId} onChange={setMaskId} /></div>
                <div><div><strong>患者姓名</strong><small>保留姓氏，名字替换为 *</small></div><Toggle checked={maskName} onChange={setMaskName} /></div>
              </div>
            </Card>
          )}
        </div>
        <aside className="role-edit-side">
          <Card title="角色概览">
            <div className="role-preview">
              <span className={`role-mark ${role.id}`}><Icon name="shield" size={20} /></span>
              <strong>{name}</strong>
              <Badge tone={level.includes('5') ? 'red' : level.includes('4') ? 'amber' : 'violet'}>{level}</Badge>
              <p>{desc}</p>
            </div>
            <div className="role-preview-stats">
              <div><strong>{apps.length}</strong><span>授权应用</span></div>
              <div><strong>{perms.length}</strong><span>权限项</span></div>
              <div><strong>{role.users}</strong><span>关联用户</span></div>
            </div>
            <div className="divider-h" />
            <div className="role-sec-note"><Icon name="circlealert" size={13} /><span>该角色当前安全等级为 <strong>{level}</strong>，修改将影响 {role.users} 名用户。</span></div>
          </Card>
          <Card className="mt-14" title="配置导航">
            <div className="side-nav-lite">
              {[{ k: 'basic', l: '基本信息', i: 'file' }, { k: 'apps', l: '应用授权', i: 'boxes' }, { k: 'perms', l: '功能权限', i: 'key' }, { k: 'data', l: '数据权限', i: 'shield' }].map((s) => (
                <button key={s.k} className={tab === s.k ? 'is-active' : ''} onClick={() => setTab(s.k)}><Icon name={s.i} size={13} />{s.l}<Icon name="chevronright" size={11} /></button>
              ))}
            </div>
          </Card>
          <Card className="mt-14" title="最近变更">
            <div className="exec-history">
              {[['2026-08-06 14:18', 'admin', '更新功能权限'], ['2026-07-22 10:00', 'admin', '调整安全等级'], ['2026-06-18 16:20', 'admin', '新增应用授权']].map(([t, u, d]) => (
                <div key={t}><span className="status-dot tone-blue" /><div><strong>{d}</strong><small>{u} · {t}</small></div></div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
      <div className="edit-footer"><span className="muted xs"><Icon name="shield" size={12} /> 权限变更将立即生效并记录至审计日志。</span><div className="row-actions"><Btn onClick={() => go('/admin/roles')}>取消</Btn><Btn variant="primary" loading={saving} onClick={save}>保存配置</Btn></div></div>
    </>
  );
}

export function PermissionsPage() {
  const { notify } = useApp();
  const [tab, setTab] = useState('func');
  const [matrix, setMatrix] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    roles.forEach((r) => permissionApps[0].modules.forEach((mod) => {
      m[`${r.id}:${mod.key}`] = r.id === 'admin' ? true : (rolePermissions[r.id] || []).includes(mod.key);
      (mod.children || []).forEach((c) => { m[`${r.id}:${c.key}`] = r.id === 'admin' ? true : (rolePermissions[r.id] || []).includes(c.key); });
    }));
    return m;
  });
  return (
    <>
      <PageHeader eyebrow="PERMISSION MATRIX" title="权限配置" desc="以矩阵方式集中查看与调整各角色的功能权限、数据权限与 API 权限。" actions={<><Btn icon="refresh" onClick={() => notify('权限矩阵已刷新')}>刷新</Btn><Btn variant="primary" icon="save" onClick={() => notify('权限矩阵已保存')}>保存变更</Btn></>} />
      <div className="stat-grid">
        <StatCard label="权限项" value="42" unit="项" delta="覆盖 4 个应用" icon="key" tone="blue" />
        <StatCard label="角色" value="6" unit="个" delta="131 名用户" icon="usercog" tone="violet" />
        <StatCard label="已授权" value="68" unit="项" delta="授权率 27.0%" icon="checkcircle" tone="green" />
        <StatCard label="敏感权限" value="8" unit="项" delta="仅管理员可授" icon="shieldalert" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'func', label: '功能权限' }, { key: 'data', label: '数据权限' }, { key: 'api', label: 'API 权限' }]} /><span className="table-note">新一代大数据平台 · 主模块权限</span></div>
        <div className="pad-h">
          <div className="table-wrap">
            <table className="data-table perm-matrix">
              <thead><tr><th style={{ width: 170 }}>功能模块</th>{roles.map((r) => <th key={r.id} className="align-center">{r.name}</th>)}</tr></thead>
              <tbody>
                {permissionApps[0].modules.map((mod) => (
                  <React.Fragment key={mod.key}>
                    <tr className="matrix-group"><td>{mod.name}</td>{roles.map((r) => <td key={r.id} className="align-center">{r.id === 'admin' ? <span className="perm-yes"><Icon name="check" size={13} /></span> : <input type="checkbox" className="checkbox" checked={!!matrix[`${r.id}:${mod.key}`]} onChange={(e) => setMatrix((m) => ({ ...m, [`${r.id}:${mod.key}`]: e.target.checked, ...Object.fromEntries((mod.children || []).map((c) => [`${r.id}:${c.key}`, e.target.checked])) }))} />}</td>)}</tr>
                    {mod.children?.map((c) => (
                      <tr key={c.key}><td className="matrix-child">{c.name}</td>{roles.map((r) => <td key={r.id} className="align-center"><span className={matrix[`${r.id}:${c.key}`] ? 'perm-yes' : 'perm-no'}>{matrix[`${r.id}:${c.key}`] ? <Icon name="check" size={13} /> : '—'}</span></td>)}</tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      <div className="info-note mt-14"><Icon name="circlealert" size={13} /><span>超级管理员（admin）权限不可修改。其他角色的权限调整保存后立即生效，建议在变更前通知相关用户。</span></div>
    </>
  );
}

export function AppsPage() {
  const { notify } = useApp();
  const [open, setOpen] = useState(false);
  const apps = permissionApps.map((a, i) => ({ ...a, status: '运行中', users: [131, 68, 24, 96][i], sso: i < 3, url: ['/data-platform', '/hrp', '/m/hrp', '/clinical'][i] }));
  return (
    <>
      <PageHeader eyebrow="APPLICATIONS" title="应用管理" desc="管理接入 Eywa 统一认证的业务应用，配置单点登录、权限映射与访问入口。" actions={<><Btn icon="key" onClick={() => notify('SSO 配置已打开', 'info')}>SSO 配置</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>接入应用</Btn></>} />
      <div className="app-grid">
        {apps.map((a) => (
          <div className="app-card" key={a.key}>
            <div className="app-card-head"><span className="app-logo"><Icon name={a.key === 'platform' ? 'database' : a.key === 'clinical' ? 'activity' : 'chart'} size={20} /></span><div><strong>{a.name}</strong><small>{a.url}</small></div><Badge tone="green" dot>{a.status}</Badge></div>
            <p>{a.key === 'platform' ? '医院数据中台主应用，覆盖数据资产、质量、指标与开放集市。' : a.key === 'clinical' ? '面向临床医护的患者全景视图与诊疗数据服务。' : '面向运营管理、成本核算与预算管理的业务应用。'}</p>
            <div className="app-stats"><div><span>授权用户</span><strong>{a.users}</strong></div><div><span>功能模块</span><strong>{a.modules.length}</strong></div><div><span>单点登录</span><strong>{a.sso ? '已启用' : '未启用'}</strong></div></div>
            <div className="app-foot"><button onClick={() => notify('应用详情已打开', 'info')}>应用详情</button><button onClick={() => notify('权限映射已打开', 'info')}>权限映射</button><button onClick={() => notify('SSO 测试通过', 'info')}>SSO 测试</button></div>
          </div>
        ))}
        <button className="app-add" onClick={() => setOpen(true)}><span><Icon name="plus" size={19} /></span><strong>接入新应用</strong><small>通过 OAuth 2.0 / CAS 接入统一认证</small></button>
      </div>
      <div className="grid grid-2 mt-14">
        <Card title="统一认证" subtitle="SSO 运行状态">
          <div className="sso-panel">
            <div className="sso-icon"><Icon name="fingerprint" size={26} /></div>
            <div><strong>OAuth 2.0 + CAS 双协议</strong><p>统一身份认证服务运行正常，今日登录 286 次，失败 2 次。</p></div>
            <Badge tone="green" dot>正常</Badge>
          </div>
          <div className="divider-h" />
          <div className="security-list">
            <div><Icon name="key" size={14} /><span>Token 有效期 8 小时</span><Badge tone="blue">配置</Badge></div>
            <div><Icon name="refresh" size={14} /><span>自动续期</span><Badge tone="green">开启</Badge></div>
            <div><Icon name="shield" size={14} /><span>强制 HTTPS</span><Badge tone="green">开启</Badge></div>
          </div>
        </Card>
        <Card title="应用访问统计" subtitle="近 7 日">
          <div className="app-access">
            {apps.map((a) => <div key={a.key}><span>{a.name}</span><div className="tag-dist-track"><i style={{ width: `${(a.users / 131) * 100}%` }} /></div><em>{a.users} 人</em></div>)}
          </div>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="接入新应用" width={560} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('应用接入申请已提交'); }}>提交接入</Btn></>}>
        <div className="form-grid">
          <Field label="应用名称" required><input className="input" placeholder="例如：科研数据平台" /></Field>
          <Field label="应用编码" required><input className="input" placeholder="research_platform" /></Field>
          <Field label="访问地址"><input className="input" placeholder="https://research.meddata.cn" /></Field>
          <Field label="认证协议"><Select value="OAuth 2.0" onChange={() => {}} options={['OAuth 2.0', 'CAS', 'SAML 2.0']} /></Field>
          <Field label="回调地址" className="span-2"><input className="input" placeholder="https://research.meddata.cn/callback" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function DataPermissionsPage() {
  const { notify } = useApp();
  const [open, setOpen] = useState(false);
  const rules = [
    { id: 'DP-001', role: '数据管理员', table: 'ods_his_patient', type: '行级', condition: 'org_code IN (本院区)', mask: '身份证、手机号', status: '启用' },
    { id: 'DP-002', role: '数据分析师', table: 'ods_his_patient', type: '行级 + 列级', condition: 'dept_code IN (所属科室)', mask: '姓名、身份证、手机号', status: '启用' },
    { id: 'DP-003', role: '业务用户', table: 'dwd_fact_visit', type: '行级', condition: 'dept_code = 所属科室', mask: '患者标识', status: '启用' },
    { id: 'DP-004', role: '审计员', table: 'audit_logs', type: '列级', condition: '全部', mask: '无', status: '启用' },
    { id: 'DP-005', role: '外部科研', table: 'hm_research_dataset', type: '行级 + 列级', condition: 'project_id = 授权项目', mask: '全部直接标识符', status: '停用' },
  ];
  return (
    <>
      <PageHeader eyebrow="DATA ACCESS CONTROL" title="数据权限" desc="配置行级数据范围、列级字段脱敏与动态授权策略，保障数据使用合规。" actions={<><Btn icon="play" onClick={() => notify('权限策略校验完成，无冲突')}>策略校验</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建策略</Btn></>} />
      <div className="stat-grid">
        <StatCard label="数据策略" value="5" unit="条" delta="启用 4 条" icon="shield" tone="blue" />
        <StatCard label="受控数据表" value="286" unit="张" delta="含 42 张敏感表" icon="table" tone="violet" />
        <StatCard label="脱敏字段" value="68" unit="个" delta="动态脱敏" icon="eye" tone="cyan" />
        <StatCard label="越权拦截" value="12" unit="次" delta="近 7 日" icon="shieldalert" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><Tabs variant="line" value="all" onChange={() => {}} items={[{ key: 'all', label: '全部策略', count: 5 }, { key: 'row', label: '行级策略' }, { key: 'col', label: '列级策略' }]} /><SearchInput value="" onChange={() => {}} placeholder="搜索角色或数据表" width={230} /></div>
        <div className="pad-h">
          <DataTable rows={rules} pageSize={8} columns={[
            { key: 'id', title: '策略编号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
            { key: 'role', title: '适用角色', width: 120, render: (r) => <Badge tone="violet">{r.role}</Badge> },
            { key: 'table', title: '数据表', width: 210, render: (r) => <span className="mono-cell">{r.table}</span> },
            { key: 'type', title: '控制类型', width: 110, render: (r) => <span className="tag">{r.type}</span> },
            { key: 'condition', title: '行过滤条件', render: (r) => <span className="mono-cell">{r.condition}</span> },
            { key: 'mask', title: '脱敏字段', width: 160, render: (r) => <span className="muted">{r.mask}</span> },
            { key: 'status', title: '状态', width: 76, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'ops', title: '操作', width: 100, render: (r) => <div className="row-actions"><button className="link-btn" onClick={() => notify('策略编辑已打开', 'info')}>编辑</button><button className="link-muted" onClick={() => notify('策略测试已打开', 'info')}>测试</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="脱敏预览" subtitle="以“数据分析师”视角查看患者数据">
          <div className="table-wrap"><table className="data-table"><thead><tr><th>患者姓名</th><th>身份证号</th><th>手机号</th><th>诊断</th></tr></thead><tbody>
            <tr><td>张*华</td><td>****************12</td><td>138****6086</td><td>高血压</td></tr>
            <tr><td>李*芳</td><td>****************28</td><td>139****2042</td><td>胃炎</td></tr>
            <tr><td>王*明</td><td>****************76</td><td>136****8820</td><td>骨折</td></tr>
          </tbody></table></div>
          <div className="info-note mt-14"><Icon name="eye" size={13} /><span>脱敏规则基于角色动态生效，导出与 API 调用同样适用。</span></div>
        </Card>
        <Card title="策略生效范围" subtitle="按数据域">
          <div className="coverage-list">
            {[['HIS 业务', 100], ['EMR 病历', 92], ['LIS 检验', 86], ['PACS 影像', 74], ['HRP 运营', 68]].map(([l, v]) => <div key={l as string}><span>{l}数据</span><strong>{v}%</strong><div className="coverage-track"><i style={{ width: `${v}%` }} /></div></div>)}
          </div>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新建数据权限策略" width={600} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('数据权限策略已创建'); }}>创建策略</Btn></>}>
        <div className="form-grid">
          <Field label="适用角色" required><Select value="" onChange={() => {}} options={roles.map((r) => r.name)} placeholder="请选择角色" /></Field>
          <Field label="控制类型"><Select value="行级" onChange={() => {}} options={['行级', '列级', '行级 + 列级']} /></Field>
          <Field label="数据表" className="span-2"><input className="input mono" placeholder="例如：ods_his_patient" /></Field>
          <Field label="行过滤条件" className="span-2"><input className="input mono" placeholder="dept_code IN (${user.dept})" /></Field>
          <Field label="脱敏字段" className="span-2"><input className="input" placeholder="身份证、手机号、姓名" /></Field>
        </div>
      </Modal>
    </>
  );
}

export function AdminLogsPage() {
  return <AuditPage />;
}

export function SettingsPage() {
  const { notify } = useApp();
  const [watermark, setWatermark] = useState(true);
  const [mfa, setMfa] = useState(false);
  const [autoAudit, setAutoAudit] = useState(true);
  const [saving, setSaving] = useState(false);
  return (
    <>
      <PageHeader eyebrow="PLATFORM SETTINGS" title="平台设置" desc="配置平台基础信息、安全策略与数据治理规则，变更将记录至审计日志。" actions={<Btn variant="primary" icon="save" loading={saving} onClick={() => { setSaving(true); window.setTimeout(() => { setSaving(false); notify('平台设置已保存'); }, 600); }}>保存设置</Btn>} />
      <div className="settings-layout">
        <div className="settings-main">
          <Card title="平台信息" subtitle="展示于登录页与平台头部">
            <div className="brand-setting">
              <div className="brand-preview"><div className="brand-mark"><svg viewBox="0 0 40 40" width="42" height="42"><defs><linearGradient id="set-g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5B8CFF" /><stop offset="1" stopColor="#6755F5" /></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#set-g)" /><path d="M9 21h5l2.6-7 4.2 14 3-9 2.2 4H31" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg></div><div><strong>MedData</strong><span>医疗数据中台</span></div></div>
              <Btn size="sm" icon="upload" onClick={() => notify('Logo 上传已打开', 'info')}>更换 Logo</Btn>
            </div>
            <div className="form-grid mt-14">
              <Field label="平台名称"><input className="input" defaultValue="MedData 医疗数据中台" /></Field>
              <Field label="医院名称"><input className="input" defaultValue="重庆医科大学附属第二医院" /></Field>
              <Field label="平台简称"><input className="input" defaultValue="重医附二院数据中心" /></Field>
              <Field label="联系电话"><input className="input" defaultValue="023-6369 8866" /></Field>
              <Field label="平台描述" className="span-2"><textarea className="textarea" rows={2} defaultValue="汇聚全院数据资产，统一指标口径，支撑临床、运营与科研决策。" /></Field>
            </div>
          </Card>
          <Card className="mt-14" title="安全策略" subtitle="账号、会话与访问控制">
            <div className="setting-list">
              <div className="setting-row"><div><strong>多因素认证（MFA）</strong><small>管理员账号登录时需二次验证</small></div><Toggle checked={mfa} onChange={setMfa} /></div>
              <div className="setting-row"><div><strong>页面水印</strong><small>在数据页面显示当前用户与时间水印</small></div><Toggle checked={watermark} onChange={setWatermark} /></div>
              <div className="setting-row"><div><strong>会话超时</strong><small>无操作后自动退出登录</small></div><Select value="30 分钟" onChange={() => {}} options={['15 分钟', '30 分钟', '1 小时', '2 小时']} width={120} /></div>
              <div className="setting-row"><div><strong>密码有效期</strong><small>超过有效期需强制修改密码</small></div><Select value="90 天" onChange={() => {}} options={['30 天', '60 天', '90 天', '180 天']} width={120} /></div>
              <div className="setting-row"><div><strong>登录失败锁定</strong><small>连续失败 5 次锁定账号 30 分钟</small></div><Toggle checked label="已启用" /></div>
              <div className="setting-row"><div><strong>IP 访问白名单</strong><small>仅允许院内网段访问管理后台</small></div><Toggle checked label="已启用" /></div>
            </div>
          </Card>
          <Card className="mt-14" title="数据与审计" subtitle="数据保留与访问审计">
            <div className="setting-list">
              <div className="setting-row"><div><strong>查询日志自动审计</strong><small>记录所有 SQL 查询与数据导出行为</small></div><Toggle checked={autoAudit} onChange={setAutoAudit} /></div>
              <div className="setting-row"><div><strong>审计日志保留</strong><small>超出期限的日志将自动归档</small></div><Select value="180 天" onChange={() => {}} options={['90 天', '180 天', '1 年', '3 年']} width={120} /></div>
              <div className="setting-row"><div><strong>查询结果行数上限</strong><small>单次查询最多返回的数据行数</small></div><Select value="100,000 行" onChange={() => {}} options={['10,000 行', '50,000 行', '100,000 行', '500,000 行']} width={140} /></div>
              <div className="setting-row"><div><strong>敏感数据导出审批</strong><small>导出含敏感字段的数据需审批</small></div><Toggle checked label="已启用" /></div>
            </div>
          </Card>
        </div>
        <aside className="settings-side">
          <Card title="平台概况">
            <KeyValue cols={1} items={[
              { label: '平台版本', value: 'MedData v3.8.2' }, { label: '部署环境', value: 'Kubernetes · 生产' },
              { label: '授权用户', value: '131 人' }, { label: '接入应用', value: '4 个' },
              { label: '最近升级', value: '2026-07-28' }, { label: '许可证到期', value: '2027-12-31' },
            ]} />
          </Card>
          <Card className="mt-14" title="系统状态">
            <div className="sys-status">
              {[['数据库', '正常', 'green'], ['缓存服务', '正常', 'green'], ['消息队列', '正常', 'green'], ['对象存储', '正常', 'green'], ['调度服务', '正常', 'green']].map(([n, s, t]) => <div key={n}><span className={`status-dot tone-${t}`} /><span>{n}</span><em>{s}</em></div>)}
            </div>
            <button className="link-btn mt-10" onClick={() => notify('系统状态已刷新')}>刷新状态 <Icon name="refresh" size={11} /></button>
          </Card>
          <Card className="mt-14" title="存储使用">
            {[['数据存储', 71, 'blue'], ['备份存储', 54, 'violet'], ['日志存储', 42, 'cyan']].map(([l, v, t]) => <div className="mb-10" key={l as string}><div className="resource-head"><span>{l}</span><strong>{v}%</strong></div><Progress value={v as number} tone={t as string} height={7} /></div>)}
          </Card>
        </aside>
      </div>
    </>
  );
}
