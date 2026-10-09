#!/usr/bin/env node
/**
 * Post-deploy check for ai-sales-assistant Edge Function.
 * Does NOT print API keys or secret values.
 *
 * Usage:
 *   node scripts/check-ai-assistant-edge.mjs
 *   node scripts/check-ai-assistant-edge.mjs https://jvgfudxdwdwfumdznymu.supabase.co
 *
 * Optional env (never logged):
 *   VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY — for POST test
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fallback = JSON.parse(
  readFileSync(path.join(root, 'artifacts/js/supabase-public-fallback.json'), 'utf8'),
);

const base = String(process.argv[2] || fallback.url || '')
  .trim()
  .replace(/\/$/, '');
const anon = String(
  process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    fallback.anonKey ||
    '',
).trim();

if (!base) {
  console.error('FAIL  missing Supabase URL');
  process.exit(1);
}

const ref = new URL(base).hostname.split('.')[0];
const endpoint = `${base}/functions/v1/ai-sales-assistant`;

function pass(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

let failed = 0;
const rows = [];

async function main() {
  console.log(`Target: ${base}`);
  console.log(`Project ref (from URL): ${ref}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log('');

  // GET health
  const getRes = await fetch(endpoint, { method: 'GET' });
  const getText = await getRes.text();
  let getJson = null;
  try {
    getJson = JSON.parse(getText);
  } catch {
    getJson = null;
  }

  if (getRes.status === 404) {
    failed += 1;
    pass(
      'Edge Function deployed',
      false,
      '404 NOT_FOUND — รัน: supabase link --project-ref ' +
        ref +
        ' && supabase functions deploy ai-sales-assistant --no-verify-jwt',
    );
    console.log('');
    console.log('RESULT: function not deployed on this project yet');
    process.exit(1);
  }

  if (!pass('GET health HTTP 200', getRes.status === 200, `HTTP ${getRes.status}`)) failed += 1;
  if (!pass('GET returns ok:true', Boolean(getJson?.ok), getText.slice(0, 120))) failed += 1;
  if (
    !pass(
      'GET reports geminiKeyConfigured (boolean)',
      typeof getJson?.geminiKeyConfigured === 'boolean',
      `geminiKeyConfigured=${getJson?.geminiKeyConfigured}`,
    )
  ) {
    failed += 1;
  }
  // Never print secret value — only whether configured
  if (getJson?.geminiKeyConfigured === true) {
    pass('GEMINI_API_KEY present in Edge env', true, 'configured=true (value not shown)');
  } else {
    failed += 1;
    pass(
      'GEMINI_API_KEY present in Edge env',
      false,
      'configured=false — ตั้ง Secret GEMINI_API_KEY ในโปรเจกต์นี้แล้ว redeploy ถ้าจำเป็น',
    );
  }

  // OPTIONS CORS
  const opt = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://rachawei-gamma.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type',
    },
  });
  const acao = opt.headers.get('access-control-allow-origin');
  if (!pass('OPTIONS CORS Allow-Origin', Boolean(acao), `Allow-Origin=${acao || '(none)'}`)) {
    failed += 1;
  }

  // POST ask
  if (!anon) {
    failed += 1;
    pass('POST ask', false, 'missing anon key for Authorization header');
  } else {
    const postRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anon}`,
        apikey: anon,
        'Content-Type': 'application/json',
        Origin: 'https://rachawei-gamma.vercel.app',
      },
      body: JSON.stringify({ message: 'แนะนำตะกร้าไม่เกิน 400 บาท' }),
    });
    const postText = await postRes.text();
    let postJson = null;
    try {
      postJson = JSON.parse(postText);
    } catch {
      postJson = null;
    }

    if (!pass('POST HTTP success', postRes.status >= 200 && postRes.status < 300, `HTTP ${postRes.status}`)) {
      failed += 1;
    }
    if (!pass('POST ok:true', Boolean(postJson?.ok), postText.slice(0, 160))) failed += 1;
    const mode = postJson?.mode;
    if (!pass('POST mode gemini|fallback', mode === 'gemini' || mode === 'fallback', `mode=${mode}`)) {
      failed += 1;
    }
    const products = Array.isArray(postJson?.products) ? postJson.products : [];
    const allHaveId = products.every((p) => p && p.id != null && p.name && p.price != null);
    if (!pass('POST products look like catalog rows', products.length === 0 || allHaveId, `count=${products.length}`)) {
      failed += 1;
    }
    // Ensure response body does not echo a Google API key shape
    const leaked = /AIza[0-9A-Za-z_-]{20,}/.test(postText);
    if (!pass('POST response has no API key leakage', !leaked)) failed += 1;

    console.log('');
    console.log(
      `Answer preview (truncated): ${String(postJson?.answer || '')
        .replace(/\s+/g, ' ')
        .slice(0, 160)}`,
    );
  }

  console.log('');
  if (failed) {
    console.log(`RESULT: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('RESULT: all checks passed');
  process.exit(0);
}

main().catch((e) => {
  console.error('FAIL  exception', e?.message || e);
  process.exit(1);
});
