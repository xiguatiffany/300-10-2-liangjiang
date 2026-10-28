export const assetsRepository = (db) => ({
  list: async ({ security, q } = {}) => {
    const where = []; const params = [];
    if (security) { params.push(security); where.push(`security = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(name ilike $${params.length} or id ilike $${params.length})`); }
    return (await db.query(`select * from assets ${where.length ? 'where ' + where.join(' and ') : ''} order by id`, params)).rows;
  },
});
