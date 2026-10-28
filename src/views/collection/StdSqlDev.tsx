'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { api } from '../../api/client';

type ScriptStatus = '草稿' | '预检通过' | '待审核' | '已发布' | '已退回' | '已调度';
type ScriptRow = {
  id: string;
  name: string;
  taskId: string;
  target: string;
  dialect: string;
  owner: string;
  status: ScriptStatus;
  version: string;
  cron: string;
  updated: string;
  sql: string;
};

const TEMPLATES = [
  { key: 'patient', name: '患者主索引标化', sql: `-- 患者主索引标化模板\nINSERT OVERWRITE TABLE dwd_patient_master PARTITION (dt='\${bizdate}')\nSELECT\n  p.patient_id,\n  map_sex(p.gender_code) AS gender_code,\n  p.patient_name,\n  d.dept_std_code AS dept_code,\n  CURRENT_TIMESTAMP AS etl_time\nFROM ods_his.patient p\nLEFT JOIN dim_department d ON p.dept_code = d.dept_code\nWHERE p.update_time >= '\${bizdate}';` },
  { key: 'diag', name: '门诊诊断对码', sql: `-- 门诊诊断 ICD 对码\nCREATE TABLE IF NOT EXISTS tmp_diag_\${bizdate} AS\nSELECT v.visit_id, m.std_code AS diag_code, m.std_name AS diag_name\nFROM ods_emr.diagnosis v\nLEFT JOIN map_icd m ON v.local_code = m.src_code\nWHERE v.dt = '\${bizdate}';` },
  { key: 'lab', name: '检验结果清洗', sql: `SELECT report_id, item_code, result_value, unit\nFROM ods_lis.lab_result\nWHERE report_time >= CURRENT_DATE - INTERVAL '1' DAY\nLIMIT 100;` },
];

const scriptsSeed: ScriptRow[] = [
  { id: 'SQL-2401', name: '患者主索引日批', taskId: 'ST-2401', target: 'dwd_patient_master', dialect: 'Spark SQL', owner: '张敏', status: '已调度', version: 'V1.4', cron: '0 2 * * *', updated: '08-06 02:10', sql: TEMPLATES[0].sql },
  { id: 'SQL-2402', name: '检验报告标化', taskId: 'ST-2402', target: 'dwd_lab_report', dialect: 'Spark SQL', owner: '李建华', status: '待审核', version: 'V0.9', cron: '0 3 * * *', updated: '08-06 16:40', sql: TEMPLATES[2].sql },
  { id: 'SQL-2403', name: '就诊明细宽表', taskId: 'ST-2407', target: 'dwd_fact_visit', dialect: 'Hive SQL', owner: '张敏', status: '预检通过', version: 'V0.6', cron: '30 2 * * *', updated: '08-06 11:20', sql: TEMPLATES[0].sql.replace('dwd_patient_master', 'dwd_fact_visit') },
  { id: 'SQL-2404', name: '诊断对码临时表', taskId: 'ST-2404', target: 'tmp_diag', dialect: 'Spark SQL', owner: '赵倩', status: '已发布', version: 'V1.1', cron: '依赖上游', updated: '08-01 18:00', sql: TEMPLATES[1].sql },
  { id: 'SQL-2405', name: '手术记录标化', taskId: 'ST-2408', target: 'dwd_operation', dialect: 'Flink SQL', owner: '陈晓', status: '已退回', version: 'V0.3', cron: '—', updated: '08-05 09:12', sql: 'SELECT * FROM ods_emr.operation WHERE 1=0;' },
  { id: 'SQL-2406', name: '公卫高血压（缺项）', taskId: 'ST-2405', target: 'dwd_ph_htn', dialect: 'Spark SQL', owner: '陈晓', status: '草稿', version: 'V0.1', cron: '—', updated: '08-04 15:00', sql: '-- 业务缺项：机构未开展高血压专档\n-- TODO' },
];

const toneOf = (s: string) => {
  if (['已发布', '已调度', '预检通过', '通过'].includes(s)) return 'green';
  if (['待审核', '草稿'].includes(s)) return s === '待审核' ? 'amber' : 'slate';
  if (['已退回', '失败', '阻断'].includes(s)) return 'red';
  return 'blue';
};

const DEFAULT_SQL = TEMPLATES[0].sql;

function formatSql(sql: string) {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',\n  ')
    .replace(/\bSELECT\b/gi, 'SELECT\n  ')
    .replace(/\bFROM\b/gi, '\nFROM ')
    .replace(/\bWHERE\b/gi, '\nWHERE ')
    .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN ')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY ')
    .replace(/\bORDER BY\b/gi, '\nORDER BY ')
    .replace(/\bLIMIT\b/gi, '\nLIMIT ')
    .trim();
}

type CheckItem = { level: '通过' | '警告' | '阻断'; rule: string; detail: string };

function precheck(sql: string): CheckItem[] {
  const s = sql.toLowerCase();
  const items: CheckItem[] = [];
  if (!s.trim()) items.push({ level: '阻断', rule: '非空', detail: 'SQL 不能为空' });
  if (/\b(drop|truncate|delete\s+from|alter\s+table)\b/i.test(sql)) items.push({ level: '阻断', rule: '危险语句', detail: '标化脚本禁止 DROP / TRUNCATE / DELETE / ALTER' });
  if (!/\bselect\b|\binsert\b|\bcreate\b/i.test(sql)) items.push({ level: '警告', rule: '语句类型', detail: '未识别到 SELECT / INSERT / CREATE' });
  if (!/\$\{bizdate\}/i.test(sql) && !/\bdt\b|\bbizdate\b/i.test(sql)) items.push({ level: '警告', rule: '分区变量', detail: '建议使用 ${bizdate} 或 dt 分区条件' });
  if (/\bselect\s+\*/i.test(sql)) items.push({ level: '警告', rule: '显式字段', detail: '生产标化建议避免 SELECT *' });
  if (/\binsert\b/i.test(sql) && !/\boverwrite\b|\binto\b/i.test(sql)) items.push({ level: '警告', rule: '写入语义', detail: '请确认 INSERT OVERWRITE / INTO' });
  if (!items.some((x) => x.level === '阻断')) items.unshift({ level: '通过', rule: '关键字预检', detail: '基础语法与关键字检查通过' });
  if (/\bmap_|\bdim_/i.test(sql)) items.push({ level: '通过', rule: '字典引用', detail: '已引用对码/维度对象，可与值域贯通联动' });
  return items;
}

function convertDialect(sql: string, from: string, to: string) {
  if (from === to) return sql;
  let out = sql;
  if (to === 'Flink SQL') out = out.replace(/INSERT OVERWRITE TABLE/gi, 'INSERT INTO').replace(/\$\{bizdate\}/g, "DATE_FORMAT(LOCALTIMESTAMP, 'yyyy-MM-dd')");
  if (to === 'Hive SQL') out = out.replace(/CURRENT_TIMESTAMP/gi, 'from_unixtime(unix_timestamp())');
  if (to === 'Spark SQL') out = out.replace(/from_unixtime\(unix_timestamp\(\)\)/gi, 'CURRENT_TIMESTAMP');
  return `-- 已从 ${from} 转换到 ${to}（演示规则）\n${out}`;
}

/** 标化 SQL 开发总览 */
export function StdSqlHubPage() {
  const { go, notify } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="STANDARDIZATION SQL GOVERNANCE"
        title="标化 SQL 开发与治理"
        desc="在线编写、语法预检、人工审核、跨库语法转换、模板发布、临时表片段、业务缺项与 Cron/依赖调度；审核通过后方可调度。"
        actions={
          <>
            <Btn icon="clipboard" onClick={() => go('/collection/std-tasks')}>任务分派</Btn>
            <Btn icon="workflow" onClick={() => go('/collection/lake-flows')}>流程编排</Btn>
            <Btn variant="primary" icon="code" onClick={() => go('/collection/std-sql')}>打开工作台</Btn>
          </>
        }
      />
      <div className="stat-grid">
        <StatCard label="脚本总数" value={String(scriptsSeed.length)} unit="个" delta="样例" icon="code" tone="blue" onClick={() => go('/collection/std-sql')} />
        <StatCard label="待审核" value={String(scriptsSeed.filter((s) => s.status === '待审核').length)} unit="个" delta="需管理员" icon="listfilter" tone="amber" onClick={() => go('/collection/std-sql?tab=review')} />
        <StatCard label="已调度" value={String(scriptsSeed.filter((s) => s.status === '已调度').length)} unit="个" delta="可监控" icon="play" tone="green" onClick={() => go('/collection/std-monitor')} />
        <StatCard label="模板库" value={String(TEMPLATES.length)} unit="套" delta="可复用" icon="book" tone="violet" onClick={() => go('/collection/std-sql')} />
      </div>
      <Card className="mt-14" title="标化 SQL 基本流程" subtitle="开发 → 预检 → 审核 → 发布 → 调度">
        <div className="schema-map" style={{ flexWrap: 'wrap', gap: 10 }}>
          {[
            ['1', '领取标化任务', () => go('/collection/std-tasks')],
            ['2', '工作台编写 SQL', () => go('/collection/std-sql')],
            ['3', '预检 / 提交审核', () => go('/collection/std-sql?tab=review')],
            ['4', '发布并挂调度', () => go('/collection/std-sql')],
            ['5', '任务监控', () => go('/collection/std-monitor')],
          ].map(([n, label, fn]) => (
            <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>
              <Badge tone="blue">{n as string}</Badge> {label as string}
            </button>
          ))}
        </div>
        <div className="info-note mt-14"><Icon name="shield" size={13} /><span>验收口径：审核通过后方可调度；脚本版本可复用、可追溯。</span></div>
      </Card>
      <div className="grid grid-3 mt-14">
        {[
          { t: '在线开发', d: '高亮编辑、格式化、试跑预览、临时表片段', i: 'code' },
          { t: '治理闭环', d: '关键字预检、人工审核、退回意见、模板发布', i: 'shield' },
          { t: '调度衔接', d: 'Cron / 日历 / 依赖；对接离线 DAG 与任务监控', i: 'workflow' },
        ].map((x) => (
          <Card key={x.t} title={x.t} subtitle={x.d}>
            <Btn size="sm" variant="primary" icon={x.i} onClick={() => go('/collection/std-sql')}>进入工作台</Btn>
          </Card>
        ))}
      </div>
    </>
  );
}

/** 标化 SQL 工作台 */
export function StdSqlWorkbenchPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('editor');
  const [scripts, setScripts] = useState(scriptsSeed);
  const [activeId, setActiveId] = useState(scriptsSeed[0].id);
  const active = scripts.find((s) => s.id === activeId) || scripts[0];
  const [sql, setSql] = useState(active.sql);
  const [dialect, setDialect] = useState(active.dialect);
  const [name, setName] = useState(active.name);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [preview, setPreview] = useState<{ columns: string[]; rows: Record<string, any>[]; ms: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [schedOpen, setSchedOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [q, setQ] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'review' || t === 'scripts' || t === 'editor') setTab(t);
  }, []);

  useEffect(() => {
    setSql(active.sql);
    setDialect(active.dialect);
    setName(active.name);
    setChecks([]);
    setPreview(null);
    setError('');
  }, [activeId]);

  const filtered = useMemo(() => scripts.filter((s) =>
    (s.name + s.id + s.target + s.taskId).toLowerCase().includes(q.toLowerCase())
  ), [scripts, q]);

  const patchActive = (p: Partial<ScriptRow>) => {
    setScripts((list) => list.map((s) => (s.id === activeId ? { ...s, ...p, updated: '刚刚' } : s)));
  };

  const runPrecheck = () => {
    const items = precheck(sql);
    setChecks(items);
    const blocked = items.some((x) => x.level === '阻断');
    if (!blocked) {
      patchActive({ status: '预检通过', sql });
      notify('预检通过，可提交审核');
    } else notify('预检存在阻断项，请先修复', 'error');
    setTab('editor');
  };

  const runPreview = async () => {
    setRunning(true); setError(''); setPreview(null);
    try {
      // 仅对纯 SELECT 走真实查询；其他用本地样例
      if (/^\s*select\b/i.test(sql) && !/\binsert\b|\bcreate\b/i.test(sql)) {
        const res = await api.query(sql);
        setPreview({ columns: res.columns, rows: res.rows, ms: res.durationMs });
        notify(`预览完成 ${res.rowCount} 行 · ${res.durationMs}ms`);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setPreview({
          columns: ['patient_id', 'gender_code', 'dept_code', 'etl_time'],
          rows: [
            { patient_id: 'P10001', gender_code: '1', dept_code: 'A03.01', etl_time: '2026-08-06 02:14:01' },
            { patient_id: 'P10002', gender_code: '2', dept_code: 'A04.01', etl_time: '2026-08-06 02:14:01' },
          ],
          ms: 86,
        });
        notify('非查询语句已生成样例预览（未写入生产）');
      }
    } catch (e: any) {
      setError(e.message || '执行失败');
      notify(e.message || '执行失败', 'error');
    }
    setRunning(false);
  };

  const submitReview = () => {
    const items = precheck(sql);
    setChecks(items);
    if (items.some((x) => x.level === '阻断')) { notify('存在阻断项，无法提交审核', 'error'); return; }
    patchActive({ status: '待审核', sql, name });
    notify('已提交人工审核');
    setTab('review');
  };

  return (
    <>
      <PageHeader
        eyebrow="STD SQL WORKBENCH"
        title="标化 SQL 工作台"
        desc="绑定标化任务编写脚本：格式化、预检、跨库转换、模板、临时表、缺项登记、外部程序与调度配置。"
        actions={
          <>
            <Btn icon="dashboard" onClick={() => go('/collection/std-sql-hub')}>治理总览</Btn>
            <Btn icon="clipboard" onClick={() => go('/collection/std-tasks')}>任务分派</Btn>
            <Btn variant="primary" icon="play" loading={running} onClick={runPreview}>试跑预览</Btn>
          </>
        }
      />

      <Tabs
        variant="pill"
        value={tab}
        onChange={setTab}
        items={[
          { key: 'editor', label: '开发工作台' },
          { key: 'scripts', label: '脚本库', count: scripts.length },
          { key: 'review', label: '审核队列', count: scripts.filter((s) => s.status === '待审核').length },
        ]}
      />

      {tab === 'editor' && (
        <div className="std-sql-layout mt-14">
          <aside className="std-sql-side">
            <div className="std-sql-side-head">
              <strong>脚本 / 任务</strong>
              <button type="button" className="link-btn" onClick={() => setTplOpen(true)}>模板</button>
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="搜索脚本" width="100%" />
            <div className="std-sql-script-list">
              {filtered.map((s) => (
                <button key={s.id} type="button" className={`std-sql-script ${s.id === activeId ? 'is-active' : ''}`} onClick={() => setActiveId(s.id)}>
                  <div className="std-sql-script-top">
                    <span className="mono">{s.id}</span>
                    <Badge tone={toneOf(s.status)}>{s.status}</Badge>
                  </div>
                  <strong>{s.name}</strong>
                  <small>{s.taskId} · {s.target}</small>
                </button>
              ))}
            </div>
            <div className="fp-tip mt-10"><Icon name="sparkles" size={12} /><span>从任务分派「写脚本」可直达本页；审核通过后才能调度。</span></div>
          </aside>

          <section className="std-sql-main">
            <div className="std-sql-toolbar">
              <div className="std-sql-toolbar-left">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 220 }} />
                <Select value={dialect} onChange={setDialect} options={['Spark SQL', 'Hive SQL', 'Flink SQL', 'PostgreSQL']} width={120} />
                <Badge tone={toneOf(active.status)} dot>{active.status}</Badge>
                <span className="muted xs">{active.version} · {active.taskId}</span>
              </div>
              <div className="row-actions">
                <Btn size="sm" icon="sliders" onClick={() => { setSql(formatSql(sql)); notify('已格式化'); }}>格式化</Btn>
                <Btn size="sm" icon="shield" onClick={runPrecheck}>预检</Btn>
                <Btn size="sm" icon="refresh" onClick={() => { setSql(convertDialect(sql, dialect, dialect === 'Spark SQL' ? 'Flink SQL' : 'Spark SQL')); setDialect(dialect === 'Spark SQL' ? 'Flink SQL' : 'Spark SQL'); notify('已做跨库语法转换（演示）'); }}>跨库转换</Btn>
                <Btn size="sm" icon="boxes" onClick={() => { setSql((v) => `${v}\n\n-- 临时表片段\nCREATE TEMP VIEW tmp_frag AS SELECT 1 AS x;`); notify('已插入临时表片段'); }}>临时表</Btn>
                <Btn size="sm" icon="file" onClick={() => setGapOpen(true)}>业务缺项</Btn>
                <Btn size="sm" icon="cable" onClick={() => setExtOpen(true)}>外部程序</Btn>
                <Btn size="sm" icon="clock" onClick={() => setSchedOpen(true)}>调度</Btn>
                <Btn size="sm" variant="primary" icon="uploadcloud" onClick={submitReview}>提交审核</Btn>
              </div>
            </div>

            <div className="std-sql-editor">
              <div className="std-sql-gutter">{sql.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}</div>
              <textarea
                ref={areaRef}
                className="std-sql-area"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                spellCheck={false}
                placeholder="编写标化 SQL…"
              />
            </div>

            <div className="std-sql-bottom">
              <Card title="预检结果" subtitle={checks.length ? `${checks.length} 项` : '点击「预检」开始'} noPad>
                <div className="pad-h">
                  {checks.length ? (
                    <ul className="std-check-list">
                      {checks.map((c) => (
                        <li key={c.rule + c.detail} className={`lv-${c.level === '通过' ? 'ok' : c.level === '警告' ? 'warn' : 'bad'}`}>
                          <Badge tone={toneOf(c.level)}>{c.level}</Badge>
                          <div><strong>{c.rule}</strong><small>{c.detail}</small></div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="info-note"><Icon name="shield" size={13} /><span>将检查危险语句、分区变量、显式字段与字典引用。</span></div>
                  )}
                </div>
              </Card>
              <Card title="试跑预览" subtitle={preview ? `${preview.rows.length} 行 · ${preview.ms}ms` : '只读预览，不落生产'} noPad
                actions={<Btn size="sm" icon="play" loading={running} onClick={runPreview}>运行</Btn>}
              >
                <div className="pad-h">
                  {error && <div className="info-note" style={{ borderColor: '#f5d6dc', background: '#fdf4f5' }}><Icon name="circlealert" size={13} /><span>{error}</span></div>}
                  {preview ? (
                    <DataTable
                      rows={preview.rows}
                      pageSize={5}
                      paginate={false}
                      columns={preview.columns.map((c) => ({ key: c, title: c, render: (r: any) => <span className="mono-cell">{String(r[c] ?? '—')}</span> }))}
                    />
                  ) : (
                    <div className="info-note"><Icon name="table" size={13} /><span>SELECT 走真实库；INSERT/CREATE 展示样例结果。</span></div>
                  )}
                </div>
              </Card>
            </div>
          </section>
        </div>
      )}

      {tab === 'scripts' && (
        <Card className="mt-14" title="脚本库" subtitle="版本、方言、调度与状态" noPad
          actions={<Btn size="sm" icon="book" onClick={() => setTplOpen(true)}>从模板新建</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={filtered}
              pageSize={8}
              onRowClick={(r) => { setActiveId((r as ScriptRow).id); setTab('editor'); }}
              columns={[
                { key: 'id', title: '脚本号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.target}</small></div> },
                { key: 'taskId', title: '任务', width: 90, render: (r) => <span className="mono-cell">{r.taskId}</span> },
                { key: 'dialect', title: '方言', width: 90, render: (r) => <Badge tone="slate">{r.dialect}</Badge> },
                { key: 'version', title: '版本', width: 70, render: (r) => r.version },
                { key: 'cron', title: '调度', width: 100, render: (r) => <span className="mono-cell">{r.cron}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                { key: 'owner', title: '负责人', width: 70, render: (r) => r.owner },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'review' && (
        <Card className="mt-14" title="审核队列" subtitle="人工审核通过后方可调度" noPad>
          <div className="pad-h">
            <DataTable
              rows={scripts.filter((s) => s.status === '待审核' || s.status === '已退回')}
              pageSize={8}
              columns={[
                { key: 'id', title: '脚本号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '名称', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.owner} · {r.version}</small></div> },
                { key: 'target', title: '目标表', width: 140, render: (r) => <span className="mono">{r.target}</span> },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                {
                  key: 'ops', title: '操作', width: 200,
                  render: (r) => (
                    <div className="row-actions">
                      <button className="link-btn" onClick={() => { setActiveId(r.id); setReviewOpen(true); }}>审阅</button>
                      {r.status === '待审核' && (
                        <>
                          <button className="link-btn" onClick={() => { setScripts((list) => list.map((x) => x.id === r.id ? { ...x, status: '已发布' } : x)); notify(`${r.id} 审核通过并发布`); }}>通过</button>
                          <button className="link-muted" onClick={() => { setScripts((list) => list.map((x) => x.id === r.id ? { ...x, status: '已退回' } : x)); notify(`${r.id} 已退回`); }}>退回</button>
                        </>
                      )}
                      <button className="link-btn" onClick={() => {
                        setScripts((list) => list.map((x) => x.id === r.id ? { ...x, status: x.status === '待审核' ? '已发布' : x.status === '已发布' ? '已调度' : x.status } : x));
                        notify(`${r.id} 已进入调度配置`);
                        go('/collection/lake-flows');
                      }}>调度</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer open={reviewOpen} onClose={() => setReviewOpen(false)} title={active.name} desc={`${active.id} · ${active.version}`} width={560}
        footer={
          <>
            <Btn onClick={() => setReviewOpen(false)}>关闭</Btn>
            <Btn onClick={() => { patchActive({ status: '已退回' }); setReviewOpen(false); notify('已退回修改'); }}>退回</Btn>
            <Btn variant="primary" onClick={() => { patchActive({ status: '已发布', sql }); setReviewOpen(false); notify('审核通过，已发布'); }}>通过并发布</Btn>
          </>
        }
      >
        <KeyValue cols={2} items={[
          { label: '任务', value: active.taskId },
          { label: '目标表', value: <span className="mono">{active.target}</span> },
          { label: '方言', value: active.dialect },
          { label: '调度', value: active.cron },
        ]} />
        <div className="section-title-sm mt-14">脚本正文</div>
        <div className="dag-sql-box mt-10">{active.sql}</div>
      </Drawer>

      <Modal open={tplOpen} onClose={() => setTplOpen(false)} title="脚本模板" desc="选择模板填充到工作台" width={640}
        footer={<Btn onClick={() => setTplOpen(false)}>关闭</Btn>}
      >
        <div className="coverage-list">
          {TEMPLATES.map((t) => (
            <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div><strong>{t.name}</strong><div className="muted xs" style={{ marginTop: 4 }}>{t.sql.split('\n')[0]}</div></div>
              <Btn size="sm" variant="primary" onClick={() => { setSql(t.sql); setName(t.name); setTplOpen(false); setTab('editor'); notify(`已加载模板：${t.name}`); }}>使用</Btn>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="调度配置" desc="Cron / 日历 / 依赖；审核通过后生效" width={560}
        footer={<><Btn onClick={() => setSchedOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { patchActive({ cron: '0 2 * * *', status: active.status === '已发布' || active.status === '已调度' ? '已调度' : active.status, sql, name }); setSchedOpen(false); notify(active.status === '已发布' || active.status === '已调度' ? '调度已更新' : '已保存调度草稿（需先审核发布）'); }}>保存</Btn></>}
      >
        <div className="form-grid">
          <Field label="调度类型" required><Select value="Cron" onChange={() => {}} options={['Cron', '日历', '依赖上游']} /></Field>
          <Field label="Cron 表达式" required><input className="input" defaultValue={active.cron === '—' ? '0 2 * * *' : active.cron} /></Field>
          <Field label="依赖流程" className="span-2"><Select value="患者主索引日批" onChange={() => {}} options={['患者主索引日批', '门诊就诊宽表', '无']} /></Field>
          <Field label="失败策略"><Select value="告警并重试 2 次" onChange={() => {}} options={['告警并重试 2 次', '阻断下游', '仅告警']} /></Field>
          <Field label="日历"><Select value="工作日" onChange={() => {}} options={['每天', '工作日', '月末']} /></Field>
        </div>
      </Modal>

      <Modal open={gapOpen} onClose={() => setGapOpen(false)} title="业务缺项登记" width={520}
        footer={<><Btn onClick={() => setGapOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { patchActive({ status: '草稿', sql: `${sql}\n\n-- 业务缺项已登记` }); setGapOpen(false); notify('缺项已登记，任务可豁免'); }}>登记</Btn></>}
      >
        <div className="form-grid">
          <Field label="缺项类型" required className="span-2"><Select value="业务未开展" onChange={() => {}} options={['业务未开展', '源表无字段', '字典未发布', '其他']} /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="例如：机构未开展高血压专档" /></Field>
        </div>
      </Modal>

      <Modal open={extOpen} onClose={() => setExtOpen(false)} title="外部程序接入" desc="在 SQL 节点前后挂接 Python / Shell" width={520}
        footer={<><Btn onClick={() => setExtOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setExtOpen(false); notify('外部程序钩子已保存'); }}>保存</Btn></>}
      >
        <div className="form-grid">
          <Field label="阶段" required><Select value="后置" onChange={() => {}} options={['前置', '后置']} /></Field>
          <Field label="类型" required><Select value="Python" onChange={() => {}} options={['Python', 'Shell', 'HTTP']} /></Field>
          <Field label="入口" className="span-2"><input className="input" placeholder="scripts/post_validate.py" /></Field>
        </div>
      </Modal>
    </>
  );
}
