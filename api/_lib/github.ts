/**
 * GitHub Contents API helpers for grokbot MCP writes.
 */
const DEFAULT_REPO = 't9charoen-max/rachawei';
const DEFAULT_BRANCH = 'main';

function repo() {
  return process.env.GITHUB_REPO || DEFAULT_REPO;
}

function branch() {
  return process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
}

function token() {
  return process.env.GITHUB_TOKEN || process.env.GROKBOT_GITHUB_TOKEN || '';
}

export function githubConfigured() {
  return Boolean(token());
}

async function gh(path: string, init: RequestInit = {}) {
  const t = token();
  if (!t) throw new Error('ยังไม่ได้ตั้ง GITHUB_TOKEN บน Vercel (Contents: Read and write)');
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${t}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rachawei-grokbot-mcp',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 400)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const data = await gh(
    `/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch())}`,
  );
  if (!data || data.type !== 'file' || typeof data.content !== 'string') {
    throw new Error(`ไม่พบไฟล์ ${path}`);
  }
  const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { content, sha: data.sha };
}

export async function putFile(path: string, content: string | Buffer, message: string, sha?: string) {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.isBuffer(content)
      ? content.toString('base64')
      : Buffer.from(content, 'utf8').toString('base64'),
    branch: branch(),
  };
  if (sha) body.sha = sha;
  return gh(`/repos/${repo()}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string }> {
  const file = await getFile(path);
  return { data: JSON.parse(file.content) as T, sha: file.sha };
}

export async function writeJsonFile(path: string, data: unknown, message: string, sha: string) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  return putFile(path, text, message, sha);
}

/** Public read fallback when token missing (production site / raw github). */
export async function fetchPublicJson<T>(path: string): Promise<T> {
  const urls = [
    `https://rachawei.vercel.app/${path}`,
    `https://raw.githubusercontent.com/${repo()}/${branch()}/${path}`,
  ];
  let lastErr = '';
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return (await res.json()) as T;
      lastErr = `${url} → ${res.status}`;
    } catch (e) {
      lastErr = String(e);
    }
  }
  throw new Error(`อ่าน ${path} ไม่ได้ (${lastErr})`);
}
