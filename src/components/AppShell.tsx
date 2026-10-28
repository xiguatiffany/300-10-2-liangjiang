'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Btn, cx, IconBtn } from '@/components/ui';
import { modules, navConfig, defaultRoute, resolveNav, ModuleKey } from '@/nav';
import { hospital, indicators, assets, alerts as seedAlerts } from '@/data';
import { DemoController } from '@/components/DemoController';
import { AppearanceMenu } from '@/components/AppearanceMenu';
import { useApp } from '@/app-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { go, notify, path } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [dbMode, setDbMode] = useState<'checking' | 'db' | 'demo'>('checking');
  const [readAlerts, setReadAlerts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrap = useRef<HTMLDivElement>(null);
  const notifWrap = useRef<HTMLDivElement>(null);
  const userWrap = useRef<HTMLDivElement>(null);

  // 兼容旧 hash 路由书签：#/bid/home → /bid/home
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('/')) {
      const search = window.location.search || '';
      router.replace(`${hash}${search}`);
    }
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 30);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setUserOpen(false); }
    };
    const onClick = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifWrap.current && !notifWrap.current.contains(e.target as Node)) setNotifOpen(false);
      if (userWrap.current && !userWrap.current.contains(e.target as Node)) setUserOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' }).then((r) => r.ok ? r.json() : Promise.reject()).then(() => setDbMode('db')).catch(() => setDbMode('demo'));
  }, []);

  const navMeta = resolveNav(path);
  const module: ModuleKey = (path.split('/')[1] as ModuleKey) || 'center';
  const activeModule = modules.find((m) => m.key === module) || modules[0];

  const switchModule = (m: ModuleKey) => {
    if (m === module) return;
    go(defaultRoute(m));
  };

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { pages: [], indicators: [], assets: [] };
    const pages: { label: string; path: string; group: string; icon: string }[] = [];
    (Object.keys(navConfig) as ModuleKey[]).forEach((m) => {
      const mod = modules.find((x) => x.key === m)!;
      navConfig[m].forEach((g) => g.items.forEach((it) => {
        if ((it.label + g.title + mod.label).toLowerCase().includes(q)) pages.push({ label: it.label, path: `/${m}/${it.key}`, group: `${mod.short} / ${g.title}`, icon: it.icon });
      }));
    });
    return {
      pages: pages.slice(0, 5),
      indicators: indicators.filter((i) => (i.name + i.code + i.category + i.tags.join('')).toLowerCase().includes(q)).slice(0, 5),
      assets: assets.filter((a) => (a.name + a.id + a.domain).toLowerCase().includes(q)).slice(0, 4),
    };
  }, [search]);

  const hasResults = searchResults.pages.length + searchResults.indicators.length + searchResults.assets.length > 0;

  return (
    <>
      <div className="app-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen((v) => !v)} aria-label="打开导航"><Icon name="menu" size={19} /></button>
          <div className="brand" role="button" tabIndex={0} onClick={() => go(defaultRoute(module))} onKeyDown={(e) => e.key === 'Enter' && go(defaultRoute(module))}>
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="36" height="36">
                <defs><linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6755F5" /><stop offset="1" stopColor="#6755F5" /></linearGradient></defs>
                <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#logo-g)" />
                <path d="M9 21h5l2.6-7 4.2 14 3-9 2.2 4H31" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="31" cy="23" r="2" fill="#8EF0E1" />
              </svg>
            </div>
            <div className="brand-text">
              <strong>MedData</strong>
              <span>医疗数据中台</span>
            </div>
          </div>

          <div className="module-tabs" role="tablist" aria-label="平台切换">
            {modules.map((m) => (
              <button key={m.key} className={cx('module-tab', module === m.key && 'is-active')} onClick={() => switchModule(m.key)} role="tab" aria-selected={module === m.key}>
                <Icon name={m.icon} size={16} />
                <span className="mt-label">{m.label}</span>
                <span className="mt-desc">{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="top-actions">
            <div className="global-search" ref={searchWrap}>
              <div className={cx('search-box', searchOpen && 'is-open')}>
                <Icon name="search" size={15} />
                <input
                  ref={searchRef}
                  value={search}
                  placeholder="搜索指标、数据表、功能…"
                  onFocus={() => { setSearchOpen(true); setNotifOpen(false); setUserOpen(false); }}
                  onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                />
                <kbd>⌘ K</kbd>
              </div>
              {searchOpen && (
                <div className="search-panel">
                  {!search && (
                    <>
                      <div className="sp-title">快捷访问</div>
                      <div className="sp-quick">
                        {[
                          { label: '指标列表', path: '/center/indicators', icon: 'gauge' },
                          { label: '数据查询', path: '/center/sql', icon: 'code' },
                          { label: '采集配置', path: '/collection/configs', icon: 'sliders' },
                          { label: '运行监控', path: '/collection/runtime', icon: 'activity' },
                        ].map((q) => (
                          <button key={q.path} onClick={() => { go(q.path); setSearchOpen(false); setSearch(''); }}>
                            <Icon name={q.icon} size={15} /><span>{q.label}</span><em>打开</em>
                          </button>
                        ))}
                      </div>
                      <div className="sp-hint">支持搜索 2,572 项指标、12,846 张数据表与全部功能模块</div>
                    </>
                  )}
                  {search && !hasResults && <div className="sp-empty">未找到“{search}”相关内容，试试指标编码或表名</div>}
                  {searchResults.pages.length > 0 && (
                    <div className="sp-group"><div className="sp-title">功能</div>
                      {searchResults.pages.map((r) => (
                        <button key={r.path} className="sp-row" onClick={() => { go(r.path); setSearch(''); setSearchOpen(false); }}>
                          <span className="sp-icon"><Icon name={r.icon} size={15} /></span>
                          <span className="sp-main"><strong>{r.label}</strong><small>{r.group}</small></span>
                          <Icon name="arrowupright" size={13} />
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.indicators.length > 0 && (
                    <div className="sp-group"><div className="sp-title">指标</div>
                      {searchResults.indicators.map((i) => (
                        <button key={i.id} className="sp-row" onClick={() => { go(`/center/indicator/${i.id}`); setSearch(''); setSearchOpen(false); }}>
                          <span className="sp-icon"><Icon name="gauge" size={15} /></span>
                          <span className="sp-main"><strong>{i.name}</strong><small>{i.code} · {i.category}</small></span>
                          <em className="sp-tag">{i.type}</em>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.assets.length > 0 && (
                    <div className="sp-group"><div className="sp-title">数据表</div>
                      {searchResults.assets.map((a) => (
                        <button key={a.id} className="sp-row" onClick={() => { go('/center/assets'); setSearch(''); setSearchOpen(false); }}>
                          <span className="sp-icon"><Icon name="table" size={15} /></span>
                          <span className="sp-main"><strong>{a.name}</strong><small>{a.id} · {a.layer}</small></span>
                          <em className="sp-tag">{a.domain}</em>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <AppearanceMenu />
            <IconBtn icon="help" label="帮助中心" onClick={() => notify('帮助中心正在建设中，可联系信息中心 8866', 'info')} />
            <div className="notif-wrap" ref={notifWrap}>
              <button className={cx('icon-btn bell-btn', notifOpen && 'is-active')} aria-label="通知" onClick={() => { setNotifOpen((v) => !v); setSearchOpen(false); setUserOpen(false); }}>
                <Icon name="bell" size={17} />
                {!readAlerts && <span className="bell-dot" />}
              </button>
              {notifOpen && (
                <div className="popover notif-pop">
                  <div className="pop-head"><strong>通知中心</strong><button onClick={() => { setReadAlerts(true); notify('已全部标记为已读'); }}>全部已读</button></div>
                  <div className="notif-list">
                    {seedAlerts.slice(0, 4).map((a) => (
                      <button key={a.id} className={cx('notif-item', readAlerts && 'is-read')} onClick={() => { go('/collection/alerts'); setNotifOpen(false); }}>
                        <span className={cx('notif-ico', a.level === '严重' ? 'bad' : a.level === '警告' ? 'warn' : 'info')}><Icon name={a.level === '严重' ? 'circlealert' : 'bell'} size={14} /></span>
                        <span className="notif-text"><strong>{a.title}</strong><small>{a.time} · {a.type}</small></span>
                      </button>
                    ))}
                  </div>
                  <div className="pop-foot"><button onClick={() => { go('/collection/alerts'); setNotifOpen(false); }}>查看全部告警 <Icon name="arrowright" size={13} /></button></div>
                </div>
              )}
            </div>

            <div className="user-wrap" ref={userWrap}>
              <button className="user-chip" onClick={() => { setUserOpen((v) => !v); setSearchOpen(false); setNotifOpen(false); }}>
                <Avatar name="张敏" size={30} tone="blue" />
                <span className="user-meta"><strong>张敏</strong><small>指标管理员</small></span>
                <Icon name="chevron" size={13} />
              </button>
              {userOpen && (
                <div className="popover user-pop">
                  <div className="user-pop-head"><Avatar name="张敏" size={38} /><div><strong>张敏</strong><span>信息中心 · 指标管理员</span></div></div>
                  <div className="user-pop-list">
                    <button onClick={() => { go('/admin/roles'); setUserOpen(false); }}><Icon name="usercog" size={14} /> 角色与权限</button>
                    <button onClick={() => { go('/admin/settings'); setUserOpen(false); }}><Icon name="settings" size={14} /> 平台设置</button>
                    <button onClick={() => { notify('已切换至数据管理员视图', 'info'); setUserOpen(false); }}><Icon name="refresh" size={14} /> 切换工作角色</button>
                  </div>
                  <div className="user-pop-foot"><button onClick={() => { notify('演示环境，退出登录已禁用', 'info'); setUserOpen(false); }}><Icon name="logout" size={14} /> 退出登录</button></div>
                </div>
              )}
            </div>
          </div>
        </header>

        <aside className={cx('sidebar', mobileOpen && 'is-open')}>
          <div className="sidebar-context">
            <div className="sc-top"><span>{activeModule.short}</span><i className="live-dot" /></div>
            <strong>{hospital.name}</strong>
            <div className="sc-badges"><span className="env-pill">{hospital.env}</span><span className="sc-code">EWYA · MEDDATA</span></div>
          </div>
          <nav className="side-nav">
            {(module === 'bid' || module === 'collection') && (
              <div className="nav-legend" title="与招标文档标注一致">
                <span><b>★</b> 须现场演示</span>
                <span><em>▲</em> 功能截图</span>
              </div>
            )}
            {navConfig[module].map((group) => (
              <div className="nav-group" key={group.title}>
                <div className="nav-group-title">{group.title}</div>
                {group.items.map((item) => (
                  <button key={item.key} className={cx('nav-item', navMeta.active === item.key && 'is-active')} onClick={() => go(`/${module}/${item.key}`)}>
                    <Icon name={item.icon} size={16} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <em className={cx(
                        'nav-badge',
                        `tone-${item.badgeTone || 'blue'}`,
                        item.badge === '★' && 'is-star',
                        item.badge === '▲' && 'is-tri',
                      )}
                      >
                        {item.badge}
                      </em>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="foot-state"><span className="status-line" /><div><strong>数据服务运行正常</strong><small>更新于 {hospital.updated.slice(5)}</small></div></div>
            <div className="foot-version"><span>MedData v3.8.2</span><button onClick={() => notify('当前已是最新版本')}>检查更新</button></div>
          </div>
        </aside>

        {mobileOpen && <div className="sidebar-mask" onClick={() => setMobileOpen(false)} />}

        <main className="main">
          <div className="breadcrumb">
            <span className="crumb-home"><Icon name={activeModule.icon} size={13} />{activeModule.short}</span>
            <Icon name="chevronright" size={12} />
            <span>{navMeta.groupTitle}</span>
            <Icon name="chevronright" size={12} />
            <strong>{navMeta.label}</strong>
            <span className="crumb-right">
              <span className="data-date"><Icon name="calendar" size={13} /> 2026-08-06 星期四</span>
              <span className="crumb-sep">|</span>
              <span className="data-refresh" title={dbMode === 'db' ? 'PGlite 数据库已连接' : '未连接 API，使用前端演示数据'}><i /> {dbMode === 'db' ? 'PGlite 已连接' : dbMode === 'checking' ? '连接检测中' : '演示数据'}</span>
            </span>
          </div>
          <div className="page-container" key={pathname}>
            {children}
          </div>
        </main>
      </div>

      <DemoController />
    </>
  );
}
