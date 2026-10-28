'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type MappingRow = { srcCode: string; srcName: string; stdCode: string; stdName: string; conf: number; status: string };
type CodeScheme = {
  id: string;
  name: string;
  domain: string;
  source: string;
  stdDict: string;
  mappings: number;
  matched: number;
  status: '草稿' | '审核中' | '已发布' | '已停用';
  owner: string;
  updated: string;
  version: string;
  rows: MappingRow[];
};

type StdTask = {
  id: string;
  table: string;
  source: string;
  org: string;
  assignee: string;
  level: '一级分派' | '二级分派';
  status: '待接收' | '开发中' | '待审核' | '已完成' | '已退回' | '缺项豁免';
  progress: number;
  due: string;
  script?: string;
  logs?: string[];
};

const schemes: CodeScheme[] = [
  {
    id: 'MAP-SEX-01', name: '性别代码对码', domain: '患者主数据', source: 'HIS 本地性别', stdDict: 'GB/T 2261.1 性别',
    mappings: 6, matched: 6, status: '已发布', owner: '张敏', updated: '2026-08-02 14:20', version: 'V1.2',
    rows: [
      { srcCode: '1', srcName: '男', stdCode: '1', stdName: '男性', conf: 100, status: '已确认' },
      { srcCode: '2', srcName: '女', stdCode: '2', stdName: '女性', conf: 100, status: '已确认' },
      { srcCode: '0', srcName: '未知', stdCode: '0', stdName: '未知的性别', conf: 98, status: '已确认' },
      { srcCode: '9', srcName: '未说明', stdCode: '9', stdName: '未说明的性别', conf: 96, status: '已确认' },
    ],
  },
  {
    id: 'MAP-ICD-02', name: '门诊诊断 ICD 对码', domain: '诊断编码', source: 'HIS 院内诊断码', stdDict: 'ICD-10 国临版 2.0',
    mappings: 1286, matched: 1210, status: '审核中', owner: '李建华', updated: '2026-08-05 09:40', version: 'V0.9',
    rows: [
      { srcCode: 'I10.x00', srcName: '高血压', stdCode: 'I10', stdName: '原发性高血压', conf: 92, status: '待确认' },
      { srcCode: 'E11.900', srcName: '2型糖尿病', stdCode: 'E11.9', stdName: '2型糖尿病不伴并发症', conf: 95, status: '已确认' },
      { srcCode: 'J18.900', srcName: '肺炎', stdCode: 'J18.9', stdName: '肺炎，未特指', conf: 88, status: '待确认' },
      { srcCode: 'Z00.001', srcName: '健康体检', stdCode: 'Z00.0', stdName: '一般性健康检查', conf: 90, status: '已确认' },
    ],
  },
  {
    id: 'MAP-DEPT-03', name: '科室字典对码', domain: '组织机构', source: 'HRP 科室编码', stdDict: '卫健委科室分类',
    mappings: 186, matched: 172, status: '已发布', owner: '陈晓', updated: '2026-07-28 16:05', version: 'V2.0',
    rows: [
      { srcCode: 'NK01', srcName: '心血管内科', stdCode: 'A03.01', stdName: '心血管内科', conf: 100, status: '已确认' },
      { srcCode: 'WK02', srcName: '普外科', stdCode: 'A04.01', stdName: '普通外科', conf: 97, status: '已确认' },
    ],
  },
  {
    id: 'MAP-LAB-04', name: '检验项目对码', domain: '检验检查', source: 'LIS 本地项目', stdDict: '互认检验项目目录',
    mappings: 420, matched: 286, status: '草稿', owner: '赵倩', updated: '2026-08-06 11:12', version: 'V0.3',
    rows: [
      { srcCode: 'GLU', srcName: '血糖', stdCode: 'LAB-GLU', stdName: '葡萄糖测定', conf: 94, status: '待确认' },
      { srcCode: 'HGB', srcName: '血红蛋白', stdCode: 'LAB-HGB', stdName: '血红蛋白测定', conf: 91, status: '待确认' },
    ],
  },
  {
    id: 'MAP-DRUG-05', name: '药品通用名对码', domain: '药品耗材', source: 'HIS 药品目录', stdDict: '国家药品编码',
    mappings: 3560, matched: 2980, status: '已停用', owner: '张敏', updated: '2026-06-18 10:00', version: 'V1.0',
    rows: [
      { srcCode: 'YP001', srcName: '阿司匹林肠溶片', stdCode: 'XJ01AA01', stdName: '阿司匹林', conf: 99, status: '已确认' },
    ],
  },
];

const tasks: StdTask[] = [
  { id: 'ST-2401', table: 'ods_his.patient', source: 'HISDB.dbo.PATIENT', org: '重医附二院', assignee: '张敏', level: '一级分派', status: '开发中', progress: 72, due: '2026-08-12', script: "INSERT INTO dwd_patient SELECT ...", logs: ['08-06 10:12 接收任务', '08-06 14:20 提交脚本预检通过'] },
  { id: 'ST-2402', table: 'ods_lis.lab_report', source: 'LIS_PROD.dbo.REPORT_MAIN', org: '两江医院', assignee: '李建华', level: '一级分派', status: '待审核', progress: 100, due: '2026-08-10', script: "CREATE TABLE dwd_lab_report AS ...", logs: ['08-05 09:00 接收任务', '08-06 16:40 提交审核'] },
  { id: 'ST-2403', table: 'ods_emr.visit', source: 'EMRDB.dbo.VISIT', org: '渝北人民医院', assignee: '陈晓', level: '二级分派', status: '待接收', progress: 0, due: '2026-08-15', logs: ['08-06 11:00 由重医附二院二级分派'] },
  { id: 'ST-2404', table: 'ods_his.diag_detail', source: 'HISDB.dbo.DIAG', org: '重医附二院', assignee: '赵倩', level: '一级分派', status: '已完成', progress: 100, due: '2026-08-01', script: "SELECT * FROM map_icd ...", logs: ['08-01 18:00 审核通过并调度'] },
  { id: 'ST-2405', table: 'ods_ph.hypertension', source: 'PHDB.dbo.HTN', org: '两江疾控', assignee: '陈晓', level: '一级分派', status: '缺项豁免', progress: 0, due: '2026-08-20', logs: ['08-04 登记业务缺项：未开展高血压专档'] },
  { id: 'ST-2406', table: 'ods_his.order_item', source: 'HISDB.dbo.ORDERS', org: '两江医院', assignee: '李建华', level: '一级分派', status: '已退回', progress: 40, due: '2026-08-09', logs: ['08-06 审核退回：缺主键映射说明'] },
  { id: 'ST-2407', table: 'ods_ris.pacs_study', source: 'RISDB.dbo.STUDY', org: '重医附二院', assignee: '张敏', level: '一级分派', status: '开发中', progress: 35, due: '2026-08-18' },
  { id: 'ST-2408', table: 'ods_emr.admission', source: 'EMRDB.dbo.ADMISSION', org: '渝北人民医院', assignee: '赵倩', level: '二级分派', status: '待审核', progress: 100, due: '2026-08-11' },
];

const statusTone = (s: string) => {
  if (['已发布', '已完成', '已确认'].includes(s)) return 'green';
  if (['审核中', '待审核', '开发中', '待确认'].includes(s)) return 'amber';
  if (['待接收', '草稿'].includes(s)) return 'slate';
  if (['已退回', '已停用'].includes(s)) return 'red';
  if (s === '缺项豁免') return 'violet';
  return 'blue';
};

export function CodeMappingPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [domain, setDomain] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<CodeScheme | null>(null);
  const [tab, setTab] = useState('list');

  const rows = useMemo(() => schemes.filter((s) =>
    (!status || s.status === status)
    && (!domain || s.domain === domain)
    && (s.name + s.id + s.source + s.stdDict).toLowerCase().includes(q.toLowerCase())
  ), [q, status, domain]);

  return (
    <>
      <PageHeader
        eyebrow="CODE MAPPING"
        title="对码方案管理"
        desc="引用数据中台值域字典，建立原始编码与标准编码映射；发布后可在标化开发中直接转码复用。"
        actions={
          <>
            <Btn icon="download" onClick={() => notify('对码方案清单已导出')}>导出</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建对码方案</Btn>
          </>
        }
      />
      <div className="stat-grid">
        <StatCard label="对码方案" value={String(schemes.length)} unit="套" delta="已发布 2 套" icon="braces" tone="blue" />
        <StatCard label="映射条目" value="5,458" unit="条" delta="自动匹配 4,920" icon="list" tone="violet" />
        <StatCard label="匹配确认率" value="89.2" unit="%" delta="+3.1% 本周" icon="checkcircle" tone="green" />
        <StatCard label="待确认" value="286" unit="条" delta="涉及 2 套方案" icon="circlealert" tone="amber" />
      </div>

      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs
            variant="line"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'list', label: '方案列表', count: rows.length },
              { key: 'reuse', label: '开发复用' },
            ]}
          />
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="搜索方案、字典、来源" width={220} />
            <Select value={domain} onChange={setDomain} options={['', '患者主数据', '诊断编码', '组织机构', '检验检查', '药品耗材']} placeholder="业务域" width={120} />
            <Select value={status} onChange={setStatus} options={['', '草稿', '审核中', '已发布', '已停用']} placeholder="状态" width={110} />
          </div>
        </div>

        {tab === 'list' ? (
          <div className="pad-h">
            <DataTable
              rows={rows}
              pageSize={6}
              onRowClick={(r) => setActive(r)}
              columns={[
                { key: 'id', title: '方案编码', width: 120, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '方案名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.domain} · {r.version}</small></div> },
                { key: 'source', title: '原始字典', width: 150, render: (r) => r.source },
                { key: 'stdDict', title: '标准值域', width: 160, render: (r) => r.stdDict },
                { key: 'matched', title: '匹配进度', width: 120, render: (r) => <div className="cell-main"><strong>{r.matched}/{r.mappings}</strong><small>{Math.round((r.matched / r.mappings) * 100)}%</small></div> },
                { key: 'status', title: '状态', width: 88, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
                { key: 'owner', title: '负责人', width: 72, render: (r) => r.owner },
                {
                  key: 'ops', title: '操作', width: 160,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => setActive(r)}>查看</button>
                      {r.status === '草稿' && <button className="link-btn" onClick={() => notify(`${r.name} 已提交审核`)}>提交审核</button>}
                      {r.status === '审核中' && <button className="link-btn" onClick={() => notify(`${r.name} 已发布`, 'success')}>发布</button>}
                      {r.status === '已发布' && <button className="link-muted" onClick={() => notify(`${r.name} 已停用`, 'info')}>停用</button>}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <div className="pad-h">
            <div className="info-note"><Icon name="sparkles" size={13} /><span>已发布方案可在标化 SQL 中通过 <code>APPLY_MAP('方案编码')</code> 引用；以下为开发侧可见清单。</span></div>
            <div className="mt-14">
              <DataTable
                rows={schemes.filter((s) => s.status === '已发布')}
                pageSize={5}
                columns={[
                  { key: 'id', title: '方案编码', width: 120, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'name', title: '方案名称', render: (r) => r.name },
                  { key: 'stdDict', title: '标准值域', render: (r) => r.stdDict },
                  { key: 'version', title: '版本', width: 72, render: (r) => r.version },
                  { key: 'ops', title: '操作', width: 120, render: (r) => <button className="link-btn" onClick={() => { navigator.clipboard?.writeText(`APPLY_MAP('${r.id}')`); notify('引用片段已复制'); }}>复制引用</button> },
                ]}
              />
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建对码方案"
        desc="选择原始字典与标准值域，系统可先做自动匹配，再由人工确认。"
        width={640}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('对码方案已创建为草稿'); }}>创建草稿</Btn></>}
      >
        <div className="form-grid">
          <Field label="方案名称" required><input className="input" placeholder="例如：门诊诊断 ICD 对码" /></Field>
          <Field label="业务域" required><Select value="诊断编码" onChange={() => {}} options={['患者主数据', '诊断编码', '组织机构', '检验检查', '药品耗材']} /></Field>
          <Field label="原始字典" required><Select value="" onChange={() => {}} options={['HIS 院内诊断码', 'HIS 本地性别', 'LIS 本地项目', 'HRP 科室编码']} placeholder="选择源端字典" /></Field>
          <Field label="标准值域" required><Select value="" onChange={() => {}} options={['ICD-10 国临版 2.0', 'GB/T 2261.1 性别', '互认检验项目目录', '卫健委科室分类']} placeholder="引用中台值域" /></Field>
          <Field label="负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩']} /></Field>
          <Field label="自动匹配"><Select value="开启" onChange={() => {}} options={['开启', '关闭']} /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="描述对码用途、适用范围与注意事项" /></Field>
        </div>
      </Modal>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={720}
        title={active?.name || ''}
        desc={active ? `${active.id} · ${active.stdDict} · ${active.version}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            <Btn icon="checkcircle" onClick={() => notify('已批量确认高置信映射')}>批量确认</Btn>
            <Btn variant="primary" onClick={() => notify(active?.status === '已发布' ? '方案已同步至开发侧' : '已提交审核')}>
              {active?.status === '已发布' ? '同步开发' : '提交审核'}
            </Btn>
          </>
        }
      >
        {active && (
          <>
            <KeyValue
              cols={2}
              items={[
                { label: '原始字典', value: active.source },
                { label: '标准值域', value: active.stdDict },
                { label: '匹配进度', value: `${active.matched}/${active.mappings}` },
                { label: '状态', value: <Badge tone={statusTone(active.status)} dot>{active.status}</Badge> },
                { label: '负责人', value: active.owner },
                { label: '更新时间', value: active.updated },
              ]}
            />
            <div className="divider-h" />
            <div className="section-title-sm">映射明细</div>
            <div className="mt-10">
              <DataTable
                rows={active.rows}
                pageSize={6}
                columns={[
                  { key: 'srcCode', title: '原始编码', width: 100, render: (r) => <span className="mono-cell">{r.srcCode}</span> },
                  { key: 'srcName', title: '原始名称', render: (r) => r.srcName },
                  { key: 'stdCode', title: '标准编码', width: 100, render: (r) => <span className="mono-cell">{r.stdCode}</span> },
                  { key: 'stdName', title: '标准名称', render: (r) => r.stdName },
                  { key: 'conf', title: '置信度', width: 72, render: (r) => `${r.conf}%` },
                  { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
                ]}
              />
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

export function StdTasksPage() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [org, setOrg] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<StdTask | null>(null);
  const [exemptOpen, setExemptOpen] = useState(false);

  const rows = useMemo(() => tasks.filter((t) =>
    (!org || t.org === org)
    && (!status || t.status === status)
    && (t.id + t.table + t.source + t.assignee).toLowerCase().includes(q.toLowerCase())
  ), [q, org, status]);

  const counts = {
    todo: tasks.filter((t) => t.status === '待接收').length,
    doing: tasks.filter((t) => t.status === '开发中').length,
    review: tasks.filter((t) => t.status === '待审核').length,
    done: tasks.filter((t) => t.status === '已完成').length,
  };

  return (
    <>
      <PageHeader
        eyebrow="STANDARDIZATION TASKS"
        title="标化任务分派"
        desc="按机构分派湖仓标化开发任务，支持二级分派；接收方完成 SQL 开发后提交审核与调度。"
        actions={
          <>
            <Btn icon="file" onClick={() => setExemptOpen(true)}>业务缺项登记</Btn>
            <Btn icon="gauge" onClick={() => go('/collection/std-monitor')}>任务监控</Btn>
            <Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>分派数据表</Btn>
          </>
        }
      />
      <div className="stat-grid">
        <StatCard label="待接收" value={String(counts.todo)} unit="项" delta="需机构确认" icon="mail" tone="slate" />
        <StatCard label="开发中" value={String(counts.doing)} unit="项" delta="本周新增 3" icon="workflow" tone="blue" />
        <StatCard label="待审核" value={String(counts.review)} unit="项" delta="等待管理员" icon="listfilter" tone="amber" />
        <StatCard label="已完成" value={String(counts.done)} unit="项" delta="可调度入仓" icon="checkcircle" tone="green" />
      </div>

      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <div className="filter-bar">
            <SearchInput value={q} onChange={setQ} placeholder="搜索任务号、表名、负责人" width={240} />
            <Select value={org} onChange={setOrg} options={['', '重医附二院', '两江医院', '渝北人民医院', '两江疾控']} placeholder="归属机构" width={140} />
            <Select value={status} onChange={setStatus} options={['', '待接收', '开发中', '待审核', '已完成', '已退回', '缺项豁免']} placeholder="任务状态" width={120} />
          </div>
          <span className="table-note"><Icon name="shield" size={12} /> 二级分派后由接收机构完成标化开发</span>
        </div>
        <div className="pad-h">
          <DataTable
            rows={rows}
            pageSize={8}
            onRowClick={(r) => setActive(r)}
            columns={[
              { key: 'id', title: '任务号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
              { key: 'table', title: '目标表', render: (r) => <div className="cell-main"><strong className="mono">{r.table}</strong><small>{r.source}</small></div> },
              { key: 'org', title: '归属机构', width: 110, render: (r) => r.org },
              { key: 'assignee', title: '接收人', width: 72, render: (r) => r.assignee },
              { key: 'level', title: '分派层级', width: 88, render: (r) => <Badge tone={r.level === '二级分派' ? 'violet' : 'blue'}>{r.level}</Badge> },
              { key: 'progress', title: '进度', width: 100, render: (r) => <div className="cell-main"><strong>{r.progress}%</strong><div className="coverage-track" style={{ marginTop: 4 }}><i style={{ width: `${r.progress}%`, background: '#6755F5' }} /></div></div> },
              { key: 'status', title: '状态', width: 88, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              { key: 'due', title: '截止日期', width: 96, render: (r) => r.due },
              {
                key: 'ops', title: '操作', width: 150,
                render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="link-btn" onClick={() => setActive(r)}>详情</button>
                    {r.status === '待接收' && <button className="link-btn" onClick={() => notify(`${r.id} 已接收`)}>接收</button>}
                    {r.status === '开发中' && <button className="link-btn" onClick={() => go('/collection/std-sql')}>写脚本</button>}
                    {r.status === '待审核' && <button className="link-btn" onClick={() => notify(`${r.id} 审核通过，可调度`)}>审核</button>}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="分派数据表"
        desc="选择待标化表并指定接收机构；支持先一级分派，再由机构内部二级分派。"
        width={640}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('标化任务已分派'); }}>确认分派</Btn></>}
      >
        <div className="form-grid">
          <Field label="目标表" required className="span-2"><Select value="" onChange={() => {}} options={['ods_his.patient', 'ods_lis.lab_report', 'ods_emr.visit', 'ods_his.diag_detail']} placeholder="选择湖仓表" /></Field>
          <Field label="归属机构" required><Select value="重医附二院" onChange={() => {}} options={['重医附二院', '两江医院', '渝北人民医院', '两江疾控']} /></Field>
          <Field label="接收人" required><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩']} /></Field>
          <Field label="分派层级"><Select value="一级分派" onChange={() => {}} options={['一级分派', '二级分派']} /></Field>
          <Field label="截止日期"><input className="input" type="date" defaultValue="2026-08-20" /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="标化口径、依赖对码方案、验收要求" /></Field>
        </div>
      </Modal>

      <Modal
        open={exemptOpen}
        onClose={() => setExemptOpen(false)}
        title="业务缺项登记"
        desc="机构未开展对应业务时可登记缺项，免除对应标化开发分派。"
        width={560}
        footer={<><Btn onClick={() => setExemptOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setExemptOpen(false); notify('业务缺项已登记，相关任务已豁免'); }}>提交登记</Btn></>}
      >
        <div className="form-grid">
          <Field label="机构" required><Select value="两江疾控" onChange={() => {}} options={['重医附二院', '两江医院', '渝北人民医院', '两江疾控']} /></Field>
          <Field label="业务域" required><Select value="公卫专档" onChange={() => {}} options={['公卫专档', '血液透析', '手术麻醉', '体检']} /></Field>
          <Field label="关联表" className="span-2"><input className="input" placeholder="ods_ph.hypertension" /></Field>
          <Field label="缺项说明" className="span-2" required><textarea className="textarea" rows={3} placeholder="说明未开展原因及佐证材料编号" /></Field>
        </div>
      </Modal>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        width={640}
        title={active ? `${active.id} · ${active.table}` : ''}
        desc={active ? `${active.org} · ${active.level} · ${active.assignee}` : ''}
        footer={
          <>
            <Btn onClick={() => setActive(null)}>关闭</Btn>
            {active?.status === '开发中' && <Btn onClick={() => go('/collection/std-sql')}>打开 SQL 工作台</Btn>}
            <Btn variant="primary" onClick={() => notify(active?.status === '待审核' ? '审核通过' : '状态已更新')}>
              {active?.status === '待审核' ? '通过审核' : '更新进度'}
            </Btn>
          </>
        }
      >
        {active && (
          <>
            <KeyValue
              cols={2}
              items={[
                { label: '源端表', value: <span className="mono">{active.source}</span> },
                { label: '目标表', value: <span className="mono">{active.table}</span> },
                { label: '状态', value: <Badge tone={statusTone(active.status)} dot>{active.status}</Badge> },
                { label: '进度', value: `${active.progress}%` },
                { label: '截止日期', value: active.due },
                { label: '分派层级', value: active.level },
              ]}
            />
            {active.script && (
              <>
                <div className="divider-h" />
                <div className="section-title-sm">标化脚本摘要</div>
                <pre className="log-console mt-10" style={{ whiteSpace: 'pre-wrap' }}>{active.script}</pre>
              </>
            )}
            <div className="divider-h" />
            <div className="section-title-sm">过程记录</div>
            <ul className="feed-list mt-10">
              {(active.logs || ['暂无过程日志']).map((line) => (
                <li key={line}><span className="feed-ico blue"><Icon name="scroll" size={13} /></span><div><strong>{line}</strong></div></li>
              ))}
            </ul>
          </>
        )}
      </Drawer>
    </>
  );
}

export function StdTaskMonitorPage() {
  const { go, notify } = useApp();
  const [org, setOrg] = useState('');
  const [status, setStatus] = useState('');

  const orgStats = [
    { org: '重医附二院', should: 12, running: 3, done: 7, fail: 1, exempt: 1 },
    { org: '两江医院', should: 8, running: 2, done: 4, fail: 1, exempt: 1 },
    { org: '渝北人民医院', should: 6, running: 2, done: 3, fail: 0, exempt: 1 },
    { org: '两江疾控', should: 5, running: 0, done: 2, fail: 0, exempt: 3 },
  ].filter((r) => !org || r.org === org);

  const rows = tasks.filter((t) => (!org || t.org === org) && (!status || t.status === status));

  return (
    <>
      <PageHeader
        eyebrow="STANDARDIZATION MONITOR"
        title="标化任务监控"
        desc="按机构统计应执行/执行中/完成/失败任务；支持下钻过程、查看资源消耗与执行日志。"
        actions={
          <>
            <Btn icon="list" onClick={() => go('/collection/std-tasks')}>任务分派</Btn>
            <Btn icon="download" onClick={() => notify('监控报表已导出')}>导出报表</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => notify('监控指标已刷新')}>刷新</Btn>
          </>
        }
      />
      <div className="stat-grid">
        <StatCard label="应执行" value="31" unit="项" delta="覆盖 4 家机构" icon="clipboard" tone="blue" />
        <StatCard label="执行中" value="7" unit="项" delta="平均耗时 42 分" icon="activity" tone="cyan" />
        <StatCard label="完成率" value="51.6" unit="%" delta="+6.2% 本周" icon="checkcircle" tone="green" />
        <StatCard label="失败/退回" value="2" unit="项" delta="需人工干预" icon="circlealert" tone="red" />
      </div>

      <div className="grid grid-2 mt-14">
        <Card title="机构任务结果统计" subtitle="点击机构可下钻过程" noPad>
          <div className="pad-h">
            <DataTable
              rows={orgStats}
              pageSize={6}
              onRowClick={(r) => setOrg(r.org)}
              columns={[
                { key: 'org', title: '机构', render: (r) => <strong>{r.org}</strong> },
                { key: 'should', title: '应执行', width: 70, align: 'right', render: (r) => r.should },
                { key: 'running', title: '执行中', width: 70, align: 'right', render: (r) => r.running },
                { key: 'done', title: '完成', width: 60, align: 'right', render: (r) => r.done },
                { key: 'fail', title: '失败', width: 60, align: 'right', render: (r) => <span style={r.fail ? { color: '#DC2626', fontWeight: 600 } : undefined}>{r.fail}</span> },
                { key: 'exempt', title: '缺项', width: 60, align: 'right', render: (r) => r.exempt },
              ]}
            />
          </div>
        </Card>
        <Card title="过程监控筛选" subtitle="时间 / 机构 / 状态">
          <div className="form-grid">
            <Field label="归属机构"><Select value={org} onChange={setOrg} options={['', '重医附二院', '两江医院', '渝北人民医院', '两江疾控']} placeholder="全部机构" /></Field>
            <Field label="任务状态"><Select value={status} onChange={setStatus} options={['', '待接收', '开发中', '待审核', '已完成', '已退回', '缺项豁免']} placeholder="全部状态" /></Field>
            <Field label="时间范围" className="span-2"><Select value="近7天" onChange={() => {}} options={['近24小时', '近7天', '近30天', '本季度']} /></Field>
          </div>
          <div className="info-note mt-14"><Icon name="cpu" size={13} /><span>演示环境展示 CPU/内存占用与日志下载入口；生产环境对接调度引擎指标。</span></div>
        </Card>
      </div>

      <Card className="mt-14" title="任务过程明细" subtitle="已处理数据量、起止时间、资源与日志" noPad actions={<Btn size="sm" onClick={() => { setOrg(''); setStatus(''); }}>清除筛选</Btn>}>
        <div className="pad-h">
          <DataTable
            rows={rows}
            pageSize={6}
            columns={[
              { key: 'id', title: '任务号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
              { key: 'table', title: '目标表', render: (r) => <span className="mono">{r.table}</span> },
              { key: 'org', title: '机构', width: 110, render: (r) => r.org },
              { key: 'status', title: '状态', width: 88, render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
              { key: 'progress', title: '进度', width: 70, render: (r) => `${r.progress}%` },
              { key: 'res', title: '资源', width: 110, render: () => <span className="muted xs">CPU 18% · MEM 1.2G</span> },
              {
                key: 'ops', title: '操作', width: 160,
                render: (r) => (
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => notify(`${r.id} 日志已开始下载`)}>下载日志</button>
                    <button className="link-muted" onClick={() => notify(`${r.id} 已标记人工干预`, 'info')}>干预</button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </>
  );
}
