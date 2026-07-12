const thbFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(price: number) {
  return thbFormatter.format(price);
}

export function formatStock(stock: number, unit: string) {
  if (stock === 0) return 'สินค้าหมด';
  return `คงเหลือ ${stock.toLocaleString('th-TH')} ${unit}`;
}

export function stockBadgeVariant(stock: number): 'destructive' | 'outline' | 'secondary' {
  if (stock === 0) return 'destructive';
  if (stock < 5) return 'outline';
  return 'secondary';
}

export function stockBadgeLabel(stock: number) {
  if (stock === 0) return 'หมด';
  if (stock < 5) return 'เหลือน้อย';
  return 'พร้อมส่ง';
}
