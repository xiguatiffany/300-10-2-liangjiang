import path from 'node:path';

const root = process.cwd();
export const config = {
  root,
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 5188),
  driver: process.env.DB_DRIVER || 'pglite',
  pglite: {
    dataDir: process.env.PGLITE_DIR || '.data/pglite',
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || '',
    max: Number(process.env.PG_POOL_MAX || 5),
  },
  query: { maxRows: Number(process.env.QUERY_MAX_ROWS || 200) },
};
