export const catalogRepository = (db) => ({
  schemas: async () => (await db.query(`
    select schema_name, count(*)::int as table_count, sum(row_count)::bigint as row_count
    from catalog_tables group by schema_name order by schema_name`)).rows,
  list: async ({ schema, q }) => {
    const where = []; const params = [];
    if (schema) { params.push(schema); where.push(`schema_name = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(table_name ilike $${params.length} or cn_name ilike $${params.length} or id ilike $${params.length})`); }
    const sql = `select * from catalog_tables ${where.length ? 'where ' + where.join(' and ') : ''} order by schema_name, table_name`;
    return (await db.query(sql, params)).rows;
  },
  columns: async (id) => (await db.query('select * from catalog_columns where table_id=$1 order by ordinal', [id])).rows,
  table: async (id) => (await db.query('select * from catalog_tables where id=$1', [id])).rows[0],
  preview: async (id, limit = 20) => {
    const table = (await db.query('select * from catalog_tables where id=$1', [id])).rows[0];
    if (!table) return null;
    const relation = `${table.schema_name}.${table.table_name}`;
    if (!/^[a-z_][a-z0-9_]*$/.test(table.schema_name) || !/^[a-z_][a-z0-9_]*$/.test(table.table_name)) throw new Error('非法表名');
    const exists = (await db.query('select to_regclass($1) as reg', [relation])).rows[0]?.reg;
    if (!exists) return { table, rows: [], physical: false, note: '该表当前只有元数据，尚未接入物理表' };
    const rows = (await db.query(`select * from ${relation} limit $1`, [Math.min(Number(limit) || 20, 100)])).rows;
    return { table, rows, physical: true };
  },
});
