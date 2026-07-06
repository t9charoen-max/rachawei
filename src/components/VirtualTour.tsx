import { useCallback, useRef, useState } from 'react';
import { TOUR_CONFIG, type TourScene } from '../data/tour';
import { PannellumPanorama } from './PannellumPanorama';

export function VirtualTour() {
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [activeScene, setActiveScene] = useState<TourScene>(TOUR_CONFIG.scenes[0]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleViewer = useCallback((viewer: PannellumViewer) => {
    viewerRef.current = viewer;
  }, []);

  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  const handleSceneChange = useCallback((sceneId: string) => {
    const scene = TOUR_CONFIG.scenes.find((s) => s.id === sceneId);
    if (scene) setActiveScene(scene);
  }, []);

  const goToScene = (sceneId: string) => {
    viewerRef.current?.loadScene(sceneId);
    const scene = TOUR_CONFIG.scenes.find((s) => s.id === sceneId);
    if (scene) setActiveScene(scene);
  };

  if (failed) {
    return (
      <section className="virtual-tour virtual-tour--fallback">
        <p className="virtual-tour__eyebrow">ชมร้านแบบ 360°</p>
        <h2 className="virtual-tour__title">เดินชมร้านเสมือนจริง</h2>
        <p className="virtual-tour__note">
          ไม่สามารถโหลดทัวร์ 360° บนอุปกรณ์นี้ได้ กรุณาใช้แผนที่ด้านบนเพื่อนำทางมาร้าน
        </p>
      </section>
    );
  }

  return (
    <section className="virtual-tour">
      <div className="virtual-tour__header">
        <div>
          <p className="virtual-tour__eyebrow">ชมร้านแบบ 360°</p>
          <h2 className="virtual-tour__title">เดินชมร้านเสมือนจริง</h2>
          <p className="virtual-tour__hint">ลากนิ้วหรือเมาส์เพื่อมองรอบ · แตะจุดสีทองเพื่อเดินไปมุมถัดไป</p>
        </div>
      </div>

      <div className="virtual-tour__viewer-wrap">
        <PannellumPanorama
          onViewer={handleViewer}
          onReady={handleReady}
          onSceneChange={handleSceneChange}
          onError={handleError}
        />
        {!ready && (
          <div className="virtual-tour__loading">
            <span className="virtual-tour__loading-icon">🔄</span>
            <p>กำลังโหลดทัวร์ 360°...</p>
          </div>
        )}
        <div className="virtual-tour__badge">
          <span className="virtual-tour__live-dot" aria-hidden />
          360°
        </div>
        {ready && (
          <div className="virtual-tour__scene-info">
            <p className="virtual-tour__scene-title">{activeScene.title}</p>
            <p className="virtual-tour__scene-sub">{activeScene.subtitle}</p>
          </div>
        )}
      </div>

      <div className="virtual-tour__nav" role="tablist" aria-label="มุมมองทัวร์">
        {TOUR_CONFIG.scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            role="tab"
            aria-selected={activeScene.id === scene.id}
            className={`virtual-tour__nav-btn ${activeScene.id === scene.id ? 'virtual-tour__nav-btn--active' : ''}`}
            onClick={() => goToScene(scene.id)}
          >
            {scene.title}
          </button>
        ))}
      </div>

      <p className="virtual-tour__note">
        สำรวจร้านจากที่บ้านก่อนมาเยี่ยม — ปลอดภัย สะดวก มั่นใจก่อนเดินทาง
      </p>
    </section>
  );
}
