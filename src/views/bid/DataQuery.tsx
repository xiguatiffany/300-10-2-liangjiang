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

type ResSchema = { name: string; label: string; count: number; tables: { id: string; name: string; cn: string; rows: string | number; warehouse?: boolean }[] };

export function DataQueryPage() {
  const { notify } = useApp();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [plan, setPlan] = useState('');
  const [health, setHealth] = useState<DbHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'table' | 'chart' | 'plan'>('table');
  const [resultTab, setResultTab] = useState('table');
  const [sideTab, setSideTab] = useState<'resources' | 'history' | 'functions'>('resources');
  const [resQ, setResQ] = useState('');
  const [histQ, setHistQ] = useState('');
  const [fnQ, setFnQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['ods_his']));
  const [columnsCache, setColumnsCache] = useState<Record<string, { name: string; cn_name?: string; data_type?: string; type?: string }[]>>({});
  const [columnLoading, setColumnLoading] = useState('');
  const [schemas, setSchemas] = useState<ResSchema[]>([]);
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [history, setHistory] = useState<QueryHistory[]>([]);
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
      setHealth(h);
      const tableMap = new Map<string, any[]>();
      for (const t of tableRes.items) { const arr = tableMap.get(t.schema_name) || []; arr.push(t); tableMap.set(t.schema_name, arr); }
      const groups: ResSchema[] = schemaRes.items.map((s) => ({
        name: s.schema_name, label: s.schema_name, count: s.table_count,
        tables: (tableMap.get(s.schema_name) || []).map((t) => ({ id: t.id, name: t.table_name, cn: t.cn_name, rows: t.row_count })),
      }));
      if (wh.items.length) groups.push({ name: 'warehouse', label: '入仓层 warehouse', count: wh.items.length, tables: wh.items.map((t) => ({ id: `warehouse.${t.name}`, name: t.name, cn: '入仓表', rows: t.rows, warehouse: true })) });
      setSchemas(groups); setSaved(sq.items); setHistory(hs.items);
    } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { loadRefs(); }, []);

  const run = async () => {
    if (!sql.trim()) { notify('请先输入 SQL', 'error'); return; }
    setLoading(true); setError(''); setPlan('');
    try {
      const res = await api.query(sql);
      setResult(res); setTab('table'); setResultTab('table');
      await loadRefs();
      notify(`查询完成：${res.rowCount} 行 · ${res.durationMs}ms`);
    } catch (e: any) { setError(e.message); setResult(null); notify(e.message, 'error'); }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { run(); }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoPreview) return;
    const timer = window.setTimeout(() => { if (sql.trim().toLowerCase().startsWith('select')) run(); }, 1000);
    return () => window.clearTimeout(timer);
  }, [sql, autoPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); }
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
    setColumnLoading(table.id);
    try {
      const res = table.warehouse ? await api.warehouseColumns(table.name) : await api.columns(table.id);
      setColumnsCache((c) => ({ ...c, [table.id]: res.items as any }));
    } catch (e: any) { notify(e.message, 'error'); }
    setColumnLoading('');
  };

  const toggleTable = (table: ResSchema['tables'][number]) => {
    setExpanded((s) => { const n = new Set(s); n.has(table.id) ? n.delete(table.id) : n.add(table.id); return n; });
    loadColumns(table);
  };

  const openSave = () => {
    setSaveName(scriptName === '未命名查询' ? '未命名查询' : scriptName);
    setSaveFolder(folder);
    setSaveDesc('');
    setSaveOpen(true);
  };

  const saveQuery = async () => {
    try {
      const res = await api.saveQuery({ id: queryId, folder: saveFolder, name: saveName, sql, description: saveDesc });
      setQueryId(res.id); setScriptName(saveName); setFolder(saveFolder); setSaveOpen(false);
      await loadRefs(); notify('查询已保存到目录树');
    } catch (e: any) { notify(e.message, 'error'); }
  };

  const loadSaved = (q: SavedQuery) => {
    setSql(q.sql_text); setScriptName(q.name); setFolder(q.folder); setQueryId(q.id);
    setSideTab('history'); notify(`已加载：${q.name}`);
  };

  const deleteSaved = async (e: React.MouseEvent, q: SavedQuery) => {
    e.stopPropagation();
    if (!window.confirm(`删除查询“${q.name}”？`)) return;
    try { await api.deleteQuery(q.id); await loadRefs(); notify('查询已删除'); } catch (err: any) { notify(err.message, 'error'); }
  };

  const explain = async () => {
    setExplaining(true); setError('');
    try { const res = await api.explain(sql); setPlan(res.plan); setTab('plan'); setResultTab('plan'); }
    catch (e: any) { setError(e.message); notify(e.message, 'error'); }
    setExplaining(false);
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
      <PageHeader eyebrow="LAKEHOUSE SQL STUDIO" title="数据查询" desc="面向湖仓的可视化查询分析：资源树、函数库、历史查询目录、在线脚本开发，运行结果实时预览。" actions={<><Btn icon="plus" onClick={() => { setSql(''); setScriptName('未命名查询'); setQueryId(undefined); setResult(null); setPlan(''); }}>新建脚本</Btn><Btn icon="save" onClick={openSave}>保存查询</Btn><Btn variant="primary" icon="play" loading={loading} onClick={run}>运行查询</Btn></>} />

      <div className="dq-scriptbar">
        <div className="dq-script-name"><span className="dq-file-ico"><Icon name="code" size={14} /></span><input value={scriptName} onChange={(e) => setScriptName(e.target.value)} /><Badge tone={queryId ? 'green' : 'slate'} dot>{queryId ? '已保存' : '草稿'}</Badge></div>
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
              <div className="dq-result-tabs"><button className={tab === 'table' ? 'is-active' : ''} onClick={() => setTab('table')}>结果数据</button><button className={tab === 'chart' ? 'is-active' : ''} onClick={() => setTab('chart')}>可视化分析</button><button className={tab === 'plan' ? 'is-active' : ''} onClick={() => { setTab('plan'); if (!plan) explain(); }}>执行计划</button></div>
              <div className="dq-result-actions">{result && <span className="dq-result-meta"><i /> {result.rowCount} 行 · {result.durationMs}ms</span>}{result && <button onClick={exportCsv}><Icon name="download" size={11} /> 导出</button>}<button onClick={run}><Icon name="refresh" size={11} /> 刷新</button></div>
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
