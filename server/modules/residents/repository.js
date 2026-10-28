export const residentsRepository = (db) => ({
  list: async (q) => {
    if (!q) return (await db.query('select * from residents order by id')).rows;
    return (await db.query('select * from residents where name ilike $1 or id ilike $1 or id_card ilike $1 order by id', [`%${q}%`])).rows;
  },
  detail: async (id) => {
    const resident = (await db.query('select * from residents where id=$1', [id])).rows[0];
    if (!resident) return null;
    const visits = (await db.query('select * from resident_visits where resident_id=$1 order by visit_date desc', [id])).rows;
    return { resident, visits };
  },
});
