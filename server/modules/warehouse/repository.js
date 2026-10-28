const IDENT = /^[a-z_][a-z0-9_]*$/;
const RELATION = /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/;

export const warehouseRepository = (db) => ({
  run: async ({ name, sources, targetPrefix }) => {
    if (!Array.isArray(sources) || !sources.length) throw Object.assign(new Error('至少需要一个数据源'), { status: 400 });
    if (!IDENT.test(targetPrefix)) throw Object.assign(new Error('目标表前缀不合法'), { status: 400 });
    const jobId = `JOB-${Date.now().toString(36).toUpperCase()}`;
    const results = [];
    await db.transaction(async (tx) => {
      for (const source of sources) {
        if (!RELATION.test(source.table)) throw Object.assign(new Error(`数据源表名不合法：${source.table}`), { status: 400 });
        if (!IDENT.test(source.alias)) throw Object.assign(new Error(`数据源别名不合法：${source.alias}`), { status: 400 });
        const exists = (await tx.query('select to_regclass($1) as reg', [source.table])).rows[0]?.reg;
        if (!exists) throw Object.assign(new Error(`物理表不存在：${source.table}`), { status: 404 });
        const target = `${targetPrefix}_${source.alias}`;
        const started = performance.now();
        await tx.exec(`DROP TABLE IF EXISTS warehouse.${target}`);
        await tx.exec(`CREATE TABLE warehouse.${target} AS SELECT *, now() AS ingested_at FROM ${source.table}`);
        const count = Number((await tx.query(`SELECT count(*)::int AS n FROM warehouse.${target}`)).rows[0].n);
        results.push({ alias: source.alias, source: source.table, target: `warehouse.${target}`, rows: count, durationMs: Math.round(performance.now() - started) });
      }
      const total = results.reduce((sum, r) => sum + r.rows, 0);
      await tx.query('INSERT INTO warehouse.ingest_jobs(id,name,status,target_prefix,source_count,total_rows,results) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)', [jobId, name || '采集方案', 'success', targetPrefix, sources.length, total, JSON.stringify(results)]);
    });
    const totalRows = results.reduce((sum, r) => sum + r.rows, 0);
    return { jobId, status: 'success', totalRows, results };
  },
  tables: async () => (await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='warehouse' AND table_type='BASE TABLE' AND table_name <> 'ingest_jobs' ORDER BY table_name`)).rows,
  counts: async (table) => {
    if (!IDENT.test(table)) throw Object.assign(new Error('表名不合法'), { status: 400 });
    const exists = (await db.query('select to_regclass($1) as reg', [`warehouse.${table}`])).rows[0]?.reg;
    if (!exists) throw Object.assign(new Error('入仓表不存在'), { status: 404 });
    return Number((await db.query(`SELECT count(*)::int AS n FROM warehouse.${table}`)).rows[0].n);
  },
  columns: async (table) => {
    if (!IDENT.test(table)) throw Object.assign(new Error('表名不合法'), { status: 400 });
    return (await db.query(`select column_name as name, data_type as type from information_schema.columns where table_schema='warehouse' and table_name=$1 order by ordinal_position`, [table])).rows;
  },
  preview: async (table, limit = 20) => {
    if (!IDENT.test(table)) throw Object.assign(new Error('表名不合法'), { status: 400 });
    const exists = (await db.query('select to_regclass($1) as reg', [`warehouse.${table}`])).rows[0]?.reg;
    if (!exists) throw Object.assign(new Error('入仓表不存在'), { status: 404 });
    const result = await db.query(`SELECT * FROM warehouse.${table} LIMIT $1`, [Math.min(Number(limit) || 20, 100)]);
    return { table, columns: result.fields.map((f) => f.name), rows: result.rows };
  },
});
