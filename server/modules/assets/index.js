import { assetsRepository } from './repository.js';
export const assetsModule = {
  name: 'assets', mount: '/api/assets',
  register(router, { db }) {
    const repo = assetsRepository(db);
    router.get('/api/assets', async ({ query }) => ({ items: await repo.list(query) }));
  },
};
