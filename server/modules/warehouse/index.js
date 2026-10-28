import { warehouseRepository } from './repository.js';
export const warehouseModule = {
  name: 'warehouse', mount: '/api/warehouse',
  register(router, { db }) {
    const repo = warehouseRepository(db);
    router.post('/api/warehouse/ingest', async ({ req }) => {
      const body = req.body || {};
      return repo.run({ name: body.name, sources: body.sources, targetPrefix: body.targetPrefix || 'ods_health' });
    });
    router.get('/api/warehouse/tables', async () => {
      const items = await repo.tables();
      return { items: await Promise.all(items.map(async (t) => ({ name: t.table_name, rows: await repo.counts(t.table_name) }))) };
    });
    router.get('/api/warehouse/tables/:id/columns', async ({ params }) => ({ items: await repo.columns(params.id) }));
    router.get('/api/warehouse/tables/:id/preview', async ({ params, query }) => repo.preview(params.id, query.limit));
  },
};
