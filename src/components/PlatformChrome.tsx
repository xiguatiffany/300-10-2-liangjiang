'use client';

import { AppProvider } from '@/app-context';
import { AppShell } from '@/components/AppShell';

export default function PlatformChrome({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
