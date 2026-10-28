'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { cx } from '@/components/ui';
import { useAppearance } from '@/providers/appearance-provider';
import { brandSwatches } from '@/lib/design-system/tokens';

export function AppearanceMenu() {
  const {
    colorMode,
    brandTheme,
    density,
    setColorMode,
    setBrandTheme,
    setDensity,
    toggleColorMode,
  } = useAppearance();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="appearance-wrap" ref={wrap}>
      <button
        className={cx('icon-btn', open && 'is-active')}
        aria-label="外观设置"
        title="外观设置"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={colorMode === 'dark' ? 'moon' : 'sun'} size={16} />
      </button>
      {open && (
        <div className="popover appearance-pop" role="dialog" aria-label="外观设置">
          <div className="pop-head">
            <strong>外观</strong>
            <button type="button" onClick={toggleColorMode}>
              {colorMode === 'dark' ? '切到浅色' : '切到深色'}
            </button>
          </div>

          <div className="appearance-section">
            <div className="appearance-label">颜色模式</div>
            <div className="appearance-seg">
              <button
                type="button"
                className={cx(colorMode === 'light' && 'is-active')}
                onClick={() => setColorMode('light')}
              >
                浅色
              </button>
              <button
                type="button"
                className={cx(colorMode === 'dark' && 'is-active')}
                onClick={() => setColorMode('dark')}
              >
                深色
              </button>
            </div>
          </div>

          <div className="appearance-section">
            <div className="appearance-label">品牌主题</div>
            <div className="appearance-themes">
              {(['default', 'institution'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={cx('appearance-theme', brandTheme === key && 'is-active')}
                  onClick={() => setBrandTheme(key)}
                >
                  <i style={{ background: brandSwatches[key].brand }} />
                  <span>{brandSwatches[key].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="appearance-section">
            <div className="appearance-label">信息密度</div>
            <div className="appearance-seg">
              <button
                type="button"
                className={cx(density === 'comfortable' && 'is-active')}
                onClick={() => setDensity('comfortable')}
              >
                舒适
              </button>
              <button
                type="button"
                className={cx(density === 'compact' && 'is-active')}
                onClick={() => setDensity('compact')}
              >
                紧凑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
