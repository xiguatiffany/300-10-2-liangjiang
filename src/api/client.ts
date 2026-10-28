export type DbHealth = { ok: boolean; driver: string; dialect: string; latencyMs: number; version: string; database: string; storage: string; publicTables: number };
export type DbMeta = { counts: Record<string, number>; modules: { name: string; mount: string }[] };
export type QueryResult = { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; durationMs: number; limit: number };
export type IngestResult = { jobId: string; status: string; totalRows: number; results: { alias: string; source: string; target: string; rows: number; durationMs: number }[] };
export type WarehouseTable = { name: string; rows: number };
export type SavedQuery = { id: string; folder: string; name: string; sql_text: string; description: string; tags: string[]; updated_at: string };
export type QueryHistory = { id: number; sql_text: string; status: string; duration_ms: number; row_count: number; created_at: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store', ...init });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.error) throw new Error(payload?.error?.message || `请求失败（HTTP ${response.status}）`);
  return payload.data as T;
}

export const api = {
  health: () => request<DbHealth>('/api/health'),
  meta: () => request<DbMeta>('/api/meta'),
  config: () => request<{ driver: string; dialect: string; availableDrivers: string[]; switchHint: string; modules: { name: string; mount: string; decoupled: boolean }[] }>('/api/config'),
  schemas: () => request<{ items: { schema_name: string; table_count: number; row_count: number }[] }>('/api/catalog/schemas'),
  tables: () => request<{ items: Record<string, any>[] }>('/api/catalog/tables'),
  columns: (id: string) => request<{ items: { name: string; cn_name: string; data_type: string; is_pk: boolean }[] }>(`/api/catalog/tables/${encodeURIComponent(id)}/columns`),
  audit: () => request<{ items: Record<string, unknown>[] }>('/api/query/audit'),
  query: (sql: string) => request<QueryResult>('/api/query', { method: 'POST', body: JSON.stringify({ sql }) }),
  ingest: (payload: { name: string; sources: { alias: string; table: string }[]; targetPrefix: string }) => request<IngestResult>('/api/warehouse/ingest', { method: 'POST', body: JSON.stringify(payload) }),
  warehouseTables: () => request<{ items: WarehouseTable[] }>('/api/warehouse/tables'),
  warehousePreview: (table: string, limit = 20) => request<{ table: string; columns: string[]; rows: Record<string, unknown>[] }>(`/api/warehouse/tables/${encodeURIComponent(table)}/preview?limit=${limit}`),
  warehouseColumns: (table: string) => request<{ items: { name: string; type: string }[] }>(`/api/warehouse/tables/${encodeURIComponent(table)}/columns`),
  savedQueries: () => request<{ items: SavedQuery[] }>('/api/query/saved'),
  saveQuery: (payload: { id?: string; folder: string; name: string; sql: string; description?: string }) => request<{ id: string }>('/api/query/saved', { method: 'POST', body: JSON.stringify(payload) }),
  deleteQuery: (id: string) => request<{ ok: boolean }>(`/api/query/saved/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  history: (limit = 30) => request<{ items: QueryHistory[] }>(`/api/query/history?limit=${limit}`),
  explain: (sql: string) => request<{ plan: string }>('/api/query/explain', { method: 'POST', body: JSON.stringify({ sql }) }),
};
