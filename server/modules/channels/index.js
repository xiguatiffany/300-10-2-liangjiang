import { channelsRepository } from './repository.js';
export const channelsModule = {
  name: 'channels', mount: '/api/channels',
  register(router, { db }) {
    const repo = channelsRepository(db);
    router.get('/api/channels', async () => ({ items: await repo.list() }));
  },
};
