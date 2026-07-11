import { telLink } from '../utils/contact';
import { LineAddButton } from './LineAddButton';

export function FloatingCallButton() {
  return (
    <div className="floating-order" aria-label="ติดต่อสั่งซื้อด่วน">
      <LineAddButton
        className="floating-order__btn floating-order__btn--line"
        label=""
        showIcon
        size="fab"
        aria-label="สแกนเพิ่ม LINE"
      />
      <a href={telLink()} className="floating-order__btn floating-order__btn--call" aria-label="โทรสั่งซื้อ">
        📞
      </a>
    </div>
  );
}
