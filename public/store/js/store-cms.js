/**
 * หน้าบ้าน CMS — hydrate ข้อความ/รูป/วิดีโอ + แท็บหลังร้าน «หน้าบ้าน»
 * โหลดหลัง store-content.js และก่อน/พร้อมกับ app.js (เรียกใช้ตอน runtime)
 */
(function storeCmsModule() {
  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureContent() {
    if (typeof SHOP_CONFIG === 'undefined') return null;
    if (typeof mergeStoreContent === 'function') {
      SHOP_CONFIG.content = mergeStoreContent(SHOP_CONFIG.content);
    } else if (!SHOP_CONFIG.content) {
      SHOP_CONFIG.content = typeof cloneStoreContent === 'function'
        ? cloneStoreContent(DEFAULT_STORE_CONTENT)
        : JSON.parse(JSON.stringify(DEFAULT_STORE_CONTENT));
    }
    return SHOP_CONFIG.content;
  }

  function setText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function setHtml(el, html) {
    if (el && html != null) el.innerHTML = html;
  }

  function fillPageTop(panelId, page) {
    const panel = document.getElementById(panelId);
    if (!panel || !page) return;
    const top = panel.querySelector('.page-top');
    if (!top) return;
    const kicker = top.querySelector('.page-kicker');
    const h1 = top.querySelector('h1');
    const lead = top.querySelector('p');
    setText(kicker, page.kicker);
    setText(h1, page.title);
    setText(lead, page.lead);
  }

  function starString(n) {
    const count = Math.max(1, Math.min(5, Number(n) || 5));
    return '★'.repeat(count);
  }

  function renderReviewsBlock(reviews) {
    const section = document.getElementById('reviews');
    if (!section || !reviews) return;
    const kicker = section.querySelector('.reviews-kicker');
    const title = document.getElementById('reviewsTitle');
    const score = section.querySelector('.reviews-score');
    const lead = section.querySelector('.reviews-lead');
    const track = section.querySelector('.reviews-track');
    setText(kicker, reviews.kicker);
    setText(title, reviews.title);
    if (score) {
      score.textContent = reviews.score || '';
      if (reviews.scoreLabel) score.setAttribute('aria-label', reviews.scoreLabel);
    }
    setText(lead, reviews.lead);
    if (!track) return;
    const items = Array.isArray(reviews.items) ? reviews.items : [];
    if (!items.length) {
      section.hidden = true;
      track.innerHTML = '';
      return;
    }
    section.hidden = false;
    track.innerHTML = items.map((item) => {
      const stars = starString(item.stars);
      return `<article class="review-card">
          <div class="review-card__photo">
            <img src="${esc(item.img || '')}" alt="${esc(item.alt || '')}" loading="lazy" decoding="async" />
            <span class="review-card__badge">${esc(item.badge || 'ภาพใช้งานจริง')}</span>
          </div>
          <div class="review-card__body">
            <div class="review-card__stars" aria-label="${esc(String(item.stars || 5))} ดาว">${stars}</div>
            <p class="review-card__quote">${esc(item.quote || '')}</p>
            <div class="review-card__meta">
              <strong>${esc(item.name || '')}</strong>
              <span>${esc(item.meta || '')}</span>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderStoryPage(story) {
    fillPageTop('page-story', story);
    const panel = document.getElementById('page-story');
    if (!panel || !story) return;
    const visual = panel.querySelector('.story-visual');
    const heading = panel.querySelector('.story-inner h2');
    const tags = panel.querySelector('.story-tags');
    setText(visual, story.visual || '🧺');
    setText(heading, story.heading);
    let bodyHost = panel.querySelector('[data-cms="story-body"]');
    if (!bodyHost) {
      const wrap = panel.querySelector('.story-inner > div:last-child') || panel.querySelector('.story-inner div');
      if (wrap) {
        // Keep h2 + tags; replace middle paragraphs
        const nodes = Array.from(wrap.children);
        nodes.forEach((n) => {
          if (n.matches('h2') || n.classList.contains('story-tags')) return;
          n.remove();
        });
        bodyHost = document.createElement('div');
        bodyHost.setAttribute('data-cms', 'story-body');
        const h2 = wrap.querySelector('h2');
        if (h2 && h2.nextSibling) wrap.insertBefore(bodyHost, h2.nextSibling);
        else if (h2) h2.after(bodyHost);
        else wrap.prepend(bodyHost);
      }
    }
    if (bodyHost) setHtml(bodyHost, story.bodyHtml || '');
    if (tags) {
      const list = Array.isArray(story.tags) ? story.tags : [];
      tags.innerHTML = list.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
    }
  }

  function renderMediaPage(media) {
    fillPageTop('page-media', media);
    const newsSec = document.getElementById('news');
    if (newsSec && media) {
      const header = newsSec.querySelector('.section-header');
      if (header) {
        setText(header.querySelector('h2'), media.newsTitle);
        setText(header.querySelector('p'), media.newsLead);
      }
      let list = newsSec.querySelector('[data-cms="news-list"]');
      if (!list) {
        newsSec.querySelectorAll('article.news-card').forEach((a) => a.remove());
        list = document.createElement('div');
        list.setAttribute('data-cms', 'news-list');
        newsSec.appendChild(list);
      }
      const news = Array.isArray(media.news) ? media.news : [];
      list.innerHTML = news.map((n) => `
        <article class="news-card">
          <div class="news-source">${esc(n.source || '')}</div>
          <h3>
            <a href="${esc(n.url || '#')}" target="_blank" rel="noopener noreferrer">${esc(n.title || '')}</a>
          </h3>
          <div class="news-meta">${esc(n.meta || '')}</div>
          <p class="news-excerpt">${n.excerptHtml || ''}</p>
          <a class="btn btn-outline btn-sm" href="${esc(n.url || '#')}" target="_blank" rel="noopener noreferrer">
            ${esc(n.cta || 'อ่านข่าวเต็ม →')}
          </a>
        </article>`).join('');
    }

    const videoSec = document.getElementById('video');
    if (videoSec && media) {
      const header = videoSec.querySelector('.section-header');
      if (header) {
        setText(header.querySelector('h2'), media.videoTitle);
        setText(header.querySelector('p'), media.videoLead);
      }
      let stack = videoSec.querySelector('.video-stack');
      if (!stack) {
        stack = document.createElement('div');
        stack.className = 'video-stack';
        videoSec.appendChild(stack);
      }
      const videos = Array.isArray(media.videos) ? media.videos : [];
      stack.innerHTML = videos.map((v) => {
        const yt = esc(v.ytId || '');
        const title = esc(v.title || '');
        return `
      <div class="video-card">
        <div class="video-frame" data-yt="${yt}" data-title="${esc(v.posterLabel || v.title || '')}" role="button" tabindex="0" aria-label="เล่นวิดีโอ ${title}">
          <div class="video-poster">
            <div class="play-btn">▶</div>
            <div class="poster-label">${esc(v.posterLabel || '')}</div>
            <div class="poster-hint">กดเพื่อเล่นวิดีโอ</div>
          </div>
        </div>
        <div class="video-body">
          <div class="video-badge">${esc(v.badge || '')}</div>
          <h3>${title}</h3>
          <p>${v.bodyHtml || ''}</p>
          ${v.meta ? `<p style="font-size:0.82rem;margin-bottom:0.85rem;opacity:0.9;">${esc(v.meta)}</p>` : ''}
          <div class="video-actions">
            <button type="button" class="btn btn-primary btn-sm yt-open-btn" data-yt="${yt}" data-title="${esc(v.posterLabel || v.title || '')}">${esc(v.playLabel || '▶ เล่นวิดีโอ')}</button>
            <a class="btn btn-outline btn-sm" href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener noreferrer">เปิดใน YouTube</a>
          </div>
        </div>
      </div>`;
      }).join('');
      if (typeof window.bindMediaVideos === 'function') window.bindMediaVideos();
    }
  }

  function renderProcessPage(process) {
    fillPageTop('page-process', process);
    const sec = document.getElementById('process');
    if (!sec || !process) return;
    const header = sec.querySelector('.section-header');
    if (header) {
      setText(header.querySelector('h2'), process.sectionTitle);
      setText(header.querySelector('p'), process.sectionLead);
    }
    const list = sec.querySelector('.process-list');
    if (!list) return;
    const steps = Array.isArray(process.steps) ? process.steps : [];
    list.innerHTML = steps.map((step, i) => `
      <div class="process-item">
        <div class="process-num">${i + 1}</div>
        <div>
          <h3>${esc(step.title || '')}</h3>
          ${step.bodyHtml || ''}
        </div>
      </div>`).join('');
  }

  function renderCarePage(care) {
    fillPageTop('page-care', care);
    const sec = document.getElementById('care');
    if (!sec || !care) return;
    const header = sec.querySelector('.section-header');
    if (header) {
      setText(header.querySelector('h2'), care.sectionTitle);
      setText(header.querySelector('p'), care.sectionLead);
    }
    const grid = sec.querySelector('.care-grid');
    if (grid) {
      const cards = Array.isArray(care.cards) ? care.cards : [];
      const variantClass = {
        do: 'care-do',
        dont: 'care-dont',
        tip: 'care-tip',
        form: 'care-form',
      };
      grid.innerHTML = cards.map((card) => {
        const cls = variantClass[card.variant] || 'care-tip';
        const items = Array.isArray(card.items) ? card.items : [];
        return `<div class="care-card ${cls}">
        <div class="icon">${esc(card.icon || '')}</div>
        <h3>${esc(card.title || '')}</h3>
        <ul>${items.map((li) => `<li>${li}</li>`).join('')}</ul>
      </div>`;
      }).join('');
    }
    const note = sec.querySelector('.care-note');
    if (note) setHtml(note, care.noteHtml || '');
  }

  function renderContactBlock(contact) {
    const section = document.getElementById('contact');
    if (!section || !contact) return;
    const h2 = section.querySelector(':scope > h2');
    const lead = section.querySelector(':scope > p');
    setText(h2, contact.title);
    setText(lead, contact.lead);
    const mapCard = document.getElementById('shopMapCard');
    if (mapCard) {
      const h3 = mapCard.querySelector('h3');
      setText(h3, contact.addressTitle || 'ที่อยู่ร้าน');
    }
    section.querySelectorAll('.contact-card:not(.contact-card--map)').forEach((card) => {
      const h = card.querySelector('h3');
      if (!h) return;
      if (h.textContent.includes('โทร') || h.dataset.cms === 'phone') {
        h.dataset.cms = 'phone';
        setText(h, contact.phoneTitle || 'โทรศัพท์');
      } else if (h.textContent.includes('Line') || h.textContent.includes('Facebook') || h.dataset.cms === 'social') {
        h.dataset.cms = 'social';
        setText(h, contact.socialTitle || 'Line / Facebook');
        const p = card.querySelector('p');
        setText(p, contact.socialText || '');
      }
    });
    const photosTitle = section.querySelector('.shop-front-photos__title');
    setText(photosTitle, contact.photosTitle || 'ภาพหน้าร้าน');
  }

  function renderFooterBlock(footer) {
    const foot = document.querySelector('footer');
    if (!foot || !footer) return;
    const ps = foot.querySelectorAll('p');
    if (ps[0]) setHtml(ps[0], footer.line1Html || '');
    if (ps[1]) setText(ps[1], footer.line2 || '');
  }

  function applyStoreContent() {
    const content = ensureContent();
    if (!content) return;

    const heroInner = document.querySelector('#heroStage .hero-copy__inner');
    if (heroInner && content.hero) {
      setText(heroInner.querySelector('h1'), content.hero.title);
      setText(heroInner.querySelector('.hero-desc'), content.hero.desc);
      const cta = heroInner.querySelector('.hero-cta .btn');
      setText(cta, content.hero.cta);
    }

    const trust = document.querySelector('.shop-trust');
    if (trust && Array.isArray(content.trust)) {
      trust.innerHTML = content.trust.map((t) => `<span>${esc(t)}</span>`).join('');
    }

    if (content.home) {
      setText(document.getElementById('popularCatsTitle'), content.home.popularTitle);
      const popMore = document.querySelector('#popularCats .shop-block__more');
      setText(popMore, content.home.popularMore);
      const prodHead = document.querySelector('#products > .shop-block__head h2');
      setText(prodHead, content.home.productsTitle);
      setText(document.getElementById('viewAllProducts'), content.home.productsMore);
      setText(document.querySelector('.shop-videos-block__title'), content.home.videosTitle);
      setText(document.querySelector('.shop-videos-block__hint'), content.home.videosHint);
    }

    renderReviewsBlock(content.reviews);
    renderStoryPage(content.story);
    renderMediaPage(content.media);
    renderProcessPage(content.process);
    renderCarePage(content.care);
    renderContactBlock(content.contact);
    renderFooterBlock(content.footer);
  }

  window.applyStoreContent = applyStoreContent;
  window.ensureStoreContent = ensureContent;

  /* ========== Admin UI ========== */

  function field(label, id, value, multiline, rows) {
    if (multiline) {
      return `<label style="font-size:0.82rem;font-weight:600;display:block;">${label}
        <textarea class="admin-input" id="${id}" rows="${rows || 3}" style="width:100%;margin-top:0.25rem;">${esc(value || '')}</textarea></label>`;
    }
    return `<label style="font-size:0.82rem;font-weight:600;display:block;">${label}
      <input class="admin-input" id="${id}" value="${esc(value || '')}" style="width:100%;margin-top:0.25rem;"></label>`;
  }

  function details(title, inner) {
    return `<details class="cms-section" open style="border:1px solid rgba(196,164,132,0.35);border-radius:10px;padding:0.75rem 0.9rem;margin-bottom:0.75rem;background:rgba(255,255,255,0.35);">
      <summary style="cursor:pointer;font-weight:700;font-size:0.95rem;margin-bottom:0.5rem;">${title}</summary>
      <div style="display:grid;gap:0.65rem;">${inner}</div>
    </details>`;
  }

  async function readImageFile(file, maxW) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    if (typeof compressImage === 'function') {
      return compressImage(dataUrl, maxW || 1200, 0.78);
    }
    return dataUrl;
  }

  function paintCmsPhotoList(listId, draftKey) {
    const list = document.getElementById(listId);
    if (!list) return;
    const items = window[draftKey] || [];
    if (!items.length) {
      list.innerHTML = '<p style="font-size:0.82rem;color:var(--text-soft);margin:0;">ยังไม่มีรายการ</p>';
      return;
    }
    list.innerHTML = items.map((item, i) => {
      const src = typeof item === 'string' ? item : (item.src || item.img || '');
      const caption = typeof item === 'object' ? (item.caption || item.alt || item.name || '') : '';
      return `<div class="hero-admin-item" data-index="${i}">
        <img src="${esc(src)}" alt="" />
        <div class="hero-admin-item__actions">
          <span style="font-size:0.75rem;opacity:0.85;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(caption)}</span>
          <button type="button" class="btn btn-outline btn-sm" data-up ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-outline btn-sm" data-down ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-outline btn-sm" data-del>ลบ</button>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.hero-admin-item').forEach((row) => {
      const idx = Number(row.dataset.index);
      row.querySelector('[data-up]')?.addEventListener('click', () => {
        if (idx <= 0) return;
        const arr = window[draftKey];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        paintCmsPhotoList(listId, draftKey);
      });
      row.querySelector('[data-down]')?.addEventListener('click', () => {
        const arr = window[draftKey];
        if (idx >= arr.length - 1) return;
        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        paintCmsPhotoList(listId, draftKey);
      });
      row.querySelector('[data-del]')?.addEventListener('click', () => {
        window[draftKey].splice(idx, 1);
        paintCmsPhotoList(listId, draftKey);
      });
    });
  }

  function renderReviewEditors(items) {
    return items.map((item, i) => `
      <div class="cms-item" data-review="${i}" style="border:1px dashed rgba(196,164,132,0.5);border-radius:8px;padding:0.65rem;display:grid;gap:0.4rem;">
        <strong style="font-size:0.85rem;">รีวิว #${i + 1}</strong>
        ${field('คำพูด', `revQuote_${i}`, item.quote, true, 2)}
        ${field('ชื่อ', `revName_${i}`, item.name)}
        ${field('เมตา (เมือง · สินค้า)', `revMeta_${i}`, item.meta)}
        ${field('ป้ายบนรูป', `revBadge_${i}`, item.badge)}
        ${field('ดาว (1–5)', `revStars_${i}`, String(item.stars || 5))}
        ${field('คำอธิบายรูป (alt)', `revAlt_${i}`, item.alt)}
        ${field('URL รูป', `revImg_${i}`, item.img)}
        <label class="btn btn-outline btn-sm" style="justify-content:center;cursor:pointer;">อัปโหลดรูป
          <input type="file" accept="image/*" hidden data-rev-upload="${i}" /></label>
        <button type="button" class="btn btn-outline btn-sm" data-rev-del="${i}">ลบรีวิวนี้</button>
      </div>`).join('');
  }

  function collectReviewsFromDom(count) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const quoteEl = document.getElementById(`revQuote_${i}`);
      if (!quoteEl) continue;
      items.push({
        quote: quoteEl.value.trim(),
        name: document.getElementById(`revName_${i}`)?.value.trim() || '',
        meta: document.getElementById(`revMeta_${i}`)?.value.trim() || '',
        badge: document.getElementById(`revBadge_${i}`)?.value.trim() || 'ภาพใช้งานจริง',
        stars: Number(document.getElementById(`revStars_${i}`)?.value) || 5,
        alt: document.getElementById(`revAlt_${i}`)?.value.trim() || '',
        img: document.getElementById(`revImg_${i}`)?.value.trim() || '',
      });
    }
    return items;
  }

  function renderAdminFrontContent() {
    const el = document.getElementById('adminContent');
    if (!el) return;
    const c = ensureContent();
    const photos = Array.isArray(SHOP_CONFIG.storefrontPhotos)
      ? SHOP_CONFIG.storefrontPhotos.map((p) => ({ ...p }))
      : [];
    window._cmsStorefrontDraft = photos;
    window._cmsReviewDraft = (c.reviews.items || []).map((x) => ({ ...x }));
    window._cmsNewsDraft = (c.media.news || []).map((x) => ({ ...x }));
    window._cmsMediaVideoDraft = (c.media.videos || []).map((x) => ({ ...x }));
    window._cmsProcessDraft = (c.process.steps || []).map((x) => ({ ...x }));
    window._cmsCareDraft = (c.care.cards || []).map((x) => ({ ...x, items: [...(x.items || [])] }));

    el.innerHTML = `
      <div class="admin-section-title">แก้ไขหน้าบ้าน (ข้อความ · รูป · วิดีโอ)</div>
      <p style="font-size:0.85rem;color:var(--text-soft);margin-bottom:1rem;line-height:1.55;">
        แก้ทุกจุดบนหน้าร้านได้ที่นี่ — บันทึกแล้วเห็นทันทีบนเครื่องนี้
        สินค้าและวิดีโอแนะนำสินค้าใช้แท็บ <strong>สินค้า</strong> / <strong>ราชาหวาย VIDEO</strong>
        ภาพพื้นหลังฮีโร่ใช้แท็บ <strong>ตั้งค่า</strong>
      </p>

      ${details('1) ฮีโร่หน้าแรก', `
        ${field('หัวข้อหลัก', 'cmsHeroTitle', c.hero.title)}
        ${field('คำอธิบาย', 'cmsHeroDesc', c.hero.desc, true, 2)}
        ${field('ปุ่ม CTA', 'cmsHeroCta', c.hero.cta)}
      `)}

      ${details('2) แถบความเชื่อมั่น', `
        ${field('ข้อความ (หนึ่งบรรทัดต่อหนึ่งข้อ)', 'cmsTrust', (c.trust || []).join('\n'), true, 3)}
      `)}

      ${details('3) หัวข้อหน้าแรก', `
        ${field('หมวดยอดนิยม', 'cmsPopularTitle', c.home.popularTitle)}
        ${field('ลิงก์ดูทั้งหมด (หมวด)', 'cmsPopularMore', c.home.popularMore)}
        ${field('สินค้าแนะนำ', 'cmsProductsTitle', c.home.productsTitle)}
        ${field('ปุ่มดูทั้งหมด (สินค้า)', 'cmsProductsMore', c.home.productsMore)}
        ${field('หัวข้อวิดีโอแนะนำ', 'cmsVideosTitle', c.home.videosTitle)}
        ${field('คำใบ้เลื่อนดู', 'cmsVideosHint', c.home.videosHint)}
      `)}

      ${details('4) รีวิวลูกค้า', `
        ${field('คิคเกอร์', 'cmsRevKicker', c.reviews.kicker)}
        ${field('หัวข้อ', 'cmsRevTitle', c.reviews.title)}
        ${field('คะแนนแสดง', 'cmsRevScore', c.reviews.score)}
        ${field('aria คะแนน', 'cmsRevScoreLabel', c.reviews.scoreLabel)}
        ${field('คำนำ', 'cmsRevLead', c.reviews.lead, true, 2)}
        <div id="cmsReviewList">${renderReviewEditors(window._cmsReviewDraft)}</div>
        <button type="button" class="btn btn-outline btn-sm" id="cmsAddReview">➕ เพิ่มรีวิว</button>
      `)}

      ${details('5) เรื่องราวบ้านบุทม', `
        ${field('คิคเกอร์', 'cmsStoryKicker', c.story.kicker)}
        ${field('หัวข้อหน้า', 'cmsStoryTitle', c.story.title)}
        ${field('คำนำ', 'cmsStoryLead', c.story.lead, true, 2)}
        ${field('ไอคอน/อีโมจิ', 'cmsStoryVisual', c.story.visual)}
        ${field('หัวข้อในเนื้อหา', 'cmsStoryHeading', c.story.heading)}
        ${field('เนื้อหา (รองรับ HTML)', 'cmsStoryBody', c.story.bodyHtml, true, 12)}
        ${field('แท็ก (คั่นด้วย | )', 'cmsStoryTags', (c.story.tags || []).join(' | '))}
      `)}

      ${details('6) ข่าวอ้างอิง', `
        ${field('คิคเกอร์หน้า', 'cmsMediaKicker', c.media.kicker)}
        ${field('หัวข้อหน้า', 'cmsMediaTitle', c.media.title)}
        ${field('คำนำหน้า', 'cmsMediaLead', c.media.lead, true, 2)}
        ${field('หัวข้อข่าว', 'cmsNewsTitle', c.media.newsTitle)}
        ${field('คำนำข่าว', 'cmsNewsLead', c.media.newsLead)}
        <div id="cmsNewsList"></div>
        <button type="button" class="btn btn-outline btn-sm" id="cmsAddNews">➕ เพิ่มข่าว</button>
      `)}

      ${details('7) วิดีโออ้างอิง (YouTube)', `
        ${field('หัวข้อวิดีโอ', 'cmsVidSecTitle', c.media.videoTitle)}
        ${field('คำนำวิดีโอ', 'cmsVidSecLead', c.media.videoLead)}
        <div id="cmsMediaVideoList"></div>
        <button type="button" class="btn btn-outline btn-sm" id="cmsAddMediaVideo">➕ เพิ่มวิดีโอ YouTube</button>
      `)}

      ${details('8) ขั้นตอนการผลิต', `
        ${field('คิคเกอร์', 'cmsProcKicker', c.process.kicker)}
        ${field('หัวข้อหน้า', 'cmsProcTitle', c.process.title)}
        ${field('คำนำ', 'cmsProcLead', c.process.lead, true, 2)}
        ${field('หัวข้อส่วน', 'cmsProcSecTitle', c.process.sectionTitle)}
        ${field('คำนำส่วน', 'cmsProcSecLead', c.process.sectionLead)}
        <div id="cmsProcessList"></div>
        <button type="button" class="btn btn-outline btn-sm" id="cmsAddProcess">➕ เพิ่มขั้นตอน</button>
      `)}

      ${details('9) การดูแลรักษา', `
        ${field('คิคเกอร์', 'cmsCareKicker', c.care.kicker)}
        ${field('หัวข้อหน้า', 'cmsCareTitle', c.care.title)}
        ${field('คำนำ', 'cmsCareLead', c.care.lead, true, 2)}
        ${field('หัวข้อส่วน', 'cmsCareSecTitle', c.care.sectionTitle)}
        ${field('คำนำส่วน', 'cmsCareSecLead', c.care.sectionLead)}
        <div id="cmsCareList"></div>
        <button type="button" class="btn btn-outline btn-sm" id="cmsAddCare">➕ เพิ่มการ์ดดูแล</button>
        ${field('หมายเหตุท้าย (HTML ได้)', 'cmsCareNote', c.care.noteHtml, true, 4)}
      `)}

      ${details('10) ติดต่อ + ภาพหน้าร้าน', `
        ${field('หัวข้อ', 'cmsContactTitle', c.contact.title)}
        ${field('คำนำ', 'cmsContactLead', c.contact.lead, true, 2)}
        ${field('หัวข้อการ์ดที่อยู่', 'cmsContactAddrTitle', c.contact.addressTitle)}
        ${field('หัวข้อการ์ดโทร', 'cmsContactPhoneTitle', c.contact.phoneTitle)}
        ${field('หัวข้อ Line/FB', 'cmsContactSocialTitle', c.contact.socialTitle)}
        ${field('ข้อความ Line/FB', 'cmsContactSocialText', c.contact.socialText)}
        ${field('หัวข้อภาพหน้าร้าน', 'cmsPhotosTitle', c.contact.photosTitle)}
        <div id="cmsStorefrontList" class="hero-admin-list"></div>
        <div style="display:grid;gap:0.4rem;max-width:520px;">
          ${field('URL รูปใหม่', 'cmsSfSrc', '')}
          ${field('คำอธิบายรูป (alt)', 'cmsSfAlt', '')}
          ${field('คำบรรยายใต้รูป', 'cmsSfCaption', '')}
          <label class="btn btn-outline btn-sm" style="justify-content:center;cursor:pointer;">อัปโหลดรูปหน้าร้าน
            <input type="file" id="cmsSfUpload" accept="image/*" hidden /></label>
          <button type="button" class="btn btn-outline btn-sm" id="cmsSfAdd">➕ เพิ่มภาพหน้าร้าน</button>
        </div>
      `)}

      ${details('11) ส่วนท้ายเว็บ', `
        ${field('บรรทัด 1 (HTML ได้)', 'cmsFooter1', c.footer.line1Html, true, 2)}
        ${field('บรรทัด 2', 'cmsFooter2', c.footer.line2)}
      `)}

      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem;">
        <button type="button" class="btn btn-primary" id="cmsSaveContent" style="justify-content:center;">💾 บันทึกเนื้อหาหน้าบ้าน</button>
        <button type="button" class="btn btn-outline" id="cmsResetContent" style="justify-content:center;">รีเซ็ตเป็นค่าเริ่มต้น</button>
        <button type="button" class="btn btn-outline btn-sm" id="cmsExportContent">⬇️ ส่งออก JSON</button>
      </div>
    `;

    function paintNews() {
      const host = document.getElementById('cmsNewsList');
      if (!host) return;
      host.innerHTML = window._cmsNewsDraft.map((n, i) => `
        <div style="border:1px dashed rgba(196,164,132,0.5);border-radius:8px;padding:0.65rem;display:grid;gap:0.4rem;">
          <strong style="font-size:0.85rem;">ข่าว #${i + 1}</strong>
          ${field('แหล่งข่าว', `newsSource_${i}`, n.source)}
          ${field('หัวข้อ', `newsTitle_${i}`, n.title)}
          ${field('URL', `newsUrl_${i}`, n.url)}
          ${field('เมตา', `newsMeta_${i}`, n.meta)}
          ${field('บทคัดย่อ (HTML ได้)', `newsExcerpt_${i}`, n.excerptHtml, true, 4)}
          ${field('ปุ่ม CTA', `newsCta_${i}`, n.cta || 'อ่านข่าวเต็ม →')}
          <button type="button" class="btn btn-outline btn-sm" data-news-del="${i}">ลบ</button>
        </div>`).join('');
      host.querySelectorAll('[data-news-del]').forEach((btn) => {
        btn.onclick = () => {
          syncNewsFromDom();
          window._cmsNewsDraft.splice(Number(btn.dataset.newsDel), 1);
          paintNews();
        };
      });
    }

    function syncNewsFromDom() {
      window._cmsNewsDraft = window._cmsNewsDraft.map((_, i) => ({
        source: document.getElementById(`newsSource_${i}`)?.value.trim() || '',
        title: document.getElementById(`newsTitle_${i}`)?.value.trim() || '',
        url: document.getElementById(`newsUrl_${i}`)?.value.trim() || '',
        meta: document.getElementById(`newsMeta_${i}`)?.value.trim() || '',
        excerptHtml: document.getElementById(`newsExcerpt_${i}`)?.value || '',
        cta: document.getElementById(`newsCta_${i}`)?.value.trim() || 'อ่านข่าวเต็ม →',
      })).filter((_, i) => document.getElementById(`newsSource_${i}`) || document.getElementById(`newsTitle_${i}`));
      // Remap by actual inputs present
      const next = [];
      for (let i = 0; i < 50; i++) {
        const titleEl = document.getElementById(`newsTitle_${i}`);
        if (!titleEl) break;
        next.push({
          source: document.getElementById(`newsSource_${i}`)?.value.trim() || '',
          title: titleEl.value.trim(),
          url: document.getElementById(`newsUrl_${i}`)?.value.trim() || '',
          meta: document.getElementById(`newsMeta_${i}`)?.value.trim() || '',
          excerptHtml: document.getElementById(`newsExcerpt_${i}`)?.value || '',
          cta: document.getElementById(`newsCta_${i}`)?.value.trim() || 'อ่านข่าวเต็ม →',
        });
      }
      window._cmsNewsDraft = next;
    }

    function paintMediaVideos() {
      const host = document.getElementById('cmsMediaVideoList');
      if (!host) return;
      host.innerHTML = window._cmsMediaVideoDraft.map((v, i) => `
        <div style="border:1px dashed rgba(196,164,132,0.5);border-radius:8px;padding:0.65rem;display:grid;gap:0.4rem;">
          <strong style="font-size:0.85rem;">วิดีโอ #${i + 1}</strong>
          ${field('YouTube ID หรือลิงก์', `mvidYt_${i}`, v.ytId)}
          ${field('ป้ายโปสเตอร์', `mvidPoster_${i}`, v.posterLabel)}
          ${field('แบดจ์', `mvidBadge_${i}`, v.badge)}
          ${field('หัวข้อ', `mvidTitle_${i}`, v.title)}
          ${field('เนื้อหา (HTML ได้)', `mvidBody_${i}`, v.bodyHtml, true, 4)}
          ${field('เมตา', `mvidMeta_${i}`, v.meta)}
          ${field('ปุ่มเล่น', `mvidPlay_${i}`, v.playLabel || '▶ เล่นวิดีโอ')}
          <button type="button" class="btn btn-outline btn-sm" data-mvid-del="${i}">ลบ</button>
        </div>`).join('');
      host.querySelectorAll('[data-mvid-del]').forEach((btn) => {
        btn.onclick = () => {
          syncMediaVideosFromDom();
          window._cmsMediaVideoDraft.splice(Number(btn.dataset.mvidDel), 1);
          paintMediaVideos();
        };
      });
    }

    function syncMediaVideosFromDom() {
      const next = [];
      for (let i = 0; i < 50; i++) {
        const ytEl = document.getElementById(`mvidYt_${i}`);
        if (!ytEl) break;
        let ytId = ytEl.value.trim();
        const m = ytId.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || ytId.match(/^([\w-]{11})$/);
        if (m) ytId = m[1];
        next.push({
          ytId,
          posterLabel: document.getElementById(`mvidPoster_${i}`)?.value.trim() || '',
          badge: document.getElementById(`mvidBadge_${i}`)?.value.trim() || '',
          title: document.getElementById(`mvidTitle_${i}`)?.value.trim() || '',
          bodyHtml: document.getElementById(`mvidBody_${i}`)?.value || '',
          meta: document.getElementById(`mvidMeta_${i}`)?.value.trim() || '',
          playLabel: document.getElementById(`mvidPlay_${i}`)?.value.trim() || '▶ เล่นวิดีโอ',
        });
      }
      window._cmsMediaVideoDraft = next;
    }

    function paintProcess() {
      const host = document.getElementById('cmsProcessList');
      if (!host) return;
      host.innerHTML = window._cmsProcessDraft.map((s, i) => `
        <div style="border:1px dashed rgba(196,164,132,0.5);border-radius:8px;padding:0.65rem;display:grid;gap:0.4rem;">
          <strong style="font-size:0.85rem;">ขั้นตอน ${i + 1}</strong>
          ${field('ชื่อขั้นตอน', `procTitle_${i}`, s.title)}
          ${field('รายละเอียด (HTML ได้)', `procBody_${i}`, s.bodyHtml, true, 6)}
          <button type="button" class="btn btn-outline btn-sm" data-proc-del="${i}">ลบ</button>
        </div>`).join('');
      host.querySelectorAll('[data-proc-del]').forEach((btn) => {
        btn.onclick = () => {
          syncProcessFromDom();
          window._cmsProcessDraft.splice(Number(btn.dataset.procDel), 1);
          paintProcess();
        };
      });
    }

    function syncProcessFromDom() {
      const next = [];
      for (let i = 0; i < 50; i++) {
        const t = document.getElementById(`procTitle_${i}`);
        if (!t) break;
        next.push({
          title: t.value.trim(),
          bodyHtml: document.getElementById(`procBody_${i}`)?.value || '',
        });
      }
      window._cmsProcessDraft = next;
    }

    function paintCare() {
      const host = document.getElementById('cmsCareList');
      if (!host) return;
      host.innerHTML = window._cmsCareDraft.map((card, i) => `
        <div style="border:1px dashed rgba(196,164,132,0.5);border-radius:8px;padding:0.65rem;display:grid;gap:0.4rem;">
          <strong style="font-size:0.85rem;">การ์ด #${i + 1}</strong>
          ${field('ชนิด (do/dont/tip/form)', `careVar_${i}`, card.variant || 'tip')}
          ${field('ไอคอน', `careIcon_${i}`, card.icon)}
          ${field('หัวข้อ', `careTitle_${i}`, card.title)}
          ${field('รายการ (หนึ่งบรรทัดต่อข้อ, HTML ได้)', `careItems_${i}`, (card.items || []).join('\n'), true, 5)}
          <button type="button" class="btn btn-outline btn-sm" data-care-del="${i}">ลบ</button>
        </div>`).join('');
      host.querySelectorAll('[data-care-del]').forEach((btn) => {
        btn.onclick = () => {
          syncCareFromDom();
          window._cmsCareDraft.splice(Number(btn.dataset.careDel), 1);
          paintCare();
        };
      });
    }

    function syncCareFromDom() {
      const next = [];
      for (let i = 0; i < 50; i++) {
        const t = document.getElementById(`careTitle_${i}`);
        if (!t) break;
        next.push({
          variant: document.getElementById(`careVar_${i}`)?.value.trim() || 'tip',
          icon: document.getElementById(`careIcon_${i}`)?.value.trim() || '',
          title: t.value.trim(),
          items: (document.getElementById(`careItems_${i}`)?.value || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
      window._cmsCareDraft = next;
    }

    function wireReviews() {
      const host = document.getElementById('cmsReviewList');
      if (!host) return;
      host.innerHTML = renderReviewEditors(window._cmsReviewDraft);
      host.querySelectorAll('[data-rev-del]').forEach((btn) => {
        btn.onclick = () => {
          window._cmsReviewDraft = collectReviewsFromDom(window._cmsReviewDraft.length);
          window._cmsReviewDraft.splice(Number(btn.dataset.revDel), 1);
          wireReviews();
        };
      });
      host.querySelectorAll('[data-rev-upload]').forEach((input) => {
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const i = Number(input.dataset.revUpload);
          try {
            const url = await readImageFile(file, 1000);
            window._cmsReviewDraft = collectReviewsFromDom(window._cmsReviewDraft.length);
            window._cmsReviewDraft[i].img = url;
            wireReviews();
            if (typeof showToast === 'function') showToast('อัปโหลดรูปรีวิวแล้ว');
          } catch (err) {
            console.warn(err);
            if (typeof showToast === 'function') showToast('อัปโหลดไม่สำเร็จ');
          }
        };
      });
    }

    paintNews();
    paintMediaVideos();
    paintProcess();
    paintCare();
    wireReviews();
    paintCmsPhotoList('cmsStorefrontList', '_cmsStorefrontDraft');

    document.getElementById('cmsAddReview').onclick = () => {
      window._cmsReviewDraft = collectReviewsFromDom(window._cmsReviewDraft.length);
      window._cmsReviewDraft.push({
        img: '/images/promo/usage-shopping.png',
        alt: '',
        badge: 'ภาพใช้งานจริง',
        stars: 5,
        quote: '',
        name: '',
        meta: '',
      });
      wireReviews();
    };
    document.getElementById('cmsAddNews').onclick = () => {
      syncNewsFromDom();
      window._cmsNewsDraft.push({
        source: '📰 ',
        title: '',
        url: '',
        meta: '',
        excerptHtml: '',
        cta: 'อ่านข่าวเต็ม →',
      });
      paintNews();
    };
    document.getElementById('cmsAddMediaVideo').onclick = () => {
      syncMediaVideosFromDom();
      window._cmsMediaVideoDraft.push({
        ytId: '',
        posterLabel: '',
        badge: '▶',
        title: '',
        bodyHtml: '',
        meta: '',
        playLabel: '▶ เล่นวิดีโอ',
      });
      paintMediaVideos();
    };
    document.getElementById('cmsAddProcess').onclick = () => {
      syncProcessFromDom();
      window._cmsProcessDraft.push({ title: '', bodyHtml: '<p></p>' });
      paintProcess();
    };
    document.getElementById('cmsAddCare').onclick = () => {
      syncCareFromDom();
      window._cmsCareDraft.push({
        variant: 'tip',
        icon: '💡',
        title: '',
        items: [''],
      });
      paintCare();
    };

    document.getElementById('cmsSfAdd').onclick = () => {
      const src = document.getElementById('cmsSfSrc').value.trim();
      if (!src) {
        if (typeof showToast === 'function') showToast('ใส่ URL รูป หรืออัปโหลดก่อน');
        return;
      }
      window._cmsStorefrontDraft.push({
        src,
        alt: document.getElementById('cmsSfAlt').value.trim() || 'ภาพหน้าร้าน',
        caption: document.getElementById('cmsSfCaption').value.trim() || '',
      });
      document.getElementById('cmsSfSrc').value = '';
      document.getElementById('cmsSfAlt').value = '';
      document.getElementById('cmsSfCaption').value = '';
      paintCmsPhotoList('cmsStorefrontList', '_cmsStorefrontDraft');
    };
    document.getElementById('cmsSfUpload').onchange = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const url = await readImageFile(file, 1400);
        document.getElementById('cmsSfSrc').value = url;
        if (typeof showToast === 'function') showToast('อัปโหลดแล้ว — กดเพิ่มภาพหน้าร้าน');
      } catch (err) {
        console.warn(err);
        if (typeof showToast === 'function') showToast('อัปโหลดไม่สำเร็จ');
      }
    };

    document.getElementById('cmsSaveContent').onclick = () => {
      syncNewsFromDom();
      syncMediaVideosFromDom();
      syncProcessFromDom();
      syncCareFromDom();
      const trustRaw = document.getElementById('cmsTrust').value || '';
      const content = {
        hero: {
          title: document.getElementById('cmsHeroTitle').value.trim(),
          desc: document.getElementById('cmsHeroDesc').value.trim(),
          cta: document.getElementById('cmsHeroCta').value.trim(),
        },
        trust: trustRaw.split('\n').map((s) => s.trim()).filter(Boolean),
        home: {
          popularTitle: document.getElementById('cmsPopularTitle').value.trim(),
          popularMore: document.getElementById('cmsPopularMore').value.trim(),
          productsTitle: document.getElementById('cmsProductsTitle').value.trim(),
          productsMore: document.getElementById('cmsProductsMore').value.trim(),
          videosTitle: document.getElementById('cmsVideosTitle').value.trim(),
          videosHint: document.getElementById('cmsVideosHint').value.trim(),
        },
        reviews: {
          kicker: document.getElementById('cmsRevKicker').value.trim(),
          title: document.getElementById('cmsRevTitle').value.trim(),
          score: document.getElementById('cmsRevScore').value.trim(),
          scoreLabel: document.getElementById('cmsRevScoreLabel').value.trim(),
          lead: document.getElementById('cmsRevLead').value.trim(),
          items: collectReviewsFromDom(window._cmsReviewDraft.length),
        },
        story: {
          kicker: document.getElementById('cmsStoryKicker').value.trim(),
          title: document.getElementById('cmsStoryTitle').value.trim(),
          lead: document.getElementById('cmsStoryLead').value.trim(),
          visual: document.getElementById('cmsStoryVisual').value.trim(),
          heading: document.getElementById('cmsStoryHeading').value.trim(),
          bodyHtml: document.getElementById('cmsStoryBody').value,
          tags: document.getElementById('cmsStoryTags').value.split('|').map((s) => s.trim()).filter(Boolean),
        },
        media: {
          kicker: document.getElementById('cmsMediaKicker').value.trim(),
          title: document.getElementById('cmsMediaTitle').value.trim(),
          lead: document.getElementById('cmsMediaLead').value.trim(),
          newsTitle: document.getElementById('cmsNewsTitle').value.trim(),
          newsLead: document.getElementById('cmsNewsLead').value.trim(),
          news: window._cmsNewsDraft.slice(),
          videoTitle: document.getElementById('cmsVidSecTitle').value.trim(),
          videoLead: document.getElementById('cmsVidSecLead').value.trim(),
          videos: window._cmsMediaVideoDraft.slice(),
        },
        process: {
          kicker: document.getElementById('cmsProcKicker').value.trim(),
          title: document.getElementById('cmsProcTitle').value.trim(),
          lead: document.getElementById('cmsProcLead').value.trim(),
          sectionTitle: document.getElementById('cmsProcSecTitle').value.trim(),
          sectionLead: document.getElementById('cmsProcSecLead').value.trim(),
          steps: window._cmsProcessDraft.slice(),
        },
        care: {
          kicker: document.getElementById('cmsCareKicker').value.trim(),
          title: document.getElementById('cmsCareTitle').value.trim(),
          lead: document.getElementById('cmsCareLead').value.trim(),
          sectionTitle: document.getElementById('cmsCareSecTitle').value.trim(),
          sectionLead: document.getElementById('cmsCareSecLead').value.trim(),
          cards: window._cmsCareDraft.slice(),
          noteHtml: document.getElementById('cmsCareNote').value,
        },
        contact: {
          title: document.getElementById('cmsContactTitle').value.trim(),
          lead: document.getElementById('cmsContactLead').value.trim(),
          addressTitle: document.getElementById('cmsContactAddrTitle').value.trim(),
          phoneTitle: document.getElementById('cmsContactPhoneTitle').value.trim(),
          socialTitle: document.getElementById('cmsContactSocialTitle').value.trim(),
          socialText: document.getElementById('cmsContactSocialText').value.trim(),
          photosTitle: document.getElementById('cmsPhotosTitle').value.trim(),
        },
        footer: {
          line1Html: document.getElementById('cmsFooter1').value,
          line2: document.getElementById('cmsFooter2').value.trim(),
        },
      };

      if (typeof saveShopSettings === 'function') {
        saveShopSettings({
          content,
          storefrontPhotos: (window._cmsStorefrontDraft || []).slice(),
        });
      } else {
        SHOP_CONFIG.content = content;
        SHOP_CONFIG.storefrontPhotos = (window._cmsStorefrontDraft || []).slice();
        applyStoreContent();
      }
      if (typeof applyStoreContent === 'function') applyStoreContent();
      if (typeof renderStorefrontPhotos === 'function') {
        renderStorefrontPhotos(SHOP_CONFIG.storefrontPhotos);
      }
    };

    document.getElementById('cmsResetContent').onclick = () => {
      if (!confirm('รีเซ็ตเนื้อหาหน้าบ้านทั้งหมดเป็นค่าเริ่มต้น?')) return;
      const fresh = typeof cloneStoreContent === 'function'
        ? cloneStoreContent(DEFAULT_STORE_CONTENT)
        : JSON.parse(JSON.stringify(DEFAULT_STORE_CONTENT));
      const defaultPhotos = [
        {
          src: '/images/shop/shop-front-day.jpeg',
          alt: 'หน้าร้านราชาหวาย — ตะกร้าหวายสานมือที่หน้าร้าน',
          caption: 'หน้าร้านช่วงกลางวัน',
        },
      ];
      if (typeof saveShopSettings === 'function') {
        saveShopSettings({ content: fresh, storefrontPhotos: defaultPhotos });
      }
      renderAdminFrontContent();
    };

    document.getElementById('cmsExportContent').onclick = () => {
      syncNewsFromDom();
      syncMediaVideosFromDom();
      syncProcessFromDom();
      syncCareFromDom();
      const payload = {
        content: SHOP_CONFIG.content,
        storefrontPhotos: window._cmsStorefrontDraft,
      };
      // Prefer current form values by triggering a dry collect via save path fields
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rachawei-store-content.json';
      a.click();
      URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('ดาวน์โหลดเนื้อหาแล้ว');
    };
  }

  window.renderAdminFrontContent = renderAdminFrontContent;
})();
