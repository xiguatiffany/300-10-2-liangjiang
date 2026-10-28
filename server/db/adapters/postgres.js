import pg from 'pg';

/** PostgreSQL adapter. Same contract as PGliteAdapter; business modules never import pg. */
export class PostgresAdapter {
  kind = 'postgres';
  dialect = 'postgres';
  constructor(options) { this.options = options; this.pool = null; }

  async connect() {
    this.pool = new pg.Pool({ connectionString: this.options.connectionString, max: this.options.max || 5 });
    await this.pool.query('select 1');
  }

  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows || [], fields: result.fields || [], affectedRows: result.rowCount || 0 };
  }

  async exec(sql) { await this.pool.query(sql); }

  async transaction(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tx = { query: async (sql, params = []) => { const r = await client.query(sql, params); return { rows: r.rows, fields: r.fields, affectedRows: r.rowCount || 0 }; }, exec: (sql) => client.query(sql) };
      const out = await fn(tx);
      await client.query('COMMIT');
      return out;
    } catch (e) { await client.query('ROLLBACK').catch(() => undefined); throw e; }
    finally { client.release(); }
  }

  async health() {
    const start = performance.now();
    const result = await this.query('select version() as version, current_database() as database');
    return { ok: true, driver: this.kind, dialect: this.dialect, latencyMs: Math.round((performance.now() - start) * 10) / 10, version: result.rows[0]?.version?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL', database: result.rows[0]?.database || 'postgres', storage: '外部 PostgreSQL' };
  }

  async close() { await this.pool?.end(); }
}
