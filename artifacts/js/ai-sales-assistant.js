/**
 * Storefront AI sales assistant client (vanilla)
 * Calls Supabase Edge Function `ai-sales-assistant`.
 * Falls back to local catalog search when AI/key/quota unavailable.
 * Never holds GEMINI_API_KEY.
 */
(function (global) {
  'use strict';

  const MAX_MSG = 480;
  const HISTORY_KEY = 'rachawei_ai_chat_v1';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(n) {
    const v = Number(n) || 0;
    return v.toLocaleString('th-TH') + ' บาท';
  }

  function getProducts() {
    if (typeof global.products !== 'undefined' && Array.isArray(global.products)) {
      return global.products;
    }
    // app.js keeps products in closure — use DOM catalog via RachaweiStoreApi if needed
    return [];
  }

  function localSearch(query, products) {
    const q = String(query || '').toLowerCase().trim();
    const budgetMatch = q.match(/(?:งบ|ไม่เกิน|ภายใต้|ราคา)\s*(\d{2,6})/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : null;
    let list = (products || []).filter((p) => {
      const stock = p.stock == null ? null : Number(p.stock);
      return stock === null || stock > 0;
    });
    if (budget != null && Number.isFinite(budget)) {
      list = list.filter((p) => Number(p.price) <= budget);
    }
    const tokens = q.split(/[\s,./]+/).filter((t) => t.length >= 2);
    const scored = list
      .map((p) => {
        const hay = [p.name, p.desc, p.detail, p.category, p.size, p.badge]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        let score = 0;
        for (const t of tokens) if (hay.includes(t)) score += 2;
        if (/ตะกร้า/.test(q) && /ตะกร้า/.test(hay)) score += 3;
        if (/เก้าอี้|เก้าอ/.test(q) && /เก้าอี้/.test(hay)) score += 3;
        if (/ของขวัญ|กระเช้า|gift/.test(q) && /ขวัญ|กระเช้า|gift/.test(hay)) score += 2;
        return { p, score };
      })
      .filter((x) => x.score > 0 || budget != null)
      .sort((a, b) => b.score - a.score || Number(a.p.price) - Number(b.p.price));

    const picked = (scored.length ? scored : list.map((p) => ({ p }))).slice(0, 5).map((x) => x.p);
    if (!picked.length) {
      return {
        answer: 'ไม่พบสินค้าที่ตรงคำถามในคลังร้าน — ลองพิมพ์งบประมาณหรือชื่อสินค้า เช่น “ตะกร้าไม่เกิน 400”',
        products: [],
        mode: 'local',
      };
    }
    const lines = picked.map(
      (p, i) =>
        `${i + 1}. ${p.name} — ${formatPrice(p.price)}` +
        (p.stock != null ? ` (คงเหลือ ${p.stock})` : '') +
        (p.size ? ` · ${p.size}` : ''),
    );
    return {
      answer:
        `ค้นหาจากสินค้าจริงในร้าน:\n${lines.join('\n')}\n\n` +
        'เลือกดูรายละเอียดหรือใส่ตะกร้าได้ด้านล่าง (โหมดสำรอง ไม่เรียก AI)',
      products: picked.map((p) => ({
        id: String(p.id),
        name: p.name,
        price: p.price,
        stock: p.stock,
        size: p.size || '',
        image: (p.images && p.images[0]) || p.image || '',
        emoji: p.emoji || '🧺',
      })),
      mode: 'local',
    };
  }

  async function askRemote(message) {
    const api = global.RachaweiStoreApi;
    if (!api || typeof api.init !== 'function') {
      return { ok: false, error: 'supabase_not_ready' };
    }
    await api.init();
    if (!api.isConfigured()) {
      return { ok: false, error: 'supabase_not_configured' };
    }
    const pub = typeof api.getPublicConfig === 'function' ? api.getPublicConfig() : null;
    let base = pub && pub.url ? pub.url : '';
    let key = pub && pub.anonKey ? pub.anonKey : '';
    if (!base || !key) {
      try {
        const conf = await fetch('/api/store-config', { cache: 'no-store' }).then((r) => r.json());
        if (conf && conf.configured && conf.url && conf.anonKey) {
          base = conf.url;
          key = conf.anonKey;
        }
      } catch (_) { /* keep */ }
    }

    if (!base || !key || /service_role/i.test(key)) {
      return { ok: false, error: 'supabase_not_configured' };
    }

    const endpoint = `${String(base).replace(/\/$/, '')}/functions/v1/ai-sales-assistant`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
        'x-rachawei-client': 'storefront',
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || `http_${res.status}`,
        message: data.message || null,
        status: res.status,
      };
    }
    return data;
  }

  function productCardHtml(p) {
    const id = String(p.id);
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy" />`
      : `<span class="ai-chat__emoji">${esc(p.emoji || '🧺')}</span>`;
    const stock =
      p.stock == null
        ? ''
        : Number(p.stock) > 0
          ? `คงเหลือ ${Number(p.stock)}`
          : 'หมดชั่วคราว';
    const canAdd = p.stock == null || Number(p.stock) > 0;
    return `<div class="ai-chat__product" data-pid="${esc(id)}">
      <div class="ai-chat__product-media">${img}</div>
      <div class="ai-chat__product-body">
        <strong>${esc(p.name)}</strong>
        <div class="ai-chat__product-meta">${esc(formatPrice(p.price))}${stock ? ` · ${esc(stock)}` : ''}</div>
        <div class="ai-chat__product-actions">
          <button type="button" class="btn btn-outline btn-xs" data-ai-detail="${esc(id)}">ดูรายละเอียด</button>
          <button type="button" class="btn btn-primary btn-xs" data-ai-add="${esc(id)}" ${canAdd ? '' : 'disabled'}>ใส่ตะกร้า</button>
        </div>
      </div>
    </div>`;
  }

  function appendMessage(logEl, role, text, products) {
    const bubble = document.createElement('div');
    bubble.className = `ai-chat__msg ai-chat__msg--${role}`;
    const body = document.createElement('div');
    body.className = 'ai-chat__bubble';
    body.innerHTML = esc(text).replace(/\n/g, '<br>');
    bubble.appendChild(body);
    if (products && products.length) {
      const wrap = document.createElement('div');
      wrap.className = 'ai-chat__products';
      wrap.innerHTML = products.map(productCardHtml).join('');
      bubble.appendChild(wrap);
    }
    logEl.appendChild(bubble);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function bindProductActions(root) {
    root.querySelectorAll('[data-ai-detail]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-ai-detail'));
        if (typeof global.navigateToProduct === 'function') global.navigateToProduct(id);
        else if (typeof global.openProductDetail === 'function') global.openProductDetail(id);
      });
    });
    root.querySelectorAll('[data-ai-add]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-ai-add'));
        if (typeof global.addToCart === 'function') {
          global.addToCart(id);
        }
      });
    });
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(-20) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(-20)));
    } catch (_) { /* ignore */ }
  }

  function initUi() {
    const fab = document.getElementById('aiChatFab');
    const panel = document.getElementById('aiChatPanel');
    const closeBtn = document.getElementById('aiChatClose');
    const form = document.getElementById('aiChatForm');
    const input = document.getElementById('aiChatInput');
    const logEl = document.getElementById('aiChatLog');
    const statusEl = document.getElementById('aiChatStatus');
    if (!fab || !panel || !form || !input || !logEl) return;

    const history = loadHistory();
    if (!history.length) {
      appendMessage(
        logEl,
        'bot',
        'สวัสดีค่ะ ยินดีช่วยแนะนำงานจักสานหวายบ้านบุทม\nลองถามเช่น “ตะกร้าไม่เกิน 400 บาท” หรือ “ของขวัญงานแต่ง”',
        [],
      );
    } else {
      history.forEach((h) => appendMessage(logEl, h.role, h.text, h.products || []));
      bindProductActions(logEl);
    }

    function setOpen(open) {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        input.focus();
        logEl.scrollTop = logEl.scrollHeight;
      }
    }

    fab.addEventListener('click', () => setOpen(panel.hidden));
    closeBtn?.addEventListener('click', () => setOpen(false));

    document.querySelectorAll('[data-ai-suggest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-ai-suggest') || '';
        setOpen(true);
        form.requestSubmit();
      });
    });

    let busy = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      const message = String(input.value || '').trim().slice(0, MAX_MSG);
      if (message.length < 2) return;
      input.value = '';
      appendMessage(logEl, 'user', message, []);
      const hist = loadHistory();
      hist.push({ role: 'user', text: message });
      saveHistory(hist);

      busy = true;
      if (statusEl) statusEl.textContent = 'กำลังถามผู้ช่วย…';
      form.querySelector('button[type="submit"]')?.setAttribute('disabled', 'true');

      let result = null;
      try {
        result = await askRemote(message);
      } catch (err) {
        result = { ok: false, error: String(err?.message || err) };
      }

      let answer;
      let products = [];
      let mode = 'local';

      if (result && result.ok && result.answer) {
        answer = result.answer;
        products = Array.isArray(result.products) ? result.products : [];
        mode = result.mode || 'gemini';
      } else {
        // Edge Function missing / network — local catalog only
        const productsLive =
          (typeof global.getStoreProductsForAi === 'function' && global.getStoreProductsForAi()) ||
          getProducts();
        const local = localSearch(message, productsLive);
        const errStr = String(result?.error || result?.message || '');
        const why =
          result?.status === 404 || /NOT_FOUND|Failed to fetch|NetworkError|Load failed/i.test(errStr)
            ? 'ยังไม่ได้ Deploy Edge Function `ai-sales-assistant` หรือเรียกไม่สำเร็จ — '
            : result?.error === 'rate_limited'
              ? (result.message || 'ถามบ่อยเกินไป — ') + ' '
              : 'เชื่อมผู้ช่วย AI ไม่ได้ชั่วคราว — ';
        answer = why + local.answer;
        products = local.products;
        mode = 'local';
      }

      appendMessage(logEl, 'bot', answer, products);
      bindProductActions(logEl);
      const hist2 = loadHistory();
      hist2.push({ role: 'bot', text: answer, products, mode });
      saveHistory(hist2);

      if (statusEl) {
        statusEl.textContent =
          mode === 'gemini'
            ? 'ตอบโดย Gemini (สินค้าจาก Supabase)'
            : mode === 'fallback'
              ? 'โหมดสำรองจากเซิร์ฟเวอร์ (ไม่เรียก AI / โควตาเต็ม)'
              : 'โหมดค้นหาในเครื่อง';
      }
      busy = false;
      form.querySelector('button[type="submit"]')?.removeAttribute('disabled');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUi);
  } else {
    initUi();
  }

  global.RachaweiAiSales = { askRemote, localSearch };
})(typeof window !== 'undefined' ? window : globalThis);
