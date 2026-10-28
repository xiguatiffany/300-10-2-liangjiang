import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type Form = { id: string; name: string; category: string; period: string; dept: string; owner: string; deadline: string; status: string; progress: number };

const seedForms: Form[] = [
  { id: 'FR-2086', name: '医疗服务量月报', category: '医疗服务', period: '2026-07', dept: '医务处', owner: '陈晓', deadline: '2026-08-10', status: '待填报', progress: 0 },
  { id: 'FR-2085', name: '公立医院绩效考核补充数据', category: '国考指标', period: '2026-07', dept: '质管办', owner: '张敏', deadline: '2026-08-09', status: '填报中', progress: 60 },
  { id: 'FR-2084', name: '大型医用设备使用情况', category: '设备管理', period: '2026-Q2', dept: '设备处', owner: '周宁', deadline: '2026-08-08', status: '待审核', progress: 100 },
  { id: 'FR-2083', name: '医院感染监测月报', category: '院感防控', period: '2026-07', dept: '院感科', owner: '陈晓', deadline: '2026-08-12', status: '待填报', progress: 0 },
  { id: 'FR-2082', name: '医疗服务价格执行情况', category: '价格管理', period: '2026-07', dept: '财务处', owner: '刘一鸣', deadline: '2026-08-11', status: '已提交', progress: 100 },
  { id: 'FR-2081', name: '卫生人力资源统计', category: '人力资源', period: '2026-06', dept: '人事处', owner: '李建华', deadline: '2026-07-15', status: '已归档', progress: 100 },
  { id: 'FR-2080', name: '医疗质量安全改进目标', category: '医疗质量', period: '2026-Q2', dept: '质管办', owner: '张敏', deadline: '2026-07-20', status: '已提交', progress: 100 },
];

export function EntryPage() {
  const { notify } = useApp();
  const [rows, setRows] = useState(seedForms);
  const [tab, setTab] = useState('todo');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const filtered = rows.filter((r) => (tab === 'all' || (tab === 'todo' ? ['待填报', '填报中'].includes(r.status) : tab === 'done' ? ['已提交', '已归档'].includes(r.status) : r.status === '待审核')) && (r.name + r.dept).toLowerCase().includes(q.toLowerCase()));
  const submit = () => {
    if (!active) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setRows((arr) => arr.map((r) => r.id === active.id ? { ...r, status: '已提交', progress: 100 } : r));
      setActive(null); setSubmitting(false); notify('填报数据已提交，等待业务处室审核');
    }, 800);
  };
  return (
    <>
      <PageHeader eyebrow="DATA ENTRY" title="数据填报" desc="面向业务处室的数据填报与审核流程，支持模板化表单、数据校验、附件上传与提交留痕。" actions={<><Btn icon="download" onClick={() => notify('填报模板已下载')}>下载模板</Btn><Btn variant="primary" icon="plus" onClick={() => notify('自定义填报表单已打开', 'info')}>新建表单</Btn></>} />
      <div className="stat-grid">
        <StatCard label="填报表单" value="24" unit="个" delta="本月 6 个" icon="clipboard" tone="blue" />
        <StatCard label="待填报" value={rows.filter((r) => r.status === '待填报').length.toString()} unit="个" delta="即将到期 2 个" icon="clock" tone="amber" />
        <StatCard label="待审核" value={rows.filter((r) => r.status === '待审核').length.toString()} unit="个" delta="平均 1.2 天完成" icon="checkcircle" tone="cyan" />
        <StatCard label="本月按时完成率" value="96.4" unit="%" delta="+2.1% 环比" icon="target" tone="green" />
      </div>
      <div className="entry-layout mt-14">
        <Card className="entry-main" noPad>
          <div className="meta-toolbar">
            <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'todo', label: '待填报', count: rows.filter((r) => ['待填报', '填报中'].includes(r.status)).length }, { key: 'review', label: '待审核', count: rows.filter((r) => r.status === '待审核').length }, { key: 'done', label: '已完成' }, { key: 'all', label: '全部表单', count: rows.length }]} />
            <SearchInput value={q} onChange={setQ} placeholder="搜索表单或填报部门" width={230} />
          </div>
          <div className="pad-h">
            <DataTable rows={filtered} pageSize={7} onRowClick={(r) => setActive(r)} columns={[
              { key: 'name', title: '填报表单', render: (r) => <div className="entry-name"><span className="entry-ico"><Icon name="clipboard" size={14} /></span><div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.category}</small></div></div> },
              { key: 'period', title: '填报周期', width: 82, render: (r) => <Badge tone="slate">{r.period}</Badge> },
              { key: 'dept', title: '填报部门', width: 90 },
              { key: 'owner', title: '填报人', width: 80 },
              { key: 'deadline', title: '截止时间', width: 110, render: (r) => <span className={r.deadline < '2026-08-09' && r.status === '待填报' ? 'text-amber' : 'muted'}>{r.deadline}</span> },
              { key: 'progress', title: '完成度', width: 128, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.progress === 100 ? 'green' : r.progress > 0 ? 'blue' : 'slate'} /><span>{r.progress}%</span></div> },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge dot>{r.status}</Badge> },
              { key: 'ops', title: '操作', width: 90, render: (r) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => setActive(r)}>{['待填报', '填报中'].includes(r.status) ? '填报' : '查看'}</button></div> },
            ]} />
          </div>
        </Card>
        <aside className="entry-side">
          <Card title="填报进度" subtitle="本月截止任务">
            <div className="entry-progress">
              <div className="entry-ring"><Progress value={68} tone="blue" height={7} /><span>已完成填报 17 / 25</span></div>
              <div className="entry-ring"><Progress value={42} tone="green" height={7} /><span>已通过审核 10 / 24</span></div>
            </div>
            <div className="divider-h" />
            <div className="entry-deadline">
              <span className="live-badge"><i /> 临近截止</span>
              {rows.filter((r) => ['待填报', '填报中'].includes(r.status)).slice(0, 3).map((r) => (
                <div key={r.id}><span className={`status-dot tone-${r.deadline <= '2026-08-09' ? 'red' : 'amber'}`} /><div><strong>{r.name}</strong><small>截止 {r.deadline} · {r.dept}</small></div></div>
              ))}
            </div>
          </Card>
          <Card className="mt-14" title="填报说明">
            <ol className="entry-notes">
              <li>按模板要求填写数据，单位与统计口径以表单说明为准。</li>
              <li>提交前请使用「数据校验」检查逻辑关系，异常项需附说明。</li>
              <li>提交后由业务处室审核，退回的数据需在截止时间前重新提交。</li>
              <li>填报记录与附件将纳入审计留痕，保存期限 5 年。</li>
            </ol>
            <Btn size="sm" variant="secondary" className="mt-10 w-full" icon="book" onClick={() => notify('填报操作手册已打开', 'info')}>查看操作手册</Btn>
          </Card>
        </aside>
      </div>
      <Drawer open={!!active} onClose={() => setActive(null)} width={640} title={active?.name || ''} desc={active ? `${active.id} · ${active.period} · 截止 ${active.deadline}` : ''}
        footer={<><Btn onClick={() => setActive(null)}>取消</Btn><Btn onClick={() => notify('数据校验通过：8 项指标逻辑关系正常')}>数据校验</Btn><Btn variant="primary" loading={submitting} onClick={submit}>提交填报</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>填报部门</span><strong className="sm">{active.dept}</strong></div><div><span>填报人</span><strong className="sm">{active.owner}</strong></div><div><span>当前状态</span><strong className="sm">{active.status}</strong></div><div><span>完成度</span><strong>{active.progress}%</strong></div></div>
          <div className="form-grid mt-14">
            <Field label="门诊人次" required hint="统计周期内完成就诊的门诊人次"><input className="input" defaultValue="286420" /></Field>
            <Field label="住院人次" required hint="办理入院登记的住院人次"><input className="input" defaultValue="18642" /></Field>
            <Field label="手术台次" required hint="含门诊手术，排除取消手术"><input className="input" defaultValue="3862" /></Field>
            <Field label="平均住院日" required hint="出院患者平均住院天数"><input className="input" defaultValue="7.24" /></Field>
            <Field label="床位使用率"><input className="input" defaultValue="92.4" /></Field>
            <Field label="药占比"><input className="input" defaultValue="26.8" /></Field>
            <Field label="情况说明" className="span-2"><textarea className="textarea" rows={3} placeholder="如数据存在异常波动，请说明原因" /></Field>
            <Field label="佐证附件" className="span-2"><div className="upload-box"><Icon name="uploadcloud" size={18} /><strong>点击上传或拖拽文件到此处</strong><span>支持 PDF、Excel、Word，单个文件不超过 20MB</span></div></Field>
          </div>
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>填报数据将自动与数据中台指标比对，差异超过 5% 时将提示复核。</span></div>
        </>}
      </Drawer>
    </>
  );
}
