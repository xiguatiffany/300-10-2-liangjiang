'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { tagCategories, tagObjects, residentTags, tagSamples, portalTrend } from '../../dataBid';

type HubTab = 'board' | 'factory' | 'share';

type TagDef = {
  id: string;
  name: string;
  type: '基础' | '规则' | '模型';
  category: string;
  object: '居民' | '医生' | '机构';
  samples: string;
  status: '草稿' | '加工中' | '已发布';
  owner: string;
};

type JobRow = { id: string; name: string; cron: string; last: string; status: '成功' | '运行中' | '失败'; kind: string };
type ShareApi = { id: string; name: string; path: string; enc: boolean; apps: number; status: '启用' | '停用' };

const factorySeed: TagDef[] = [
  { id: 'TG-01', name: '高血压', type: '规则', category: '慢病', object: '居民', samples: '12.6 万', status: '已发布', owner: '慢病中心' },
  { id: 'TG-02', name: '2 型糖尿病', type: '规则', category: '慢病', object: '居民', samples: '8.4 万', status: '已发布', owner: '慢病中心' },
  { id: 'TG-03', name: '高额费用', type: '模型', category: '费用', object: '居民', samples: '1.2 万', status: '加工中', owner: '医保办' },
  { id: 'TG-04', name: '重点人群', type: '基础', category: '管理', object: '居民', samples: '24.6 万', status: '已发布', owner: '公卫科' },
  { id: 'TG-05', name: '三甲专家', type: '规则', category: '人力', object: '医生', samples: '1,286', status: '已发布', owner: '人事科' },
  { id: 'TG-06', name: '基层示范机构', type: '基础', category: '机构', object: '机构', samples: '12', status: '草稿', owner: '基层卫生' },
];

const jobsSeed: JobRow[] = [
  { id: 'TJ-01', name: '看板日计算', cron: '每日 02:00', last: '02:12', status: '成功', kind: '看板' },
  { id: 'TJ-02', name: '标签有效期检查', cron: '每日 03:00', last: '03:05', status: '成功', kind: '有效期' },
  { id: 'TJ-03', name: '人数统计刷新', cron: '每小时', last: '14:00', status: '运行中', kind: '人数' },
  { id: 'TJ-04', name: '宽表增量加工', cron: '每日 01:30', last: '01:48', status: '失败', kind: '加工' },
];

const shareApis: ShareApi[] = [
  { id: 'TS-01', name: '标签查询', path: '/tag/v1/query', enc: true, apps: 14, status: '启用' },
  { id: 'TS-02', name: '临时 code 换票', path: '/tag/v1/code', enc: true, apps: 8, status: '启用' },
  { id: 'TS-03', name: 'pidkey 解析', path: '/tag/v1/pidkey', enc: true, apps: 6, status: '启用' },
  { id: 'TS-04', name: '分群导出', path: '/tag/v1/cohort/export', enc: false, apps: 3, status: '停用' },
];

/** B7 标签管理：看板▲ · 工厂 · 共享调度 */
export function TagHubPage() {
  const { go, notify } = useApp();
  const [hub, setHub] = useState<HubTab>('board');
  const [obj, setObj] = useState('resident');
  const [active, setActive] = useState<typeof residentTags[0] | null>(null);
  const [tq, setTq] = useState('');
  const [tags, setTags] = useState(factorySeed);
  const [jobs, setJobs] = useState(jobsSeed);
  const [activeTag, setActiveTag] = useState<TagDef | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ftype, setFtype] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);

  const current = tagObjects.find((o) => o.key === obj) || tagObjects[0];
  const boardRows = useMemo(() => residentTags.filter((t) =>
    (t.name + t.category).toLowerCase().includes(tq.toLowerCase())
  ), [tq]);

  const factoryRows = useMemo(() => tags.filter((t) =>
    (!ftype || t.type === ftype)
  ), [tags, ftype]);

  const runProcess = async (t: TagDef) => {
    setBusy(true);
    setHub('factory');
    await new Promise((r) => setTimeout(r, 900));
    setTags((arr) => arr.map((x) => x.id === t.id ? { ...x, status: '已发布' } : x));
    setActiveTag((x) => x && x.id === t.id ? { ...x, status: '已发布' } : x);
    setBusy(false);
    notify(`${t.name} 加工完成并发布 · 可分群共享`);
  };

  const runJob = async (j: JobRow) => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setJobs((arr) => arr.map((x) => x.id === j.id ? { ...x, status: '成功', last: '14:22' } : x));
    setBusy(false);
    notify(`${j.name} 已调度执行成功`);
  };

  const issueCode = () => {
    const code = `TCG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setShareCode(code);
    setHub('share');
    notify(`临时 code 已签发（加密传输）· ${code}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="TAG MANAGEMENT · B7"
        title="标签管理"
        desc="B7-01 三对象看板▲ · B7-02 标签工厂（管理/分析/加工） · B7-03 共享/定时任务/权限。"
        actions={
          <>
            <Btn icon="fingerprint" onClick={() => go('/bid/main-archive')}>居民主索引</Btn>
            <Btn icon="key" onClick={issueCode}>签发临时 code</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setHub('factory'); setNewOpen(true); }}>新建标签</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '看板▲', d: '三对象·下钻样本' },
          { n: '02', t: '标签工厂', d: '创建·加工·分群' },
          { n: '03', t: '共享调度', d: '加密接口·任务' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${hub === (['board', 'factory', 'share'] as HubTab[])[i] ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {current.label} {current.count} · 覆盖 {current.coverage}%</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="标签总数" value={String(current.count)} unit="个" delta="看板可下钻" icon="tags" tone="violet" onClick={() => setHub('board')} />
        <StatCard label="工厂标签" value={String(tags.length)} unit="个" delta={`已发布 ${tags.filter((t) => t.status === '已发布').length}`} icon="workflow" tone="blue" onClick={() => setHub('factory')} />
        <StatCard label="调度任务" value={String(jobs.length)} unit="个" delta="可调度" icon="clock" tone="cyan" onClick={() => setHub('share')} />
        <StatCard label="共享接口" value={String(shareApis.filter((a) => a.status === '启用').length)} unit="个" delta="加解密" icon="shield" tone="green" onClick={() => setHub('share')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={hub}
        onChange={(k) => setHub(k as HubTab)}
        items={[
          { key: 'board', label: '标签看板 ▲', count: current.count },
          { key: 'factory', label: '标签工厂', count: tags.length },
          { key: 'share', label: '共享与调度', count: jobs.length },
        ]}
      />

      {hub === 'board' && (
        <>
          <div className="tag-object-tabs mt-14">
            {tagObjects.map((o) => (
              <button key={o.key} type="button" className={obj === o.key ? 'is-active' : ''} onClick={() => setObj(o.key)}>
                <span className="tot-icon"><Icon name={o.key === 'resident' ? 'users' : o.key === 'doctor' ? 'usercog' : 'building'} size={16} /></span>
                <div><strong>{o.label}</strong><small>{o.count} 个标签</small></div>
                <em>{o.samples}</em>
              </button>
            ))}
            <div className="tag-object-meta">
              <span>样本覆盖</span>
              <strong>{current.coverage}%</strong>
              <div className="mini-track"><i style={{ width: `${current.coverage}%` }} /></div>
              <span className="muted xs">活跃 {current.active} 个</span>
            </div>
          </div>
          <div className="tagboard-grid mt-14">
            <Card title="标签类目分布" subtitle="按标签数量">
              <Donut size={145} thickness={12} centerValue={current.count.toString()} label="标签" segments={tagCategories} />
            </Card>
            <Card title="热门标签 TOP" subtitle="按样本数">
              <BarList items={residentTags.slice(0, 6).map((t) => ({ label: t.name, value: Number(t.samples.replace('万', '')) * 10000, display: t.samples }))} color="#9587FF" />
            </Card>
            <Card title="标签样本趋势" subtitle="近 8 个月">
              <AreaChart data={portalTrend.map((d, i) => ({ ...d, value: 68 + i * 3.6 }))} height={190} color="#0891B2" suffix=" 万" valueName="样本" />
            </Card>
            <Card title="标签词云" subtitle={`${current.label}热度`}>
              <div className="tag-cloud-board">
                {residentTags.map((t, i) => (
                  <button key={t.name} type="button" style={{ fontSize: 13 + (i % 4) * 3, color: t.color, opacity: 0.65 + (i % 3) * 0.15 }} onClick={() => setActive(t)}>{t.name}</button>
                ))}
              </div>
            </Card>
          </div>
          <Card className="mt-14" title={`${current.label}明细`} subtitle="下钻样本列表可演示" noPad actions={
            <SearchInput value={tq} onChange={setTq} placeholder="搜索标签" width={200} />
          }>
            <div className="pad-h">
              <DataTable rows={boardRows} pageSize={8} onRowClick={(r) => setActive(r)} columns={[
                { key: 'name', title: '标签名称', render: (t) => <div className="tag-name-cell"><span style={{ background: t.color }} /><strong>{t.name}</strong><Badge tone="slate">{t.category}</Badge></div> },
                { key: 'samples', title: '样本数', width: 100, align: 'right', render: (t) => <span className="mono-cell">{t.samples}</span> },
                { key: 'growth', title: '环比', width: 80, render: (t) => <span className="text-green">{t.growth}</span> },
                { key: 'owner', title: '维护部门', width: 100 },
                { key: 'ops', title: '操作', width: 130, render: (t) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="link-btn" onClick={() => setActive(t)}>样本</button>
                    <button type="button" className="link-muted" onClick={() => notify('标签分群已创建')}>分群</button>
                  </div>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      {hub === 'factory' && (
        <>
          <Card className="mt-14" title="标签工厂" subtitle="类目 · 基础/规则/模型 · 宽表加工 · 分群共享" noPad actions={
            <div className="filter-bar">
              <Select value={ftype} onChange={setFtype} options={['', '基础', '规则', '模型']} placeholder="全部类型" width={100} />
              <Btn size="sm" icon="plus" onClick={() => setNewOpen(true)}>新建</Btn>
            </div>
          }>
            <div className="pad-h">
              <DataTable rows={factoryRows} pageSize={6} onRowClick={(r) => setActiveTag(r)} columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '标签', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.category} · {r.object}</small></div> },
                { key: 'type', title: '类型', width: 64, render: (r) => <Badge tone={r.type === '模型' ? 'violet' : r.type === '规则' ? 'blue' : 'slate'}>{r.type}</Badge> },
                { key: 'samples', title: '样本', width: 80, align: 'right' },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '已发布' ? 'green' : r.status === '加工中' ? 'amber' : 'slate'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 100, render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    {r.status !== '已发布' ? (
                      <button type="button" className="link-btn" onClick={() => runProcess(r)}>加工</button>
                    ) : (
                      <button type="button" className="link-btn" onClick={() => notify(`已基于「${r.name}」创建分群`)}>分群</button>
                    )}
                  </div>
                ) },
              ]} />
            </div>
          </Card>
          <div className="grid grid-3 mt-14">
            {[
              { t: '群体分析', d: '按标签交叉圈选人群，输出覆盖与画像', icon: 'users' },
              { t: '宽表加工', d: '规则/模型标签写入标签宽表增量', icon: 'table' },
              { t: '标签共享', d: '发布后可供应用订阅与接口调用', icon: 'share' },
            ].map((x) => (
              <Card key={x.t} title={x.t} subtitle={x.d}>
                <Btn size="sm" icon={x.icon === 'share' ? 'network' : x.icon} onClick={() => notify(`${x.t}工作台已打开`, 'info')}>打开</Btn>
              </Card>
            ))}
          </div>
        </>
      )}

      {hub === 'share' && (
        <>
          {shareCode && (
            <div className="rc-query-out mt-14">
              <Icon name="key" size={14} />
              <span>临时 code：<strong className="mono">{shareCode}</strong> · pidkey 加解密通道已就绪 · 有效期 15 分钟</span>
              <Btn size="sm" onClick={() => setShareCode(null)}>关闭</Btn>
            </div>
          )}
          <div className="grid-2-1 mt-14">
            <Card title="标签共享接口" subtitle="临时 code / pidkey / 加解密" noPad>
              <div className="pad-h">
                <DataTable rows={shareApis} pageSize={5} columns={[
                  { key: 'name', title: '接口', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small className="mono-cell">{r.path}</small></div> },
                  { key: 'enc', title: '加密', width: 64, render: (r) => <Badge tone={r.enc ? 'green' : 'amber'}>{r.enc ? '是' : '否'}</Badge> },
                  { key: 'apps', title: '应用', width: 56, align: 'right' },
                  { key: 'status', title: '状态', width: 72, render: (r) => <Badge dot tone={r.status === '启用' ? 'green' : 'red'}>{r.status}</Badge> },
                ]} />
              </div>
            </Card>
            <Card title="权限与字典" subtitle="后台管控">
              <div className="md-cap-list">
                {[
                  { t: '对象权限', d: '居民/医生/机构标签按角色授权' },
                  { t: '接口权限', d: '应用密钥 + 临时 code 双因子' },
                  { t: '字典维护', d: '类目、枚举与有效期策略' },
                ].map((c) => (
                  <div key={c.t}><Icon name="checkcircle" size={13} /><div><strong>{c.t}</strong><small>{c.d}</small></div></div>
                ))}
              </div>
              <Btn className="mt-10" size="sm" icon="key" onClick={() => go('/admin/data-permissions')}>数据权限</Btn>
            </Card>
          </div>
          <Card className="mt-14" title="定时任务" subtitle="看板计算 · 有效期 · 人数统计 · 宽表加工" noPad>
            <div className="pad-h">
              <DataTable rows={jobs} pageSize={5} columns={[
                { key: 'id', title: '任务', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.kind} · {r.cron}</small></div> },
                { key: 'last', title: '最近', width: 70, render: (r) => <span className="muted">{r.last}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot tone={r.status === '成功' ? 'green' : r.status === '失败' ? 'red' : 'amber'}>{r.status}</Badge> },
                { key: 'ops', title: '操作', width: 80, render: (r) => (
                  <button type="button" className="link-btn" onClick={() => runJob(r)}>执行</button>
                ) },
              ]} />
            </div>
          </Card>
        </>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} width={620} title={active?.name || ''} desc={active ? `${active.category} · ${active.samples} · ${active.owner}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon="target" onClick={() => notify('已基于该标签创建分群')}>创建分群</Btn>
            <Btn variant="primary" icon="download" onClick={() => notify('样本清单已导出')}>导出样本</Btn>
          </>
        }
      >
        {active && (
          <>
            <div className="drawer-summary">
              <div><span>样本数</span><strong>{active.samples}</strong></div>
              <div><span>环比</span><strong className="text-green">{active.growth}</strong></div>
              <div><span>覆盖机构</span><strong>42</strong></div>
              <div><span>更新</span><strong className="sm">2026-08-06</strong></div>
            </div>
            <div className="section-title-sm mt-14">标签规则</div>
            <div className="code-sample">{`-- 标签：${active.name}\nSELECT patient_id\nFROM dwd.fact_visit\nWHERE age >= 60 AND visit_count >= 2\nGROUP BY patient_id;`}</div>
            <div className="section-title-sm mt-14">样本列表</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>患者ID</th><th>姓名</th><th>性别</th><th>年龄</th><th>标签</th><th>机构</th></tr></thead>
                <tbody>{tagSamples.map((r) => <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </Drawer>

      <Drawer open={!!activeTag} onClose={() => setActiveTag(null)} title={activeTag?.name || ''} desc={activeTag ? `${activeTag.type} · ${activeTag.object}` : ''} width={480}
        footer={
          <>
            <Btn onClick={() => setActiveTag(null)}>关闭</Btn>
            {activeTag && activeTag.status !== '已发布' && (
              <Btn variant="primary" loading={busy} onClick={() => activeTag && runProcess(activeTag)}>加工发布</Btn>
            )}
          </>
        }
      >
        {activeTag && (
          <KeyValue cols={2} items={[
            { label: '类目', value: activeTag.category },
            { label: '样本', value: activeTag.samples },
            { label: '负责人', value: activeTag.owner },
            { label: '状态', value: <Badge>{activeTag.status}</Badge> },
            { label: '闭环', value: '创建 → 规则/模型加工 → 分群 → 共享接口', wide: true },
          ]} />
        )}
      </Drawer>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="新建标签" desc="选择基础/规则/模型类型，进入加工流水线。" width={560}
        footer={
          <>
            <Btn onClick={() => setNewOpen(false)}>取消</Btn>
            <Btn variant="primary" onClick={() => {
              const id = `TG-${String(tags.length + 1).padStart(2, '0')}`;
              const row: TagDef = { id, name: '新建标签', type: '规则', category: '自定义', object: '居民', samples: '—', status: '草稿', owner: '数据治理办' };
              setTags((arr) => [row, ...arr]);
              setNewOpen(false);
              setActiveTag(row);
              notify('标签已创建（草稿），可加工发布');
            }}>创建</Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="标签名称" required className="span-2"><input className="input" placeholder="例如：复诊高风险" /></Field>
          <Field label="类型"><Select value="规则" onChange={() => {}} options={['基础', '规则', '模型']} /></Field>
          <Field label="对象"><Select value="居民" onChange={() => {}} options={['居民', '医生', '机构']} /></Field>
          <Field label="规则/特征" className="span-2"><textarea className="textarea" rows={3} placeholder="SQL / 规则表达式 / 模型特征" /></Field>
        </div>
      </Modal>
    </>
  );
}
