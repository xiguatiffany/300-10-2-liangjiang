import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Btn, Empty, Tabs, cx } from './ui';
import { useApp } from '../app-context';

const schemas = [
  { name: 'ods_his', tables: ['patients', 'outpatient_visits', 'inpatient_visits', 'orders', 'charges'] },
  { name: 'ods_emr', tables: ['cpoe_orders', 'diagnosis', 'surgery_records', 'discharge_summary'] },
  { name: 'ods_lis', tables: ['lab_reports', 'lab_results', 'specimens'] },
  { name: 'ods_pacs', tables: ['study_index', 'dicom_series', 'reports'] },
  { name: 'dwd', tables: ['fact_visit', 'fact_surgery', 'fact_charge', 'dim_patient'] },
  { name: 'hm', tables: ['hm_reg_appt_data', 'hm_fs_surgeries_data', 'hm_bed_usage_data'] },
];

const sampleRows = [
  ['100248601', '张*华', '男', '1968-04-12', '心血管内科', 12, '2026-08-05 09:24'],
  ['100248602', '李*芳', '女', '1975-11-03', '消化内科', 8, '2026-08-05 10:12'],
  ['100248603', '王*明', '男', '1982-02-27', '骨科', 5, '2026-08-04 15:40'],
  ['100248604', '陈*', '女', '1990-07-19', '呼吸内科', 3, '2026-08-04 11:08'],
  ['100248605', '刘*军', '男', '1957-09-30', '神经内科', 16, '2026-08-03 16:22'],
  ['100248606', '赵*婷', '女', '1996-12-08', '皮肤科', 2, '2026-08-03 09:34'],
  ['100248607', '周*', '男', '1971-06-16', '普外科', 9, '2026-08-02 14:50'],
  ['100248608', '吴*红', '女', '1963-03-05', '内分泌科', 14, '2026-08-02 08:46'],
];

const sampleColumns = [
  { key: 'patient_id', label: 'patient_id', type: 'varchar(32)' },
  { key: 'patient_name', label: 'patient_name', type: 'varchar(64)' },
  { key: 'gender', label: 'gender', type: 'char(1)' },
  { key: 'birth_date', label: 'birth_date', type: 'date' },
  { key: 'dept_name', label: 'dept_name', type: 'varchar(64)' },
  { key: 'visit_count', label: 'visit_count', type: 'int' },
  { key: 'last_visit', label: 'last_visit_time', type: 'datetime' },
];

export function SqlWorkbench({ initialSql, height = 260, context = '数据中心' }: { initialSql?: string; height?: number; context?: string }) {
  const { notify } = useApp();
  const [openSchemas, setOpenSchemas] = useState<string[]>(['ods_his', 'hm']);
  const [treeSearch, setTreeSearch] = useState('');
  const [sql, setSql] = useState(initialSql || 'SELECT\n  patient_id,\n  patient_name,\n  gender,\n  birth_date,\n  dept_name,\n  visit_count,\n  last_visit_time\nFROM dwd.fact_visit\nWHERE visit_date >= \'2026-07-01\'\nORDER BY visit_count DESC\nLIMIT 100;');
  const [tab, setTab] = useState('result');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { rows: (string | number)[][]; columns: { key: string; label: string; type: string }[]; ms: number; total: number }>(null);
  const [saved, setSaved] = useState([
    { name: '门诊量日趋势', sql: 'SELECT visit_date, COUNT(*) FROM dwd.fact_visit GROUP BY 1', time: '2026-08-05 16:20' },
    { name: '重点患者随访清单', sql: 'SELECT * FROM hm.hm_reg_appt_data WHERE follow_up = 1', time: '2026-08-03 10:04' },
  ]);
  const [full, setFull] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = Math.max(8, sql.split('\n').length);
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  const run = () => {
    if (!sql.trim()) { notify('请输入 SQL 语句', 'error'); return; }
    setRunning(true);
    setResult(null);
    setTab('result');
    window.setTimeout(() => {
      const isAgg = sql.toLowerCase().includes('count(');
      const rows = isAgg ? sampleRows.slice(0, 5).map((r, i) => [r[4], String([1286, 968, 842, 736, 628][i])]) : sampleRows;
      const columns = isAgg
        ? [{ key: 'dept', label: 'dept_name', type: 'varchar(64)' }, { key: 'cnt', label: 'visit_count', type: 'bigint' }]
        : sampleColumns;
      setResult({ rows, columns, ms: 1240, total: 128642 });
      setRunning(false);
      notify('查询执行成功，返回 128,642 行（已展示前 100 行）');
    }, 720);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  });

  const filteredSchemas = schemas.map((s) => ({ ...s, tables: s.tables.filter((t) => t.includes(treeSearch.toLowerCase())) })).filter((s) => s.tables.length > 0 || s.name.includes(treeSearch.toLowerCase()));

  return (
    <div className={cx('sql-workbench', full && 'is-full')}>
      {full && <div className="sql-full-head"><strong>SQL 工作台</strong><Btn size="sm" icon="x" onClick={() => setFull(false)}>退出全屏</Btn></div>}
      <div className="sql-layout">
        <aside className="sql-side">
          <div className="sql-side-head">
            <span><Icon name="database" size={14} /> 数据目录</span>
            <Icon name="refresh" size={12} />
          </div>
          <div className="sql-tree-search"><Icon name="search" size={12} /><input value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)} placeholder="搜索库表" /></div>
          <div className="sql-tree">
            {filteredSchemas.map((s) => {
              const open = openSchemas.includes(s.name) || treeSearch.length > 0;
              return (
                <div key={s.name} className="tree-group">
                  <button className="tree-schema" onClick={() => setOpenSchemas((arr) => arr.includes(s.name) ? arr.filter((x) => x !== s.name) : [...arr, s.name])}>
                    <Icon name={open ? 'chevron' : 'chevronright'} size={12} />
                    <Icon name="database" size={12} />
                    <span>{s.name}</span>
                    <em>{s.tables.length}</em>
                  </button>
                  {open && s.tables.map((t) => (
                    <button key={t} className="tree-table" onClick={() => { setSql((v) => `${v}\n-- ${s.name}.${t}`); notify(`已插入 ${s.name}.${t} 注释`, 'info'); }}>
                      <Icon name="table" size={11} /><span>{t}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="sql-side-foot"><span className="live-dot" /> 元数据已同步 14:21</div>
        </aside>

        <section className="sql-main">
          <div className="sql-toolbar">
            <div className="sql-toolbar-left">
              <span className="sql-conn"><i /> {context} · 只读连接</span>
              <span className="sql-schema">dwd</span>
            </div>
            <div className="sql-toolbar-actions">
              <button onClick={() => { setSql(sql.replace(/\s+/g, ' ').replace(/ ,/g, ',')); notify('SQL 已格式化', 'info'); }}><Icon name="sparkles" size={12} /> 格式化</button>
              <button onClick={() => { navigator.clipboard?.writeText(sql); notify('SQL 已复制'); }}><Icon name="copy" size={12} /> 复制</button>
              <button onClick={() => { setSql(''); setResult(null); }}><Icon name="trash" size={12} /> 清空</button>
              <button onClick={() => notify('快捷键：⌘/Ctrl + Enter 执行查询', 'info')}><Icon name="help" size={12} /> 快捷键</button>
            </div>
          </div>
          <div className="sql-editor" style={{ height }}>
            <div className="sql-gutter">{lines.map((n) => <span key={n}>{n}</span>)}</div>
            <textarea ref={areaRef} className="sql-textarea" value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false} wrap="off" />
          </div>
          <div className="sql-runbar">
            <div className="sql-run-info"><Icon name="shield" size={12} /><span>查询前已应用数据权限：全院 · 脱敏字段 4 个</span></div>
            <div className="sql-run-actions">
              <Btn size="sm" variant="secondary" icon="book" onClick={() => notify('已打开 SQL 函数手册', 'info')}>函数手册</Btn>
              <Btn size="sm" variant="secondary" icon="save" onClick={() => { setSaved([{ name: `查询 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`, sql, time: '刚刚' }, ...saved]); notify('查询已保存到“我的查询”'); }}>保存</Btn>
              <Btn size="sm" variant="secondary" icon="expand" onClick={() => setFull((f) => !f)}>{full ? '退出全屏' : '全屏'}</Btn>
              <Btn size="sm" variant="primary" icon={running ? undefined : 'play'} loading={running} onClick={run}>{running ? '执行中' : '运行'}</Btn>
            </div>
          </div>

          <Tabs className="sql-tabs" variant="line" value={tab} onChange={setTab} items={[
            { key: 'result', label: '查询结果' }, { key: 'history', label: '执行记录' }, { key: 'saved', label: '保存的查询', count: saved.length }, { key: 'export', label: '导出记录' },
          ]} />
          <div className="sql-result">
            {tab === 'result' && (
              <>
                {!result && !running && <Empty icon="code" title="暂无结果" desc="点击右上角「运行」或使用 ⌘/Ctrl + Enter 执行查询，结果将展示在此处。" />}
                {running && <div className="sql-loading"><span className="spinner dark" /><div><strong>正在执行查询…</strong><small>正在扫描 dwd.fact_visit 分区 2026-07</small></div></div>}
                {result && (
                  <div className="sql-result-inner">
                    <div className="sql-result-meta">
                      <span className="ok"><Icon name="checkcircle" size={13} /> 查询成功</span>
                      <span>耗时 {(result.ms / 1000).toFixed(2)}s</span>
                      <span>返回 {result.total.toLocaleString()} 行</span>
                      <span>仅展示前 100 行</span>
                      <div className="sql-result-actions">
                        <Btn size="sm" variant="ghost" icon="download" onClick={() => notify('导出任务已创建，完成后将在消息中心通知')}>导出</Btn>
                        <Btn size="sm" variant="ghost" icon="chart" onClick={() => notify('已生成可视化图表', 'info')}>可视化</Btn>
                      </div>
                    </div>
                    <div className="table-wrap sql-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>#</th>{result.columns.map((c) => <th key={c.key}>{c.label}<small className="col-type">{c.type}</small></th>)}</tr></thead>
                        <tbody>{result.rows.map((r, i) => <tr key={i}>{[i + 1, ...r].map((c, j) => <td key={j} className={j === 1 ? 'mono-cell' : ''}>{c}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
            {tab === 'history' && (
              <div className="sql-history">
                {[
                  { time: '14:21:08', sql: sql.slice(0, 90), ms: 1240, status: '成功' },
                  { time: '14:05:32', sql: 'SELECT dept_name, COUNT(*) FROM dwd.fact_visit WHERE ...', ms: 860, status: '成功' },
                  { time: '11:42:16', sql: 'SELECT * FROM hm.hm_fs_surgeries_data LIMIT 100', ms: 2180, status: '成功' },
                  { time: '09:18:44', sql: 'UPDATE ods_his.patients SET ...', ms: 0, status: '拒绝' },
                ].map((h, i) => (
                  <div className="sql-history-row" key={i}>
                    <span className="mono-cell">{h.time}</span>
                    <span className="sql-history-sql">{h.sql}</span>
                    <span className={h.status === '成功' ? 'text-green' : 'text-red'}>{h.status}</span>
                    <span className="muted xs">{h.ms ? `${(h.ms / 1000).toFixed(2)}s` : '—'}</span>
                    <button className="link-btn" onClick={() => { setSql(h.sql); setTab('result'); }}>载入</button>
                  </div>
                ))}
              </div>
            )}
            {tab === 'saved' && (
              <div className="sql-history">
                {saved.map((s, i) => (
                  <div className="sql-history-row" key={i}>
                    <span className="saved-ico"><Icon name="book" size={13} /></span>
                    <span className="sql-history-sql"><strong>{s.name}</strong><small className="mono-cell">{s.sql}</small></span>
                    <span className="muted xs">{s.time}</span>
                    <button className="link-btn" onClick={() => { setSql(s.sql); setTab('result'); notify('已载入保存的查询', 'info'); }}>载入</button>
                  </div>
                ))}
              </div>
            )}
            {tab === 'export' && <Empty icon="download" title="暂无导出记录" desc="查询结果的导出任务将在此展示，支持 CSV / Excel 格式。" />}
          </div>
        </section>
      </div>
    </div>
  );
}
