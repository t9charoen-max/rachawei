import { QRCodeSVG } from 'qrcode.react';
import type { Product } from '../data/products';
import { buildOrderMessage, LINE_CONFIG, lineAddUrl } from '../utils/contact';

interface LineAddModalProps {
  product?: Product;
  onClose: () => void;
}

export function LineAddModal({ product, onClose }: LineAddModalProps) {
  const orderHint = product ? buildOrderMessage(product) : null;

  return (
    <div className="line-modal" role="dialog" aria-modal="true" aria-labelledby="line-modal-title">
      <button type="button" className="line-modal__backdrop" onClick={onClose} aria-label="ปิด" />
      <div className="line-modal__panel">
        <button type="button" className="line-modal__close" onClick={onClose} aria-label="ปิด">
          ✕
        </button>

        <div className="line-modal__brand" aria-hidden>
          LINE
        </div>
        <h2 id="line-modal-title" className="line-modal__title">
          สแกนเพิ่มเพื่อน LINE
        </h2>
        <p className="line-modal__subtitle">สั่งซื้อและสอบถามราคาผ่าน LINE ได้ทันที</p>

        <div className="line-modal__qr-wrap">
          <QRCodeSVG
            value={lineAddUrl()}
            size={196}
            level="M"
            bgColor="#ffffff"
            fgColor="#111111"
            className="line-modal__qr"
          />
        </div>

        <p className="line-modal__id">
          LINE ID: <strong>{LINE_CONFIG.id}</strong>
        </p>

        {orderHint && (
          <p className="line-modal__hint">
            หลังเพิ่มเพื่อนแล้ว ส่งข้อความ:
            <span className="line-modal__message">{orderHint}</span>
          </p>
        )}

        <a
          href={lineAddUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="line-modal__open"
        >
          เปิด LINE เพิ่มเพื่อน
        </a>
      </div>
    </div>
  );
}
