import type { MaterialProduct } from '@/types/material';

type ColorProfile = { r: number; g: number; b: number; brightness: number };

const CATEGORY_HINTS: Record<string, { keywords: string[]; colors: ColorProfile[] }> = {
  'ปูนและคอนกรีต': {
    keywords: ['ปูน', 'cement', 'concrete', 'sand', 'ทราย'],
    colors: [{ r: 160, g: 150, b: 140, brightness: 0.55 }],
  },
  'เหล็กโครงสร้าง': {
    keywords: ['เหล็ก', 'steel', 'iron', 'rebar'],
    colors: [{ r: 120, g: 120, b: 125, brightness: 0.45 }],
  },
  'ไม้แบบและไม้แปรรูป': {
    keywords: ['ไม้', 'wood', 'timber'],
    colors: [{ r: 180, g: 140, b: 90, brightness: 0.5 }],
  },
  'หลังคาและผนัง': {
    keywords: ['หลังคา', 'roof', 'sheet', 'metal'],
    colors: [{ r: 60, g: 100, b: 180, brightness: 0.4 }],
  },
  'สีและเคมีภัณฑ์': {
    keywords: ['สี', 'paint', 'primer', 'กาว'],
    colors: [{ r: 200, g: 200, b: 210, brightness: 0.7 }],
  },
  'ระบบประปา': {
    keywords: ['ท่อ', 'pipe', 'pvc', 'ประปา'],
    colors: [{ r: 220, g: 230, b: 240, brightness: 0.85 }],
  },
  'ระบบไฟฟ้า': {
    keywords: ['สาย', 'wire', 'electric', 'ไฟ'],
    colors: [{ r: 200, g: 180, b: 50, brightness: 0.6 }],
  },
  'เครื่องมือช่าง': {
    keywords: ['เครื่องมือ', 'tool', 'hammer'],
    colors: [{ r: 100, g: 100, b: 100, brightness: 0.35 }],
  },
};

function analyzeCanvasColors(ctx: CanvasRenderingContext2D, w: number, h: number): ColorProfile {
  const data = ctx.getImageData(0, 0, w, h).data;
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  const step = 4;
  for (let i = 0; i < data.length; i += step * 20) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  const brightness = (r + g + b) / (3 * 255);
  return { r, g, b, brightness };
}

function colorDistance(a: ColorProfile, b: ColorProfile) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function scoreProduct(
  product: MaterialProduct,
  profile: ColorProfile,
  fileName: string,
): number {
  const hint = CATEGORY_HINTS[product.category];
  if (!hint) return 0;

  let score = 0;
  const lower = fileName.toLowerCase();
  for (const kw of hint.keywords) {
    if (lower.includes(kw) || product.name.includes(kw)) score += 40;
  }

  for (const ref of hint.colors) {
    const dist = colorDistance(profile, ref);
    score += Math.max(0, 60 - dist / 3);
  }

  if (product.category in CATEGORY_HINTS) score += 10;
  return score;
}

export async function analyzeImageForProducts(
  file: File,
  products: MaterialProduct[],
): Promise<{ matches: MaterialProduct[]; confidence: 'high' | 'medium' | 'low' }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { matches: products.slice(0, 3), confidence: 'low' };

  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();

  const profile = analyzeCanvasColors(ctx, size, size);
  const scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, profile, file.name) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5).map((s) => s.product);
  const topScore = scored[0]?.score ?? 0;
  const confidence = topScore > 50 ? 'high' : topScore > 25 ? 'medium' : 'low';

  return { matches: top.length ? top : products.slice(0, 3), confidence };
}
