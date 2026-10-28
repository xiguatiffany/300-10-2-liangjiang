'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Btn, Card, Field, Tabs, cx } from '@/components/ui';
import { AppearanceMenu } from '@/components/AppearanceMenu';
import { useAppearance } from '@/providers/appearance-provider';
import { brandSwatches, semanticColors, typeScale } from '@/lib/design-system/tokens';

const demoRows = [
  { name: '门诊就诊记录', type: '结构化', status: '正常' },
  { name: '医学影像数据', type: 'DICOM', status: '正常' },
  { name: '电子病历文档', type: '非结构化', status: '待处理' },
];

const tokenSwatches = [
  { name: 'Brand', varName: '--brand', color: 'var(--brand)' },
  { name: 'Brand Soft', varName: '--brand-soft', color: 'var(--brand-soft)' },
  { name: 'Surface', varName: '--surface', color: 'var(--surface)' },
  { name: 'Card', varName: '--card', color: 'var(--card)' },
  { name: 'On Surface', varName: '--on-surface', color: 'var(--on-surface)' },
  { name: 'Outline', varName: '--outline-variant', color: 'var(--outline-variant)' },
  { name: 'Success', varName: '--success', color: 'var(--success)' },
  { name: 'Warning', varName: '--warning', color: 'var(--warning)' },
  { name: 'Error', varName: '--error', color: 'var(--error)' },
];

export default function DesignSystemPage() {
  const { colorMode, brandTheme, density, setDensity, setColorMode, setBrandTheme } = useAppearance();
  const [tab, setTab] = useState('buttons');
  const [localDensity, setLocalDensity] = useState<'comfortable' | 'compact'>('comfortable');

  return (
    <div className="ds-page">
      <header className="ds-top">
        <div className="ds-brand">
          <strong>UI Foundation</strong>
          <span>两江新区数智健康 · Design System</span>
        </div>
        <div className="ds-top-actions">
          <AppearanceMenu />
          <Link href="/bid/home" className="btn btn-secondary btn-sm">返回平台</Link>
        </div>
      </header>

      <main className="ds-body">
        <section className="ds-hero">
          <div className="eyebrow">DEV ONLY · /dev/design-system</div>
          <h1>可视化组件规范</h1>
          <p>
            开发人员集中查看 Design Tokens、主题维度（Light / Dark / Institution）、
            信息密度（Comfortable / Compact）与基础组件。当前外观：
            {colorMode === 'dark' ? '深色' : '浅色'} · {brandSwatches[brandTheme].label} ·
            {density === 'compact' ? '紧凑' : '舒适'}
          </p>
        </section>

        <section className="ds-section">
          <div className="ds-section-head">
            <h2>外观控制</h2>
            <p>三维度独立组合，无需维护多份 CSS</p>
          </div>
          <Card>
            <div className="ds-row" style={{ marginBottom: 14 }}>
              <Btn
                variant={colorMode === 'light' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setColorMode('light')}
              >
                Light
              </Btn>
              <Btn
                variant={colorMode === 'dark' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setColorMode('dark')}
              >
                Dark
              </Btn>
              <Btn
                variant={brandTheme === 'default' ? 'subtle' : 'secondary'}
                size="sm"
                onClick={() => setBrandTheme('default')}
              >
                Default 紫
              </Btn>
              <Btn
                variant={brandTheme === 'institution' ? 'subtle' : 'secondary'}
                size="sm"
                onClick={() => setBrandTheme('institution')}
              >
                Institution 青
              </Btn>
              <Btn
                variant={density === 'comfortable' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDensity('comfortable')}
              >
                Comfortable
              </Btn>
              <Btn
                variant={density === 'compact' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDensity('compact')}
              >
                Compact
              </Btn>
            </div>
            <p className="field-hint">全局设置会写入 localStorage（lj-ui-appearance），并同步到平台顶栏外观菜单。</p>
          </Card>
        </section>

        <section className="ds-section">
          <div className="ds-section-head">
            <h2>Color Tokens</h2>
            <p>品牌色 · 语义色 · 表面与描边</p>
          </div>
          <div className="ds-swatches">
            {tokenSwatches.map((s) => (
              <div key={s.varName} className="ds-swatch">
                <i style={{ background: s.color }} />
                <div>
                  <strong>{s.name}</strong>
                  <small>{s.varName}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="ds-row">
            <Badge tone="green">Success {semanticColors.success}</Badge>
            <Badge tone="amber">Warning {semanticColors.warning}</Badge>
            <Badge tone="red">Error {semanticColors.error}</Badge>
            <Badge tone="blue">Brand</Badge>
            <Badge tone="violet">Violet</Badge>
            <Badge tone="slate">Slate</Badge>
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-head">
            <h2>Typography</h2>
            <p>字号阶梯；不再全局强制 font-weight: 400</p>
          </div>
          <div className="ds-type-scale">
            {Object.entries(typeScale).map(([key, size]) => (
              <div key={key} className="ds-type-row">
                <em>{key} · {size}</em>
                <span style={{ fontSize: size, fontWeight: key === 'kpi' || key === '2xl' ? 700 : key === 'xl' || key === 'lg' ? 600 : 500 }}>
                  两江新区数智健康管理服务平台
                </span>
              </div>
            ))}
          </div>
          <div className="ds-row">
            <span className="fw-regular">Regular 400</span>
            <span className="fw-medium">Medium 500</span>
            <span className="fw-semibold">Semibold 600</span>
            <span className="fw-bold">Bold 700</span>
          </div>
        </section>

        <section className="ds-section">
          <div className="ds-section-head">
            <h2>Components</h2>
            <p>Button · Input · Tabs · Card</p>
          </div>
          <Card
            title="基础组件"
            subtitle="与平台共享 src/components/ui.tsx"
            actions={
              <Tabs
                variant="pill"
                items={[
                  { key: 'buttons', label: '按钮' },
                  { key: 'forms', label: '表单' },
                ]}
                value={tab}
                onChange={setTab}
              />
            }
          >
            {tab === 'buttons' ? (
              <div className="ds-row">
                <Btn variant="primary">Primary</Btn>
                <Btn variant="secondary">Secondary</Btn>
                <Btn variant="ghost">Ghost</Btn>
                <Btn variant="subtle">Subtle</Btn>
                <Btn variant="danger">Danger</Btn>
                <Btn variant="dark">Dark</Btn>
                <Btn size="sm" variant="primary">Small</Btn>
                <Btn size="lg" variant="primary">Large</Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                <Field label="资产名称" required>
                  <input className="input" placeholder="例如：门诊就诊记录" />
                </Field>
                <Field label="数据类型" hint="结构化 / DICOM / 非结构化">
                  <select className="select input">
                    <option>结构化</option>
                    <option>DICOM</option>
                    <option>非结构化</option>
                  </select>
                </Field>
              </div>
            )}
          </Card>
        </section>

        <section className="ds-section">
          <div className="ds-section-head">
            <h2>Density · 数据资产表</h2>
            <p>切换模式查看表格行距；也可只作用在局部容器</p>
          </div>
          <div className="ds-density-demo" data-density={localDensity}>
            <div className="ds-density-toolbar">
              <div>
                <strong style={{ fontSize: 13 }}>数据资产</strong>
                <p className="table-count">共 {demoRows.length} 条记录 · 当前 {localDensity === 'compact' ? '紧凑' : '舒适'}</p>
              </div>
              <div className="appearance-seg" style={{ width: 180 }}>
                <button
                  type="button"
                  className={cx(localDensity === 'comfortable' && 'is-active')}
                  onClick={() => setLocalDensity('comfortable')}
                >
                  舒适
                </button>
                <button
                  type="button"
                  className={cx(localDensity === 'compact' && 'is-active')}
                  onClick={() => setLocalDensity('compact')}
                >
                  紧凑
                </button>
              </div>
            </div>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>资产名称</th>
                  <th>类型</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {demoRows.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <div className="cell-main">
                        <strong>{row.name}</strong>
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td><Badge tone={row.status === '正常' ? 'green' : 'amber'}>{row.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
