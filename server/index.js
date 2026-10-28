import http from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { config } from './config.js';
import { createDatabase } from './db/index.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { createApi } from './http/app.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: config.root, hostname: config.host, port: config.port });
const handle = app.getRequestHandler();

console.log('[boot] preparing next...');
await app.prepare();

console.log('[boot] connecting database...');
const db = await createDatabase(config);
console.log('[boot] migrating...');
await migrate(db);
console.log('[boot] seeding...');
await seed(db);
console.log('[boot] creating api...');
const api = createApi({ db, config });
console.log('[boot] starting http...');

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/')) return api(req, res);
  const parsedUrl = parse(req.url, true);
  return handle(req, res, parsedUrl);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') console.error(`端口 ${config.port} 已被占用，请设置 PORT=其他端口`);
  else console.error(error);
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.log(`[api] DB_DRIVER=${config.driver}  http://${config.host}:${config.port}`);
  console.log(`[web] Next.js ${dev ? 'dev' : 'prod'} · 两江新区数智健康管理服务平台：http://${config.host}:${config.port}`);
});

const shutdown = async () => {
  server.close();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
