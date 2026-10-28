'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'template' | 'board' | 'menu' | 'page' | 'cms';

type Tpl = { id: string; name: string; kind: '首页' | '角色' | '大屏' | '移动'; role: string; widgets: number; status: '启用' | '草稿' };
type Board = { id: string; name: string; tpl: string; comps: number; owner: string; updated: string };
type MenuItem = { id: string; name: string; path: string; icon: string; role: string; visible: boolean };
type PageRow = { id: string; name: string; type: '定制页' | '编排页' | '外链'; status: '已发布' | '草稿'; updated: string };
type CmsDoc = { id: string; title: string; channel: '政策' | '通知' | '帮助'; status: '已发布' | '草稿'; updated: string };

const tpls: Tpl[] = [
  { id: 'TP-01', name: '领导驾驶舱首页', kind: '首页', role: '领导', widgets: 6, status: '启用' },
  { id: 'TP-02', name: '数据管理员首页', kind: '角色', role: '数据管理员', widgets: 6, status: '启用' },
  { id: 'TP-03', name: '临床业务首页', kind: '角色', role: '临床', widgets: 5, status: '启用' },
  { id: 'TP-04', name: '领导大屏模板', kind: '大屏', role: '领导', widgets: 12, status: '启用' },
  { id: 'TP-05', name: '移动端简报', kind: '移动', role: '全员', widgets: 4, status: '草稿' },
];

const boardsSeed: Board[] = [
  { id: 'BD-01', name: '全区健康态势看板', tpl: '领导驾驶舱首页', comps: 8, owner: '信息中心', updated: '10-27' },
  { id: 'BD-02', name: '采集质量运营看板', tpl: '数据管理员首页', comps: 7, owner: '治理办', updated: '10-26' },
  { id: 'BD-03', name: '临床质控关注看板', tpl: '临床业务首页', comps: 5, owner: '质管办', updated: '10-25' },
];

const menusSeed: MenuItem[] = [
  { id: 'MN-01', name: '首页大屏', path: '/bid/home', icon: 'dashboard', role: '全员', visible: true },
  { id: 'MN-02', name: '指标管理', path: '/bid/indicator-market', icon: 'store', role: '领导/管理', visible: true },
  { id: 'MN-03', name: '质控结果', path: '/bid/qc-results', icon: 'shield', role: '管理/临床', visible: true },
  { id: 'MN-04', name: '开放门户', path: '/bid/open-portal', icon: 'store', role: '管理', visible: true },
  { id: 'MN-05', name: '运维后台', path: '/admin/foundation', icon: 'settings', role: '管理员', visible: false },
];

const pagesSeed: PageRow[] = [
  { id: 'PG-01', name: '国考指标专题页', type: '编排页', status: '已发布', updated: '10-27' },
  { id: 'PG-02', name: '机构接入指南', type: '定制页', status: '已发布', updated: '10-20' },
  { id: 'PG-03', name: '外部监管报表', type: '外链', status: '草稿', updated: '10-18' },
];

const cmsSeed: CmsDoc[] = [
  { id: 'CM-01', title: '十四五全民健康信息化规划解读', channel: '政策', status: '已发布', updated: '10-05' },
  { id: 'CM-02', title: '2026 数据质量专项行动通知', channel: '通知', status: '已发布', updated: '10-03' },
  { id: 'CM-03', title: '门户使用帮助 · 自定义看板', channel: '帮助', status: '草稿', updated: '10-28' },
];

const palette = [
  { id: 'w1', name: 'KPI 卡片', group: '指标' },
  { id: 'w2', name: '趋势图', group: '图表' },
  { id: 'w3', name: '应用磁贴', group: '导航' },
  { id: 'w4', name: '待办列表', group: '协同' },
  { id: 'w5', name: '资讯流', group: 'CMS' },
  { id: 'w6', name: '关注指标', group: '指标' },
  { id: 'w7', name: '机构排名', group: '质量' },
  { id: 'w8', name: '快捷入口', group: '导航' },
];

/** C2-02 门户编排：模板 · 看板 · 菜单 · 页面 · CMS */
export function PortalComposerHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('template');
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [boards, setBoards] = useState(boardsSeed);
  const [menus, setMenus] = useState(menusSeed);
  const [pages, setPages] = useState(pagesSeed);
  const [cms, setCms] = useState(cmsSeed);
  const [canvas, setCanvas] = useState<string[]>(['w1', 'w2', 'w3', 'w4']);
  const [activeTpl, setActiveTpl] = useState<Tpl | null>(null);
  const [cmsOpen, setCmsOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);

  const tplRows = useMemo(() => tpls.filter((t) =>
    (!roleFilter || t.role.includes(roleFilter) || t.kind === roleFilter)
    && (t.name + t.role).toLowerCase().includes(q.toLowerCase())
  ), [roleFilter, q]);

  const addComp = (id: string) => {
    if (canvas.includes(id)) { notify('组件已在画布'); return; }
    setCanvas((arr) => [...arr, id]);
    setTab('board');
    notify(`${palette.find((p) => p.id === id)?.name} 已拖入看板画布`);
  };

  const removeComp = (id: string) => setCanvas((arr) => arr.filter((x) => x !== id));

  const publishBoard = () => {
    setBoards((arr) => [{
      id: `BD-${10 + arr.length}`, name: '新建编排看板', tpl: activeTpl?.name || '领导驾驶舱首页',
      comps: canvas.length, owner: '信息中心', updated: '刚刚',
    }, ...arr]);
    notify('看板已发布 · 角色模板可复用');
  };

  return (
    <>
      <PageHeader
        eyebrow="PORTAL COMPOSER · C2"
        title="门户编排"
        desc="C2-02 首页/角色模板 · 看板组件 · 菜单 · 定制页面 · 富文本 CMS。"
        actions={
          <>
            <Btn icon="dashboard" onClick={() => go('/bid/home')}>预览首页 ▲</Btn>
            <Btn icon="boxes" onClick={() => go('/admin/apps')}>应用管理</Btn>
            <Btn variant="primary" icon="uploadcloud" onClick={publishBoard}>发布看板</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '模板', d: '首页/角色/三端' },
          { n: '02', t: '看板编排', d: '拖拽组件复用' },
          { n: '03', t: '菜单', d: '角色差异化' },
          { n: '04', t: '页面', d: '定制/编排/外链' },
          { n: '05', t: 'CMS', d: '富文本资讯' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (['template', 'board', 'menu', 'page', 'cms'] as TabKey[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 4 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> 拖拽编排 · 模板复用 · 角色差异</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="门户模板" value={String(tpls.length)} unit="套" delta="含三端" icon="dashboard" tone="blue" onClick={() => setTab('template')} />
        <StatCard label="看板" value={String(boards.length)} unit="个" delta="可编排" icon="chart" tone="violet" onClick={() => setTab('board')} />
        <StatCard label="菜单项" value={String(menus.length)} unit="个" delta="可显隐" icon="menu" tone="cyan" onClick={() => setTab('menu')} />
        <StatCard label="CMS 文档" value={String(cms.length)} unit="篇" delta="可发布" icon="file" tone="green" onClick={() => setTab('cms')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'template', label: '模板', count: tpls.length },
          { key: 'board', label: '看板编排', count: boards.length },
          { key: 'menu', label: '菜单', count: menus.length },
          { key: 'page', label: '页面', count: pages.length },
          { key: 'cms', label: 'CMS', count: cms.length },
        ]}
      />

      {tab === 'template' && (
        <>
          <div className="market-filters mt-14">
            <div className="market-cats">
              {['', '首页', '角色', '大屏', '移动'].map((k) => (
                <button key={k || 'all'} className={roleFilter === k ? 'is-active' : !k && !roleFilter ? 'is-active' : ''} onClick={() => setRoleFilter(k)}>
                  {k || '全部类型'}
                </button>
              ))}
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="搜索模板" width={180} />
          </div>
          <Card className="mt-14" title="首页 / 角色模板" subtitle="验收：模板复用、角色差异化" noPad>
            <div className="pad-h">
              <DataTable rows={tplRows} pageSize={8} columns={[
                { key: 'name', title: '模板', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.role}</small></div> },
                { key: 'kind', title: '类型', width: 70, render: (r) => <Badge tone={r.kind === '大屏' ? 'cyan' : r.kind === '移动' ? 'amber' : 'blue'}>{r.kind}</Badge> },
                { key: 'widgets', title: '组件', width: 60, render: (r) => r.widgets },
                { key: 'status', title: '状态', width: 70, render: (r) => <Badge tone={r.status === '启用' ? 'green' : 'slate'} dot>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 140, render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => { setActiveTpl(r); setTab('board'); notify(`已加载模板「${r.name}」到编排画布`); }}>编排</button>
                    <button className="link-muted" onClick={() => go('/bid/home')}>预览</button>
                    <button className="link-muted" onClick={() => notify(`${r.name} 已复制为新模板`)}>复制</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      {tab === 'board' && (
        <div className="qc-hub-layout mt-14">
          <Card title="组件库" subtitle="点击加入画布" noPad>
            <div className="qc-palette-list" style={{ padding: 10 }}>
              {palette.map((p) => (
                <button key={p.id} type="button" className="qc-palette-item" onClick={() => addComp(p.id)}>
                  <span><Icon name="chart" size={14} /></span>
                  <div><strong>{p.name}</strong><small>{p.group}</small></div>
                  <Icon name="plus" size={12} />
                </button>
              ))}
            </div>
          </Card>
          <Card
            className="qc-hub-canvas-card"
            title={activeTpl ? `编排 · ${activeTpl.name}` : '看板画布'}
            subtitle="拖拽编排示意 · 组件可删可排序"
            actions={<Btn size="sm" variant="primary" onClick={publishBoard}>保存发布</Btn>}
          >
            <div className="portal-canvas">
              {canvas.length === 0 ? <div className="empty-hint">从左侧组件库添加组件</div> : canvas.map((id) => {
                const p = palette.find((x) => x.id === id)!;
                return (
                  <div key={id} className="portal-canvas-item">
                    <strong>{p.name}</strong>
                    <small>{p.group}</small>
                    <button type="button" onClick={() => removeComp(id)}><Icon name="x" size={12} /></button>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="qc-hub-side">
            <Card title="已发布看板" subtitle="可复用">
              <div className="check-list">
                {boards.map((b) => (
                  <div key={b.id}>
                    <span className="ok"><Icon name="check" size={12} /></span>
                    <strong>{b.name}</strong>
                    <em>{b.comps} 组件</em>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="mt-14" title="图标 / 主题" subtitle="端适配">
              <div className="tag-row">
                {['PC', '移动', '大屏'].map((t) => <Badge key={t} tone="blue">{t}</Badge>)}
              </div>
              <div className="info-note mt-14"><Icon name="sparkles" size={13} /><span>同一模板可映射三端主题，组件自动适配密度。</span></div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'menu' && (
        <Card className="mt-14" title="菜单编排" subtitle="按角色显隐 · 差异化导航" noPad>
          <div className="pad-h">
            <DataTable rows={menus} pageSize={8} columns={[
              { key: 'name', title: '菜单', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.path}</small></div> },
              { key: 'icon', title: '图标', width: 70, render: (r) => <Icon name={r.icon} size={14} /> },
              { key: 'role', title: '角色范围', width: 110, render: (r) => r.role },
              { key: 'visible', title: '可见', width: 70, render: (r) => <Badge tone={r.visible ? 'green' : 'slate'}>{r.visible ? '显示' : '隐藏'}</Badge> },
              { key: 'ops', title: '操作', width: 100, render: (r) => (
                <button className="link-btn" onClick={() => {
                  setMenus((arr) => arr.map((m) => m.id === r.id ? { ...m, visible: !m.visible } : m));
                  notify(`${r.name} 已${r.visible ? '隐藏' : '显示'}`);
                }}>{r.visible ? '隐藏' : '显示'}</button>
              ) },
            ]} />
          </div>
        </Card>
      )}

      {tab === 'page' && (
        <Card className="mt-14" title="页面编排" subtitle="定制页 / 编排页 / 外链" noPad actions={
          <Btn size="sm" variant="primary" icon="plus" onClick={() => setPageOpen(true)}>新建页面</Btn>
        }>
          <div className="pad-h">
            <DataTable rows={pages} pageSize={8} columns={[
              { key: 'name', title: '页面', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id}</small></div> },
              { key: 'type', title: '类型', width: 80, render: (r) => <Badge tone="blue">{r.type}</Badge> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已发布' ? 'green' : 'slate'} dot>{r.status}</Badge> },
              { key: 'updated', title: '更新', width: 80, render: (r) => r.updated },
              { key: 'ops', title: '操作', width: 100, render: (r) => (
                <div className="row-actions">
                  <button className="link-btn" onClick={() => notify(`${r.name} 编辑器已打开`)}>编辑</button>
                  <button className="link-muted" onClick={() => {
                    setPages((arr) => arr.map((p) => p.id === r.id ? { ...p, status: '已发布' } : p));
                    notify(`${r.name} 已发布`);
                  }}>发布</button>
                </div>
              ) },
            ]} />
          </div>
        </Card>
      )}

      {tab === 'cms' && (
        <Card className="mt-14" title="富文本 CMS" subtitle="政策 / 通知 / 帮助" noPad actions={
          <Btn size="sm" variant="primary" icon="plus" onClick={() => setCmsOpen(true)}>新建文档</Btn>
        }>
          <div className="pad-h">
            <DataTable rows={cms} pageSize={8} columns={[
              { key: 'title', title: '标题', render: (r) => <div className="cell-main"><strong>{r.title}</strong><small>{r.id}</small></div> },
              { key: 'channel', title: '频道', width: 70, render: (r) => <Badge tone={r.channel === '政策' ? 'blue' : r.channel === '通知' ? 'amber' : 'green'}>{r.channel}</Badge> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={r.status === '已发布' ? 'green' : 'slate'} dot>{r.status}</Badge> },
              { key: 'updated', title: '更新', width: 80, render: (r) => r.updated },
              { key: 'ops', title: '操作', width: 100, render: (r) => (
                <div className="row-actions">
                  <button className="link-btn" onClick={() => notify('富文本编辑器已打开')}>编辑</button>
                  <button className="link-muted" onClick={() => {
                    setCms((arr) => arr.map((c) => c.id === r.id ? { ...c, status: '已发布' } : c));
                    notify('CMS 文档已发布到门户资讯');
                  }}>发布</button>
                </div>
              ) },
            ]} />
          </div>
        </Card>
      )}

      <Drawer open={!!activeTpl} onClose={() => setActiveTpl(null)} title={activeTpl?.name || ''} width={420}
        footer={<><Btn onClick={() => setActiveTpl(null)}>关闭</Btn><Btn variant="primary" onClick={() => { setTab('board'); setActiveTpl(null); }}>去编排</Btn></>}>
        {activeTpl && (
          <KeyValue cols={2} items={[
            { label: '类型', value: activeTpl.kind },
            { label: '角色', value: activeTpl.role },
            { label: '组件数', value: String(activeTpl.widgets) },
            { label: '状态', value: activeTpl.status },
            { label: '说明', value: '可复制为角色模板，绑定看板组件与菜单显隐策略。', wide: true },
          ]} />
        )}
      </Drawer>

      <Modal open={pageOpen} onClose={() => setPageOpen(false)} title="新建页面" width={520}
        footer={<><Btn onClick={() => setPageOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => {
          setPageOpen(false);
          setPages((arr) => [{ id: `PG-${10 + arr.length}`, name: '新建定制页面', type: '定制页', status: '草稿', updated: '刚刚' }, ...arr]);
          notify('页面已创建（草稿）');
        }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="页面名称" required className="span-2"><input className="input" placeholder="例如：国考专题" /></Field>
          <Field label="类型"><Select value="定制页" onChange={() => {}} options={['定制页', '编排页', '外链']} /></Field>
          <Field label="绑定模板"><Select value={tpls[0].name} onChange={() => {}} options={tpls.map((t) => t.name)} /></Field>
        </div>
      </Modal>

      <Modal open={cmsOpen} onClose={() => setCmsOpen(false)} title="新建 CMS 文档" width={560}
        footer={<><Btn onClick={() => setCmsOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => {
          setCmsOpen(false);
          setCms((arr) => [{ id: `CM-${10 + arr.length}`, title: '新建门户资讯', channel: '通知', status: '草稿', updated: '刚刚' }, ...arr]);
          notify('CMS 文档已创建');
        }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="标题" required className="span-2"><input className="input" placeholder="资讯标题" /></Field>
          <Field label="频道"><Select value="通知" onChange={() => {}} options={['政策', '通知', '帮助']} /></Field>
          <Field label="正文" className="span-2"><textarea className="textarea" rows={5} placeholder="支持富文本（演示）" /></Field>
        </div>
      </Modal>
    </>
  );
}
