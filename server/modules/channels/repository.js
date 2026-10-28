export const channelsRepository = (db) => ({
  list: async () => (await db.query('select * from channels order by id')).rows,
});
