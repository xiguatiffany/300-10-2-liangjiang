'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge, Btn, Card, DataTable, Drawer, Field, KeyValue, PageHeader, Progress, SearchInput, Select, StatCard, Tabs } from '../../components/ui';
import { useApp } from '../../app-context';
import { aiRules, knowledgeDocs } from '../../dataBid';

type TabKey = 'scenes' | 'cluster' | 'llm' | 'kb';

type Scene = {
  id: string;
  name: string;
  modality: '病历文本' | '检验报告' | '影像所见';
  sample: string;
  kbHit: string;
  llmFinding: string;
  crossCheck: string;
  result: '通过' | '疑似异常' | '需人工';
  confidence: number;
};

type Cluster = {
  id: string;
  pattern: string;
  dim: string;
  count: number;
  root: string;
  level: '高' | '中' | '低';
};

const scenes: Scene[] = [
  {
    id: 'SC-01',
    name: '出院诊断 vs 病历文本',
    modality: '病历文本',
    sample: '患者因「急性冠脉综合征」入院……出院诊断填写「心绞痛」。',
    kbHit: '指南：ACS 出院诊断应与病程记录主诊断一致',
    llmFinding: 'LLM 抽取主诊断=急性冠脉综合征；结构化字段=心绞痛',
    crossCheck: '文本诊断 ≠ 结构化诊断编码',
    result: '疑似异常',
    confidence: 92,
  },
  {
    id: 'SC-02',
    name: '检验危急值叙述核对',
    modality: '检验报告',
    sample: '血钾 6.8 mmol/L，已电话通知值班医生。报告结论写「大致正常」。',
    kbHit: '规则库：K+≥6.5 为危急值，结论不得写正常',
    llmFinding: '解析到危急值血钾 6.8，且存在通知记录',
    crossCheck: '结论与危急值逻辑冲突',
    result: '需人工',
    confidence: 96,
  },
  {
    id: 'SC-03',
    name: '影像所见与报告结论',
    modality: '影像所见',
    sample: '所见：右肺下叶可见结节影约 12mm。结论：两肺未见明显异常。',
    kbHit: '逻辑库：所见存在阳性结节时结论不得「未见异常」',
    llmFinding: '抽取阳性发现「结节 12mm」；结论极性=阴性',
    crossCheck: '所见阳性 / 结论阴性交叉失败',
    result: '疑似异常',
    confidence: 89,
  },
];

const clusters: Cluster[] = [
  { id: 'CL-01', pattern: '诊断编码与病程主诉不一致', dim: '一致性', count: 128, root: '结构化录入滞后 / 模板默认值', level: '高' },
  { id: 'CL-02', pattern: '危急值结论用语不当', dim: '合规性', count: 46, root: '报告模板未强制危急值话术', level: '高' },
  { id: 'CL-03', pattern: '影像所见阳性结论阴性', dim: '逻辑性', count: 74, root: '复制粘贴历史结论', level: '中' },
  { id: 'CL-04', pattern: '用药剂量单位混用', dim: '规范性', count: 32, root: 'OCR / 手写识别误差', level: '低' },
];

const toneOf = (s: string) => {
  if (s === '通过') return 'green';
  if (s === '疑似异常' || s === '中') return 'amber';
  if (s === '需人工' || s === '高') return 'red';
  return 'slate';
};

/** A5-03 智能质控与多模态 */
export function SmartQCPage() {
  const { go, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('scenes');
  const [active, setActive] = useState<Scene | null>(scenes[0]);
  const [clusterOpen, setClusterOpen] = useState<Cluster | null>(null);
  const [q, setQ] = useState('');
  const [running, setRunning] = useState(false);
  const [llmText, setLlmText] = useState(scenes[0].sample);
  const [llmOut, setLlmOut] = useState<{ finding: string; entities: string[]; conf: number } | null>(null);
  const [kbQ, setKbQ] = useState('');

  const kbRows = useMemo(() => knowledgeDocs.filter((d) =>
    (d.name + d.type + d.owner).toLowerCase().includes(kbQ.toLowerCase())
  ), [kbQ]);

  const ruleRows = useMemo(() => aiRules.filter((r) =>
    (r.text + r.source + r.id).toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const runScene = async (scene: Scene) => {
    setActive(scene);
    setTab('llm');
    setLlmText(scene.sample);
    setRunning(true);
    setLlmOut(null);
    await new Promise((r) => setTimeout(r, 900));
    setLlmOut({
      finding: scene.llmFinding,
      entities: scene.modality === '病历文本'
        ? ['急性冠脉综合征', '心绞痛', '出院诊断']
        : scene.modality === '检验报告'
          ? ['血钾', '6.8 mmol/L', '危急值']
          : ['右肺下叶结节', '12mm', '未见异常'],
      conf: scene.confidence,
    });
    setRunning(false);
    notify(`${scene.name}：知识库匹配 + LLM 解析 + 交叉校验完成`);
  };

  const runDemoAll = async () => {
    setTab('scenes');
    for (const s of scenes) {
      await runScene(s);
      await new Promise((r) => setTimeout(r, 400));
    }
    setTab('cluster');
    notify('三类文本质控场景均已演示，可查看异常聚类');
  };

  return (
    <>
      <PageHeader
        eyebrow="SMART QC · MULTIMODAL"
        title="智能质控与多模态"
        desc="规则知识库匹配 · 异常树/聚类 · 逻辑知识库 + LLM 解析临床文本并交叉校验。验收：至少 3 类文本质控场景可演示。"
        actions={
          <>
            <Btn icon="book" onClick={() => go('/bid/knowledge')}>★ 质控知识库</Btn>
            <Btn icon="shieldalert" onClick={() => go('/collection/graded-qc')}>分级质控</Btn>
            <Btn variant="primary" icon="play" loading={running} onClick={runDemoAll}>演示 3 类场景</Btn>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="文本场景" value="3" unit="类" delta="病历 / 检验 / 影像" icon="file" tone="blue" onClick={() => setTab('scenes')} />
        <StatCard label="异常聚类" value={String(clusters.length)} unit="簇" delta="自动根因建议" icon="git" tone="violet" onClick={() => setTab('cluster')} />
        <StatCard label="知识条目" value={String(knowledgeDocs.length)} unit="份" delta="可匹配规则" icon="book" tone="green" onClick={() => setTab('kb')} />
        <StatCard label="AI 候选规则" value={String(aiRules.length)} unit="条" delta="待人工复核" icon="sparkles" tone="amber" onClick={() => setTab('kb')} />
      </div>

      <Card className="mt-14" title="多模态质控流水线" subtitle="结构化字段 × 非结构化文本">
        <div className="smart-pipe">
          {[
            { icon: 'database', t: '多源输入', d: '病历 / 检验 / 影像文本' },
            { icon: 'book', t: '知识库匹配', d: '指南 · 逻辑规则' },
            { icon: 'sparkles', t: 'LLM 解析', d: '实体 · 极性 · 危急值' },
            { icon: 'git', t: '交叉校验', d: '文本 vs 结构化' },
            { icon: 'shield', t: '异常聚类', d: '根因 · 工单' },
          ].map((s, i) => (
            <React.Fragment key={s.t}>
              <div className="smart-pipe-node">
                <span><Icon name={s.icon} size={15} /></span>
                <strong>{s.t}</strong>
                <small>{s.d}</small>
              </div>
              {i < 4 && <Icon name="arrowright" size={13} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Tabs
        className="mt-14"
        variant="pill"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'scenes', label: '三类文本场景', count: 3 },
          { key: 'llm', label: 'LLM 解析台' },
          { key: 'cluster', label: '异常聚类', count: clusters.length },
          { key: 'kb', label: '知识库 / 规则' },
        ]}
      />

      {tab === 'scenes' && (
        <div className="grid grid-3 mt-14">
          {scenes.map((s) => (
            <Card
              key={s.id}
              title={s.name}
              subtitle={s.modality}
              actions={<Badge tone={toneOf(s.result)} dot>{s.result}</Badge>}
            >
              <p className="smart-sample">{s.sample}</p>
              <KeyValue cols={1} items={[
                { label: '知识库命中', value: s.kbHit },
                { label: '交叉校验', value: s.crossCheck },
                { label: '置信度', value: `${s.confidence}%` },
              ]} />
              <div className="row-actions mt-14">
                <Btn size="sm" variant="primary" icon="play" loading={running && active?.id === s.id} onClick={() => runScene(s)}>演示本场景</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'llm' && (
        <div className="grid grid-2 mt-14">
          <Card title="临床文本输入" subtitle={active ? `${active.modality} · ${active.name}` : '选择场景'}
            actions={<Select value={active?.id || ''} onChange={(id) => {
              const s = scenes.find((x) => x.id === id);
              if (s) { setActive(s); setLlmText(s.sample); setLlmOut(null); }
            }} options={scenes.map((s) => ({ value: s.id, label: s.name }))} width={180} />}
          >
            <Field label="样例文本">
              <textarea className="textarea" rows={8} value={llmText} onChange={(e) => setLlmText(e.target.value)} />
            </Field>
            <div className="row-actions mt-14">
              <Btn variant="primary" icon="sparkles" loading={running} onClick={() => active && runScene(active)}>LLM 解析 + 交叉校验</Btn>
              <Btn onClick={() => go('/bid/knowledge')}>打开知识库</Btn>
            </div>
          </Card>
          <Card title="解析与交叉结果" subtitle="知识库 × LLM × 结构化字段">
            {llmOut ? (
              <>
                <div className="drawer-summary">
                  <div><span>置信度</span><strong>{llmOut.conf}%</strong></div>
                  <div><span>实体数</span><strong>{llmOut.entities.length}</strong></div>
                  <div><span>场景</span><strong>{active?.modality}</strong></div>
                  <div><span>结论</span><strong>{active?.result}</strong></div>
                </div>
                <div className="section-title-sm mt-14">抽取实体</div>
                <div className="schema-map" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {llmOut.entities.map((e) => <Badge key={e} tone="blue">{e}</Badge>)}
                </div>
                <div className="section-title-sm mt-14">LLM 发现</div>
                <p className="prose">{llmOut.finding}</p>
                <div className="section-title-sm mt-14">知识库命中</div>
                <p className="prose">{active?.kbHit}</p>
                <div className="info-note mt-14">
                  <Icon name="git" size={13} />
                  <span>交叉校验：{active?.crossCheck}</span>
                </div>
              </>
            ) : (
              <div className="empty-lite">
                <Icon name="sparkles" size={22} />
                <p>选择左侧场景并执行解析，将展示实体、知识库命中与交叉结果。</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'cluster' && (
        <Card className="mt-14" title="异常树 / 聚类" subtitle="相似异常自动归簇并给根因建议" noPad
          actions={<Btn size="sm" onClick={() => notify('已按最新异常重聚类')}>重新聚类</Btn>}
        >
          <div className="pad-h">
            <DataTable
              rows={clusters}
              pageSize={8}
              onRowClick={(r) => setClusterOpen(r as Cluster)}
              columns={[
                { key: 'pattern', title: '异常模式', render: (r) => <div className="cell-main"><strong>{r.pattern}</strong><small>{r.id} · {r.dim}</small></div> },
                { key: 'count', title: '数量', width: 70, align: 'right', render: (r) => r.count },
                { key: 'level', title: '等级', width: 70, render: (r) => <Badge tone={toneOf(r.level)}>{r.level}</Badge> },
                { key: 'root', title: '建议根因', render: (r) => r.root },
                {
                  key: 'ops', title: '操作', width: 100,
                  render: (r) => (
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="link-btn" onClick={() => setClusterOpen(r)}>详情</button>
                      <button className="link-muted" onClick={() => notify(`已为 ${r.id} 创建整改工单`)}>工单</button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'kb' && (
        <div className="grid grid-2 mt-14">
          <Card title="规则知识库" subtitle="指南 / 规范文档" noPad
            actions={<SearchInput value={kbQ} onChange={setKbQ} placeholder="文档" width={160} />}
          >
            <div className="pad-h">
              <DataTable
                rows={kbRows}
                pageSize={6}
                columns={[
                  { key: 'name', title: '文档', render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.type} · {r.rules} 条规则</small></div> },
                  { key: 'owner', title: '维护人', width: 80, render: (r) => r.owner },
                  { key: 'updated', title: '更新', width: 100, render: (r) => r.updated },
                  {
                    key: 'ops', title: '操作', width: 70,
                    render: () => <button className="link-btn" onClick={() => go('/bid/knowledge')}>打开</button>,
                  },
                ]}
              />
            </div>
          </Card>
          <Card title="AI 抽取候选规则" subtitle="待人工复核" noPad
            actions={<SearchInput value={q} onChange={setQ} placeholder="规则" width={160} />}
          >
            <div className="pad-h">
              <DataTable
                rows={ruleRows}
                pageSize={6}
                columns={[
                  { key: 'text', title: '规则', render: (r) => <div className="cell-main"><strong>{r.id}</strong><small>{r.text.slice(0, 42)}…</small></div> },
                  { key: 'source', title: '来源', width: 120, render: (r) => <span className="muted">{r.source.split('·')[0]}</span> },
                  {
                    key: 'confidence', title: '置信度', width: 100,
                    render: (r) => (
                      <div className="quality-cell">
                        <Progress value={r.confidence} tone={r.confidence >= 90 ? 'green' : 'amber'} />
                        <span>{r.confidence}%</span>
                      </div>
                    ),
                  },
                  {
                    key: 'ops', title: '操作', width: 100,
                    render: (r) => (
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="link-btn" onClick={() => notify(`已通过规则：${r.id}`)}>通过</button>
                        <button className="link-muted" onClick={() => notify(`已驳回：${r.id}`)}>驳回</button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      <Drawer
        open={!!clusterOpen}
        onClose={() => setClusterOpen(null)}
        title={clusterOpen?.pattern || ''}
        desc={clusterOpen ? `${clusterOpen.id} · ${clusterOpen.dim}` : ''}
        width={520}
        footer={
          <>
            <Btn onClick={() => setClusterOpen(null)}>关闭</Btn>
            <Btn variant="primary" onClick={() => { notify('整改工单已创建'); setClusterOpen(null); }}>创建工单</Btn>
          </>
        }
      >
        {clusterOpen && (
          <KeyValue cols={1} items={[
            { label: '影响数量', value: String(clusterOpen.count) },
            { label: '等级', value: <Badge tone={toneOf(clusterOpen.level)}>{clusterOpen.level}</Badge> },
            { label: '建议根因', value: clusterOpen.root },
            { label: '关联场景', value: '文本交叉校验失败簇' },
            { label: '下一步', value: '推送科室质控员 · 回写模板规则' },
          ]} />
        )}
      </Drawer>
    </>
  );
}
