import type { MaterialProduct } from '@/types/material';

export type ProjectItem = {
  product_id: string;
  quantity: number;
};

export type MaterialProject = {
  id: string;
  name: string;
  description?: string;
  items: ProjectItem[];
  created_at: string;
};

const STORAGE_KEY = 'rachawatsadu-projects';

export const PROJECT_TEMPLATES: Omit<MaterialProject, 'id' | 'created_at'>[] = [
  {
    name: 'บ้านเดี่ยว 1 ชั้น',
    description: 'วัสดุพื้นฐานสำหรับบ้านขนาดเล็ก',
    items: [
      { product_id: 'cement-tiger', quantity: 50 },
      { product_id: 'steel-db16', quantity: 20 },
      { product_id: 'wood-formwork', quantity: 30 },
      { product_id: 'construction-sand', quantity: 40 },
    ],
  },
  {
    name: 'ต่อเติมหลังคา',
    description: 'เมทัลชีท + เหล็กโครงหลังคา',
    items: [
      { product_id: 'metal-roof-sheet', quantity: 25 },
      { product_id: 'steel-db16', quantity: 10 },
      { product_id: 'primer-paint', quantity: 2 },
    ],
  },
  {
    name: 'ปรับปรุงห้องน้ำ',
    description: 'ท่อ PVC + ปูนกาวกระเบื้อง',
    items: [
      { product_id: 'pvc-pipe', quantity: 8 },
      { product_id: 'tile-adhesive', quantity: 10 },
    ],
  },
];

export function loadProjects(): MaterialProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MaterialProject[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: MaterialProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(
  name: string,
  items: ProjectItem[],
  description?: string,
): MaterialProject {
  const projects = loadProjects();
  const project: MaterialProject = {
    id: `proj-${Date.now()}`,
    name,
    description,
    items,
    created_at: new Date().toISOString(),
  };
  saveProjects([project, ...projects]);
  return project;
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}

export function resolveProjectItems(
  project: MaterialProject | (typeof PROJECT_TEMPLATES)[number],
  products: MaterialProduct[],
) {
  return project.items
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return null;
      return { product, quantity: item.quantity };
    })
    .filter(Boolean) as { product: MaterialProduct; quantity: number }[];
}

export function projectTotal(
  project: MaterialProject | (typeof PROJECT_TEMPLATES)[number],
  products: MaterialProduct[],
) {
  return resolveProjectItems(project, products).reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0,
  );
}
