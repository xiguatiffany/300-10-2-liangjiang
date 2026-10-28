import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'cyan' | 'slate';

export function Badge({ children, tone = 'blue', dot = false, soft = true, className }: { children: ReactNode; tone?: Tone | string; dot?: boolean; soft?: boolean; className?: string }) {
  const map: Record<string, string> = {
    已发布: 'green', 已启用: 'green', 正常: 'green', 成功: 'green', 一致: 'green', 已完成: 'green', 在线: 'green', 通过: 'green', 启用: 'green', 运行中: 'blue', 已上报: 'green',
    草稿: 'slate', 已停用: 'slate', 已下线: 'slate', 下线: 'slate', 已读: 'slate', 已忽略: 'slate', 维护中: 'amber', 待处理: 'amber', 待补数: 'amber', 预警: 'amber', 警告: 'amber', 延迟: 'amber', 灰度中: 'amber', 暂停: 'amber', 处理中: 'cyan', 同步中: 'cyan', 生成中: 'blue',
    异常: 'red', 失败: 'red', 严重: 'red', 差异: 'red', 未读: 'red',
    已认证: 'blue', 核心: 'blue', 主数据: 'violet', 大字段: 'amber', 影像: 'cyan', 高频更新: 'violet', 运营: 'cyan', 国考: 'blue', 手术: 'violet', 质量: 'green', 门诊: 'amber', 住院: 'red', 院感: 'red', DRG: 'violet', 医保: 'green', 重点监控: 'amber', 公共维度: 'cyan', 指标底座: 'violet', 指标来源: 'blue', 标准字典: 'green', 主题模型: 'violet', 测试: 'slate', 主题: 'violet', 应用: 'blue',
  };
  const resolved = map[String(children)] || tone;
  return <span className={cx('badge', `badge-${resolved}`, !soft && 'badge-solid', className)}>{dot && <i className="badge-dot" />}{children}</span>;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconRight?: string;
  loading?: boolean;
};

export function Btn({ children, variant = 'secondary', size = 'md', icon, iconRight, loading, className, ...rest }: BtnProps) {
  return (
    <button className={cx('btn', `btn-${variant}`, `btn-${size}`, className)} {...rest}>
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} size={size === 'sm' ? 13 : 15} /> : null}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 15} />}
    </button>
  );
}

export function IconBtn({ icon, label, active, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; active?: boolean }) {
  return (
    <button className={cx('icon-btn', active && 'is-active', className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={16} />
    </button>
  );
}

export function Card({ children, className, title, subtitle, actions, noPad, tone }: { children?: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; noPad?: boolean; tone?: string }) {
  return (
    <section className={cx('card', tone && `card-${tone}`, className)}>
      {(title || actions) && (
        <header className="card-head">
          <div className="card-head-text">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={noPad ? 'card-body no-pad' : 'card-body'}>{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, desc, actions, children, back }: { eyebrow?: ReactNode; title: ReactNode; desc?: ReactNode; actions?: ReactNode; children?: ReactNode; back?: () => void }) {
  return (
    <div className="page-head">
      <div className="page-head-main">
        {back && <button className="back-link" onClick={back}><Icon name="arrowleft" size={14} /> 返回</button>}
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc">{desc}</p>}
        {children}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function SectionLabel({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return <div className="section-label"><span>{children}</span>{extra}</div>;
}

export function Tabs({ items, value, onChange, variant = 'line', className }: { items: { key: string; label: ReactNode; count?: number }[]; value: string; onChange: (key: string) => void; variant?: 'line' | 'pill' | 'segmented'; className?: string }) {
  return (
    <div className={cx('tabs', `tabs-${variant}`, className)} role="tablist">
      {items.map((it) => (
        <button key={it.key} role="tab" aria-selected={value === it.key} className={cx('tab', value === it.key && 'is-active')} onClick={() => onChange(it.key)}>
          {it.label}
          {typeof it.count === 'number' && <span className="tab-count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, required, children, hint, className, inline }: { label: ReactNode; required?: boolean; children: ReactNode; hint?: ReactNode; className?: string; inline?: boolean }) {
  return (
    <label className={cx('field', inline && 'field-inline', className)}>
      <span className="field-label">{required && <em>*</em>}{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange?: (v: boolean) => void; label?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cx('toggle-wrap', disabled && 'is-disabled')}>
      <button type="button" role="switch" aria-checked={checked} className={cx('toggle', checked && 'is-on')} onClick={() => !disabled && onChange?.(!checked)}>
        <span />
      </button>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, desc, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; desc?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div><h2>{title}</h2>{desc && <p>{desc}</p>}</div>
          <IconBtn icon="x" label="关闭" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, desc, children, footer, width = 640 }: { open: boolean; onClose: () => void; title: ReactNode; desc?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" style={{ width }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div><h2>{title}</h2>{desc && <p>{desc}</p>}</div>
          <IconBtn icon="x" label="关闭" onClick={onClose} />
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </aside>
    </div>
  );
}

export function Empty({ icon = 'file', title = '暂无数据', desc, action }: { icon?: string; title?: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={22} /></div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function Progress({ value, tone = 'blue', height = 6, showLabel }: { value: number; tone?: string; height?: number; showLabel?: boolean }) {
  return (
    <div className={cx('progress-row', showLabel && 'with-label')}>
      <div className="progress" style={{ height }}>
        <span className={`progress-fill tone-${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showLabel && <span className="progress-label">{value}%</span>}
    </div>
  );
}

export function StatCard({ label, value, unit, delta, icon, tone = 'blue', footer, onClick }: { label: string; value: ReactNode; unit?: string; delta?: ReactNode; icon?: string; tone?: string; footer?: ReactNode; onClick?: () => void }) {
  return (
    <div className={cx('stat-card', `tone-${tone}`, onClick && 'clickable')} onClick={onClick}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon"><Icon name={icon} size={17} /></span>}
      </div>
      <div className="stat-value">{value}{unit && <small>{unit}</small>}</div>
      <div className="stat-foot">
        {delta && <span className="stat-delta">{delta}</span>}
        {footer}
      </div>
    </div>
  );
}

export function KeyValue({ items, cols = 2, className }: { items: { label: ReactNode; value: ReactNode; wide?: boolean }[]; cols?: number; className?: string }) {
  return (
    <div className={cx('kv-grid', className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={i} className={cx('kv', it.wide && 'kv-wide')}>
          <span className="kv-label">{it.label}</span>
          <div className="kv-value">{it.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = '请输入关键词', width }: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number | string }) {
  return (
    <div className="search-input" style={{ width }}>
      <Icon name="search" size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button onClick={() => onChange('')} aria-label="清空"><Icon name="x" size={12} /></button>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, width, className }: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string; width?: number | string; className?: string }) {
  return (
    <select className={cx('select', className)} value={value} onChange={(e) => onChange(e.target.value)} style={{ width }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o, i) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return <option key={`${v}-${i}`} value={v}>{l}</option>;
      })}
    </select>
  );
}

export function Avatar({ name, size = 32, tone = 'blue' }: { name: string; size?: number; tone?: string }) {
  const ch = name?.slice(-2) || '用户';
  return <span className={cx('avatar', `tone-${tone}`)} style={{ width: size, height: size, fontSize: size * 0.36 }}>{ch}</span>;
}

export function StatusDot({ tone = 'green', pulse }: { tone?: string; pulse?: boolean }) {
  return <span className={cx('status-dot', `tone-${tone}`, pulse && 'pulse')} />;
}

export type Column<T> = {
  key: string;
  title: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  accessor?: (row: T) => any;
  className?: string;
};

export function DataTable<T extends Record<string, any>>({ columns, rows, rowKey = 'id', pageSize = 10, onRowClick, empty, footerExtra, dense, defaultSort, paginate = true }: {
  columns: Column<T>[];
  rows: T[];
  rowKey?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  footerExtra?: ReactNode;
  dense?: boolean;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  paginate?: boolean;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(defaultSort || null);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [rows.length]);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = col.accessor || ((r: T) => r[sort.key]);
    return [...rows].sort((a, b) => {
      const va = get(a), vb = get(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va;
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb), 'zh') : String(vb).localeCompare(String(va), 'zh');
    });
  }, [rows, sort, columns]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = paginate ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;
  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));
  };
  return (
    <div className={cx('table-block', dense && 'dense')}>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cx(c.align && `align-${c.align}`, c.sortable && 'sortable')} style={{ width: c.width }} onClick={c.sortable ? () => toggleSort(c.key) : undefined}>
                  {c.title}
                  {c.sortable && <Icon name="chevron" size={11} className={cx('sort-icon', sort?.key === c.key && sort.dir === 'asc' && 'asc')} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((row, idx) => (
              <tr key={row[rowKey] ?? idx} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'clickable' : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.align && `align-${c.align}`, c.className)}>
                    {c.render ? c.render(row, (page - 1) * pageSize + idx) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {current.length === 0 && (empty || <Empty title="暂无匹配数据" desc="调整筛选条件后重试" />)}
      {(paginate || footerExtra) && (
        <div className="table-foot">
          <span className="table-count">共 {sorted.length.toLocaleString()} 条{footerExtra && <>{footerExtra}</>}</span>
          {paginate && totalPages > 1 && (
            <div className="pager">
              <button disabled={page === 1} onClick={() => setPage(1)}>首页</button>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="上一页"><Icon name="chevronleft" size={13} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return p <= totalPages ? <button key={p} className={p === page ? 'is-active' : ''} onClick={() => setPage(p)}>{p}</button> : null;
              })}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="下一页"><Icon name="chevronright" size={13} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(totalPages)}>末页</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Segmented({ items, value, onChange }: { items: { key: string; label: ReactNode }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="segmented">
      {items.map((it) => <button key={it.key} className={value === it.key ? 'is-active' : ''} onClick={() => onChange(it.key)}>{it.label}</button>)}
    </div>
  );
}

export function MiniStat({ label, value, tone = 'slate', suffix }: { label: string; value: ReactNode; tone?: string; suffix?: ReactNode }) {
  return <div className="mini-stat"><span>{label}</span><strong className={`text-${tone}`}>{value}{suffix && <small>{suffix}</small>}</strong></div>;
}
