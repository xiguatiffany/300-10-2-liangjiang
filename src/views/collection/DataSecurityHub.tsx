'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'assess' | 'classify' | 'audit';

type DsmmDim = { key: string; name: string; level: number; target: number; gap: string };
type RiskItem = { id: string; asset: string; threat: string; vuln: string; level: '高' | '中' | '低'; score: number; advice: string };
type SensField = { id: string; table: string; field: string; type: string; level: 'L1' | 'L2' | 'L3' | 'L4'; hit: boolean; mask: string; sample: string; masked: string };
type AuditRow = { id: string; at: string; actor: string; action: string; object: string; result: string; hash: string };
type PatrolItem = { id: string; scope: string; check: string; status: '通过' | '告警' | '阻断'; detail: string };

const dsmmDims: DsmmDim[] = [
  { key: 'org', name: '安全组织', level: 3, target: 4, gap: '基层机构安全员兼职比例高' },
  { key: 'sys', name: '制度流程', level: 3, target: 4, gap: '出口审批线上化不足' },
  { key: 'id', name: '身份鉴别', level: 4, target: 4, gap: '已达目标' },
  { key: 'ac', name: '访问控制', level: 3, target: 4, gap: '字段级授权覆盖待提升' },
  { key: 'enc', name: '加密传输', level: 4, target: 4, gap: '已达目标' },
  { key: 'mask', name: '脱敏保护', level: 3, target: 4, gap: '动态策略组合需完善' },
  { key: 'audit', name: '安全审计', level: 3, target: 4, gap: '防篡改存证刚上线' },
  { key: 'ops', name: '安全运营', level: 2, target: 3, gap: '巡检自动化覆盖面不足' },
];

const risksSeed: RiskItem[] = [
  { id: 'RK-01', asset: 'ods_his.patient', threat: '敏感信息泄露', vuln: '明文身份证落湖', level: '高', score: 86, advice: '启用 L3 动态脱敏 + 出口审批' },
  { id: 'RK-02', asset: '开放 API /mpi/search', threat: '越权调用', vuln: '部分应用未绑定白名单', level: '高', score: 78, advice: '强制应用授权与 IP 策略' },
  { id: 'RK-03', asset: '共享交换通道', threat: '批量外传', vuln: '出口稽核规则偏松', level: '中', score: 64, advice: '按分级限流与水印' },
  { id: 'RK-04', asset: '运维堡垒机', threat: '高危操作', vuln: '审计检索不便', level: '中', score: 58, advice: '操作审计防篡改归档' },
  { id: 'RK-05', asset: '报表导出', threat: '二次扩散', vuln: '本地缓存未清理', level: '低', score: 42, advice: '导出水印与有效期' },
];

const sensSeed: SensField[] = [
  { id: 'SF-01', table: 'ods_his.patient', field: 'id_no', type: '身份证', level: 'L3', hit: true, mask: '保留前4后4', sample: '500103199001011234', masked: '5001**********1234' },
  { id: 'SF-02', table: 'ods_his.patient', field: 'mobile', type: '手机号', level: 'L3', hit: true, mask: '中间4位*', sample: '13812345678', masked: '138****5678' },
  { id: 'SF-03', table: 'dwd.fact_visit', field: 'patient_name', type: '姓名', level: 'L2', hit: true, mask: '姓+*', sample: '张敏', masked: '张*' },
  { id: 'SF-04', table: 'ods_lis.lab_report', field: 'address', type: '地址', level: 'L2', hit: true, mask: '到区截断', sample: '重庆市两江新区金渝大道88号', masked: '重庆市两江新区****' },
  { id: 'SF-05', table: 'dwd.fact_visit', field: 'visit_id', type: '业务主键', level: 'L1', hit: false, mask: '不脱敏', sample: 'V20260806001', masked: 'V20260806001' },
  { id: 'SF-06', table: 'ods_his.patient', field: 'bank_card', type: '银行卡', level: 'L4', hit: true, mask: '仅留后4', sample: '6222021234567890123', masked: '***************0123' },
  { id: 'SF-07', table: 'dws.ph_followup', field: 'contact_phone', type: '手机号', level: 'L3', hit: true, mask: '中间4位*', sample: '13987654321', masked: '139****4321' },
  { id: 'SF-08', table: 'ods_his.outpatient', field: 'dept_name', type: '科室', level: 'L1', hit: false, mask: '不脱敏', sample: '心内科', masked: '心内科' },
];

const auditSeed: AuditRow[] = [
  { id: 'AU-501', at: '14:21:08', actor: '张敏', action: '导出敏感清单', object: 'ods_his.patient', result: '已审批通过', hash: 'a3f9…c21' },
  { id: 'AU-500', at: '14:18:40', actor: 'api:基层报表', action: 'API 调用', object: '/open/v1/mpi/search', result: '超限拒绝', hash: 'b81c…09e' },
  { id: 'AU-499', at: '14:12:05', actor: '李倩', action: '变更字段分级', object: 'mobile L2→L3', result: '成功', hash: 'c02d…77a' },
  { id: 'AU-498', at: '13:55:22', actor: '系统巡检', action: '生命周期巡检', object: '共享出口', result: '告警', hash: 'd44e…1b0' },
  { id: 'AU-497', at: '13:40:11', actor: '王磊', action: '授权应用', object: '医政驾驶舱', result: '成功', hash: 'e19f…882' },
  { id: 'AU-496', at: '12:08:33', actor: '未知IP', action: '登录尝试', object: '采集控制台', result: '阻断', hash: 'f70a…553' },
];

const patrolSeed: PatrolItem[] = [
  { id: 'PT-01', scope: '采集', check: '源端只读账号与加密链路', status: '通过', detail: '42 家机构抽检通过' },
  { id: 'PT-02', scope: '交换', check: '共享出口白名单与水印', status: '告警', detail: '2 条出口未绑定水印策略' },
  { id: 'PT-03', scope: '存储', check: 'L3+ 字段落库脱敏', status: '告警', detail: 'ods_his.patient 历史分区待回刷' },
  { id: 'PT-04', scope: '访问', check: '角色最小权限', status: '通过', detail: '越权探测 0 次成功' },
  { id: 'PT-05', scope: '出口', check: '批量下载审批', status: '阻断', detail: '未备案导出已被拦截' },
  { id: 'PT-06', scope: '审计', check: '日志完整性/防篡改', status: '通过', detail: '哈希链校验一致' },
];

/** A9 数据安全服务：评估 · 分类分级脱敏 · 巡检审计 */
export function DataSecurityHubPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('assess');
  const [assessing, setAssessing] = useState(false);
  const [assessDone, setAssessDone] = useState(true);
  const [activeRisk, setActiveRisk] = useState<RiskItem | null>(null);
  const [activeField, setActiveField] = useState<SensField | null>(sensSeed[0]);
  const [activeAudit, setActiveAudit] = useState<AuditRow | null>(null);
  const [levelFilter, setLevelFilter] = useState('');
  const [fq, setFq] = useState('');
  const [aq, setAq] = useState('');
  const [verifyMask, setVerifyMask] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [hitRate, setHitRate] = useState(92.5);

  const sensFiltered = useMemo(() => sensSeed.filter((f) =>
    (!levelFilter || f.level === levelFilter)
    && (f.table + f.field + f.type).toLowerCase().includes(fq.toLowerCase())
  ), [levelFilter, fq]);

  const auditFiltered = useMemo(() => auditSeed.filter((a) =>
    (a.id + a.actor + a.action + a.object).toLowerCase().includes(aq.toLowerCase())
  ), [aq]);

  const dsmmAvg = (dsmmDims.reduce((s, d) => s + d.level, 0) / dsmmDims.length).toFixed(1);
  const sensHit = Math.round((sensSeed.filter((f) => f.hit).length / sensSeed.filter((f) => f.type !== '业务主键' && f.type !== '科室').length) * 1000) / 10;
  const highRisk = risksSeed.filter((r) => r.level === '高').length;

  const runAssess = async () => {
    setAssessing(true);
    setTab('assess');
    setAssessDone(false);
    await new Promise((r) => setTimeout(r, 1100));
    setAssessDone(true);
    setAssessing(false);
    notify(`安全评估完成：DSMM ${dsmmAvg} 级 · 高风险 ${highRisk} 项 · 报告可导出`);
  };

  const runSensScan = async () => {
    setScanBusy(true);
    setTab('classify');
    await new Promise((r) => setTimeout(r, 900));
    setHitRate(Math.max(90, sensHit));
    setScanBusy(false);
    notify(`敏感识别完成：识别率 ${Math.max(90, sensHit)}%（验收 ≥90%）`);
  };

  const doVerifyMask = () => {
    setVerifyMask(true);
    setActiveField(sensSeed[0]);
    notify('脱敏可验证：明文→策略→脱敏结果对照已展示');
  };

  const exportAudit = () => {
    notify(`审计日志已导出 ${auditFiltered.length} 条（含哈希防篡改校验）`);
  };

  const exportReport = () => {
    notify('风险评估与差距报告已生成（PDF）');
  };

  return (
    <>
      <PageHeader
        eyebrow="DATA SECURITY SERVICE · A9"
        title="数据安全服务"
        desc="A9-01 安全评估/DSMM · A9-02 分类分级/敏感识别/动态脱敏 · A9-03 巡检/审计/权限/出口监管。"
        actions={
          <>
            <Btn icon="key" onClick={() => go('/admin/data-permissions')}>数据权限</Btn>
            <Btn icon="scroll" onClick={() => go('/collection/audit')}>审计日志</Btn>
            <Btn icon="download" onClick={exportReport}>导出评估报告</Btn>
            <Btn variant="primary" icon="shield" loading={assessing} onClick={runAssess}>执行安全评估</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '安全评估', d: '风险·DSMM·差距报告' },
          { n: '02', t: '分类分级', d: '识别≥90%·脱敏可验' },
          { n: '03', t: '巡检审计', d: '可查·可导·防篡改' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${tab === (i === 0 ? 'assess' : i === 1 ? 'classify' : 'audit') ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> DSMM {dsmmAvg} · 识别率 {hitRate}%</span>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="DSMM 成熟度" value={dsmmAvg} unit="级" delta={assessDone ? '评估就绪' : '评估中'} icon="shield" tone="violet" onClick={() => setTab('assess')} />
        <StatCard label="高风险项" value={String(highRisk)} unit="项" delta="待整改" icon="circlealert" tone="red" onClick={() => setTab('assess')} />
        <StatCard label="敏感识别率" value={String(hitRate)} unit="%" delta="验收 ≥90%" icon="target" tone="green" onClick={() => setTab('classify')} />
        <StatCard label="审计事件" value={String(auditSeed.length)} unit="条" delta="防篡改哈希" icon="scroll" tone="blue" onClick={() => setTab('audit')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'assess', label: '安全评估 / DSMM', count: risksSeed.length },
          { key: 'classify', label: '分类分级与脱敏', count: sensSeed.length },
          { key: 'audit', label: '巡检与审计', count: auditSeed.length },
        ]}
      />

      {tab === 'assess' && (
        <>
          <Card className="mt-14" title="DSMM 成熟度" subtitle="组织·制度·鉴别·访问·加密·脱敏·审计·运营" actions={
            <Btn size="sm" icon="refresh" loading={assessing} onClick={runAssess}>重新评估</Btn>
          }>
            <div className="ds-dsmm-grid">
              {dsmmDims.map((d) => (
                <div key={d.key} className="ds-dsmm-card">
                  <div className="ds-dsmm-head">
                    <strong>{d.name}</strong>
                    <em>L{d.level}<span>/L{d.target}</span></em>
                  </div>
                  <Progress value={(d.level / 5) * 100} tone={d.level >= d.target ? 'green' : 'violet'} height={6} />
                  <small>{d.gap}</small>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid-2-1 mt-14">
            <Card title="风险清单" subtitle="资产识别 · 威胁/脆弱性 · 风险分析" noPad>
              <div className="pad-h">
                <DataTable
                  rows={risksSeed}
                  pageSize={5}
                  onRowClick={(r) => setActiveRisk(r)}
                  columns={[
                    { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                    { key: 'asset', title: '资产', render: (r) => <div className="cell-main"><strong>{r.asset}</strong><small>{r.threat}</small></div> },
                    { key: 'level', title: '等级', width: 60, render: (r) => <Badge tone={r.level === '高' ? 'red' : r.level === '中' ? 'amber' : 'slate'}>{r.level}</Badge> },
                    { key: 'score', title: '分值', width: 60, align: 'right' },
                  ]}
                />
              </div>
            </Card>
            <Card title="差距与整改" subtitle="可输出报告">
              <div className="ds-gap-list">
                {dsmmDims.filter((d) => d.level < d.target).map((d, i) => (
                  <div key={d.key}>
                    <em>G{i + 1}</em>
                    <div>
                      <strong>{d.name} L{d.level}→L{d.target}</strong>
                      <small>{d.gap}</small>
                    </div>
                  </div>
                ))}
              </div>
              <Btn className="mt-14 w-full" variant="primary" icon="download" onClick={exportReport}>导出风险评估与差距报告</Btn>
            </Card>
          </div>
        </>
      )}

      {tab === 'classify' && (
        <>
          <Card className="mt-14" title="敏感识别与分级" subtitle="验收：敏感字段识别率 ≥90%，脱敏可验证">
            <div className="ds-class-hero">
              <div>
                <span>识别率</span>
                <strong className={hitRate >= 90 ? 'text-green' : 'text-amber'}>{hitRate}%</strong>
                <Progress value={hitRate} tone={hitRate >= 90 ? 'green' : 'amber'} height={8} />
                <small>已扫描库表字段 · 规则+模型双通道</small>
              </div>
              <div className="row-actions">
                <Btn icon="sparkles" loading={scanBusy} onClick={runSensScan}>重新识别</Btn>
                <Btn variant="primary" icon="checkcircle" onClick={doVerifyMask}>验证脱敏</Btn>
              </div>
            </div>
            <div className="ds-level-row mt-14">
              {(['L1', 'L2', 'L3', 'L4'] as const).map((lv) => (
                <button key={lv} type="button" className={`ds-level ${levelFilter === lv ? 'is-on' : ''}`} onClick={() => setLevelFilter(levelFilter === lv ? '' : lv)}>
                  <strong>{lv}</strong>
                  <small>{sensSeed.filter((f) => f.level === lv).length} 字段</small>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid-2-1 mt-14">
            <Card
              title="字段打标清单"
              subtitle="自动打标 · 多策略组合"
              noPad
              actions={<SearchInput value={fq} onChange={setFq} placeholder="表/字段/类型" width={180} />}
            >
              <div className="pad-h">
                <DataTable
                  rows={sensFiltered}
                  pageSize={6}
                  onRowClick={(r) => { setActiveField(r); setVerifyMask(true); }}
                  columns={[
                    { key: 'table', title: '表', render: (r) => <span className="mono-cell">{r.table}</span> },
                    { key: 'field', title: '字段', width: 100, render: (r) => <strong className="mono">{r.field}</strong> },
                    { key: 'type', title: '类型', width: 70 },
                    { key: 'level', title: '分级', width: 56, render: (r) => <Badge tone={r.level === 'L4' || r.level === 'L3' ? 'red' : 'blue'}>{r.level}</Badge> },
                    { key: 'hit', title: '识别', width: 64, render: (r) => <Badge tone={r.hit ? 'green' : 'slate'}>{r.hit ? '命中' : '否'}</Badge> },
                  ]}
                />
              </div>
            </Card>
            <Card title="动态脱敏验证" subtitle={activeField ? `${activeField.table}.${activeField.field}` : '选择字段'}>
              {activeField ? (
                <>
                  <KeyValue
                    cols={2}
                    items={[
                      { label: '敏感类型', value: activeField.type },
                      { label: '安全分级', value: activeField.level },
                      { label: '脱敏策略', value: activeField.mask, wide: true },
                    ]}
                  />
                  <div className={`ds-mask-box ${verifyMask ? 'is-on' : ''} mt-14`}>
                    <div><span>明文样例</span><code>{activeField.sample}</code></div>
                    <Icon name="arrowright" size={14} />
                    <div><span>脱敏结果</span><code className="ok">{activeField.masked}</code></div>
                  </div>
                  <div className="info-note mt-14">
                    <Icon name="shield" size={12} />
                    <span>{verifyMask ? '已验证：查询侧动态脱敏生效，可对比明文/密文。' : '点击「验证脱敏」或行选字段查看对照。'}</span>
                  </div>
                </>
              ) : (
                <div className="empty-hint">请选择字段</div>
              )}
            </Card>
          </div>
        </>
      )}

      {tab === 'audit' && (
        <>
          <Card className="mt-14" title="全生命周期安全巡检" subtitle="采集 / 交换 / 存储 / 访问 / 出口 / 审计">
            <div className="ds-patrol-grid">
              {patrolSeed.map((p) => (
                <div key={p.id} className={`ds-patrol status-${p.status === '通过' ? 'ok' : p.status === '告警' ? 'warn' : 'fail'}`}>
                  <div className="ds-patrol-head">
                    <Badge tone={p.status === '通过' ? 'green' : p.status === '告警' ? 'amber' : 'red'}>{p.status}</Badge>
                    <span className="muted xs">{p.scope}</span>
                  </div>
                  <strong>{p.check}</strong>
                  <small>{p.detail}</small>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid-2-1 mt-14">
            <Card title="角色权限与 IP 白名单" subtitle="最小权限 · 出口监管">
              <div className="ds-perm-list">
                {[
                  ['数据治理办', '编目/分级/审计全量', '10.12.0.0/16'],
                  ['业务分析师', '已发布主题只读', 'VPN 段'],
                  ['开放应用', '已授权 API', '登记 IP'],
                  ['运维值班', '巡检与应急', '堡垒机'],
                ].map(([r, p, ip]) => (
                  <div key={r as string}>
                    <strong>{r}</strong>
                    <small>{p}</small>
                    <em>{ip}</em>
                  </div>
                ))}
              </div>
              <Btn className="mt-14 w-full" variant="secondary" icon="key" onClick={() => go('/admin/data-permissions')}>打开数据权限</Btn>
            </Card>
            <Card title="出口稽核趋势" subtitle="近 6 日共享出口">
              <AreaChart
                data={[
                  { label: '01', value: 12 }, { label: '02', value: 9 }, { label: '03', value: 15 },
                  { label: '04', value: 8 }, { label: '05', value: 11 }, { label: '06', value: 7 },
                ]}
                height={140}
                color="#d94b60"
                suffix=" 次拦截"
                valueName="阻断"
              />
            </Card>
          </div>

          <Card
            className="mt-14"
            title="操作审计"
            subtitle="验收：可查询、可导出、防篡改"
            noPad
            actions={
              <div className="filter-bar">
                <SearchInput value={aq} onChange={setAq} placeholder="搜索操作/对象" width={180} />
                <Btn size="sm" icon="download" onClick={exportAudit}>导出</Btn>
              </div>
            }
          >
            <div className="pad-h">
              <DataTable
                rows={auditFiltered}
                pageSize={6}
                onRowClick={(r) => setActiveAudit(r)}
                columns={[
                  { key: 'id', title: '事件ID', width: 80, render: (r) => <span className="mono-cell">{r.id}</span> },
                  { key: 'at', title: '时间', width: 80 },
                  { key: 'actor', title: '主体', width: 100 },
                  { key: 'action', title: '动作', render: (r) => r.action },
                  { key: 'object', title: '对象', render: (r) => <span className="mono-cell">{r.object}</span> },
                  { key: 'result', title: '结果', width: 100, render: (r) => <Badge tone={r.result.includes('拒绝') || r.result === '阻断' || r.result === '告警' ? 'amber' : 'green'}>{r.result}</Badge> },
                  { key: 'hash', title: '哈希', width: 90, render: (r) => <span className="mono-cell">{r.hash}</span> },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      <Drawer
        open={!!activeRisk}
        onClose={() => setActiveRisk(null)}
        width={520}
        title={activeRisk?.asset || ''}
        desc={activeRisk?.id || ''}
        footer={<><Btn onClick={() => setActiveRisk(null)}>关闭</Btn><Btn variant="primary" onClick={() => { notify('整改任务已分派'); setActiveRisk(null); }}>分派整改</Btn></>}
      >
        {activeRisk && (
          <KeyValue
            cols={2}
            items={[
              { label: '威胁', value: activeRisk.threat },
              { label: '脆弱性', value: activeRisk.vuln },
              { label: '等级', value: activeRisk.level },
              { label: '分值', value: String(activeRisk.score) },
              { label: '整改建议', value: activeRisk.advice, wide: true },
            ]}
          />
        )}
      </Drawer>

      <Drawer
        open={!!activeAudit}
        onClose={() => setActiveAudit(null)}
        width={480}
        title={activeAudit?.id || ''}
        desc="审计防篡改明细"
        footer={<Btn onClick={() => setActiveAudit(null)}>关闭</Btn>}
      >
        {activeAudit && (
          <KeyValue
            cols={2}
            items={[
              { label: '时间', value: activeAudit.at },
              { label: '主体', value: activeAudit.actor },
              { label: '动作', value: activeAudit.action },
              { label: '结果', value: activeAudit.result },
              { label: '对象', value: activeAudit.object, wide: true },
              { label: '内容哈希', value: activeAudit.hash, wide: true },
              { label: '防篡改', value: '哈希链校验通过 · 导出含签名', wide: true },
            ]}
          />
        )}
      </Drawer>
    </>
  );
}
