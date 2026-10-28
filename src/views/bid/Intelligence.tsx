import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AreaChart, BarList, Donut, Sparkline } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, KeyValue, PageHeader, SearchInput, Select, StatCard } from '../../components/ui';
import { useApp } from '../../app-context';
import { indicators } from '../../data';
import { tagCategories, tagObjects, residentTags, tagSamples, portalTrend } from '../../dataBid';

const marketCats = ['全部指标', '运营指标', '医疗质量', '国考指标', 'DRG 指标', '妇幼健康', '公共卫生'];

export function IndicatorMarket() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('全部指标');
  const [type, setType] = useState('');
  const [active, setActive] = useState<typeof indicators[0] | null>(null);
  const rows = useMemo(() => indicators.filter((i) => (!q || (i.name + i.code + i.tags.join('')).includes(q)) && (!type || i.type === type) && (cat === '全部指标' || i.category.includes(cat.replace('指标', '')) || i.tags.some((t) => cat.includes(t)))).slice(0, 12), [q, cat, type]);
  return (
    <>
      <PageHeader eyebrow="INDICATOR MARKETPLACE" title="指标市场" desc="已授权指标的统一发现、预览、订阅与服务入口，展示指标定义、口径、血缘、访问与授权全生命周期。" actions={<><Btn icon="download" onClick={() => notify('指标清单已导出')}>导出清单</Btn><Btn variant="primary" icon="plus" onClick={() => notify('指标申请已打开', 'info')}>申请指标</Btn></>} />
      <div className="market-hero">
        <div className="market-hero-left"><span className="portal-eyebrow">DATA AS A PRODUCT</span><h2>找到可信指标，直接用于分析</h2><p>2,572 项指标已完成口径审核、血缘登记与权限分级，支持一键订阅、API 调用与 BI 分析。</p><div className="market-search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索指标名称、编码、标签…" /><Btn size="sm" variant="primary">搜索</Btn></div><div className="market-hot">热门：<button onClick={() => setQ('门诊')}>门诊人次</button><button onClick={() => setQ('手术')}>手术台次</button><button onClick={() => setQ('DRG')}>DRG 组数</button><button onClick={() => setQ('床位')}>床位使用率</button></div></div>
        <div className="market-hero-right"><div><span>指标总数</span><strong>2,572</strong></div><div><span>今日访问</span><strong>1,286</strong></div><div><span>已授权</span><strong>2,186</strong></div><div><span>订阅部门</span><strong>18</strong></div><div className="market-badge"><Badge tone="green" dot>指标服务正常</Badge></div></div>
      </div>
      <div className="market-filters">
        <div className="market-cats">{marketCats.map((c) => <button key={c} className={cat === c ? 'is-active' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
        <div className="filter-bar"><Select value={type} onChange={setType} options={['', '原子指标', '派生指标', '复合指标']} placeholder="全部类型" width={100} /><span className="muted xs">共 {rows.length} 项</span></div>
      </div>
      <div className="market-grid">
        {rows.map((i) => (
          <button className="market-card" key={i.id} onClick={() => setActive(i)}>
            <div className="mc-top"><Badge tone={i.type === '原子指标' ? 'blue' : i.type === '派生指标' ? 'violet' : 'cyan'}>{i.type}</Badge><Badge tone={i.status === '已发布' ? 'green' : 'slate'} dot>{i.status}</Badge><span className="mc-access"><Icon name="eye" size={11} /> {128 + Number(i.id) * 3}</span></div>
            <strong className="mc-title">{i.name}</strong>
            <p className="mc-cat">{i.category}</p>
            <div className="mc-value"><strong>{i.value}</strong><span>{i.unit}</span><Sparkline values={[8, 12, 10, 15, 13, 18, 16, 20]} color="#6755F5" width={86} height={26} /></div>
            <div className="mc-tags">{i.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <div className="mc-foot"><span>负责人 {i.owner}</span><span>更新 {i.updated.slice(5, 10)}</span><em>查看详情 <Icon name="arrowright" size={11} /></em></div>
          </button>
        ))}
        <button className="market-add" onClick={() => notify('指标申请向导已打开', 'info')}><span><Icon name="plus" size={19} /></span><strong>申请新指标</strong><small>提交指标需求，由指标管理员评估</small></button>
      </div>
      <div className="grid grid-3 mt-14">
        <Card title="指标热度 TOP5" subtitle="近 30 天访问">
          <BarList items={indicators.slice(0, 5).map((i, idx) => ({ label: i.name, value: 1260 - idx * 160, display: `${1260 - idx * 160} 次` }))} color="#6755F5" />
        </Card>
        <Card title="指标类型分布" subtitle="原子 / 派生 / 复合">
          <Donut size={130} thickness={12} centerValue="2,572" label="指标" segments={[{ label: '原子指标', value: 1286, color: '#6755F5' }, { label: '派生指标', value: 986, color: '#9587FF' }, { label: '复合指标', value: 300, color: '#0891B2' }]} />
        </Card>
        <Card title="订阅动态" subtitle="最近订阅">
          <div className="exec-history">{[['门诊部', '门诊预约爽约人次', '08-06'], ['医务处', '手术台次', '08-06'], ['运营部', '床位使用率', '08-05'], ['医保办', 'DRG 组数（CMI）', '08-04']].map(([d, n, t]) => <div key={n}><span className="status-dot tone-blue" /><div><strong>{n}</strong><small>{d} · {t}</small></div></div>)}</div>
        </Card>
      </div>
      <Drawer open={!!active} onClose={() => setActive(null)} width={660} title={active?.name || ''} desc={active ? `${active.code} · ${active.category}` : ''} footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn icon="bell" onClick={() => notify('指标订阅已创建')}>订阅</Btn><Btn variant="primary" icon="key" onClick={() => notify('指标授权申请已提交')}>申请授权</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>最新值</span><strong>{active.value} <small>{active.unit}</small></strong></div><div><span>访问次数</span><strong>1,286</strong></div><div><span>订阅部门</span><strong>8</strong></div><div><span>状态</span><strong>{active.status}</strong></div></div>
          <div className="tag-row">{active.tags.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}<Badge tone="blue">{active.type}</Badge></div>
          <div className="indicator-lifecycle mt-14">
            {['定义', '配置', '固化', '发布', '授权', '服务'].map((s, i) => <div key={s} className={i <= 3 ? 'is-done' : ''}><span>{i < 4 ? <Icon name="check" size={11} /> : i + 1}</span><em>{s}</em></div>)}
          </div>
          <KeyValue className="mt-14" cols={2} items={[{ label: '指标编码', value: active.code }, { label: '指标类型', value: active.type }, { label: '数据来源', value: active.source }, { label: '更新频率', value: active.frequency }, { label: '统计口径', value: active.caliber, wide: true }, { label: '责任部门', value: active.dept }, { label: '业务负责人', value: active.owner }]} />
          <div className="section-title-sm mt-14">指标服务</div>
          <div className="api-code"><span>GET</span><code>/api/v1/indicators/{active.code}</code><button onClick={() => notify('API 文档已打开', 'info')}>文档</button></div>
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>该指标已通过口径审核与授权，调用需携带应用 Token。</span></div>
        </>}
      </Drawer>
    </>
  );
}

export function TagBoard() {
  const { notify } = useApp();
  const [obj, setObj] = useState('resident');
  const [active, setActive] = useState<typeof residentTags[0] | null>(null);
  const current = tagObjects.find((o) => o.key === obj) || tagObjects[0];
  return (
    <>
      <PageHeader eyebrow="TAG & PROFILE" title="标签看板" desc="面向居民、医生、机构三类对象的标签体系概览，支持标签分类、样本数、趋势与下钻分析。" actions={<><Btn icon="refresh" onClick={() => notify('看板数据已刷新')}>刷新</Btn><Btn variant="primary" icon="settings" onClick={() => notify('看板配置已打开', 'info')}>看板配置</Btn></>} />
      <div className="tag-object-tabs">
        {tagObjects.map((o) => <button key={o.key} className={obj === o.key ? 'is-active' : ''} onClick={() => setObj(o.key)}><span className="tot-icon"><Icon name={o.key === 'resident' ? 'users' : o.key === 'doctor' ? 'usercog' : 'building'} size={16} /></span><div><strong>{o.label}</strong><small>{o.count} 个标签</small></div><em>{o.samples}</em></button>)}
        <div className="tag-object-meta"><span>样本覆盖</span><strong>{current.coverage}%</strong><div className="mini-track"><i style={{ width: `${current.coverage}%` }} /></div><span className="muted xs">活跃 {current.active} 个</span></div>
      </div>
      <div className="stat-grid mt-14">
        <StatCard label="标签总数" value={current.count.toString()} unit="个" delta="本月 +12" icon="tags" tone="blue" />
        <StatCard label="样本总量" value={current.samples} unit="" delta="覆盖率 92.6%" icon="users" tone="violet" />
        <StatCard label="今日分群" value="28" unit="次" delta="覆盖 12.6 万人" icon="target" tone="cyan" />
        <StatCard label="标签更新" value="96.4" unit="%" delta="昨日同步完成" icon="refresh" tone="green" />
      </div>
      <div className="tagboard-grid mt-14">
        <Card title="标签类目分布" subtitle="按标签数量">
          <Donut size={145} thickness={12} centerValue={current.count.toString()} label="标签" segments={tagCategories} />
        </Card>
        <Card title="热门标签 TOP8" subtitle="按样本数">
          <BarList items={residentTags.slice(0, 6).map((t) => ({ label: t.name, value: Number(t.samples.replace('万', '')) * 10000, display: t.samples }))} color="#9587FF" />
        </Card>
        <Card title="标签样本趋势" subtitle="近 8 个月">
          <AreaChart data={portalTrend.map((d, i) => ({ ...d, value: 68 + i * 3.6 }))} height={190} color="#0891B2" suffix=" 万" valueName="样本" />
        </Card>
        <Card title="标签词云" subtitle="居民标签热度">
          <div className="tag-cloud-board">{residentTags.map((t, i) => <button key={t.name} style={{ fontSize: 13 + (i % 4) * 3, color: t.color, opacity: 0.65 + (i % 3) * 0.15 }} onClick={() => setActive(t)}>{t.name}</button>)}</div>
        </Card>
      </div>
      <Card className="mt-14" title={`${current.label}明细`} subtitle="支持标签下钻查看样本" noPad actions={<SearchInput value="" onChange={() => {}} placeholder="搜索标签" width={200} />}>
        <div className="pad-h"><DataTable rows={residentTags} pageSize={8} onRowClick={(r) => setActive(r)} columns={[
          { key: 'name', title: '标签名称', render: (t) => <div className="tag-name-cell"><span style={{ background: t.color }} /><strong>{t.name}</strong><Badge tone="slate">{t.category}</Badge></div> },
          { key: 'samples', title: '样本数', width: 100, align: 'right', render: (t) => <span className="mono-cell">{t.samples}</span> },
          { key: 'growth', title: '环比', width: 80, render: (t) => <span className="text-green">{t.growth}</span> },
          { key: 'owner', title: '维护部门', width: 100 },
          { key: 'ops', title: '操作', width: 130, render: (t) => <div className="row-actions"><button className="link-btn" onClick={(e) => { e.stopPropagation(); setActive(t); }}>样本</button><button className="link-muted" onClick={() => notify('标签编辑已打开', 'info')}>编辑</button><button className="link-muted" onClick={() => notify('标签分群已创建')}>分群</button></div> },
        ]} /></div>
      </Card>
      <Drawer open={!!active} onClose={() => setActive(null)} width={620} title={active?.name || ''} desc={active ? `${active.category}标签 · ${active.samples} 样本 · ${active.owner}` : ''} footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn icon="target" onClick={() => notify('已基于该标签创建分群')}>创建分群</Btn><Btn variant="primary" icon="download" onClick={() => notify('样本清单已导出')}>导出样本</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>样本数</span><strong>{active.samples}</strong></div><div><span>环比</span><strong className="text-green">{active.growth}</strong></div><div><span>覆盖机构</span><strong>42</strong></div><div><span>更新时间</span><strong className="sm">2026-08-06</strong></div></div>
          <div className="section-title-sm mt-14">标签规则</div>
          <div className="code-sample">{`-- 标签：${active.name}\nSELECT patient_id\nFROM dwd.fact_visit\nWHERE age >= 60 AND visit_count >= 2\nGROUP BY patient_id;`}</div>
          <div className="section-title-sm mt-14">样本列表</div>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>患者ID</th><th>姓名</th><th>性别</th><th>年龄</th><th>标签</th><th>机构</th></tr></thead><tbody>{tagSamples.map((r) => <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td></tr>)}</tbody></table></div>
        </>}
      </Drawer>
    </>
  );
}

/** @deprecated 使用 center/MpiHub · B4 居民主索引增强页 */
export { MpiHubPage as MainArchive } from '../center/MpiHub';
