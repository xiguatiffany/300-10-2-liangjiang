import { catalogRepository } from './repository.js';
export const catalogModule = {
  name: 'catalog', mount: '/api/catalog',
  register(router, { db }) {
    const repo = catalogRepository(db);
    router.get('/api/catalog/schemas', async () => ({ items: await repo.schemas() }));
    router.get('/api/catalog/tables', async ({ query }) => ({ items: await repo.list({ schema: query.schema, q: query.q }) }));
    router.get('/api/catalog/tables/:id/columns', async ({ params }) => ({ items: await repo.columns(params.id) }));
    router.get('/api/catalog/tables/:id/preview', async ({ params, query }) => {
      const result = await repo.preview(params.id, query.limit);
      if (!result) throw Object.assign(new Error('数据表不存在'), { status: 404 });
      return result;
    });
  },
};
