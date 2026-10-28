import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function migrate(db) {
  await db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const dir = path.join(here, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied = new Set((await db.query('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await db.exec(sql);
    await db.query('INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
    console.log(`[db] migration applied: ${file}`);
  }
}
