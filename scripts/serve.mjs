import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 5188);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' };
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('dist/index.html 不存在，请先运行：npm run build');
  process.exit(1);
}
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`端口 ${port} 已被占用，请先停止旧服务或设置 PORT=其他端口`);
  else console.error(err);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`两江新区数智健康管理服务平台已启动：http://127.0.0.1:${port}`);
  console.log('按 Ctrl+C 停止服务');
});
