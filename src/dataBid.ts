// 应标演示版数据：两江新区数智健康管理服务平台
export const bidStats = {
  orgs: 42, tables: 12846, records: '8.62 亿', indicators: 2572,
  today: '1.82 亿', quality: 95.6, rules: 486, docs: 126,
};

export const portalApps = [
  { key: 'collect', name: '采集监控', desc: '接入 · CDC · 任务', icon: 'activity', tone: 'blue', path: '/collection/overview' },
  { key: 'govern', name: '数据治理', desc: '标准 · 元数据 · 质量', icon: 'shield', tone: 'violet', path: '/center/quality' },
  { key: 'indicator', name: '指标中台', desc: '2,572 项指标', icon: 'gauge', tone: 'cyan', path: '/center/indicators' },
  { key: 'tag', name: '标签画像', desc: '人群 · 分群 · 服务', icon: 'tags', tone: 'amber', path: '/bid/tag-board' },
  { key: 'qc', name: '质控中心', desc: '五维质控 · 知识库', icon: 'shieldalert', tone: 'red', path: '/bid/qc-results' },
  { key: 'bi', name: '运营 BI', desc: '主题 · 报表 · 大屏', icon: 'chart', tone: 'green', path: '/center/dashboard' },
  { key: 'mpi', name: '居民主索引', desc: '主档案 · 相似度', icon: 'fingerprint', tone: 'blue', path: '/bid/main-archive' },
  { key: 'share', name: '共享服务', desc: 'API · 页面 · 流程', icon: 'network', tone: 'violet', path: '/center/marketplace' },
];

export const portalNews = [
  { tag: '政策', title: '国家卫生健康委印发《“十四五”全民健康信息化规划》', date: '08-05', hot: true },
  { tag: '通知', title: '关于开展 2026 年医疗健康数据质量提升专项行动的通知', date: '08-03', hot: true },
  { tag: '标准', title: '《卫生健康数据资源目录编制指南》正式发布', date: '07-30', hot: false },
  { tag: '动态', title: '两江新区数智健康管理服务平台完成首轮机构接入', date: '07-28', hot: false },
];

export const portalTodos = [
  { title: '公立医院绩效考核补充数据填报', from: '质管办', due: '今天 18:00', level: '高' },
  { title: '影像检查报告关联完整性异常待处理', from: '数据质量', due: '明天 12:00', level: '中' },
  { title: 'ods_hrp_cost_sync 同步失败待排查', from: '采集监控', due: '今天 16:00', level: '高' },
  { title: '7 月医疗服务月报审核', from: '医务处', due: '08-10', level: '中' },
  { title: '新增 3 项指标口径评审', from: '指标中台', due: '08-12', level: '低' },
];

export const portalFavorites = [
  { name: '门诊预约爽约人次', type: '指标', value: '1,284', unit: '人次', trend: '+12.6%' },
  { name: '住院床位使用率', type: '指标', value: '92.4', unit: '%', trend: '+1.8%' },
  { name: 'DRG 组数（CMI）', type: '指标', value: '1.08', unit: '—', trend: '+0.02' },
  { name: '影像报告及时率', type: '指标', value: '96.4', unit: '%', trend: '-0.6%' },
];

export const portalTrend = [
  { label: '01', value: 8620 }, { label: '02', value: 9240 }, { label: '03', value: 8960 },
  { label: '04', value: 9860 }, { label: '05', value: 10480 }, { label: '06', value: 11260 },
  { label: '07', value: 11980 }, { label: '08', value: 12846 },
];

// ── 数据目录 / 预览 ─────────────────────────────────────────────
export type CatalogTable = { id: string; schema: string; name: string; cn: string; rows: string; size: string; owner: string; updated: string; quality: number; layer: string; tags: string[] };

export const catalogSchemas = [
  { name: 'ods_his', label: 'HIS 业务库', count: 4280, tables: ['ods_his_patient', 'ods_his_outpatient', 'ods_his_inpatient', 'ods_his_orders', 'ods_his_charges'] },
  { name: 'ods_emr', label: 'EMR 电子病历', count: 3140, tables: ['ods_emr_diagnosis', 'ods_emr_cpoe_ba_ssk', 'ods_emr_discharge', 'ods_emr_surgery'] },
  { name: 'ods_lis', label: 'LIS 检验', count: 2162, tables: ['ods_lis_report', 'ods_lis_result', 'ods_lis_specimen'] },
  { name: 'ods_pacs', label: 'PACS 影像', count: 1845, tables: ['ods_pacs_study', 'ods_pacs_series', 'ods_pacs_report'] },
  { name: 'dwd', label: 'DWD 明细层', count: 1842, tables: ['dwd_fact_visit', 'dwd_fact_surgery', 'dwd_fact_charge'] },
  { name: 'dim', label: 'DIM 公共维度', count: 682, tables: ['dim_department', 'dim_doctor', 'dim_diagnosis'] },
];

export const catalogTables: CatalogTable[] = [
  { id: 'ods_his_patient', schema: 'ods_his', name: 'patient', cn: '患者基本信息', rows: '3,428,519', size: '2.4 GB', owner: '李建华', updated: '2026-08-06 14:12', quality: 98.6, layer: 'ODS', tags: ['核心', '主数据'] },
  { id: 'ods_his_outpatient', schema: 'ods_his', name: 'outpatient_visit', cn: '门诊就诊记录', rows: '9,842,116', size: '6.2 GB', owner: '王思远', updated: '2026-08-06 14:10', quality: 96.8, layer: 'ODS', tags: ['核心', '高频'] },
  { id: 'ods_his_inpatient', schema: 'ods_his', name: 'inpatient_visit', cn: '住院就诊记录', rows: '1,286,420', size: '1.8 GB', owner: '李建华', updated: '2026-08-06 14:12', quality: 97.9, layer: 'ODS', tags: ['核心'] },
  { id: 'ods_emr_cpoe_ba_ssk', schema: 'ods_emr', name: 'cpoe_order', cn: '电子病历医嘱', rows: '28,426,910', size: '12.8 GB', owner: '陈晓', updated: '2026-08-06 14:08', quality: 95.4, layer: 'ODS', tags: ['大字段'] },
  { id: 'ods_lis_report', schema: 'ods_lis', name: 'lab_report', cn: '检验报告主表', rows: '42,860,410', size: '18.4 GB', owner: '赵倩', updated: '2026-08-06 14:06', quality: 99.1, layer: 'ODS', tags: ['核心'] },
  { id: 'ods_pacs_study', schema: 'ods_pacs', name: 'study_index', cn: '影像检查主表', rows: '4,628,882', size: '9.8 GB', owner: '周宁', updated: '2026-08-06 14:03', quality: 96.2, layer: 'ODS', tags: ['影像'] },
  { id: 'dwd_fact_visit', schema: 'dwd', name: 'fact_visit', cn: '就诊事实宽表', rows: '11,286,400', size: '8.6 GB', owner: '张敏', updated: '2026-08-06 13:50', quality: 99.2, layer: 'DWD', tags: ['核心', '指标底座'] },
  { id: 'dwd_fact_surgery', schema: 'dwd', name: 'fact_surgery', cn: '手术事实宽表', rows: '1,842,300', size: '4.2 GB', owner: '张敏', updated: '2026-08-06 13:48', quality: 98.8, layer: 'DWD', tags: ['核心'] },
  { id: 'dim_department', schema: 'dim', name: 'dim_department', cn: '科室公共维度', rows: '1,286', size: '12 MB', owner: '张敏', updated: '2026-08-06 10:20', quality: 99.6, layer: 'DIM', tags: ['公共维度'] },
  { id: 'ods_emr_diagnosis', schema: 'ods_emr', name: 'diagnosis', cn: '出院诊断', rows: '2,184,690', size: '3.1 GB', owner: '陈晓', updated: '2026-08-06 14:09', quality: 97.2, layer: 'ODS', tags: ['诊断'] },
  { id: 'ods_lis_result', schema: 'ods_lis', name: 'lab_result', cn: '检验结果明细', rows: '286,420,000', size: '64.2 GB', owner: '赵倩', updated: '2026-08-06 14:07', quality: 98.4, layer: 'ODS', tags: ['大字段'] },
  { id: 'ods_pacs_report', schema: 'ods_pacs', name: 'pacs_report', cn: '影像报告', rows: '4,286,410', size: '6.4 GB', owner: '周宁', updated: '2026-08-06 14:03', quality: 96.2, layer: 'ODS', tags: ['影像'] },
];

export const previewColumns = [
  { key: 'patient_id', label: 'patient_id', type: 'varchar(32)', pk: true },
  { key: 'patient_name', label: 'patient_name', type: 'varchar(64)' },
  { key: 'gender', label: 'gender', type: 'char(1)' },
  { key: 'age', label: 'age', type: 'int' },
  { key: 'id_card', label: 'id_card_no', type: 'varchar(18)' },
  { key: 'phone', label: 'phone_no', type: 'varchar(20)' },
  { key: 'dept_name', label: 'dept_name', type: 'varchar(64)' },
  { key: 'visit_count', label: 'visit_count', type: 'int' },
  { key: 'last_visit', label: 'last_visit_time', type: 'datetime' },
];

export const previewRows = [
  ['100248601', '张*华', '男', 58, '5001**********12', '138****6086', '心血管内科', 12, '2026-08-05 09:24'],
  ['100248602', '李*芳', '女', 51, '5001**********28', '139****2042', '消化内科', 8, '2026-08-05 10:12'],
  ['100248603', '王*明', '男', 44, '5001**********76', '136****8820', '骨科', 5, '2026-08-04 15:40'],
  ['100248604', '陈*', '女', 36, '5001**********31', '137****2206', '呼吸内科', 3, '2026-08-04 11:08'],
  ['100248605', '刘*军', '男', 69, '5001**********44', '138****9910', '神经内科', 16, '2026-08-03 16:22'],
  ['100248606', '赵*婷', '女', 30, '5001**********57', '139****3312', '皮肤科', 2, '2026-08-03 09:34'],
  ['100248607', '周*', '男', 55, '5001**********63', '135****1188', '普外科', 9, '2026-08-02 14:50'],
  ['100248608', '吴*红', '女', 63, '5001**********82', '136****6648', '内分泌科', 14, '2026-08-02 08:46'],
  ['100248609', '郑*平', '男', 47, '5001**********05', '135****7702', '泌尿外科', 6, '2026-08-01 16:12'],
  ['100248610', '孙*梅', '女', 72, '5001**********19', '137****9021', '老年医学科', 11, '2026-08-01 10:30'],
];

// ── 实时通道 ────────────────────────────────────────────────────
export const realtimeChannels = [
  { id: 'CDC-001', name: 'his_patient_cdc', source: 'HIS 生产库', target: 'ods_his.patient', type: 'MySQL CDC', status: '运行中', delay: '8 秒', qps: 126, today: '1,286,420', lag: '0', since: '2026-06-01' },
  { id: 'CDC-002', name: 'emr_order_cdc', source: 'EMR 临床库', target: 'ods_emr.cpoe_order', type: 'SQL Server CDC', status: '运行中', delay: '12 秒', qps: 86, today: '862,410', lag: '0', since: '2026-06-12' },
  { id: 'CDC-003', name: 'lis_report_cdc', source: 'LIS 生产库', target: 'ods_lis.lab_report', type: 'Oracle CDC', status: '运行中', delay: '5 秒', qps: 62, today: '486,200', lag: '0', since: '2026-05-20' },
  { id: 'CDC-004', name: 'pacs_study_cdc', source: 'PACS 归档库', target: 'ods_pacs.study_index', type: 'MySQL CDC', status: '延迟', delay: '3 分钟', qps: 18, today: '42,680', lag: '2,186', since: '2026-04-08' },
  { id: 'CDC-005', name: 'hrp_cost_cdc', source: 'HRP 运营库', target: 'ods_hrp.cost_detail', type: 'Oracle CDC', status: '已暂停', delay: '—', qps: 0, today: '0', lag: '—', since: '2026-03-15' },
];

export const cdcEvents = [
  ['14:20:12.326', 'INSERT', 'patient', '100248611', '新增患者主索引', '成功'],
  ['14:20:11.842', 'UPDATE', 'patient', '100248518', '更新联系电话', '成功'],
  ['14:20:10.118', 'INSERT', 'outpatient_visit', 'V202608061286', '新增门诊就诊', '成功'],
  ['14:20:08.604', 'UPDATE', 'outpatient_visit', 'V202608061102', '更新预约状态', '成功'],
  ['14:20:06.220', 'DELETE', 'patient_card', 'C0001286', '注销就诊卡', '成功'],
  ['14:20:04.912', 'INSERT', 'lab_report', 'L202608061028', '新增检验报告', '成功'],
  ['14:20:02.008', 'UPDATE', 'lab_report', 'L202608061024', '报告审核发布', '成功'],
];

export const delaySeries = [
  { label: '14:00', value: 6 }, { label: '14:05', value: 8 }, { label: '14:10', value: 5 },
  { label: '14:15', value: 12 }, { label: '14:20', value: 8 }, { label: '14:25', value: 9 },
  { label: '14:30', value: 7 }, { label: '14:35', value: 13 }, { label: '14:40', value: 8 },
];

// ── 质控流程 ────────────────────────────────────────────────────
export type QCNode = { id: string; label: string; sub: string; x: number; y: number; type: 'source' | 'std' | 'rule' | 'branch' | 'sink'; input?: number; output?: number; fail?: number; status?: string };
export const qcNodes: QCNode[] = [
  { id: 'src', label: '数据接入', sub: 'ODS · 128.6 万行', x: 20, y: 190, type: 'source' },
  { id: 'std', label: '标准化', sub: '字典映射 · 去重', x: 165, y: 190, type: 'std' },
  { id: 'comp', label: '完整性校验', sub: '非空 / 主键 / 关联', x: 320, y: 80, type: 'rule' },
  { id: 'cons', label: '一致性校验', sub: '值域 / 逻辑 / 编码', x: 320, y: 300, type: 'rule' },
  { id: 'branch', label: '异常分流', sub: '按规则等级分流', x: 490, y: 190, type: 'branch' },
  { id: 'sink', label: '质控入库', sub: 'DWD · 合格数据', x: 650, y: 190, type: 'sink' },
];
export const qcEdges = [['src', 'std'], ['std', 'comp'], ['std', 'cons'], ['comp', 'branch'], ['cons', 'branch'], ['branch', 'sink']];

export const qcExceptions = [
  ['EX-2086', 'patient_id 为空', 'ods_his.patient', '完整性', '高', 128, '待处理'],
  ['EX-2085', 'gender_code 值域异常', 'ods_his.patient', '一致性', '中', 86, '待处理'],
  ['EX-2084', 'report_time 晚于入仓时间', 'ods_lis.lab_report', '及时性', '中', 42, '处理中'],
  ['EX-2083', 'dept_code 无法关联科室维度', 'dwd.fact_visit', '一致性', '低', 36, '已修复'],
  ['EX-2082', '身份证号校验位错误', 'ods_his.patient', '规范性', '高', 24, '待处理'],
];

export const qcInstitutions = [
  { name: '两江新区人民医院', score: 98.2, pass: 98.6 },
  { name: '两江新区中医院', score: 96.8, pass: 97.1 },
  { name: '人和社区卫生服务中心', score: 95.4, pass: 96.2 },
  { name: '鸳鸯社区卫生服务中心', score: 94.2, pass: 95.0 },
  { name: '大竹林社区卫生服务中心', score: 92.8, pass: 93.6 },
];

export const qcHeatmap = Array.from({ length: 7 }, (_, d) => Array.from({ length: 12 }, (_, m) => 88 + ((d * 7 + m * 3) % 11)));

export const qcTrend = [
  { label: '03', value: 94.2 }, { label: '04', value: 95.0 }, { label: '05', value: 94.6 },
  { label: '06', value: 95.8 }, { label: '07', value: 96.2 }, { label: '08', value: 96.7 },
];

// ── 知识库 / 标准文档 ──────────────────────────────────────────
export const knowledgeDocs = [
  { id: 'KB-001', name: '电子病历质控规范（2026 版）', type: '国家规范', version: 'V2.1', rules: 86, status: '已发布', owner: '质管办', updated: '2026-08-01' },
  { id: 'KB-002', name: '病案首页填写说明与质控规则', type: '行业规范', version: 'V3.0', rules: 64, status: '已发布', owner: '病案室', updated: '2026-07-28' },
  { id: 'KB-003', name: '检验结果逻辑校验规则集', type: '院内外标准', version: 'V1.8', rules: 42, status: '已发布', owner: '检验科', updated: '2026-07-22' },
  { id: 'KB-004', name: '临床指南：高血压诊疗规范', type: '临床指南', version: '2025', rules: 28, status: '已发布', owner: '心血管内科', updated: '2026-07-15' },
  { id: 'KB-005', name: '医学影像报告质控要点', type: '院内外标准', version: 'V1.2', rules: 36, status: '草稿', owner: '放射科', updated: '2026-08-04' },
  { id: 'KB-006', name: '妇幼健康数据质控规则', type: '行业规范', version: 'V2.0', rules: 32, status: '已发布', owner: '妇幼保健院', updated: '2026-06-30' },
];

export const aiRules = [
  { id: 'AI-001', text: '收缩压 >= 140 mmHg 且舒张压 >= 90 mmHg 时，高血压诊断与随访记录必须存在', source: '高血压诊疗规范 2025 · P18', confidence: 96, status: '待审核' },
  { id: 'AI-002', text: '血红蛋白检验值低于 60 g/L 时，必须存在输血或贫血相关诊断记录', source: '检验结果逻辑校验规则集 · 4.2', confidence: 91, status: '待审核' },
  { id: 'AI-003', text: '病案首页主要诊断编码必须与出院小结诊断一致，不一致时需填写说明', source: '病案首页填写说明 · 3.1', confidence: 88, status: '待审核' },
];

export const standardDocs = [
  { id: 'STD-01', name: '两江新区卫生健康标准规范体系-总体标准', type: '总体标准', version: 'V1.0', status: '已发布', owner: '数据治理办', updated: '2026-07-20', pages: 42 },
  { id: 'STD-02', name: '卫生健康业务术语标准', type: '业务标准', version: 'V1.2', status: '已发布', owner: '数据治理办', updated: '2026-07-22', pages: 68 },
  { id: 'STD-03', name: '监管业务管理制度', type: '业务标准', version: 'V1.0', status: '已发布', owner: '卫健委', updated: '2026-07-18', pages: 36 },
  { id: 'STD-04', name: '卫生健康业务编码标准', type: '业务标准', version: 'V2.0', status: '已发布', owner: '信息中心', updated: '2026-07-25', pages: 84 },
  { id: 'STD-05', name: '系统建设开发标准', type: '技术标准', version: 'V1.1', status: '已发布', owner: '信息中心', updated: '2026-07-15', pages: 52 },
  { id: 'STD-06', name: '系统集成技术标准', type: '技术标准', version: 'V1.0', status: '已发布', owner: '信息中心', updated: '2026-07-16', pages: 46 },
  { id: 'STD-07', name: '数据采集规范（一期升级版）', type: '技术标准', version: 'V2.3', status: '已发布', owner: '数据治理办', updated: '2026-08-01', pages: 92 },
  { id: 'STD-08', name: '数据共享交换信息标准', type: '技术标准', version: 'V1.4', status: '已发布', owner: '数据治理办', updated: '2026-07-28', pages: 58 },
  { id: 'STD-09', name: '外部系统交互标准', type: '技术标准', version: 'V1.0', status: '已发布', owner: '信息中心', updated: '2026-07-20', pages: 64 },
  { id: 'STD-10', name: '数据归集标准', type: '技术标准', version: 'V1.2', status: '审核中', owner: '数据治理办', updated: '2026-08-05', pages: 48 },
  { id: 'STD-11', name: '区域信息化项目管理标准', type: '管理标准', version: 'V1.0', status: '已发布', owner: '项目管理办', updated: '2026-07-12', pages: 32 },
  { id: 'STD-12', name: '平台运行维护服务保障办法', type: '管理标准', version: 'V1.1', status: '已发布', owner: '运维组', updated: '2026-07-14', pages: 40 },
];

// ── 评分模型 / 规则 ────────────────────────────────────────────
export const scoreDimensions = [
  { key: 'complete', name: '完整性', weight: 25, score: 98.2, color: '#6755F5' },
  { key: 'consistent', name: '一致性', weight: 20, score: 96.4, color: '#9587FF' },
  { key: 'standard', name: '规范性', weight: 20, score: 95.8, color: '#0891B2' },
  { key: 'timely', name: '及时性', weight: 20, score: 96.2, color: '#F59E0B' },
  { key: 'stable', name: '稳定性', weight: 15, score: 97.1, color: '#10B981' },
];

export const scoreModels = [
  { id: 'SM-001', name: '2026 年医疗机构数据质量考核', scope: '全部 42 家机构', tables: 386, cycle: '月', score: 96.8, last: '2026-08-01 02:00', status: '启用' },
  { id: 'SM-002', name: '三级医院病案首页专项', scope: '12 家三级医院', tables: 86, cycle: '季', score: 94.2, last: '2026-07-01 02:00', status: '启用' },
  { id: 'SM-003', name: '基层医疗机构公卫数据考核', scope: '30 家基层机构', tables: 126, cycle: '月', score: 97.6, last: '2026-08-01 02:00', status: '启用' },
  { id: 'SM-004', name: '妇幼健康数据专项评估', scope: '妇幼保健院', tables: 48, cycle: '季', score: 95.4, last: '2026-07-02 02:00', status: '停用' },
];

export const bidRules = [
  { id: 'BR-001', dim: '完整性', name: '患者主键非空', object: 'ods_his.patient', expr: 'patient_id IS NOT NULL', weight: 10, score: 99.2, status: '启用' },
  { id: 'BR-002', dim: '完整性', name: '就诊必填字段完整', object: 'dwd.fact_visit', expr: 'patient_id, visit_id, dept_code 非空', weight: 10, score: 98.6, status: '启用' },
  { id: 'BR-003', dim: '一致性', name: '科室编码可关联', object: 'dwd.fact_visit', expr: 'dept_code IN dim_department', weight: 8, score: 99.4, status: '启用' },
  { id: 'BR-004', dim: '一致性', name: '诊断编码符合 ICD-10', object: 'ods_emr.diagnosis', expr: 'diag_code IN icd10_dict', weight: 8, score: 97.8, status: '启用' },
  { id: 'BR-005', dim: '规范性', name: '身份证校验位正确', object: 'ods_his.patient', expr: '校验位 = 计算值', weight: 6, score: 99.1, status: '启用' },
  { id: 'BR-006', dim: '规范性', name: '手机号格式合规', object: 'ods_his.patient', expr: 'REGEXP(^1[3-9]\\d{9}$)', weight: 4, score: 98.4, status: '启用' },
  { id: 'BR-007', dim: '及时性', name: '检验报告 24h 内入仓', object: 'ods_lis.lab_report', expr: 'etl_time - report_time <= 24h', weight: 10, score: 96.2, status: '预警' },
  { id: 'BR-008', dim: '稳定性', name: '表行数波动率 ≤ 20%', object: 'dwd.fact_visit', expr: 'abs(today - avg7) / avg7 <= 0.2', weight: 8, score: 97.6, status: '启用' },
  { id: 'BR-009', dim: '完整性', name: '住院记录主键唯一', object: 'dwd.fact_visit', expr: 'COUNT(DISTINCT visit_id) = COUNT(*)', weight: 8, score: 99.6, status: '启用' },
  { id: 'BR-010', dim: '一致性', name: '费用明细与结算一致', object: 'dwd.fact_charge', expr: 'SUM(detail_amount) = settle_amount', weight: 6, score: 96.8, status: '启用' },
  { id: 'BR-011', dim: '规范性', name: '日期时间格式合规', object: 'ods_his.outpatient_visit', expr: 'visit_time REGEXP YYYY-MM-DD HH:mm:ss', weight: 5, score: 99.2, status: '启用' },
  { id: 'BR-012', dim: '及时性', name: '门诊记录 15 分钟内入仓', object: 'ods_his.outpatient_visit', expr: 'etl_time - visit_time <= 15min', weight: 9, score: 94.6, status: '预警' },
  { id: 'BR-013', dim: '稳定性', name: '主键重复率 ≤ 0.1%', object: 'ods_lis.lab_report', expr: 'duplicate_rate <= 0.001', weight: 6, score: 98.2, status: '启用' },
];

// ── 居民主索引 ──────────────────────────────────────────────────
export const residents = [
  { id: 'P100248601', name: '张*华', gender: '男', age: 58, idCard: '5001**********12', phone: '138****6086', org: '两江新区人民医院', dept: '心血管内科', last: '2026-08-05', tags: ['高血压', '慢病管理', '重点人群'], status: '主档案有效' },
  { id: 'P100248602', name: '李*芳', gender: '女', age: 51, idCard: '5001**********28', phone: '139****2042', org: '两江新区中医院', dept: '消化内科', last: '2026-08-05', tags: ['胃炎', '复诊'], status: '主档案有效' },
  { id: 'P100248603', name: '王*明', gender: '男', age: 44, idCard: '5001**********76', phone: '136****8820', org: '两江新区人民医院', dept: '骨科', last: '2026-08-04', tags: ['骨折术后'], status: '待合并' },
];

export const residentVisits = [
  { time: '2026-08-05', org: '两江新区人民医院', dept: '心血管内科', type: '门诊', diag: '高血压 2 级', doctor: '李医生' },
  { time: '2026-06-18', org: '两江新区人民医院', dept: '心血管内科', type: '门诊', diag: '高血压 2 级', doctor: '李医生' },
  { time: '2026-03-12', org: '两江新区中医院', dept: '全科', type: '门诊', diag: '血压升高', doctor: '王医生' },
  { time: '2025-12-20', org: '人和社区卫生服务中心', dept: '慢病科', type: '随访', diag: '高血压随访', doctor: '赵医生' },
];

export const residentLines = [
  { system: 'HIS 业务库', records: 26, last: '2026-08-05 09:24', status: '已同步', key: 'patient_id' },
  { system: 'EMR 电子病历', records: 12, last: '2026-08-05 09:26', status: '已同步', key: 'patient_id' },
  { system: 'LIS 检验', records: 48, last: '2026-08-05 10:10', status: '已同步', key: 'patient_id' },
  { system: 'PACS 影像', records: 6, last: '2026-08-04 16:20', status: '已同步', key: 'patient_id' },
  { system: '公卫健康档案', records: 18, last: '2026-08-01 08:00', status: '待同步', key: 'id_card' },
];

export const similarResidents = [
  { name: '张*华', id: 'P100248599', score: 92, org: '两江新区中医院', diff: '手机号不同' },
  { name: '张*华', id: 'P100248577', score: 86, org: '人和社区卫生服务中心', diff: '出生日期相差 1 天' },
  { name: '张*花', id: 'P100248520', score: 78, org: '两江新区人民医院', diff: '姓名同音' },
];

// ── 标签看板 ────────────────────────────────────────────────────
export const tagObjects = [
  { key: 'resident', label: '居民标签', count: 1286, samples: '86.4 万', coverage: 92.6, active: 1180 },
  { key: 'doctor', label: '医生标签', count: 286, samples: '8,420', coverage: 88.2, active: 260 },
  { key: 'org', label: '机构标签', count: 126, samples: '42', coverage: 96.4, active: 120 },
];

export const residentTags = [
  { name: '高血压', category: '慢病', samples: '12.6 万', growth: '+3.2%', owner: '慢病中心', color: '#6755F5' },
  { name: '2 型糖尿病', category: '慢病', samples: '8.4 万', growth: '+2.8%', owner: '慢病中心', color: '#9587FF' },
  { name: '老年人', category: '人群', samples: '18.2 万', growth: '+1.6%', owner: '基层卫生', color: '#0891B2' },
  { name: '孕产妇', category: '妇幼', samples: '2.6 万', growth: '+4.2%', owner: '妇幼保健', color: '#DB2777' },
  { name: '儿童', category: '妇幼', samples: '6.8 万', growth: '+2.1%', owner: '妇幼保健', color: '#F59E0B' },
  { name: '重点人群', category: '管理', samples: '24.6 万', growth: '+5.8%', owner: '公卫科', color: '#10B981' },
  { name: '高额费用', category: '费用', samples: '1.2 万', growth: '+0.8%', owner: '医保办', color: '#DC2626' },
  { name: '复诊患者', category: '就诊', samples: '16.4 万', growth: '+3.6%', owner: '门诊部', color: '#0E7490' },
];

export const tagCategories = [
  { label: '慢病', value: 386, color: '#6755F5' }, { label: '人群', value: 286, color: '#9587FF' },
  { label: '妇幼', value: 186, color: '#DB2777' }, { label: '就诊', value: 168, color: '#0891B2' },
  { label: '费用', value: 126, color: '#F59E0B' }, { label: '管理', value: 134, color: '#10B981' },
];

export const tagSamples = [
  ['P100248601', '张*华', '男', 58, '高血压, 重点人群, 复诊患者', '两江新区人民医院'],
  ['P100248602', '李*芳', '女', 51, '2 型糖尿病, 复诊患者', '两江新区中医院'],
  ['P100248603', '王*明', '男', 44, '复诊患者', '两江新区人民医院'],
  ['P100248604', '陈*', '女', 36, '孕产妇', '妇幼保健院'],
  ['P100248605', '刘*军', '男', 69, '老年人, 高血压, 重点人群', '人和社区卫生服务中心'],
];

// ── 资产运营 / 发布 ────────────────────────────────────────────
export const bidAssets = [
  { id: 'AST-001', name: '患者主索引数据资源', type: '数据表', domain: 'HIS', security: 'L3', open: '有条件开放', masking: '身份证/手机号', api: '已发布', owner: '信息中心', updated: '2026-08-06', subscribers: 12 },
  { id: 'AST-002', name: '门诊就诊记录资源', type: '数据表', domain: 'HIS', security: 'L3', open: '有条件开放', masking: '姓名/身份证', api: '已发布', owner: '门诊部', updated: '2026-08-06', subscribers: 8 },
  { id: 'AST-003', name: '住院病案首页资源', type: '数据表', domain: 'EMR', security: 'L3', open: '有条件开放', masking: '姓名/身份证/地址', api: '待发布', owner: '病案室', updated: '2026-08-05', subscribers: 6 },
  { id: 'AST-004', name: '检验报告资源', type: '数据表', domain: 'LIS', security: 'L2', open: '无条件开放', masking: '无', api: '已发布', owner: '检验科', updated: '2026-08-05', subscribers: 16 },
  { id: 'AST-005', name: '影像检查索引资源', type: '数据表', domain: 'PACS', security: 'L3', open: '有条件开放', masking: '姓名/身份证', api: '已发布', owner: '放射科', updated: '2026-08-04', subscribers: 4 },
  { id: 'AST-006', name: '居民健康档案资源', type: '数据表', domain: '公卫', security: 'L3', open: '有条件开放', masking: '姓名/身份证/电话', api: '待发布', owner: '公卫科', updated: '2026-08-03', subscribers: 9 },
  { id: 'AST-007', name: '指标服务 API 集', type: 'API', domain: '指标', security: 'L2', open: '有条件开放', masking: '无', api: '已发布', owner: '指标中台', updated: '2026-08-02', subscribers: 24 },
  { id: 'AST-008', name: '妇幼健康主题库', type: '数据集', domain: '妇幼', security: 'L2', open: '有条件开放', masking: '姓名/身份证', api: '待发布', owner: '妇幼保健院', updated: '2026-08-01', subscribers: 3 },
  { id: 'AST-009', name: '医疗服务监管指标集', type: '数据集', domain: '监管', security: 'L2', open: '无条件开放', masking: '无', api: '已发布', owner: '医政科', updated: '2026-07-30', subscribers: 18 },
  { id: 'AST-010', name: '电子病历文书资源', type: '文件', domain: 'EMR', security: 'L4', open: '非开放', masking: '全文脱敏', api: '未发布', owner: '病案室', updated: '2026-07-28', subscribers: 0 },
];

export const publishAssets = [
  { id: 'PUB-001', name: '门诊就诊记录资源', type: '数据表', security: 'L3', applicant: '门诊部', updated: '2026-08-06 10:20', status: '待审核' },
  { id: 'PUB-002', name: '住院病案首页资源', type: '数据表', security: 'L3', applicant: '病案室', updated: '2026-08-05 16:40', status: '待审核' },
  { id: 'PUB-003', name: '检验报告资源', type: '数据表', security: 'L2', applicant: '检验科', updated: '2026-08-05 09:12', status: '已发布' },
  { id: 'PUB-004', name: '影像检查索引资源', type: '数据表', security: 'L3', applicant: '放射科', updated: '2026-08-04 14:30', status: '已发布' },
  { id: 'PUB-005', name: '妇幼健康主题库', type: '数据集', security: 'L2', applicant: '妇幼保健院', updated: '2026-08-01 11:08', status: '已发布' },
  { id: 'PUB-006', name: '电子病历文书资源', type: '文件', security: 'L4', applicant: '病案室', updated: '2026-07-28 10:00', status: '已停用' },
  { id: 'PUB-007', name: '医疗服务监管指标集', type: '数据集', security: 'L2', applicant: '医政科', updated: '2026-07-30 15:20', status: '已发布' },
  { id: 'PUB-008', name: '居民健康档案资源', type: '数据表', security: 'L3', applicant: '公卫科', updated: '2026-08-03 09:40', status: '待审核' },
];

export const auditFeed = [
  ['14:20', '张敏', '发布资产', '医疗服务监管指标集', '成功'],
  ['13:58', '李建华', '停用资产', '电子病历文书资源', '成功'],
  ['11:20', '王思远', '申请订阅', '门诊就诊记录资源', '待审批'],
  ['10:05', '赵倩', '配置脱敏', '检验报告资源', '成功'],
  ['09:32', '周宁', '更新开放级别', '影像检查索引资源', '成功'],
];
