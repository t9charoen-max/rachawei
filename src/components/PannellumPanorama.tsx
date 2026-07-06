import { memo, useEffect, useRef } from 'react';
import { TOUR_CONFIG } from '../data/tour';
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

interface PannellumPanoramaProps {
  onViewer: (viewer: PannellumViewer) => void;
  onReady: () => void;
  onSceneChange: (sceneId: string) => void;
  onError: () => void;
}

export const PannellumPanorama = memo(function PannellumPanorama({
  onViewer,
  onReady,
  onSceneChange,
  onError,
}: PannellumPanoramaProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onViewerRef = useRef(onViewer);
  const onReadyRef = useRef(onReady);
  const onSceneChangeRef = useRef(onSceneChange);
  const onErrorRef = useRef(onError);

  onViewerRef.current = onViewer;
  onReadyRef.current = onReady;
  onSceneChangeRef.current = onSceneChange;
  onErrorRef.current = onError;

  useEffect(() => {
    let viewer: PannellumViewer | null = null;
    let cancelled = false;

    async function init() {
      try {
        await import('pannellum/build/pannellum.js');
        if (cancelled || !mountRef.current) return;

        if (!window.pannellum) {
          onErrorRef.current();
          return;
        }

        viewer = window.pannellum.viewer(mountRef.current, buildPannellumConfig());
        onViewerRef.current(viewer);

        viewer.on('load', () => {
          if (!cancelled) onReadyRef.current();
        });
        viewer.on('scenechange', (sceneId) => {
          if (!cancelled) onSceneChangeRef.current(sceneId ?? viewer!.getScene());
        });
        viewer.on('error', () => {
          if (!cancelled) onErrorRef.current();
        });
      } catch {
        if (!cancelled) onErrorRef.current();
      }
    }

    init();

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, []);

  return <div ref={mountRef} className="virtual-tour__panorama-mount" />;
});
