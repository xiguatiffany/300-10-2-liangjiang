import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { BarList, Donut } from '../../components/charts';
import { Badge, Btn, Card, DataTable, Drawer, Empty, Field, KeyValue, Modal, PageHeader, Progress, SearchInput, Select, StatCard, Tabs, Toggle } from '../../components/ui';
import { useApp } from '../../app-context';
import { collectConfigs, configTables, reconcileRules, storageTop, volumeBySchema } from '../../data';

export function OrchestratePage() {
  const { notify } = useApp();
  return (
    <>
      <PageHeader eyebrow="DATA ORCHESTRATION" title="数据编排" desc="编排源端采集、清洗加工与入仓流程，统一管理元数据规模、存储分布与数据质量。" actions={<><Btn icon="refresh" onClick={() => notify('编排元数据已刷新')}>刷新统计</Btn><Btn variant="primary" icon="plus" onClick={() => notify('新建编排流程向导已打开', 'info')}>新建编排</Btn></>} />
      <div className="pipeline-card">
        <div className="pipeline-head"><div><h3>采集编排链路</h3><p>全院数据从源端到指标服务的端到端流程</p></div><Badge tone="green" dot>链路正常</Badge></div>
        <div className="pipeline">
          {[
            { icon: 'database', title: '源端系统', sub: '42 个业务系统', tone: 'blue', info: '128 个服务' },
            { icon: 'cable', title: '采集通道', sub: '静态 / CDC / API', tone: 'violet', info: '64 条通道' },
            { icon: 'workflow', title: '清洗加工', sub: '标准化 · 去重 · 脱敏', tone: 'cyan', info: '86 个作业' },
            { icon: 'layers', title: '数据入仓', sub: 'ODS → DWD → DM', tone: 'green', info: '12,846 张表' },
            { icon: 'boxes', title: '主题模型', sub: '9 个专科主题', tone: 'amber', info: '286 个模型' },
            { icon: 'gauge', title: '指标服务', sub: '2,572 项指标', tone: 'blue', info: 'API 8 个' },
          ].map((n, i) => (
            <React.Fragment key={n.title}>
              <div className={`pipe-node tone-${n.tone}`}><span className="pipe-ico"><Icon name={n.icon} size={17} /></span><strong>{n.title}</strong><small>{n.sub}</small><em>{n.info}</em></div>
              {i < 5 && <div className="pipe-arrow"><span /><Icon name="chevronright" size={13} /></div>}
            </React.Fragment>
          ))}
        </div>
        <div className="pipeline-foot"><span><i className="ok" />今日运行 1,286 次</span><span><i className="warn" />延迟 3 条</span><span><i className="bad" />失败 1 条</span><button className="link-btn" onClick={() => notify('编排监控已打开', 'info')}>查看编排监控 <Icon name="arrowright" size={11} /></button></div>
      </div>

      <div className="stat-grid mt-14">
        <StatCard label="采集表总数" value="290" unit="张" delta="空表 121 张" icon="table" tone="blue" />
        <StatCard label="大字段表" value="58" unit="张" delta="占比 20.0%" icon="rows" tone="amber" />
        <StatCard label="数据存储总量" value="28.6" unit="TB" delta="+1.2 TB 本月" icon="harddrive" tone="violet" />
        <StatCard label="日均增量" value="42.8" unit="GB" delta="峰值 86 GB" icon="activity" tone="green" />
      </div>

      <div className="grid grid-3 mt-14">
        <Card title="空表数统计" subtitle="ods 全量表扫描结果">
          <Donut size={146} thickness={13} centerValue="290" label="采集表" segments={[{ label: '空表', value: 121, color: '#6755F5' }, { label: '非空表', value: 169, color: '#E7EEFA' }]} />
        </Card>
        <Card title="大字段表统计" subtitle="含 CLOB / BLOB / TEXT 字段">
          <Donut size={146} thickness={13} centerValue="290" label="采集表" segments={[{ label: '大字段', value: 58, color: '#F59E0B' }, { label: '无大字段', value: 232, color: '#E7EEFA' }]} />
        </Card>
        <Card title="存储分布" subtitle="按数据库 Schema">
          <BarList items={volumeBySchema.slice(0, 5)} color="#9587FF" showValue />
        </Card>
      </div>

      <div className="grid grid-2-1 mt-14">
        <Card title="数据存储总量 TOP10" subtitle="按表存储容量排序">
          <div className="table-wrap">
            <table className="data-table"><thead><tr><th>排名</th><th>数据表</th><th>存储容量</th><th style={{ width: '42%' }}>占比</th></tr></thead><tbody>
              {storageTop.map((s, i) => (
                <tr key={s.label}><td><span className={`rank-badge ${i < 3 ? 'top' : ''}`}>{i + 1}</span></td><td className="mono-cell">{s.label}</td><td>{s.display}</td><td><div className="quality-cell"><Progress value={(s.value / 8.2) * 100} tone={i < 3 ? 'blue' : 'violet'} /><span>{(s.value / 28.6 * 100).toFixed(1)}%</span></div></td></tr>
              ))}
            </tbody></table>
          </div>
        </Card>
        <Card title="编排任务" subtitle="最近执行的编排流程" noPad>
          <div className="orchestration-list">
            {[
              { n: 'HIS 全量初始化编排', t: '14:20', s: '运行中', p: 68 },
              { n: 'EMR 增量同步编排', t: '14:10', s: '成功', p: 100 },
              { n: 'LIS 报告主题构建', t: '13:20', s: '成功', p: 100 },
              { n: 'HRP 成本核算编排', t: '13:40', s: '失败', p: 100 },
              { n: '指标日批计算', t: '12:00', s: '成功', p: 100 },
            ].map((j) => (
              <div className="orch-item" key={j.n}><div className="orch-line"><span className={`status-dot tone-${j.s === '成功' ? 'green' : j.s === '运行中' ? 'blue' : 'red'}`} /><div><strong>{j.n}</strong><small>{j.t} · {j.s}</small></div><em>{j.p}%</em></div><Progress value={j.p} tone={j.s === '成功' ? 'green' : j.s === '失败' ? 'red' : 'blue'} height={4} /></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function ConfigsPage() {
  const { go, notify } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const rows = collectConfigs.filter((c) => (!status || c.status === status) && (c.name + c.channel).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader eyebrow="COLLECTION CONFIG" title="采集配置" desc="配置采集任务同步的表清单、执行频率与运行参数，支持全量、增量与周期调度。" actions={<><Btn icon="download" onClick={() => notify('采集配置已导出')}>导出配置</Btn><Btn variant="primary" icon="plus" onClick={() => go('/collection/config/new')}>新建配置</Btn></>} />
      <div className="stat-grid">
        <StatCard label="配置总数" value={collectConfigs.length.toString()} unit="个" delta="+2 本月" icon="sliders" tone="blue" />
        <StatCard label="启用中" value={collectConfigs.filter((c) => c.status !== '已停用').length.toString()} unit="个" delta="占比 90%" icon="play" tone="green" />
        <StatCard label="周期任务" value="7" unit="个" delta="最短 10 分钟" icon="clock" tone="cyan" />
        <StatCard label="异常配置" value="1" unit="个" delta="ods_hrp_cost_sync" icon="circlealert" tone="red" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar">
          <div className="filter-bar"><SearchInput value={q} onChange={setQ} placeholder="搜索配置名称或同步通道" width={260} /><Select value={status} onChange={setStatus} options={['', '已启用', '运行中', '异常', '已停用']} placeholder="全部状态" width={110} /></div>
          <div className="row-actions"><Btn size="sm" icon="play" onClick={() => notify('已批量触发选中配置（演示）')}>批量运行</Btn><Btn size="sm" icon="refresh" onClick={() => notify('配置状态已刷新')}>刷新</Btn></div>
        </div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={10} onRowClick={(c) => go(`/collection/config/${c.id}`)} columns={[
            { key: 'name', title: '配置名称', width: 210, render: (c) => <div className="cell-main"><strong>{c.name}</strong><small>{c.flow} · {c.id}</small></div> },
            { key: 'channel', title: '同步通道', width: 160, render: (c) => <div className="cell-main"><strong className="fw-normal">{c.channel}</strong><small>{c.channelInfo}</small></div> },
            { key: 'mode', title: '操作类别', width: 84, render: (c) => <Badge tone="slate">{c.mode}</Badge> },
            { key: 'tables', title: '表数量', width: 70, align: 'right', render: (c) => <span className="mono-cell">{c.tables}</span> },
            { key: 'frequency', title: '执行频率', width: 130, render: (c) => <div className="cell-main"><strong className="fw-normal">{c.frequency.split(' ')[0]}</strong><small>{c.cron !== '—' ? c.cron : '手动触发'}</small></div> },
            { key: 'status', title: '状态', width: 80, render: (c) => <Badge dot>{c.status}</Badge> },
            { key: 'updated', title: '修改时间', width: 118, render: (c) => <span className="muted">{c.updated.slice(5, 16)}</span> },
            { key: 'ops', title: '操作', width: 138, render: (c) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => go(`/collection/config/${c.id}`)}>编辑</button><button className="link-muted" onClick={() => notify(`配置 ${c.name} 已开始运行`)}>运行</button><button className="link-muted" onClick={() => notify('执行日志已打开', 'info')}>日志</button></div> },
          ]} />
        </div>
      </Card>
      <div className="grid grid-3 mt-14">
        <Card title="执行频率分布" subtitle="按调度方式">
          <div className="freq-bars">
            {[['周期执行', 7, '#6755F5'], ['单次执行', 3, '#9587FF']].map(([l, v, c]) => <div key={l as string}><div className="resource-head"><span>{l}</span><strong>{v} 个</strong></div><div className="freq-track"><i style={{ width: `${(v as number / 10) * 100}%`, background: c as string }} /></div></div>)}
          </div>
          <div className="info-note mt-14"><Icon name="clock" size={13} /><span>周期任务默认在业务低峰期执行，可在执行参数中调整 Cron 表达式。</span></div>
        </Card>
        <Card title="表接入情况" subtitle="所有配置的表数量">
          <BarList items={collectConfigs.slice(0, 5).map((c) => ({ label: c.name.replace('ods_', ''), value: c.tables, display: `${c.tables} 张` }))} color="#0891B2" />
        </Card>
        <Card title="最近配置变更" subtitle="近 7 日">
          <div className="change-list">
            {[['张敏', '更新 ods_emr_cpoe_sync 频率为 30min', '14:10'], ['dp_admin', '新建 ods_insurance_settle_sync', '07-31'], ['dp_admin', '停用 ods_peis_report_init', '08-01'], ['王思远', '调整 ods_cdr_patient_sync 并发数', '08-04']].map(([u, d, t]) => (
              <div key={d}><span className="avatar sm">{u.slice(0, 2)}</span><div><strong>{d}</strong><small>{u} · {t}</small></div></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function ConfigEditPage({ param }: { param?: string }) {
  const { go, notify } = useApp();
  const cfg = collectConfigs.find((c) => c.id === param) || collectConfigs[0];
  const isNew = param === 'new';
  const [tab, setTab] = useState('basic');
  const [name, setName] = useState(isNew ? '' : cfg.name);
  const [flow, setFlow] = useState(cfg.flow);
  const [mode, setMode] = useState(cfg.mode);
  const [frequency, setFrequency] = useState(cfg.frequency.includes('周期') ? '周期执行' : '单次执行');
  const [cron, setCron] = useState(cfg.cron === '—' ? '0 0 2 * * ?' : cfg.cron);
  const [autoRecon, setAutoRecon] = useState(true);
  const [ignoreCheck, setIgnoreCheck] = useState(false);
  const [tables, setTables] = useState(configTables.map((t) => ({ ...t })));
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [leftPick, setLeftPick] = useState<string[]>([]);
  const [rightPick, setRightPick] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const selected = tables.filter((t) => t.selected);
  const unselected = tables.filter((t) => !t.selected);
  const moveRight = () => { setTables((arr) => arr.map((t) => leftPick.includes(t.name) ? { ...t, selected: false } : t)); setLeftPick([]); };
  const moveLeft = () => { setTables((arr) => arr.map((t) => rightPick.includes(t.name) ? { ...t, selected: true } : t)); setRightPick([]); };
  const save = (run = false) => {
    setSaving(true);
    window.setTimeout(() => { setSaving(false); notify(run ? '配置已保存并开始执行' : '采集配置已保存'); }, 700);
  };

  return (
    <>
      <PageHeader back={() => go('/collection/configs')} eyebrow="EDIT COLLECTION CONFIG" title={isNew ? '新建采集配置' : `编辑配置 · ${cfg.name}`} desc={isNew ? '配置数据同步流程、表清单与执行参数。' : `配置编号 ${cfg.id} · 最近修改 ${cfg.updated}`}
        actions={<><Btn onClick={() => go('/collection/configs')}>取消</Btn><Btn icon="refresh" onClick={() => notify('已重置为上次保存的配置')}>重置</Btn><Btn variant="primary" icon="save" loading={saving} onClick={() => save(false)}>保存</Btn><Btn variant="primary" icon="play" onClick={() => save(true)}>保存并运行</Btn></>} />
      <div className="edit-meta-strip">
        <span><i className="status-dot tone-green" /> 通道 {cfg.channel} 连接正常</span>
        <span><Icon name="clock" size={12} /> 上次运行 {cfg.updated}</span>
        <span><Icon name="table" size={12} /> 已接入 {selected.length} / {tables.length} 张表</span>
        <span><Icon name="shield" size={12} /> 参数校验通过</span>
        <span className="edit-mode">操作类别：{mode} · {frequency}</span>
      </div>
      <div className="edit-layout">
        <div className="edit-left">
          <Card title="基本信息" subtitle="采集流程与同步通道" actions={<Badge tone="green">必填项已完整</Badge>}>
            <div className="form-grid">
              <Field label="配置名称" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：ods_cis_his_init" /></Field>
              <Field label="流程名称" required><Select value={flow} onChange={setFlow} options={['全量数据导入', '增量数据同步', '实时数据同步', '定时对账']} /></Field>
              <Field label="同步通道" required><Select value={cfg.channel} onChange={() => {}} options={collectConfigs.map((c) => c.channel)} /></Field>
              <Field label="通道信息"><div className="input input-readonly mono">{cfg.channelInfo}</div></Field>
              <Field label="操作类别" required className="span-2">
                <div className="radio-group">
                  {['增加/重启', '删除', '重入'].map((m) => <label key={m} className={mode === m ? 'is-active' : ''}><input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} /><span>{m}</span></label>)}
                </div>
              </Field>
            </div>
            <div className="divider-h" />
            <div className="table-transfer">
              <div className="transfer-head"><div><strong>选择表</strong><span>已接入 {selected.length} 张 · 待重入 {unselected.length} 张</span></div><div className="row-actions"><Btn size="sm" icon="uploadcloud" onClick={() => notify('批量导入表清单已打开', 'info')}>批量导入</Btn><button className="link-muted" onClick={() => setTables((arr) => arr.map((t) => ({ ...t, selected: true })))}>全选</button></div></div>
              <div className="transfer">
                <div className="transfer-pane">
                  <div className="transfer-pane-head"><span>已接入 <em>{selected.length}</em></span><button onClick={() => setTables((arr) => arr.map((t) => ({ ...t, selected: false })))}>清空</button></div>
                  <div className="transfer-search"><Icon name="search" size={12} /><input value={leftQuery} onChange={(e) => setLeftQuery(e.target.value)} placeholder="请输入搜索内容" /></div>
                  <div className="transfer-list">
                    {selected.filter((t) => t.name.toLowerCase().includes(leftQuery.toLowerCase())).map((t) => (
                      <label key={t.name} className={`transfer-row ${leftPick.includes(t.name) ? 'is-picked' : ''}`}>
                        <input type="checkbox" className="checkbox" checked={leftPick.includes(t.name)} onChange={(e) => setLeftPick((arr) => e.target.checked ? [...arr, t.name] : arr.filter((x) => x !== t.name))} />
                        <span className="mono">{t.name}</span>
                        <em>{t.rows}</em>
                      </label>
                    ))}
                    {selected.length === 0 && <div className="transfer-empty">暂无已接入表</div>}
                  </div>
                </div>
                <div className="transfer-actions">
                  <button onClick={moveRight} disabled={!leftPick.length} title="移出"><Icon name="chevronright" size={16} /></button>
                  <button onClick={moveLeft} disabled={!rightPick.length} title="移入"><Icon name="chevronleft" size={16} /></button>
                </div>
                <div className="transfer-pane">
                  <div className="transfer-pane-head"><span>待重入 <em>{unselected.length}</em></span><button onClick={() => setTables((arr) => arr.map((t) => ({ ...t, selected: true })))}>全部接入</button></div>
                  <div className="transfer-search"><Icon name="search" size={12} /><input value={rightQuery} onChange={(e) => setRightQuery(e.target.value)} placeholder="请输入搜索内容" /></div>
                  <div className="transfer-list">
                    {unselected.filter((t) => t.name.toLowerCase().includes(rightQuery.toLowerCase())).map((t) => (
                      <label key={t.name} className={`transfer-row ${rightPick.includes(t.name) ? 'is-picked' : ''}`}>
                        <input type="checkbox" className="checkbox" checked={rightPick.includes(t.name)} onChange={(e) => setRightPick((arr) => e.target.checked ? [...arr, t.name] : arr.filter((x) => x !== t.name))} />
                        <span className="mono">{t.name}</span>
                        <em>{t.rows}</em>
                      </label>
                    ))}
                    {unselected.length === 0 && <div className="transfer-empty">全部表已接入</div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="divider-h" />
            <div className="form-grid">
              <Field label="执行频率" required>
                <div className="radio-group">
                  {['单次执行', '周期执行'].map((f) => <label key={f} className={frequency === f ? 'is-active' : ''}><input type="radio" name="freq" checked={frequency === f} onChange={() => setFrequency(f)} /><span>{f}</span></label>)}
                </div>
              </Field>
              <Field label="Cron 表达式" hint="周期执行时生效，支持 Quartz 表达式"><input className="input mono" value={cron} onChange={(e) => setCron(e.target.value)} disabled={frequency !== '周期执行'} /></Field>
              <Field label="自动对账"><div className="flex center gap-10"><Toggle checked={autoRecon} onChange={setAutoRecon} /><span className="muted xs">同步完成后自动创建对账任务</span></div></Field>
              <Field label="子任务"><Select value="2" onChange={() => {}} options={[{ value: '1', label: '不拆分子任务' }, { value: '2', label: '按表拆分为 2 个子任务' }, { value: '4', label: '按表拆分为 4 个子任务' }]} /></Field>
              <label className="check-line span-2"><input type="checkbox" className="checkbox" checked={ignoreCheck} onChange={(e) => setIgnoreCheck(e.target.checked)} /> 忽略参数检查（跳过执行前的表结构、权限与连通性校验）</label>
            </div>
          </Card>

          <Card className="mt-14" title="执行参数" subtitle="控制同步任务的读取、写入与建表行为" actions={<button className="link-btn" onClick={() => notify('执行参数说明文档已打开', 'info')}><Icon name="help" size={12} /> 说明</button>}>
            <div className="form-grid cols-3">
              <Field label="目标表命名" hint="默认采用 ${DATABASE}.${SCHEMA}.${TABLE}"><input className="input mono" defaultValue="createTable.sinkTableName" /></Field>
              <Field label="读写比例" hint="默认 4:4，平衡读写线程"><input className="input mono" defaultValue="4" /></Field>
              <Field label="分页大小" hint="默认 100000"><input className="input mono" defaultValue="100000" /></Field>
              <Field label="并发数" hint="默认 4，最大 24"><input className="input mono" defaultValue="4" /></Field>
              <Field label="自动建表" hint="目标表不存在时自动创建"><Toggle checked={true} label="开启" /></Field>
              <Field label="自动 drop 表" hint="同步前删除同名目标表"><Toggle checked={false} label="关闭" /></Field>
              <Field label="重跑全量数据同步" hint="RETRY_KETTLE：失败自动重试"><input className="input mono" defaultValue="true" /></Field>
              <Field label="自定义处理类" hint="KAFKA_SINK_CLASS"><input className="input mono" placeholder="未配置" /></Field>
              <Field label="增量消息处理时间" hint="KAFKA_SINK_TIMESTAMP"><input className="input mono" placeholder="默认当前时间" /></Field>
              <Field label="其它运行参数" className="span-3"><input className="input mono" defaultValue='{"sink.replace.into":"false"}' /></Field>
            </div>
          </Card>
        </div>

        <aside className="edit-right">
          <Card title="配置校验" subtitle="保存前自动检查">
            <div className="check-list vertical">
              {[['通道连通性', '通过', '通道心跳正常'], ['源端表结构', '通过', '8 张表结构一致'], ['目标库权限', '通过', '具备建表与写入权限'], ['字段映射', '预警', '3 个字段类型需确认'], ['调度冲突', '通过', '无时间窗冲突']].map(([l, s, d]) => (
                <div key={l}><span className={s === '通过' ? 'ok' : 'warn'}>{s === '通过' ? <Icon name="check" size={12} /> : <Icon name="alert" size={12} />}</span><div><strong>{l}</strong><small>{d}</small></div><em>{s}</em></div>
              ))}
            </div>
            <Btn size="sm" variant="secondary" className="mt-10 w-full" onClick={() => notify('校验完成：4 项通过，1 项预警')}>重新校验</Btn>
          </Card>
          <Card className="mt-14" title="运行摘要">
            <div className="run-summary">
              <div><span>同步表</span><strong>{selected.length} 张</strong></div>
              <div><span>预计数据量</span><strong>1.24 GB</strong></div>
              <div><span>上次耗时</span><strong>{cfg.status === '异常' ? '18m 44s' : '2m 18s'}</strong></div>
              <div><span>执行频率</span><strong>{frequency === '周期执行' ? '周期' : '单次'}</strong></div>
            </div>
            <div className="info-note mt-14"><Icon name="clock" size={13} /><span>建议在业务低峰期执行全量同步，避免对源库造成压力。</span></div>
          </Card>
          <Card className="mt-14" title="最近执行">
            <div className="exec-history">
              {[['2026-08-06 14:20', '成功', '2m 18s'], ['2026-08-06 13:50', '成功', '2m 06s'], ['2026-08-06 13:20', '成功', '2m 24s'], ['2026-08-06 12:50', '失败', '—']].map(([t, s, d]) => (
                <div key={t}><span className={`status-dot tone-${s === '成功' ? 'green' : 'red'}`} /><div><strong>{t}</strong><small>{s} · {d}</small></div></div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
      <div className="edit-footer">
        <span className="muted xs"><Icon name="info" size={12} /> 配置保存后将立即生效，运行中的任务需重启后应用新参数。</span>
        <div className="row-actions"><Btn onClick={() => go('/collection/configs')}>取消</Btn><Btn icon="refresh" onClick={() => notify('已重置')}>重置</Btn><Btn variant="primary" loading={saving} onClick={() => save(false)}>保存</Btn><Btn variant="primary" icon="play" onClick={() => save(true)}>保存并运行</Btn></div>
      </div>
    </>
  );
}

export function ReconcilePage() {
  const { notify } = useApp();
  const [rows, setRows] = useState(reconcileRules);
  const [active, setActive] = useState<typeof reconcileRules[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const run = (r: typeof reconcileRules[0]) => {
    setRunning(true);
    window.setTimeout(() => {
      setRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status: '一致', diff: 0 } : x));
      setRunning(false);
      setActive((a) => a ? { ...a, status: '一致', diff: 0 } : a);
      notify('对账执行完成：源端与目标端数据一致');
    }, 1200);
  };
  return (
    <>
      <PageHeader eyebrow="DATA RECONCILIATION" title="对账配置" desc="配置源端与目标端的数据量与内容对账规则，自动发现同步差异并支持一键修复。" actions={<><Btn icon="play" onClick={() => notify('已触发全部对账任务')}>全部执行</Btn><Btn variant="primary" icon="plus" onClick={() => setOpen(true)}>新建对账</Btn></>} />
      <div className="stat-grid">
        <StatCard label="对账规则" value={rows.length.toString()} unit="条" delta="启用 6 条" icon="list" tone="blue" />
        <StatCard label="对账数据表" value="3,696" unit="张" delta="覆盖 8 个数据源" icon="table" tone="violet" />
        <StatCard label="一致率" value="95.0" unit="%" delta="差异 186 张" icon="checkcircle" tone="green" />
        <StatCard label="待修复差异" value="21" unit="条" delta="3 条规则存在差异" icon="circlealert" tone="amber" />
      </div>
      <Card className="mt-14" noPad>
        <div className="meta-toolbar"><div className="filter-bar"><SearchInput value="" onChange={() => {}} placeholder="搜索对账名称" width={240} /><Select value="" onChange={() => {}} options={['全部对账类型', '数据量对账', '内容对账']} placeholder="全部对账类型" width={128} /><Select value="" onChange={() => {}} options={['全部状态', '一致', '差异']} placeholder="全部状态" width={100} /></div><span className="table-note"><Icon name="clock" size={12} /> 每日 02:00 自动对账</span></div>
        <div className="pad-h">
          <DataTable rows={rows} pageSize={8} onRowClick={(r) => setActive(r)} columns={[
            { key: 'name', title: '对账名称', width: 200, render: (r) => <div className="cell-main"><strong>{r.name}</strong><small>{r.id} · {r.type}</small></div> },
            { key: 'route', title: '源端 → 目标端', render: (r) => <div className="route-cell"><span className="mono">{r.source}</span><Icon name="arrowright" size={12} /><span className="mono target">{r.target}</span></div> },
            { key: 'tables', title: '对账表数', width: 80, align: 'right', render: (r) => <span className="mono-cell">{r.tables}</span> },
            { key: 'cron', title: '执行周期', width: 104, render: (r) => <span className="tag">{r.cron}</span> },
            { key: 'diff', title: '差异', width: 76, align: 'right', render: (r) => r.diff ? <span className="text-red strong">{r.diff}</span> : <span className="text-green">0</span> },
            { key: 'status', title: '对账结果', width: 88, render: (r) => <Badge dot>{r.status}</Badge> },
            { key: 'updated', title: '最近执行', width: 120, render: (r) => <span className="muted">{r.updated}</span> },
            { key: 'ops', title: '操作', width: 154, render: (r) => <div className="row-actions" onClick={(e) => e.stopPropagation()}><button className="link-btn" onClick={() => setActive(r)}>详情</button><button className="link-muted" onClick={() => run(r)}>执行对账</button><button className="link-muted" onClick={() => notify('查看任务已打开', 'info')}>任务</button></div> },
          ]} />
        </div>
      </Card>
      <Drawer open={!!active} onClose={() => setActive(null)} width={680} title={active?.name || ''} desc={active ? `${active.id} · ${active.type} · ${active.host}` : ''}
        footer={<><Btn onClick={() => setActive(null)}>关闭</Btn><Btn loading={running} icon="play" onClick={() => active && run(active)}>重新对账</Btn><Btn variant="primary" onClick={() => { setActive(null); notify('差异修复任务已创建'); }}>修复差异</Btn></>}>
        {active && <>
          <div className="drawer-summary"><div><span>对账表数</span><strong>{active.tables}</strong></div><div><span>差异记录</span><strong className={active.diff ? 'text-red' : 'text-green'}>{active.diff}</strong></div><div><span>对账结果</span><strong>{active.status}</strong></div><div><span>最近执行</span><strong className="sm">{active.updated}</strong></div></div>
          <div className="recon-hero">
            <div className="recon-side"><span>源端</span><strong>{active.tables * 12846}</strong><small>{active.source}</small></div>
            <div className="recon-mid"><span className={active.diff ? 'bad' : 'ok'}>{active.diff ? `${active.diff} 条差异` : '完全一致'}</span><i /></div>
            <div className="recon-side"><span>目标端</span><strong>{active.tables * 12846 - active.diff}</strong><small>{active.target}</small></div>
          </div>
          <div className="section-title-sm mt-14">差异明细</div>
          {active.diff ? (
            <div className="table-wrap mt-10"><table className="data-table"><thead><tr><th>数据表</th><th>源端行数</th><th>目标端行数</th><th>差异</th><th>类型</th></tr></thead><tbody>
              {[['dbo.EMR_CPOE_BA_SSK', 1842300, 1842294, 6, '缺失'], ['dbo.EMR_CPOE_BA_SYK', 1840200, 1840198, 2, '缺失'], ['dbo.EMR_BLK', 2860410, 2860414, 4, '重复']].map((r) => (
                <tr key={r[0]}><td className="mono-cell">{r[0]}</td><td>{Number(r[1]).toLocaleString()}</td><td>{Number(r[2]).toLocaleString()}</td><td className="text-red strong">{r[3]}</td><td><Badge tone="amber">{r[4]}</Badge></td></tr>
              ))}
            </tbody></table></div>
          ) : <div className="success-note mt-10"><Icon name="checkcircle" size={16} /><div><strong>源端与目标端数据完全一致</strong><span>最近一次对账共校验 {active.tables} 张表，未发现差异。</span></div></div>}
          <div className="info-note mt-14"><Icon name="shield" size={13} /><span>对账基于数据量 MD5 与主键抽样比对，抽样比例 100%。</span></div>
        </>}
      </Drawer>
      <Modal open={open} onClose={() => setOpen(false)} title="新建对账配置" width={580} footer={<><Btn onClick={() => setOpen(false)}>取消</Btn><Btn variant="primary" onClick={() => { setOpen(false); notify('对账配置已创建'); }}>创建</Btn></>}>
        <div className="form-grid">
          <Field label="对账名称" required className="span-2"><input className="input" placeholder="例如：ods_emr_全量对账" /></Field>
          <Field label="源端服务"><Select value="" onChange={() => {}} options={['emr_clinical_source', 'lis_prod_source', 'pacs_archive_source']} placeholder="请选择" /></Field>
          <Field label="目标端服务"><Select value="" onChange={() => {}} options={['ods_emr_target', 'ods_lis_target', 'ods_pacs_target']} placeholder="请选择" /></Field>
          <Field label="对账类型"><Select value="数据量对账" onChange={() => {}} options={['数据量对账', '内容对账', '全字段对账']} /></Field>
          <Field label="执行周期"><Select value="每天 02:00" onChange={() => {}} options={['单次执行', '每天 02:00', '每周一 02:00']} /></Field>
        </div>
      </Modal>
    </>
  );
}
