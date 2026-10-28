/** UI Foundation · typed token references for TS consumers */

export const colorModes = ['light', 'dark'] as const;
export type ColorMode = (typeof colorModes)[number];

export const brandThemes = ['default', 'institution'] as const;
export type BrandTheme = (typeof brandThemes)[number];

export const densities = ['comfortable', 'compact'] as const;
export type Density = (typeof densities)[number];

export type AppearanceState = {
  colorMode: ColorMode;
  brandTheme: BrandTheme;
  density: Density;
};

export const defaultAppearance: AppearanceState = {
  colorMode: 'light',
  brandTheme: 'default',
  density: 'comfortable',
};

export const APPEARANCE_STORAGE_KEY = 'lj-ui-appearance';

export const brandSwatches = {
  default: {
    label: '默认紫',
    brand: '#6755f5',
    soft: '#f3f1ff',
  },
  institution: {
    label: '机构青',
    brand: '#0f766e',
    soft: '#f0fdfa',
  },
} as const;

export const semanticColors = {
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
} as const;

export const typeScale = {
  xs: '12px',
  sm: '13px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  kpi: '32px',
} as const;
