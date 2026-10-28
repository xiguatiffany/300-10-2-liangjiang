import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve(process.env.PGLITE_DIR || '.data/pglite');
if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
console.log(`已删除 ${dir}；下次启动会重新迁移并灌入演示数据。`);
