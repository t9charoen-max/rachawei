import { useEffect, useId, useState, type FormEvent } from 'react';
import { PRODUCTS, type Product } from '../data/products';
import { emptyOrderForm, submitOrderViaLine, type OrderFormValues } from '../utils/order';

interface OrderFormModalProps {
  product?: Product;
  onClose: () => void;
}

export function OrderFormModal({ product, onClose }: OrderFormModalProps) {
  const formId = useId();
  const [values, setValues] = useState<OrderFormValues>(() => emptyOrderForm(product));
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedHint, setCopiedHint] = useState(false);

  useEffect(() => {
    setValues(emptyOrderForm(product));
    setError('');
    setCopiedHint(false);
  }, [product]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!values.customerName.trim()) {
      setError('กรุณากรอกชื่อผู้สั่งซื้อ');
      return;
    }
    if (!values.phone.trim()) {
      setError('กรุณากรอกเบอร์โทร');
      return;
    }
    if (!values.productName.trim()) {
      setError('กรุณาเลือกหรือระบุสินค้า');
      return;
    }

    setSending(true);
    try {
      const result = await submitOrderViaLine(values);
      setCopiedHint(result.copied);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="order-form-modal" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`}>
      <button type="button" className="order-form-modal__backdrop" onClick={onClose} aria-label="ปิด" />
      <div className="order-form-modal__panel">
        <button type="button" className="order-form-modal__close" onClick={onClose} aria-label="ปิด">
          ✕
        </button>

        <h2 id={`${formId}-title`} className="order-form-modal__title">
          ฟอร์มสั่งซื้อ
        </h2>
        <p className="order-form-modal__subtitle">
          กรอกข้อมูลสั้น ๆ แล้วกดส่ง — ระบบจะเปิด LINE พร้อมข้อความสรุปให้อัตโนมัติ
        </p>

        <form className="order-form" onSubmit={handleSubmit}>
          <label className="order-form__field">
            <span>ชื่อผู้สั่งซื้อ *</span>
            <input
              type="text"
              name="customerName"
              autoComplete="name"
              placeholder="เช่น สมชาย ใจดี"
              value={values.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              required
            />
          </label>

          <label className="order-form__field">
            <span>เบอร์โทร *</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="08x-xxx-xxxx"
              value={values.phone}
              onChange={(e) => update('phone', e.target.value)}
              required
            />
          </label>

          <label className="order-form__field">
            <span>สินค้า *</span>
            <select
              name="productName"
              value={values.productName}
              onChange={(e) => update('productName', e.target.value)}
              required
            >
              <option value="">เลือกสินค้า</option>
              {PRODUCTS.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="order-form__field">
            <span>จำนวน (ชิ้น) *</span>
            <input
              type="number"
              name="quantity"
              min={1}
              max={999}
              value={values.quantity}
              onChange={(e) => update('quantity', Math.max(1, Number(e.target.value) || 1))}
              required
            />
          </label>

          <label className="order-form__field">
            <span>ที่อยู่จัดส่ง</span>
            <textarea
              name="address"
              rows={2}
              placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              value={values.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </label>

          <label className="order-form__field">
            <span>หมายเหตุ</span>
            <textarea
              name="note"
              rows={2}
              placeholder="เช่น ต้องการสี/ขนาดพิเศษ หรือช่วงเวลารับสินค้า"
              value={values.note}
              onChange={(e) => update('note', e.target.value)}
            />
          </label>

          {error && <p className="order-form__error">{error}</p>}
          {copiedHint && (
            <p className="order-form__copied">คัดลอกข้อความไว้แล้ว — วางในแชท LINE ได้ถ้ายังไม่ขึ้นอัตโนมัติ</p>
          )}

          <button type="submit" className="order-form__submit" disabled={sending}>
            {sending ? 'กำลังเปิด LINE…' : 'ส่งคำสั่งซื้อทาง LINE'}
          </button>
        </form>
      </div>
    </div>
  );
}
