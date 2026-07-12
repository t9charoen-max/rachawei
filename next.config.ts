import type { NextConfig } from 'next';

const isVercel = process.env.VERCEL === '1';
const isStaticExport = process.env.STATIC_EXPORT === '1' || isVercel;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  ...(isStaticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
