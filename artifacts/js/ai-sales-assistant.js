/**
 * Storefront AI sales assistant client (vanilla)
 * Calls existing Supabase Edge Function `ai-sales-assistant` only.
 * Never holds GEMINI_API_KEY. Never invents product prices/stock.
 */
(function (global) {
  'use strict';

  const MAX_MSG = 480;
  const HISTORY_KEY = 'rachawei_ai_chat_v1';
  const FUNCTION_NAME = 'ai-sales-assistant';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(n) {
    return (Number(n) || 0).toLocaleString('th-TH') + ' บาท';
  }

  async function getSupabasePublic() {
    const api = global.RachaweiStoreApi;
    if (api && typeof api.init === 'function') {
      try {
        await api.init();
      } catch (_) { /* continue */ }
      if (typeof api.getPublicConfig === 'function') {
        const pub = api.getPublicConfig();
        if (pub && pub.url && pub.anonKey && !/service_role/i.test(pub.anonKey)) {
          return { url: pub.url, anonKey: pub.anonKey };
        }
      }
    }
    try {
      const conf = await fetch('/api/store-config', { cache: 'no-store' }).then((r) => r.json());
      if (conf && conf.configured && conf.url && conf.anonKey && !/service_role/i.test(conf.anonKey)) {
        return { url: conf.url, anonKey: conf.anonKey };
      }
    } catch (_) { /* ignore */ }
    const inj = global.__RACHAWEI_SUPABASE__;
    if (inj && inj.url && inj.anonKey && !/service_role/i.test(inj.anonKey)) {
      return { url: inj.url, anonKey: inj.anonKey };
    }
    return null;
  }

  function functionUrl(base) {
    return `${String(base).replace(/\/$/, '')}/functions/v1/${FUNCTION_NAME}`;
  }

  async function probeHealth() {
    const pub = await getSupabasePublic();
    if (!pub) {
      return { ok: false, error: 'supabase_not_configured', message: 'ยังเชื่อมต่อ Supabase ไม่ได้' };
    }
    try {
      const res = await fetch(functionUrl(pub.url), { method: 'GET', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        return {
          ok: false,
          error: 'not_deployed',
          message: 'ยังไม่พบ Edge Function ai-sales-assistant บนเซิร์ฟเวอร์',
        };
      }
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: 'health_failed',
          message: 'ตรวจสอบผู้ช่วย AI ไม่สำเร็จ',
          status: res.status,
        };
      }
      return {
        ok: true,
        geminiKeyConfigured: Boolean(data.geminiKeyConfigured),
        // Customer-facing: no internal Gemini/key jargon
        message: data.geminiKeyConfigured
          ? 'เชื่อมต่อผู้ช่วยร้านแล้ว'
          : 'พร้อมค้นหาสินค้าจากคลังร้าน',
        statusTone: data.geminiKeyConfigured ? 'info' : 'warn',
      };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: 'เชื่อมต่อผู้ช่วย AI ไม่ได้ — ตรวจเน็ตแล้วลองใหม่',
      };
    }
  }

  async function askRemote(message) {
    const pub = await getSupabasePublic();
    if (!pub) return { ok: false, error: 'supabase_not_configured', message: 'ยังเชื่อมต่อ Supabase ไม่ได้' };

    const res = await fetch(functionUrl(pub.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pub.anonKey}`,
        apikey: pub.anonKey,
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
        'เลือกดูรายละเอียดหรือใส่ตะกร้าได้ด้านล่าง',
      products: picked.map((p) => ({
        id: String(p.id),
        name: p.name,
        price: p.price,
        stock: p.stock,
        size: p.size || '',
        image: (p.images && p.images[0]) || p.image || '',
        emoji: p.emoji || '🧺',
      })),
    };
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

  function appendMessage(logEl, role, text, products, opts = {}) {
    const bubble = document.createElement('div');
    bubble.className = `ai-chat__msg ai-chat__msg--${role}`;
    if (opts.loading) bubble.classList.add('ai-chat__msg--loading');
    if (opts.id) bubble.id = opts.id;
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
    return bubble;
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
        if (typeof global.addToCart === 'function') global.addToCart(id);
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

  function statusForMode(mode, health, result) {
    // Customer-facing status: no internal quota/API-key jargon
    if (mode === 'gemini') {
      return { text: 'ตอบจากผู้ช่วยร้าน · สินค้าจากฐานข้อมูลจริง', tone: 'ok' };
    }
    if (mode === 'fallback') {
      return {
        text: 'แสดงสินค้าจากคลังร้านแทนชั่วคราว',
        tone: 'warn',
      };
    }
    if (health && !health.ok) {
      const msg = String(health.message || '');
      if (/โควตา|Gemini|API Key|quota/i.test(msg)) {
        return { text: 'ผู้ช่วยค้นหาจากคลังสินค้าในร้านชั่วคราว', tone: 'warn' };
      }
      return { text: msg || 'ค้นหาสินค้าในร้านได้', tone: 'error' };
    }
    return {
      text: 'ค้นหาสินค้าในร้านได้',
      tone: 'error',
    };
  }

  function applyStatus(el, text, tone) {
    if (!el) return;
    el.textContent = text || '';
    el.dataset.status = tone || 'info';
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

    let health = null;
    let busy = false;

    const history = loadHistory();
    if (!history.length) {
      appendMessage(
        logEl,
        'bot',
        'สวัสดีค่ะ ยินดีเป็นผู้ช่วย AI ของราชาหวายสุรินทร์\nถามได้ เช่น “ตะกร้าไม่เกิน 400 บาท” หรือ “ของขวัญงานแต่ง”',
        [],
      );
    } else {
      history.forEach((h) => appendMessage(logEl, h.role, h.text, h.products || []));
      bindProductActions(logEl);
    }

    async function refreshHealth() {
      applyStatus(statusEl, 'กำลังตรวจสอบการเชื่อมต่อ…', 'info');
      health = await probeHealth();
      if (health.ok) {
        applyStatus(
          statusEl,
          health.message || 'เชื่อมต่อเซิร์ฟเวอร์ผู้ช่วยแล้ว',
          health.statusTone || 'info',
        );
      } else {
        applyStatus(statusEl, health.message || 'เชื่อมต่อผู้ช่วย AI ไม่สำเร็จ', 'error');
      }
      return health;
    }

    function setOpen(open) {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('ai-chat-open', open);
      if (open) {
        input.focus();
        logEl.scrollTop = logEl.scrollHeight;
        void refreshHealth();
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
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.setAttribute('disabled', 'true');
      applyStatus(statusEl, 'กำลังถามผู้ช่วย AI…', 'info');
      const loadingEl = appendMessage(logEl, 'bot', 'กำลังค้นหาคำตอบ…', [], {
        loading: true,
        id: 'aiChatLoading',
      });

      let result = null;
      try {
        result = await askRemote(message);
      } catch (err) {
        result = { ok: false, error: String(err?.message || err) };
      }

      loadingEl?.remove();

      let answer;
      let products = [];
      let mode = 'local';

      if (result && result.ok && result.answer) {
        // Real Edge Function response only — never invent a "Gemini success" reply.
        answer = result.answer;
        products = Array.isArray(result.products) ? result.products : [];
        mode = result.mode === 'gemini' ? 'gemini' : 'fallback';
        if (mode === 'fallback' && result.error) {
          // Soft prefix for customers — hide internal quota/key details
          const soft = 'ขอแสดงผลการค้นหาสินค้าในร้านแทนชั่วคราวค่ะ\n\n';
          if (!/ค้นหาสินค้าในร้าน|คลังร้าน/i.test(answer)) {
            answer = soft + answer;
          }
        }
      } else {
        const productsLive =
          (typeof global.getStoreProductsForAi === 'function' && global.getStoreProductsForAi()) ||
          [];
        const local = localSearch(message, productsLive);
        const errStr = String(result?.error || result?.message || '');
        let why = 'เชื่อมผู้ช่วย AI ไม่ได้ชั่วคราว — ';
        if (result?.status === 404 || /NOT_FOUND/i.test(errStr)) {
          why = 'ยังไม่พบ Edge Function บนเซิร์ฟเวอร์ — ';
        } else if (result?.error === 'rate_limited') {
          why = (result.message || 'ถามบ่อยเกินไป') + ' — ';
        } else if (result?.error === 'supabase_not_configured') {
          why = 'ยังเชื่อมต่อฐานข้อมูลไม่ได้ — ';
        } else if (result?.message) {
          why = String(result.message) + ' — ';
        }
        answer = why + local.answer;
        products = local.products;
        mode = 'local';
      }

      appendMessage(logEl, 'bot', answer, products);
      bindProductActions(logEl);
      const hist2 = loadHistory();
      hist2.push({ role: 'bot', text: answer, products, mode });
      saveHistory(hist2);

      const st = statusForMode(mode, health, result);
      applyStatus(statusEl, st.text, st.tone);
      busy = false;
      submitBtn?.removeAttribute('disabled');
    });

    // Warm health in background after store scripts load
    setTimeout(() => {
      void refreshHealth();
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUi);
  } else {
    initUi();
  }

  global.RachaweiAiSales = { askRemote, localSearch, probeHealth };
})(typeof window !== 'undefined' ? window : globalThis);
