import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Field, Modal, PageHeader, Select } from '../../components/ui';
import { api, DbHealth, QueryHistory, QueryResult, SavedQuery } from '../../api/client';
import { useApp } from '../../app-context';

const KEYWORDS = ['select','from','where','group by','order by','having','limit','join','left join','inner join','on','as','and','or','not','null','is','in','case','when','then','else','end','with','union','all','distinct','desc','asc','over','partition by','interval','date_trunc','count','sum','avg','round','coalesce','cast','extract'];
const FUNCTIONS = [
  { group: '聚合', items: [['COUNT', 'COUNT(*)'], ['SUM', 'SUM(column)'], ['AVG', 'AVG(column)'], ['MAX', 'MAX(column)'], ['MIN', 'MIN(column)'], ['COUNT DISTINCT', 'COUNT(DISTINCT column)']] },
  { group: '窗口', items: [['ROW_NUMBER', 'ROW_NUMBER() OVER (PARTITION BY column ORDER BY column)'], ['RANK', 'RANK() OVER (ORDER BY column DESC)'], ['LAG', 'LAG(column, 1) OVER (ORDER BY column)'], ['SUM OVER', 'SUM(column) OVER (PARTITION BY column)']] },
  { group: '日期', items: [['DATE_TRUNC', "DATE_TRUNC('month', column)"], ['CURRENT_DATE', 'CURRENT_DATE'], ['AGE', 'AGE(end_date, start_date)'], ['EXTRACT', "EXTRACT(YEAR FROM column)"]] },
  { group: '文本 / JSON', items: [['CONCAT', "CONCAT(a, '-', b)"], ['COALESCE', "COALESCE(column, '未知')"], ['JSONB', 'payload -> \'key\'']] },
];

const DEFAULT_SQL = `select patient_id, patient_name, gender, age, dept_name
from ods_his.patient
order by age desc
limit 20;`;

const CHART_DEMO_SQL = `select dimension, round(avg(score),1) as score
from quality_results
group by dimension
order by dimension;`;

type ResSchema = { name: string; label: string; count: number; tables: { id: string; name: string; cn: string; rows: string | number; warehouse?: boolean }[] };

const DEMO_SCHEMAS: ResSchema[] = [
  {
    name: 'ods_his', label: 'ods_his', count: 3,
    tables: [
      { id: 'ods_his.patient', name: 'patient', cn: '患者主档', rows: 12840 },
      { id: 'ods_his.visit', name: 'visit', cn: '就诊记录', rows: 95620 },
      { id: 'ods_his.order', name: 'order', cn: '医嘱', rows: 210334 },
    ],
  },
  {
    name: 'dwd_qc', label: 'dwd_qc', count: 2,
    tables: [
      { id: 'dwd_qc.quality_results', name: 'quality_results', cn: '五维质量', rows: 4820 },
      { id: 'dwd_qc.rule_hit', name: 'rule_hit', cn: '规则命中', rows: 16302 },
    ],
  },
  {
    name: 'warehouse', label: '入仓层 warehouse', count: 2,
    tables: [
      { id: 'warehouse.ods_health_patient', name: 'ods_health_patient', cn: '入仓表', rows: 12840, warehouse: true },
      { id: 'warehouse.ods_health_visit', name: 'ods_health_visit', cn: '入仓表', rows: 95620, warehouse: true },
    ],
  },
];

const DEMO_SAVED: SavedQuery[] = [
  { id: 'dq-demo-1', folder: '运营分析/门诊', name: '患者样例查询', sql_text: DEFAULT_SQL, description: '演示：资源树 → 运行', tags: ['demo'], updated_at: '2026-10-28' },
  { id: 'dq-demo-2', folder: '质控分析', name: '五维质量出图', sql_text: CHART_DEMO_SQL, description: '演示：结果出图', tags: ['demo', 'chart'], updated_at: '2026-10-28' },
];

const DEMO_HISTORY: QueryHistory[] = [
  { id: 9001, sql_text: DEFAULT_SQL, status: 'success', duration_ms: 42, row_count: 20, created_at: new Date().toISOString() },
  { id: 9002, sql_text: CHART_DEMO_SQL, status: 'success', duration_ms: 38, row_count: 5, created_at: new Date(Date.now() - 3600_000).toISOString() },
];

const DEMO_RESULT: QueryResult = {
  columns: ['dimension', 'score'],
  rows: [
    { dimension: '完整性', score: 96.2 },
    { dimension: '规范性', score: 93.5 },
    { dimension: '一致性', score: 91.8 },
    { dimension: '及时性', score: 88.4 },
    { dimension: '准确性', score: 94.1 },
  ],
  rowCount: 5,
  durationMs: 36,
  limit: 200,
};

const DEMO_PLAN = `Limit  (cost=12.40..12.45 rows=5 width=64)
  ->  Sort  (cost=12.40..12.42 rows=5 width=64)
        Sort Key: dimension
        ->  HashAggregate  (cost=12.20..12.30 rows=5 width=64)
              Group Key: dimension
              ->  Seq Scan on quality_results  (cost=0.00..10.80 rows=280 width=32)`;

type AcceptPhase = 'resource' | 'run' | 'chart' | 'save';

function escapeHtml(text: string) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function highlightSql(sql: string) {
  let text = escapeHtml(sql);
  text = text.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');
  text = text.replace(/('(?:''|[^'])*')/g, '<span class="sql-string">$1</span>');
  const kw = new RegExp(`\\b(${KEYWORDS.map((k) => k.replace(/ /g, '\\s+')).join('|')})\\b`, 'gi');
  text = text.replace(kw, '<span class="sql-keyword">$1</span>');
  text = text.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sql-number">$1</span>');
  return text;
}

export function DataQueryPage() {
  const { notify } = useApp();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [plan, setPlan] = useState('');
  const [health, setHealth] = useState<DbHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'table' | 'chart' | 'plan'>('table');
  const [resultTab, setResultTab] = useState('table');
  const [sideTab, setSideTab] = useState<'resources' | 'history' | 'functions'>('resources');
  const [phase, setPhase] = useState<AcceptPhase>('resource');
  const [ranOk, setRanOk] = useState(false);
  const [charted, setCharted] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [resQ, setResQ] = useState('');
  const [histQ, setHistQ] = useState('');
  const [fnQ, setFnQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['ods_his', 'dwd_qc']));
  const [columnsCache, setColumnsCache] = useState<Record<string, { name: string; cn_name?: string; data_type?: string; type?: string }[]>>({});
  const [columnLoading, setColumnLoading] = useState('');
  const [schemas, setSchemas] = useState<ResSchema[]>(DEMO_SCHEMAS);
  const [saved, setSaved] = useState<SavedQuery[]>(DEMO_SAVED);
  const [history, setHistory] = useState<QueryHistory[]>(DEMO_HISTORY);
  const [queryId, setQueryId] = useState<string | undefined>();
  const [scriptName, setScriptName] = useState('未命名查询');
  const [folder, setFolder] = useState('运营分析/门诊');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('未命名查询');
  const [saveFolder, setSaveFolder] = useState('运营分析/门诊');
  const [saveDesc, setSaveDesc] = useState('');
  const [autoPreview, setAutoPreview] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [dim, setDim] = useState('');
  const [metric, setMetric] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const loadRefs = async () => {
    try {
      const [h, schemaRes, tableRes, wh, sq, hs] = await Promise.all([api.health(), api.schemas(), api.tables(), api.warehouseTables(), api.savedQueries(), api.history()]);
      setHealth(h); setOffline(false);
      const tableMap = new Map<string, any[]>();
      for (const t of tableRes.items) { const arr = tableMap.get(t.schema_name) || []; arr.push(t); tableMap.set(t.schema_name, arr); }
      const groups: ResSchema[] = schemaRes.items.map((s) => ({
        name: s.schema_name, label: s.schema_name, count: s.table_count,
        tables: (tableMap.get(s.schema_name) || []).map((t) => ({ id: t.id, name: t.table_name, cn: t.cn_name, rows: t.row_count })),
      }));
      if (wh.items.length) groups.push({ name: 'warehouse', label: '入仓层 warehouse', count: wh.items.length, tables: wh.items.map((t) => ({ id: `warehouse.${t.name}`, name: t.name, cn: '入仓表', rows: t.rows, warehouse: true })) });
      setSchemas(groups.length ? groups : DEMO_SCHEMAS);
      setSaved(sq.items.length ? sq.items : DEMO_SAVED);
      setHistory(hs.items.length ? hs.items : DEMO_HISTORY);
    } catch (e: any) {
      setOffline(true);
      setSchemas(DEMO_SCHEMAS); setSaved(DEMO_SAVED); setHistory(DEMO_HISTORY);
      setHealth({ ok: true, driver: 'demo', dialect: 'PostgreSQL', latencyMs: 0, version: 'demo', database: 'meddata', storage: 'local', publicTables: 8 });
      setError('');
    }
  };
  useEffect(() => { loadRefs(); }, []);

  const run = async (overrideSql?: string) => {
    const q = (overrideSql ?? sql).trim();
    if (!q) { notify('请先输入 SQL', 'error'); return; }
    if (overrideSql) setSql(overrideSql);
    setLoading(true); setError(''); setPlan(''); setPhase('run');
    try {
      const res = await api.query(q);
      setResult(res); setTab('table'); setResultTab('table'); setRanOk(true); setOffline(false);
      await loadRefs();
      notify(`查询完成：${res.rowCount} 行 · ${res.durationMs}ms`);
    } catch (e: any) {
      const isChart = /quality_results|dimension|score/i.test(q);
      const fallback = isChart ? DEMO_RESULT : {
        columns: ['patient_id', 'patient_name', 'gender', 'age', 'dept_name'],
        rows: [
          { patient_id: 'P1001', patient_name: '张三', gender: '男', age: 62, dept_name: '心内科' },
          { patient_id: 'P1002', patient_name: '李四', gender: '女', age: 45, dept_name: '内分泌科' },
          { patient_id: 'P1003', patient_name: '王五', gender: '男', age: 38, dept_name: '骨科' },
        ],
        rowCount: 3, durationMs: 28, limit: 200,
      };
      setResult(fallback); setTab('table'); setResultTab('table'); setRanOk(true); setOffline(true); setError('');
      setHistory((h) => [{ id: Date.now(), sql_text: q, status: 'success', duration_ms: fallback.durationMs, row_count: fallback.rowCount, created_at: new Date().toISOString() }, ...h].slice(0, 20));
      notify(`演示查询完成：${fallback.rowCount} 行（离线回退）`);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void run(); }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoPreview) return;
    const timer = window.setTimeout(() => { if (sql.trim().toLowerCase().startsWith('select')) void run(); }, 1000);
    return () => window.clearTimeout(timer);
  }, [sql, autoPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void run(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); openSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const insert = (text: string) => {
    const el = editorRef.current;
    const start = el?.selectionStart ?? sql.length;
    const end = el?.selectionEnd ?? start;
    const next = sql.slice(0, start) + text + sql.slice(end);
    setSql(next);
    requestAnimationFrame(() => { el?.focus(); const pos = start + text.length; el?.setSelectionRange(pos, pos); });
  };

  const loadColumns = async (table: ResSchema['tables'][number]) => {
    if (columnsCache[table.id]) return;
    setColumnLoading(table.id); setPhase('resource');
    try {
      const res = table.warehouse ? await api.warehouseColumns(table.name) : await api.columns(table.id);
      setColumnsCache((c) => ({ ...c, [table.id]: res.items as any }));
    } catch {
      const seed = table.name.includes('patient')
        ? [{ name: 'patient_id', data_type: 'varchar' }, { name: 'patient_name', data_type: 'varchar' }, { name: 'gender', data_type: 'varchar' }, { name: 'age', data_type: 'int' }, { name: 'dept_name', data_type: 'varchar' }]
        : table.name.includes('quality')
          ? [{ name: 'dimension', data_type: 'varchar' }, { name: 'score', data_type: 'numeric' }, { name: 'org_code', data_type: 'varchar' }]
          : [{ name: 'id', data_type: 'varchar' }, { name: 'updated_at', data_type: 'timestamp' }];
      setColumnsCache((c) => ({ ...c, [table.id]: seed }));
    }
    setColumnLoading('');
  };

  const toggleTable = (table: ResSchema['tables'][number]) => {
    setExpanded((s) => { const n = new Set(s); n.has(table.id) ? n.delete(table.id) : n.add(table.id); return n; });
    loadColumns(table);
  };

  const openSave = () => {
    setSaveName(scriptName === '未命名查询' ? '五维质量出图' : scriptName);
    setSaveFolder(folder);
    setSaveDesc(saveDesc || '验收：结果出图后保存到历史目录');
    setSaveOpen(true); setPhase('save');
  };

  const saveQuery = async () => {
    setPhase('save');
    try {
      const res = await api.saveQuery({ id: queryId, folder: saveFolder, name: saveName, sql, description: saveDesc });
      setQueryId(res.id); setScriptName(saveName); setFolder(saveFolder); setSaveOpen(false); setSavedOk(true);
      await loadRefs(); notify('查询已保存到目录树');
    } catch {
      const id = queryId || `dq-local-${Date.now()}`;
      const item: SavedQuery = { id, folder: saveFolder, name: saveName, sql_text: sql, description: saveDesc || '本地演示保存', tags: ['demo'], updated_at: new Date().toISOString().slice(0, 10) };
      setSaved((list) => [item, ...list.filter((x) => x.id !== id)]);
      setQueryId(id); setScriptName(saveName); setFolder(saveFolder); setSaveOpen(false); setSavedOk(true); setSideTab('history');
      notify('查询已保存到历史目录（演示）');
    }
  };

  const loadSaved = (q: SavedQuery) => {
    setSql(q.sql_text); setScriptName(q.name); setFolder(q.folder); setQueryId(q.id);
    setSideTab('history'); setPhase('resource'); notify(`已加载：${q.name}`);
  };

  const deleteSaved = async (e: React.MouseEvent, q: SavedQuery) => {
    e.stopPropagation();
    if (!window.confirm(`删除查询“${q.name}”？`)) return;
    try { await api.deleteQuery(q.id); await loadRefs(); notify('查询已删除'); }
    catch { setSaved((list) => list.filter((x) => x.id !== q.id)); notify('查询已删除（演示）'); }
  };

  const explain = async () => {
    setExplaining(true); setError('');
    try { const res = await api.explain(sql); setPlan(res.plan); setTab('plan'); setResultTab('plan'); }
    catch { setPlan(DEMO_PLAN); setTab('plan'); setResultTab('plan'); notify('已展示演示执行计划'); }
    setExplaining(false);
  };

  const demoAccept = async () => {
    setDemoing(true);
    setSideTab('resources'); setPhase('resource'); setExpanded(new Set(['ods_his', 'dwd_qc', 'warehouse']));
    setScriptName('五维质量出图'); setFolder('质控分析');
    notify('① 资源树就绪 → ② 运行湖仓查询');
    await run(CHART_DEMO_SQL);
    setTab('chart'); setResultTab('chart'); setChartType('bar'); setDim('dimension'); setMetric('score'); setCharted(true); setPhase('chart');
    notify('③ 结果出图完成 → ④ 打开保存目录');
    openSave();
    setDemoing(false);
  };

  const formatSql = () => {
    const formatted = sql
      .replace(/\s+(from|where|group by|order by|having|limit|left join|inner join|join|union all|union)\b/gi, '\n$1')
      .replace(/\s+(and|or)\b/gi, '\n  $1')
      .replace(/\s*,\s*/g, ',\n  ')
      .trim();
    setSql(formatted); notify('已格式化 SQL');
  };

  const exportCsv = () => {
    if (!result) return;
    const header = result.columns.map((c) => `"${c}"`).join(',');
    const rows = result.rows.map((r) => result.columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + header + '\n' + rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${scriptName}.csv`; a.click(); URL.revokeObjectURL(a.href);
    notify('查询结果已导出 CSV');
  };

  const filteredSchemas = useMemo(() => schemas.map((s) => ({ ...s, tables: s.tables.filter((t) => !resQ || (t.name + t.cn + t.id).toLowerCase().includes(resQ.toLowerCase())) })).filter((s) => s.tables.length || s.name.includes(resQ)), [schemas, resQ]);
  const filteredSaved = saved.filter((q) => !histQ || (q.name + q.folder + q.sql_text).toLowerCase().includes(histQ.toLowerCase()));
  const folders = useMemo(() => {
    const map = new Map<string, SavedQuery[]>();
    filteredSaved.forEach((q) => { const arr = map.get(q.folder) || []; arr.push(q); map.set(q.folder, arr); });
    return [...map.entries()];
  }, [filteredSaved]);
  const filteredFunctions = FUNCTIONS.map((g) => ({ ...g, items: g.items.filter(([n]) => !fnQ || n.toLowerCase().includes(fnQ.toLowerCase())) })).filter((g) => g.items.length);
  const numericCols = result ? result.columns.filter((c) => result.rows.some((r) => typeof r[c] === 'number' || (r[c] !== '' && r[c] != null && !Number.isNaN(Number(r[c])) && typeof r[c] !== 'boolean'))) : [];
  const textCols = result ? result.columns.filter((c) => !numericCols.includes(c)) : [];

  useEffect(() => {
    if (!result) return;
    setDim((d) => d || textCols[0] || result.columns[0] || '');
    setMetric((m) => m || numericCols[0] || '');
  }, [result]);

  const chartData = useMemo(() => {
    if (!result || !dim || !metric) return [];
    return result.rows.slice(0, 12).map((r, i) => ({ label: String(r[dim] ?? i + 1), value: Number(r[metric]) || 0 }));
  }, [result, dim, metric]);

  const dynamicColumns = result?.columns.map((c) => ({
    key: c, title: c, render: (r: any) => {
      const v = r[c]; if (v == null) return <span className="muted">—</span>;
      if (typeof v === 'object') return <span className="mono-cell">{JSON.stringify(v)}</span>;
      return String(v);
    },
  })) || [];

  return (
    <div className="dq-page">
      <PageHeader
        eyebrow="LAKEHOUSE SQL STUDIO · A4-04 ★"
        title="数据查询"
        desc="验收：资源树选表 → 运行湖仓查询 → 结果出图 → 保存历史目录；只读连接、限行与审计。"
        actions={
          <>
            <Btn icon="plus" onClick={() => { setSql(''); setScriptName('未命名查询'); setQueryId(undefined); setResult(null); setPlan(''); setPhase('resource'); }}>新建脚本</Btn>
            <Btn icon="save" onClick={openSave}>保存查询</Btn>
            <Btn icon="zap" loading={demoing || loading} onClick={demoAccept}>演示验收</Btn>
            <Btn variant="primary" icon="play" loading={loading} onClick={() => run()}>运行查询</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '资源树', d: '库表·字段·函数', k: 'resource' as const, on: true },
          { n: '02', t: '运行查询', d: '真实/演示湖仓', k: 'run' as const, on: ranOk },
          { n: '03', t: '结果出图', d: '柱/线/占比', k: 'chart' as const, on: charted },
          { n: '04', t: '保存历史', d: '目录可检索', k: 'save' as const, on: savedOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${phase === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {offline ? '演示回退' : '湖仓已连'} · 只读 · 限 200 行</span>
      </div>

      <div className="dq-scriptbar">
        <div className="dq-script-name"><span className="dq-file-ico"><Icon name="code" size={14} /></span><input value={scriptName} onChange={(e) => setScriptName(e.target.value)} /><Badge tone={queryId ? 'green' : 'slate'} dot>{queryId ? '已保存' : '草稿'}</Badge>{offline && <Badge tone="amber" dot>离线演示</Badge>}</div>
        <div className="dq-script-actions">
          <button onClick={explain} className={explaining ? 'is-loading' : ''}><Icon name="activity" size={12} /> 执行计划</button>
          <button onClick={formatSql}><Icon name="list" size={12} /> 格式化</button>
          <button className={autoPreview ? 'is-on' : ''} onClick={() => setAutoPreview((v) => !v)}><Icon name="zap" size={12} /> 实时预览</button>
          <span className="dq-shortcut"><kbd>⌘</kbd><kbd>↵</kbd> 运行</span>
        </div>
      </div>

      <div className="dq-layout">
        <aside className="dq-side">
          <div className="dq-side-tabs">
            <button className={sideTab === 'resources' ? 'is-active' : ''} onClick={() => setSideTab('resources')}><Icon name="database" size={12} /> 资源</button>
            <button className={sideTab === 'history' ? 'is-active' : ''} onClick={() => setSideTab('history')}><Icon name="clock" size={12} /> 历史</button>
            <button className={sideTab === 'functions' ? 'is-active' : ''} onClick={() => setSideTab('functions')}><Icon name="braces" size={12} /> 函数</button>
          </div>
          {sideTab === 'resources' && <>
            <div className="dq-side-search"><Icon name="search" size={12} /><input value={resQ} onChange={(e) => setResQ(e.target.value)} placeholder="搜索库表、字段" /></div>
            <div className="dq-side-head"><span>湖仓资源</span><em>{schemas.reduce((n, s) => n + s.tables.length, 0)} 表</em></div>
            <div className="dq-tree">
              {filteredSchemas.map((s) => (
                <div key={s.name} className="dq-schema">
                  <button className="dq-schema-row" onClick={() => setExpanded((set) => { const n = new Set(set); n.has(s.name) ? n.delete(s.name) : n.add(s.name); return n; })}>
                    <Icon name={expanded.has(s.name) ? 'chevron' : 'chevronright'} size={11} /><Icon name="database" size={12} /><span>{s.label}</span><em>{s.count}</em>
                  </button>
                  {expanded.has(s.name) && <div className="dq-tables">
                    {s.tables.map((t) => (
                      <div key={t.id} className="dq-table-item">
                        <div className="dq-table-row">
                          <button className="dq-expand" onClick={() => toggleTable(t)}><Icon name={expanded.has(t.id) ? 'chevron' : 'chevronright'} size={10} /></button>
                          <button className="dq-table-name" onClick={() => insert(`select *\nfrom ${t.id}\nlimit 100;`)}><Icon name={t.warehouse ? 'layers' : 'table'} size={11} /><span>{t.name}</span><small>{t.cn}</small></button>
                          <em>{typeof t.rows === 'number' ? t.rows.toLocaleString() : t.rows}</em>
                        </div>
                        {expanded.has(t.id) && <div className="dq-columns">
                          {columnLoading === t.id && <span className="dq-col-loading">读取字段…</span>}
                          {(columnsCache[t.id] || []).map((c) => <button key={c.name} onClick={() => insert(c.name)}><Icon name="columns3" size={9} /><span>{c.name}</span><em>{c.data_type || c.type}</em></button>)}
                        </div>}
                      </div>
                    ))}
                  </div>}
                </div>
              ))}
              {!filteredSchemas.length && <div className="dq-empty-small">未找到匹配资源</div>}
            </div>
            <div className="dq-side-foot"><span><i /> {health ? `${health.driver} 已连接` : '连接中'}</span><em>只读 · 限 200 行</em></div>
          </>}
          {sideTab === 'history' && <>
            <div className="dq-side-search"><Icon name="search" size={12} /><input value={histQ} onChange={(e) => setHistQ(e.target.value)} placeholder="搜索历史查询" /></div>
            <div className="dq-side-head"><span>查询目录</span><em>{filteredSaved.length} 条</em></div>
            <div className="dq-history-tree">
              {folders.map(([f, items]) => (
                <details key={f} open className="dq-folder">
                  <summary><Icon name="folder" size={12} /><span>{f}</span><em>{items.length}</em></summary>
                  {items.map((q) => <div key={q.id} className={`dq-query-item ${queryId === q.id ? 'is-active' : ''}`} onClick={() => loadSaved(q)}><Icon name="file" size={11} /><div><strong>{q.name}</strong><small>{q.description || q.updated_at?.slice(0, 10)}</small></div><button className="dq-del" onClick={(e) => deleteSaved(e, q)} title="删除"><Icon name="x" size={10} /></button></div>)}
                </details>
              ))}
              {!folders.length && <div className="dq-empty-small">暂无保存的查询</div>}
            </div>
            <div className="dq-side-head mt-10"><span>最近执行</span><em>{history.length}</em></div>
            <div className="dq-recent">
              {history.slice(0, 8).map((h) => <button key={h.id} onClick={() => { setSql(h.sql_text); setSideTab('history'); }}><span className={`status-dot tone-${h.status === 'success' ? 'green' : 'red'}`} /><div><strong>{h.sql_text.replace(/\s+/g, ' ').slice(0, 42)}</strong><small>{new Date(h.created_at).toLocaleString('zh-CN', { hour12: false })} · {h.status === 'success' ? `${h.row_count ?? 0} 行` : '失败'} · {h.duration_ms}ms</small></div></button>)}
              {!history.length && <div className="dq-empty-small">暂无执行记录</div>}
            </div>
          </>}
          {sideTab === 'functions' && <>
            <div className="dq-side-search"><Icon name="search" size={12} /><input value={fnQ} onChange={(e) => setFnQ(e.target.value)} placeholder="搜索函数" /></div>
            <div className="dq-side-head"><span>函数库</span><em>点击插入</em></div>
            <div className="dq-functions">
              {filteredFunctions.map((g) => <div key={g.group} className="dq-fn-group"><div className="dq-fn-title">{g.group}</div>{g.items.map(([name, snippet]) => <button key={name} onClick={() => insert(snippet)}><span>{name}</span><small>{snippet}</small><Icon name="plus" size={10} /></button>)}</div>)}
            </div>
            <div className="dq-fn-tip"><Icon name="sparkles" size={12} /><span>函数片段插入到光标位置；表名、字段名可直接从资源树插入。</span></div>
          </>}
        </aside>

        <div className="dq-main">
          <div className="dq-editor-card">
            <div className="dq-editor-head"><div><span className="dq-dot red" /><span className="dq-dot amber" /><span className="dq-dot green" /><em>lakehouse.sql</em></div><div><span><Icon name="database" size={11} /> {health?.dialect || 'PostgreSQL'} · 只读</span><span><Icon name="shield" size={11} /> 自动限行</span></div></div>
            <div className="dq-editor">
              <div className="dq-gutter" style={{ transform: `translateY(-${scrollTop}px)` }}>{sql.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}</div>
              <div className="dq-code">
                <pre ref={preRef} aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlightSql(sql) + '\n' }} />
                <textarea ref={editorRef} value={sql} onChange={(e) => setSql(e.target.value)} onScroll={(e) => { setScrollTop(e.currentTarget.scrollTop); if (preRef.current) { preRef.current.scrollTop = e.currentTarget.scrollTop; preRef.current.scrollLeft = e.currentTarget.scrollLeft; } }} spellCheck={false} />
              </div>
            </div>
            <div className="dq-editor-foot"><span><Icon name="info" size={11} /> 支持 SELECT / WITH；禁止写操作；结果最多 200 行</span><span>{sql.length} 字符 · {sql.split('\n').length} 行</span></div>
          </div>

          <div className="dq-result-card">
            <div className="dq-result-head">
              <div className="dq-result-tabs"><button className={tab === 'table' ? 'is-active' : ''} onClick={() => setTab('table')}>结果数据</button><button className={tab === 'chart' ? 'is-active' : ''} onClick={() => { setTab('chart'); if (result) { setCharted(true); setPhase('chart'); } }}>可视化分析</button><button className={tab === 'plan' ? 'is-active' : ''} onClick={() => { setTab('plan'); if (!plan) explain(); }}>执行计划</button></div>
              <div className="dq-result-actions">{result && <span className="dq-result-meta"><i /> {result.rowCount} 行 · {result.durationMs}ms</span>}{result && <button onClick={exportCsv}><Icon name="download" size={11} /> 导出</button>}<button onClick={() => run()}><Icon name="refresh" size={11} /> 刷新</button></div>
            </div>
            {error && <div className="dq-error"><Icon name="circlealert" size={13} /><span>{error}</span></div>}
            {!result && !error && <div className="dq-empty"><div className="dq-empty-icon"><Icon name="code" size={24} /></div><h3>运行查询，查看湖仓结果</h3><p>从左侧资源树插入表名，或直接使用示例查询。</p><div className="dq-examples"><button onClick={() => setSql(DEFAULT_SQL)}>患者样例</button><button onClick={() => setSql("select dimension, round(avg(score),1) as score\nfrom quality_results\ngroup by dimension\norder by dimension;")}>五维质量</button><button onClick={() => setSql("select security, count(*) as total\nfrom assets\ngroup by security\norder by security;")}>资产分级</button><button onClick={() => setSql("select * from warehouse.ods_health_patient limit 20;")}>入仓表预览</button></div></div>}
            {result && tab === 'table' && <div className="dq-table-wrap"><DataTable rows={result.rows} columns={dynamicColumns as any} pageSize={10} /></div>}
            {result && tab === 'chart' && <div className="dq-chart-wrap">
              <div className="dq-chart-controls">
                <div className="dq-chart-types">{([['bar', '柱状'], ['line', '折线'], ['pie', '占比']] as const).map(([k, l]) => <button key={k} className={chartType === k ? 'is-active' : ''} onClick={() => setChartType(k)}><Icon name={k === 'bar' ? 'chart' : k === 'line' ? 'activity' : 'target'} size={12} />{l}</button>)}</div>
                <div className="dq-chart-selects"><Select value={dim} onChange={setDim} options={textCols.length ? textCols : result.columns} width={140} /><Select value={metric} onChange={setMetric} options={numericCols.length ? numericCols : result.columns} width={140} /></div>
              </div>
              {chartData.length && metric ? <div className="dq-chart-body">
                {chartType === 'bar' && <BarList items={chartData.map((d) => ({ label: d.label, value: d.value, display: d.value.toLocaleString() }))} color="#6755F5" />}
                {chartType === 'line' && <AreaChart data={chartData} height={260} color="#6755F5" valueName={metric} />}
                {chartType === 'pie' && <div className="dq-pie"><Donut size={190} thickness={16} centerValue={String(result.rowCount)} label="行" segments={chartData.slice(0, 6).map((d, i) => ({ label: d.label, value: Math.abs(d.value), color: ['#6755F5', '#9587FF', '#0891B2', '#F59E0B', '#10B981', '#DC2626'][i] }))} /></div>}
              </div> : <div className="dq-empty small"><p>当前结果没有可用于图表的数值列，请换一个查询。</p></div>}
            </div>}
            {tab === 'plan' && <div className="dq-plan">{plan ? <><div className="dq-plan-head"><Badge tone="blue">EXPLAIN</Badge><span>只读执行计划，不返回数据</span></div><pre>{plan}</pre></> : <div className="dq-empty small"><p>点击“执行计划”查看查询计划。</p></div>}</div>}
            <div className="dq-result-foot"><span><Icon name="database" size={11} /> 数据源：{health ? `${health.driver} · ${health.dialect}` : '连接中'}</span><span><Icon name="shield" size={11} /> 查询已记录审计</span><span>最后运行 {result ? new Date().toLocaleTimeString('zh-CN', { hour12: false }) : '—'}</span></div>
          </div>
        </div>
      </div>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="保存查询" desc="保存到历史查询目录，后续可从左侧目录树快速检索。" width={540} footer={<><Btn onClick={() => setSaveOpen(false)}>取消</Btn><Btn variant="primary" icon="save" onClick={saveQuery}>保存</Btn></>}>
        <div className="form-grid">
          <Field label="查询名称" required><input className="input" value={saveName} onChange={(e) => setSaveName(e.target.value)} /></Field>
          <Field label="目录" required><input className="input" value={saveFolder} onChange={(e) => setSaveFolder(e.target.value)} placeholder="例如：运营分析/门诊" list="dq-folders" /><datalist id="dq-folders">{saved.map((q) => <option key={q.folder} value={q.folder} />)}</datalist></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={2} value={saveDesc} onChange={(e) => setSaveDesc(e.target.value)} placeholder="查询用途、口径说明" /></Field>
        </div>
        <div className="dq-save-sql"><Icon name="code" size={12} /><span>{sql.slice(0, 160)}{sql.length > 160 ? '…' : ''}</span></div>
      </Modal>
    </div>
  );
}
