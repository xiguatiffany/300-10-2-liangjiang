'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const PageRenderer = dynamic(
  () => import('@/components/PageRenderer').then((m) => m.PageRenderer),
  { ssr: false, loading: () => <div className="page-loading">页面加载中…</div> },
);

export default function ModuleDetailPage() {
  const params = useParams<{ module: string; page: string; param: string }>();
  return <PageRenderer module={params.module} page={params.page} param={params.param} />;
}
