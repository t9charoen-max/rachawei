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
  suggestAboutFilename,
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
import { adminInviteUrl, isAdminUnlocked, setAdminUnlocked } from '../../utils/adminAccess';

interface ProductAdminPageProps {
  products: Product[];
  site: SiteSettings | null;
  onCatalogChange: () => void;
  onClose: () => void;
  onExitAdmin?: () => void;
  onUnlocked?: () => void;
  onViewAbout?: () => void;
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

function focusProductForm() {
  requestAnimationFrame(() => {
    document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      document.getElementById('admin-product-name')?.focus();
    }, 280);
  });
}

export function ProductAdminPage({
  products,
  site,
  onCatalogChange,
  onClose,
  onExitAdmin,
  onUnlocked,
  onViewAbout,
}: ProductAdminPageProps) {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked());
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm('13'));
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [coverAlt, setCoverAlt] = useState(DEFAULT_SITE_SETTINGS.heroCoverAlt);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverDirty, setCoverDirty] = useState(false);
  const [aboutImage, setAboutImage] = useState(DEFAULT_SITE_SETTINGS.aboutImage);
  const [aboutImageAlt, setAboutImageAlt] = useState(DEFAULT_SITE_SETTINGS.aboutImageAlt);
  const [shopName, setShopName] = useState(DEFAULT_SITE_SETTINGS.shopName);
  const [story, setStory] = useState(DEFAULT_SITE_SETTINGS.story);
  const [location, setLocation] = useState(DEFAULT_SITE_SETTINGS.location);
  const [hours, setHours] = useState(DEFAULT_SITE_SETTINGS.hours);
  const [phone, setPhone] = useState(DEFAULT_SITE_SETTINGS.phone);
  const [aboutBusy, setAboutBusy] = useState(false);
  const [aboutDirty, setAboutDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [publishStep, setPublishStep] = useState<'idle' | 'confirm' | 'done'>('idle');
  const [publishSummary, setPublishSummary] = useState('');
  const [handoffText, setHandoffText] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLInputElement>(null);

  const baseItems = useMemo(() => products.map(productToCatalogItem), [products]);
  const draftItems = loadDraftItems();
  const draftIds = new Set(draftItems.map((item) => item.id));
  const draftCount = draftItems.length;
  const hasSiteDraft = Boolean(loadSiteDraft());

  const buildSiteSettings = (): SiteSettings => ({
    heroCover: coverImages[0] || DEFAULT_SITE_SETTINGS.heroCover,
    heroCoverAlt: coverAlt.trim() || DEFAULT_SITE_SETTINGS.heroCoverAlt,
    heroCovers: coverImages.length ? coverImages : DEFAULT_SITE_SETTINGS.heroCovers,
    aboutImage: aboutImage || DEFAULT_SITE_SETTINGS.aboutImage,
    aboutImageAlt: aboutImageAlt.trim() || DEFAULT_SITE_SETTINGS.aboutImageAlt,
    shopName: shopName.trim() || DEFAULT_SITE_SETTINGS.shopName,
    story: story.trim() || DEFAULT_SITE_SETTINGS.story,
    location: location.trim() || DEFAULT_SITE_SETTINGS.location,
    hours: hours.trim() || DEFAULT_SITE_SETTINGS.hours,
    phone: phone.trim() || DEFAULT_SITE_SETTINGS.phone,
  });

  useEffect(() => {
    if (coverDirty || aboutDirty) return;
    const current = site ?? DEFAULT_SITE_SETTINGS;
    setCoverImages(current.heroCovers);
    setCoverAlt(current.heroCoverAlt);
    setAboutImage(current.aboutImage);
    setAboutImageAlt(current.aboutImageAlt);
    setShopName(current.shopName);
    setStory(current.story);
    setLocation(current.location);
    setHours(current.hours);
    setPhone(current.phone);
  }, [site, coverDirty, aboutDirty]);

  const startCreate = () => {
    const id = nextProductId(baseItems);
    setEditingId(null);
    setForm(emptyForm(id));
    setMessage('ฟอร์มเพิ่มสินค้าใหม่ — กรอกชื่อ เลือกรูป แล้วกดบันทึกสินค้า');
    focusProductForm();
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
    setMessage(`กำลังแก้ไข #${product.id}`);
    focusProductForm();
  };

  const unlock = (value: string) => {
    if (value.trim() === ADMIN_PIN) {
      setUnlocked(true);
      setAdminUnlocked(true);
      onUnlocked?.();
      setPinError('');
      setPin('');
      startCreate();
      setMessage('เข้าสู่ระบบแล้ว — กรอกฟอร์มด้านล่างเพื่อเพิ่มสินค้า หรือเลื่อนไปแก้ภาพหน้าปก');
      return true;
    }
    setPinError(`รหัสไม่ถูกต้อง — ใช้ 4 ตัวท้ายเบอร์ร้าน (${ADMIN_PIN})`);
    return false;
  };

  const copyAdminInvite = async () => {
    const text = [
      'ลิงก์หลังร้านราชาหวาย (สำหรับแอดมินเท่านั้น)',
      adminInviteUrl(),
      '',
      `รหัสเข้า: ${ADMIN_PIN} (4 ตัวท้ายเบอร์ร้าน)`,
      '',
      'ลูกค้าใช้ลิงก์ปกติไม่มี ?admin=1',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2500);
    } catch {
      setPinError('คัดลอกไม่สำเร็จ — ส่งลิงก์ rachawei.vercel.app/?admin=1 ให้แอดมินเอง');
    }
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
      const compressed = await Promise.all(
        files.map((file) => compressImageFile(file, { purpose: 'product' })),
      );
      setForm((current) => ({
        ...current,
        images: [...current.images, ...compressed.map((item) => item.dataUrl)],
      }));
      setMessage(`เพิ่มรูปสินค้าแล้ว ${compressed.length} รูป · จัดพอดีกรอบอัตโนมัติ`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เพิ่มรูปไม่สำเร็จ');
    } finally {
      event.target.value = '';
    }
  };

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (!files.length) {
      setMessage('ยังไม่ได้เลือกไฟล์ — ลองใหม่อีกครั้ง');
      return;
    }

    setCoverBusy(true);
    setMessage('กำลังเตรียมภาพหน้าปก…');
    try {
      const compressed = await Promise.all(
        files.map((file) => compressImageFile(file, { purpose: 'hero' })),
      );
      setCoverImages((current) => [...current, ...compressed.map((item) => item.dataUrl)]);
      setCoverDirty(true);
      setMessage(
        `เพิ่มภาพหน้าปกแล้ว ${compressed.length} รูป · จัดพอดีอัตโนมัติ — กด “บันทึกภาพหน้าปก”`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เลือกภาพไม่สำเร็จ ลองใหม่');
    } finally {
      setCoverBusy(false);
      event.target.value = '';
    }
  };

  const removeCoverImage = (index: number) => {
    setCoverImages((current) => current.filter((_, i) => i !== index));
    setCoverDirty(true);
  };

  const moveCoverImage = (index: number, direction: -1 | 1) => {
    setCoverImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setCoverDirty(true);
  };

  const setMainCoverImage = (index: number) => {
    if (index <= 0) return;
    setCoverImages((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
    setCoverDirty(true);
  };

  const handleSaveCover = () => {
    if (!coverImages.length) {
      setMessage('กรุณาเพิ่มภาพหน้าปกอย่างน้อย 1 รูป');
      return;
    }
    try {
      saveSiteDraft(buildSiteSettings());
      setCoverDirty(false);
      setAboutDirty(false);
      onCatalogChange();
      setMessage(
        coverImages.length > 1
          ? `บันทึกภาพหน้าปก ${coverImages.length} รูปแล้ว — หน้าแรกจะเลื่อนไหล · กด “เตรียมไฟล์ส่งคนอื่น” เมื่อพร้อม`
          : 'บันทึกภาพหน้าปกแล้ว — เห็นบนเครื่องนี้ทันที · กด “เตรียมไฟล์ส่งคนอื่น” เมื่อพร้อม',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const handleAboutFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage('ยังไม่ได้เลือกไฟล์ — ลองใหม่อีกครั้ง');
      return;
    }
    setAboutBusy(true);
    setMessage('กำลังเตรียมภาพเกี่ยวกับเรา…');
    try {
      const { dataUrl } = await compressImageFile(file, { purpose: 'about' });
      setAboutImage(dataUrl);
      setAboutDirty(true);
      setMessage('เลือกภาพเกี่ยวกับเราแล้ว · จัดพอดีอัตโนมัติ — กด “บันทึกเกี่ยวกับเรา”');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เลือกภาพไม่สำเร็จ ลองใหม่');
    } finally {
      setAboutBusy(false);
      event.target.value = '';
    }
  };

  const handleSaveAbout = () => {
    if (!aboutImage) {
      setMessage('กรุณาเลือกภาพเกี่ยวกับเรา');
      return;
    }
    if (!story.trim()) {
      setMessage('กรุณาใส่ข้อความเกี่ยวกับเรา');
      return;
    }
    try {
      saveSiteDraft(buildSiteSettings());
      setCoverDirty(false);
      setAboutDirty(false);
      onCatalogChange();
      setMessage('บันทึกเกี่ยวกับเราและข้อมูลร้านแล้ว — เห็นบนเครื่องนี้ทันที');
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

  const setMainImage = (index: number) => {
    if (index <= 0) return;
    setForm((current) => {
      const next = [...current.images];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
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
      special: form.special,
      images: form.images,
    };

    try {
      persistDraft(item);
      setEditingId(item.id);
      setMessage('บันทึกแล้ว — แสดงบนเครื่องนี้ทันที · กด “เตรียมไฟล์ส่งคนอื่น” เมื่อพร้อม');
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

  const runPublishPackage = () => {
    const drafts = loadDraftItems();
    const siteDraft = loadSiteDraft();
    if (!drafts.length && !siteDraft) {
      setPublishStep('idle');
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

    let publishedCovers = site?.heroCovers ?? DEFAULT_SITE_SETTINGS.heroCovers;
    let publishedAboutImage = site?.aboutImage ?? DEFAULT_SITE_SETTINGS.aboutImage;
    if (siteDraft) {
      publishedCovers = siteDraft.heroCovers.map((src, index) => {
        if (src.startsWith('data:')) {
          const filename = suggestCoverFilename(`cover-${index}.jpg`, index);
          downloadDataUrl(filename, src);
          return `/images/shop/${filename}`;
        }
        return src;
      });
      if (siteDraft.aboutImage.startsWith('data:')) {
        const filename = suggestAboutFilename('about.jpg');
        downloadDataUrl(filename, siteDraft.aboutImage);
        publishedAboutImage = `/images/shop/${filename}`;
      } else {
        publishedAboutImage = siteDraft.aboutImage;
      }
      downloadTextFile(
        'site.json',
        `${JSON.stringify(
          {
            heroCover: publishedCovers[0],
            heroCoverAlt: siteDraft.heroCoverAlt,
            heroCovers: publishedCovers,
            aboutImage: publishedAboutImage,
            aboutImageAlt: siteDraft.aboutImageAlt,
            shopName: siteDraft.shopName,
            story: siteDraft.story,
            location: siteDraft.location,
            hours: siteDraft.hours,
            phone: siteDraft.phone,
          },
          null,
          2,
        )}\n`,
      );
    }

    const attachedFiles = [
      namedDrafts.length ? 'products.json' : null,
      siteDraft ? 'site.json' : null,
      namedDrafts.length ? 'รูปสินค้าที่ดาวน์โหลดมาด้วย (basket-…)' : null,
      siteDraft ? 'รูปหน้าปก/เกี่ยวกับเราที่ดาวน์โหลดมาด้วย (hero-cover-… / about-cover…)' : null,
      'ส่งให้คนอัปเดตเว็บ.txt',
    ]
      .filter(Boolean)
      .join('\n- ');

    const handoff = [
      'ช่วยอัปเดตเว็บราชาหวายสุรินทร์ให้หน่อยครับ/ค่ะ',
      '',
      'เว็บจริง (ส่งลูกค้า): https://rachawei.vercel.app',
      'หลังร้าน (เจ้าของเท่านั้น): https://rachawei.vercel.app/?admin=1',
      'โปรเจกต์: https://github.com/t9charoen-max/rachawei',
      '',
      'ฉันแก้ในหลังบ้านแล้ว ส่งไฟล์มาด้วย กรุณาทำตามนี้:',
      '',
      namedDrafts.length
        ? [
            '【สินค้า】',
            '- วางไฟล์ products.json → public/catalog/products.json',
            '- วางรูปสินค้าที่ส่งมา → public/products/',
            '- หรือวางงานให้ grokbot: grokbot/inbox/ + grokbot/inbox/images/ แล้วรัน npm run grokbot:apply',
            `- สินค้าที่แก้: ${namedDrafts.map((d) => `#${d.id} ${d.name}`).join(', ')}`,
            '',
          ].join('\n')
        : null,
      siteDraft
        ? [
            '【หน้าปก / เกี่ยวกับเรา / ข้อมูลร้าน】',
            '- วางไฟล์ site.json → public/catalog/site.json',
            '- วางรูปที่ส่งมา → public/images/shop/',
            '- หรือใช้ task update-site ใน grokbot/inbox/',
            `- ภาพหน้าปก ${publishedCovers.length} รูป: ${publishedCovers.join(', ')}`,
            `- ภาพเกี่ยวกับเรา: ${publishedAboutImage}`,
            `- ชื่อร้าน: ${siteDraft.shopName}`,
            `- ที่อยู่: ${siteDraft.location}`,
            '',
          ].join('\n')
        : null,
      '【ขั้นตอนปิดงาน】',
      '1) ตรวจว่าไฟล์อยู่ในโฟลเดอร์ถูก (หรือรัน npm run grokbot:apply + npm run grokbot:validate)',
      '2) commit + push ไป branch main',
      '3) รอ Vercel deploy โปรเจกต์ rachawei เสร็จ',
      '4) เปิด https://rachawei.vercel.app ตรวจว่าขึ้นถูกต้อง',
      '',
      'คู่มือ grokbot: grokbot/README.md',
      '',
      'หมายเหตุ: อย่าเปิดไฟล์ .json แก้ด้วยมือถ้าไม่จำเป็น — ใช้ไฟล์ที่ส่งมาวางทับได้เลย',
      '',
      'ไฟล์ที่แนบมา:',
      `- ${attachedFiles}`,
    ]
      .filter(Boolean)
      .join('\n');

    downloadTextFile('ส่งให้คนอัปเดตเว็บ.txt', `${handoff}\n`, 'text/plain');
    void navigator.clipboard?.writeText(handoff);
    setHandoffText(handoff);
    setCopyStatus('คัดลอกข้อความไว้แล้ว');
    setPublishSummary(
      [
        namedDrafts.length ? 'products.json' : null,
        siteDraft ? 'site.json' : null,
        'ส่งให้คนอัปเดตเว็บ.txt',
        'และไฟล์รูป',
      ]
        .filter(Boolean)
        .join(' · '),
    );
    setPublishStep('done');
    setMessage(
      'เตรียมไฟล์แล้ว — ส่งไฟล์ทั้งหมด + ข้อความ “ส่งให้คนอัปเดตเว็บ.txt” ให้คนอื่นหรือ Cursor ทำต่อได้',
    );
  };

  const copyHandoffText = async () => {
    if (!handoffText) return;
    try {
      await navigator.clipboard.writeText(handoffText);
      setCopyStatus('คัดลอกแล้ว — วางส่งแชทได้เลย');
    } catch {
      setCopyStatus('คัดลอกไม่สำเร็จ — เปิดไฟล์ ส่งให้คนอัปเดตเว็บ.txt แล้วคัดลอกเอง');
    }
  };

  const handlePublishClick = () => {
    const drafts = loadDraftItems();
    const siteDraft = loadSiteDraft();
    if (!drafts.length && !siteDraft) {
      setMessage('ยังไม่มีแบบร่าง — บันทึกสินค้าหรือภาพหน้าปกก่อน');
      return;
    }
    setPublishStep('confirm');
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
          ← กลับหน้าร้าน
        </button>
        <h2 className="section-title">จัดการหลังร้าน</h2>
        <p className="admin-screen__hint">
          สำหรับเจ้าของร้าน / แอดมินเท่านั้น — ลูกค้าไม่เห็นหน้านี้
          <br />
          กรอกรหัส 4 ตัวท้ายเบอร์โทรร้าน ({SHOP_INFO.phone} → <strong>{ADMIN_PIN}</strong>)
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
        <div className="admin-invite">
          <p className="admin-screen__hint">
            ส่งให้แอดมินคนอื่น: ใช้ลิงก์หลังร้าน + รหัสด้านบน
            <br />
            <strong className="admin-invite__url">{adminInviteUrl()}</strong>
          </p>
          <button type="button" className="admin-form__save" onClick={() => void copyAdminInvite()}>
            {inviteCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์+รหัสส่งแอดมิน'}
          </button>
          <p className="admin-screen__hint">ลูกค้าใช้ลิงก์ปกติ https://rachawei.vercel.app (ไม่มี ?admin=1)</p>
        </div>
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
        บันทึก = เห็นบนเครื่องนี้ทันที · “เตรียมไฟล์ส่งคนอื่น” = อัปขึ้นเว็บจริง
        <br />
        แบบร่างสินค้า {draftCount} รายการ{hasSiteDraft ? ' · มีแบบร่างข้อมูลร้าน' : ''}
        <br />
        กดกลับหน้าร้านแล้วยังเป็นแอดมินอยู่ — แท็บ <strong>หลังร้าน</strong> ยังกดกลับมาแก้ได้
      </p>
      {onExitAdmin && (
        <button type="button" className="admin-exit-btn" onClick={onExitAdmin}>
          ออกจากโหมดแอดมินบนเครื่องนี้
        </button>
      )}

      {message && <p className="admin-screen__message">{message}</p>}

      <h3 id="admin-product-section" className="admin-section-title">
        ① เพิ่ม / แก้ไขสินค้า
      </h3>

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
            id="admin-product-name"
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
          <span>สินค้าพิเศษ — ติ๊กแล้วคำว่า “พิเศษ” จะขึ้นหน้าร้าน</span>
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
          <span>รูปสินค้า * (เลือกได้หลายรูป · จัดพอดีกรอบอัตโนมัติ)</span>
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
                <div className="admin-thumbs__media">
                  <img src={previewSrc(src)} alt="" />
                  {index === 0 && <span className="admin-thumbs__badge">รูปหลัก</span>}
                </div>
                <div className="admin-thumbs__actions">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                    ซ้าย
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === form.images.length - 1}
                  >
                    ขวา
                  </button>
                  {index > 0 ? (
                    <button type="button" className="admin-thumbs__main" onClick={() => setMainImage(index)}>
                      รูปหลัก
                    </button>
                  ) : (
                    <span className="admin-thumbs__main-spacer" aria-hidden="true" />
                  )}
                  <button type="button" className="admin-thumbs__delete" onClick={() => removeImage(index)}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
          {form.images.length > 1 && (
            <p className="admin-file-status">รูปแรก = รูปหลัก · กด “รูปหลัก” เพื่อเลือกใหม่ · ซ้าย/ขวาเรียงลำดับ</p>
          )}
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="admin-form__save">
            บันทึกสินค้า
          </button>
          <button type="button" className="admin-form__publish" onClick={handlePublishClick}>
            เตรียมไฟล์ส่งคนอื่น
          </button>
        </div>
      </form>

      <div id="admin-cover" className="admin-form admin-cover">
        <h3 className="admin-cover__title">② ภาพหน้าปกเลื่อน (หน้าแรก)</h3>
<p className="admin-file-status">
          เลือกได้หลายรูป — ระบบจัดสัดส่วนให้พอดีกรอบอัตโนมัติ · รูปแรก = เริ่มต้น
        </p>

        <div className="admin-cover__preview">
          {coverImages[0] ? (
            <img src={resolveSiteImage(coverImages[0])} alt="ตัวอย่างหน้าปก" />
          ) : (
            <span>ยังไม่มีภาพ</span>
          )}
          {coverBusy && <span className="admin-cover__busy">กำลังโหลดรูป…</span>}
          {coverImages.length > 1 && (
            <span className="admin-cover__count">{coverImages.length} รูป</span>
          )}
        </div>

        <input
          ref={coverRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp"
          multiple
          className="admin-file-input"
          onChange={handleCoverFile}
        />

        <button
          type="button"
          className="admin-file-btn"
          disabled={coverBusy}
          onClick={() => coverRef.current?.click()}
        >
          {coverBusy ? 'กำลังเตรียมรูป…' : 'เลือกภาพหน้าปกจากเครื่อง / ถ่ายรูป (หลายรูปได้)'}
        </button>

        <div className="admin-thumbs">
          {coverImages.map((src, index) => (
            <div key={`${index}-${src.slice(0, 24)}`} className="admin-thumbs__item">
              <div className="admin-thumbs__media">
                <img src={resolveSiteImage(src)} alt="" />
                {index === 0 && <span className="admin-thumbs__badge">เริ่มต้น</span>}
              </div>
              <div className="admin-thumbs__actions">
                <button type="button" onClick={() => moveCoverImage(index, -1)} disabled={index === 0}>
                  ซ้าย
                </button>
                <button
                  type="button"
                  onClick={() => moveCoverImage(index, 1)}
                  disabled={index === coverImages.length - 1}
                >
                  ขวา
                </button>
                {index > 0 ? (
                  <button type="button" className="admin-thumbs__main" onClick={() => setMainCoverImage(index)}>
                    เริ่มต้น
                  </button>
                ) : (
                  <span className="admin-thumbs__main-spacer" aria-hidden="true" />
                )}
                <button type="button" className="admin-thumbs__delete" onClick={() => removeCoverImage(index)}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="admin-file-status">
          {coverDirty ? 'มีการแก้ภาพหน้าปก รอบันทึก' : `มีภาพหน้าปก ${coverImages.length} รูป`}
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
        <div className="admin-form__actions">
          <button
            type="button"
            className="admin-form__save"
            onClick={handleSaveCover}
            disabled={coverBusy || !coverImages.length}
          >
            บันทึกภาพหน้าปก
          </button>
          <button type="button" className="admin-form__preview" onClick={onClose}>
            ดูหน้าแรก
          </button>
        </div>
      </div>

<div id="admin-about" className="admin-form admin-cover">
        <h3 className="admin-cover__title">③ เกี่ยวกับเรา / ข้อมูลร้าน</h3>
        <p className="admin-file-status">แก้ภาพและข้อความในหน้าเกี่ยวกับ + ที่อยู่/เวลา/โทร ที่หน้าติดต่อ</p>

        <div className="admin-cover__preview">
          {aboutImage ? (
            <img src={resolveSiteImage(aboutImage)} alt="ตัวอย่างเกี่ยวกับเรา" />
          ) : (
            <span>ยังไม่มีภาพ</span>
          )}
          {aboutBusy && <span className="admin-cover__busy">กำลังโหลดรูป…</span>}
        </div>

        <input
          ref={aboutRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp"
          className="admin-file-input"
          onChange={handleAboutFile}
        />
        <button
          type="button"
          className="admin-file-btn"
          disabled={aboutBusy}
          onClick={() => aboutRef.current?.click()}
        >
          {aboutBusy ? 'กำลังเตรียมรูป…' : 'เลือกภาพเกี่ยวกับเรา / ถ่ายรูป'}
        </button>

        <label className="admin-form__field">
          <span>ชื่อร้าน</span>
          <input
            value={shopName}
            onChange={(e) => {
              setShopName(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="ราชาหวายสุรินทร์"
          />
        </label>

        <label className="admin-form__field">
          <span>ข้อความเกี่ยวกับเรา *</span>
          <textarea
            rows={4}
            value={story}
            onChange={(e) => {
              setStory(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="เล่าเรื่องร้านสั้น ๆ"
          />
        </label>

        <label className="admin-form__field">
          <span>คำอธิบายภาพ</span>
          <input
            value={aboutImageAlt}
            onChange={(e) => {
              setAboutImageAlt(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="เช่น ช่างสานหวายในร้าน"
          />
        </label>

        <label className="admin-form__field">
          <span>ที่อยู่</span>
          <textarea
            rows={2}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="ที่อยู่ร้าน"
          />
        </label>

        <label className="admin-form__field">
          <span>เวลาทำการ</span>
          <input
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="เช่น ทุกวัน 06:00–21:00"
          />
        </label>

        <label className="admin-form__field">
          <span>โทรศัพท์</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setAboutDirty(true);
            }}
            placeholder="081-470-7089"
            inputMode="tel"
          />
        </label>

        <p className="admin-file-status">
          {aboutDirty ? 'มีการแก้ข้อมูลร้าน รอบันทึก' : 'ยังไม่ได้แก้ข้อมูลใหม่'}
          <br />
          รหัสเข้าหลังบ้านยังใช้ 4 ตัวท้ายเบอร์เดิม ({ADMIN_PIN})
        </p>

        <div className="admin-form__actions">
          <button
            type="button"
            className="admin-form__save"
            onClick={handleSaveAbout}
            disabled={aboutBusy || !aboutImage}
          >
            บันทึกเกี่ยวกับเรา
          </button>
          <button
            type="button"
            className="admin-form__preview"
            onClick={() => (onViewAbout ? onViewAbout() : onClose())}
          >
            ดูหน้าเกี่ยวกับ
          </button>
        </div>
      </div>

{publishStep !== 'idle' && (
        <div className="admin-publish-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="admin-publish-modal__backdrop"
            onClick={() => setPublishStep('idle')}
            aria-label="ปิด"
          />
          <div className="admin-publish-modal__panel">
            {publishStep === 'confirm' ? (
              <>
                <h3>เตรียมไฟล์ส่งให้คนอื่นทำ</h3>
                <p>
                  จะดาวน์โหลดไฟล์อัปเดต + ข้อความอธิบายงาน
                  ให้คุณส่งต่อให้คนอื่นหรือ Cursor ทำให้ขึ้นเว็บจริงได้
                </p>
                <p className="admin-publish-modal__warn">
                  ถ้าโทรศัพท์ถาม “ดู / ดาวน์โหลด” ให้กด <strong>ดาวน์โหลด</strong> เท่านั้น
                  <br />
                  อย่ากด “ดู” และอย่าเปิดไฟล์ JSON
                </p>
                <div className="admin-publish-modal__actions">
                  <button type="button" className="admin-form__save" onClick={runPublishPackage}>
                    ดาวน์โหลดไฟล์เลย
                  </button>
                  <button type="button" className="admin-form__preview" onClick={() => setPublishStep('idle')}>
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>พร้อมส่งให้คนอื่นแล้ว</h3>
                <p>
                  ได้ไฟล์: {publishSummary}
                  <br />
                  ส่งไฟล์ทั้งหมดในแชท พร้อมข้อความด้านล่าง (หรือไฟล์{' '}
                  <strong>ส่งให้คนอัปเดตเว็บ.txt</strong>)
                </p>
                <p className="admin-publish-modal__warn">
                  อย่าเปิดไฟล์ JSON — ส่งทั้งชุดให้คนที่ทำเว็บ/Cursor พอ
                </p>
                {copyStatus && <p className="admin-publish-modal__hint">{copyStatus}</p>}
                <div className="admin-publish-modal__actions">
                  <button type="button" className="admin-form__save" onClick={() => void copyHandoffText()}>
                    คัดลอกข้อความส่งคนอื่น
                  </button>
                  <button type="button" className="admin-form__preview" onClick={() => setPublishStep('idle')}>
                    ปิด
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                    แก้ไข
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
