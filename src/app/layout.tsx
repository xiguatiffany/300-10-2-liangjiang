import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import '@/styles/foundation.css';
import { AppearanceProvider } from '@/providers/appearance-provider';

export const metadata: Metadata = {
  title: '两江新区数智健康管理服务平台',
  description: 'MedData 医疗数据中台 — 医院数据资产、指标中台与数据采集监控平台',
  icons: { icon: '/favicon.svg' },
};

const appearanceBootScript = `
(function(){
  try {
    var raw = localStorage.getItem('lj-ui-appearance');
    var s = raw ? JSON.parse(raw) : null;
    var root = document.documentElement;
    if (s && s.colorMode === 'dark') root.classList.add('dark');
    if (s && s.brandTheme && s.brandTheme !== 'default') root.setAttribute('data-theme', s.brandTheme);
    root.setAttribute('data-density', (s && s.density) || 'comfortable');
    root.style.colorScheme = (s && s.colorMode) || 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
