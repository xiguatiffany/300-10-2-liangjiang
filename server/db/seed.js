const institutions = [
  ['org-rm', '两江新区人民医院', '三级甲等', '已授权', 328, 98.2],
  ['org-zy', '两江新区中医院', '三级甲等', '已授权', 186, 96.8],
  ['org-rh', '人和社区卫生服务中心', '基层', '已授权', 64, 95.4],
  ['org-yy', '鸳鸯社区卫生服务中心', '基层', '已授权', 52, 94.2],
  ['org-dz', '大竹林社区卫生服务中心', '基层', '已授权', 48, 92.8],
  ['org-fy', '两江新区妇幼保健院', '三级', '已授权', 96, 97.1],
];

const tables = [
  ['ods_his.patient', 'ods_his', 'patient', '患者基本信息', 'ODS', 3428519, '2.4 GB', '李建华', 98.6, ['核心', '主数据'], '2026-08-06T14:12:00+08:00'],
  ['ods_his.outpatient_visit', 'ods_his', 'outpatient_visit', '门诊就诊记录', 'ODS', 9842116, '6.2 GB', '王思远', 96.8, ['核心', '高频'], '2026-08-06T14:10:00+08:00'],
  ['ods_his.inpatient_visit', 'ods_his', 'inpatient_visit', '住院就诊记录', 'ODS', 1286420, '1.8 GB', '李建华', 97.9, ['核心'], '2026-08-06T14:12:00+08:00'],
  ['ods_emr.cpoe_order', 'ods_emr', 'cpoe_order', '电子病历医嘱', 'ODS', 28426910, '12.8 GB', '陈晓', 95.4, ['大字段'], '2026-08-06T14:08:00+08:00'],
  ['ods_emr.diagnosis', 'ods_emr', 'diagnosis', '出院诊断', 'ODS', 2184690, '3.1 GB', '陈晓', 97.2, ['诊断'], '2026-08-06T14:09:00+08:00'],
  ['ods_lis.lab_report', 'ods_lis', 'lab_report', '检验报告主表', 'ODS', 42860410, '18.4 GB', '赵倩', 99.1, ['核心'], '2026-08-06T14:06:00+08:00'],
  ['ods_lis.lab_result', 'ods_lis', 'lab_result', '检验结果明细', 'ODS', 286420000, '64.2 GB', '赵倩', 98.4, ['大字段'], '2026-08-06T14:07:00+08:00'],
  ['ods_pacs.study_index', 'ods_pacs', 'study_index', '影像检查主表', 'ODS', 4628882, '9.8 GB', '周宁', 96.2, ['影像'], '2026-08-06T14:03:00+08:00'],
  ['ods_pacs.pacs_report', 'ods_pacs', 'pacs_report', '影像报告', 'ODS', 4286410, '6.4 GB', '周宁', 96.2, ['影像'], '2026-08-06T14:03:00+08:00'],
  ['dwd.fact_visit', 'dwd', 'fact_visit', '就诊事实宽表', 'DWD', 11286400, '8.6 GB', '张敏', 99.2, ['核心', '指标底座'], '2026-08-06T13:50:00+08:00'],
  ['dwd.fact_surgery', 'dwd', 'fact_surgery', '手术事实宽表', 'DWD', 1842300, '4.2 GB', '张敏', 98.8, ['核心'], '2026-08-06T13:48:00+08:00'],
  ['dim.dim_department', 'dim', 'dim_department', '科室公共维度', 'DIM', 1286, '12 MB', '张敏', 99.6, ['公共维度'], '2026-08-06T10:20:00+08:00'],
];

const columns = {
  patient: [
    ['patient_id','患者ID','varchar(32)',true,false,'DE-PAT-001','院内患者唯一标识'],
    ['patient_name','患者姓名','varchar(64)',false,false,'DE-PAT-002','患者姓名（脱敏展示）'],
    ['gender','性别代码','char(1)',false,true,'DE-GEN-001','1男/2女/9未知'],
    ['id_card_no','身份证号','varchar(18)',false,true,'DE-PAT-003','18位身份证号 · L3'],
    ['phone_no','联系电话','varchar(20)',false,true,'DE-PAT-005','手机号 · L3 脱敏'],
    ['birth_date','出生日期','date',false,true,'DE-PAT-004','出生日期'],
    ['dept_name','所属科室','varchar(64)',false,true,'DE-DEP-001','标准科室名称'],
    ['create_time','建档时间','timestamptz',false,false,'DE-TIM-001','患者建档时间'],
  ],
  default: [
    ['id','业务主键','varchar(64)',true,false,'DE-GEN-002','业务主键'],
    ['patient_id','患者ID','varchar(32)',false,false,'DE-PAT-001','关联患者'],
    ['org_code','机构编码','varchar(32)',false,true,'DE-ORG-001','医疗机构编码'],
    ['dept_code','科室编码','varchar(32)',false,true,'DE-DEP-002','科室编码'],
    ['event_time','业务时间','timestamptz',false,true,'DE-TIM-002','业务发生时间'],
    ['update_time','更新时间','timestamptz',false,false,'DE-TIM-003','数据更新时间'],
  ],
};

const assets = [
  ['AST-001','患者主索引数据资源','数据表','HIS','L3','有条件开放','身份证/手机号','已发布','信息中心',12],
  ['AST-002','门诊就诊记录资源','数据表','HIS','L3','有条件开放','姓名/身份证','已发布','门诊部',8],
  ['AST-003','住院病案首页资源','数据表','EMR','L3','有条件开放','姓名/身份证/地址','待发布','病案室',6],
  ['AST-004','检验报告资源','数据表','LIS','L2','无条件开放','无','已发布','检验科',16],
  ['AST-005','影像检查索引资源','数据表','PACS','L3','有条件开放','姓名/身份证','已发布','放射科',4],
  ['AST-006','居民健康档案资源','数据表','公卫','L3','有条件开放','姓名/身份证/电话','待发布','公卫科',9],
  ['AST-007','指标服务 API 集','API','指标','L2','有条件开放','无','已发布','指标中台',24],
  ['AST-008','妇幼健康主题库','数据集','妇幼','L2','有条件开放','姓名/身份证','待发布','妇幼保健院',3],
  ['AST-009','医疗服务监管指标集','数据集','监管','L2','无条件开放','无','已发布','医政科',18],
  ['AST-010','电子病历文书资源','文件','EMR','L4','非开放','全文脱敏','未发布','病案室',0],
];

const indicators = [
  ['IND-001','KPI-OP-001','门诊预约爽约人次','运营指标','原子指标','1284','人次','张敏','已发布',['运营','预约']],
  ['IND-002','KPI-OP-002','手术台次','运营指标','原子指标','3862','台','王思远','已发布',['运营','手术']],
  ['IND-003','KPI-MQ-001','手术并发症发生率','医疗质量','派生指标','0.86','%','陈晓','已发布',['质量','国考']],
  ['IND-004','KPI-OP-003','平均住院日','运营指标','派生指标','7.24','天','张敏','已发布',['运营','国考']],
  ['IND-005','KPI-OP-004','门诊人次','运营指标','原子指标','286420','人次','王思远','已发布',['运营','门诊']],
  ['IND-006','KPI-IP-001','住院人次','运营指标','原子指标','18642','人次','王思远','已发布',['运营','住院']],
  ['IND-007','KPI-IP-002','床位使用率','运营指标','派生指标','92.4','%','刘一鸣','已发布',['运营','国考']],
  ['IND-008','KPI-CO-001','药占比','运营指标','派生指标','26.8','%','刘一鸣','已发布',['运营','国考']],
  ['IND-009','KPI-CO-002','卫生材料占比','运营指标','派生指标','18.6','%','刘一鸣','已发布',['运营','DRG']],
  ['IND-010','KPI-MQ-002','影像报告及时率','医疗质量','派生指标','96.4','%','周宁','已发布',['质量','影像']],
  ['IND-011','KPI-MQ-003','病案首页甲级率','医疗质量','派生指标','98.2','%','陈晓','已发布',['质量','病案']],
  ['IND-012','KPI-FY-001','孕产妇系统管理率','妇幼健康','派生指标','94.6','%','妇幼保健院','已发布',['妇幼','公卫']],
];

const rules = [
  ['BR-001','完整性','患者主键非空','ods_his.patient','patient_id IS NOT NULL',10,99.2,'启用'],
  ['BR-002','完整性','就诊必填字段完整','dwd.fact_visit','patient_id, visit_id, dept_code 非空',10,98.6,'启用'],
  ['BR-003','一致性','科室编码可关联','dwd.fact_visit','dept_code IN dim_department',8,99.4,'启用'],
  ['BR-004','一致性','诊断编码符合 ICD-10','ods_emr.diagnosis','diag_code IN icd10_dict',8,97.8,'启用'],
  ['BR-005','规范性','身份证校验位正确','ods_his.patient','校验位 = 计算值',6,99.1,'启用'],
  ['BR-006','规范性','手机号格式合规','ods_his.patient','REGEXP(^1[3-9]\\d{9}$)',4,98.4,'启用'],
  ['BR-007','及时性','检验报告 24h 内入仓','ods_lis.lab_report','etl_time - report_time <= 24h',10,96.2,'预警'],
  ['BR-008','稳定性','表行数波动率 ≤ 20%','dwd.fact_visit','abs(today - avg7) / avg7 <= 0.2',8,97.6,'启用'],
  ['BR-009','完整性','住院记录主键唯一','dwd.fact_visit','COUNT(DISTINCT visit_id) = COUNT(*)',8,99.6,'启用'],
  ['BR-010','一致性','费用明细与结算一致','dwd.fact_charge','SUM(detail_amount) = settle_amount',6,96.8,'启用'],
  ['BR-011','规范性','日期时间格式合规','ods_his.outpatient_visit','visit_time REGEXP YYYY-MM-DD HH:mm:ss',5,99.2,'启用'],
  ['BR-012','及时性','门诊记录 15 分钟内入仓','ods_his.outpatient_visit','etl_time - visit_time <= 15min',9,94.6,'预警'],
  ['BR-013','稳定性','主键重复率 ≤ 0.1%','ods_lis.lab_report','duplicate_rate <= 0.001',6,98.2,'启用'],
];

const residents = [
  ['P100248601','张*华','男',58,'5001**********12','138****6086','两江新区人民医院','心血管内科','2026-08-05',['高血压','慢病管理','重点人群'],'主档案有效'],
  ['P100248602','李*芳','女',51,'5001**********28','139****2042','两江新区中医院','消化内科','2026-08-05',['胃炎','复诊'],'主档案有效'],
  ['P100248603','王*明','男',44,'5001**********76','136****8820','两江新区人民医院','骨科','2026-08-04',['骨折术后'],'待合并'],
];

const visits = [
  ['V-001','P100248601','2026-08-05','两江新区人民医院','心血管内科','门诊','高血压 2 级','李医生'],
  ['V-002','P100248601','2026-06-18','两江新区人民医院','心血管内科','门诊','高血压 2 级','李医生'],
  ['V-003','P100248601','2026-03-12','两江新区中医院','全科','门诊','血压升高','王医生'],
  ['V-004','P100248602','2026-08-05','两江新区中医院','消化内科','门诊','慢性胃炎','赵医生'],
];

const channels = [
  ['CDC-001','his_patient_cdc','HIS 生产库','ods_his.patient','MySQL CDC','运行中','8 秒',126,1286420,0],
  ['CDC-002','emr_order_cdc','EMR 临床库','ods_emr.cpoe_order','SQL Server CDC','运行中','12 秒',86,862410,0],
  ['CDC-003','lis_report_cdc','LIS 生产库','ods_lis.lab_report','Oracle CDC','运行中','5 秒',62,486200,0],
  ['CDC-004','pacs_study_cdc','PACS 归档库','ods_pacs.study_index','MySQL CDC','延迟','3 分钟',18,42680,2186],
  ['CDC-005','hrp_cost_cdc','HRP 运营库','ods_hrp.cost_detail','Oracle CDC','已暂停','—',0,0,0],
];

export async function seed(db) {
  const count = Number((await db.query('SELECT count(*)::int AS n FROM institutions')).rows[0]?.n || 0);
  if (count > 0) return false;
  await db.transaction(async (tx) => {
    for (const r of institutions) await tx.query('INSERT INTO institutions(id,name,level,status,table_count,quality_score) VALUES ($1,$2,$3,$4,$5,$6)', r);
    for (const r of tables) await tx.query('INSERT INTO catalog_tables(id,schema_name,table_name,cn_name,layer,row_count,size,owner,quality_score,tags,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)', [r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],JSON.stringify(r[9]),r[10]]);
    for (const t of tables) {
      const cols = columns[t[2]] || columns.default;
      let i = 1;
      for (const c of cols) await tx.query('INSERT INTO catalog_columns(id,table_id,ordinal,name,cn_name,data_type,is_pk,is_nullable,standard_code,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [`${t[0]}.${c[0]}`, t[0], i++, c[0], c[1], c[2], c[3], c[4], c[5], c[6]]);
    }
    for (const r of assets) await tx.query('INSERT INTO assets(id,name,type,domain,security,open_level,masking,api_status,owner,subscribers) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', r);
    for (const r of indicators) await tx.query('INSERT INTO indicators(id,code,name,category,type,value,unit,owner,status,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)', [...r.slice(0,9), JSON.stringify(r[9])]);
    for (const r of rules) await tx.query('INSERT INTO quality_rules(id,dimension,name,object_name,expression,weight,score,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', r);
    for (const inst of institutions) for (const [dim, score, pass] of [['完整性', inst[5], inst[5] - 0.2], ['一致性', inst[5] - 1.2, inst[5] - 1.5], ['规范性', inst[5] - 1.6, inst[5] - 2.0], ['及时性', inst[5] - 2.0, inst[5] - 2.4], ['稳定性', inst[5] - 1.1, inst[5] - 1.3]]) {
      await tx.query('INSERT INTO quality_results(institution_id,period,dimension,score,pass_rate) VALUES ($1,$2,$3,$4,$5)', [inst[0], '2026-08', dim, score, pass]);
    }
    for (const r of residents) await tx.query('INSERT INTO residents(id,name,gender,age,id_card,phone,org,dept,last_visit,tags,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)', [...r.slice(0,9), JSON.stringify(r[9]), r[10]]);
    for (const r of visits) await tx.query('INSERT INTO resident_visits(id,resident_id,visit_date,org,dept,visit_type,diagnosis,doctor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', r);
    for (const r of channels) await tx.query('INSERT INTO channels(id,name,source_name,target_table,channel_type,status,delay,qps,today_rows,lag) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', r);
    await tx.query("INSERT INTO audit_logs(actor,action,resource,status,duration_ms) VALUES ('system','seed','demo-dataset','success',0)");
  });
  console.log('[db] seeded demo dataset');
  return true;
}
