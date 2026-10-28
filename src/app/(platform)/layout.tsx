'use client';

import dynamic from 'next/dynamic';

const PlatformChrome = dynamic(() => import('@/components/PlatformChrome'), {
  ssr: false,
  loading: () => (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div style={{ color: '#64748b', fontSize: 14 }}>正在加载平台…</div>
    </div>
  ),
});

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformChrome>{children}</PlatformChrome>;
}
