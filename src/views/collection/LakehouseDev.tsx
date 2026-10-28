'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { LakeFlowCanvas, edgeKey, topoSort, type DagGraphNode, type EdgeRunState } from './LakeFlowCanvas';

type Layer = {
  key: string;
  name: string;
  en: string;
  tables: number;
  themes: number;
  desc: string;
  tone: string;
};

type Theme = {
  id: string;
  name: string;
  layer: string;
  tables: number;
  owner: string;
  fav: boolean;
  status: '建设中' | '已上线' | '分析中' | '已停用';
  kind: '分析' | '应用' | '监控';
  updated: string;
};

type LakeTable = {
  id: string;
  name: string;
  layer: string;
  scope: '私有表' | '公共表';
  owner: string;
  rows: string;
  status: '正常' | '回收站' | '申请中' | '待授权';
  lineage: number;
  updated: string;
};

type ResApply = {
  id: string;
  title: string;
  type: '建表' | '公共表授权' | '资源扩容' | '权限转移';
  applicant: string;
  status: '待审核' | '已通过' | '已驳回' | '草稿';
  at: string;
};

type Flow = {
  id: string;
  name: string;
  kind: '离线DAG' | '实时Flink' | '实时Spark';
  status: '运行中' | '已上线' | '已下线' | '失败' | '草稿';
  owner: string;
  nodes: number;
  last: string;
  cron: string;
  desc: string;
  success: number;
  graph: DagGraphNode[];
  edges: [string, string][];
};

const layers: Layer[] = [
  { key: 'DIM', name: '维度层', en: 'DIM', tables: 86, themes: 4, desc: '公共维度与字典维表', tone: 'slate' },
  { key: 'ODS', name: '贴源层', en: 'ODS', tables: 1286, themes: 12, desc: '接入贴源，保留业务原貌', tone: 'blue' },
  { key: 'DWD', name: '明细层', en: 'DWD', tables: 428, themes: 9, desc: '清洗标化后的明细事实', tone: 'violet' },
  { key: 'DWS', name: '汇总层', en: 'DWS', tables: 186, themes: 8, desc: '轻度汇总与宽表', tone: 'cyan' },
  { key: 'ADS', name: '应用层', en: 'ADS', tables: 96, themes: 11, desc: '面向应用与指标服务', tone: 'green' },
];

const themes: Theme[] = [
  { id: 'TH-01', name: '患者主索引', layer: 'DWD', tables: 12, owner: '张敏', fav: true, status: '已上线', kind: '应用', updated: '08-06' },
  { id: 'TH-02', name: '门诊诊疗', layer: 'DWD', tables: 28, owner: '李建华', fav: true, status: '已上线', kind: '分析', updated: '08-05' },
  { id: 'TH-03', name: '检验互认', layer: 'DWS', tables: 16, owner: '赵倩', fav: false, status: '建设中', kind: '应用', updated: '08-06' },
  { id: 'TH-04', name: '运营决策看板', layer: 'ADS', tables: 22, owner: '刘一鸣', fav: true, status: '分析中', kind: '监控', updated: '08-04' },
  { id: 'TH-05', name: '公卫慢病', layer: 'DWD', tables: 18, owner: '陈晓', fav: false, status: '已上线', kind: '分析', updated: '08-03' },
  { id: 'TH-06', name: '影像检查', layer: 'ODS', tables: 34, owner: '周宁', fav: false, status: '建设中', kind: '应用', updated: '08-06' },
  { id: 'TH-07', name: '费用结算', layer: 'DWS', tables: 14, owner: '张敏', fav: true, status: '已上线', kind: '分析', updated: '08-02' },
  { id: 'TH-08', name: '手术麻醉', layer: 'DWD', tables: 10, owner: '李建华', fav: false, status: '已停用', kind: '应用', updated: '07-20' },
];

const lakeTables: LakeTable[] = [
  { id: 'LT-01', name: 'ods_his.patient', layer: 'ODS', scope: '公共表', owner: '平台', rows: '3,428 万', status: '正常', lineage: 8, updated: '08-06 10:00' },
  { id: 'LT-02', name: 'dwd_fact_visit', layer: 'DWD', scope: '公共表', owner: '平台', rows: '1,860 万', status: '正常', lineage: 12, updated: '08-06 02:14' },
  { id: 'LT-03', name: 'ads_ops_daily', layer: 'ADS', scope: '公共表', owner: '运营办', rows: '286 万', status: '正常', lineage: 6, updated: '08-06 05:00' },
  { id: 'LT-04', name: 'tmp_zhang_lab_probe', layer: 'DWD', scope: '私有表', owner: '张敏', rows: '12 万', status: '正常', lineage: 1, updated: '08-05 16:20' },
  { id: 'LT-05', name: 'dws_diag_month', layer: 'DWS', scope: '公共表', owner: '医务处', rows: '420 万', status: '待授权', lineage: 4, updated: '08-06 11:10' },
  { id: 'LT-06', name: 'ods_lis.lab_report_old', layer: 'ODS', scope: '私有表', owner: '赵倩', rows: '—', status: '回收站', lineage: 0, updated: '08-01 09:00' },
  { id: 'LT-07', name: 'dim_department', layer: 'DIM', scope: '公共表', owner: '平台', rows: '1,286', status: '正常', lineage: 22, updated: '08-06 01:02' },
  { id: 'LT-08', name: 'ads_ph_htn_board', layer: 'ADS', scope: '公共表', owner: '疾控', rows: '86 万', status: '申请中', lineage: 3, updated: '08-06 13:40' },
];

const applies: ResApply[] = [
  { id: 'RA-2401', title: '申请公共表 dws_diag_month 只读', type: '公共表授权', applicant: '陈晓', status: '待审核', at: '08-06 11:12' },
  { id: 'RA-2402', title: '新建私有表 tmp_emr_note_parse', type: '建表', applicant: '张敏', status: '已通过', at: '08-05 15:30' },
  { id: 'RA-2403', title: 'ADS 存储扩容 +2TB', type: '资源扩容', applicant: '刘一鸣', status: '待审核', at: '08-06 09:20' },
  { id: 'RA-2404', title: '转移 ods 私有表权限至赵倩', type: '权限转移', applicant: '李建华', status: '已驳回', at: '08-04 18:00' },
  { id: 'RA-2405', title: '申请收藏主题「检验互认」', type: '公共表授权', applicant: '周宁', status: '草稿', at: '08-06 14:00' },
];

const batchGraph: DagGraphNode[] = [
  { id: 'a', label: '抽取贴源', kind: 'source', icon: 'database', tone: 'blue', x: 0, y: 120, state: 'ok', resource: 'ods_his.patient', engine: 'JDBC Extract', duration: '4m 12s', inRows: '3,428 万', outRows: '3,428 万', owner: '张敏', retries: 0, started: '02:00:08', sqlHint: 'SELECT * FROM HISDB..PATIENT WHERE update_time>=${bizdate}' },
  { id: 'b', label: '清洗标化', kind: 'transform', icon: 'sliders', tone: 'violet', x: 280, y: 120, state: 'ok', resource: 'stg_patient_clean', engine: 'Spark SQL', duration: '6m 40s', inRows: '3,428 万', outRows: '3,401 万', owner: '张敏', retries: 0, started: '02:04:22', sqlHint: '对码 MAP-SEX / MAP-ICD · 去重主键 patient_id', parallel: '8' },
  { id: 'c', label: '维度关联', kind: 'join', icon: 'boxes', tone: 'cyan', x: 560, y: 20, state: 'ok', resource: 'dim_patient_master', engine: 'Spark SQL', duration: '3m 05s', inRows: '3,401 万', outRows: '3,401 万', owner: '李建华', retries: 0, started: '02:11:08', sqlHint: 'LEFT JOIN dim_department / dim_org' },
  { id: 'd', label: '质量检查', kind: 'quality', icon: 'shield', tone: 'amber', x: 560, y: 230, state: 'warn', resource: 'qc_patient_rules', engine: 'DQ Engine', duration: '2m 18s', inRows: '3,401 万', outRows: '3,398 万', owner: '赵倩', retries: 1, started: '02:11:10', sqlHint: '完整性/一致性 · 异常 2.8 万行分流' },
  { id: 'e', label: '写入 DWD', kind: 'sink', icon: 'layers', tone: 'green', x: 840, y: 120, state: 'run', resource: 'dwd_patient_master', engine: 'Spark Insert', duration: '进行中', inRows: '3,398 万', outRows: '2,860 万', owner: '张敏', retries: 0, started: '02:13:40', sqlHint: 'INSERT OVERWRITE · 分区 dt=${bizdate}' },
  { id: 'f', label: '调度结束', kind: 'monitor', icon: 'checkcircle', tone: 'green', x: 1120, y: 120, state: 'idle', resource: 'downstream.notify', engine: 'Scheduler', duration: '—', inRows: '—', outRows: '—', owner: '平台', retries: 0, started: '等待上游', sqlHint: '触发门诊宽表 / 主索引 API 刷新' },
];
const batchEdges: [string, string][] = [['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'e'], ['d', 'e'], ['e', 'f']];

const streamGraph: DagGraphNode[] = [
  { id: 'a', label: 'CDC 捕获', kind: 'stream', icon: 'zap', tone: 'amber', x: 0, y: 110, state: 'run', resource: 'LIS_PROD.binlog', engine: 'Flink CDC', duration: '持续', inRows: '1.2k/s', outRows: '1.2k/s', owner: '赵倩', retries: 0, started: '07-28 上线', sqlHint: '库表 lis.lab_result · 仅 INSERT/UPDATE' },
  { id: 'b', label: 'Kafka 缓冲', kind: 'stream', icon: 'cable', tone: 'violet', x: 280, y: 110, state: 'run', resource: 'topic.lab.result', engine: 'Kafka', duration: '持续', inRows: '1.2k/s', outRows: '1.2k/s', owner: '平台', retries: 0, started: 'lag 86', sqlHint: 'partitions=12 · acks=all' },
  { id: 'c', label: 'Flink 清洗', kind: 'transform', icon: 'workflow', tone: 'blue', x: 560, y: 110, state: 'run', resource: 'job_lab_clean', engine: 'Flink SQL', duration: '窗口 30s', inRows: '1.2k/s', outRows: '1.18k/s', owner: '赵倩', retries: 0, started: 'checkpoint 10s', sqlHint: '字典映射 + 空值补全 + 乱序 5s' },
  { id: 'd', label: '写入湖表', kind: 'sink', icon: 'table', tone: 'green', x: 840, y: 110, state: 'ok', resource: 'ods_lis.lab_result', engine: 'Flink Sink', duration: '持续', inRows: '1.18k/s', outRows: '1.18k/s', owner: '赵倩', retries: 0, started: 'exactly-once', sqlHint: '主键 report_id · 幂等写入' },
  { id: 'e', label: '延迟监控', kind: 'monitor', icon: 'activity', tone: 'cyan', x: 1120, y: 110, state: 'ok', resource: 'metric.end_to_end', engine: 'Prometheus', duration: 'P99 3.8s', inRows: '—', outRows: '—', owner: '运维', retries: 0, started: '采样 15s', sqlHint: '阈值：P99 > 5s 告警' },
];
const streamEdges: [string, string][] = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e']];

const failGraph: DagGraphNode[] = [
  { id: 'a', label: 'PACS 源', kind: 'source', icon: 'database', tone: 'blue', x: 40, y: 120, state: 'ok', resource: 'RISDB.dbo.STUDY', engine: 'JDBC', duration: '1m 02s', inRows: '86 万', outRows: '86 万', owner: '周宁', retries: 0, started: '13:00:10', sqlHint: '增量 archive_ts > last_watermark' },
  { id: 'b', label: 'Spark 索引', kind: 'stream', icon: 'zap', tone: 'amber', x: 360, y: 120, state: 'fail', resource: 'spark_pacs_index', engine: 'Spark Streaming', duration: '失败', inRows: '86 万', outRows: '12 万', owner: '周宁', retries: 3, started: '13:01:20', sqlHint: 'OOM：executor memory 4g 不足' },
  { id: 'c', label: '对象存储', kind: 'sink', icon: 'harddrive', tone: 'violet', x: 680, y: 120, state: 'warn', resource: 'oss://lj-pacs/index', engine: 'S3A', duration: '跳过', inRows: '—', outRows: '—', owner: '平台', retries: 0, started: '未执行', sqlHint: '依赖上游成功后写入' },
  { id: 'd', label: '湖表落库', kind: 'sink', icon: 'table', tone: 'green', x: 1000, y: 120, state: 'idle', resource: 'ods_ris.study', engine: 'Spark Insert', duration: '—', inRows: '—', outRows: '—', owner: '周宁', retries: 0, started: '阻塞', sqlHint: '等待索引任务恢复' },
];
const failEdges: [string, string][] = [['a', 'b'], ['b', 'c'], ['c', 'd']];

const flows: Flow[] = [
  { id: 'FL-01', name: '患者主索引日批', kind: '离线DAG', status: '运行中', owner: '张敏', nodes: 6, last: '08-06 02:14', cron: '每日 02:00', desc: 'ODS 患者贴源 → 标化主索引 → DWD', success: 98.6, graph: batchGraph, edges: batchEdges },
  { id: 'FL-02', name: '门诊就诊宽表', kind: '离线DAG', status: '已上线', owner: '李建华', nodes: 6, last: '08-06 02:40', cron: '每日 02:30', desc: '就诊明细关联诊断、费用生成宽表', success: 99.2, graph: batchGraph, edges: batchEdges },
  { id: 'FL-03', name: '检验结果实时入仓', kind: '实时Flink', status: '运行中', owner: '赵倩', nodes: 5, last: '实时', cron: '持续', desc: 'LIS CDC → Kafka → Flink → 湖表', success: 99.8, graph: streamGraph, edges: streamEdges },
  { id: 'FL-04', name: '影像索引增量', kind: '实时Spark', status: '失败', owner: '周宁', nodes: 4, last: '08-06 13:12', cron: '持续', desc: 'PACS 归档增量索引，当前 Spark 节点失败', success: 86.0, graph: failGraph, edges: failEdges },
  { id: 'FL-05', name: '运营指标汇总', kind: '离线DAG', status: '已下线', owner: '刘一鸣', nodes: 6, last: '08-01 05:00', cron: '每日 05:00', desc: 'DWS 汇总后写入 ADS 运营看板', success: 97.1, graph: batchGraph, edges: batchEdges },
  { id: 'FL-06', name: '公卫慢病周批', kind: '离线DAG', status: '草稿', owner: '陈晓', nodes: 6, last: '—', cron: '每周一 03:00', desc: '高血压 / 糖尿病专档周批加工', success: 0, graph: batchGraph, edges: batchEdges },
];

const toneOf = (s: string) => {
  if (['已上线', '正常', '已通过', '运行中', '已绑定'].includes(s)) return 'green';
  if (['建设中', '分析中', '申请中', '待审核', '待授权', '草稿'].includes(s)) return 'amber';
  if (['已下线', '回收站'].includes(s)) return 'slate';
  if (['失败', '已驳回', '已停用'].includes(s)) return 'red';
  return 'blue';
};

/** 湖仓开发总览 */
export function LakeDevHubPage() {
  const { go, notify } = useApp();
  return (
    <>
      <PageHeader
        eyebrow="LAKEHOUSE DEVELOPMENT"
        title="湖仓开发"
        desc="覆盖层级与主题、私有/公共表与资源申请、离线 DAG / 实时流程，并衔接 ★ 数据查询与任务运维。"
        actions={
          <>
            <Btn icon="layers" onClick={() => go('/collection/lake-layers')}>层级主题</Btn>
            <Btn icon="table" onClick={() => go('/collection/lake-tables')}>表与资源</Btn>
            <Btn variant="primary" icon="code" onClick={() => go('/bid/data-query')}>★ 数据查询</Btn>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="层级" value={String(layers.length)} unit="层" delta="DIM→ADS 可扩展" icon="layers" tone="blue" onClick={() => go('/collection/lake-layers')} />
        <StatCard label="主题" value={String(themes.length)} unit="个" delta={`已上线 ${themes.filter((t) => t.status === '已上线').length}`} icon="boxes" tone="violet" onClick={() => go('/collection/lake-layers')} />
        <StatCard label="湖仓表" value="2,082" unit="张" delta="公共 / 私有" icon="table" tone="green" onClick={() => go('/collection/lake-tables')} />
        <StatCard label="开发流程" value={String(flows.length)} unit="条" delta={`运行中 ${flows.filter((f) => f.status === '运行中').length}`} icon="workflow" tone="amber" onClick={() => go('/collection/lake-flows')} />
      </div>

      <Card className="mt-14" title="湖仓开发基本流程" subtitle="定层级 → 建主题 → 管表权 → 编排加工 → 查询验证">
        <div className="schema-map" style={{ flexWrap: 'wrap', gap: 10 }}>
          {[
            ['1', '配置层级与主题', () => go('/collection/lake-layers')],
            ['2', '私有表 / 公共表 / 申请', () => go('/collection/lake-tables')],
            ['3', '离线 DAG / 实时流程', () => go('/collection/lake-flows')],
            ['4', '★ 数据查询验证', () => go('/bid/data-query')],
            ['5', '任务运维与依赖', () => go('/collection/tasks')],
          ].map(([n, label, fn]) => (
            <button key={label as string} className="btn btn-secondary btn-sm" onClick={fn as () => void}>
              <Badge tone="blue">{n as string}</Badge> {label as string}
            </button>
          ))}
        </div>
        <div className="info-note mt-14">
          <Icon name="sparkles" size={13} />
          <span>采集入仓表配置见「数据表管理」；标化字典与对码完成后，在本模块完成分层建模与加工编排。</span>
        </div>
      </Card>

      <Card className="mt-14" title="湖仓层级" subtitle="点击进入主题与资源绑定">
        <div className="grid grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
          {layers.map((l) => (
            <button
              key={l.key}
              className="btn btn-secondary"
              style={{ flexDirection: 'column', alignItems: 'flex-start', height: 'auto', padding: '12px 14px', textAlign: 'left' }}
              onClick={() => go(`/collection/lake-layers?layer=${l.key}`)}
            >
              <Badge tone={l.tone as any}>{l.en}</Badge>
              <strong style={{ marginTop: 8 }}>{l.name}</strong>
              <small className="muted">{l.tables.toLocaleString()} 表 · {l.themes} 主题</small>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-3 mt-14">
        {[
          { title: '表与资源申请', desc: '私有表生命周期、公共表收藏授权、资源申请审核。', icon: 'table', path: '/collection/lake-tables' },
          { title: '离线 / 实时流程', desc: 'DAG 画布、Flink/Spark 实时任务、上下线与血缘。', icon: 'workflow', path: '/collection/lake-flows' },
          { title: '采集表配置', desc: '源目标映射、对账阈值与字段标签（已有能力）。', icon: 'sliders', path: '/collection/tables' },
        ].map((x) => (
          <Card key={x.title} title={x.title} subtitle={x.desc}>
            <Btn size="sm" variant="primary" icon={x.icon} onClick={() => go(x.path)}>进入</Btn>
          </Card>
        ))}
      </div>
    </>
  );
}

/** 层级与主题管理 */
export function LakeLayersPage() {
  const { go, notify } = useApp();
  const [layer, setLayer] = useState('全部');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Theme | null>(null);
  const [demoing, setDemoing] = useState(false);
  const [bound, setBound] = useState(false);
  const [seenLayers, setSeenLayers] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const l = new URLSearchParams(window.location.search).get('layer');
    if (l && layers.some((x) => x.key === l)) { setLayer(l); setSeenLayers((s) => new Set(s).add(l)); }
  }, []);

  const rows = useMemo(() => themes.filter((t) =>
    (layer === '全部' || t.layer === layer)
    && (t.name + t.id + t.owner).toLowerCase().includes(q.toLowerCase())
  ), [layer, q]);

  const demoAccept = async () => {
    setDemoing(true);
    for (const l of layers) {
      setLayer(l.key); setSeenLayers((s) => new Set(s).add(l.key));
      await new Promise((r) => setTimeout(r, 280));
    }
    setOpen(true); setBound(true);
    notify('层级可扩展 · 主题可绑定资源 · 验收完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="LAKE LAYERS & THEMES · A4-01"
        title="湖仓层级与主题"
        desc="验收：DIM/接入/ODS/DWD/DWS/ADS 层级可扩展，主题可绑定资源。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setOpen(true); setBound(true); }}>新建主题</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {layers.slice(0, 4).map((l, i) => (
          <React.Fragment key={l.key}>
            <div className={`qc-accept-step ${layer === l.key || seenLayers.has(l.key) ? 'is-on' : ''}`}>
              <em>{String(i + 1).padStart(2, '0')}</em>
              <strong>{l.key}</strong>
              <small>{l.themes} 主题</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {bound ? '主题可绑定' : `已浏览 ${seenLayers.size}/${layers.length} 层`}</span>
      </div>

      <div className="stat-grid mt-14">
        {layers.map((l) => (
          <StatCard
            key={l.key}
            label={l.name}
            value={String(l.tables)}
            unit="表"
            delta={`${l.themes} 个主题`}
            icon="layers"
            tone={l.tone as any}
            onClick={() => setLayer(l.key)}
          />
        ))}
      </div>

      <Card className="mt-14" title="主题目录" subtitle={layer === '全部' ? '全部层级' : `${layer} 层级`} noPad
        actions={
          <div className="filter-bar">
            <Select value={layer} onChange={setLayer} options={['全部', ...layers.map((l) => l.key)]} width={100} />
            <SearchInput value={q} onChange={setQ} placeholder="检索主题" width={180} />
          </div>
        }
      >
        <div className="pad-h">
          <DataTable
            rows={rows}
            pageSize={8}
            onRowClick={(r) => setActive(r as Theme)}
            columns={[
              { key: 'id', title: '编号', width: 80, render: (r) => <span className="mono-cell">{r.id}</span> },
              { key: 'name', title: '主题', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.kind}主题 · {r.owner}</small></div> },
              { key: 'layer', title: '层级', width: 70, render: (r) => <Badge tone="slate">{r.layer}</Badge> },
              { key: 'tables', title: '绑定表', width: 70, render: (r) => r.tables },
              { key: 'fav', title: '收藏', width: 60, render: (r) => (r.fav ? <Badge tone="amber">★</Badge> : <span className="muted">—</span>) },
              { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
              { key: 'updated', title: '更新', width: 70, render: (r) => r.updated },
              {
                key: 'ops', title: '操作', width: 140,
                render: (r) => (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="link-btn" onClick={() => { notify(r.fav ? '已取消收藏' : '已收藏主题'); }}>{r.fav ? '取消收藏' : '收藏'}</button>
                    <button className="link-btn" onClick={() => go('/collection/lake-tables')}>资源</button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name || ''} desc={active ? `${active.id} · ${active.layer}` : ''} width={520}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" onClick={() => { notify('主题监控已打开'); go('/collection/lake-flows'); }}>监控</Btn></>}>
        {active && (
          <>
            <KeyValue cols={2} items={[
              { label: '层级', value: active.layer },
              { label: '类型', value: active.kind },
              { label: '绑定表', value: `${active.tables} 张` },
              { label: '负责人', value: active.owner },
              { label: '状态', value: <Badge tone={toneOf(active.status)} dot>{active.status}</Badge> },
              { label: '更新', value: active.updated },
            ]} />
            <div className="info-note mt-14"><Icon name="boxes" size={13} /><span>主题可绑定多张湖仓表，供分析、应用与监控场景检索复用。</span></div>
          </>
        )}
      </Drawer>

      <Modal open={open} onClose={() => setOpen(false)} title="新建主题" desc="主题归属某一层级，并可绑定湖仓表资源。" width={560}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('主题已创建'); }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="主题名称" required className="span-2"><input className="input" placeholder="例如：日间手术主题" /></Field>
          <Field label="所属层级" required><Select value="DWD" onChange={() => {}} options={layers.map((l) => l.key)} /></Field>
          <Field label="主题类型"><Select value="分析" onChange={() => {}} options={['分析', '应用', '监控']} /></Field>
          <Field label="负责人"><Select value="张敏" onChange={() => {}} options={['张敏', '李建华', '陈晓', '赵倩']} /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="主题用途与资源范围" /></Field>
        </div>
      </Modal>
    </>
  );
}

/** 私有表 / 公共表 / 资源申请 */
export function LakeTablesPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState('tables');
  const [scope, setScope] = useState('');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<LakeTable | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [loop, setLoop] = useState({ create: false, apply: false, auth: false, trash: false });

  const rows = useMemo(() => lakeTables.filter((t) =>
    (!scope || t.scope === scope)
    && (t.name + t.owner + t.layer).toLowerCase().includes(q.toLowerCase())
  ), [scope, q]);

  const demoAccept = async () => {
    setDemoing(true);
    setTab('tables'); setScope('私有表'); setLoop((l) => ({ ...l, create: true }));
    setActive(lakeTables.find((t) => t.scope === '私有表') || lakeTables[0]);
    notify('① 建表：私有表生命周期');
    await new Promise((r) => setTimeout(r, 400));
    setTab('apply'); setApplyOpen(true); setLoop((l) => ({ ...l, apply: true, auth: true }));
    notify('②③ 资源申请 · 授权审核');
    await new Promise((r) => setTimeout(r, 450));
    setApplyOpen(false); setTab('trash'); setLoop((l) => ({ ...l, trash: true }));
    notify('④ 回收站可恢复 · 闭环完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="LAKE TABLES & RESOURCE APPLY · A4-02"
        title="湖仓表与资源申请"
        desc="验收：建表 → 申请 → 授权 → 回收站闭环。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="layers" onClick={() => go('/collection/lake-layers')}>层级主题</Btn>
            <Btn variant="primary" icon="plus" onClick={() => { setApplyOpen(true); setLoop((l) => ({ ...l, apply: true })); }}>资源申请</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '建表', d: '私有/公共', k: 'create' as const },
          { n: '02', t: '申请', d: '资源单', k: 'apply' as const },
          { n: '03', t: '授权', d: '审核通过', k: 'auth' as const },
          { n: '04', t: '回收站', d: '可恢复', k: 'trash' as const },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${loop[s.k] ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 3 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {Object.values(loop).every(Boolean) ? '闭环完成' : '待演示闭环'}</span>
      </div>

      <Tabs className="mt-14" variant="pill" value={tab} onChange={setTab} items={[
        { key: 'tables', label: '湖仓表' },
        { key: 'apply', label: '资源申请' },
        { key: 'trash', label: '回收站' },
      ]} />

      <div className="stat-grid mt-14">
        <StatCard label="公共表" value={String(lakeTables.filter((t) => t.scope === '公共表').length)} unit="张样例" delta="可申请授权" icon="table" tone="blue" />
        <StatCard label="私有表" value={String(lakeTables.filter((t) => t.scope === '私有表').length)} unit="张样例" delta="个人空间" icon="fingerprint" tone="violet" />
        <StatCard label="待审核" value={String(applies.filter((a) => a.status === '待审核').length)} unit="单" delta="含扩容" icon="clipboard" tone="amber" />
        <StatCard label="回收站" value={String(lakeTables.filter((t) => t.status === '回收站').length)} unit="张" delta="可恢复" icon="scroll" tone="slate" />
      </div>

      {tab === 'tables' && (
        <Card className="mt-14" title="表目录" subtitle="私有表 / 公共表" noPad
          actions={<div className="filter-bar"><Select value={scope} onChange={setScope} options={['', '私有表', '公共表']} placeholder="全部范围" width={110} /><SearchInput value={q} onChange={setQ} placeholder="表名 / 负责人" width={180} /></div>}
        >
          <div className="pad-h">
            <DataTable
              rows={rows.filter((t) => t.status !== '回收站')}
              pageSize={8}
              onRowClick={(r) => setActive(r as LakeTable)}
              columns={[
                { key: 'name', title: '表名', render: (r) => <div className="cell-main"><strong className="mono">{r.name}</strong><small>{r.layer} · {r.rows}</small></div> },
                { key: 'scope', title: '范围', width: 80, render: (r) => <Badge tone={r.scope === '公共表' ? 'blue' : 'violet'}>{r.scope}</Badge> },
                { key: 'owner', title: '负责人', width: 80, render: (r) => r.owner },
                { key: 'lineage', title: '血缘', width: 60, render: (r) => r.lineage },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                { key: 'updated', title: '更新', width: 110, render: (r) => r.updated },
                {
                  key: 'ops', title: '操作', width: 130,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => notify(`已提交 ${r.name} 授权申请`)}>申请</button>
                      <button className="link-btn" onClick={() => go('/bid/data-preview')}>预览</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'apply' && (
        <Card className="mt-14" title="资源申请单" subtitle="建表 / 授权 / 扩容 / 权限转移" noPad actions={<Btn size="sm" icon="plus" onClick={() => setApplyOpen(true)}>新建</Btn>}>
          <div className="pad-h">
            <DataTable
              rows={applies}
              pageSize={8}
              columns={[
                { key: 'id', title: '单号', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'title', title: '申请内容', render: (r) => <div className="cell-main"><strong>{r.title}</strong><small>{r.type}</small></div> },
                { key: 'applicant', title: '申请人', width: 80, render: (r) => r.applicant },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
                { key: 'at', title: '时间', width: 110, render: (r) => r.at },
                {
                  key: 'ops', title: '操作', width: 120,
                  render: (r) => (
                    <div className="row-actions">
                      {r.status === '待审核' ? (
                        <>
                          <button className="link-btn" onClick={() => notify(`${r.id} 已通过`)}>通过</button>
                          <button className="link-muted" onClick={() => notify(`${r.id} 已驳回`, 'info')}>驳回</button>
                        </>
                      ) : (
                        <button className="link-btn" onClick={() => notify('已打开申请详情')}>详情</button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'trash' && (
        <Card className="mt-14" title="回收站" subtitle="删除表可恢复或彻底清除" noPad>
          <div className="pad-h">
            <DataTable
              rows={lakeTables.filter((t) => t.status === '回收站')}
              pageSize={6}
              columns={[
                { key: 'name', title: '表名', render: (r) => <span className="mono">{r.name}</span> },
                { key: 'owner', title: '原负责人', width: 90, render: (r) => r.owner },
                { key: 'updated', title: '删除时间', width: 120, render: (r) => r.updated },
                {
                  key: 'ops', title: '操作', width: 140,
                  render: (r) => (
                    <div className="row-actions">
                      <button className="link-btn" onClick={() => notify(`${r.name} 已恢复`)}>恢复</button>
                      <button className="link-muted" onClick={() => notify(`${r.name} 已彻底删除`, 'info')}>清除</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name || ''} desc={active ? `${active.scope} · ${active.layer}` : ''} width={520}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn variant="primary" onClick={() => notify('权限转移向导已打开', 'info')}>权限转移</Btn></>}>
        {active && (
          <KeyValue cols={2} items={[
            { label: '范围', value: active.scope },
            { label: '层级', value: active.layer },
            { label: '负责人', value: active.owner },
            { label: '行数', value: active.rows },
            { label: '血缘节点', value: `${active.lineage} 个` },
            { label: '状态', value: <Badge tone={toneOf(active.status)} dot>{active.status}</Badge> },
          ]} />
        )}
      </Drawer>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="资源申请" width={560}
        footer={<><Btn onClick={() => setApplyOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setApplyOpen(false); notify('资源申请已提交'); }}>提交</Btn></>}>
        <div className="form-grid">
          <Field label="申请类型" required className="span-2"><Select value="公共表授权" onChange={() => {}} options={['建表', '公共表授权', '资源扩容', '权限转移']} /></Field>
          <Field label="目标资源" required className="span-2"><input className="input" placeholder="表名或主题名" /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="用途与期限" /></Field>
        </div>
      </Modal>
    </>
  );
}

const kindTone = (k: Flow['kind']) => (k === '离线DAG' ? 'violet' : k === '实时Flink' ? 'amber' : 'cyan');

type RunLog = { t: string; level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG'; msg: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowStamp = () => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
};

/** 离线 DAG / 实时流程 */
export function LakeFlowsPage() {
  const { go, notify } = useApp();
  const [kind, setKind] = useState('全部');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Flow>(flows[0]);
  const [liveGraph, setLiveGraph] = useState<DagGraphNode[]>(() => flows[0].graph.map((n) => ({ ...n })));
  const [edgeStates, setEdgeStates] = useState<Record<string, EdgeRunState>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [runProgress, setRunProgress] = useState(0);
  const [demoing, setDemoing] = useState(false);
  const [arranged, setArranged] = useState(true);
  const [ranOk, setRanOk] = useState(false);
  const [lineageOk, setLineageOk] = useState(false);
  const abortRef = useRef(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => flows.filter((f) =>
    (kind === '全部' || f.kind === kind)
    && (f.name + f.id + f.owner).toLowerCase().includes(q.toLowerCase())
  ), [kind, q]);

  const selected = liveGraph.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
  }, [logs]);

  const pushLog = (level: RunLog['level'], msg: string) => {
    setLogs((prev) => [...prev, { t: nowStamp(), level, msg }]);
  };

  const resetGraph = (f: Flow) => {
    setLiveGraph(f.graph.map((n) => ({ ...n, state: 'idle' as const, started: '等待调度', duration: '—' })));
    setEdgeStates(Object.fromEntries(f.edges.map(([s, t]) => [edgeKey(s, t), 'idle' as EdgeRunState])));
  };

  const selectFlow = (f: Flow) => {
    abortRef.current = true;
    setRunning(false);
    setRunOpen(false);
    setActive(f);
    setLiveGraph(f.graph.map((n) => ({ ...n })));
    setEdgeStates({});
    setSelectedId(null);
    setDrawerOpen(false);
    setLogs([]);
    setRunProgress(0);
  };

  const stopRun = () => {
    abortRef.current = true;
    setRunning(false);
    pushLog('WARN', '用户终止试跑，后续节点已取消');
    notify('试跑已终止');
  };

  const startRun = async (flow?: Flow) => {
    if (running) return;
    const target = flow || active;
    abortRef.current = false;
    setRunning(true);
    setRunOpen(true);
    setDrawerOpen(false);
    setSelectedId(null);
    setLogs([]);
    setRunProgress(0);
    resetGraph(target);
    notify(`${target.name} 试跑已启动`);

    const order = topoSort(target.graph.map((n) => n.id), target.edges);
    const base = Object.fromEntries(target.graph.map((n) => [n.id, n]));
    pushLog('INFO', `======= 试跑启动 ${target.id} ${target.name} =======`);
    pushLog('INFO', `调度策略 ${target.cron} · 类型 ${target.kind} · 节点 ${order.length}`);
    pushLog('DEBUG', `拓扑顺序 ${order.join(' → ')}`);
    await sleep(350);
    if (abortRef.current) { setRunning(false); return; }

    let runFailed = false;
    for (let i = 0; i < order.length; i++) {
      if (abortRef.current) break;
      const id = order[i];
      const src = base[id];
      const inbound = target.edges.filter(([, t]) => t === id);
      const outbound = target.edges.filter(([s]) => s === id);

      setEdgeStates((prev) => {
        const next = { ...prev };
        inbound.forEach(([s, t]) => { next[edgeKey(s, t)] = 'active'; });
        return next;
      });

      setLiveGraph((g) => g.map((n) => n.id === id
        ? { ...n, state: 'run', started: nowStamp(), duration: '执行中…', inRows: src.inRows, outRows: '—' }
        : n));
      pushLog('INFO', `[${src.label}] 开始执行 · engine=${src.engine} · resource=${src.resource}`);
      if (src.sqlHint) pushLog('DEBUG', `[${src.label}] ${src.sqlHint}`);
      setRunProgress(Math.round((i / order.length) * 100));
      await sleep(src.kind === 'quality' ? 900 : 700);
      if (abortRef.current) break;

      const willFail = src.state === 'fail';
      const willWarn = !willFail && (src.state === 'warn' || src.kind === 'quality');

      if (willFail) {
        runFailed = true;
        setLiveGraph((g) => g.map((n) => {
          if (n.id === id) return { ...n, state: 'fail', duration: '失败', outRows: src.outRows, retries: Math.max(src.retries, 1) };
          if (order.indexOf(n.id) > i) return { ...n, state: 'idle', started: '已跳过', duration: '—' };
          return n;
        }));
        setEdgeStates((prev) => {
          const next = { ...prev };
          inbound.forEach(([s, t]) => { next[edgeKey(s, t)] = 'fail'; });
          return next;
        });
        pushLog('ERROR', `[${src.label}] 执行失败 · ${src.sqlHint || '见节点错误详情'}`);
        pushLog('ERROR', `流程中断，下游 ${outbound.map(([, t]) => base[t]?.label).filter(Boolean).join('、') || '无'} 已跳过`);
        setRunProgress(100);
        break;
      }

      const finalState = willWarn ? 'warn' : 'ok';
      const cost = src.duration === '进行中' || src.duration === '—' || src.duration === '持续' ? `${(0.8 + Math.random() * 2).toFixed(1)}s` : src.duration;
      setLiveGraph((g) => g.map((n) => n.id === id
        ? { ...n, state: finalState, duration: cost, outRows: src.outRows, started: nowStamp() }
        : n));
      setEdgeStates((prev) => {
        const next = { ...prev };
        inbound.forEach(([s, t]) => { next[edgeKey(s, t)] = 'done'; });
        outbound.forEach(([s, t]) => { if ((next[edgeKey(s, t)] || 'idle') === 'idle') next[edgeKey(s, t)] = 'active'; });
        return next;
      });
      if (willWarn) pushLog('WARN', `[${src.label}] 质量告警 · 异常分流后继续 · out=${src.outRows}`);
      else pushLog('SUCCESS', `[${src.label}] 完成 · in=${src.inRows} out=${src.outRows} · cost=${cost}`);
      await sleep(220);
    }

    if (!abortRef.current) {
      setEdgeStates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { if (next[k] === 'active') next[k] = runFailed ? next[k] : 'done'; });
        return next;
      });
      setRunProgress(100);
      setRanOk(true);
      if (runFailed) {
        pushLog('ERROR', `======= 试跑结束（失败） ${target.name} =======`);
        notify('试跑结束：存在失败节点');
      } else {
        pushLog('SUCCESS', `======= 试跑结束（成功） ${target.name} =======`);
        notify('试跑完成');
      }
    }
    setRunning(false);
  };

  const demoAccept = async () => {
    if (running || demoing) return;
    setDemoing(true);
    setArranged(true);
    const offline = flows.find((f) => f.kind === '离线DAG') || flows[0];
    selectFlow(offline);
    notify('① 拖拽编排：已选离线 DAG');
    await new Promise((r) => setTimeout(r, 400));
    await startRun(offline);
    notify('② 运行完成 · 节点状态可追溯');
    setLineageOk(true);
    notify('③ 血缘可打开对照 · 验收完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="OFFLINE DAG / REALTIME FLOW · A4-03"
        title="离线 / 实时流程编排"
        desc="验收：拖拽编排 → 运行试跑 → 血缘可追溯；支持 Flink/Spark 实时任务与上下线。"
        actions={
          <>
            <Btn icon="zap" loading={demoing || running} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="network" onClick={() => { setLineageOk(true); go('/collection/lineage'); }}>血缘</Btn>
            <Btn variant="primary" icon="play" loading={running} onClick={() => startRun()}>试跑</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '拖拽编排', d: '离线 DAG / 实时', on: arranged },
          { n: '02', t: '运行试跑', d: '节点·日志', on: ranOk },
          { n: '03', t: '血缘追溯', d: '上下游可查', on: lineageOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em><strong>{s.t}</strong><small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {lineageOk ? '血缘可追溯' : ranOk ? '试跑完成' : running ? '试跑中' : '待验收'}</span>
      </div>

      <div className="flow-guide mt-14">
        <span><b>1</b> 选流程</span><i>→</i>
        <span><b>2</b> 点节点看详情</span><i>→</i>
        <span><b>3</b> 试跑看日志</span><i>→</i>
        <span><b>4</b> 上线运维</span>
        <em><Icon name="git" size={11} /> React Flow · 点击节点打开抽屉</em>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="流程总数" value={String(flows.length)} unit="条" delta="样例数据" icon="workflow" tone="blue" />
        <StatCard label="离线 DAG" value={String(flows.filter((f) => f.kind === '离线DAG').length)} unit="条" delta="周期调度" icon="layers" tone="violet" />
        <StatCard label="实时任务" value={String(flows.filter((f) => f.kind !== '离线DAG').length)} unit="条" delta="Flink / Spark" icon="zap" tone="amber" />
        <StatCard label="异常" value={String(flows.filter((f) => f.status === '失败').length)} unit="条" delta="需干预" icon="circlealert" tone="red" onClick={() => { setKind('全部'); selectFlow(flows.find((f) => f.status === '失败') || flows[0]); }} />
      </div>

      <div className="dag-layout dag-layout-2 mt-14">
        <aside className="dag-list-panel">
          <div className="dag-list-head">
            <div>
              <strong>流程目录</strong>
              <small>{rows.length} 条</small>
            </div>
            <Select value={kind} onChange={setKind} options={['全部', '离线DAG', '实时Flink', '实时Spark']} width={108} />
          </div>
          <div className="dag-list-search">
            <SearchInput value={q} onChange={setQ} placeholder="检索流程 / 负责人" width="100%" />
          </div>
          <div className="dag-list">
            {rows.map((f) => (
              <button key={f.id} type="button" className={`dag-flow-card ${active.id === f.id ? 'is-active' : ''}`} onClick={() => selectFlow(f)}>
                <div className="dag-flow-card-top">
                  <Badge tone={kindTone(f.kind)}>{f.kind === '离线DAG' ? 'DAG' : f.kind === '实时Flink' ? 'Flink' : 'Spark'}</Badge>
                  <Badge tone={toneOf(f.status)} dot>{f.status}</Badge>
                </div>
                <strong>{f.name}</strong>
                <small>{f.cron} · {f.owner}</small>
                <div className="dag-flow-meta">
                  <span>{f.nodes} 节点</span>
                  <span>成功率 {f.success || '—'}%</span>
                </div>
              </button>
            ))}
            {!rows.length && <div className="dag-empty">无匹配流程</div>}
          </div>
        </aside>

        <section className="dag-canvas-panel">
          <div className="dag-canvas-toolbar">
            <div>
              <h3>{active.name}</h3>
              <p>{active.desc} · 点击节点打开详情抽屉</p>
            </div>
            <div className="dag-canvas-actions">
              <Btn size="sm" variant="primary" icon="play" loading={running} onClick={() => startRun()}>{running ? '试跑中' : '试跑'}</Btn>
              <Btn size="sm" icon="circlealert" disabled={!running && !runOpen} onClick={stopRun}>终止</Btn>
              <Btn size="sm" icon="terminal" onClick={() => setRunOpen(true)} disabled={!logs.length}>运行日志</Btn>
              <Btn size="sm" icon="download" onClick={() => notify('流程已导出 JSON')}>导出</Btn>
              <Btn size="sm" icon="checkcircle" onClick={() => notify(active.status === '已下线' || active.status === '草稿' ? `${active.name} 已上线` : `${active.name} 已下线`)}>
                {active.status === '已下线' || active.status === '草稿' ? '上线' : '下线'}
              </Btn>
            </div>
          </div>

          <div className={`dag-canvas dag-canvas-rf ${runOpen ? 'with-console' : ''}`}>
            <LakeFlowCanvas
              key={active.id}
              graph={liveGraph}
              edges={active.edges}
              edgeStates={edgeStates}
              selectedId={selectedId || ''}
              onSelect={(id) => {
                if (!id) {
                  setSelectedId(null);
                  setDrawerOpen(false);
                  return;
                }
                setSelectedId(id);
                setDrawerOpen(true);
              }}
            />
            <div className="dag-legend">
              <span><i className="ok" />成功</span>
              <span><i className="run" />运行中</span>
              <span><i className="warn" />告警</span>
              <span><i className="fail" />失败</span>
              <span><i className="idle" />待执行</span>
            </div>

            {runOpen && (
              <div className="dag-run-console">
                <div className="dag-run-console-head">
                  <div>
                    <strong><Icon name="terminal" size={13} /> 运行终端</strong>
                    <small>{active.id} · {running ? 'RUNNING' : runProgress >= 100 ? 'FINISHED' : 'IDLE'}</small>
                  </div>
                  <div className="dag-run-console-actions">
                    <span className="dag-run-prog">{runProgress}%</span>
                    {running ? <button type="button" className="link-muted" onClick={stopRun}>终止</button> : null}
                    <button type="button" className="link-muted" onClick={() => setRunOpen(false)}>收起</button>
                  </div>
                </div>
                <div className="dag-run-prog-track"><i style={{ width: `${runProgress}%` }} /></div>
                <div className="dag-run-console-body" ref={logBoxRef}>
                  {logs.map((l, idx) => (
                    <div key={`${l.t}-${idx}`} className={`dag-log-line lv-${l.level.toLowerCase()}`}>
                      <span className="lt">{l.t}</span>
                      <span className="li">{l.level}</span>
                      <span className="lm">{l.msg}</span>
                    </div>
                  ))}
                  {!logs.length && <div className="dag-log-line lv-info"><span className="lm">等待试跑…</span></div>}
                  {running && <div className="dag-log-cursor">█</div>}
                </div>
              </div>
            )}
          </div>

          <div className="dag-canvas-foot">
            <span><Icon name="clock" size={12} /> 调度 {active.cron}</span>
            <span><Icon name="activity" size={12} /> 最近 {active.last}</span>
            <span><Icon name="users" size={12} /> {active.owner}</span>
            <button type="button" className="link-btn" onClick={() => go('/collection/tasks')}>查看运行实例 <Icon name="arrowright" size={11} /></button>
          </div>
        </section>
      </div>

      <Drawer
        open={drawerOpen && !!selected}
        onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        title={selected?.label || '节点详情'}
        desc={selected ? `${selected.engine} · ${selected.kind}` : ''}
        width={460}
        footer={
          <>
            <Btn onClick={() => { setDrawerOpen(false); setSelectedId(null); }}>关闭</Btn>
            <Btn icon="code" onClick={() => go('/bid/data-query')}>查数</Btn>
            <Btn variant="primary" onClick={() => notify('节点配置已保存')}>保存</Btn>
          </>
        }
      >
        {selected && (
          <>
            <div className="dag-node-badge">
              <span className={`dag-node-icon tone-${selected.tone}`}><Icon name={selected.icon} size={17} /></span>
              <div>
                <strong>{selected.label}</strong>
                <small>{selected.resource}</small>
              </div>
              <Badge tone={selected.state === 'fail' ? 'red' : selected.state === 'warn' ? 'amber' : selected.state === 'run' ? 'blue' : selected.state === 'idle' ? 'slate' : 'green'} dot>
                {selected.state === 'ok' ? '成功' : selected.state === 'run' ? '运行' : selected.state === 'warn' ? '告警' : selected.state === 'fail' ? '失败' : '待执行'}
              </Badge>
            </div>
            <KeyValue cols={1} items={[
              { label: '资源 / 表', value: <span className="mono">{selected.resource}</span> },
              { label: '执行引擎', value: selected.engine },
              { label: '耗时', value: selected.duration },
              { label: '输入 / 输出', value: `${selected.inRows} → ${selected.outRows}` },
              { label: '负责人', value: selected.owner },
              { label: '重试次数', value: String(selected.retries) },
              { label: '开始时间', value: selected.started },
              { label: '依赖入边', value: `${active.edges.filter(([, t]) => t === selected.id).length} 条` },
              { label: '下游出边', value: `${active.edges.filter(([s]) => s === selected.id).length} 条` },
            ]} />
            {selected.sqlHint && (
              <>
                <div className="divider-h" />
                <div className="section-title-sm">脚本 / 说明</div>
                <div className="dag-sql-box mt-10">{selected.sqlHint}</div>
              </>
            )}
          </>
        )}
      </Drawer>

      <Modal open={open} onClose={() => setOpen(false)} title="新建流程" width={560}
        footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('流程草稿已创建'); }}>创建草稿</Btn></>}>
        <div className="form-grid">
          <Field label="流程名称" required className="span-2"><input className="input" placeholder="例如：住院费用日批" /></Field>
          <Field label="类型" required><Select value="离线DAG" onChange={() => {}} options={['离线DAG', '实时Flink', '实时Spark']} /></Field>
          <Field label="调度"><input className="input" placeholder="Cron 或持续" /></Field>
          <Field label="说明" className="span-2"><textarea className="textarea" rows={3} placeholder="加工目标与依赖说明" /></Field>
        </div>
      </Modal>
    </>
  );
}
