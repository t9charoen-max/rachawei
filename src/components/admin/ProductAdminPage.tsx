import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  clearDraftItems,
  clearSiteDraft,
  DEFAULT_SITE_SETTINGS,
  downloadDataUrl,
  downloadTextFile,
  loadDraftItems,
  loadSiteDraft,
  mergeCatalog,
  nextProductId,
  productToCatalogItem,
  resolveSiteImage,
  saveDraftItems,
  saveSiteDraft,
  suggestCoverFilename,
  suggestImageFilename,
  type CatalogItem,
  type SiteSettings,
} from '../../data/catalog';
import {
  ADMIN_PIN,
  PRODUCT_CATEGORY_OPTIONS,
  SHOP_INFO,
  type Product,
} from '../../data/products';
import { compressImageFile } from '../../utils/imageUpload';

interface ProductAdminPageProps {
  products: Product[];
  site: SiteSettings | null;
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

function previewSrc(src: string): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) return src;
  if (src.startsWith('/')) return src.split('?')[0];
  return `/products/${src}`;
}

const UNLOCK_KEY = 'rachawei-admin-unlocked';

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function writeUnlocked(value: boolean) {
  try {
    if (value) sessionStorage.setItem(UNLOCK_KEY, '1');
    else sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // private mode may block storage — keep in memory only
  }
}

export function ProductAdminPage({
  products,
  site,
  onCatalogChange,
  onClose,
}: ProductAdminPageProps) {
  const [unlocked, setUnlocked] = useState(() => readUnlocked());
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm('13'));
  const [coverSrc, setCoverSrc] = useState('');
  const [coverAlt, setCoverAlt] = useState(DEFAULT_SITE_SETTINGS.heroCoverAlt);
  const [coverFileName, setCoverFileName] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverDirty, setCoverDirty] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const baseItems = useMemo(() => products.map(productToCatalogItem), [products]);
  const draftItems = loadDraftItems();
  const draftIds = new Set(draftItems.map((item) => item.id));
  const draftCount = draftItems.length;
  const hasCoverDraft = Boolean(loadSiteDraft());

  useEffect(() => {
    if (coverDirty) return;
    const current = site ?? DEFAULT_SITE_SETTINGS;
    setCoverSrc(current.heroCover);
    setCoverAlt(current.heroCoverAlt);
  }, [site, coverDirty]);

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
    requestAnimationFrame(() => {
      document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const unlock = (value: string) => {
    if (value.trim() === ADMIN_PIN) {
      setUnlocked(true);
      writeUnlocked(true);
      setPinError('');
      setPin('');
      startCreate();
      setMessage('เข้าสู่ระบบแล้ว — เลื่อนลงเพื่อแก้ภาพหน้าปกหรือสินค้า');
      return true;
    }
    setPinError(`รหัสไม่ถูกต้อง — ใช้ 4 ตัวท้ายเบอร์ร้าน (${ADMIN_PIN})`);
    return false;
  };

  const handleUnlock = (event: FormEvent) => {
    event.preventDefault();
    unlock(pin);
  };

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setPinError('');
    if (digits.length === 4) {
      unlock(digits);
    }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;

    setMessage('กำลังเตรียมรูปสินค้า…');
    try {
      const compressed = await Promise.all(files.map((file) => compressImageFile(file)));
      setForm((current) => ({
        ...current,
        images: [...current.images, ...compressed.map((item) => item.dataUrl)],
      }));
      setMessage(`เพิ่มรูปสินค้าแล้ว ${compressed.length} รูป`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เพิ่มรูปไม่สำเร็จ');
    } finally {
      event.target.value = '';
    }
  };

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage('ยังไม่ได้เลือกไฟล์ — ลองใหม่อีกครั้ง');
      return;
    }

    setCoverBusy(true);
    setMessage('กำลังเตรียมภาพหน้าปก…');
    try {
      const { dataUrl, fileName } = await compressImageFile(file);
      setCoverSrc(dataUrl);
      setCoverFileName(fileName);
      setCoverDirty(true);
      setMessage(`เลือกภาพแล้ว: ${fileName} — กด “บันทึกภาพหน้าปก” เพื่อยืนยัน`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เลือกภาพไม่สำเร็จ ลองใหม่');
    } finally {
      setCoverBusy(false);
      event.target.value = '';
    }
  };

  const handleSaveCover = () => {
    if (!coverSrc) {
      setMessage('กรุณาเลือกภาพหน้าปก');
      return;
    }
    try {
      saveSiteDraft({
        heroCover: coverSrc,
        heroCoverAlt: coverAlt.trim() || DEFAULT_SITE_SETTINGS.heroCoverAlt,
      });
      setCoverDirty(false);
      onCatalogChange();
      setMessage('บันทึกภาพหน้าปกแล้ว — เห็นบนหน้าแรกทันที กด “ส่งขึ้นเว็บจริง” เพื่ออัปเดตเว็บลูกค้า');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    }
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

    try {
      persistDraft(item);
      setEditingId(item.id);
      setMessage('บันทึกแล้ว — แสดงบนเครื่องนี้ทันที กด “ส่งขึ้นเว็บจริง” เพื่ออัปเดตเว็บลูกค้า');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    }
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
    const siteDraft = loadSiteDraft();
    if (!drafts.length && !siteDraft) {
      setMessage('ยังไม่มีแบบร่าง — บันทึกสินค้าหรือภาพหน้าปกก่อน');
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

    if (namedDrafts.length) {
      const published = mergeCatalog(baseItems, namedDrafts);
      downloadTextFile('products.json', `${JSON.stringify(published, null, 2)}\n`);
    }

    let coverPath = site?.heroCover ?? DEFAULT_SITE_SETTINGS.heroCover;
    if (siteDraft) {
      if (siteDraft.heroCover.startsWith('data:')) {
        const filename = suggestCoverFilename('cover.jpg');
        downloadDataUrl(filename, siteDraft.heroCover);
        coverPath = `/images/shop/${filename}`;
      } else {
        coverPath = siteDraft.heroCover;
      }
      downloadTextFile(
        'site.json',
        `${JSON.stringify(
          {
            heroCover: coverPath,
            heroCoverAlt: siteDraft.heroCoverAlt,
          },
          null,
          2,
        )}\n`,
      );
    }

    const prompt = [
      'อัปเดตแคตตาล็อก / ภาพหน้าปก ราชาหวาย',
      namedDrafts.length
        ? '1) วาง products.json → public/catalog/products.json และรูปสินค้า → public/products/'
        : null,
      siteDraft
        ? `${namedDrafts.length ? '2' : '1'}) วาง site.json → public/catalog/site.json และรูปหน้าปก → public/images/shop/`
        : null,
      'สุดท้าย: commit + deploy',
      '',
      namedDrafts.length
        ? `สินค้าที่แก้: ${namedDrafts.map((d) => `${d.id} ${d.name}`).join(', ')}`
        : null,
      siteDraft ? `ภาพหน้าปก: ${coverPath}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    void navigator.clipboard?.writeText(prompt);
    setMessage(
      'ดาวน์โหลดไฟล์แล้ว และคัดลอกคำสั่งไว้แล้ว — ส่งไฟล์ในแชท Cursor หรือวางในโฟลเดอร์โปรเจกต์ได้เลย',
    );
  };

  const handleClearDrafts = () => {
    clearDraftItems();
    clearSiteDraft();
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
        <h2 className="section-title">จัดการหลังร้าน</h2>
        <p className="admin-screen__hint">
          สำหรับเจ้าของร้าน — กรอกรหัส 4 ตัวท้ายเบอร์โทรร้าน
          <br />
          เบอร์ร้าน {SHOP_INFO.phone} → รหัส <strong>{ADMIN_PIN}</strong>
        </p>
        <form className="admin-pin" onSubmit={handleUnlock}>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="ใส่ 4 ตัวเลข"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            autoFocus
            autoComplete="one-time-code"
          />
          <button type="submit" className="admin-pin__btn">
            เข้าสู่ระบบ
          </button>
          {pinError && <p className="admin-pin__error">{pinError}</p>}
        </form>
        <p className="admin-screen__hint">
          แนะนำ: อย่าใช้โหมดส่วนตัว/Incognito เพราะอาจบันทึกรูปไม่ได้
        </p>
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

      <h2 className="section-title">จัดการหลังร้าน</h2>
      <p className="admin-screen__hint">
        1) แก้ภาพหน้าปกด้านบน · 2) เพิ่ม/แก้สินค้าด้านล่าง · แบบร่าง {draftCount} รายการ
        {hasCoverDraft ? ' · มีแบบร่างหน้าปก' : ''}
      </p>

      <div id="admin-cover" className="admin-form admin-cover">
        <h3 className="admin-cover__title">① ภาพหน้าปก (หน้าแรก)</h3>
        <div className="admin-cover__preview">
          {coverSrc ? (
            <img src={resolveSiteImage(coverSrc)} alt="ตัวอย่างหน้าปก" />
          ) : (
            <span>ยังไม่มีภาพ</span>
          )}
          {coverBusy && <span className="admin-cover__busy">กำลังโหลดรูป…</span>}
        </div>

        <input
          ref={coverRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp"
          className="admin-file-input"
          onChange={handleCoverFile}
        />

        <button
          type="button"
          className="admin-file-btn"
          disabled={coverBusy}
          onClick={() => coverRef.current?.click()}
        >
          {coverBusy ? 'กำลังเตรียมรูป…' : 'เลือกภาพจากเครื่อง / ถ่ายรูป'}
        </button>
        <p className="admin-file-status">
          {coverFileName
            ? `เลือกแล้ว: ${coverFileName}`
            : coverDirty
              ? 'เลือกภาพใหม่แล้ว รอบันทึก'
              : 'ยังไม่ได้เลือกไฟล์ใหม่'}
        </p>

        <label className="admin-form__field">
          <span>คำอธิบายภาพ</span>
          <input
            value={coverAlt}
            onChange={(e) => {
              setCoverAlt(e.target.value);
              setCoverDirty(true);
            }}
            placeholder="เช่น ตะกร้าหวายภายในร้าน"
          />
        </label>
        <button
          type="button"
          className="admin-form__save"
          onClick={handleSaveCover}
          disabled={coverBusy || !coverSrc}
        >
          บันทึกภาพหน้าปก
        </button>
      </div>

      <h3 className="admin-section-title">② สินค้า</h3>

      <form id="admin-product-form" className="admin-form" onSubmit={handleSave}>
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
            accept="image/*,.jpg,.jpeg,.png,.webp"
            multiple
            className="admin-file-input"
            onChange={handleFiles}
          />
          <button
            type="button"
            className="admin-file-btn"
            onClick={() => fileRef.current?.click()}
          >
            เลือกภาพสินค้าจากเครื่อง / ถ่ายรูป
          </button>
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
