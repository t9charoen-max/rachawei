/** Prefix public asset paths for GitHub Pages basePath (/rachawei) */
export function assetUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!path) return base || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
