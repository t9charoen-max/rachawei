import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isVercel = process.env.VERCEL === '1';
const isStaticExport = process.env.STATIC_EXPORT === '1' || isVercel;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo has multiple lockfiles; pin turbopack root to next-app.
  turbopack: {
    root: appDir,
  },
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
