export const indicatorsRepository = (db) => ({
  list: async ({ category, q } = {}) => {
    const where = []; const params = [];
    if (category) { params.push(category); where.push(`category = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(name ilike $${params.length} or code ilike $${params.length})`); }
    return (await db.query(`select * from indicators ${where.length ? 'where ' + where.join(' and ') : ''} order by id`, params)).rows;
  },
});
