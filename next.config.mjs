import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 由自定义 server（server/index.js）托管页面与 /api
  poweredByHeader: false,
  outputFileTracingRoot: root,
};

export default nextConfig;
