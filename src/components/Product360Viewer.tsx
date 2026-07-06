import { useCallback, useMemo, useState } from 'react';
import type { Product } from '../data/products';
import { buildSinglePannellumConfig } from '../lib/pannellum';
import { PannellumPanorama } from './PannellumPanorama';

interface Product360ViewerProps {
  product: Product;
}

export function Product360Viewer({ product }: Product360ViewerProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const config = useMemo(
    () =>
      buildSinglePannellumConfig({
        panorama: product.panorama360!,
        pitch: product.panoramaPitch ?? -5,
        yaw: product.panoramaYaw ?? 0,
        hfov: product.panoramaHfov ?? 85,
      }),
    [product],
  );

  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  if (!product.panorama360) return null;

  if (failed) {
    return (
      <div className="product-360 product-360--fallback">
        <p>ไม่สามารถโหลดมุมมอง 360° ได้ — ดูรูปภาพแทน</p>
      </div>
    );
  }

  return (
    <div className="product-360">
      <div className="product-360__viewer">
        <PannellumPanorama
          config={config}
          onReady={handleReady}
          onError={handleError}
          className="product-360__mount"
        />
        {!ready && (
          <div className="product-360__loading">
            <span className="product-360__loading-icon">🔄</span>
            <p>กำลังโหลด 360°...</p>
          </div>
        )}
        <div className="product-360__badge">360°</div>
      </div>
      <p className="product-360__hint">ลากนิ้วหรือเมาส์เพื่อหมุนดูรอบตัวสินค้า</p>
    </div>
  );
}
