CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institutions (
  id text PRIMARY KEY,
  name text NOT NULL,
  level text NOT NULL,
  status text NOT NULL DEFAULT '已授权',
  table_count integer NOT NULL DEFAULT 0,
  quality_score numeric(5,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_tables (
  id text PRIMARY KEY,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  cn_name text NOT NULL,
  layer text NOT NULL,
  row_count bigint NOT NULL DEFAULT 0,
  size text NOT NULL,
  owner text NOT NULL,
  quality_score numeric(5,1) NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_columns (
  id text PRIMARY KEY,
  table_id text NOT NULL REFERENCES catalog_tables(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  name text NOT NULL,
  cn_name text NOT NULL,
  data_type text NOT NULL,
  is_pk boolean NOT NULL DEFAULT false,
  is_nullable boolean NOT NULL DEFAULT true,
  standard_code text,
  description text
);

CREATE TABLE IF NOT EXISTS assets (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  domain text NOT NULL,
  security text NOT NULL,
  open_level text NOT NULL,
  masking text NOT NULL,
  api_status text NOT NULL,
  owner text NOT NULL,
  subscribers integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indicators (
  id text PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  value text,
  unit text,
  owner text NOT NULL,
  status text NOT NULL DEFAULT '已发布',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_rules (
  id text PRIMARY KEY,
  dimension text NOT NULL,
  name text NOT NULL,
  object_name text NOT NULL,
  expression text NOT NULL,
  weight integer NOT NULL DEFAULT 0,
  score numeric(5,1) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '启用'
);

CREATE TABLE IF NOT EXISTS quality_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id text NOT NULL REFERENCES institutions(id),
  period text NOT NULL,
  dimension text NOT NULL,
  score numeric(5,1) NOT NULL,
  pass_rate numeric(5,1) NOT NULL
);

CREATE TABLE IF NOT EXISTS residents (
  id text PRIMARY KEY,
  name text NOT NULL,
  gender text NOT NULL,
  age integer NOT NULL,
  id_card text NOT NULL,
  phone text NOT NULL,
  org text NOT NULL,
  dept text NOT NULL,
  last_visit date,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT '主档案有效'
);

CREATE TABLE IF NOT EXISTS resident_visits (
  id text PRIMARY KEY,
  resident_id text NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  org text NOT NULL,
  dept text NOT NULL,
  visit_type text NOT NULL,
  diagnosis text NOT NULL,
  doctor text NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
  id text PRIMARY KEY,
  name text NOT NULL,
  source_name text NOT NULL,
  target_table text NOT NULL,
  channel_type text NOT NULL,
  status text NOT NULL,
  delay text NOT NULL,
  qps integer NOT NULL DEFAULT 0,
  today_rows bigint NOT NULL DEFAULT 0,
  lag integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor text NOT NULL DEFAULT '演示用户',
  action text NOT NULL,
  resource text,
  sql_text text,
  status text NOT NULL,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_schema ON catalog_tables(schema_name);
CREATE INDEX IF NOT EXISTS idx_columns_table ON catalog_columns(table_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
