import { qualityRepository } from './repository.js';
export const qualityModule = {
  name: 'quality', mount: '/api/quality',
  register(router, { db }) {
    const repo = qualityRepository(db);
    router.get('/api/quality/summary', async () => repo.summary());
    router.get('/api/quality/rules', async ({ query }) => ({ items: await repo.rules(query.dimension) }));
  },
};
