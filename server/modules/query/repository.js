export const queryRepository = (db) => ({
  saved: async (folder) => (await db.query(`select id, folder, name, sql_text, description, tags, updated_at from saved_queries ${folder ? 'where folder like $1' : ''} order by folder, name`, folder ? [`${folder}%`] : [])).rows,
  save: async ({ id, folder, name, sql, description = '' }) => {
    if (!folder?.trim() || !name?.trim() || !sql?.trim()) throw Object.assign(new Error('目录、名称和 SQL 不能为空'), { status: 400 });
    const qid = id || `SQ-${Date.now().toString(36).toUpperCase()}`;
    const exists = (await db.query('select id from saved_queries where id=$1', [qid])).rows[0];
    if (exists) await db.query('update saved_queries set folder=$2,name=$3,sql_text=$4,description=$5,updated_at=now() where id=$1', [qid, folder, name, sql, description]);
    else await db.query('insert into saved_queries(id,folder,name,sql_text,description) values($1,$2,$3,$4,$5)', [qid, folder, name, sql, description]);
    return { id: qid };
  },
  remove: async (id) => { await db.query('delete from saved_queries where id=$1', [id]); },
  history: async (limit = 30) => (await db.query("select id, sql_text, status, duration_ms, row_count, created_at from audit_logs where action='query' order by id desc limit $1", [Math.min(Number(limit) || 30, 100)])).rows,
});
