import {
  fetchPublicJson,
  getFile,
  githubConfigured,
  putFile,
  readJsonFile,
  writeJsonFile,
} from './github.js';

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  special?: boolean;
  images: string[];
  panorama360?: string;
};

export type SiteSettings = {
  heroCover: string;
  heroCoverAlt: string;
  heroCovers: string[];
  aboutImage: string;
  aboutImageAlt: string;
  shopName: string;
  story: string;
  location: string;
  hours: string;
  phone: string;
};

const PRODUCTS_PATH = 'public/catalog/products.json';
const SITE_PATH = 'public/catalog/site.json';
const PRODUCTS_TS = 'src/data/products.ts';
const CATEGORIES = new Set(['พิเศษ', 'เก้าอี้', 'ทรงกลม', 'ทรงเหลี่ยม', 'มีฝา', 'หูจับสูง']);

export const TOOL_DEFS = [
  {
    name: 'list_products',
    description: 'แสดงรายการสินค้าแคตตาล็อกราชาหวายทั้งหมด',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_product',
    description: 'ดูรายละเอียดสินค้าตาม id',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'รหัสสินค้า เช่น "12"' } },
      additionalProperties: false,
    },
  },
  {
    name: 'upsert_product',
    description:
      'เพิ่มหรืออัปเดตสินค้าใน public/catalog/products.json แล้ว commit ขึ้น GitHub (ต้องมี GITHUB_TOKEN)',
    inputSchema: {
      type: 'object',
      required: ['id', 'name', 'description', 'category', 'images'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        category: {
          type: 'string',
          enum: ['พิเศษ', 'เก้าอี้', 'ทรงกลม', 'ทรงเหลี่ยม', 'มีฝา', 'หูจับสูง'],
        },
        special: { type: 'boolean' },
        images: {
          type: 'array',
          items: { type: 'string' },
          description: 'ชื่อไฟล์ภายใต้ public/products/ เช่น basket-13-demo.jpg',
        },
        panorama360: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'upload_product_image',
    description:
      'อัปโหลดรูปสินค้า (base64) ไปยัง public/products/ ผ่าน GitHub API แล้วอาจผูกเข้าสินค้าได้',
    inputSchema: {
      type: 'object',
      required: ['filename', 'contentBase64'],
      properties: {
        filename: {
          type: 'string',
          description: 'ชื่อไฟล์เช่น basket-13-demo.jpg (ห้ามมี path)',
        },
        contentBase64: { type: 'string', description: 'เนื้อหารูปแบบ base64 (ไม่ต้องมี data: prefix)' },
        productId: {
          type: 'string',
          description: 'ถ้าใส่ จะเพิ่มชื่อไฟล์เข้า images[] ของสินค้านั้นด้วย',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_site',
    description: 'ดูข้อมูลร้าน / ฮีโร่ / เกี่ยวกับเรา (site.json)',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'update_site',
    description: 'อัปเดตบางฟิลด์ใน public/catalog/site.json แล้ว commit ขึ้น GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        shopName: { type: 'string' },
        story: { type: 'string' },
        location: { type: 'string' },
        hours: { type: 'string' },
        phone: { type: 'string' },
        heroCover: { type: 'string' },
        heroCoverAlt: { type: 'string' },
        heroCovers: { type: 'array', items: { type: 'string' } },
        aboutImage: { type: 'string' },
        aboutImageAlt: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mcp_status',
    description: 'ตรวจสถานะ MCP / การตั้งค่า token บน Vercel',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
] as const;

function text(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

async function bumpImageVersion() {
  if (!githubConfigured()) return;
  try {
    const file = await getFile(PRODUCTS_TS);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const next = `rachawei-mcp-${stamp}`;
    const updated = file.content.replace(
      /export const PRODUCT_IMAGE_VERSION = '[^']+';/,
      `export const PRODUCT_IMAGE_VERSION = '${next}';`,
    );
    if (updated !== file.content) {
      await putFile(PRODUCTS_TS, updated, `chore(mcp): bump PRODUCT_IMAGE_VERSION to ${next}`, file.sha);
    }
  } catch {
    // optional
  }
}

export async function callTool(name: string, args: Record<string, unknown> = {}) {
  switch (name) {
    case 'mcp_status':
      return text({
        ok: true,
        server: 'rachawei-grokbot-mcp',
        githubConfigured: githubConfigured(),
        endpoints: {
          mcp: 'https://rachawei.vercel.app/mcp',
          api: 'https://rachawei.vercel.app/api/mcp',
        },
        hint: githubConfigured()
          ? 'พร้อมเขียนสินค้า/รูปผ่าน GitHub'
          : 'ตั้ง GITHUB_TOKEN + MCP_API_TOKEN ใน Vercel Environment Variables',
      });

    case 'list_products': {
      const products = githubConfigured()
        ? (await readJsonFile<CatalogProduct[]>(PRODUCTS_PATH)).data
        : await fetchPublicJson<CatalogProduct[]>(PRODUCTS_PATH);
      return text(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          images: p.images?.length || 0,
          special: Boolean(p.special),
        })),
      );
    }

    case 'get_product': {
      const id = String(args.id || '');
      const products = githubConfigured()
        ? (await readJsonFile<CatalogProduct[]>(PRODUCTS_PATH)).data
        : await fetchPublicJson<CatalogProduct[]>(PRODUCTS_PATH);
      const product = products.find((p) => p.id === id);
      if (!product) throw new Error(`ไม่พบสินค้า id=${id}`);
      return text(product);
    }

    case 'upsert_product': {
      if (!githubConfigured()) throw new Error('ต้องตั้ง GITHUB_TOKEN ก่อน upsert_product');
      const id = String(args.id || '');
      const category = String(args.category || '');
      if (!CATEGORIES.has(category)) throw new Error(`หมวดไม่รองรับ: ${category}`);
      const images = Array.isArray(args.images) ? args.images.map(String) : [];
      if (!id || !args.name || !args.description || images.length === 0) {
        throw new Error('ต้องมี id, name, description, images');
      }
      const product: CatalogProduct = {
        id,
        name: String(args.name),
        description: String(args.description),
        category,
        images,
      };
      if (typeof args.special === 'boolean') product.special = args.special;
      if (args.panorama360) product.panorama360 = String(args.panorama360);

      const { data, sha } = await readJsonFile<CatalogProduct[]>(PRODUCTS_PATH);
      const idx = data.findIndex((p) => p.id === id);
      if (idx >= 0) data[idx] = { ...data[idx], ...product };
      else data.unshift(product);
      await writeJsonFile(PRODUCTS_PATH, data, `feat(mcp): upsert product #${id} ${product.name}`, sha);
      await bumpImageVersion();
      return text({ ok: true, action: idx >= 0 ? 'updated' : 'created', product });
    }

    case 'upload_product_image': {
      if (!githubConfigured()) throw new Error('ต้องตั้ง GITHUB_TOKEN ก่อน upload_product_image');
      const filename = pathBasename(String(args.filename || ''));
      if (!filename || filename.includes('..')) throw new Error('filename ไม่ถูกต้อง');
      let b64 = String(args.contentBase64 || '');
      const dataUrl = b64.match(/^data:[^;]+;base64,(.+)$/);
      if (dataUrl) b64 = dataUrl[1];
      if (!b64) throw new Error('contentBase64 ว่าง');
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 32) throw new Error('ไฟล์รูปสั้นเกินไป');
      if (buf.length > 8 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 8MB');

      const dest = `public/products/${filename}`;
      let sha: string | undefined;
      try {
        sha = (await getFile(dest)).sha;
      } catch {
        sha = undefined;
      }
      await putFile(dest, buf, `feat(mcp): upload product image ${filename}`, sha);

      let productUpdate: unknown = null;
      const productId = args.productId ? String(args.productId) : '';
      if (productId) {
        const { data, sha: psha } = await readJsonFile<CatalogProduct[]>(PRODUCTS_PATH);
        const idx = data.findIndex((p) => p.id === productId);
        if (idx < 0) throw new Error(`อัปโหลดรูปแล้ว แต่ไม่พบสินค้า id=${productId}`);
        const images = Array.isArray(data[idx].images) ? [...data[idx].images] : [];
        if (!images.includes(filename)) images.push(filename);
        data[idx] = { ...data[idx], images };
        await writeJsonFile(PRODUCTS_PATH, data, `feat(mcp): attach ${filename} to product #${productId}`, psha);
        productUpdate = data[idx];
      }
      await bumpImageVersion();
      return text({ ok: true, path: dest, bytes: buf.length, product: productUpdate });
    }

    case 'get_site': {
      const site = githubConfigured()
        ? (await readJsonFile<SiteSettings>(SITE_PATH)).data
        : await fetchPublicJson<SiteSettings>(SITE_PATH);
      return text(site);
    }

    case 'update_site': {
      if (!githubConfigured()) throw new Error('ต้องตั้ง GITHUB_TOKEN ก่อน update_site');
      const { data, sha } = await readJsonFile<SiteSettings>(SITE_PATH);
      const next = { ...data };
      for (const key of Object.keys(args)) {
        if (key in next) (next as Record<string, unknown>)[key] = args[key];
      }
      await writeJsonFile(SITE_PATH, next, 'feat(mcp): update site settings', sha);
      await bumpImageVersion();
      return text({ ok: true, site: next });
    }

    default:
      throw new Error(`ไม่รู้จักเครื่องมือ: ${name}`);
  }
}

function pathBasename(name: string) {
  return name.split(/[/\\]/).pop() || '';
}
