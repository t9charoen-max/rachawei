import type { MaterialProduct } from '@/types/material';
import { getDeliveryEta, getStockBarColor, getStockLevel } from '@/lib/materials/delivery';

type Props = {
  product: MaterialProduct;
  compact?: boolean;
};

export function StockIndicator({ product, compact }: Props) {
  const level = getStockLevel(product);
  const barColor = getStockBarColor(product);
  const eta = getDeliveryEta(product);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">สต็อก {product.stock.toLocaleString('th-TH')}</span>
          <span
            className={
              product.stock_status === 'พร้อมส่ง' ? 'font-medium text-green-600' : 'text-amber-600'
            }
          >
            {eta}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${level}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">ความพร้อมส่ง</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            product.stock_status === 'พร้อมส่ง'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {product.stock_status}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${level}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-gray-500">
          คงเหลือ {product.stock.toLocaleString('th-TH')} {product.unit}
        </span>
        <span className="font-medium text-teal-700">🚚 {eta}</span>
      </div>
    </div>
  );
}
