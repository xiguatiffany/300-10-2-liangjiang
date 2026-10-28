ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS row_count integer;

CREATE TABLE IF NOT EXISTS saved_queries (
  id text PRIMARY KEY,
  folder text NOT NULL,
  name text NOT NULL,
  sql_text text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO saved_queries(id,folder,name,sql_text,description,tags) VALUES
('SQ-001','运营分析/门诊','门诊量趋势','select date_trunc(''month'', visit_time)::date as month, count(*) as visits\nfrom source_emr.visit\ngroup by 1\norder by 1;','按月统计门诊就诊量，用于运营趋势分析。','["运营","门诊"]'),
('SQ-002','运营分析/住院','住院床位使用','select dept_name, count(*) as inpatients\nfrom source_emr.visit\nwhere visit_type = ''住院''\ngroup by dept_name\norder by inpatients desc;','按科室统计住院患者，辅助床位资源配置。','["运营","住院"]'),
('SQ-003','医疗质量/完整性','患者主键完整性','select patient_id, patient_name, gender, age\nfrom ods_his.patient\nwhere patient_id is null;','检查患者主键为空的数据。','["质量","完整性"]'),
('SQ-004','医疗质量/五维','五维质量得分','select dimension, round(avg(score),1) as score, round(avg(pass_rate),1) as pass_rate\nfrom quality_results\ngroup by dimension\norder by dimension;','查看五维质量平均得分与通过率。','["质量","评分"]'),
('SQ-005','数据资产/分级','资产安全分级统计','select security, count(*) as total\nfrom assets\ngroup by security\norder by security;','统计 L1—L4 资产分布。','["资产","安全"]'),
('SQ-006','共享查询/主索引','患者主索引样例','select patient_id, patient_name, gender, age, dept_name\nfrom ods_his.patient\nlimit 20;','患者主索引脱敏样例。','["主索引","共享"]')
ON CONFLICT (id) DO NOTHING;
