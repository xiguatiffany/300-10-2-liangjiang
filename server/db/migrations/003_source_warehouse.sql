CREATE SCHEMA IF NOT EXISTS source_emr;
CREATE SCHEMA IF NOT EXISTS source_lis;
CREATE SCHEMA IF NOT EXISTS warehouse;

CREATE TABLE IF NOT EXISTS source_emr.visit (
  visit_id varchar(32) PRIMARY KEY,
  patient_id varchar(32) NOT NULL,
  dept_name varchar(64),
  visit_type varchar(20),
  visit_time timestamptz,
  diagnosis varchar(200)
);

CREATE TABLE IF NOT EXISTS source_lis.lab_report (
  report_id varchar(32) PRIMARY KEY,
  patient_id varchar(32) NOT NULL,
  test_name varchar(80),
  result_value varchar(40),
  unit varchar(20),
  report_time timestamptz
);

INSERT INTO source_emr.visit(visit_id,patient_id,dept_name,visit_type,visit_time,diagnosis) VALUES
('V20260806001','100248601','心血管内科','门诊','2026-08-05 09:24:00+08','高血压 2 级'),
('V20260806002','100248602','消化内科','门诊','2026-08-05 10:12:00+08','慢性胃炎'),
('V20260806003','100248603','骨科','门诊','2026-08-04 15:40:00+08','骨折术后复查'),
('V20260806004','100248604','呼吸内科','门诊','2026-08-04 11:08:00+08','上呼吸道感染'),
('V20260806005','100248605','神经内科','住院','2026-08-03 16:22:00+08','脑梗死恢复期')
ON CONFLICT (visit_id) DO NOTHING;

INSERT INTO source_lis.lab_report(report_id,patient_id,test_name,result_value,unit,report_time) VALUES
('L20260806001','100248601','收缩压','158','mmHg','2026-08-05 09:40:00+08'),
('L20260806002','100248601','舒张压','96','mmHg','2026-08-05 09:40:00+08'),
('L20260806003','100248602','血红蛋白','128','g/L','2026-08-05 10:30:00+08'),
('L20260806004','100248603','白细胞计数','6.8','10^9/L','2026-08-04 16:00:00+08'),
('L20260806005','100248605','糖化血红蛋白','7.2','%','2026-08-03 17:00:00+08')
ON CONFLICT (report_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS warehouse.ingest_jobs (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL,
  target_prefix text NOT NULL,
  source_count integer NOT NULL,
  total_rows bigint NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
