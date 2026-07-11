import { generalInquiryMessage, telLink, whatsAppLink } from '../utils/contact';

export function FloatingCallButton() {
  return (
    <div className="floating-order" aria-label="ติดต่อสั่งซื้อด่วน">
      <a
        href={whatsAppLink(generalInquiryMessage())}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-order__btn floating-order__btn--chat"
        aria-label="แชทสั่งซื้อ"
      >
        💬
      </a>
      <a href={telLink()} className="floating-order__btn floating-order__btn--call" aria-label="โทรสั่งซื้อ">
        📞
      </a>
    </div>
  );
}
