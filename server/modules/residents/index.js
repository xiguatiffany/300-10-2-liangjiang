import { residentsRepository } from './repository.js';
export const residentsModule = {
  name: 'residents', mount: '/api/residents',
  register(router, { db }) {
    const repo = residentsRepository(db);
    router.get('/api/residents', async ({ query }) => ({ items: await repo.list(query.q) }));
    router.get('/api/residents/:id', async ({ params }) => {
      const result = await repo.detail(params.id);
      if (!result) throw Object.assign(new Error('居民主档案不存在'), { status: 404 });
      return result;
    });
  },
};
