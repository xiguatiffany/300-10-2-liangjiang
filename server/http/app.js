import { Router } from './router.js';
import { modules } from '../modules/index.js';

export function normalize(value) {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  return value;
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error('请求体过大'), { status: 413 });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('请求体不是合法 JSON'), { status: 400 }); }
}

export function createApi({ db, config }) {
  const router = new Router();
  const ctx = { db, config };

  router.get('/api/health', async () => {
    const health = await db.health();
    const tables = await db.query("select count(*)::int as n from information_schema.tables where table_schema='public'");
    return { ...health, publicTables: tables.rows[0]?.n || 0 };
  });

  router.get('/api/meta', async () => {
    const [institutions, tables, assets, indicators, rules, residents, channels, audits] = await Promise.all([
      db.query('select count(*)::int as n from institutions'),
      db.query('select count(*)::int as n from catalog_tables'),
      db.query('select count(*)::int as n from assets'),
      db.query('select count(*)::int as n from indicators'),
      db.query('select count(*)::int as n from quality_rules'),
      db.query('select count(*)::int as n from residents'),
      db.query('select count(*)::int as n from channels'),
      db.query('select count(*)::int as n from audit_logs'),
    ]);
    return {
      counts: { institutions: institutions.rows[0].n, tables: tables.rows[0].n, assets: assets.rows[0].n, indicators: indicators.rows[0].n, rules: rules.rows[0].n, residents: residents.rows[0].n, channels: channels.rows[0].n, audits: audits.rows[0].n },
      modules: modules.map((m) => ({ name: m.name, mount: m.mount })),
    };
  });

  router.get('/api/config', async () => ({
    driver: db.kind, dialect: db.dialect,
    availableDrivers: ['pglite', 'postgres'],
    switchHint: '通过 DB_DRIVER 与 DATABASE_URL 切换；业务模块与 SQL 仓储无需修改。',
    modules: modules.map((m) => ({ name: m.name, mount: m.mount, decoupled: true })),
  }));

  for (const mod of modules) mod.register(router, ctx);

  return async function handleApi(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (req.method === 'POST') req.body = await readBody(req);
      const result = await router.handle(req, res, ctx);
      if (result === false) { res.statusCode = 404; res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: '接口不存在' } })); return; }
      if (result === undefined) return;
      res.statusCode = 200;
      res.end(JSON.stringify(normalize({ data: result })));
    } catch (error) {
      const status = error.status || 400;
      res.statusCode = status;
      res.end(JSON.stringify({ error: { code: error.code || 'API_ERROR', message: error.message || '请求失败' } }));
    }
  };
}
