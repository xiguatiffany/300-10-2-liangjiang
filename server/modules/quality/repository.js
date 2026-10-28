export const qualityRepository = (db) => ({
  summary: async () => {
    const [overall, dims, orgs, rules] = await Promise.all([
      db.query('select round(avg(score),1) as score, round(avg(pass_rate),1) as pass_rate from quality_results'),
      db.query('select dimension, round(avg(score),1) as score, round(avg(pass_rate),1) as pass_rate from quality_results group by dimension order by dimension'),
      db.query('select i.name, i.quality_score as score, round(avg(q.pass_rate),1) as pass_rate from institutions i join quality_results q on q.institution_id=i.id group by i.id, i.name, i.quality_score order by i.quality_score desc'),
      db.query('select count(*)::int as total, count(*) filter (where status=\'启用\')::int as enabled from quality_rules'),
    ]);
    return { overall: overall.rows[0], dimensions: dims.rows, institutions: orgs.rows, rules: rules.rows[0] };
  },
  rules: async (dimension) => (await db.query(`select * from quality_rules ${dimension ? 'where dimension=$1' : ''} order by id`, dimension ? [dimension] : [])).rows,
});
