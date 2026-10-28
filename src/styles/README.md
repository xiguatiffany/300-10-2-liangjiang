# UI Foundation

统一设计系统入口：`foundation.css`（由 `app/layout.tsx` 引入）。

## 目录

| 路径 | 职责 |
|------|------|
| `tokens/` | 品牌色、语义色、字体、间距、动效 |
| `themes/` | Light 默认 · Dark · Institution |
| `density/` | Comfortable · Compact |
| `base/` | reset / typography / a11y |
| `components/` | 按钮、表单、表格、卡片等通用组件 |
| `modules/` | 业务页面样式（门户、采集、湖仓、质控…） |
| `legacy/` | 迁移前 `styles.css` / `bid.css` 快照 |

## 约定

1. **只通过 `foundation.css` 引入样式**，不要再单独 import 根目录 `styles.css` / `bid.css`。
2. 新页面样式放到 `modules/<name>.css`，并在 `foundation.css` 中 `@import`。
3. 颜色 / 间距优先用 CSS 变量（`--brand`、`--surface-*`、`--on-surface`…），避免写死 `#fff`。
4. 主题通过 `html.dark`、`data-theme`、`data-density` 切换，由 `AppearanceProvider` 管理。

## 开发规范页

`/dev/design-system`
