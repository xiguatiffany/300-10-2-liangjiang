'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';

type TabKey = 'overview' | 'precheck' | 'dwd' | 'errors';

type DimKey = '有效性' | '规范性' | '合规性' | '一致性' | '完整性';

type DimScore = { key: DimKey; score: number; rules: number; fail: number; tone: string; desc: string };

type PreRule = {
  id: string;
  name: string;
  stage: '语法' | '依赖' | '采样' | '五维预检';
  target: string;
  status: '通过' | '阻断' | '警告' | '未执行';
  detail: string;
};

type QcError = {
  id: string;
  dim: DimKey;
  table: string;
  field: string;
  rule: string;
  level: '高' | '中' | '低';
  rows: number;
  sample: string;
  time: string;
};

const dims: DimScore[] = [
  { key: '有效性', score: 98.2, rules: 12, fail: 86, tone: 'blue', desc: '值域合法、类型正确、非空有效' },
  { key: '规范性', score: 96.8, rules: 10, fail: 142, tone: 'violet', desc: '编码标准、格式规范、命名一致' },
  { key: '合规性', score: 99.1, rules: 8, fail: 28, tone: 'green', desc: '隐私脱敏、密级与授权合规' },
  { key: '一致性', score: 95.4, rules: 14, fail: 186, tone: 'amber', desc: '跨表关联、口径与主数据一致' },
  { key: '完整性', score: 97.6, rules: 11, fail: 128, tone: 'cyan', desc: '主键/必填/关联完整' },
];

const preRulesSeed: PreRule[] = [
  { id: 'PC-01', name: 'SQL 语法与表存在性', stage: '语法', target: 'dwd_fact_visit.sql', status: '通过', detail: '解析通过，引用表均存在' },
  { id: 'PC-02', name: '上游 ODS 依赖就绪', stage: '依赖', target: 'ods_his.outpatient', status: '通过', detail: '最近分区 08-06 已产出' },
  { id: 'PC-03', name: '抽样 5% 五维预检', stage: '采样', target: 'dwd_fact_visit', status: '警告', detail: '一致性抽样异常率 0.42%' },
  { id: 'PC-04', name: '主键非空预检', stage: '五维预检', target: 'visit_id', status: '通过', detail: '抽样 0 空值' },
  { id: 'PC-05', name: '身份证脱敏合规', stage: '五维预检', target: 'id_no', status: '阻断', detail: '发现 12 行明文落库风险' },
  { id: 'PC-06', name: '科室编码国标映射', stage: '五维预检', target: 'dept_code', status: '警告', detail: '3 个编码未入值域' },
];

const errorsSeed: QcError[] = [
  { id: 'QE-2140', dim: '完整性', table: 'dwd_fact_visit', field: 'patient_id', rule: '主键非空', level: '高', rows: 86, sample: 'visit_id=V20260806…', time: '14:21:02' },
  { id: 'QE-2139', dim: '一致性', table: 'dwd_fact_visit', field: 'dept_id', rule: '关联 dim_department', level: '高', rows: 64, sample: 'dept_id=99XX', time: '14:21:08' },
  { id: 'QE-2138', dim: '规范性', table: 'dwd_fact_lab', field: 'loinc_code', rule: 'LOINC 值域', level: '中', rows: 142, sample: 'code=LOCAL_88', time: '14:21:10' },
  { id: 'QE-2137', dim: '有效性', table: 'dwd_fact_lab', field: 'result_value', rule: '数值范围', level: '中', rows: 48, sample: 'value=-1', time: '14:21:12' },
  { id: 'QE-2136', dim: '合规性', table: 'dwd_fact_visit', field: 'id_no', rule: '脱敏落库', level: '高', rows: 12, sample: '明文身份证', time: '14:20:58' },
  { id: 'QE-2135', dim: '一致性', table: 'dwd_fact_visit', field: 'main_diag', rule: 'ICD 对码', level: '低', rows: 74, sample: 'diag=临时编码', time: '14:21:15' },
];

const toneOf = (s: string) => {
  if (['通过', '正常', '运行中'].includes(s)) return 'green';
  if (['警告', '未执行'].includes(s)) return 'amber';
  if (['阻断', '失败'].includes(s)) return 'red';
  return 'slate';
};

/** A5-02 分级质控：开发预校验 + DWD 五维实时质控 */
type AcceptPhase = 'rules' | 'realtime' | 'errors';

export function GradedQCPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('overview');
  const [preRules, setPreRules] = useState(preRulesSeed);
  const [errors, setErrors] = useState(errorsSeed);
  const [dimFilter, setDimFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [running, setRunning] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [activeErr, setActiveErr] = useState<QcError | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [activeDim, setActiveDim] = useState<DimKey | null>(null);
  const [phase, setPhase] = useState<AcceptPhase>('rules');
  const [rulesOk, setRulesOk] = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [errorsOk, setErrorsOk] = useState(false);

  const filteredErrors = useMemo(() => errors.filter((e) =>
    (dimFilter === 'all' || e.dim === dimFilter)
    && (e.table + e.field + e.rule).toLowerCase().includes(q.toLowerCase())
  ), [errors, dimFilter, q]);

  const overall = useMemo(() => {
    const avg = dims.reduce((s, d) => s + d.score, 0) / dims.length;
    return avg.toFixed(1);
  }, []);

  const runPrecheck = async () => {
    setRunning(true);
    setTab('precheck');
    setPhase('rules');
    setPreRules((arr) => arr.map((r) => ({ ...r, status: '未执行' })));
    for (let i = 0; i < preRulesSeed.length; i++) {
      await new Promise((r) => setTimeout(r, 280));
      setPreRules((arr) => arr.map((r, idx) => (idx === i ? { ...r, status: preRulesSeed[i].status } : r)));
    }
    setRunning(false);
    setRulesOk(true);
    const blocked = preRulesSeed.some((r) => r.status === '阻断');
    notify(blocked ? '预校验完成：存在阻断项，禁止发布到 DWD' : '预校验完成：可进入 DWD 实时质控', blocked ? 'error' : 'success');
  };

  const runDwd = async () => {
    setRunning(true);
    setTab('dwd');
    setPhase('realtime');
    notify('DWD 五维实时质控执行中…', 'info');
    await new Promise((r) => setTimeout(r, 900));
    const stamp = new Date();
    const t = `${String(stamp.getHours()).padStart(2, '0')}:${String(stamp.getMinutes()).padStart(2, '0')}:${String(stamp.getSeconds()).padStart(2, '0')}`;
    const row: QcError = {
      id: `QE-${2100 + Math.floor(Math.random() * 80)}`,
      dim: '一致性',
      table: 'dwd_fact_visit',
      field: 'dept_id',
      rule: '实时关联校验',
      level: '中',
      rows: 18,
      sample: '增量批次 B-1286',
      time: t,
    };
    setErrors((e) => [row, ...e].slice(0, 20));
    setRunning(false);
    setRealtimeOk(true);
    setPhase('errors');
    setErrorsOk(true);
    setTab('errors');
    setActiveErr(row);
    notify('DWD 实时质控完成：新增异常已写入错误明细');
  };

  const demoAccept = async () => {
    if (running || demoing) return;
    setDemoing(true);
    await runPrecheck();
    notify('① 五维规则预校验完成');
    await new Promise((r) => setTimeout(r, 350));
    await runDwd();
    notify('②③ 实时结果 + 错误明细下钻完成');
    setDemoing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="GRADED QUALITY CONTROL · A5-02"
        title="分级质控"
        desc="验收：五维规则 → 实时结果 → 错误明细；开发预校验 + DWD 层五维实时质控。"
        actions={
          <>
            <Btn icon="zap" loading={demoing || running} onClick={demoAccept}>演示验收</Btn>
            <Btn icon="play" loading={running} onClick={runPrecheck}>运行预校验</Btn>
            <Btn variant="primary" icon="activity" loading={running} onClick={runDwd}>DWD 实时质控</Btn>
          </>
        }
      />

      <div className="qc-accept">
        {[
          { n: '01', t: '五维规则', d: '预校验 · 规则集', k: 'rules' as const, on: rulesOk },
          { n: '02', t: '实时结果', d: 'DWD 流式执行', k: 'realtime' as const, on: realtimeOk },
          { n: '03', t: '错误明细', d: '字段 · 样例下钻', k: 'errors' as const, on: errorsOk },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`qc-accept-step ${phase === s.k || s.on ? 'is-on' : ''}`}>
              <em>{s.n}</em>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
            {i < 2 && <Icon name="arrowright" size={13} />}
          </React.Fragment>
        ))}
        <span className="live-badge"><i /> {errorsOk ? '明细已下钻' : realtimeOk ? '实时完成' : rulesOk ? '规则已跑' : '待验收'}</span>
      </div>

      <Card className="mt-14" title="两级质控路径" subtitle="先预校验，再入 DWD 实时检">
        <div className="gqc-path">
          <button type="button" className={`gqc-stage${tab === 'precheck' ? ' is-on' : ''}`} onClick={() => setTab('precheck')}>
            <span className="gqc-ico tone-blue"><Icon name="terminal" size={16} /></span>
            <div>
              <strong>① 开发预校验</strong>
              <small>语法 · 依赖 · 采样 · 五维预检</small>
            </div>
            <Badge tone={preRules.some((r) => r.status === '阻断') ? 'red' : 'green'} dot>
              {preRules.some((r) => r.status === '阻断') ? '有阻断' : '可放行'}
            </Badge>
          </button>
          <span className="gqc-arrow"><Icon name="arrowright" size={16} /></span>
          <button type="button" className={`gqc-stage${tab === 'dwd' || tab === 'errors' ? ' is-on' : ''}`} onClick={() => setTab('dwd')}>
            <span className="gqc-ico tone-green"><Icon name="shield" size={16} /></span>
            <div>
              <strong>② DWD 实时质控</strong>
              <small>五维规则流式执行 · 异常分流</small>
            </div>
            <Badge tone="amber" dot>今日异常 {errors.length}</Badge>
          </button>
          <span className="gqc-arrow"><Icon name="arrowright" size={16} /></span>
          <button type="button" className={`gqc-stage${tab === 'errors' ? ' is-on' : ''}`} onClick={() => setTab('errors')}>
            <span className="gqc-ico tone-amber"><Icon name="list" size={16} /></span>
            <div>
              <strong>③ 错误明细</strong>
              <small>可下钻字段与样例行</small>
            </div>
          </button>
        </div>
      </Card>

      <div className="stat-grid mt-14">
        <StatCard label="综合得分" value={overall} unit="分" delta="五维均值" icon="gauge" tone="green" onClick={() => setTab('overview')} />
        <StatCard label="预校验项" value={String(preRules.length)} unit="条" delta={`阻断 ${preRules.filter((r) => r.status === '阻断').length}`} icon="terminal" tone="blue" onClick={() => setTab('precheck')} />
        <StatCard label="DWD 规则" value={String(dims.reduce((s, d) => s + d.rules, 0))} unit="条" delta="五维启用" icon="list" tone="violet" onClick={() => setTab('dwd')} />
        <StatCard label="错误明细" value={String(errors.reduce((s, e) => s + e.rows, 0))} unit="行" delta={`${errors.length} 类异常`} icon="circlealert" tone="red" onClick={() => setTab('errors')} />
      </div>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'overview', label: '总览' },
          { key: 'precheck', label: '开发预校验', count: preRules.length },
          { key: 'dwd', label: 'DWD 五维质控' },
          { key: 'errors', label: '错误明细', count: errors.length },
        ]}
      />

      {tab === 'overview' && (
        <>
          <div className="gqc-dims mt-14">
            {dims.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`gqc-dim tone-${d.tone}${activeDim === d.key ? ' is-on' : ''}`}
                onClick={() => { setActiveDim(d.key); setDimFilter(d.key); setTab('errors'); }}
              >
                <div className="gqc-dim-top">
                  <strong>{d.key}</strong>
                  <em>{d.score}%</em>
                </div>
                <Progress value={d.score} tone={d.score >= 98 ? 'green' : d.score >= 96 ? 'blue' : 'amber'} height={6} />
                <small>{d.desc}</small>
                <div className="gqc-dim-foot"><span>{d.rules} 规则</span><span className="text-red">{d.fail} 异常行</span></div>
              </button>
            ))}
          </div>
          <div className="grid grid-2 mt-14">
            <Card title="今日执行摘要" subtitle="预校验 → DWD">
              <ul className="feed-list">
                <li><span className="feed-ico blue"><Icon name="terminal" size={13} /></span><div><strong>预校验批次 PC-0826</strong><small>6 项 · 1 阻断 · 2 警告</small></div></li>
                <li><span className="feed-ico green"><Icon name="zap" size={13} /></span><div><strong>DWD 流式检 RT-1286</strong><small>处理 128.6 万行 · 耗时 66s</small></div></li>
                <li><span className="feed-ico amber"><Icon name="git" size={13} /></span><div><strong>异常分流 qc_exception</strong><small>高优 3 类 · 待治理</small></div></li>
              </ul>
            </Card>
            <Card title="快捷动作" subtitle="演示验收路径">
              <div className="schema-map" style={{ flexWrap: 'wrap', gap: 8 }}>
                <Btn size="sm" icon="play" onClick={runPrecheck}>跑预校验</Btn>
                <Btn size="sm" icon="zap" onClick={runDwd}>跑 DWD 五维</Btn>
                <Btn size="sm" onClick={() => setTab('errors')}>看错误明细</Btn>
                <Btn size="sm" onClick={() => go('/bid/rules')}>五维规则配置</Btn>
                <Btn size="sm" onClick={() => go('/collection/qc-designer')}>打开流程编排</Btn>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'precheck' && (
        <Card className="mt-14" title="开发预校验" subtitle="发布前阻断高风险问题" noPad
          actions={<Btn size="sm" icon="play" loading={running} onClick={runPrecheck}>重新执行</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={preRules}
              pageSize={8}
              columns={[
                { key: 'id', title: '编号', width: 70, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'name', title: '检查项', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.target}</small></div> },
                { key: 'stage', title: '阶段', width: 90, render: (r) => <Badge tone="slate">{r.stage}</Badge> },
                { key: 'detail', title: '结果说明', render: (r) => r.detail },
                { key: 'status', title: '状态', width: 80, render: (r) => <Badge tone={toneOf(r.status)} dot>{r.status}</Badge> },
              ]}
            />
          </div>
          <div className="info-note" style={{ margin: '0 14px 14px' }}>
            <Icon name="circlealert" size={13} />
            <span>存在「阻断」时作业不得上线；警告项可带条件放行并进入 DWD 加强检。</span>
          </div>
        </Card>
      )}

      {tab === 'dwd' && (
        <div className="grid grid-2-1 mt-14">
          <Card title="DWD 五维实时质控" subtitle="有效性 · 规范性 · 合规性 · 一致性 · 完整性" noPad
            actions={<Btn size="sm" variant="primary" icon="plus" onClick={() => setRuleOpen(true)}>配置规则</Btn>}
          >
            <div className="pad-h">
              <DataTable
                rows={dims}
                pageSize={5}
                paginate={false}
                onRowClick={(r) => { setDimFilter(r.key); setTab('errors'); }}
                columns={[
                  { key: 'key', title: '维度', width: 90, render: (r) => <strong>{r.key}</strong> },
                  { key: 'desc', title: '说明', render: (r) => <span className="muted">{r.desc}</span> },
                  { key: 'rules', title: '规则数', width: 70, align: 'right', render: (r) => r.rules },
                  {
                    key: 'score', title: '通过率', width: 140,
                    render: (r) => (
                      <div className="quality-cell">
                        <Progress value={r.score} tone={r.score >= 98 ? 'green' : r.score >= 96 ? 'blue' : 'amber'} />
                        <span>{r.score}%</span>
                      </div>
                    ),
                  },
                  { key: 'fail', title: '异常行', width: 80, align: 'right', render: (r) => <span className="text-red">{r.fail}</span> },
                ]}
              />
            </div>
          </Card>
          <Card title="实时运行" subtitle="当前窗口">
            <KeyValue cols={1} items={[
              { label: '检核表', value: 'dwd_fact_visit / dwd_fact_lab' },
              { label: '模式', value: '流式 + 微批 5 分钟' },
              { label: '处理量', value: '128.6 万行' },
              { label: '拦截率', value: '0.17%' },
              { label: '失败动作', value: '分流 qc_exception · 高优告警' },
            ]} />
            <div className="row-actions mt-14">
              <Btn size="sm" icon="zap" loading={running} onClick={runDwd}>立即执行</Btn>
              <Btn size="sm" onClick={() => go('/bid/qc-results')}>结果统计</Btn>
            </div>
          </Card>
        </div>
      )}

      {tab === 'errors' && (
        <Card className="mt-14" title="错误明细" subtitle="五维异常可下钻" noPad
          actions={
            <div className="filter-bar">
              <Select
                value={dimFilter}
                onChange={setDimFilter}
                options={[{ value: 'all', label: '全部维度' }, ...dims.map((d) => d.key)]}
                width={120}
              />
              <SearchInput value={q} onChange={setQ} placeholder="表 / 字段 / 规则" width={200} />
              <Btn size="sm" icon="download" onClick={() => notify('错误明细已导出')}>导出</Btn>
            </div>
          }
        >
          <div className="pad-h">
            <DataTable
              rows={filteredErrors}
              pageSize={8}
              onRowClick={(r) => setActiveErr(r as QcError)}
              columns={[
                { key: 'id', title: '异常 ID', width: 90, render: (r) => <span className="mono-cell">{r.id}</span> },
                { key: 'dim', title: '维度', width: 80, render: (r) => <Badge tone="slate">{r.dim}</Badge> },
                { key: 'table', title: '表.字段', render: (r) => <div className="cell-main"><strong className="mono-cell">{r.table}.{r.field}</strong><small>{r.rule}</small></div> },
                { key: 'level', title: '等级', width: 60, render: (r) => <Badge tone={r.level === '高' ? 'red' : r.level === '中' ? 'amber' : 'slate'}>{r.level}</Badge> },
                { key: 'rows', title: '行数', width: 70, align: 'right', render: (r) => <span className="text-red">{r.rows}</span> },
                { key: 'time', title: '时间', width: 70, render: (r) => r.time },
                {
                  key: 'ops', title: '操作', width: 80,
                  render: (r) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); setActiveErr(r); }}>详情</button>,
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Drawer
        open={!!activeErr}
        onClose={() => setActiveErr(null)}
        title={activeErr ? `${activeErr.dim} · ${activeErr.rule}` : ''}
        desc={activeErr ? `${activeErr.table}.${activeErr.field}` : ''}
        width={560}
        footer={
          <>
            <Btn onClick={() => setActiveErr(null)}>关闭</Btn>
            <Btn onClick={() => go('/collection/lineage')}>查看血缘</Btn>
            <Btn variant="primary" onClick={() => { notify('已创建治理工单'); setActiveErr(null); }}>创建工单</Btn>
          </>
        }
      >
        {activeErr && (
          <>
            <div className="drawer-summary">
              <div><span>等级</span><strong>{activeErr.level}</strong></div>
              <div><span>影响行</span><strong>{activeErr.rows}</strong></div>
              <div><span>维度</span><strong>{activeErr.dim}</strong></div>
              <div><span>时间</span><strong>{activeErr.time}</strong></div>
            </div>
            <KeyValue className="mt-14" cols={1} items={[
              { label: '样例', value: <span className="mono-cell">{activeErr.sample}</span> },
              { label: '规则', value: activeErr.rule },
              { label: '建议', value: activeErr.dim === '合规性' ? '阻断入库并脱敏回填' : '分流异常表并通知表负责人' },
            ]} />
            <div className="log-console mt-14">
              <div><span className="lt">{activeErr.time}</span><span className="li warn">WARN</span><span>规则命中 {activeErr.rule}</span></div>
              <div><span className="lt">{activeErr.time}</span><span className="li">INFO</span><span>样例行已写入 qc_exception</span></div>
            </div>
          </>
        )}
      </Drawer>

      <Modal open={ruleOpen} onClose={() => setRuleOpen(false)} title="配置五维规则" desc="为 DWD 表绑定实时规则" width={560}
        footer={<><Btn onClick={() => setRuleOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setRuleOpen(false); notify('规则已保存并生效'); }}>保存</Btn></>}
      >
        <div className="form-grid">
          <Field label="目标表" required className="span-2"><Select value="dwd_fact_visit" onChange={() => {}} options={['dwd_fact_visit', 'dwd_fact_lab', 'dwd_fact_surgery']} /></Field>
          <Field label="质控维度" required><Select value="完整性" onChange={() => {}} options={dims.map((d) => d.key)} /></Field>
          <Field label="执行模式"><Select value="实时流式" onChange={() => {}} options={['实时流式', '微批 5 分钟', '日批']} /></Field>
          <Field label="规则表达式" className="span-2"><textarea className="textarea" rows={3} placeholder="例如：patient_id IS NOT NULL AND dept_id IN dim_department" /></Field>
          <Field label="失败动作"><Select value="分流异常表" onChange={() => {}} options={['分流异常表', '阻断任务', '仅告警']} /></Field>
          <Field label="阈值"><input className="input" defaultValue="0.5%" /></Field>
        </div>
      </Modal>
    </>
  );
}
