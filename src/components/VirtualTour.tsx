import { useEffect, useRef, useState } from 'react';
import { TOUR_CONFIG, type TourScene } from '../data/tour';
import 'pannellum/build/pannellum.css';

function buildPannellumConfig() {
  const scenes: Record<string, Record<string, unknown>> = {};

  for (const scene of TOUR_CONFIG.scenes) {
    scenes[scene.id] = {
      title: scene.title,
      type: 'equirectangular',
      panorama: scene.panorama,
      pitch: scene.pitch,
      yaw: scene.yaw,
      hfov: scene.hfov,
      haov: scene.haov,
      vaov: scene.vaov,
      hotSpots: scene.hotSpots.map((spot) => ({
        pitch: spot.pitch,
        yaw: spot.yaw,
        type: 'scene',
        text: spot.text,
        sceneId: spot.sceneId,
      })),
    };
  }

  return {
    default: {
      firstScene: TOUR_CONFIG.firstScene,
      sceneFadeDuration: TOUR_CONFIG.sceneFadeDuration,
      autoLoad: true,
      showControls: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      compass: false,
      mouseZoom: true,
      draggable: true,
      keyboardZoom: true,
      hfov: 95,
      minHfov: 50,
      maxHfov: 120,
    },
    scenes,
  };
}

export function VirtualTour() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [activeScene, setActiveScene] = useState<TourScene>(TOUR_CONFIG.scenes[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await import('pannellum/build/pannellum.js');
      if (cancelled || !containerRef.current || !window.pannellum) return;

      viewerRef.current?.destroy();
      viewerRef.current = window.pannellum.viewer(containerRef.current, buildPannellumConfig());

      const viewer = viewerRef.current;
      const onSceneChange = (sceneId?: string) => {
        const id = sceneId ?? viewer.getScene();
        const scene = TOUR_CONFIG.scenes.find((s) => s.id === id);
        if (scene) setActiveScene(scene);
      };

      viewer.on('scenechange', onSceneChange);
      setReady(true);

      return () => {
        viewer.off('scenechange', onSceneChange);
      };
    }

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  const goToScene = (sceneId: string) => {
    viewerRef.current?.loadScene(sceneId);
    const scene = TOUR_CONFIG.scenes.find((s) => s.id === sceneId);
    if (scene) setActiveScene(scene);
  };

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
        <div ref={containerRef} className="virtual-tour__viewer" aria-label="ทัวร์ร้าน 360 องศา" />
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
        <div className="virtual-tour__scene-info">
          <p className="virtual-tour__scene-title">{activeScene.title}</p>
          <p className="virtual-tour__scene-sub">{activeScene.subtitle}</p>
        </div>
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
