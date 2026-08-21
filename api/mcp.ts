import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TOOL_DEFS, callTool } from './_lib/tools.js';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '9mb',
    },
  },
};

const SERVER_INFO = {
  name: 'rachawei-grokbot-mcp',
  version: '1.0.0',
};

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, Mcp-Session-Id, Last-Event-ID',
  );
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

function expectedToken() {
  return process.env.MCP_API_TOKEN || process.env.GROKBOT_MCP_TOKEN || '';
}

function unauthorized(res: VercelResponse) {
  res.setHeader(
    'WWW-Authenticate',
    'Bearer realm="rachawei-mcp", error="invalid_token"',
  );
  return res.status(401).json({
    error: 'unauthorized',
    message: 'ใส่ Header Authorization: Bearer <MCP_API_TOKEN>',
  });
}

function checkAuth(req: VercelRequest, res: VercelResponse) {
  const expected = expectedToken();
  // If no token configured, allow read-only discovery but still warn via mcp_status
  if (!expected) return true;
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== expected) {
    unauthorized(res);
    return false;
  }
  return true;
}

function okResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function errResult(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function handleRpc(message: any) {
  const { method, params, id } = message || {};
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return { notification: true };
  }

  switch (method) {
    case 'initialize':
      return okResult(id, {
        protocolVersion: params?.protocolVersion || '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'MCP ของร้านราชาหวายสุรินทร์ — ใช้ list/get/upsert สินค้า อัปโหลดรูป และอัปเดตข้อมูลร้าน แล้ว commit ขึ้น GitHub เพื่อให้ Vercel deploy',
      });

    case 'ping':
      return okResult(id, {});

    case 'tools/list':
      return okResult(id, { tools: TOOL_DEFS });

    case 'tools/call': {
      const name = params?.name as string;
      const args = (params?.arguments || {}) as Record<string, unknown>;
      try {
        const result = await callTool(name, args);
        return okResult(id, result);
      } catch (e: any) {
        return okResult(id, {
          isError: true,
          content: [{ type: 'text', text: e?.message || String(e) }],
        });
      }
    }

    case 'resources/list':
      return okResult(id, { resources: [] });

    case 'prompts/list':
      return okResult(id, { prompts: [] });

    default:
      return errResult(id, -32601, `Method not found: ${method}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    // Health / discovery for connectors
    return res.status(200).json({
      ok: true,
      transport: 'streamable-http',
      server: SERVER_INFO,
      mcpUrl: 'https://rachawei.vercel.app/mcp',
      tools: TOOL_DEFS.map((t) => t.name),
      auth: expectedToken() ? 'bearer-required' : 'open-dev-mode',
    });
  }

  if (req.method === 'DELETE') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!checkAuth(req, res)) return;

  const body = req.body;
  const messages = Array.isArray(body) ? body : [body];
  const sessionId = String(req.headers['mcp-session-id'] || `sess_${Date.now()}`);
  res.setHeader('Mcp-Session-Id', sessionId);

  if (messages.length === 1 && messages[0]?.method?.startsWith('notifications/')) {
    return res.status(202).end();
  }

  if (messages.length === 1) {
    const out = await handleRpc(messages[0]);
    if ((out as any).notification) return res.status(202).end();
    return res.status(200).json(out);
  }

  const outs = [];
  for (const msg of messages) {
    const out = await handleRpc(msg);
    if (!(out as any).notification) outs.push(out);
  }
  return res.status(200).json(outs);
}
