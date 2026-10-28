export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'cyan' | 'slate';

export const hospital = {
  name: '重庆医科大学附属第二医院',
  short: '重医附二院',
  platform: 'MedData 医疗数据中台',
  env: '生产环境',
  date: '2026-08-06',
  updated: '2026-08-06 14:21',
};

export const dashboardStats = [
  { label: '已接入数据源', value: '42', unit: '个', delta: '+3 本月', tone: 'blue' as Tone, icon: 'database' },
  { label: '数据表总量', value: '12,846', unit: '张', delta: '+128 本月', tone: 'violet' as Tone, icon: 'table' },
  { label: '指标资产', value: '2,572', unit: '项', delta: '86 本节新增', tone: 'cyan' as Tone, icon: 'gauge' },
  { label: '今日入仓数据', value: '1.82', unit: '亿条', delta: '成功率 99.2%', tone: 'green' as Tone, icon: 'activity' },
];

export const dataGrowth = [
  { label: '2025-09', value: 6820 }, { label: '2025-10', value: 7210 },
  { label: '2025-11', value: 7690 }, { label: '2025-12', value: 8120 },
  { label: '2026-01', value: 8730 }, { label: '2026-02', value: 9240 },
  { label: '2026-03', value: 9860 }, { label: '2026-04', value: 10480 },
  { label: '2026-05', value: 11260 }, { label: '2026-06', value: 11980 },
  { label: '2026-07', value: 12420 }, { label: '2026-08', value: 12846 },
];

export const sourceDistribution = [
  { label: 'HIS 业务库', value: 4280, color: '#6755F5' },
  { label: 'EMR 电子病历', value: 3140, color: '#9587FF' },
  { label: 'LIS 检验', value: 2162, color: '#0891B2' },
  { label: 'PACS 影像', value: 1845, color: '#10B981' },
  { label: 'HRP 运营', value: 892, color: '#F59E0B' },
  { label: '其他系统', value: 527, color: '#9AA9C4' },
];

export const assetTimeline = [
  { system: 'HIS', tone: '#6755F5', segments: [{ from: 0, to: 78, label: '2019 — 至今' }] },
  { system: 'EMR', tone: '#9587FF', segments: [{ from: 8, to: 70, label: '2020 — 至今' }, { from: 74, to: 84, label: '新院区' }] },
  { system: 'LIS', tone: '#0891B2', segments: [{ from: 16, to: 62, label: '2021 — 至今' }, { from: 68, to: 80, label: '流水线' }] },
  { system: 'PACS', tone: '#10B981', segments: [{ from: 24, to: 58, label: '2022 — 至今' }, { from: 66, to: 76, label: '云影像' }] },
  { system: 'RIS', tone: '#F59E0B', segments: [{ from: 30, to: 56, label: '2023 — 至今' }] },
  { system: 'HRP', tone: '#DB2777', segments: [{ from: 42, to: 64, label: '2023 — 至今' }, { from: 72, to: 82, label: '预算一体化' }] },
];

export const storageTop = [
  { label: 'DICOMImages', value: 8.2, display: '8.2 GB', tone: 'blue' },
  { label: 'Tab_reportcopy', value: 4.61, display: '4.61 GB', tone: 'violet' },
  { label: 'Pub_tab_pdigital', value: 4.16, display: '416 MB', tone: 'cyan' },
  { label: 'Sys_LogEvents', value: 1.72, display: '1.72 GB', tone: 'green' },
  { label: 'Tab_Images_N', value: 1.66, display: '1.66 GB', tone: 'amber' },
  { label: 'Tab_Inquiry', value: 1.53, display: '1.53 GB', tone: 'blue' },
  { label: 'Db_Images', value: 0.148, display: '148 MB', tone: 'slate' },
  { label: 'DICOMSeries', value: 0.141, display: '141 MB', tone: 'cyan' },
];

export const assetDomains = [
  { key: 'all', label: '全部数据域', count: 12846, tone: '#6755F5' },
  { key: 'HIS', label: 'HIS 业务', count: 4280, tone: '#6755F5' },
  { key: 'EMR', label: 'EMR 病历', count: 3140, tone: '#9587FF' },
  { key: 'LIS', label: 'LIS 检验', count: 2162, tone: '#0891B2' },
  { key: 'PACS', label: 'PACS 影像', count: 1845, tone: '#10B981' },
  { key: 'HRP', label: 'HRP 运营', count: 892, tone: '#F59E0B' },
  { key: 'CDR', label: 'CDR 临床', count: 527, tone: '#DB2777' },
];

export type Asset = {
  id: string; name: string; domain: string; layer: string; schema: string;
  rows: string; size: string; owner: string; updated: string; quality: number;
  source: string; desc: string; tags: string[];
};

export const assets: Asset[] = [
  { id: 'ods_his_patient', name: '患者基本信息表', domain: 'HIS', layer: 'ODS', schema: 'ods_his', rows: '3,428,519', size: '2.4 GB', owner: '李建华', updated: '2026-08-06 14:12', quality: 98.6, source: 'HIS 生产库', desc: '患者主索引、人口学信息与联系方式', tags: ['核心', '主数据', '已认证'] },
  { id: 'ods_his_inpatient', name: '住院就诊记录表', domain: 'HIS', layer: 'ODS', schema: 'ods_his', rows: '1,286,420', size: '1.8 GB', owner: '李建华', updated: '2026-08-06 14:12', quality: 97.9, source: 'HIS 生产库', desc: '住院登记、入出转与住院费用汇总', tags: ['核心', '已认证'] },
  { id: 'ods_his_outpatient', name: '门诊挂号记录表', domain: 'HIS', layer: 'ODS', schema: 'ods_his', rows: '9,842,116', size: '6.2 GB', owner: '王思远', updated: '2026-08-06 14:10', quality: 96.8, source: 'HIS 生产库', desc: '门诊预约、挂号、退号与爽约记录', tags: ['核心', '高频更新'] },
  { id: 'ods_emr_cpoe_ba_ssk', name: '电子病历医嘱表', domain: 'EMR', layer: 'ODS', schema: 'ods_emr', rows: '28,426,910', size: '12.8 GB', owner: '陈晓', updated: '2026-08-06 14:08', quality: 95.4, source: 'EMR 临床库', desc: 'CPOE 医嘱、处方与执行记录', tags: ['大字段', '核心'] },
  { id: 'ods_emr_diagnosis', name: '出院诊断表', domain: 'EMR', layer: 'ODS', schema: 'ods_emr', rows: '2,184,690', size: '3.1 GB', owner: '陈晓', updated: '2026-08-06 14:09', quality: 97.2, source: 'EMR 临床库', desc: 'ICD-10 出院主要诊断与其他诊断', tags: ['核心', '国考'] },
  { id: 'ods_lis_report', name: '检验报告主表', domain: 'LIS', layer: 'ODS', schema: 'ods_lis', rows: '42,860,410', size: '18.4 GB', owner: '赵倩', updated: '2026-08-06 14:06', quality: 99.1, source: 'LIS 生产库', desc: '生化、免疫、微生物检验报告', tags: ['核心', '高频更新'] },
  { id: 'ods_lis_result', name: '检验结果明细表', domain: 'LIS', layer: 'ODS', schema: 'ods_lis', rows: '286,420,000', size: '64.2 GB', owner: '赵倩', updated: '2026-08-06 14:07', quality: 98.4, source: 'LIS 生产库', desc: '检验项目结果值、单位与参考区间', tags: ['大字段', '核心'] },
  { id: 'ods_pacs_study', name: '影像检查主表', domain: 'PACS', layer: 'ODS', schema: 'ods_pacs', rows: '4,628,882', size: '9.8 GB', owner: '周宁', updated: '2026-08-06 14:03', quality: 96.2, source: 'PACS 归档库', desc: 'CT/MR/DR 检查申请与报告', tags: ['影像', '大字段'] },
  { id: 'ods_pacs_dicom_index', name: 'DICOM 影像索引', domain: 'PACS', layer: 'ODS', schema: 'ods_pacs', rows: '18,420,000', size: '2.2 GB', owner: '周宁', updated: '2026-08-06 14:03', quality: 94.8, source: 'PACS 归档库', desc: 'DICOM 序列与影像对象索引', tags: ['影像'] },
  { id: 'ods_hrp_cost', name: '科室成本核算表', domain: 'HRP', layer: 'ODS', schema: 'ods_hrp', rows: '862,410', size: '0.6 GB', owner: '刘一鸣', updated: '2026-08-05 23:40', quality: 98.1, source: 'HRP 运营库', desc: '科室直接成本、间接成本与分摊', tags: ['运营'] },
  { id: 'ods_hrp_material', name: '卫生耗材消耗表', domain: 'HRP', layer: 'ODS', schema: 'ods_hrp', rows: '1,248,600', size: '0.9 GB', owner: '刘一鸣', updated: '2026-08-05 23:38', quality: 97.5, source: 'HRP 运营库', desc: '高值耗材、低值耗材出入库与消耗', tags: ['运营', 'DRG'] },
  { id: 'dwd_fact_visit', name: '就诊事实宽表', domain: 'CDR', layer: 'DWD', schema: 'dwd', rows: '11,286,400', size: '8.6 GB', owner: '张敏', updated: '2026-08-06 13:50', quality: 99.2, source: '数仓加工', desc: '门诊/住院就诊事实，关联患者、科室、诊断', tags: ['核心', '已认证', '指标底座'] },
  { id: 'dwd_fact_surgery', name: '手术事实宽表', domain: 'CDR', layer: 'DWD', schema: 'dwd', rows: '1,842,300', size: '4.2 GB', owner: '张敏', updated: '2026-08-06 13:48', quality: 98.8, source: '数仓加工', desc: '手术记录、麻醉方式、切口等级与主刀医生', tags: ['核心', '指标底座'] },
  { id: 'dim_department', name: '科室公共维度表', domain: 'CDR', layer: 'DIM', schema: 'dim', rows: '1,286', size: '12 MB', owner: '张敏', updated: '2026-08-06 10:20', quality: 99.6, source: '数仓加工', desc: '临床科室、病区、核算科室映射关系', tags: ['公共维度', '已认证'] },
  { id: 'dim_doctor', name: '医生公共维度表', domain: 'CDR', layer: 'DIM', schema: 'dim', rows: '8,420', size: '28 MB', owner: '张敏', updated: '2026-08-06 10:20', quality: 99.4, source: '数仓加工', desc: '医师执业信息、职称与所属科室', tags: ['公共维度'] },
  { id: 'hm_reg_appt_data', name: '门诊预约主题数据集', domain: 'CDR', layer: 'DM', schema: 'hm', rows: '9,842,116', size: '3.6 GB', owner: '张敏', updated: '2026-08-06 13:42', quality: 98.9, source: '主题模型', desc: '门诊预约、签到、就诊与爽约分析模型', tags: ['主题模型', '指标来源'] },
  { id: 'hm_fs_surgeries_data', name: '病案手术主数据模型', domain: 'CDR', layer: 'DM', schema: 'hm', rows: '1,842,300', size: '2.8 GB', owner: '张敏', updated: '2026-08-06 13:40', quality: 98.3, source: '主题模型', desc: '手术台次、手术分级与并发症分析模型', tags: ['主题模型', '指标来源'] },
  { id: 'tbl_cdt_operation_dict', name: '手术操作字典', domain: 'CDR', layer: 'DIM', schema: 'dim', rows: '12,846', size: '6 MB', owner: '陈晓', updated: '2026-07-30 09:12', quality: 99.8, source: '数据标准', desc: 'ICD-9-CM-3 手术操作编码字典', tags: ['标准字典', '公共维度'] },
];

export const assetFields: Record<string, { name: string; cn: string; type: string; length: string; pk?: boolean; nullable: boolean; std?: string; desc: string }[]> = {
  ods_his_patient: [
    { name: 'patient_id', cn: '患者ID', type: 'varchar', length: '32', pk: true, nullable: false, std: 'DE-PAT-001', desc: '院内患者唯一标识' },
    { name: 'patient_name', cn: '患者姓名', type: 'varchar', length: '64', nullable: false, std: 'DE-PAT-002', desc: '患者姓名（脱敏展示）' },
    { name: 'id_card_no', cn: '身份证号', type: 'varchar', length: '18', nullable: true, std: 'DE-PAT-003', desc: '18 位身份证号码' },
    { name: 'gender_code', cn: '性别代码', type: 'char', length: '1', nullable: false, std: 'DE-GEN-001', desc: '1 男 / 2 女 / 9 未知' },
    { name: 'birth_date', cn: '出生日期', type: 'date', length: '-', nullable: true, std: 'DE-PAT-004', desc: '出生日期' },
    { name: 'phone_no', cn: '联系电话', type: 'varchar', length: '20', nullable: true, std: 'DE-PAT-005', desc: '患者联系电话' },
    { name: 'create_time', cn: '建档时间', type: 'datetime', length: '-', nullable: false, desc: '患者建档时间' },
    { name: 'update_time', cn: '更新时间', type: 'datetime', length: '-', nullable: false, desc: '记录更新时间' },
  ],
  ods_his_outpatient: [
    { name: 'appt_id', cn: '预约ID', type: 'bigint', length: '20', pk: true, nullable: false, desc: '预约记录主键' },
    { name: 'patient_id', cn: '患者ID', type: 'varchar', length: '32', nullable: false, std: 'DE-PAT-001', desc: '关联患者主索引' },
    { name: 'dept_code', cn: '科室编码', type: 'varchar', length: '20', nullable: false, desc: '预约科室' },
    { name: 'doctor_code', cn: '医生编码', type: 'varchar', length: '20', nullable: true, desc: '预约医生' },
    { name: 'appt_time', cn: '预约时间', type: 'datetime', length: '-', nullable: false, desc: '预约就诊时间' },
    { name: 'status', cn: '预约状态', type: 'varchar', length: '2', nullable: false, desc: '1 已预约 / 2 已签到 / 3 爽约 / 4 取消' },
    { name: 'source', cn: '预约来源', type: 'varchar', length: '20', nullable: true, desc: '公众号、自助机、窗口等' },
  ],
  ods_emr_cpoe_ba_ssk: [
    { name: 'order_id', cn: '医嘱ID', type: 'bigint', length: '20', pk: true, nullable: false, desc: '医嘱唯一标识' },
    { name: 'patient_id', cn: '患者ID', type: 'varchar', length: '32', nullable: false, desc: '患者标识' },
    { name: 'visit_id', cn: '就诊ID', type: 'varchar', length: '32', nullable: false, desc: '住院/门诊就诊流水' },
    { name: 'order_type', cn: '医嘱类型', type: 'varchar', length: '10', nullable: false, desc: '长期/临时/出院带药' },
    { name: 'drug_code', cn: '药品编码', type: 'varchar', length: '20', nullable: true, desc: '药品字典编码' },
    { name: 'dosage', cn: '剂量', type: 'decimal', length: '10,2', nullable: true, desc: '单次剂量' },
    { name: 'order_time', cn: '开立时间', type: 'datetime', length: '-', nullable: false, desc: '医嘱开立时间' },
    { name: 'doctor_code', cn: '开立医生', type: 'varchar', length: '20', nullable: true, desc: '开立医师编码' },
  ],
};

export function getFields(asset?: Asset) {
  if (!asset) return assetFields.ods_his_patient;
  return assetFields[asset.id] || [
    { name: asset.id.includes('surgery') ? 'surgery_id' : 'id', cn: '主键ID', type: 'bigint', length: '20', pk: true, nullable: false, desc: '记录唯一标识' },
    { name: 'patient_id', cn: '患者ID', type: 'varchar', length: '32', nullable: false, std: 'DE-PAT-001', desc: '患者主索引' },
    { name: 'visit_id', cn: '就诊ID', type: 'varchar', length: '32', nullable: true, desc: '就诊流水号' },
    { name: 'dept_code', cn: '科室编码', type: 'varchar', length: '20', nullable: true, desc: '业务科室' },
    { name: 'org_code', cn: '院区编码', type: 'varchar', length: '10', nullable: false, desc: '院区标识（渝中/江南）' },
    { name: 'event_time', cn: '业务时间', type: 'datetime', length: '-', nullable: false, desc: '业务发生时间' },
    { name: 'etl_time', cn: '入仓时间', type: 'datetime', length: '-', nullable: false, desc: '数据同步入仓时间' },
  ];
}

export const dataSources = [
  { id: 'his', name: 'HIS 生产库', type: 'Oracle', host: '10.20.31.18:1521', db: 'HISDB', tables: 4280, status: '正常', sync: '14:12', owner: '信息中心' },
  { id: 'emr', name: 'EMR 临床库', type: 'SQL Server', host: '10.20.31.24:1433', db: 'EMRDB', tables: 3140, status: '正常', sync: '14:08', owner: '信息中心' },
  { id: 'lis', name: 'LIS 生产库', type: 'Oracle', host: '10.20.31.36:1521', db: 'LISDB', tables: 2162, status: '正常', sync: '14:06', owner: '检验科' },
  { id: 'pacs', name: 'PACS 归档库', type: 'MySQL', host: '10.20.31.42:3306', db: 'PACSDB', tables: 1845, status: '正常', sync: '14:03', owner: '放射科' },
  { id: 'hrp', name: 'HRP 运营库', type: 'Oracle', host: '10.20.31.51:1521', db: 'HRPDB', tables: 892, status: '延迟', sync: '13:40', owner: '财务处' },
  { id: '医保', name: '医保结算平台', type: 'API', host: 'api.ybj.cq.gov.cn', db: '—', tables: 62, status: '正常', sync: '13:58', owner: '医保办' },
  { id: '手麻', name: '手术麻醉系统', type: 'SQL Server', host: '10.20.31.68:1433', db: 'AMSDB', tables: 386, status: '正常', sync: '14:05', owner: '麻醉科' },
  { id: '上报', name: '卫健委上报库', type: 'PostgreSQL', host: '10.20.32.10:5432', db: 'REPORT', tables: 79, status: '维护中', sync: '08-05 22:00', owner: '医务处' },
];

export const qualityDims = [
  { label: '完整性', value: 98.2, color: '#6755F5' },
  { label: '准确性', value: 96.4, color: '#9587FF' },
  { label: '一致性', value: 94.8, color: '#0891B2' },
  { label: '及时性', value: 92.1, color: '#F59E0B' },
  { label: '唯一性', value: 99.1, color: '#10B981' },
];

export const qualityTrend = [
  { label: '03-01', value: 92.4 }, { label: '03-15', value: 93.2 }, { label: '04-01', value: 93.8 },
  { label: '04-15', value: 94.6 }, { label: '05-01', value: 94.2 }, { label: '05-15', value: 95.1 },
  { label: '06-01', value: 95.4 }, { label: '06-15', value: 95.0 }, { label: '07-01', value: 95.6 },
  { label: '07-15', value: 95.3 }, { label: '08-01', value: 95.8 }, { label: '08-06', value: 95.6 },
];

export const qualityRules = [
  { id: 'QR-001', name: '患者主键唯一性校验', asset: 'ods_his_patient', dimension: '唯一性', rule: 'patient_id 不可重复', pass: 99.98, status: '通过', runs: 14286, owner: '李建华' },
  { id: 'QR-002', name: '就诊记录非空校验', asset: 'dwd_fact_visit', dimension: '完整性', rule: 'patient_id / visit_id 非空', pass: 99.62, status: '通过', runs: 12840, owner: '张敏' },
  { id: 'QR-003', name: '性别代码值域校验', asset: 'ods_his_patient', dimension: '准确性', rule: 'gender_code IN (1,2,9)', pass: 99.91, status: '通过', runs: 14286, owner: '李建华' },
  { id: 'QR-004', name: '检验结果及时性', asset: 'ods_lis_report', dimension: '及时性', rule: '报告 24h 内入仓', pass: 96.42, status: '预警', runs: 9862, owner: '赵倩' },
  { id: 'QR-005', name: '诊断编码标准性', asset: 'ods_emr_diagnosis', dimension: '一致性', rule: '匹配 ICD-10 标准字典', pass: 97.80, status: '通过', runs: 8620, owner: '陈晓' },
  { id: 'QR-006', name: '手术记录完整性', asset: 'dwd_fact_surgery', dimension: '完整性', rule: '主刀/麻醉/切口等级非空', pass: 98.24, status: '通过', runs: 7680, owner: '张敏' },
  { id: 'QR-007', name: '费用金额非负校验', asset: 'ods_his_inpatient', dimension: '准确性', rule: 'total_amount >= 0', pass: 99.96, status: '通过', runs: 12840, owner: '刘一鸣' },
  { id: 'QR-008', name: '科室编码关联完整性', asset: 'dwd_fact_visit', dimension: '一致性', rule: 'dept_code 可关联 dim_department', pass: 99.42, status: '通过', runs: 12840, owner: '张敏' },
  { id: 'QR-009', name: '重复就诊记录检测', asset: 'ods_his_outpatient', dimension: '唯一性', rule: '同患者同科室同日均无重复', pass: 99.12, status: '预警', runs: 11260, owner: '王思远' },
  { id: 'QR-010', name: '影像检查报告关联', asset: 'ods_pacs_study', dimension: '完整性', rule: 'study_id 必须存在报告记录', pass: 95.68, status: '异常', runs: 6420, owner: '周宁' },
];

export const qualityIssues = [
  { id: 'QI-2086', rule: '影像检查报告关联', asset: 'ods_pacs_study', dimension: '完整性', count: 284, level: '高', status: '待处理', owner: '周宁', found: '2026-08-06 13:20' },
  { id: 'QI-2085', rule: '检验结果及时性', asset: 'ods_lis_report', dimension: '及时性', count: 186, level: '中', status: '处理中', owner: '赵倩', found: '2026-08-06 12:40' },
  { id: 'QI-2084', rule: '重复就诊记录检测', asset: 'ods_his_outpatient', dimension: '唯一性', count: 92, level: '中', status: '待处理', owner: '王思远', found: '2026-08-06 11:08' },
  { id: 'QI-2083', rule: '诊断编码标准性', asset: 'ods_emr_diagnosis', dimension: '一致性', count: 48, level: '低', status: '已修复', owner: '陈晓', found: '2026-08-05 18:22' },
  { id: 'QI-2082', rule: '手术记录完整性', asset: 'dwd_fact_surgery', dimension: '完整性', count: 36, level: '低', status: '已修复', owner: '张敏', found: '2026-08-05 16:50' },
  { id: 'QI-2081', rule: '患者主键唯一性校验', asset: 'ods_his_patient', dimension: '唯一性', count: 12, level: '低', status: '已修复', owner: '李建华', found: '2026-08-05 09:30' },
];

export const standardElements = [
  { code: 'DE-PAT-001', name: '患者标识', en: 'Patient ID', type: '字符型', length: '32', domain: '患者主索引', source: 'HIS', status: '已发布' },
  { code: 'DE-PAT-002', name: '患者姓名', en: 'Patient Name', type: '字符型', length: '64', domain: '姓名', source: 'HIS', status: '已发布' },
  { code: 'DE-GEN-001', name: '性别代码', en: 'Gender Code', type: '字符型', length: '1', domain: 'GB/T 2261.1', source: 'HIS', status: '已发布' },
  { code: 'DE-VIS-001', name: '就诊流水号', en: 'Visit Serial No.', type: '字符型', length: '32', domain: '就诊标识', source: 'HIS', status: '已发布' },
  { code: 'DE-DIAG-001', name: '主要诊断编码', en: 'Primary Diagnosis', type: '字符型', length: '10', domain: 'ICD-10 国临版 2.0', source: 'EMR', status: '已发布' },
  { code: 'DE-OPR-001', name: '手术操作编码', en: 'Operation Code', type: '字符型', length: '10', domain: 'ICD-9-CM-3', source: '手麻', status: '已发布' },
  { code: 'DE-DEP-001', name: '科室编码', en: 'Department Code', type: '字符型', length: '20', domain: '院内科室字典', source: 'HRP', status: '已发布' },
  { code: 'DE-LAB-001', name: '检验项目编码', en: 'Lab Item Code', type: '字符型', length: '20', domain: 'LOINC / 院内部标', source: 'LIS', status: '已发布' },
  { code: 'DE-FEE-001', name: '医疗费用金额', en: 'Medical Amount', type: '数值型', length: '12,2', domain: '金额（元）', source: 'HIS', status: '已发布' },
  { code: 'DE-TIM-001', name: '业务发生时间', en: 'Event Time', type: '日期时间', length: '-', domain: 'YYYY-MM-DD HH:mm:ss', source: '通用', status: '已发布' },
  { code: 'DE-PAT-006', name: '民族代码', en: 'Ethnicity Code', type: '字符型', length: '2', domain: 'GB/T 3304', source: 'HIS', status: '草稿' },
  { code: 'DE-ADR-001', name: '行政区划代码', en: 'Region Code', type: '字符型', length: '6', domain: 'GB/T 2260', source: '通用', status: '已发布' },
];

export const valueDomains = [
  { code: 'VD-001', name: '性别代码', std: 'GB/T 2261.1', count: 3, version: 'V2.1', updated: '2026-06-12', status: '已发布' },
  { code: 'VD-002', name: 'ICD-10 诊断编码', std: '国临版 2.0', count: 32846, version: 'V2.0', updated: '2026-07-30', status: '已发布' },
  { code: 'VD-003', name: 'ICD-9-CM-3 手术编码', std: '国家医保版 1.0', count: 12846, version: 'V1.4', updated: '2026-07-30', status: '已发布' },
  { code: 'VD-004', name: '科室字典', std: '院内部标', count: 1286, version: 'V3.8', updated: '2026-08-01', status: '已发布' },
  { code: 'VD-005', name: '检验项目字典', std: 'LOINC 映射', count: 2842, version: 'V1.8', updated: '2026-07-18', status: '已发布' },
  { code: 'VD-006', name: '医保结算方式', std: '国家医保局', count: 18, version: 'V2.0', updated: '2026-05-20', status: '已发布' },
];

export const datasets = [
  { id: 'ocr_ceshi1', name: 'ocr_ceshi1', desc: '检验报告 OCR 结构化测试数据集', tables: 0, rows: '—', owner: '张敏', updated: '2026-08-06', type: '测试' },
  { id: 'hm_sjzx_mzxx', name: 'hm_sjzx_mzxx', desc: '门诊病人及处方信息主题数据集', tables: 12, rows: '9.8M', owner: '张敏', updated: '2026-08-06', type: '主题' },
  { id: 'hm_fs_surgeries', name: 'hm_fs_surgeries', desc: '病案手术主题数据集', tables: 8, rows: '1.8M', owner: '张敏', updated: '2026-08-05', type: '主题' },
  { id: 'hm_lis_reports', name: 'hm_lis_reports', desc: '检验报告分析数据集', tables: 6, rows: '42.8M', owner: '赵倩', updated: '2026-08-05', type: '主题' },
  { id: 'ads_operation', name: 'ads_operation', desc: '运营决策分析数据集', tables: 18, rows: '286M', owner: '刘一鸣', updated: '2026-08-04', type: '应用' },
];

export const devJobs = [
  { id: 'JOB-1042', name: 'dwd_fact_visit_daily', type: 'SQL', schedule: '每日 02:00', last: '2026-08-06 02:14', duration: '12m 18s', status: '成功', owner: '张敏' },
  { id: 'JOB-1041', name: 'dim_department_sync', type: 'SQL', schedule: '每日 01:00', last: '2026-08-06 01:02', duration: '42s', status: '成功', owner: '张敏' },
  { id: 'JOB-1040', name: 'hm_reg_appt_data', type: 'Spark', schedule: '每小时', last: '2026-08-06 14:00', duration: '4m 06s', status: '成功', owner: '王思远' },
  { id: 'JOB-1039', name: 'lis_result_quality_check', type: 'SQL', schedule: '每日 03:30', last: '2026-08-06 03:32', duration: '6m 44s', status: '告警', owner: '赵倩' },
  { id: 'JOB-1038', name: 'pacs_study_index', type: 'Python', schedule: '每日 04:00', last: '2026-08-06 04:21', duration: '21m 02s', status: '成功', owner: '周宁' },
  { id: 'JOB-1037', name: 'hrp_cost_daily', type: 'SQL', schedule: '每日 05:00', last: '2026-08-05 05:12', duration: '3m 20s', status: '失败', owner: '刘一鸣' },
];

export const reportTasks = [
  { id: 'RP-2086', name: '2026 年 7 月医疗服务月报', target: '重庆市卫健委', type: '月报', progress: 100, status: '已上报', date: '2026-08-05 10:20', owner: '医务处' },
  { id: 'RP-2085', name: '公立医院绩效考核指标（7 月）', target: '国家卫健委', type: '月报', progress: 86, status: '生成中', date: '2026-08-06 09:00', owner: '质管办' },
  { id: 'RP-2084', name: 'DRG 分组结算数据（7 月）', target: '重庆市医保局', type: '月报', progress: 100, status: '已上报', date: '2026-08-03 16:40', owner: '医保办' },
  { id: 'RP-2083', name: '医疗质量安全核心指标（Q2）', target: '重庆市卫健委', type: '季报', progress: 100, status: '已上报', date: '2026-07-15 14:00', owner: '质管办' },
  { id: 'RP-2082', name: '卫生资源与医疗服务年报', target: '国家卫健委', type: '年报', progress: 42, status: '待补数', date: '2026-08-06 08:30', owner: '信息中心' },
  { id: 'RP-2081', name: '医院感染监测数据（7 月）', target: '院感质控中心', type: '月报', progress: 0, status: '待生成', date: '2026-08-06 14:00', owner: '院感科' },
];

export type Indicator = {
  id: string; code: string; name: string; alias?: string; category: string;
  type: string; status: string; tags: string[]; owner: string; updated: string;
  value: string; unit: string; desc: string; caliber: string; source: string;
  dept: string; frequency: string; format: string; precision: string;
};

export const indicatorCategories = [
  { key: 'all', label: '全部指标', count: 2572 },
  { key: '运营指标分析', label: '运营指标分析', count: 1286, children: [
    { key: '实时指标', label: '实时指标', count: 84 },
    { key: '就诊主题分析', label: '就诊主题分析', count: 426 },
    { key: '手术主题分析', label: '手术主题分析', count: 318 },
    { key: '收支主题分析', label: '收支主题分析', count: 246 },
    { key: '门诊绩效', label: '门诊绩效', count: 212 },
  ]},
  { key: '医疗质量', label: '医疗质量', count: 682, children: [
    { key: '核心制度', label: '核心制度', count: 186 },
    { key: '院感防控', label: '院感防控', count: 124 },
    { key: '合理用药', label: '合理用药', count: 218 },
  ]},
  { key: '国考指标', label: '国考指标', count: 364 },
  { key: 'DRG 指标', label: 'DRG 指标', count: 240 },
];

export const indicators: Indicator[] = [
  { id: '148', code: 'MZ-YY-148', name: '门诊预约爽约人次', alias: '爽约人次', category: '运营指标分析 / 就诊主题分析', type: '原子指标', status: '已发布', tags: ['运营', '预约'], owner: '张敏', updated: '2026-08-06 14:12', value: '1,284', unit: '人次', desc: '统计周期内预约挂号后未按时就诊的患者人次', caliber: '预约时间在统计周期内，且预约状态为“爽约”的预约记录数；同一患者同一天同一科室按 1 次计算', source: 'hm_reg_appt_data', dept: '门诊部', frequency: '日', format: '数值', precision: '整数' },
  { id: '5', code: 'SS-TC-005', name: '手术台次', alias: '手术量', category: '运营指标分析 / 手术主题分析', type: '原子指标', status: '已发布', tags: ['运营', '手术'], owner: '张敏', updated: '2026-08-06 13:55', value: '3,862', unit: '台', desc: '统计周期内完成的手术台次（含门诊手术）', caliber: '以手术麻醉系统手术记录为准，排除取消手术；一台手术计 1 台次', source: 'hm_fs_surgeries_data', dept: '医务处', frequency: '日', format: '数值', precision: '整数' },
  { id: '23', code: 'SS-BFZ-023', name: '手术并发症发生率', category: '医疗质量 / 核心制度', type: '派生指标', status: '已发布', tags: ['质量', '国考'], owner: '陈晓', updated: '2026-08-06 11:20', value: '0.86', unit: '%', desc: '手术患者发生并发症的比例', caliber: '手术并发症例数 / 同期手术患者例数 × 100%', source: 'hm_fs_surgeries_data', dept: '质管办', frequency: '月', format: '百分比', precision: '2 位小数' },
  { id: '31', code: 'ZY-PJ-031', name: '平均住院日', category: '运营指标分析 / 就诊主题分析', type: '派生指标', status: '已发布', tags: ['运营', '国考'], owner: '张敏', updated: '2026-08-06 10:05', value: '7.24', unit: '天', desc: '出院患者平均住院天数', caliber: '出院患者占用总床日数 / 同期出院人数', source: 'dwd_fact_visit', dept: '医务处', frequency: '月', format: '数值', precision: '2 位小数' },
  { id: '42', code: 'MZ-RC-042', name: '门诊人次', category: '运营指标分析 / 就诊主题分析', type: '原子指标', status: '已发布', tags: ['运营', '门诊'], owner: '王思远', updated: '2026-08-06 09:42', value: '286,420', unit: '人次', desc: '统计周期内门诊就诊人次', caliber: '门诊挂号且完成就诊的人次，不含退号', source: 'dwd_fact_visit', dept: '门诊部', frequency: '日', format: '数值', precision: '整数' },
  { id: '57', code: 'ZY-RC-057', name: '住院人次', category: '运营指标分析 / 就诊主题分析', type: '原子指标', status: '已发布', tags: ['运营', '住院'], owner: '王思远', updated: '2026-08-05 17:30', value: '18,642', unit: '人次', desc: '统计周期内办理入院的人次', caliber: '入院登记时间在统计周期内的住院记录数', source: 'dwd_fact_visit', dept: '医务处', frequency: '日', format: '数值', precision: '整数' },
  { id: '68', code: 'CW-CW-068', name: '床位使用率', category: '运营指标分析 / 收支主题分析', type: '派生指标', status: '已发布', tags: ['运营', '国考'], owner: '刘一鸣', updated: '2026-08-05 16:18', value: '92.4', unit: '%', desc: '实际占用床日占开放床日的比例', caliber: '实际占用总床日数 / 实际开放总床日数 × 100%', source: 'hm_bed_usage_data', dept: '运营部', frequency: '日', format: '百分比', precision: '1 位小数' },
  { id: '73', code: 'CW-YZ-073', name: '药占比', category: '运营指标分析 / 收支主题分析', type: '派生指标', status: '已发布', tags: ['运营', '国考'], owner: '刘一鸣', updated: '2026-08-05 15:22', value: '26.8', unit: '%', desc: '药品收入占医疗收入的比例', caliber: '药品收入 / 医疗收入 × 100%', source: 'hm_revenue_data', dept: '财务处', frequency: '月', format: '百分比', precision: '1 位小数' },
  { id: '86', code: 'CW-HC-086', name: '卫生材料占比', category: '运营指标分析 / 收支主题分析', type: '派生指标', status: '已发布', tags: ['运营', 'DRG'], owner: '刘一鸣', updated: '2026-08-04 11:08', value: '18.6', unit: '%', desc: '卫生材料收入占医疗收入的比例', caliber: '卫生材料收入 / 医疗收入 × 100%', source: 'hm_revenue_data', dept: '财务处', frequency: '月', format: '百分比', precision: '1 位小数' },
  { id: '97', code: 'JY-JS-097', name: '检验报告及时率', category: '医疗质量 / 核心制度', type: '派生指标', status: '已发布', tags: ['质量', '医技'], owner: '赵倩', updated: '2026-08-04 09:30', value: '96.4', unit: '%', desc: '检验报告在承诺时限内发布的比率', caliber: '按时发布报告数 / 同期报告总数 × 100%', source: 'ods_lis_report', dept: '检验科', frequency: '日', format: '百分比', precision: '1 位小数' },
  { id: '104', code: 'SS-SS-104', name: '术前平均住院日', category: '运营指标分析 / 手术主题分析', type: '派生指标', status: '已发布', tags: ['运营', '手术'], owner: '张敏', updated: '2026-08-03 15:44', value: '2.18', unit: '天', desc: '手术患者入院至手术日的平均天数', caliber: '手术患者术前住院总天数 / 同期手术患者数', source: 'hm_fs_surgeries_data', dept: '医务处', frequency: '月', format: '数值', precision: '2 位小数' },
  { id: '118', code: 'SS-SJ-118', name: '三四级手术占比', category: '运营指标分析 / 手术主题分析', type: '派生指标', status: '已发布', tags: ['手术', '国考'], owner: '张敏', updated: '2026-08-03 14:20', value: '64.8', unit: '%', desc: '三四级手术台次占手术总台次的比例', caliber: '三四级手术台次 / 手术总台次 × 100%', source: 'hm_fs_surgeries_data', dept: '医务处', frequency: '月', format: '百分比', precision: '1 位小数' },
  { id: '126', code: 'YZ-GR-126', name: '医院感染发生率', category: '医疗质量 / 院感防控', type: '派生指标', status: '已发布', tags: ['质量', '院感'], owner: '陈晓', updated: '2026-08-02 10:12', value: '1.12', unit: '%', desc: '住院患者医院感染发生比例', caliber: '医院感染例数 / 同期住院患者数 × 100%', source: 'hm_infection_data', dept: '院感科', frequency: '月', format: '百分比', precision: '2 位小数' },
  { id: '139', code: 'MZ-YY-139', name: '门诊预约率', category: '运营指标分析 / 门诊绩效', type: '派生指标', status: '草稿', tags: ['门诊', '运营'], owner: '王思远', updated: '2026-08-02 09:05', value: '—', unit: '%', desc: '门诊预约就诊人次占门诊总人次比例', caliber: '预约就诊人次 / 门诊总人次 × 100%', source: 'hm_reg_appt_data', dept: '门诊部', frequency: '日', format: '百分比', precision: '1 位小数' },
  { id: '152', code: 'GK-CF-152', name: '出院患者微创手术占比', category: '国考指标', type: '派生指标', status: '已发布', tags: ['国考', '手术'], owner: '张敏', updated: '2026-08-01 16:38', value: '21.6', unit: '%', desc: '出院患者微创手术台次占比', caliber: '微创手术台次 / 出院手术患者台次 × 100%', source: 'hm_fs_surgeries_data', dept: '医务处', frequency: '月', format: '百分比', precision: '1 位小数' },
  { id: '168', code: 'DRG-CM-168', name: 'DRG 组数（CMI）', category: 'DRG 指标', type: '复合指标', status: '已发布', tags: ['DRG', '国考'], owner: '刘一鸣', updated: '2026-08-01 11:14', value: '1.08', unit: '—', desc: '病例组合指数，反映收治病例技术难度', caliber: '总权重 / 总病例数', source: 'hm_drg_data', dept: '医保办', frequency: '月', format: '数值', precision: '2 位小数' },
  { id: '176', code: 'GK-FY-176', name: '次均住院费用', category: '国考指标', type: '派生指标', status: '已发布', tags: ['国考', '运营'], owner: '刘一鸣', updated: '2026-07-31 15:00', value: '14,286', unit: '元', desc: '出院患者次均住院费用', caliber: '住院总收入 / 同期出院人次', source: 'hm_revenue_data', dept: '财务处', frequency: '月', format: '金额', precision: '整数' },
  { id: '188', code: 'MZ-DD-188', name: '门诊次均费用', category: '运营指标分析 / 门诊绩效', type: '派生指标', status: '已发布', tags: ['门诊', '运营'], owner: '王思远', updated: '2026-07-30 10:24', value: '386.4', unit: '元', desc: '门诊患者次均医疗费用', caliber: '门诊总收入 / 同期门诊人次', source: 'hm_revenue_data', dept: '财务处', frequency: '月', format: '金额', precision: '1 位小数' },
  { id: '201', code: 'ZY-YY-201', name: '住院预约等待时间', category: '运营指标分析 / 就诊主题分析', type: '复合指标', status: '草稿', tags: ['住院', '运营'], owner: '王思远', updated: '2026-07-29 09:40', value: '—', unit: '天', desc: '患者开具住院证至实际入院平均等待天数', caliber: '入院时间 - 住院证开具时间 的平均值', source: 'hm_bed_usage_data', dept: '医务处', frequency: '周', format: '数值', precision: '1 位小数' },
];

export const indicatorTrend = [
  { label: '2025-09', value: 148 }, { label: '2025-10', value: 162 }, { label: '2025-11', value: 156 },
  { label: '2025-12', value: 188 }, { label: '2026-01', value: 214 }, { label: '2026-02', value: 168 },
  { label: '2026-03', value: 182 }, { label: '2026-04', value: 174 }, { label: '2026-05', value: 196 },
  { label: '2026-06', value: 208 }, { label: '2026-07', value: 186 }, { label: '2026-08', value: 132 },
];

export const indicatorBreakdown = [
  { label: '心血管内科', value: 186, pct: 100, color: '#6755F5' },
  { label: '消化内科', value: 162, pct: 87, color: '#4F7DF8' },
  { label: '骨科', value: 148, pct: 80, color: '#9587FF' },
  { label: '神经内科', value: 126, pct: 68, color: '#0891B2' },
  { label: '呼吸内科', value: 112, pct: 60, color: '#10B981' },
  { label: '其他科室', value: 550, pct: 100, color: '#C7D3E8' },
];

export const changes = [
  { time: '2026-08-06 14:12', user: '张敏', action: '更新指标口径', detail: '补充“同一患者同一天同一科室按 1 次计算”的说明', version: 'V3.2' },
  { time: '2026-07-28 10:20', user: '王思远', action: '发布指标', detail: '指标审核通过并发布至指标中台', version: 'V3.1' },
  { time: '2026-07-26 16:40', user: '张敏', action: '修改数据来源', detail: '数据来源由 hm_mz_appt_old 切换为 hm_reg_appt_data', version: 'V3.0' },
  { time: '2026-06-18 09:12', user: '陈晓', action: '创建派生指标', detail: '基于本指标创建“门诊预约爽约率”派生指标', version: 'V2.4' },
  { time: '2026-05-30 11:08', user: '张敏', action: '创建指标', detail: '创建门诊预约爽约人次指标', version: 'V1.0' },
];

export const subscriptions = [
  { id: 'SUB-042', indicator: '门诊预约爽约人次', subscriber: '门诊部', channel: '邮件 + 工作台', frequency: '每日 08:00', status: '启用', since: '2026-03-12' },
  { id: 'SUB-041', indicator: '手术台次', subscriber: '医务处', channel: '工作台', frequency: '每日 08:00', status: '启用', since: '2026-03-12' },
  { id: 'SUB-040', indicator: '平均住院日', subscriber: '院领导', channel: '邮件', frequency: '每周一 09:00', status: '启用', since: '2026-02-18' },
  { id: 'SUB-039', indicator: '床位使用率', subscriber: '运营部', channel: '企业微信', frequency: '每日 09:00', status: '启用', since: '2026-02-10' },
  { id: 'SUB-038', indicator: '三四级手术占比', subscriber: '质管办', channel: '邮件', frequency: '每月 1 日', status: '暂停', since: '2025-12-01' },
  { id: 'SUB-037', indicator: 'DRG 组数（CMI）', subscriber: '医保办', channel: '工作台', frequency: '每月 5 日', status: '启用', since: '2025-11-20' },
  { id: 'SUB-036', indicator: '次均住院费用', subscriber: '财务处', channel: '邮件', frequency: '每月 3 日', status: '启用', since: '2025-10-15' },
  { id: 'SUB-035', indicator: '检验报告及时率', subscriber: '检验科', channel: '工作台 + 短信', frequency: '每日 10:00', status: '启用', since: '2025-09-08' },
];

export const tags = [
  { name: '国考', color: '#6755F5', count: 364, desc: '国家三级公立医院绩效考核指标' },
  { name: 'DRG', color: '#9587FF', count: 240, desc: 'DRG / DIP 支付方式改革相关指标' },
  { name: '运营', color: '#0891B2', count: 486, desc: '医院运营管理与资源配置指标' },
  { name: '质量', color: '#10B981', count: 318, desc: '医疗质量与安全核心指标' },
  { name: '门诊', color: '#F59E0B', count: 212, desc: '门诊服务与预约诊疗指标' },
  { name: '住院', color: '#DB2777', count: 186, desc: '住院服务与床位管理指标' },
  { name: '手术', color: '#8A6BE8', count: 226, desc: '手术效率与手术安全指标' },
  { name: '院感', color: '#E25C5C', count: 124, desc: '医院感染监测与防控指标' },
  { name: '医保', color: '#0E9F8A', count: 168, desc: '医保结算与基金监管指标' },
  { name: '重点监控', color: '#C28A2C', count: 86, desc: '院级重点监控与专项治理指标' },
];

export const models = [
  { id: 'hm_sjzx_mzxx', name: 'hm_sjzx_mzxx', type: '主题数据集', desc: '门诊病人及处方信息主题模型', owner: 'cywa_admin', created: '2026-06-15 09:56', updated: '2026-08-06 10:20', tables: 12, rows: '9.8M' },
  { id: 'hm_aqi_data', name: 'hm_aqi_data', type: '主题数据集', desc: '呼吸重症专业主题模型', owner: 'cywa_admin', created: '2026-05-28 10:19', updated: '2026-07-11 15:37', tables: 8, rows: '2.4M' },
  { id: 'hm_pm_data', name: 'hm_pm_data', type: '主题数据集', desc: '呼吸慢病专业主题模型', owner: 'cywa_admin', created: '2026-05-27 14:53', updated: '2026-07-15 09:22', tables: 6, rows: '1.8M' },
  { id: 'hm_reh_data', name: 'hm_reh_data', type: '主题数据集', desc: '康复医学专业主题模型', owner: 'cywa_admin', created: '2026-05-26 09:48', updated: '2026-07-15 15:32', tables: 7, rows: '1.2M' },
  { id: 'hm_us_data', name: 'hm_us_data', type: '主题数据集', desc: '超声诊断专业主题模型', owner: 'cywa_admin', created: '2026-05-25 14:44', updated: '2026-07-15 11:01', tables: 5, rows: '3.6M' },
  { id: 'hm_id_data', name: 'hm_id_data', type: '主题数据集', desc: '感染性疾病专业主题模型', owner: 'cywa_admin', created: '2026-05-22 10:55', updated: '2026-07-15 11:24', tables: 9, rows: '2.1M' },
  { id: 'hm_nm_data', name: 'hm_nm_data', type: '主题数据集', desc: '神经内科专业主题模型', owner: 'cywa_admin', created: '2026-05-20 16:20', updated: '2026-07-12 14:08', tables: 11, rows: '4.8M' },
  { id: 'hm_rqi_data', name: 'hm_rqi_data', type: '主题数据集', desc: '医疗质量指标数据集', owner: 'cywa_admin', created: '2026-05-18 11:32', updated: '2026-07-14 16:40', tables: 14, rows: '6.2M' },
  { id: 'hm_pcs_data', name: 'hm_pcs_data', type: '主题数据集', desc: '病案首页数据集', owner: 'cywa_admin', created: '2026-05-15 09:10', updated: '2026-07-13 10:16', tables: 10, rows: '8.4M' },
];

export const apiServices = [
  { id: 'API-001', name: '患者主索引查询', path: '/api/v1/patient/{patientId}', method: 'GET', status: '已发布', calls: '286,420', latency: '48ms', owner: '信息中心', category: '患者服务' },
  { id: 'API-002', name: '门诊就诊记录查询', path: '/api/v1/visits/outpatient', method: 'POST', status: '已发布', calls: '184,260', latency: '72ms', owner: '门诊部', category: '就诊服务' },
  { id: 'API-003', name: '住院费用明细', path: '/api/v1/inpatient/charges', method: 'POST', status: '已发布', calls: '96,840', latency: '86ms', owner: '财务处', category: '费用服务' },
  { id: 'API-004', name: '检验结果查询', path: '/api/v1/lab/results', method: 'GET', status: '已发布', calls: '42,860', latency: '36ms', owner: '检验科', category: '医技服务' },
  { id: 'API-005', name: '指标数据服务', path: '/api/v1/indicators/{code}', method: 'GET', status: '已发布', calls: '28,640', latency: '52ms', owner: '指标中台', category: '指标服务' },
  { id: 'API-006', name: '运营日报推送', path: '/api/v1/reports/daily', method: 'POST', status: '灰度中', calls: '8,420', latency: '126ms', owner: '运营部', category: '报表服务' },
  { id: 'API-007', name: '科研数据集申请', path: '/api/v1/datasets/apply', method: 'POST', status: '已发布', calls: '1,286', latency: '64ms', owner: '科研处', category: '科研服务' },
  { id: 'API-008', name: 'DRG 分组结果查询', path: '/api/v1/drg/group', method: 'GET', status: '下线', calls: '—', latency: '—', owner: '医保办', category: '医保服务' },
];

// ── 采集监控平台 ──────────────────────────────────────────────────────────────
export const collectionStats = [
  { label: '接入数据源', value: '128', unit: '个', delta: '+6 本月', tone: 'blue' as Tone, icon: 'database' },
  { label: '采集通道', value: '64', unit: '条', delta: '运行中 58', tone: 'violet' as Tone, icon: 'git' },
  { label: '今日同步任务', value: '1,286', unit: '次', delta: '成功 1,276', tone: 'cyan' as Tone, icon: 'activity' },
  { label: '同步成功率', value: '99.2', unit: '%', delta: '+0.3% 环比', tone: 'green' as Tone, icon: 'check' },
  { label: '延迟告警', value: '3', unit: '条', delta: '较昨日 -2', tone: 'amber' as Tone, icon: 'alert' },
];

export type Service = {
  id: string; name: string; desc: string; type: string; connType: string;
  metaStatus: string; modifier: string; modified: string;
  category?: 'db' | 'mq' | 'lake'; org?: string; replica?: boolean; authorized?: string[];
};

export const services: Service[] = [
  { id: 'S01', name: 'ih_in_inquiry_center_source', desc: '住院问询中心源库', type: 'mysql', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-03 16:29', category: 'db', org: '重医附二院', replica: true, authorized: ['重医附二院'] },
  { id: 'S02', name: 'his_dm_prod_source', desc: 'HIS 达梦生产库', type: 'dameng', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-05 10:18', category: 'db', org: '两江医院', replica: true, authorized: ['两江医院', '重医附二院'] },
  { id: 'S03', name: 'emr_kingbase_source', desc: 'EMR 金仓临床库', type: 'kingbase', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-04 15:40', category: 'db', org: '渝北人民医院', replica: true, authorized: ['渝北人民医院'] },
  { id: 'S04', name: 'lis_opengauss_source', desc: 'LIS openGauss 库', type: 'opengauss', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-03 09:22', category: 'db', org: '两江医院', replica: false, authorized: ['两江医院'] },
  { id: 'S05', name: 'mis_bsp_MIS_BSP_source', desc: 'BSP 基础服务平台', type: 'oracle', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-07-31 08:07', category: 'db', org: '重医附二院', replica: true, authorized: ['重医附二院'] },
  { id: 'S06', name: 'cdc_kafka_cluster', desc: 'CDC 变更消息总线', type: 'kafka', connType: 'mq', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-06 11:05', category: 'mq', org: '平台', replica: false, authorized: ['重医附二院', '两江医院', '渝北人民医院'] },
  { id: 'S07', name: 'cdc_pulsar_bus', desc: '实时捕获 Pulsar 集群', type: 'pulsar', connType: 'mq', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-02 16:30', category: 'mq', org: '平台', replica: false, authorized: ['重医附二院', '两江医院'] },
  { id: 'S08', name: 'lakehouse_ods_endpoint', desc: '湖仓 ODS 数据端', type: 'doris', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-08-01 14:12', category: 'lake', org: '平台', replica: false, authorized: ['重医附二院', '两江医院', '渝北人民医院', '两江疾控'] },
  { id: 'S09', name: 'pacs_archive_source', desc: 'PACS 影像归档库', type: 'mysql', connType: 'odbc', metaStatus: '同步中', modifier: 'dp_admin', modified: '2026-07-28 17:40', category: 'db', org: '重医附二院', replica: true, authorized: ['重医附二院'] },
  { id: 'S10', name: 'emr_clinical_source', desc: 'EMR 临床源库', type: 'sqlserver', connType: 'jdbc', metaStatus: '已完成', modifier: 'dp_admin', modified: '2026-07-28 11:12', category: 'db', org: '渝北人民医院', replica: true, authorized: ['渝北人民医院'] },
];

export type Channel = {
  id: string; name: string; source: string; target: string; type: string;
  status: string; owner: string; updated: string; desc: string;
  deployMode?: '前置模式' | '集中模式'; running?: boolean; failReason?: string; org?: string;
};

export const channels: Channel[] = [
  { id: 'C01', name: 'ods_cis_his_init', source: 'cis_his_CISDB_HIS_DY', target: 'ods_cis_his_target', type: '静态数据', status: '正常', owner: 'dp_admin', updated: '2026-07-01 16:25', desc: 'HIS 全量初始化通道', deployMode: '集中模式', running: true, org: '重医附二院' },
  { id: 'C02', name: 'ods_cva_init', source: 'cva_EMERHosp_source', target: 'ods_cva_target', type: '静态数据', status: '正常', owner: 'dp_admin', updated: '2026-06-18 14:12', desc: '急诊系统全量通道', deployMode: '集中模式', running: true, org: '重医附二院' },
  { id: 'C03', name: 'ods_lis60_PROD', source: 'lis_PROD_DBLIS60_source', target: 'ods_lis60_target', type: '静态数据', status: '正常', owner: 'dp_admin', updated: '2026-06-08 18:41', desc: 'LIS 60 生产库通道', deployMode: '前置模式', running: true, org: '两江医院' },
  { id: 'C04', name: 'ods_tj_init', source: 'tj_PEIS_source', target: 'ods_tj_target', type: '静态数据', status: '正常', owner: 'dp_admin', updated: '2026-05-13 11:08', desc: '体检系统通道', deployMode: '集中模式', running: true, org: '两江妇幼' },
  { id: 'C05', name: 'his_patient_cdc', source: 'his_dm_prod_source', target: 'ods_his.patient', type: 'CDC同步', status: '正常', owner: 'dp_admin', updated: '2026-08-06 12:10', desc: '达梦 HIS 患者 CDC', deployMode: '前置模式', running: true, org: '两江医院' },
  { id: 'C06', name: 'emr_visit_flinkcdc', source: 'emr_kingbase_source', target: 'ods_emr.visit', type: 'FlinkCDC同步', status: '正常', owner: 'dp_admin', updated: '2026-08-06 11:40', desc: '金仓 EMR 就诊实时同步', deployMode: '集中模式', running: true, org: '渝北人民医院' },
  { id: 'C07', name: 'lis_report_cdc', source: 'lis_opengauss_source', target: 'ods_lis.lab_report', type: 'CDC同步', status: '已暂停', owner: 'dp_admin', updated: '2026-08-06 09:15', desc: 'openGauss 检验报告 CDC', deployMode: '前置模式', running: false, failReason: '', org: '两江医院' },
  { id: 'C08', name: 'ods_fml_init', source: 'fml_dblogs_source', target: 'ods_fml_target', type: '静态数据', status: '正常', owner: 'dp_admin', updated: '2026-04-03 16:22', desc: 'FML 日志通道', deployMode: '集中模式', running: true, org: '重医附二院' },
  { id: 'C09', name: 'pacs_study_cdc', source: 'pacs_archive_source', target: 'ods_ris.study', type: 'FlinkCDC同步', status: '异常', owner: 'dp_admin', updated: '2026-08-06 13:58', desc: 'PACS 检查记录 CDC', deployMode: '前置模式', running: false, failReason: '源端 binlog 位点丢失，需重定位后启动', org: '重医附二院' },
  { id: 'C10', name: 'ods_cis_sync', source: 'cis_CISDB_source', target: 'ods_cis_target', type: 'FlinkCDC同步', status: '延迟', owner: 'dp_admin', updated: '2026-04-03 10:26', desc: 'HIS 增量 CDC 同步', deployMode: '集中模式', running: true, org: '重医附二院' },
  { id: 'C11', name: 'ph_htn_cdc', source: 'ph_kingbase_source', target: 'ods_ph.hypertension', type: 'CDC同步', status: '启停失败', owner: 'dp_admin', updated: '2026-08-06 14:02', desc: '公卫高血压专档 CDC', deployMode: '前置模式', running: false, failReason: '前置节点网络单向策略未放行 9092 端口', org: '两江疾控' },
];

export type CollectConfig = {
  id: string; name: string; flow: string; channel: string; channelInfo: string;
  mode: string; tables: number; frequency: string; status: string; owner: string;
  updated: string; cron: string;
};

export const collectConfigs: CollectConfig[] = [
  { id: 'CFG-001', name: 'ods_cis_his_init', flow: '全量数据导入', channel: 'ods_cis_his_init', channelInfo: 'cisDB_HIS_DY → ods_cis_his', mode: '重入', tables: 91, frequency: '单次执行', status: '已启用', owner: 'dp_admin', updated: '2026-08-06 14:20', cron: '—' },
  { id: 'CFG-002', name: 'ods_emr_cpoe_sync', flow: '增量数据同步', channel: 'ods_cis_sync', channelInfo: 'CISDB → ods_emr', mode: '重入', tables: 64, frequency: '周期执行 30min', status: '运行中', owner: 'dp_admin', updated: '2026-08-06 14:10', cron: '0 */30 * * * ?' },
  { id: 'CFG-003', name: 'ods_lis_report_init', flow: '全量数据导入', channel: 'ods_lis60_PROD', channelInfo: 'LIS60 → ods_lis', mode: '重入', tables: 48, frequency: '单次执行', status: '已启用', owner: 'dp_admin', updated: '2026-08-05 22:00', cron: '—' },
  { id: 'CFG-004', name: 'ods_pacs_study_sync', flow: '增量数据同步', channel: 'ods_cis_sync', channelInfo: 'PACSDB → ods_pacs', mode: '重入', tables: 36, frequency: '周期执行 1h', status: '已启用', owner: 'dp_admin', updated: '2026-08-05 18:30', cron: '0 0 * * * ?' },
  { id: 'CFG-005', name: 'ods_hrp_cost_sync', flow: '全量数据导入', channel: 'ods_hyy_mysql_init', channelInfo: 'HRPDB → ods_hrp', mode: '重入', tables: 28, frequency: '周期执行 1d', status: '异常', owner: 'dp_admin', updated: '2026-08-05 23:45', cron: '0 0 2 * * ?' },
  { id: 'CFG-006', name: 'ods_amb_surgery_sync', flow: '增量数据同步', channel: 'ods_cis_sync', channelInfo: 'AMSDB → ods_amb', mode: '重入', tables: 42, frequency: '周期执行 30min', status: '运行中', owner: 'dp_admin', updated: '2026-08-05 15:20', cron: '0 */30 * * * ?' },
  { id: 'CFG-007', name: 'ods_bi_report_sync', flow: '全量数据导入', channel: 'ods_cva_init', channelInfo: 'BI → ods_bi', mode: '删除', tables: 18, frequency: '周期执行 1d', status: '已启用', owner: 'dp_admin', updated: '2026-08-04 11:00', cron: '0 30 1 * * ?' },
  { id: 'CFG-008', name: 'ods_cdr_patient_sync', flow: '增量数据同步', channel: 'ods_cis_sync', channelInfo: 'CDR → ods_cdr', mode: '重入', tables: 26, frequency: '周期执行 10min', status: '已启用', owner: 'dp_admin', updated: '2026-08-04 09:40', cron: '0 */10 * * * ?' },
  { id: 'CFG-009', name: 'ods_peis_report_init', flow: '全量数据导入', channel: 'ods_tj_init', channelInfo: 'PEIS → ods_peis', mode: '重入', tables: 22, frequency: '单次执行', status: '已停用', owner: 'dp_admin', updated: '2026-08-01 16:18', cron: '—' },
  { id: 'CFG-010', name: 'ods_insurance_settle_sync', flow: '增量数据同步', channel: 'ods_hyy_init', channelInfo: 'YB → ods_yb', mode: '重入', tables: 16, frequency: '周期执行 1d', status: '已启用', owner: 'dp_admin', updated: '2026-07-31 10:05', cron: '0 0 3 * * ?' },
];

export const configTables = [
  { name: 'dbo.EMR_BLK', label: '病历主表', rows: '2,860,410', selected: false },
  { name: 'dbo.EMR_CPOE_BA_FB', label: '医嘱附表', rows: '8,426,000', selected: false },
  { name: 'dbo.EMR_CPOE_BA_SSPYJK', label: '手术医嘱表', rows: '1,286,400', selected: false },
  { name: 'dbo.EMR_CPOE_BA_SSK', label: '手术记录表', rows: '1,842,300', selected: true },
  { name: 'dbo.EMR_CPOE_BA_SYK', label: '麻醉记录表', rows: '1,840,200', selected: true },
  { name: 'dbo.EMR_CPOE_BA_YEK', label: '医嘱执行表', rows: '28,426,910', selected: true },
  { name: 'dbo.EMR_CPOE_BA_BLZDK', label: '病历诊断表', rows: '3,284,600', selected: false },
  { name: 'dbo.EMR_CPOE_BA_ZLKK', label: '诊疗项目表', rows: '862,400', selected: false },
];

export const reconcileRules = [
  { id: 'RC-001', name: 'ods_sst_yz_全量对账', type: '数据量对账', source: 'sst_yz_mjsvz12yz_source', target: 'ods_sst_yz_target', host: '192.168.242.45', cron: '单次执行', auto: '否', tables: 160, owner: 'dp_admin', updated: '2026-07-31 17:28', status: '一致', diff: 0 },
  { id: 'RC-002', name: 'ods_dmt_全量对账', type: '数据量对账', source: 'dmt_order_center_source', target: 'ods_dmt_target', host: '192.168.242.45', cron: '单次执行', auto: '否', tables: 54, owner: 'dp_admin', updated: '2026-07-26 09:27', status: '差异', diff: 12 },
  { id: 'RC-003', name: 'ods_cis_data_his_全量对账', type: '数据量对账', source: 'cis_his_CISDB_HIS_DY_source', target: 'ods_cis_data_his_target', host: '192.168.242.45', cron: '单次执行', auto: '否', tables: 86, owner: 'dp_admin', updated: '2026-07-04 09:11', status: '一致', diff: 0 },
  { id: 'RC-004', name: 'ods_cis_his_全量对账', type: '数据量对账', source: 'cis_HIS_DY_source', target: 'ods_cis_his_target', host: '192.168.242.45', cron: '单次执行', auto: '否', tables: 91, owner: 'dp_admin', updated: '2026-06-16 13:25', status: '一致', diff: 0 },
  { id: 'RC-005', name: 'ods_emr_全量对账', type: '数据量对账', source: 'emr_clinical_source', target: 'ods_emr_target', host: '192.168.242.46', cron: '每天 02:00', auto: '是', tables: 64, owner: 'dp_admin', updated: '2026-06-12 10:40', status: '一致', diff: 0 },
  { id: 'RC-006', name: 'ods_lis_全量对账', type: '数据量对账', source: 'lis_prod_source', target: 'ods_lis_target', host: '192.168.242.46', cron: '每天 03:00', auto: '是', tables: 48, owner: 'dp_admin', updated: '2026-06-03 18:22', status: '差异', diff: 6 },
  { id: 'RC-007', name: 'ods_pacs_全量对账', type: '数据量对账', source: 'pacs_archive_source', target: 'ods_pacs_target', host: '192.168.242.47', cron: '每天 04:00', auto: '是', tables: 36, owner: 'dp_admin', updated: '2026-05-28 09:18', status: '一致', diff: 0 },
  { id: 'RC-008', name: 'ods_hrp_全量对账', type: '数据量对账', source: 'hrp_source', target: 'ods_hrp_target', host: '192.168.242.47', cron: '单次执行', auto: '否', tables: 28, owner: 'dp_admin', updated: '2026-05-20 14:06', status: '差异', diff: 3 },
];

export const runTasks = [
  { id: 'RUN-20260806-1286', config: 'ods_emr_cpoe_sync', type: '增量同步', started: '2026-08-06 14:20:12', duration: '2m 18s', rows: '128,642', status: '运行中', progress: 68, operator: 'system' },
  { id: 'RUN-20260806-1285', config: 'ods_amb_surgery_sync', type: '增量同步', started: '2026-08-06 14:15:04', duration: '1m 42s', rows: '18,420', status: '成功', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1284', config: 'ods_cdr_patient_sync', type: '增量同步', started: '2026-08-06 14:10:08', duration: '4m 06s', rows: '42,186', status: '成功', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1283', config: 'ods_pacs_study_sync', type: '增量同步', started: '2026-08-06 14:00:02', duration: '6m 12s', rows: '6,842', status: '成功', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1282', config: 'ods_hrp_cost_sync', type: '全量同步', started: '2026-08-06 13:40:00', duration: '18m 44s', rows: '862,410', status: '失败', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1281', config: 'ods_lis_report_init', type: '全量同步', started: '2026-08-06 13:20:00', duration: '22m 10s', rows: '42,860,410', status: '成功', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1280', config: 'ods_insurance_settle_sync', type: '增量同步', started: '2026-08-06 13:00:01', duration: '3m 28s', rows: '8,642', status: '成功', progress: 100, operator: 'system' },
  { id: 'RUN-20260806-1279', config: 'ods_bi_report_sync', type: '全量同步', started: '2026-08-06 12:30:00', duration: '12m 06s', rows: '286,420', status: '成功', progress: 100, operator: 'dp_admin' },
  { id: 'RUN-20260806-1278', config: 'ods_cis_his_init', type: '全量同步', started: '2026-08-06 11:00:00', duration: '48m 20s', rows: '12,846,200', status: '成功', progress: 100, operator: 'dp_admin' },
  { id: 'RUN-20260806-1277', config: 'ods_emr_cpoe_sync', type: '增量同步', started: '2026-08-06 10:30:00', duration: '2m 06s', rows: '116,280', status: '成功', progress: 100, operator: 'system' },
];

export const hosts = [
  { id: 'H01', hostname: 'med-data-prod-01', ip: '192.168.242.41', role: '数据采集控制机', cpu: 42, mem: 68, disk: 54, status: '在线', uptime: '186 天' },
  { id: 'H02', hostname: 'med-data-prod-02', ip: '192.168.242.42', role: '数据生产服务器', cpu: 68, mem: 74, disk: 62, status: '在线', uptime: '186 天' },
  { id: 'H03', hostname: 'med-data-prod-03', ip: '192.168.242.43', role: '数据生产服务器', cpu: 54, mem: 62, disk: 58, status: '在线', uptime: '186 天' },
  { id: 'H04', hostname: 'med-data-prod-04', ip: '192.168.242.44', role: 'Hadoop 节点', cpu: 76, mem: 82, disk: 71, status: '在线', uptime: '192 天' },
  { id: 'H05', hostname: 'med-data-prod-05', ip: '192.168.242.45', role: '采集执行节点', cpu: 38, mem: 46, disk: 44, status: '在线', uptime: '186 天' },
  { id: 'H06', hostname: 'med-data-prod-06', ip: '192.168.242.46', role: '采集执行节点', cpu: 12, mem: 28, disk: 39, status: '维护中', uptime: '—' },
  { id: 'H07', hostname: 'med-data-prod-07', ip: '192.168.242.47', role: 'ClickHouse 节点', cpu: 58, mem: 66, disk: 78, status: '在线', uptime: '142 天' },
  { id: 'H08', hostname: 'med-data-prod-08', ip: '192.168.242.48', role: 'Web 应用服务器', cpu: 24, mem: 36, disk: 32, status: '在线', uptime: '186 天' },
];

export const syncDelays = [
  { source: 'ods_his_hosmart', target: 'his_HOSmart_source', delay: '12 分钟', level: 'warn' },
  { source: 'ods_hl_nmgh', target: 'SmartHIS_nmgh_source', delay: '28 分钟', level: 'warn' },
  { source: 'ods_icu', target: 'ICU_SmartCare_source', delay: '34 分钟', level: 'bad' },
  { source: 'ods_his', target: 'THIS4_ZS_source', delay: '2 分钟', level: 'ok' },
  { source: 'ods_oa', target: 'OA_ecology1_source', delay: '4 分钟', level: 'ok' },
  { source: 'ods_peis', target: 'PEIS_source', delay: '8 分钟', level: 'ok' },
  { source: 'ods_pacs', target: 'PACS_source', delay: '18 分钟', level: 'warn' },
  { source: 'ods_emr', target: 'EMR_source', delay: '3 分钟', level: 'ok' },
];

export const alerts = [
  { id: 'AL-2086', title: 'ods_hrp_cost_sync 同步任务失败', level: '严重', type: '任务失败', source: 'ods_hrp_cost_sync', time: '2026-08-06 13:58', status: '未读', owner: 'dp_admin' },
  { id: 'AL-2085', title: 'ICU_SmartCare 数据延迟超过 30 分钟', level: '严重', type: '延迟告警', source: 'ods_icu', time: '2026-08-06 13:40', status: '未读', owner: 'dp_admin' },
  { id: 'AL-2084', title: '影像检查报告关联完整率低于 96%', level: '警告', type: '质量告警', source: 'ods_pacs_study', time: '2026-08-06 13:20', status: '已读', owner: '周宁' },
  { id: 'AL-2083', title: '检验结果入仓延迟超过 2 小时', level: '警告', type: '延迟告警', source: 'ods_lis_report', time: '2026-08-06 12:40', status: '处理中', owner: '赵倩' },
  { id: 'AL-2082', title: 'ods_dmt_全量对账发现 12 条数据差异', level: '警告', type: '对账告警', source: 'RC-002', time: '2026-08-06 11:28', status: '已读', owner: 'dp_admin' },
  { id: 'AL-2081', title: '采集执行节点 med-data-prod-06 进入维护', level: '提示', type: '主机告警', source: 'H06', time: '2026-08-06 10:00', status: '已忽略', owner: '运维组' },
  { id: 'AL-2080', title: 'ods_his_outpatient 重复就诊记录 92 条', level: '警告', type: '质量告警', source: 'ods_his_outpatient', time: '2026-08-06 09:12', status: '已读', owner: '王思远' },
];

export const auditLogs = [
  { id: 'LG-90286', user: 'dp_admin', action: '修改采集配置', object: 'ods_emr_cpoe_sync', ip: '192.168.242.41', time: '2026-08-06 14:20:12', result: '成功', detail: '更新执行频率为 30 分钟' },
  { id: 'LG-90285', user: '张敏', action: '发布指标', object: '门诊预约爽约人次', ip: '192.168.242.88', time: '2026-08-06 14:12:40', result: '成功', detail: '版本 V3.2' },
  { id: 'LG-90284', user: 'dp_admin', action: '执行对账', object: 'RC-002 ods_dmt_全量对账', ip: '192.168.242.41', time: '2026-08-06 13:30:06', result: '成功', detail: '差异 12 条' },
  { id: 'LG-90283', user: '周宁', action: '处理质量问题', object: 'QI-2086 影像检查报告关联', ip: '192.168.242.92', time: '2026-08-06 13:22:18', result: '成功', detail: '标记为处理中' },
  { id: 'LG-90282', user: '赵倩', action: '导出查询结果', object: 'ods_lis_report', ip: '192.168.242.95', time: '2026-08-06 11:44:02', result: '成功', detail: '导出 10,000 行' },
  { id: 'LG-90281', user: 'system', action: '定时任务', object: 'ods_pacs_study_sync', ip: '192.168.242.47', time: '2026-08-06 11:00:00', result: '成功', detail: '同步 6,842 行' },
  { id: 'LG-90280', user: 'dp_admin', action: '新增服务注册', object: 'pacs_archive_source', ip: '192.168.242.41', time: '2026-08-05 17:40:26', result: '成功', detail: 'MySQL 连接' },
  { id: 'LG-90279', user: '李建华', action: '登录系统', object: '—', ip: '192.168.242.86', time: '2026-08-05 16:02:10', result: '成功', detail: '账号密码登录' },
];

export const users = [
  { id: 'U001', account: 'admin', name: '系统管理员', dept: '信息中心', role: '超级管理员', phone: '138****6086', email: 'admin@meddata.cn', status: '启用', lastLogin: '2026-08-06 14:18' },
  { id: 'U002', account: 'dp_admin', name: '数据平台管理员', dept: '信息中心', role: '数据管理员', phone: '139****2042', email: 'dp_admin@meddata.cn', status: '启用', lastLogin: '2026-08-06 14:20' },
  { id: 'U003', account: 'zhangmin', name: '张敏', dept: '信息中心', role: '指标管理员', phone: '136****8820', email: 'zhangmin@meddata.cn', status: '启用', lastLogin: '2026-08-06 14:12' },
  { id: 'U004', account: 'lijianhua', name: '李建华', dept: '信息中心', role: '数据开发', phone: '135****7702', email: 'lijh@meddata.cn', status: '启用', lastLogin: '2026-08-06 13:50' },
  { id: 'U005', account: 'zhaoqian', name: '赵倩', dept: '检验科', role: '数据分析师', phone: '137****2206', email: 'zhaoqian@meddata.cn', status: '启用', lastLogin: '2026-08-06 11:44' },
  { id: 'U006', account: 'zhouning', name: '周宁', dept: '放射科', role: '数据分析师', phone: '138****9910', email: 'zhouning@meddata.cn', status: '启用', lastLogin: '2026-08-06 13:22' },
  { id: 'U007', account: 'liuyiming', name: '刘一鸣', dept: '财务处', role: '业务用户', phone: '139****3312', email: 'liuym@meddata.cn', status: '启用', lastLogin: '2026-08-05 17:30' },
  { id: 'U008', account: 'wangsiyuan', name: '王思远', dept: '门诊部', role: '业务用户', phone: '136****6648', email: 'wangsy@meddata.cn', status: '停用', lastLogin: '2026-07-28 09:10' },
  { id: 'U009', account: 'chenxiao', name: '陈晓', dept: '医务处', role: '数据审核员', phone: '135****1188', email: 'chenxiao@meddata.cn', status: '启用', lastLogin: '2026-08-06 10:08' },
  { id: 'U010', account: 'audit_viewer', name: '审计只读账号', dept: '审计处', role: '审计员', phone: '—', email: 'audit@meddata.cn', status: '启用', lastLogin: '2026-08-04 15:20' },
];

export const roles = [
  { id: 'admin', name: 'admin', desc: '系统超级管理员，拥有全部功能与数据权限', level: '5级-机密', users: 2, apps: 4, status: '启用', updated: '2026-08-06 14:18' },
  { id: 'data_admin', name: '数据管理员', desc: '负责数据源、采集通道与数据资产管理', level: '4级-重要', users: 6, apps: 2, status: '启用', updated: '2026-08-05 16:20' },
  { id: 'indicator_admin', name: '指标管理员', desc: '负责指标定义、发布与指标图谱维护', level: '3级-敏感', users: 8, apps: 2, status: '启用', updated: '2026-08-04 10:12' },
  { id: 'analyst', name: '数据分析师', desc: '数据查询、数据集与可视化分析', level: '3级-敏感', users: 26, apps: 2, status: '启用', updated: '2026-08-02 15:40' },
  { id: 'business', name: '业务用户', desc: '查看授权范围内的指标与报表', level: '2级-普通', users: 86, apps: 2, status: '启用', updated: '2026-07-28 09:30' },
  { id: 'auditor', name: '审计员', desc: '只读查看操作日志与数据访问记录', level: '4级-重要', users: 3, apps: 1, status: '启用', updated: '2026-07-20 11:20' },
];

export const permissionApps = [
  { key: 'platform', name: '新一代大数据平台', modules: [
    { key: 'home', name: '首页' },
    { key: 'asset', name: '数据资产', children: [
      { key: 'asset.view', name: '数据资产查看' }, { key: 'asset.manage', name: '数据资产管理' },
      { key: 'asset.column', name: '库表字段属性编辑' }, { key: 'asset.sql', name: 'SQL 资产' },
      { key: 'asset.delete', name: 'SQL 资产删除' }, { key: 'asset.desc', name: '库表说明编辑' },
    ]},
    { key: 'quality', name: '数据质量', children: [
      { key: 'quality.report', name: '质量报告' }, { key: 'quality.rule', name: '质量规则' },
      { key: 'quality.issue', name: '质量问题处理' },
    ]},
    { key: 'standard', name: '数据标准', children: [
      { key: 'standard.element', name: '数据元管理' }, { key: 'standard.domain', name: '值域管理' },
    ]},
    { key: 'explore', name: '数据探索', children: [
      { key: 'explore.query', name: '数据查询' }, { key: 'explore.dataset', name: '数据集管理' },
      { key: 'explore.dev', name: '数据开发' },
    ]},
    { key: 'indicator', name: '指标中台', children: [
      { key: 'indicator.list', name: '指标列表' }, { key: 'indicator.publish', name: '指标发布' },
      { key: 'indicator.model', name: '模型管理' }, { key: 'indicator.subscribe', name: '指标订阅' },
    ]},
  ]},
  { key: 'hrp', name: '医院运营管理平台(PC)', modules: [
    { key: 'hrp.dashboard', name: '运营首页' }, { key: 'hrp.report', name: '运营报表' },
    { key: 'hrp.cost', name: '成本核算' }, { key: 'hrp.budget', name: '预算管理' },
  ]},
  { key: 'mobile', name: '医院运营管理平台(移动端)', modules: [
    { key: 'mobile.home', name: '移动首页' }, { key: 'mobile.approval', name: '移动审批' },
  ]},
  { key: 'clinical', name: '临床 360', modules: [
    { key: 'clinical.view', name: '患者全景视图' }, { key: 'clinical.visit', name: '就诊时间轴' },
    { key: 'clinical.lab', name: '检验检查' },
  ]},
];

export const rolePermissions: Record<string, string[]> = {
  admin: ['home', 'asset', 'asset.view', 'asset.manage', 'asset.column', 'asset.sql', 'asset.delete', 'asset.desc', 'quality', 'quality.report', 'quality.rule', 'quality.issue', 'standard', 'standard.element', 'standard.domain', 'explore', 'explore.query', 'explore.dataset', 'explore.dev', 'indicator', 'indicator.list', 'indicator.publish', 'indicator.model', 'indicator.subscribe', 'hrp.dashboard', 'hrp.report', 'hrp.cost', 'hrp.budget', 'mobile.home', 'mobile.approval', 'clinical.view', 'clinical.visit', 'clinical.lab'],
  data_admin: ['home', 'asset', 'asset.view', 'asset.manage', 'asset.column', 'quality', 'quality.report', 'quality.rule', 'explore', 'explore.query', 'explore.dataset'],
  indicator_admin: ['home', 'asset', 'asset.view', 'indicator', 'indicator.list', 'indicator.publish', 'indicator.model', 'indicator.subscribe', 'quality.report'],
  analyst: ['home', 'asset.view', 'quality.report', 'explore.query', 'explore.dataset', 'indicator.list'],
  business: ['home', 'indicator.list', 'quality.report', 'hrp.dashboard', 'hrp.report'],
  auditor: ['home', 'asset.view', 'quality.report'],
};

export const environment = [
  { key: 'prod', name: '生产环境', desc: '承载全院数据采集与指标服务', nodes: 8, version: 'MedData v3.8.2', db: 'MySQL 8.0 / TiDB 6.5 / Hadoop 3.3', status: '运行中', since: '2025-01-18' },
  { key: 'pre', name: '预发布环境', desc: '版本验证与灰度发布', nodes: 3, version: 'MedData v3.9.0-rc1', db: 'MySQL 8.0 / TiDB 6.5', status: '运行中', since: '2026-06-02' },
  { key: 'test', name: '测试环境', desc: '功能联调与自动化测试', nodes: 2, version: 'MedData v3.9.0-dev', db: 'MySQL 8.0', status: '运行中', since: '2026-07-12' },
];

export const monitorStats = {
  sync: { total: 134, normal: 100, delayed: 34, bad: 0 },
  reconcile: { total: 3696, normal: 3510, abnormal: 186, rate: 95 },
  indicator: { total: 2572, normal: 2486, abnormal: 86, rate: 96.7 },
};

export const volumeBySchema = [
  { label: 'ods_his', value: 82, display: '8.2 TB' },
  { label: 'ods_emr', value: 64, display: '6.4 TB' },
  { label: 'ods_lis', value: 58, display: '5.8 TB' },
  { label: 'ods_pacs', value: 42, display: '4.2 TB' },
  { label: 'dwd', value: 28, display: '2.8 TB' },
  { label: 'dim', value: 12, display: '1.2 TB' },
  { label: 'hm / ads', value: 18, display: '1.8 TB' },
];
