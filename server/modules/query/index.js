import { queryRepository } from './repository.js';

const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|vacuum|attach|detach|pragma|call|merge)\b/i;

function assertReadOnly(sql) {
  const text = sql.trim().replace(/;+\s*$/, '');
  if (!/^(select|with)\b/i.test(text)) throw Object.assign(new Error('仅允许 SELECT / WITH 只读查询'), { status: 400 });
  if (text.includes(';')) throw Object.assign(new Error('不允许一次执行多条 SQL'), { status: 400 });
  if (FORBIDDEN.test(text)) throw Object.assign(new Error('SQL 包含非只读关键字'), { status: 400 });
  return text;
}

export const queryModule = {
  name: 'query', mount: '/api/query',
  register(router, { db, config }) {
    const repo = queryRepository(db);
    router.get('/api/query/saved', async ({ query }) => ({ items: await repo.saved(query.folder) }));
    router.post('/api/query/saved', async ({ req }) => repo.save(req.body || {}));
    router.delete('/api/query/saved/:id', async ({ params }) => { await repo.remove(params.id); return { ok: true }; });
    router.get('/api/query/history', async ({ query }) => ({ items: await repo.history(query.limit) }));
    router.post('/api/query/explain', async ({ req }) => {
      const sql = String(req.body?.sql || '').trim();
      if (!sql) throw Object.assign(new Error('SQL 不能为空'), { status: 400 });
      const safe = sql.replace(/;+\s*$/, '');
      if (!/^(select|with)\b/i.test(safe)) throw Object.assign(new Error('仅允许 SELECT / WITH'), { status: 400 });
      const result = await db.query(`EXPLAIN (FORMAT TEXT) ${safe}`);
      return { plan: result.rows.map((r) => r['QUERY PLAN']).join('\n') };
    });
    router.post('/api/query', async ({ req }) => {
      const sql = String(req.body?.sql || '').trim();
      if (!sql) throw Object.assign(new Error('SQL 不能为空'), { status: 400 });
      const safe = assertReadOnly(sql);
      const start = performance.now();
      let rows = []; let fields = []; let error = null;
      try {
        const result = await db.query(`select * from (${safe}) as q limit ${config.query.maxRows}`);
        rows = result.rows; fields = result.fields;
      } catch (e) { error = e; }
      const durationMs = Math.round(performance.now() - start);
      await db.query('insert into audit_logs(actor,action,resource,sql_text,status,duration_ms,row_count) values ($1,$2,$3,$4,$5,$6,$7)', ['演示用户', 'query', 'sql-console', safe.slice(0, 2000), error ? 'failed' : 'success', durationMs, rows.length]).catch(() => undefined);
      if (error) throw Object.assign(new Error(error.message), { status: 400 });
      return { columns: fields.map((f) => f.name), rows, rowCount: rows.length, durationMs, limit: config.query.maxRows };
    });
    router.get('/api/query/audit', async () => ({ items: (await db.query('select id, actor, action, resource, sql_text, status, duration_ms, created_at from audit_logs order by id desc limit 20')).rows }));
  },
};
