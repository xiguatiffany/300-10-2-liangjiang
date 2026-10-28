import { institutionsRepository } from './repository.js';
export const institutionsModule = {
  name: 'institutions', mount: '/api/institutions',
  register(router, { db }) {
    const repo = institutionsRepository(db);
    router.get('/api/institutions', async () => ({ items: await repo.list() }));
  },
};
