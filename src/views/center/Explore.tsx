import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { SqlWorkbench } from '../../components/SqlWorkbench';
import { Badge, Btn, Card, DataTable, Empty, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { datasets, devJobs, reportTasks, assets, getFields } from '../../data';

export function SqlPage() {
  const { notify } = useApp();
  return (
    <>
      <PageHeader eyebrow="DATA EXPLORATION" title="数据查询" desc="面向数据分析师的 SQL 工作台，支持库表检索、智能补全、结果导出与查询复用，全链路记录数据访问审计。" actions={<><Btn icon="clock" onClick={() => notify('已打开查询历史', 'info')}>查询历史</Btn><Btn variant="primary" icon="plus" onClick={() => notify('已新建空白查询', 'info')}>新建查询</Btn></>} />
      <div className="query-strip">
        <div className="query-strip-main"><Icon name="terminal" size={16} /><span>SQL 工作台</span><em>dwd.fact_visit</em><Badge tone="green" dot>只读连接正常</Badge></div>
        <div className="query-chips">
          <span>常用：</span>
          {['患者主索引', '门诊人次日趋势', '手术并发症明细', '科室收入排行'].map((c) => <button key={c} onClick={() => notify(`已载入查询模板「${c}」`, 'info')}>{c}</button>)}
        </div>
      </div>
      <SqlWorkbench initialSql={"SELECT\n  patient_id,\n  patient_name,\n  gender,\n  birth_date,\n  dept_name,\n  COUNT(*) AS visit_count,\n  MAX(visit_time) AS last_visit_time\nFROM dwd.fact_visit\nWHERE visit_date >= '2026-07-01'\nGROUP BY 1,2,3,4,5\nORDER BY visit_count DESC\nLIMIT 100;"} height={266} />
    </>
  );
}

export function DatasetsPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('mine');
  const [active, setActive] = useState<typeof datasets[0] | null>(null);
  const [innerQ, setInnerQ] = useState('');
  const list = datasets.filter((d) => (d.name + d.desc).toLowerCase().includes(q.toLowerCase()));

  if (active) {
    const physical = active.id === 'ocr_ceshi1' ? [] : assets.slice(0, active.id === 'hm_sjzx_mzxx' ? 6 : 5);
    return (
      <>
        <button className="back-link" onClick={() => setActive(null)}><Icon name="arrowleft" size={14} /> 返回数据集列表</button>
        <PageHeader eyebrow="DATASET DETAIL" title={<span className="title-with-icon"><span className="ds-icon"><Icon name="table" size={18} /></span>{active.name}</span>} desc={active.desc}
          actions={<><Btn icon="chart" onClick={() => notify('概要分析统计已生成', 'info')}>概要分析</Btn><Btn icon="upload" onClick={() => notify('已打开数据导入向导', 'info')}>导入数据</Btn><Btn variant="primary" icon="refresh" onClick={() => notify('元数据刷新完成')}>刷新元数据</Btn></>} />
        <div className="dataset-detail-bar">
          <div className="ddb-item"><span>所属沙箱</span><strong>医渡云测试</strong></div>
          <div className="ddb-item"><span>数据集类型</span><strong>{active.type === '测试' ? '测试数据集' : '主题数据集'}</strong></div>
          <div className="ddb-item"><span>数据表</span><strong>{active.tables} 张</strong></div>
          <div className="ddb-item"><span>数据量</span><strong>{active.rows}</strong></div>
          <div className="ddb-item"><span>负责人</span><strong>{active.owner}</strong></div>
          <div className="ddb-item"><span>更新时间</span><strong>{active.updated}</strong></div>
          <div className="ddb-tags"><Badge tone={active.type === '测试' ? 'slate' : 'violet'}>{active.type}</Badge><Badge tone="green" dot>可用</Badge></div>
        </div>
        <Card className="mt-14" title="数据表" subtitle={physical.length ? `共 ${physical.length} 张物理表` : '该数据集暂未导入数据表'} actions={<SearchInput value={innerQ} onChange={setInnerQ} placeholder="搜索表名" width={220} />}>
          {physical.length === 0 ? (
            <Empty icon="database" title="暂无数据" desc="数据集已创建但尚未导入物理表，可通过「导入数据」上传文件或从数据资产中引用。" action={<Btn variant="primary" size="sm" icon="upload" onClick={() => notify('数据导入向导已打开', 'info')}>导入数据</Btn>} />
          ) : (
            <DataTable rows={physical.filter((a) => a.id.includes(innerQ))} pageSize={6} columns={[
              { key: 'name', title: '数据表', render: (a) => <div className="cell-main"><strong>{a.name}</strong><small>{a.schema}.{a.id}</small></div> },
              { key: 'rows', title: '数据量', width: 110, align: 'right', render: (a) => <div className="cell-main align-right"><strong>{a.rows}</strong><small>{a.size}</small></div> },
              { key: 'owner', title: '负责人', width: 90 },
              { key: 'updated', title: '更新时间', width: 140, render: (a) => <span className="muted">{a.updated}</span> },
              { key: 'ops', title: '操作', width: 100, render: (a) => <button className="link-btn" onClick={() => notify(`已打开 ${a.name} 预览`, 'info')}>预览</button> },
            ]} />
          )}
        </Card>
        <div className="grid grid-2 mt-14">
          <Card title="数据集说明"><p className="prose">该数据集归属于「医渡云测试」沙箱，用于验证外部数据导入、字段映射与指标建模流程。数据仅限测试使用，不参与正式统计与上报。</p></Card>
          <Card title="访问与共享">
            <KeyValue cols={2} items={[{ label: '可见范围', value: '沙箱成员' }, { label: '成员数量', value: '6 人' }, { label: '共享链接', value: '已关闭' }, { label: '数据密级', value: <Badge tone="amber">3 级 · 敏感</Badge> }]} />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="DATASETS" title="数据集" desc="面向主题分析与科研的数据集合管理，支持多表关联、字段加工、权限共享与版本追踪。" actions={<><Btn icon="folder" onClick={() => notify('沙箱管理已打开', 'info')}>沙箱管理</Btn><Btn variant="primary" icon="plus" onClick={() => notify('新建数据集向导已打开', 'info')}>新建数据集</Btn></>} />
      <div className="dataset-hero">
        <div className="dh-left">
          <span className="dh-icon"><Icon name="boxes" size={20} /></span>
          <div><span className="dh-label">当前沙箱</span><strong>医渡云测试</strong><small>测试沙箱 · 6 名成员 · 创建于 2026-03-12</small></div>
        </div>
        <div className="dh-stats">
          <div><span>数据集</span><strong>{datasets.length}</strong></div>
          <div><span>物理表</span><strong>44</strong></div>
          <div><span>存储</span><strong>18.6 GB</strong></div>
          <div><span>我的权限</span><strong>管理员</strong></div>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => notify('沙箱设置已打开', 'info')}>沙箱设置</Btn>
      </div>
      <div className="dataset-toolbar">
        <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'mine', label: '我的数据集', count: datasets.length }, { key: 'shared', label: '共享给我', count: 12 }, { key: 'fav', label: '收藏', count: 3 }]} />
        <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索数据集名称或描述" width={260} /><Select value="" onChange={() => {}} options={['全部类型', '主题数据集', '测试数据集', '应用数据集']} placeholder="全部类型" width={110} /></div>
      </div>
      <div className="dataset-grid">
        {list.map((d) => (
          <button className="dataset-card" key={d.id} onClick={() => setActive(d)}>
            <div className="dc-head">
              <span className={`dc-icon ${d.type === '测试' ? 'test' : d.type === '应用' ? 'app' : ''}`}><Icon name={d.type === '测试' ? 'scan' : d.type === '应用' ? 'chart' : 'table'} size={17} /></span>
              <Badge tone={d.type === '测试' ? 'slate' : d.type === '应用' ? 'blue' : 'violet'}>{d.type}</Badge>
              <span className="dc-more"><Icon name="more" size={15} /></span>
            </div>
            <strong className="dc-name">{d.name}</strong>
            <p className="dc-desc">{d.desc}</p>
            <div className="dc-meta"><span><Icon name="table" size={11} /> {d.tables} 张表</span><span><Icon name="rows" size={11} /> {d.rows} 行</span><span><Icon name="clock" size={11} /> {d.updated}</span></div>
            <div className="dc-foot"><span className="dc-owner"><span className="avatar sm">{d.owner.slice(-2)}</span>{d.owner}</span><span className="dc-open">打开 <Icon name="arrowright" size={11} /></span></div>
          </button>
        ))}
        <button className="dataset-add" onClick={() => notify('新建数据集向导已打开', 'info')}><span><Icon name="plus" size={18} /></span><strong>新建数据集</strong><small>从数据资产引用或导入文件</small></button>
      </div>
    </>
  );
}

export function DevPage() {
  const { notify } = useApp();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const rows = devJobs.filter((j) => (tab === 'all' || j.status === tab) && (j.name + j.id).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="DATA DEVELOPMENT" title="数据开发" desc="以可视化与 SQL 方式构建数据加工任务，支持调度依赖、血缘解析与运行监控。" actions={<><Btn icon="git" onClick={() => notify('开发目录已打开', 'info')}>开发目录</Btn><Btn variant="primary" icon="plus" onClick={() => notify('已创建新的 SQL 开发任务', 'info')}>新建任务</Btn></>} />
      <div className="stat-grid">
        <StatCard label="开发任务" value="42" unit="个" delta="运行中 6" icon="workflow" tone="blue" />
        <StatCard label="今日运行" value="186" unit="次" delta="成功率 98.4%" icon="play" tone="green" />
        <StatCard label="平均耗时" value="6.2" unit="分钟" delta="-0.8 分钟" icon="clock" tone="cyan" />
        <StatCard label="异常任务" value="2" unit="个" delta="待排查" icon="circlealert" tone="red" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'all', label: '全部任务', count: 42 }, { key: '成功', label: '成功' }, { key: '告警', label: '告警', count: 1 }, { key: '失败', label: '失败', count: 1 }]} />
          <SearchInput value={q} onChange={setQ} placeholder="搜索任务名称或编码" width={220} />
        </div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={8} columns={[
            { key: 'name', title: '任务', render: (j) => <div className="cell-main"><strong>{j.name}</strong><small>{j.id} · {j.type}</small></div> },
            { key: 'schedule', title: '调度周期', width: 120, render: (j) => <span className="tag">{j.schedule}</span> },
            { key: 'last', title: '最近运行', width: 140, render: (j) => <span className="muted">{j.last}</span> },
            { key: 'duration', title: '耗时', width: 80, render: (j) => <span className="mono-cell">{j.duration}</span> },
            { key: 'status', title: '状态', width: 76, render: (j) => <Badge dot>{j.status}</Badge> },
            { key: 'owner', title: '负责人', width: 80, render: (j) => j.owner },
            { key: 'ops', title: '操作', width: 120, render: (j) => <div className="row-actions"><button className="link-btn" onClick={() => notify(`${j.name} 已开始运行`)}>运行</button><button className="link-muted" onClick={() => notify('已打开任务日志', 'info')}>日志</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="调度依赖" subtitle="今日调度 DAG">
          <div className="dag">
            {[['dim_department_sync', '01:00'], ['dwd_fact_visit_daily', '02:00'], ['hm_reg_appt_data', '每小时'], ['lis_result_quality_check', '03:30']].map(([n, t], i) => (
              <React.Fragment key={n}>
                <div className="dag-node"><span className={i === 3 ? 'warn' : 'ok'} /><div><strong>{n}</strong><small>{t}</small></div></div>
                {i < 3 && <div className="dag-link" />}
              </React.Fragment>
            ))}
          </div>
        </Card>
        <Card title="运行资源" subtitle="近 24 小时计算资源使用">
          <div className="resource-grid">
            {[['CPU 使用率', 58, 'blue'], ['内存使用率', 66, 'violet'], ['存储使用率', 71, 'amber'], ['任务队列', 24, 'green']].map(([l, v, t]) => (
              <div key={l as string}><div className="resource-head"><span>{l}</span><strong>{v}%</strong></div><Progress value={v as number} tone={t as string} height={7} /></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function ReportPage() {
  const { notify } = useApp();
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const rows = reportTasks.filter((r) => tab === 'all' || (tab === 'done' ? r.status === '已上报' : r.status !== '已上报'));
  return (
    <>
      <PageHeader eyebrow="DATA REPORTING" title="上报任务" desc="面向卫健委、医保局等监管机构的数据上报，自动生成报表、校验数据质量并跟踪上报状态。" actions={<><Btn icon="file" onClick={() => notify('上报模板库已打开', 'info')}>上报模板</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建上报</Btn></>} />
      <div className="stat-grid">
        <StatCard label="上报任务" value="6" unit="个" delta="本月新增 2" icon="uploadcloud" tone="blue" />
        <StatCard label="已上报" value="3" unit="个" delta="成功率 100%" icon="checkcircle" tone="green" />
        <StatCard label="待补数" value="1" unit="个" delta="卫生资源年报" icon="circlealert" tone="amber" />
        <StatCard label="平均上报时效" value="1.8" unit="天" delta="较上月 -0.4 天" icon="clock" tone="cyan" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><Tabs variant="line" value={tab} onChange={setTab} items={[{ key: 'all', label: '全部任务', count: 6 }, { key: 'todo', label: '进行中', count: 3 }, { key: 'done', label: '已上报', count: 3 }]} /><span className="table-note"><Icon name="shield" size={12} /> 上报数据自动脱敏</span></div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={8} columns={[
            { key: 'name', title: '上报任务', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.target}</small></div> },
            { key: 'type', title: '周期', width: 70, render: (r) => <Badge tone="slate">{r.type}</Badge> },
            { key: 'progress', title: '进度', width: 160, render: (r) => <div className="quality-cell"><Progress value={r.progress} tone={r.status === '已上报' ? 'green' : r.status === '已生成' ? 'blue' : 'amber'} /><span>{r.progress}%</span></div> },
            { key: 'status', title: '状态', width: 84, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'date', title: '计划时间', width: 130, render: (r) => r.date },
            { key: 'owner', title: '责任部门', width: 90, render: (r) => r.owner },
            { key: 'ops', title: '操作', width: 120, render: (r) => <div className="row-actions"><button className="link-btn" onClick={() => notify(`正在预览「${r.name}」`, 'info')}>预览</button><button className="link-muted" onClick={() => notify(r.status === '已上报' ? '该任务已上报，可下载回执' : '上报任务已触发')}>{r.status === '已上报' ? '回执' : '上报'}</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-2 mt-14">
        <Card title="上报数据校验" subtitle="最近一次校验结果">
          <div className="check-list">
            {[['数据完整性', '通过', '98.6%'], ['指标口径一致性', '通过', '100%'], ['上报格式合规性', '通过', '100%'], ['敏感字段脱敏', '通过', '100%'], ['历史数据衔接', '预警', '96.2%']].map(([l, s, v]) => (
              <div key={l}><span className={s === '通过' ? 'ok' : 'warn'}>{s === '通过' ? <Icon name="check" size={12} /> : <Icon name="alert" size={12} />}</span><strong>{l}</strong><em>{v}</em></div>
            ))}
          </div>
        </Card>
        <Card title="上报通道" subtitle="监管机构对接状态">
          <div className="channel-list">
            {[['重庆市卫健委', '前置机 · 正常', 'green'], ['国家卫健委', '专线 · 正常', 'green'], ['重庆市医保局', 'API · 正常', 'green'], ['院感质控中心', '邮件 · 待配置', 'amber']].map(([n, d, t]) => (
              <div key={n}><span className={`status-dot tone-${t}`} /><div><strong>{n}</strong><small>{d}</small></div><Badge tone={t === 'green' ? 'green' : 'amber'}>{t === 'green' ? '已连通' : '待配置'}</Badge></div>
            ))}
          </div>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="新建上报任务" desc="选择上报模板与统计周期，系统将自动汇总指标并执行合规校验。" width={580}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('上报任务已创建，正在生成数据'); }}>创建任务</Btn></>}>
        <div className="form-grid">
          <Field label="任务名称" required className="span-2"><input className="input" placeholder="例如：2026 年 8 月医疗服务月报" /></Field>
          <Field label="上报机构" required><Select value="" onChange={() => {}} options={['重庆市卫健委', '国家卫健委', '重庆市医保局', '院感质控中心']} placeholder="请选择" /></Field>
          <Field label="上报周期"><Select value="月报" onChange={() => {}} options={['日报', '月报', '季报', '年报']} /></Field>
          <Field label="统计周期" required><input className="input" defaultValue="2026-07" /></Field>
          <Field label="责任部门"><Select value="医务处" onChange={() => {}} options={['医务处', '质管办', '医保办', '信息中心', '院感科']} /></Field>
        </div>
      </Modal>
    </>
  );
}
