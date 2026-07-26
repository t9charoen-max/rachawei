/** บีบอัดและจัดสัดส่วนรูปจากกล้องมือถือให้อยู่กรอบพอดีอัตโนมัติ */

const JPEG_QUALITY = 0.84;

export type ImageFitPurpose = 'hero' | 'about' | 'product';

export interface CompressOptions {
  /** hero/about = กว้าง 16:10, product = จัตุรัส 1:1 */
  purpose?: ImageFitPurpose;
  /**
   * cover = เติมเต็มกรอบ (อาจตัดขอบ)
   * contain = เห็นรูปครบทั้งใบ (มีพื้นขอบถ้าสัดส่วนไม่ตรง)
   */
  mode?: 'cover' | 'contain';
  maxEdge?: number;
  background?: string;
}

const PURPOSE_DEFAULTS: Record<
  ImageFitPurpose,
  { aspectRatio: number; mode: 'cover' | 'contain'; maxEdge: number; background: string }
> = {
  // หน้าปก: เห็นครบทั้งภาพ (เหมาะกับโปสเตอร์/คอลลาจที่มีข้อความ)
  hero: { aspectRatio: 16 / 10, mode: 'contain', maxEdge: 1600, background: '#1a120c' },
  about: { aspectRatio: 16 / 10, mode: 'contain', maxEdge: 1600, background: '#1a120c' },
  // สินค้า: เติมกรอบสี่เหลี่ยมจัตุรัสให้ thumbnail สวย
  product: { aspectRatio: 1, mode: 'cover', maxEdge: 1400, background: '#efe6d6' },
};

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  mode: 'cover' | 'contain',
  background: string,
) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const scale =
    mode === 'cover'
      ? Math.max(canvasW / img.width, canvasH / img.height)
      : Math.min(canvasW / img.width, canvasH / img.height);

  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (canvasW - drawW) / 2;
  const y = (canvasH - drawH) / 2;
  ctx.drawImage(img, x, y, drawW, drawH);
}

/** แปลงไฟล์รูปเป็น JPEG data URL — จัดสัดส่วนให้พอดีกรอบอัตโนมัติ */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<{ dataUrl: string; fileName: string }> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพ');
  }

  const purpose = options.purpose ?? 'product';
  const defaults = PURPOSE_DEFAULTS[purpose];
  const mode = options.mode ?? defaults.mode;
  const maxEdge = options.maxEdge ?? defaults.maxEdge;
  const background = options.background ?? defaults.background;
  const aspectRatio = defaults.aspectRatio;

  const original = await fileToDataUrl(file);

  try {
    const img = await loadImage(original);

    let canvasW: number;
    let canvasH: number;
    if (aspectRatio >= 1) {
      canvasW = maxEdge;
      canvasH = Math.max(1, Math.round(maxEdge / aspectRatio));
    } else {
      canvasH = maxEdge;
      canvasW = Math.max(1, Math.round(maxEdge * aspectRatio));
    }

    // ถ้ารูปต้นทางเล็กมาก ไม่ขยายเกินความละเอียดเดิมมากนัก
    const sourceEdge = Math.max(img.width, img.height);
    if (sourceEdge < maxEdge) {
      const shrink = sourceEdge / maxEdge;
      canvasW = Math.max(1, Math.round(canvasW * shrink));
      canvasH = Math.max(1, Math.round(canvasH * shrink));
      // คงสัดส่วนเป้าหมาย
      if (aspectRatio >= 1) {
        canvasH = Math.max(1, Math.round(canvasW / aspectRatio));
      } else {
        canvasW = Math.max(1, Math.round(canvasH * aspectRatio));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ไม่สามารถประมวลผลรูปได้');

    drawFittedImage(ctx, img, canvasW, canvasH, mode, background);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return { dataUrl, fileName: `${base}.jpg` };
  } catch {
    if (original.length > 1_400_000) {
      throw new Error('รูปใหญ่เกินไปหรืออ่านไม่ได้ — ลองถ่ายใหม่หรือเลือกรูป JPEG/PNG');
    }
    return { dataUrl: original, fileName: file.name || 'photo.jpg' };
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, value);
    } catch {
      throw new Error('พื้นที่เก็บในเครื่องเต็ม — ลองเลือกรูปที่เล็กกว่า หรือกดล้างแบบร่างก่อน');
    }
  }
}
