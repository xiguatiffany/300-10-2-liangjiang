export type ModuleKey = 'bid' | 'collection' | 'center' | 'admin';

// 顶部导航顺序按“入口 → 数据进来 → 数据沉淀 → 业务使用”规划：
// 1 统一门户：入口、驾驶舱、演示与对标
// 2 数据采集与治理：采集、标化、湖仓、质量
// 3 数据中台：标准、元数据、指标、标签、资产
// 4 业务中台：统一认证、共享服务、流程、平台管理
// 该顺序同时对齐招标文档“数据采集与治理 → 数据中台 → 业务中台”的章节顺序。
export const modules: { key: ModuleKey; label: string; short: string; icon: string; desc: string }[] = [
  { key: 'bid', label: '统一门户', short: '统一门户', icon: 'sparkles', desc: '入口 · 驾驶舱 · 对标' },
  { key: 'collection', label: '数据采集与治理', short: '采集治理', icon: 'activity', desc: '采集 · 标化 · 湖仓 · 质量' },
  { key: 'center', label: '数据中台', short: '数据中台', icon: 'database', desc: '标准 · 指标 · 标签 · 资产' },
  { key: 'admin', label: '业务中台', short: '业务中台', icon: 'network', desc: '认证 · 共享 · 流程 · 管理' },
];

export type NavItem = { key: string; label: string; icon: string; badge?: string; badgeTone?: string };
export type NavGroup = { title: string; items: NavItem[] };

export const navConfig: Record<ModuleKey, NavGroup[]> = {
  bid: [
    { title: '统一门户', items: [
      { key: 'home', label: '首页大屏', icon: 'dashboard', badge: '▲', badgeTone: 'amber' },
      { key: 'demo', label: '演示清单', icon: 'list', badge: '17', badgeTone: 'blue' },
      { key: 'requirements', label: '功能对标', icon: 'listfilter', badge: '96', badgeTone: 'blue' },
      { key: 'database', label: '数据库连接层', icon: 'database', badge: 'DB', badgeTone: 'green' },
      { key: 'monitor', label: '监控总览', icon: 'activity', badge: '★', badgeTone: 'red' },
      { key: 'data-query', label: '数据查询', icon: 'code', badge: '★', badgeTone: 'red' },
    ]},
    { title: '湖仓一体采集', items: [
      { key: 'collection-wizard', label: '采集方案配置', icon: 'sliders', badge: '★', badgeTone: 'red' },
      { key: 'realtime-channel', label: '数据通道', icon: 'zap', badge: '★', badgeTone: 'red' },
      { key: 'data-preview', label: '数据预览', icon: 'table', badge: '★', badgeTone: 'red' },
    ]},
    { title: '数据质量', items: [
      { key: 'graded-qc', label: '分级质控', icon: 'shieldalert', badge: '新', badgeTone: 'green' },
      { key: 'smart-qc', label: '智能质控', icon: 'sparkles', badge: '新', badgeTone: 'green' },
      { key: 'qc-designer', label: '质控可视化流程', icon: 'workflow', badge: '★', badgeTone: 'red' },
      { key: 'qc-results', label: '质控结果统计', icon: 'shield', badge: '★', badgeTone: 'red' },
      { key: 'knowledge', label: '问题管理/治理大屏', icon: 'dashboard', badge: '★', badgeTone: 'red' },
      { key: 'smart-rules', label: '自适应规则/报告', icon: 'sparkles', badge: '新', badgeTone: 'green' },
      { key: 'governance-service', label: '数据治理服务', icon: 'building', badge: '新', badgeTone: 'green' },
      { key: 'resource-manage', label: '数据资源管理', icon: 'layers', badge: '新', badgeTone: 'green' },
      { key: 'data-app', label: '数据应用服务', icon: 'code', badge: '新', badgeTone: 'green' },
      { key: 'data-security', label: '数据安全服务', icon: 'shield', badge: '新', badgeTone: 'green' },
      { key: 'standard-docs', label: '标准文档管理', icon: 'file', badge: '▲', badgeTone: 'amber' },
      { key: 'rules', label: '五维规则配置', icon: 'listfilter', badge: '▲', badgeTone: 'amber' },
      { key: 'score-model', label: '质量评分模型', icon: 'chart', badge: '▲', badgeTone: 'amber' },
      { key: 'main-archive', label: '居民主档案', icon: 'fingerprint', badge: '▲', badgeTone: 'amber' },
      { key: 'master-data', label: '主数据管理', icon: 'boxes', badge: '新', badgeTone: 'green' },
    ]},
    { title: '指标与标签', items: [
      { key: 'indicator-market', label: '指标市场', icon: 'store', badge: '▲', badgeTone: 'amber' },
      { key: 'tag-board', label: '标签看板', icon: 'tags', badge: '▲', badgeTone: 'amber' },
    ]},
    { title: '资产运营', items: [
      { key: 'asset-management', label: '数据资产管理', icon: 'layers', badge: '★', badgeTone: 'red' },
      { key: 'asset-publish', label: '资产发布/停用', icon: 'uploadcloud', badge: '★', badgeTone: 'red' },
    ]},
  ],
  center: [
    { title: '中台总览', items: [
      { key: 'dashboard', label: '数据总览', icon: 'dashboard' },
    ]},
    { title: '元数据与资源', items: [
      { key: 'assets', label: '资产目录', icon: 'layers' },
      { key: 'sources', label: '数据源', icon: 'database' },
      { key: 'metadata', label: '元数据管理', icon: 'folder', badge: '新', badgeTone: 'green' },
      { key: 'master-data', label: '主数据管理', icon: 'boxes', badge: '新', badgeTone: 'green' },
      { key: 'main-archive', label: '居民主索引', icon: 'fingerprint', badge: '▲', badgeTone: 'amber' },
    ]},
    { title: '数据质量', items: [
      { key: 'quality', label: '质量总览', icon: 'shield' },
      { key: 'quality-control', label: '数据质量控制', icon: 'listfilter', badge: '▲', badgeTone: 'amber' },
      { key: 'quality-rules', label: '质量规则', icon: 'list' },
      { key: 'quality-issues', label: '质量问题', icon: 'circlealert', badge: '4', badgeTone: 'red' },
    ]},
    { title: '数据标准', items: [
      { key: 'standards', label: '数据元', icon: 'book', badge: '新', badgeTone: 'green' },
      { key: 'domains', label: '值域字典', icon: 'braces' },
      { key: 'standard-docs', label: '标准文档管理', icon: 'file', badge: '▲', badgeTone: 'amber' },
    ]},
    { title: '湖仓开发', items: [
      { key: 'sql', label: '数据查询', icon: 'code' },
      { key: 'datasets', label: '数据集', icon: 'table' },
      { key: 'dev', label: '数据开发', icon: 'workflow' },
    ]},
    { title: '数据资源中心', items: [
      { key: 'report', label: '上报任务', icon: 'uploadcloud' },
    ]},
    { title: '指标管理', items: [
      { key: 'indicators', label: '指标列表', icon: 'gauge' },
      { key: 'subscriptions', label: '订阅列表', icon: 'mail' },
      { key: 'tags', label: '标签管理', icon: 'tags' },
      { key: 'graph', label: '依赖/血缘/追溯', icon: 'network', badge: '新', badgeTone: 'green' },
      { key: 'models', label: '模型管理', icon: 'boxes' },
    ]},
    { title: '资产运营', items: [
      { key: 'marketplace', label: '数据服务管理', icon: 'store', badge: '新', badgeTone: 'green' },
    ]},
  ],
  collection: [
    { title: '湖仓接入监控', items: [
      { key: 'overview', label: '首页概览', icon: 'dashboard' },
      { key: 'access-panorama', label: '接入全景视图', icon: 'gauge' },
      { key: 'cdc-monitor', label: 'CDC 同步监控', icon: 'activity', badge: '新', badgeTone: 'green' },
      { key: 'runtime', label: '运行监控', icon: 'activity', badge: '3', badgeTone: 'amber' },
    ]},
    { title: '湖仓接入', items: [
      { key: 'services', label: '数据库组件接入', icon: 'server' },
      { key: 'channels', label: 'CDC 同步管理', icon: 'cable', badge: '★', badgeTone: 'red' },
    ]},
    { title: '数据采集服务', items: [
      { key: 'collect-service', label: '采集服务总览', icon: 'dashboard', badge: '新', badgeTone: 'green' },
      { key: 'collection-wizard', label: '采集方案配置', icon: 'workflow', badge: '★', badgeTone: 'red' },
      { key: 'collect-modes', label: '存量增量非结构化', icon: 'layers', badge: '新', badgeTone: 'green' },
      { key: 'collect-datasets', label: '采集数据集', icon: 'table', badge: '新', badgeTone: 'green' },
    ]},
    { title: '湖仓一体采集', items: [
      { key: 'entry', label: '数据填报', icon: 'clipboard' },
      { key: 'orchestrate', label: '数据编排', icon: 'workflow' },
      { key: 'configs', label: '采集配置', icon: 'sliders' },
      { key: 'reconcile', label: '对账配置', icon: 'list' },
    ]},
    { title: '数据标化', items: [
      { key: 'dict-bridge', label: '标准字典值域贯通', icon: 'link', badge: '新', badgeTone: 'green' },
      { key: 'domain-bridge', label: '值域贯通明细', icon: 'braces', badge: '新', badgeTone: 'green' },
      { key: 'code-mapping', label: '对码方案', icon: 'braces' },
      { key: 'std-tasks', label: '标化任务分派', icon: 'clipboard' },
      { key: 'std-sql-hub', label: '标化SQL治理', icon: 'code', badge: '新', badgeTone: 'green' },
      { key: 'std-sql', label: '标化SQL工作台', icon: 'terminal', badge: '新', badgeTone: 'green' },
      { key: 'std-monitor', label: '标化任务监控', icon: 'activity' },
      { key: 'debug', label: '调试工具', icon: 'braces' },
    ]},
    { title: '湖仓开发', items: [
      { key: 'lake-dev', label: '开发总览', icon: 'dashboard', badge: '新', badgeTone: 'green' },
      { key: 'lake-layers', label: '层级与主题', icon: 'layers', badge: '新', badgeTone: 'green' },
      { key: 'lake-tables', label: '表与资源申请', icon: 'table', badge: '新', badgeTone: 'green' },
      { key: 'lake-flows', label: '离线实时流程', icon: 'workflow', badge: '新', badgeTone: 'green' },
      { key: 'tasks', label: '任务中心', icon: 'clipboard', badge: '新', badgeTone: 'green' },
      { key: 'data-channel', label: '数据通道', icon: 'zap', badge: '★', badgeTone: 'red' },
      { key: 'data-service', label: '数据服务管理', icon: 'store', badge: '新', badgeTone: 'green' },
      { key: 'tables', label: '数据表管理', icon: 'table' },
      { key: 'query', label: '数据查询', icon: 'search', badge: '★', badgeTone: 'red' },
    ]},
    { title: '数据质量', items: [
      { key: 'lineage', label: '依赖/血缘/追溯', icon: 'network', badge: '新', badgeTone: 'green' },
      { key: 'graded-qc', label: '分级质控', icon: 'shieldalert', badge: '新', badgeTone: 'green' },
      { key: 'smart-qc', label: '智能质控', icon: 'sparkles', badge: '新', badgeTone: 'green' },
      { key: 'qc-designer', label: '质控可视化流程', icon: 'workflow', badge: '★', badgeTone: 'red' },
      { key: 'qc-results', label: '质控结果统计', icon: 'shield', badge: '★', badgeTone: 'red' },
      { key: 'qc-governance', label: '问题管理/治理大屏', icon: 'dashboard', badge: '★', badgeTone: 'red' },
      { key: 'smart-rules', label: '自适应规则/报告', icon: 'sparkles', badge: '新', badgeTone: 'green' },
      { key: 'quality', label: '质量监控', icon: 'shieldalert' },
      { key: 'alerts', label: '告警管理', icon: 'bell', badge: '2', badgeTone: 'red' },
      { key: 'audit', label: '审计日志', icon: 'scroll' },
    ]},
    { title: '治理服务', items: [
      { key: 'governance-service', label: '数据治理服务', icon: 'building', badge: '新', badgeTone: 'green' },
      { key: 'resource-manage', label: '数据资源管理', icon: 'layers', badge: '新', badgeTone: 'green' },
      { key: 'data-app', label: '数据应用服务', icon: 'code', badge: '新', badgeTone: 'green' },
      { key: 'data-security', label: '数据安全服务', icon: 'shield', badge: '新', badgeTone: 'green' },
      { key: 'standard-docs', label: '标准文档管理', icon: 'file', badge: '▲', badgeTone: 'amber' },
    ]},
    { title: '平台管理', items: [
      { key: 'env', label: '系统环境', icon: 'settings' },
      { key: 'hosts', label: '主机信息', icon: 'cpu' },
      { key: 'users', label: '用户管理', icon: 'users' },
      { key: 'roles', label: '角色管理', icon: 'usercog' },
    ]},
  ],
  admin: [
    { title: '统一身份认证', items: [
      { key: 'users', label: '用户管理', icon: 'users' },
      { key: 'roles', label: '角色管理', icon: 'usercog' },
      { key: 'permissions', label: '权限配置', icon: 'key' },
    ]},
    { title: '门户与应用', items: [
      { key: 'apps', label: '应用管理', icon: 'boxes' },
      { key: 'data-permissions', label: '数据权限', icon: 'shield' },
    ]},
    { title: '平台管理', items: [
      { key: 'logs', label: '操作日志', icon: 'scroll' },
      { key: 'settings', label: '平台设置', icon: 'settings' },
    ]},
  ],
};

const detailParents: Record<string, { module: ModuleKey; parent: string; title: string }> = {
  'center/indicator': { module: 'center', parent: 'indicators', title: '指标详情' },
  'center/dataset': { module: 'center', parent: 'datasets', title: '数据集详情' },
  'collection/config': { module: 'collection', parent: 'configs', title: '编辑配置' },
  'collection/table': { module: 'collection', parent: 'tables', title: '字段详情' },
  'admin/role': { module: 'admin', parent: 'roles', title: '编辑角色' },
};

export function defaultRoute(m: ModuleKey) {
  return `/${m}/${navConfig[m][0].items[0].key}`;
}

export function navItem(module: ModuleKey, key: string) {
  for (const g of navConfig[module]) {
    const item = g.items.find((i) => i.key === key);
    if (item) return { item, group: g };
  }
  return null;
}

export function resolveNav(path: string) {
  const parts = path.split('/').filter(Boolean);
  const module = (parts[0] as ModuleKey) || 'center';
  const key = parts[1] || '';
  const detailKey = `${module}/${key}`;
  const detail = detailParents[detailKey];
  if (detail) {
    const parent = navItem(detail.module, detail.parent);
    return { module: detail.module, groupTitle: parent?.group.title || '', label: detail.title, active: detail.parent, detail: true };
  }
  const found = navItem(module, key);
  return { module, groupTitle: found?.group.title || '', label: found?.item.label || '工作台', active: key, detail: false };
}
