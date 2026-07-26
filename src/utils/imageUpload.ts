/** บีบอัดรูปจากกล้องมือถือให้เล็กพอเก็บแบบร่างและอัปโหลดได้ */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

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

/** แปลงไฟล์รูปเป็น JPEG data URL ขนาดเล็กลง */
export async function compressImageFile(file: File): Promise<{ dataUrl: string; fileName: string }> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพ');
  }

  const original = await fileToDataUrl(file);

  // บางเครื่องอ่าน HEIC ไม่ได้ — ใช้ต้นฉบับถ้าวาดบน canvas ไม่ได้
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ไม่สามารถประมวลผลรูปได้');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return { dataUrl, fileName: `${base}.jpg` };
  } catch {
    return { dataUrl: original, fileName: file.name || 'photo.jpg' };
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ล้าง key เดิมแล้วลองใหม่
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, value);
    } catch {
      throw new Error('พื้นที่เก็บในเครื่องเต็ม — ลองเลือกรูปที่เล็กกว่า หรือกดล้างแบบร่างก่อน');
    }
  }
}
