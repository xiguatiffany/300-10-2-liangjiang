import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { useApp } from '../app-context';

type DemoStep = { route: string; name: string; id: string; type: '★' | '▲'; minutes: string; notes: string[] };
const STEPS: DemoStep[] = [
  { route: 'home', name: '首页大屏', id: 'C2-01', type: '▲', minutes: '2 分钟', notes: ['先讲 42 家机构、8.62 亿条数据、2,572 项指标', '强调“一屏统览 + 角色视角 + 我的应用”', '最后落到“数据治理最终要服务决策”'] },
  { route: 'collection-wizard', name: '采集方案配置', id: 'A2-01', type: '★', minutes: '4 分钟', notes: ['从机构授权讲到选源、选表、策略、映射、试跑', '点“测试连接”后再进入下一步', '强调达梦/金仓/openGauss 适配与只读账号'] },
  { route: 'realtime-channel', name: '数据通道', id: 'A4-07', type: '★', minutes: '3 分钟', notes: ['★实时入湖：模拟源端增删改→湖表可查', '离线入湖 / Doris 导出 / 数据源', 'CDC 启停、延迟、变更事件'] },
  { route: 'data-preview', name: '数据预览', id: 'A3-05', type: '★', minutes: '3 分钟', notes: ['左侧目录树、右侧表结构/样例数据', '指出身份证、手机号自动脱敏', '切到“字段血缘”讲可追溯'] },
  { route: 'data-query', name: '数据查询', id: 'A4-04', type: '★', minutes: '3 分钟', notes: ['打开 SQL 工作台，点“运行”', '讲库表树、结果导出、查询历史', '强调只读连接、数据权限与审计'] },
  { route: 'monitor', name: '监控总览', id: 'A4-06', type: '★', minutes: '3 分钟', notes: ['同步/对账/指标三张看板', '下钻到任务与延迟节点', '落点：出了问题能定位、能闭环'] },
  { route: 'rules', name: '五维规则配置', id: 'B5-02', type: '▲', minutes: '2 分钟', notes: ['完整性、一致性、规范性、及时性、稳定性', '点维度切换规则，讲权重与评分标准', '指出及时性规则命中上升，体现运营'] },
  { route: 'score-model', name: '质量评分模型', id: 'B5-04', type: '▲', minutes: '2 分钟', notes: ['选机构、接口表范围，调五维权重', '展示综合得分与考核报告', '强调可按日/周/月/季/年出报告'] },
  { route: 'qc-designer', name: '质控可视化流程', id: 'A5-04', type: '★', minutes: '4 分钟', notes: ['节点库添加、画布拖拽编排', '点“运行流程”，拓扑逐步执行与节点指标', '异常分流明细下钻、可回查'] },
  { route: 'qc-results', name: '质控结果统计', id: 'A5-06', type: '★', minutes: '3 分钟', notes: ['机构/时间/维度筛选联动看板', '点击机构排名下钻异常', '导出明细 CSV / 报告 PDF'] },
  { route: 'standard-docs', name: '标准文档管理', id: 'B1-02', type: '▲', minutes: '2 分钟', notes: ['12 类标准、版本、归口部门', '打开预览抽屉，讲在线查看与版本受控', '强调标准是治理的依据'] },
  { route: 'qc-governance', name: '问题管理/治理大屏', id: 'A5-07', type: '★', minutes: '4 分钟', notes: ['问题汇聚→分派→闭环与通知', '知识库新增/抽取规则并「用于质控」', '治理大屏 13 类组件点选演示'] },
  { route: 'indicator-market', name: '指标市场', id: 'B8-02', type: '▲', minutes: '2 分钟', notes: ['按分类筛选、搜索指标', '打开详情，讲口径、血缘、授权、API', '落点：指标像商品一样被订阅'] },
  { route: 'tag-board', name: '标签看板', id: 'B7-01', type: '▲', minutes: '3 分钟', notes: ['居民/医生/机构三类标签', '看分布、TOP 标签、样本趋势', '点标签下钻样本，讲分群运营'] },
  { route: 'main-archive', name: '居民主档案', id: 'B4-02', type: '▲', minutes: '3 分钟', notes: ['按 PID/身份证/姓名查询', '讲跨机构、跨条线、相似档案合并', '强调调阅全程留痕'] },
  { route: 'asset-management', name: '数据资产管理', id: 'B10-02', type: '★', minutes: '3 分钟', notes: ['资源类目、编目、L1—L4 分级', '打开资产详情，切安全/开放/API', '强调敏感字段脱敏与开放条件'] },
  { route: 'asset-publish', name: '资产发布/停用', id: 'B10-03', type: '★', minutes: '3 分钟', notes: ['勾选待发布资产，讲审核与批量发布', '切到已发布，演示批量停用', '强调发布/停用审计与订阅通知'] },
];

const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

export function DemoController() {
  const { path, go } = useApp();
  const [open, setOpen] = useState(path === '/bid/demo');
  const [projection, setProjection] = useState(false);
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [shot, setShot] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') setOpen(true);
    if (params.get('shot') === '1') setShot(true);
    if (localStorage.getItem('lj_projection') === '1' || params.get('projection') === '1') setProjection(true);
  }, []);

  const idx = useMemo(() => STEPS.findIndex((s) => path === `/bid/${s.route}`), [path]);
  const step = idx >= 0 ? STEPS[idx] : null;

  useEffect(() => {
    document.body.classList.toggle('presentation-mode', projection);
    localStorage.setItem('lj_projection', projection ? '1' : '0');
  }, [projection]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => { if (path === '/bid/demo') setOpen(true); }, [path]);

  const next = () => { if (idx >= 0 && idx < STEPS.length - 1) go(`/bid/${STEPS[idx + 1].route}`); else go('/bid/home'); };
  const prev = () => { if (idx > 0) go(`/bid/${STEPS[idx - 1].route}`); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key.toLowerCase() === 'p') setProjection((v) => !v);
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const reset = () => {
    if (!window.confirm('重置演示？将回到首页，并清除当前页面的临时操作。')) return;
    setSeconds(0); setRunning(true); setOpen(false);
    go('/bid/home');
  };
  const fullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (shot || !path.startsWith('/bid/') || !step) return null;

  if (!open) {
    return (
      <button className="demo-pill" onClick={() => setOpen(true)} title="打开演示控制台（→ 下一项 / ← 上一项 / P 投影）">
        <span className="demo-pill-ico"><Icon name="play" size={12} /></span>
        <span>演示控制</span>
        <em>{idx + 1}/17</em>
        <i>{fmt(seconds)}</i>
        <Icon name="chevron" size={12} />
      </button>
    );
  }

  return (
    <aside className="demo-panel" aria-label="应标演示控制台">
      <div className="demo-panel-head">
        <div className="demo-panel-brand"><span><Icon name="play" size={12} /></span><div><strong>应标演示控制台</strong><small>BID DEMO CONSOLE · 17 项</small></div></div>
        <div className="demo-panel-tools">
          <button onClick={() => setProjection((v) => !v)} className={projection ? 'is-on' : ''} title="投影模式（P）"><Icon name="maximize" size={13} /> 投影</button>
          <button onClick={fullscreen} title="全屏"><Icon name="scan" size={13} /></button>
          <button onClick={() => setOpen(false)} title="收起（Esc）"><Icon name="x" size={13} /></button>
        </div>
      </div>
      <div className="demo-panel-progress">
        <div className="dpp-top"><span>第 {idx + 1} / 17 项</span><em>{fmt(seconds)}</em></div>
        <div className="dpp-track"><i style={{ width: `${((idx + 1) / 17) * 100}%` }} /></div>
      </div>
      <div className="demo-panel-current">
        <div className="dpc-tags"><span className={`demo-type ${step.type === '★' ? 'star' : 'tri'}`}>{step.type}</span><span className="dpc-id">{step.id}</span><span className="dpc-time">{step.minutes}</span></div>
        <h3>{step.name}</h3>
        <ul>{step.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
      <div className="demo-panel-actions">
        <button onClick={prev} disabled={idx === 0}><Icon name="arrowleft" size={13} /> 上一项</button>
        <button className="primary" onClick={next}>{idx === STEPS.length - 1 ? '回到首页' : '下一项'} <Icon name="arrowright" size={13} /></button>
        <button onClick={() => setRunning((v) => !v)} title={running ? '暂停计时' : '继续计时'}><Icon name={running ? 'pause' : 'play'} size={12} /></button>
        <button onClick={reset} title="重置演示"><Icon name="refresh" size={12} /></button>
      </div>
      <div className="demo-panel-foot"><span><kbd>→</kbd> 下一项</span><span><kbd>←</kbd> 上一项</span><span><kbd>P</kbd> 投影</span><span><kbd>Esc</kbd> 收起</span></div>
    </aside>
  );
}
