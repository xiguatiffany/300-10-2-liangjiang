import { indicatorsRepository } from './repository.js';
export const indicatorsModule = {
  name: 'indicators', mount: '/api/indicators',
  register(router, { db }) {
    const repo = indicatorsRepository(db);
    router.get('/api/indicators', async ({ query }) => ({ items: await repo.list(query) }));
  },
};
