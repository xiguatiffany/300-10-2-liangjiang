'use client';

import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { cx } from '@/components/ui';

export type ToastTone = 'success' | 'info' | 'error';
export type AppContextValue = {
  go: (path: string) => void;
  notify: (msg: string, tone?: ToastTone) => void;
  path: string;
};

type Toast = { id: number; msg: string; tone: ToastTone };

export const AppCtx = createContext<AppContextValue>({
  go: () => {},
  notify: () => {},
  path: '/bid/home',
});

export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/bid/home';
  const [toasts, setToasts] = useState<Toast[]>([]);

  const go = useCallback((p: string) => {
    const target = p.startsWith('/') ? p : `/${p}`;
    router.push(target);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0 });
      document.querySelector('.main')?.scrollTo({ top: 0 });
    }
  }, [router]);

  const notify = useCallback((msg: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <AppCtx.Provider value={{ go, notify, path: pathname }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx('toast', `toast-${t.tone}`)}>
            <span className="toast-ico">
              <Icon name={t.tone === 'success' ? 'checkcircle' : t.tone === 'error' ? 'circlex' : 'circlealert'} size={16} />
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
