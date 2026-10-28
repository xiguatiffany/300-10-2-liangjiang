'use client';

import React from 'react';
import { Icon } from '@/components/Icon';
import { Btn } from '@/components/ui';
import { defaultRoute } from '@/nav';
import { pageMap } from '@/lib/page-registry';
import { useApp } from '@/app-context';

export function PageRenderer({
  module,
  page,
  param,
}: {
  module: string;
  page: string;
  param?: string;
}) {
  const { go } = useApp();
  const Component = pageMap[`${module}/${page}`];

  if (!Component) {
    return (
      <div className="page-404">
        <Icon name="scan" size={32} />
        <h2>页面不存在</h2>
        <p>该功能暂未开放或链接已失效</p>
        <Btn variant="primary" onClick={() => go(defaultRoute('bid'))}>返回平台首页</Btn>
      </div>
    );
  }

  return <Component param={param} />;
}
