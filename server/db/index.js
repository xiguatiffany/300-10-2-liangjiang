const registry = new Map([
  ['pglite', { load: async () => (await import('./adapters/pglite.js')).PGliteAdapter, options: (c) => c.pglite }],
  ['postgres', { load: async () => (await import('./adapters/postgres.js')).PostgresAdapter, options: (c) => c.postgres }],
]);

export function listDrivers() { return [...registry.keys()]; }

export async function createDatabase(config) {
  const entry = registry.get(config.driver);
  if (!entry) throw new Error(`未注册的数据库驱动：${config.driver}（可用：${listDrivers().join(', ')}）`);
  const Adapter = await entry.load();
  const db = new Adapter(entry.options(config));
  await db.connect();
  return db;
}
