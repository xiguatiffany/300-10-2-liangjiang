export const institutionsRepository = (db) => ({
  list: async () => (await db.query('select * from institutions order by quality_score desc')).rows,
});
