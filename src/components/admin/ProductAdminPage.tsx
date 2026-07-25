import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  clearDraftItems,
  downloadDataUrl,
  downloadTextFile,
  loadDraftItems,
  mergeCatalog,
  nextProductId,
  productToCatalogItem,
  saveDraftItems,
  suggestImageFilename,
  type CatalogItem,
} from '../../data/catalog';
import { ADMIN_PIN, PRODUCT_CATEGORY_OPTIONS, type Product } from '../../data/products';

interface ProductAdminPageProps {
  products: Product[];
  onCatalogChange: () => void;
  onClose: () => void;
}

interface FormState {
  id: string;
  name: string;
  description: string;
  category: string;
  special: boolean;
  images: string[];
}

const emptyForm = (id: string): FormState => ({
  id,
  name: '',
  description: '',
  category: 'ทรงกลม',
  special: false,
  images: [],
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function previewSrc(src: string): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) return src;
  if (src.startsWith('/')) return src.split('?')[0];
  return `/products/${src}`;
}

export function ProductAdminPage({ products, onCatalogChange, onClose }: ProductAdminPageProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm('13'));
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const baseItems = useMemo(() => products.map(productToCatalogItem), [products]);
  const draftItems = loadDraftItems();
  const draftIds = new Set(draftItems.map((item) => item.id));
  const draftCount = draftItems.length;

  const startCreate = () => {
    const id = nextProductId(baseItems);
    setEditingId(null);
    setForm(emptyForm(id));
    setMessage('');
  };

  const startEdit = (product: Product) => {
    const item = productToCatalogItem(product);
    setEditingId(product.id);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      special: Boolean(item.special),
      images: item.images,
    });
    setMessage('');
  };

  const handleUnlock = (event: FormEvent) => {
    event.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setUnlocked(true);
      setPinError('');
      startCreate();
    } else {
      setPinError('รหัสไม่ถูกต้อง');
    }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;

    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    setForm((current) => ({
      ...current,
      images: [...current.images, ...dataUrls],
    }));
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const next = [...current.images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, images: next };
    });
  };

  const persistDraft = (item: CatalogItem) => {
    const drafts = loadDraftItems().filter((draft) => draft.id !== item.id);
    drafts.push(item);
    saveDraftItems(drafts);
    onCatalogChange();
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage('กรุณากรอกชื่อสินค้า');
      return;
    }
    if (!form.images.length) {
      setMessage('กรุณาเพิ่มรูปอย่างน้อย 1 รูป');
      return;
    }

    const item: CatalogItem = {
      id: form.id.trim() || nextProductId(baseItems),
      name: form.name.trim(),
      description: form.description.trim() || form.name.trim(),
      category: form.category,
      special: form.special || form.category === 'พิเศษ',
      images: form.images,
    };

    persistDraft(item);
    setEditingId(item.id);
    setMessage('บันทึกแล้ว — แสดงบนเครื่องนี้ทันที กด “ส่งขึ้นเว็บจริง” เพื่ออัปเดตเว็บลูกค้า');
  };

  const handleDeleteDraft = (id: string) => {
    const next = loadDraftItems().filter((item) => item.id !== id);
    saveDraftItems(next);
    onCatalogChange();
    if (editingId === id || form.id === id) startCreate();
    setMessage('ลบแบบร่างแล้ว');
  };

  const handlePublishPackage = () => {
    const drafts = loadDraftItems();
    if (!drafts.length) {
      setMessage('ยังไม่มีแบบร่าง — บันทึกสินค้าก่อน');
      return;
    }

    const namedDrafts = drafts.map((draft) => {
      const images = draft.images.map((src, index) => {
        if (src.startsWith('data:')) {
          const filename = suggestImageFilename(draft.id, index, `photo-${index}.jpg`);
          downloadDataUrl(filename, src);
          return filename;
        }
        return src;
      });
      return { ...draft, images };
    });

    const published = mergeCatalog(baseItems, namedDrafts);
    downloadTextFile('products.json', `${JSON.stringify(published, null, 2)}\n`);

    const prompt = [
      'อัปเดตแคตตาล็อกสินค้าตะกร้าหวาย',
      '1) วางไฟล์ products.json ที่ดาวน์โหลดไว้ไปที่ public/catalog/products.json',
      '2) วางรูปที่ดาวน์โหลดไว้ไปที่ public/products/',
      '3) commit + deploy',
      '',
      `แบบร่างที่เพิ่ม/แก้: ${namedDrafts.map((d) => `${d.id} ${d.name}`).join(', ')}`,
    ].join('\n');

    void navigator.clipboard?.writeText(prompt);
    setMessage(
      'ดาวน์โหลด products.json + รูปแล้ว และคัดลอกคำสั่งไว้แล้ว — ส่งไฟล์ในแชท Cursor หรือวางในโฟลเดอร์โปรเจกต์ได้เลย',
    );
  };

  const handleClearDrafts = () => {
    clearDraftItems();
    onCatalogChange();
    startCreate();
    setMessage('ล้างแบบร่างทั้งหมดแล้ว');
  };

  if (!unlocked) {
    return (
      <section className="screen admin-screen py-4">
        <button type="button" className="btn btn--ghost back-btn" onClick={onClose}>
          ← กลับ
        </button>
        <h2 className="section-title">จัดการสินค้า</h2>
        <p className="admin-screen__hint">สำหรับเจ้าของร้าน — กรอกรหัส 4 ตัวท้ายเบอร์โทรร้าน</p>
        <form className="admin-pin" onSubmit={handleUnlock}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          <button type="submit" className="admin-pin__btn">
            เข้าสู่ระบบ
          </button>
          {pinError && <p className="admin-pin__error">{pinError}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="screen admin-screen py-4">
      <div className="admin-screen__top">
        <button type="button" className="btn btn--ghost back-btn" onClick={onClose}>
          ← กลับหน้าร้าน
        </button>
        <button type="button" className="admin-link-btn" onClick={startCreate}>
          + เพิ่มสินค้าใหม่
        </button>
      </div>

      <h2 className="section-title">จัดการสินค้า</h2>
      <p className="admin-screen__hint">
        กรอกชื่อ รายละเอียด แล้วแนบรูป — บันทึกแล้วเห็นบนเครื่องทันที · แบบร่าง {draftCount} รายการ
      </p>

      <form className="admin-form" onSubmit={handleSave}>
        <label className="admin-form__field">
          <span>รหัสสินค้า</span>
          <input
            value={form.id}
            onChange={(e) => setForm((c) => ({ ...c, id: e.target.value }))}
            disabled={Boolean(editingId)}
          />
        </label>

        <label className="admin-form__field">
          <span>ชื่อสินค้า *</span>
          <input
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="เช่น ตะกร้าหวายทรงรี 2 ชั้น"
            required
          />
        </label>

        <label className="admin-form__field">
          <span>หมวด</span>
          <select
            value={form.category}
            onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
          >
            {PRODUCT_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__check">
          <input
            type="checkbox"
            checked={form.special}
            onChange={(e) => setForm((c) => ({ ...c, special: e.target.checked }))}
          />
          <span>สินค้าพิเศษ</span>
        </label>

        <label className="admin-form__field">
          <span>รายละเอียด</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            placeholder="เขียนสั้น ๆ ได้ เช่น หูจับสูง ลายสานโปร่ง เหมาะใส่ผลไม้"
          />
        </label>

        <div className="admin-form__field">
          <span>รูปสินค้า * (เลือกได้หลายรูป)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFiles}
          />
          <div className="admin-thumbs">
            {form.images.map((src, index) => (
              <div key={`${index}-${src.slice(0, 24)}`} className="admin-thumbs__item">
                <img src={previewSrc(src)} alt="" />
                <div className="admin-thumbs__actions">
                  <button type="button" onClick={() => moveImage(index, -1)} aria-label="เลื่อนซ้าย">
                    ‹
                  </button>
                  <button type="button" onClick={() => moveImage(index, 1)} aria-label="เลื่อนขวา">
                    ›
                  </button>
                  <button type="button" onClick={() => removeImage(index)} aria-label="ลบรูป">
                    ✕
                  </button>
                </div>
                {index === 0 && <span className="admin-thumbs__badge">รูปหลัก</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="admin-form__save">
            บันทึกสินค้า
          </button>
          <button type="button" className="admin-form__publish" onClick={handlePublishPackage}>
            ส่งขึ้นเว็บจริง
          </button>
        </div>
      </form>

      {message && <p className="admin-screen__message">{message}</p>}

      <div className="admin-list">
        <div className="admin-list__head">
          <h3>รายการทั้งหมด ({products.length})</h3>
          {draftCount > 0 && (
            <button type="button" className="admin-link-btn" onClick={handleClearDrafts}>
              ล้างแบบร่าง
            </button>
          )}
        </div>
        <ul>
          {products.map((product) => {
            const isDraft = draftIds.has(product.id);
            return (
              <li key={product.id}>
                <img src={product.image} alt="" />
                <div>
                  <strong>
                    #{product.id} {product.name}
                  </strong>
                  <span>
                    {product.category}
                    {isDraft ? ' · แบบร่าง' : ''}
                  </span>
                </div>
                <div className="admin-list__btns">
                  <button type="button" onClick={() => startEdit(product)}>
                    แก้
                  </button>
                  {isDraft && (
                    <button type="button" onClick={() => handleDeleteDraft(product.id)}>
                      ลบ
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
