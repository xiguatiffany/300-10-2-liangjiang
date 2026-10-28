import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, KeyValue, PageHeader, StatCard } from '../../components/ui';
import { api, DbHealth, DbMeta, QueryResult } from '../../api/client';
import { useApp } from '../../app-context';

const examples = [
  { label: '患者样例', sql: 'select patient_id, patient_name, gender, age, dept_name\nfrom ods_his.patient\nlimit 10' },
  { label: '五维质量', sql: "select dimension, round(avg(score),1) as score,\n       round(avg(pass_rate),1) as pass_rate\nfrom quality_results\ngroup by dimension\norder by dimension" },
  { label: '资产分布', sql: 'select domain, security, count(*) as total\nfrom assets\ngroup by domain, security\norder by total desc' },
  { label: '表数量', sql: 'select schema_name, count(*) as tables, sum(row_count) as rows\nfrom catalog_tables\ngroup by schema_name\norder by tables desc' },
];

const moduleLabels: Record<string, { label: string; repo: string }> = {
  institutions: { label: '机构管理', repo: 'institutionsRepository' },
  catalog: { label: '数据目录 / 元数据', repo: 'catalogRepository' },
  assets: { label: '数据资产', repo: 'assetsRepository' },
  quality: { label: '质量规则 / 结果', repo: 'qualityRepository' },
  indicators: { label: '指标市场', repo: 'indicatorsRepository' },
  residents: { label: '居民主索引', repo: 'residentsRepository' },
  channels: { label: '实时通道', repo: 'channelsRepository' },
  query: { label: '只读查询 / 审计', repo: 'queryService' },
};

export function DatabasePage() {
  const { notify } = useApp();
  const [health, setHealth] = useState<DbHealth | null>(null);
  const [meta, setMeta] = useState<DbMeta | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [tables, setTables] = useState<Record<string, any>[]>([]);
  const [audit, setAudit] = useState<Record<string, any>[]>([]);
  const [sql, setSql] = useState(examples[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [h, m, c, t, a] = await Promise.all([api.health(), api.meta(), api.config(), api.tables(), api.audit()]);
      setHealth(h); setMeta(m); setConfig(c); setTables(t.items); setAudit(a.items); setError('');
    } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await api.query(sql)); await load(); }
    catch (e: any) { setError(e.message); setResult(null); }
    finally { setLoading(false); }
  };

  const columns = useMemo(() => (result?.columns || []).map((c) => ({
    key: c, title: c, render: (row: Record<string, unknown>) => {
      const v = row[c];
      if (v == null) return <span className="muted">—</span>;
      if (typeof v === 'object') return <span className="mono-cell">{JSON.stringify(v)}</span>;
      return String(v);
    },
  })), [result]);

  const counts = meta?.counts || {};
  return (
    <>
      <PageHeader eyebrow="DATABASE ADAPTER LAYER" title="数据库连接层" desc="PGlite 默认运行，PostgreSQL 作为同协议生产适配器；业务模块只依赖统一 DatabaseAdapter 与 Repository 接口，切换驱动不改页面和业务 SQL。" actions={<><Btn icon="refresh" onClick={load}>刷新状态</Btn><Btn variant="primary" icon="code" onClick={() => notify('已打开 SQL 只读查询')}>只读查询</Btn></>} />
      {error && <div className="db-error"><Icon name="circlealert" size={14} /><div><strong>数据库接口未连接</strong><span>{error}。请确认已运行 <code>npm start</code>，且 5188 端口由 Node API 服务提供。</span></div></div>}

      <div className="db-hero">
        <div className="db-hero-left">
          <span className={`db-live ${health ? 'ok' : ''}`}><i /> {health ? '数据库已连接' : '等待连接'}</span>
          <h2>PGlite <span>/ PostgreSQL</span></h2>
          <p>单进程嵌入式 PostgreSQL，兼容标准 SQL；生产可切到 PostgreSQL / 达梦 / 金仓，仅替换 Adapter。</p>
          <div className="db-hero-stats">
            <div><span>驱动</span><strong>{health?.driver || '—'}</strong></div>
            <div><span>数据库</span><strong>{health?.database || '—'}</strong></div>
            <div><span>延迟</span><strong>{health ? `${health.latencyMs} ms` : '—'}</strong></div>
            <div><span>公共表</span><strong>{health?.publicTables ?? '—'}</strong></div>
          </div>
        </div>
        <div className="db-hero-right">
          <div className="db-console-card">
            <div className="db-console-head"><span><i /> database://pglite</span><em>{health?.version || 'PostgreSQL 18'}</em></div>
            <code>SELECT * FROM ods_his.patient LIMIT 3;</code>
            <div className="db-console-rows"><span>patient_id</span><span>patient_name</span><span>dept_name</span><em>100248601</em><em>张*华</em><em>心血管内科</em></div>
            <div className="db-console-foot"><span><Icon name="shield" size={11} /> 只读账号</span><span>{health?.storage?.split('/').slice(-2).join('/') || '.data/pglite'}</span></div>
          </div>
        </div>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="数据表" value={(counts.tables || 0).toString()} unit="张" delta="演示子集 · 全量 12,846" icon="table" tone="blue" />
        <StatCard label="数据资产" value={(counts.assets || 0).toString()} unit="项" delta="演示子集 · 全量 286" icon="layers" tone="violet" />
        <StatCard label="质量规则" value={(counts.rules || 0).toString()} unit="条" delta="演示子集 · 全量 486" icon="shield" tone="cyan" />
        <StatCard label="指标 / 居民" value={`${counts.indicators || 0} / ${counts.residents || 0}`} unit="" delta="演示子集" icon="gauge" tone="green" />
      </div>
      <div className="info-note mt-10"><Icon name="database" size={13} /><span>当前 PGlite 为演示子集（12 张元数据表、10 项资产、13 条规则）；接入真实库后，页面统计与查询结果自动替换，不需要改页面代码。</span></div>

      <div className="db-grid mt-14">
        <Card title="适配器注册表" subtitle="通过 DB_DRIVER 选择，不改业务代码">
          <div className="driver-list">
            <div className="driver-card is-active"><span className="driver-ico pglite">P</span><div><strong>PGlite <Badge tone="green" dot>当前</Badge></strong><small>嵌入式 PostgreSQL · 零外部依赖 · 本地持久化</small></div><em>{health?.latencyMs ?? '—'}ms</em></div>
            <div className="driver-card"><span className="driver-ico pg">PG</span><div><strong>PostgreSQL <Badge tone="blue">已接入</Badge></strong><small>连接串 DATABASE_URL · 连接池 · 生产可用</small></div><em>standby</em></div>
            <div className="driver-card is-muted"><span className="driver-ico dm">DM</span><div><strong>达梦 / 金仓 <Badge tone="slate">待适配</Badge></strong><small>新增 Adapter 即可，Repository / Service 不改</small></div><em>extension</em></div>
          </div>
        </Card>
        <Card title="分层与切换边界" subtitle="业务不依赖具体数据库">
          <div className="db-flow">
            <span>React 页面</span><i>→</i><span>API 模块</span><i>→</i><span>Service</span><i>→</i><span>Repository</span><i>→</i><span className="adapter">Adapter</span><i>→</i><span className="db">DB</span>
          </div>
          <div className="code-sample db-code">{`# 默认：PGlite\nDB_DRIVER=pglite\nPGLITE_DIR=.data/pglite\n\n# 切换：PostgreSQL\nDB_DRIVER=postgres\nDATABASE_URL=postgres://user:pass@host:5432/health`}</div>
          <div className="info-note"><Icon name="shield" size={12} /><span>API 只暴露只读 SELECT / WITH；查询自动限 200 行并写审计日志。</span></div>
        </Card>
      </div>

      <Card className="mt-14" title="模块注册表" subtitle="每个模块独立注册路由与 Repository，可单独启停/替换" noPad>
        <div className="db-module-table">
          <table className="data-table">
            <thead><tr><th>模块</th><th>挂载路由</th><th>Repository</th><th>数据量</th><th>状态</th></tr></thead>
            <tbody>
              {(meta?.modules || []).map((m) => (
                <tr key={m.name}><td><strong>{moduleLabels[m.name]?.label || m.name}</strong></td><td className="mono-cell">{m.mount}</td><td className="mono-cell">{moduleLabels[m.name]?.repo || '—'}</td><td>{m.name === 'catalog' ? counts.tables : m.name === 'quality' ? counts.rules : (counts[m.name] ?? '—')}</td><td><Badge tone="green" dot>已注册</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="db-query-grid mt-14">
        <Card title="真实只读查询" subtitle="直接查询 PGlite 中的物理表" actions={<div className="row-actions"><Badge tone="blue">SELECT only</Badge><Btn size="sm" variant="primary" icon="play" loading={loading} onClick={run}>运行</Btn></div>}>
          <div className="query-examples">{examples.map((e) => <button key={e.label} onClick={() => setSql(e.sql)}>{e.label}</button>)}</div>
          <textarea className="db-sql" value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false} />
          {error && <div className="db-query-error"><Icon name="circlealert" size={13} /> {error}</div>}
          {result ? (
            <>
              <div className="db-result-meta"><span>返回 {result.rowCount} 行 · {result.durationMs}ms</span><span>最多 {result.limit} 行</span></div>
              <div className="table-wrap db-result-table"><DataTable rows={result.rows} columns={columns as any} pageSize={8} paginate={false} /></div>
            </>
          ) : <div className="db-empty"><Icon name="database" size={20} /><span>运行示例 SQL，结果来自 PGlite 真实表。</span></div>}
        </Card>
        <Card title="查询审计" subtitle="最近 20 次操作" actions={<button className="link-btn" onClick={load}>刷新</button>}>
          <div className="audit-list db-audit">
            {(audit.length ? audit : []).slice(0, 8).map((a) => (
              <div key={a.id}><span className={`audit-status ${a.status === 'success' ? 'ok' : 'bad'}`} /><div><strong>{a.action === 'query' ? '只读查询' : a.action}</strong><small>{String(a.sql_text || a.resource || '').slice(0, 52)}</small></div><em>{a.duration_ms}ms</em></div>
            ))}
            {!audit.length && <div className="db-empty"><span>暂无审计记录</span></div>}
          </div>
        </Card>
      </div>

      <div className="db-grid-2 mt-14">
        <Card title="真实元数据表" subtitle="catalog_tables / catalog_columns" noPad>
          <div className="pad-h"><DataTable rows={tables.slice(0, 6)} pageSize={6} paginate={false} columns={[
            { key: 'id', title: '表', render: (t) => <div className="cell-main"><strong>{t.cn_name}</strong><small>{t.id}</small></div> },
            { key: 'layer', title: '层', width: 54, render: (t) => <Badge tone="slate">{t.layer}</Badge> },
            { key: 'row_count', title: '行数', width: 100, align: 'right', render: (t) => Number(t.row_count).toLocaleString() },
            { key: 'quality_score', title: '质量', width: 60, render: (t) => <span className="text-green">{t.quality_score}</span> },
          ]} /></div>
        </Card>
        <Card title="连接参数" subtitle="当前进程">
          <KeyValue cols={1} items={[
            { label: 'DB_DRIVER', value: <code>{health?.driver || 'pglite'}</code> },
            { label: 'dialect', value: health?.dialect || 'postgres' },
            { label: '数据目录', value: <span className="mono-cell small">{health?.storage || '.data/pglite'}</span> },
            { label: '可用驱动', value: (config?.availableDrivers || ['pglite', 'postgres']).join(' / ') },
            { label: '切换方式', value: '环境变量 + 重启，无需改页面/仓储' },
          ]} />
        </Card>
      </div>
    </>
  );
}
