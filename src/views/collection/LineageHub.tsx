'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { GraphEdge, GraphNode, LineageGraph } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Empty, KeyValue, PageHeader, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'table' | 'field' | 'impact' | 'deps';

type FieldMap = {
  id: string;
  upstream: string;
  field: string;
  transform: string;
  downstream: string;
  confidence: number;
};

type ImpactItem = {
  id: string;
  object: string;
  change: string;
  level: '高' | '中' | '低';
  tables: number;
  indicators: number;
  apps: number;
  owner: string;
  time: string;
};

const layerNodes: GraphNode[] = [
  { id: 'src1', label: 'HIS 生产库', sub: '源端', type: 'source', x: 16, y: 60, w: 140 },
  { id: 'src2', label: 'EMR 临床库', sub: '源端', type: 'source', x: 16, y: 180, w: 140 },
  { id: 'src3', label: 'LIS 生产库', sub: '源端', type: 'source', x: 16, y: 300, w: 140 },
  { id: 'ods1', label: 'ods_his.patient', sub: 'ODS', type: 'ods', x: 200, y: 40, w: 150 },
  { id: 'ods2', label: 'ods_his.outpatient', sub: 'ODS', type: 'ods', x: 200, y: 130, w: 150 },
  { id: 'ods3', label: 'ods_emr.diagnosis', sub: 'ODS', type: 'ods', x: 200, y: 220, w: 150 },
  { id: 'ods4', label: 'ods_lis.lab_report', sub: 'ODS', type: 'ods', x: 200, y: 320, w: 150 },
  { id: 'dwd1', label: 'dwd_fact_visit', sub: 'DWD', type: 'model', x: 400, y: 80, w: 150 },
  { id: 'dwd2', label: 'dwd_fact_lab', sub: 'DWD', type: 'model', x: 400, y: 220, w: 150 },
  { id: 'dws1', label: 'dws_visit_day', sub: 'DWS', type: 'model', x: 590, y: 80, w: 150 },
  { id: 'dws2', label: 'dws_lab_month', sub: 'DWS', type: 'model', x: 590, y: 220, w: 150 },
  { id: 'ads1', label: 'ads_ops_daily', sub: 'ADS', type: 'indicator', x: 780, y: 40, w: 160 },
  { id: 'ads2', label: '门诊预约爽约人次', sub: '指标', type: 'indicator', x: 780, y: 130, w: 160 },
  { id: 'ads3', label: '检验报告及时率', sub: '指标', type: 'indicator', x: 780, y: 220, w: 160 },
  { id: 'app1', label: '运营驾驶舱', sub: '应用', type: 'app', x: 780, y: 330, w: 160 },
];

const layerEdges: GraphEdge[] = [
  { from: 'src1', to: 'ods1' }, { from: 'src1', to: 'ods2' },
  { from: 'src2', to: 'ods3' }, { from: 'src3', to: 'ods4' },
  { from: 'ods1', to: 'dwd1' }, { from: 'ods2', to: 'dwd1' },
  { from: 'ods3', to: 'dwd1' }, { from: 'ods4', to: 'dwd2' },
  { from: 'dwd1', to: 'dws1' }, { from: 'dwd2', to: 'dws2' },
  { from: 'dws1', to: 'ads1' }, { from: 'dws1', to: 'ads2' },
  { from: 'dws2', to: 'ads3' },
  { from: 'ads1', to: 'app1' }, { from: 'ads2', to: 'app1' },
];

const fieldMaps: FieldMap[] = [
  { id: 'F01', upstream: 'ods_his.patient.patient_id', field: 'patient_id', transform: '直映', downstream: 'dwd_fact_visit.patient_id', confidence: 100 },
  { id: 'F02', upstream: 'ods_his.outpatient.visit_id', field: 'visit_id', transform: '直映', downstream: 'dwd_fact_visit.visit_id', confidence: 100 },
  { id: 'F03', upstream: 'ods_his.outpatient.dept_code', field: 'dept_id', transform: '字典映射', downstream: 'dwd_fact_visit.dept_id', confidence: 96 },
  { id: 'F04', upstream: 'ods_his.patient.id_card', field: 'id_no_mask', transform: '脱敏哈希', downstream: 'dwd_fact_visit.id_no_mask', confidence: 99 },
  { id: 'F05', upstream: 'ods_emr.diagnosis.icd_code', field: 'diag_code', transform: '国标对码', downstream: 'dwd_fact_visit.main_diag', confidence: 92 },
  { id: 'F06', upstream: 'dwd_fact_visit.visit_id', field: 'visit_cnt', transform: 'COUNT DISTINCT', downstream: 'dws_visit_day.outpatient_cnt', confidence: 98 },
  { id: 'F07', upstream: 'dws_visit_day.outpatient_cnt', field: 'outpatient_cnt', transform: '聚合', downstream: 'ads_ops_daily.mz_rc', confidence: 97 },
  { id: 'F08', upstream: 'dwd_fact_visit.appt_status', field: 'no_show_flag', transform: 'CASE 编码', downstream: '门诊预约爽约人次.value', confidence: 90 },
];

const impacts: ImpactItem[] = [
  { id: 'IM-01', object: 'ods_his.outpatient.dept_code', change: '字段类型变更 VARCHAR→INT', level: '高', tables: 6, indicators: 12, apps: 3, owner: '平台', time: '08-06 13:20' },
  { id: 'IM-02', object: 'dim_department', change: '新增院区维度', level: '中', tables: 4, indicators: 6, apps: 2, owner: '主数据', time: '08-06 11:05' },
  { id: 'IM-03', object: '门诊预约爽约人次', change: '口径增加取消预约', level: '中', tables: 1, indicators: 2, apps: 1, owner: '门诊部', time: '08-05 16:40' },
  { id: 'IM-04', object: 'ods_lis.lab_report', change: '分区策略调整', level: '低', tables: 2, indicators: 1, apps: 0, owner: '检验科', time: '08-05 09:12' },
];

const deps = [
  { id: 'D1', from: 'dwd_fact_visit', to: 'dws_visit_day', type: '表依赖', strength: '强', via: '日批任务 CT-02' },
  { id: 'D2', from: 'dws_visit_day', to: 'ads_ops_daily', type: '表依赖', strength: '强', via: '运营汇总' },
  { id: 'D3', from: 'ods_his.patient', to: 'dwd_fact_visit', type: '表依赖', strength: '强', via: '主索引关联' },
  { id: 'D4', from: 'dim_department', to: 'dwd_fact_visit', type: '维度依赖', strength: '中', via: '科室维' },
  { id: 'D5', from: '门诊预约爽约人次', to: '运营驾驶舱', type: '指标→应用', strength: '中', via: '看板卡片' },
  { id: 'D6', from: '检验结果实时入仓', to: 'ods_lis.lab_report', type: '任务→表', strength: '强', via: 'Flink CDC' },
];

const toneLevel = (l: string) => (l === '高' ? 'red' : l === '中' ? 'amber' : 'slate');

/** A5-01 依赖 / 血缘 / 数据追溯 */
type AcceptPhase = 'field' | 'impact';

export function LineageHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('table');
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [focus, setFocus] = useState('visit');
  const [q, setQ] = useState('');
  const [fieldFocus, setFieldFocus] = useState('dwd_fact_visit');
  const [impactOpen, setImpactOpen] = useState<ImpactItem | null>(null);
  const [phase, setPhase] = useState<AcceptPhase>('field');
  const [fieldOk, setFieldOk] = useState(false);
  const [impactOk, setImpactOk] = useState(false);
  const [demoing, setDemoing] = useState(false);

  const fields = useMemo(() => fieldMaps.filter((f) =>
    (f.upstream + f.field + f.downstream).toLowerCase().includes(q.toLowerCase())
    && (fieldFocus === 'all' || f.downstream.includes(fieldFocus) || f.upstream.includes(fieldFocus))
  ), [q, fieldFocus]);

  const impactForNode = useMemo(() => {
    if (!selected) return null;
    return {
      upstream: layerEdges.filter((e) => e.to === selected.id).length,
      downstream: layerEdges.filter((e) => e.from === selected.id).length,
      risk: selected.type === 'ods' ? '高' : selected.type === 'model' ? '中' : '低',
    };
  }, [selected]);

  const demoAccept = async () => {
    setDemoing(true);
    setTab('field'); setPhase('field'); setFieldFocus('dwd_fact_visit'); setFieldOk(true);
    notify('① 字段级上下游：dwd_fact_visit 可查');
    await new Promise((r) => setTimeout(r, 500));
    setTab('impact'); setPhase('impact');
    const high = impacts.find((i) => i.level === '高') || impacts[0];
    setImpactOpen(high); setImpactOk(true);
    notify(`② 影响范围评估：${high?.object || '高影响变更'} · ${high?.level || '高'} · 影响 ${high?.tables || 0} 表`);
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="LINEAGE · IMPACT · TRACE · A5-01"
        title="依赖 / 血缘 / 数据追溯"
        desc="验收：字段级上下游可查 → 影响范围可评估；覆盖 ODS→DWD→DWS→ADS 全链路。"
        actions={
          <>
            <Btn icon="zap" loading={demoing} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="download" onClick={() => notify('血缘图谱已导出')}>导出图谱</Btn>
            <Btn variant="primary" icon="refresh" onClick={() => notify('血缘解析任务已提交')}>重新解析</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '字段上下游', d: '表/字段血缘可查', k: 'field' as const, on: fieldOk },
          { n: '02', t: '影响评估', d: '变更范围可量化', k: 'impact' as const, on: impactOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${phase === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 1 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {impactOk ? '影响已评估' : fieldOk ? '字段已定位' : 'ODS→ADS 全链路'}</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="图谱节点" value="186" unit="个" delta="源/表/指标/应用" icon="network" tone="blue" onClick={() => setTab('table')} />
        <StatCard label="字段血缘" value={String(fieldMaps.length)} unit="条" delta="置信度 ≥ 90%" icon="braces" tone="violet" onClick={() => setTab('field')} />
        <StatCard label="高影响变更" value={String(impacts.filter((i) => i.level === '高').length)} unit="项" delta="待评估" icon="alert" tone="red" onClick={() => setTab('impact')} />
        <StatCard label="分层覆盖" value="94" unit="%" delta="ODS→ADS" icon="layers" tone="green" onClick={() => setTab('deps')} />
      </div>

      <div className="lineage-layers mt-14">
        {['源端', 'ODS', 'DWD', 'DWS', 'ADS / 指标', '应用'].map((l, i) => (
          <React.Fragment key={l}>
            <div className="ll-chip"><em>{i + 1}</em><span>{l}</span></div>
            {i < 5 && <Icon name="arrowright" size={12} />}
          </React.Fragment>
        ))}
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'table', label: '表级血缘' },
          { key: 'field', label: '字段级血缘', count: fieldMaps.length },
          { key: 'impact', label: '影响分析', count: impacts.length },
          { key: 'deps', label: '依赖关系', count: deps.length },
        ]}
      />

      {tab === 'table' && (
        <>
          <Card className="mt-14" noPad
            title="全链路血缘图"
            subtitle="源端 → ODS → DWD → DWS → ADS → 应用 · 点击节点查看影响"
            actions={
              <div className="filter-bar">
                <Select
                  value={focus}
                  onChange={setFocus}
                  options={[
                    { value: 'visit', label: '就诊主题' },
                    { value: 'lab', label: '检验主题' },
                    { value: 'all', label: '全部' },
                  ]}
                  width={120}
                />
                <Btn size="sm" onClick={() => go('/collection/lake-flows')}>流程 DAG</Btn>
              </div>
            }
          >
            <div className="graph-wrap">
              <LineageGraph
                nodes={layerNodes}
                edges={layerEdges}
                height={420}
                onSelect={(n) => {
                  setSelected(n);
                  notify(`已选中 ${n.label}，可查看字段血缘与影响范围`, 'info');
                }}
              />
            </div>
          </Card>

          <div className="grid grid-2-1 mt-14">
            <Card title="选中节点 · 上下游" subtitle={selected ? selected.label : '点击图谱节点'}>
              {selected && impactForNode ? (
                <>
                  <div className="drawer-summary">
                    <div><span>类型</span><strong>{selected.sub || selected.type}</strong></div>
                    <div><span>上游</span><strong>{impactForNode.upstream}</strong></div>
                    <div><span>下游</span><strong>{impactForNode.downstream}</strong></div>
                    <div><span>变更风险</span><strong className={impactForNode.risk === '高' ? 'text-red' : impactForNode.risk === '中' ? 'text-amber' : ''}>{impactForNode.risk}</strong></div>
                  </div>
                  <div className="row-actions mt-14">
                    <Btn size="sm" onClick={() => { setFieldFocus(selected.label.split(' ')[0] || selected.label); setTab('field'); }}>查看字段血缘</Btn>
                    <Btn size="sm" variant="primary" onClick={() => setTab('impact')}>评估影响范围</Btn>
                  </div>
                </>
              ) : (
                <Empty icon="network" title="未选择节点" desc="在图谱中点击表或指标，查看上下游与追溯路径。" />
              )}
            </Card>
            <Card title="血缘完整度" subtitle="按分层">
              <div className="coverage-list">
                {[['源端 → ODS', 100], ['ODS → DWD', 98], ['DWD → DWS', 94], ['DWS → ADS', 91], ['ADS → 应用', 84]].map(([l, v]) => (
                  <div key={l as string}><span>{l}</span><strong>{v}%</strong><div className="coverage-track"><i style={{ width: `${v}%` }} /></div></div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'field' && (
        <Card className="mt-14" title="字段级血缘" subtitle="上游字段 → 转换 → 下游字段" noPad
          actions={
            <div className="filter-bar">
              <Select
                value={fieldFocus}
                onChange={setFieldFocus}
                options={[
                  { value: 'all', label: '全部对象' },
                  { value: 'dwd_fact_visit', label: 'dwd_fact_visit' },
                  { value: 'dws_visit_day', label: 'dws_visit_day' },
                  { value: 'ads_ops_daily', label: 'ads_ops_daily' },
                  { value: '门诊预约', label: '门诊预约爽约人次' },
                ]}
                width={160}
              />
              <SearchInput value={q} onChange={setQ} placeholder="字段名" width={180} />
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={fields}
              pageSize={8}
              columns={[
                { key: 'upstream', title: '上游字段', render: (r) => <span className="mono-cell">{r.upstream}</span> },
                { key: 'transform', title: '转换', width: 100, render: (r) => <Badge tone="blue">{r.transform}</Badge> },
                { key: 'field', title: '本层字段', width: 110, render: (r) => <span className="mono-cell">{r.field}</span> },
                { key: 'downstream', title: '下游字段', render: (r) => <span className="mono-cell">{r.downstream}</span> },
                {
                  key: 'confidence', title: '置信度', width: 90,
                  render: (r) => <span className={r.confidence >= 95 ? 'text-green' : 'text-amber'}>{r.confidence}%</span>,
                },
                {
                  key: 'ops', title: '追溯', width: 80,
                  render: (r) => (
                    <button className="link-btn" onClick={() => {
                      notify(`已定位字段链路：${r.upstream} → ${r.downstream}`);
                      setTab('table');
                    }}>定位</button>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'impact' && (
        <Card className="mt-14" title="影响分析" subtitle="变更对象的下游波及范围" noPad
          actions={<Btn size="sm" onClick={() => notify('已生成影响分析报告')}>生成报告</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={impacts}
              pageSize={8}
              onRowClick={(r) => setImpactOpen(r as ImpactItem)}
              columns={[
                { key: 'object', title: '变更对象', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.object}</strong><small>{r.change}</small></div> },
                { key: 'level', title: '影响等级', width: 80, render: (r) => <Badge tone={toneLevel(r.level)}>{r.level}</Badge> },
                { key: 'tables', title: '表', width: 50, align: 'right', render: (r) => r.tables },
                { key: 'indicators', title: '指标', width: 50, align: 'right', render: (r) => r.indicators },
                { key: 'apps', title: '应用', width: 50, align: 'right', render: (r) => r.apps },
                { key: 'owner', title: '负责人', width: 70, render: (r) => r.owner },
                { key: 'time', title: '发现时间', width: 100, render: (r) => r.time },
                {
                  key: 'ops', title: '操作', width: 80,
                  render: (r) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); setImpactOpen(r); }}>评估</button>,
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'deps' && (
        <Card className="mt-14" title="依赖关系" subtitle="表 / 维度 / 任务 / 指标 → 应用" noPad>
          <div className="pad-h">
            <DataTable
              rows={deps}
              pageSize={8}
              columns={[
                { key: 'from', title: '上游', render: (r) => <span className="mono-cell">{r.from}</span> },
                { key: 'to', title: '下游', render: (r) => <span className="mono-cell">{r.to}</span> },
                { key: 'type', title: '类型', width: 100, render: (r) => <Badge tone="slate">{r.type}</Badge> },
                { key: 'strength', title: '强度', width: 60, render: (r) => <Badge tone={r.strength === '强' ? 'red' : 'amber'}>{r.strength}</Badge> },
                { key: 'via', title: '路径', render: (r) => r.via },
                {
                  key: 'ops', title: '操作', width: 90,
                  render: () => <button className="link-btn" onClick={() => setTab('table')}>在图谱查看</button>,
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer
        open={!!impactOpen}
        onClose={() => setImpactOpen(null)}
        title={impactOpen ? `影响评估 · ${impactOpen.object}` : ''}
        desc={impactOpen?.change}
        width={560}
        footer={
          <>
            <Btn onClick={() => setImpactOpen(null)}>关闭</Btn>
            <Btn onClick={() => { notify('已通知下游负责人'); setImpactOpen(null); }}>通知下游</Btn>
            <Btn variant="primary" onClick={() => { setTab('field'); setImpactOpen(null); }}>查看字段血缘</Btn>
          </>
        }
      >
        {impactOpen && (
          <>
            <div className="drawer-summary">
              <div><span>等级</span><strong>{impactOpen.level}</strong></div>
              <div><span>表</span><strong>{impactOpen.tables}</strong></div>
              <div><span>指标</span><strong>{impactOpen.indicators}</strong></div>
              <div><span>应用</span><strong>{impactOpen.apps}</strong></div>
            </div>
            <KeyValue className="mt-14" cols={1} items={[
              { label: '变更说明', value: impactOpen.change },
              { label: '负责人', value: impactOpen.owner },
              { label: '发现时间', value: impactOpen.time },
              { label: '建议', value: impactOpen.level === '高' ? '阻断发布，先完成下游回归' : '可灰度发布并复核指标' },
            ]} />
          </>
        )}
      </Drawer>
    </>
  );
}

/** 兼容 center/graph 入口 */
export function GraphPage() {
  return <LineageHubPage />;
}
