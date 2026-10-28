import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

/**
 * PGlite adapter. Only this file knows about @electric-sql/pglite.
 * Business modules see the DatabaseAdapter contract only.
 */
export class PGliteAdapter {
  kind = 'pglite';
  dialect = 'postgres';
  constructor(options) { this.options = options; this.client = null; this.queue = Promise.resolve(); }

  async connect() {
    console.log('[pglite] connect start', this.options.dataDir);
    const raw = this.options.dataDir || '.data/pglite';
    const dir = path.resolve(raw);
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    // PGlite 0.5.x on Node/WASM: 绝对路径可能阻塞，传入相对 cwd 的路径更稳。
    const target = path.isAbsolute(raw) ? path.relative(process.cwd(), raw) || '.' : raw;
    console.log('[pglite] constructing', target);
    this.client = new PGlite(target);
    console.log('[pglite] waiting ready');
    await this.client.waitReady;
    console.log('[pglite] ready');
  }

  async _raw(sql, params = []) {
    const result = await this.client.query(sql, params);
    return { rows: result.rows || [], fields: result.fields || [], affectedRows: result.affectedRows || 0 };
  }

  async query(sql, params = []) {
    const next = this.queue.then(() => this._raw(sql, params));
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }

  async exec(sql) {
    const next = this.queue.then(() => this.client.exec(sql));
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }

  async transaction(fn) {
    const next = this.queue.then(async () => {
      await this._raw('BEGIN');
      try {
        const tx = { query: (sql, params = []) => this._raw(sql, params), exec: (sql) => this.client.exec(sql) };
        const result = await fn(tx);
        await this._raw('COMMIT');
        return result;
      } catch (error) {
        await this._raw('ROLLBACK').catch(() => undefined);
        throw error;
      }
    });
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }

  async health() {
    const start = performance.now();
    const result = await this.query('select version() as version, current_database() as database');
    return {
      ok: true, driver: this.kind, dialect: this.dialect,
      latencyMs: Math.round((performance.now() - start) * 10) / 10,
      version: result.rows[0]?.version?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL',
      database: result.rows[0]?.database || 'postgres',
      storage: path.resolve(this.options.dataDir || '.data/pglite'),
    };
  }

  async close() { await this.client?.close(); }
}
