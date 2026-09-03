/**
 * PromptPay EMVCo QR payload + render helpers for the store checkout.
 * No npm dependency — works with global QRCode (cdn) or api.qrserver.com fallback.
 */
(function (global) {
  function crc16ccitt(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function tlv(id, value) {
    const v = String(value);
    return id + String(v.length).padStart(2, '0') + v;
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  /** Convert Thai mobile 0xxxxxxxxx → 0066xxxxxxxxx */
  function toPromptPayTarget(id) {
    let d = digitsOnly(id);
    if (!d) return '';
    if (d.length === 13) return d; // national ID / tax ID
    if (d.startsWith('66') && d.length >= 11) return '00' + d;
    if (d.startsWith('0') && d.length === 10) return '0066' + d.slice(1);
    if (d.length === 9) return '0066' + d;
    return d;
  }

  function formatAmount(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n.toFixed(2);
  }

  function generatePromptPayPayload(promptPayId, amount) {
    const target = toPromptPayTarget(promptPayId);
    if (!target) throw new Error('ไม่พบหมายเลขพร้อมเพย์');

    const isPhone = target.startsWith('0066');
    const aid = isPhone ? 'A000000677010111' : 'A000000677010112';
    const merchantInfo = tlv('00', aid) + tlv(isPhone ? '01' : '02', target);

    let payload = '';
    payload += tlv('00', '01');
    payload += tlv('01', formatAmount(amount) ? '12' : '11');
    payload += tlv('29', merchantInfo);
    payload += tlv('53', '764');
    const amt = formatAmount(amount);
    if (amt) payload += tlv('54', amt);
    payload += tlv('58', 'TH');
    payload += '6304';
    payload += crc16ccitt(payload);
    return payload;
  }

  function qrImageUrl(payload, size) {
    const s = size || 280;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&margin=8&data=${encodeURIComponent(payload)}`;
  }

  async function renderPromptPayDataUrl(promptPayId, amount, size) {
    const payload = generatePromptPayPayload(promptPayId, amount);
    const dim = size || 280;

    // node-style qrcode browser build
    if (global.QRCode && typeof global.QRCode.toDataURL === 'function') {
      const dataUrl = await global.QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: dim,
      });
      return { payload, dataUrl };
    }

    // qrcodejs DOM API → canvas → data URL
    if (global.QRCode && typeof global.QRCode === 'function') {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(host);
      try {
        // eslint-disable-next-line no-new
        new global.QRCode(host, {
          text: payload,
          width: dim,
          height: dim,
          correctLevel: global.QRCode.CorrectLevel ? global.QRCode.CorrectLevel.M : 1,
        });
        const canvas = host.querySelector('canvas');
        const img = host.querySelector('img');
        const dataUrl = canvas
          ? canvas.toDataURL('image/png')
          : (img && img.src) || '';
        if (dataUrl) return { payload, dataUrl };
      } finally {
        host.remove();
      }
    }

    return { payload, dataUrl: qrImageUrl(payload, dim) };
  }

  global.RachaweiPromptPay = {
    digitsOnly,
    toPromptPayTarget,
    generatePromptPayPayload,
    renderPromptPayDataUrl,
  };
})(typeof window !== 'undefined' ? window : globalThis);
